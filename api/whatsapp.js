/*
  WhatsApp (W-API) integration endpoints
  - POST /api/whatsapp?op=start { phone, persona, context, client_name, model? }
    -> Generates opening via existing /api/chat logic and sends via W-API
  - POST /api/whatsapp?op=send { phone, text }
    -> Sends a text to the phone via W-API
  - GET  /api/whatsapp?op=poll&phone=E164&since=ts
    -> Returns [{ role: 'user'|'assistant', text, ts }]
  - GET  /api/whatsapp?op=status
    -> Checks provider status (best-effort)

  Notes
  - Reads provider config from env: WAPI_BASE_URL, WAPI_SEND_URL?, WAPI_STATUS_URL?, WAPI_INSTANCE_ID, WAPI_TOKEN
  - Stores conversation/inbox in Upstash KV if configured; falls back to in-memory (ephemeral) store
  - Retries/backoff, timeouts, and logs included
*/

const DEFAULT_TIMEOUT_MS = 8000;

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;

const WAPI_BASE_URL = process.env.WAPI_BASE_URL || '';
const WAPI_SEND_URL = process.env.WAPI_SEND_URL || '';
const WAPI_STATUS_URL = process.env.WAPI_STATUS_URL || '';
const WAPI_INSTANCE_ID = process.env.WAPI_INSTANCE_ID || process.env.WAPI_INSTANCE || '';
const WAPI_TOKEN = process.env.WAPI_TOKEN || process.env.WAPI_API_TOKEN || '';

const mem = {
  inbox: new Map(),   // key: phone -> [{ role, text, ts }]
  conv: new Map(),    // key: phone -> { meta: {persona, context, client_name, model}, history: [{role, content}]} 
};

