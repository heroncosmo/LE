/* Frontend logic for Agente Leandro (compat layer) */

const els = {
  persona: document.querySelector('#persona'),
  context: document.querySelector('#context'),
  clientName: document.querySelector('#clientName'),
  phone: document.querySelector('#phone'),
  model: document.querySelector('#model'),
  start: document.querySelector('#start'),
  startWhatsApp: document.querySelector('#startWhatsApp'),
  simulate: document.querySelector('#simulate'),
  chat: document.querySelector('#chat-screen') || document.querySelector('#chat'),
  profile: document.querySelector('#profile-screen') || document.querySelector('#profile'),
  messages: document.querySelector('#messages'),
  input: document.querySelector('#msgInput') || document.querySelector('#input'),
  send: document.querySelector('#sendBtn') || document.querySelector('#send'),
  back: document.querySelector('#backBtn') || document.querySelector('#back'),
  waBadge: document.querySelector('#waBadge'),
  waBadge2: document.querySelector('#waBadge2'),
  log: document.querySelector('#log'),
};

function log(...a){ if (els.log) els.log.textContent += a.map(x=> (typeof x==='string'? x: JSON.stringify(x,null,2))).join(' ') + '\n'; console.log('[ui]', ...a); }

// State
let cachedPersona = '';
let cachedContext = '';
let cachedClientName = '';
let selectedModel = '';

let isWhatsAppMode = false;
let waPhone = '';
let waPollTimer = null;
let waLastSince = 0;

function showChat(){ if(els.profile) els.profile.classList.add('hidden'); if(els.chat) els.chat.classList.remove('hidden'); }
function showProfile(){ if(els.chat) els.chat.classList.add('hidden'); if(els.profile) els.profile.classList.remove('hidden'); }
function renderWhatsAppBadge(v){ const fn = v? 'remove':'add'; if (els.waBadge) els.waBadge.classList[fn]('hidden'); if (els.waBadge2) els.waBadge2.classList[fn]('hidden'); }
function pushMessage(role, text){ const div = document.createElement('div'); div.className = 'msg ' + (role==='user'? 'user' : 'assistant'); div.textContent = text; if(els.messages){ els.messages.appendChild(div); els.messages.scrollTop = els.messages.scrollHeight; } }

async function callAPI(path, options){
  const o = Object.assign({ headers:{ 'Content-Type':'application/json' } }, options || {});
  const r = await fetch(path, o);
  const t = await r.text();
  try{ return JSON.parse(t); }catch{ return { ok:r.ok, status:r.status, text:t }; }
}

// Core: start conversation (local web)
async function startConversation(){
  cachedPersona = els.persona?.value || '';
  cachedContext = els.context?.value || '';
  cachedClientName = els.clientName ? els.clientName.value : '';
  selectedModel = (els.model && els.model.value) ? els.model.value : '';

  showChat();
  isWhatsAppMode = false;
  renderWhatsAppBadge(false);

  pushMessage('assistant', 'Comece contando um pouco do seu projeto. Em que posso ajudar?');
}

async function sendMessage(){
  const text = ((els.input && els.input.value) || '').trim();
  if (!text) return;
  els.input.value = '';
  pushMessage('user', text);

  // Echo for demo; could call /api/chat
  const payload = { persona: cachedPersona, context: cachedContext, client_name: cachedClientName, conversation_history: [{ role:'user', content:text }], model: selectedModel };
  const resp = await callAPI('/api/chat', { method:'POST', body: JSON.stringify(payload) });
  const reply = resp?.message || 'Entendi! Me conte mais.';
  pushMessage('assistant', reply);
}

// WhatsApp flow
async function startWhatsAppConversation(){
  cachedPersona = els.persona?.value || '';
  cachedContext = els.context?.value || '';
  cachedClientName = els.clientName ? els.clientName.value : '';
  selectedModel = (els.model && els.model.value) ? els.model.value : '';
  waPhone = (els.phone && els.phone.value ? els.phone.value.trim() : '');
  if (!waPhone) { alert('Informe o n\u00famero de WhatsApp no formato E.164 (ex.: +5511999998888).'); return; }

  showChat();
  isWhatsAppMode = true;
  renderWhatsAppBadge(true);

  // call start
  const payload = { phone: waPhone, persona: cachedPersona, context: cachedContext, client_name: cachedClientName, model: selectedModel };
  log('POST /api/whatsapp?op=start', payload);
  const resp = await callAPI('/api/whatsapp?op=start', { method:'POST', body: JSON.stringify(payload) });
  if (resp?.success){
    pushMessage('assistant', resp.opening || 'Iniciando conversa no WhatsApp...');
  } else {
    pushMessage('assistant', 'Falha ao iniciar conversa no WhatsApp: ' + (resp?.error || 'erro desconhecido'));
  }

  // start polling inbox
  waLastSince = Date.now();
  if (waPollTimer) clearInterval(waPollTimer);
  waPollTimer = setInterval(pollWhatsAppInbox, 2500);
}

async function pollWhatsAppInbox(){
  if (!isWhatsAppMode || !waPhone) return;
  const url = `/api/whatsapp?op=poll&phone=${encodeURIComponent(waPhone)}&since=${waLastSince}`;
  const resp = await callAPI(url);
  if (resp?.success && Array.isArray(resp.messages)){
    for (const m of resp.messages){ pushMessage(m.role||'assistant', m.text||''); waLastSince = Math.max(waLastSince, Number(m.ts||0)); }
  }
}

// Defensive event listeners + phone fallback
if (els.start) els.start.addEventListener('click', startConversation);
if (els.send) els.send.addEventListener('click', sendMessage);
if (els.input) els.input.addEventListener('keydown', (e)=>{ if (e.key==='Enter') sendMessage(); });
if (els.back) els.back.addEventListener('click', ()=>{ showProfile(); isWhatsAppMode=false; renderWhatsAppBadge(false); if (waPollTimer) { clearInterval(waPollTimer); waPollTimer=null; } });
if (els.startWhatsApp) els.startWhatsApp.addEventListener('click', startWhatsAppConversation);

// demo
if (els.simulate) els.simulate.addEventListener('click', ()=>{
  if (els.persona) els.persona.value = 'Leandro Uchoa, consultor de vendas da Luchoa Revestimentos Naturais.';
  if (els.context) els.context.value = 'Venda de revestimentos naturais (m\u00e1rmore, granito, quartzito) para projetos residenciais e comerciais.';
  if (els.clientName) els.clientName.value = 'Jo\u00e3o Silva';
  if (els.phone) els.phone.value = '+5511999998888';
  if (els.model) els.model.value = 'gpt-4o-mini';
});

// Fallback prefill for phone if HTML didn\'t ship value
if (els.phone && !els.phone.value) els.phone.value = '+5517991956944';
