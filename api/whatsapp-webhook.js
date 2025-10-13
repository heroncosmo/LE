/*
  WhatsApp (W-API) Webhook receiver
  - POST /api/whatsapp-webhook (provider should call this URL)
    Optional verification: provide ?token=... matching WAPI_WEBHOOK_VERIFY_TOKEN

  Behavior:
  - Extract sender phone and message text from provider payload (best-effort)
  - Store into conversation and inbox
  - Generate AI reply using existing /api/chat logic and send via W-API
*/

const { URLSearchParams } = require('url');

const KV_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.KV_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
const WAPI_WEBHOOK_VERIFY_TOKEN = process.env.WAPI_WEBHOOK_VERIFY_TOKEN || '';

const mem = {
  inbox: new Map(),
  conv: new Map(),
};

function log(...args){ console.log('[wa-webhook]', ...args); }
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

function extractPhoneAndText(body){
  // Try common patterns
  const phone = body?.from || body?.phone || body?.number || body?.sender || body?.remoteJid || body?.data?.from || body?.data?.sender || '';
  const text = body?.text?.body || body?.text || body?.message?.text || body?.message?.body || body?.body || body?.message || '';
  return { phone: String(phone || '').replace(/[^0-9+]/g, ''), text: String(text || '').trim() };
}

module.exports = async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ success:false, error:'Method not allowed' });

    // optional verification token
    const q = req.query || {};
    if (WAPI_WEBHOOK_VERIFY_TOKEN){
      const token = q.token || q.verify_token || (req.headers['x-webhook-token']);
      if (!token || token !== WAPI_WEBHOOK_VERIFY_TOKEN){ return res.status(403).json({ success:false, error:'invalid token' }); }
    }

    let body = req.body;
    // Some providers send application/x-www-form-urlencoded
    if (typeof body === 'string'){
      try{ const params = new URLSearchParams(body); body = Object.fromEntries(params.entries()); }catch{}
    }

    const { phone, text } = extractPhoneAndText(body || {});
    if (!phone || !text) return res.status(200).json({ success:true, ignored:true });

    // state
    let conv = await loadConv(phone);
    if (!conv) conv = { meta:{ persona:'', context:'', client_name:'', model:'' }, history:[] };

    // store inbound
    conv.history.push({ role:'user', content: text });
    await saveConv(phone, conv);
    await inboxPush(phone, { role:'user', text, ts: now() });

    // generate reply
    const payload = { persona: conv.meta.persona, context: conv.meta.context, client_name: conv.meta.client_name, conversation_history: conv.history.slice(-16) };
    const reply = await generateReply(payload);
    const out = reply?.message || '';

    if (out){
      conv.history.push({ role:'assistant', content: out });
      await saveConv(phone, conv);
      await inboxPush(phone, { role:'assistant', text: out, ts: now() });
    }

    return res.status(200).json({ success:true });
  }catch(e){
    log('error', e?.message, e?.stack);
    return res.status(500).json({ success:false, error: String(e?.message||e) });
  }
}

module.exports.default = module.exports;