function log(...args){
  console.log('[whatsapp]', ...args);
}

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function kvGet(key){
  if (!KV_URL || !KV_TOKEN) return null;
  try{
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${KV_TOKEN}`}});
    if(!r.ok) return null;
    const data = await r.json();
    if (data && data.result){ try{ return JSON.parse(data.result);}catch{ return data.result; } }
    return null;
  }catch{ return null; }
}
async function kvSet(key, value){
  if (!KV_URL || !KV_TOKEN) return false;
  try{
    const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, { method:'POST', headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type':'application/json' }, body: JSON.stringify(value) });
    return r.ok;
  }catch{ return false; }
}

function inboxKey(phone){ return `wa:inbox:${phone}`; }
function convKey(phone){ return `wa:conv:${phone}`; }

async function inboxPush(phone, item){
  const k = inboxKey(phone);
  const arr = (await kvGet(k)) || mem.inbox.get(phone) || [];
  arr.push(item);
  const ok = await kvSet(k, arr);
  if (!ok) mem.inbox.set(phone, arr);
}

async function loadConv(phone){
  const k = convKey(phone);
  const c = (await kvGet(k));
  if (c && c.history && c.meta) return c;
  return mem.conv.get(phone) || null;
}
async function saveConv(phone, conv){
  const k = convKey(phone);
  const ok = await kvSet(k, conv);
  if (!ok) mem.conv.set(phone, conv);
}

function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS){
  const controller = new AbortController();
  const t = setTimeout(()=>controller.abort(), ms);
  return {
    run: async (fetcher) => {
      try { const r = await fetcher(controller.signal); clearTimeout(t); return r; }
      catch(e){ clearTimeout(t); throw e; }
    }
  };
}

function isWapiApp(){
  return /(^|\.)w-api\.app/i.test(WAPI_BASE_URL || '');
}

function buildSendUrl(){
  if (WAPI_SEND_URL) return WAPI_SEND_URL;
  if (WAPI_BASE_URL && WAPI_INSTANCE_ID){
    const base = WAPI_BASE_URL.replace(/\/$/, '');
    if (isWapiApp()){
      // W-API (w-api.app) send-text endpoint
      return `${base}/message/send-text?instanceId=${encodeURIComponent(WAPI_INSTANCE_ID)}`;
    }
    if (WAPI_TOKEN){
      // Default to a Z-API like pattern
      return `${base}/instances/${encodeURIComponent(WAPI_INSTANCE_ID)}/token/${encodeURIComponent(WAPI_TOKEN)}/send-messages`;
    }
  }
  return '';
}

function buildStatusUrl(){
  if (WAPI_STATUS_URL) return WAPI_STATUS_URL;
  if (WAPI_BASE_URL && WAPI_INSTANCE_ID){
    const base = WAPI_BASE_URL.replace(/\/$/, '');
    if (isWapiApp()){
      // W-API (w-api.app) profile-name endpoint
      return `${base}/instance/profile-name?instanceId=${encodeURIComponent(WAPI_INSTANCE_ID)}`;
    }
    if (WAPI_TOKEN){
      return `${base}/instances/${encodeURIComponent(WAPI_INSTANCE_ID)}/token/${encodeURIComponent(WAPI_TOKEN)}/status`;
    }
  }
  return '';
}

async function wapiSendText(toE164, text){
  const url = buildSendUrl();
  if (!url) throw new Error('W-API send URL not configured');

  // Build headers (W-API.app uses Bearer token)
  const headers = { 'Content-Type':'application/json' };
  if (isWapiApp() && WAPI_TOKEN){
    headers['Authorization'] = `Bearer ${WAPI_TOKEN}`;
  }

  // Build body based on provider
  let body;
  if (isWapiApp()){
    // W-API.app format
    body = {
      phone: toE164.replace(/^\+/, '').replace(/[^0-9]/g, ''), // digits only
      message: text
    };
  } else {
    // Generic format (Z-API style) - be liberal with field names
    body = {
      phone: toE164.replace(/^\+/, ''),
      number: toE164,
      to: toE164,
      message: text,
      text: text
    };
  }

  const maxAttempts = 3;
  let lastErr;
  for (let attempt=1; attempt<=maxAttempts; attempt++){
    try{
      const runner = withTimeout(null, DEFAULT_TIMEOUT_MS);
      const resp = await runner.run((signal)=> fetch(url, { method:'POST', headers, body: JSON.stringify(body), signal }));
      if (!resp.ok){
        const t = await resp.text();
        const err = new Error(`W-API send failed: ${resp.status}`); err.details=t; err.status=resp.status;
        if ([408,409,429,500,502,503,504].includes(Number(resp.status)) && attempt<maxAttempts){ await sleep(400*attempt + Math.floor(Math.random()*300)); continue; }
        throw err;
      }
      return await resp.json().catch(()=>({ ok:true }));
    }catch(e){ lastErr=e; if (String(e?.message||'').includes('abort') && attempt<maxAttempts){ await sleep(300*attempt); continue; } throw e; }
  }
  throw lastErr || new Error('Unknown W-API send error');
}

async function wapiStatus(){
  const url = buildStatusUrl();
  if (!url) return { ok:false, error:'status URL not configured' };
  try{
    const runner = withTimeout(null, DEFAULT_TIMEOUT_MS);
    const headers = {};
    if (isWapiApp() && WAPI_TOKEN){ headers['Authorization'] = `Bearer ${WAPI_TOKEN}`; }
    const r = await runner.run((signal)=> fetch(url, { signal, headers }));
    const body = await r.text();
    return { ok: r.ok, status: r.status, body };
  }catch(e){ return { ok:false, error: String(e?.message||e) }; }
}

// Reuse /api/chat logic by calling the exported handler with mock req/res
const chatHandler = require('./chat');
async function generateReply(payload){
  return new Promise(async (resolve, reject)=>{
    try{
      const req = { method:'POST', body: payload };
      const res = {
        _status: 200,
        status(code){ this._status = code; return this; },
        json(obj){ if (this._status !== 200 || obj?.success === false) return reject(new Error(obj?.error || 'chat error')); return resolve(obj); }
      };
      await chatHandler(req, res);
    }catch(e){ reject(e); }
  });
}

function now(){ return Date.now(); }

module.exports = async function handler(req, res){
  try{
    const op = (req.query && (req.query.op||req.query.action)) || (req.method==='GET' && 'status');

    if (req.method === 'GET' && op === 'status'){
      const st = await wapiStatus();
      return res.status(200).json({ success:true, status: st });
    }

    if (req.method === 'POST' && op === 'start'){
      const { phone, persona, context, client_name, model } = req.body || {};
      if (!phone) return res.status(400).json({ success:false, error: 'phone is required (E.164)' });

      // prepare conversation state
      const conv = { meta: { persona: persona||'', context: context||'', client_name: client_name||'', model: model||'' }, history: [] };

      // Generate opening
      const chatPayload = { instruction:'start_prospecting', persona: conv.meta.persona, context: conv.meta.context, client_name: conv.meta.client_name, conversation_history: [], model: conv.meta.model };
      const reply = await generateReply(chatPayload);
      const opening = reply?.message || 'Ol e1! Tudo bem?';

      // persist
      conv.history.push({ role:'assistant', content: opening });
      await saveConv(phone, conv);
      await inboxPush(phone, { role:'assistant', text: opening, ts: now() });

      // send via W-API
      try{ await wapiSendText(phone, opening); }catch(e){ log('send opening failed', e?.status, e?.details || e?.message); }

      return res.status(200).json({ success:true, opening, model: reply?.model, path: reply?.path||'whatsapp' });
    }

    if (req.method === 'POST' && op === 'send'){
      const { phone, text } = req.body || {};
      if (!phone || !text) return res.status(400).json({ success:false, error:'phone and text are required' });
      await wapiSendText(phone, text);
      // push to inbox for UI mirror
      await inboxPush(phone, { role:'assistant', text, ts: now() });
      return res.status(200).json({ success:true });
    }

    if (req.method === 'GET' && op === 'poll'){
      const phone = (req.query && req.query.phone) || '';
      const since = Number((req.query && req.query.since) || 0) || 0;
      if (!phone) return res.status(400).json({ success:false, error:'phone is required' });
      const items = (await kvGet(inboxKey(phone))) || mem.inbox.get(phone) || [];
      const filtered = since ? items.filter(m=> Number(m?.ts||0) > since) : items;
      return res.status(200).json({ success:true, messages: filtered });
    }

    return res.status(405).json({ success:false, error:'Method/op not allowed' });
  }catch(e){
    log('error', e?.message, e?.stack);
    return res.status(500).json({ success:false, error: String(e?.message||e) });
  }
}

module.exports.default = module.exports;


