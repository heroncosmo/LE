const API_BASE = ''; // usar mesma origem no Vercel; /chat será reescrito para /api/chat via vercel.json
const els = {
  profile: document.querySelector('#profile-screen'),
  persona: document.querySelector('#persona'),
  context: document.querySelector('#context'),
  model: document.querySelector('#model'),
  start: document.querySelector('#start'),
  chat: document.querySelector('#chat-screen'),
  messages: document.querySelector('#messages'),
  input: document.querySelector('#msgInput'),
  send: document.querySelector('#sendBtn'),
  followUp: document.querySelector('#followUpBtn'),
  modelBadge: document.querySelector('#modelBadge'),
};

let threadId = null;
let history = [];
let selectedModel = ''; // [{role:'user'|'assistant', content:string}] mantido no cliente e enviado a cada chamada
// Contexto padrão por persona para auto-preenchimento
const DEFAULT_CONTEXTS = {
  'Arquiteto BR': 'Primeiro contato; especifica residenciais de alto padrão; prefere materiais claros e uniformes; prazos curtos.',
  'Marmorista BR': 'Atendo obras residenciais em SP; busco materiais com bom giro e padrão exportação; volumes modestos; foco em confiabilidade.',
  'Distribuidor US': 'US distributor; first contact; prefers local resellers; small volumes; uniformity matters; pricing by sqft; no container upfront.',
  'Distribuidor LATAM': 'Distribuidor LATAM (BR); mercado sensível a preço; busca padrão exportação quando faz sentido; volumes moderados.',
  'Distribuidor Europa': 'Distribuidor Europa (via Itália); volumes menores; prefere via Itália; foco em regularidade e acabamento premium.',
  'Distribuidor Oriente Médio': 'Distribuidor Oriente Médio; logística sensível; confiabilidade de lote e prazos realistas; acabamento premium.',
  'Marmorista US/Europa': 'Marmorista em US/Europa; prefere comprar de distribuidor local; avalia uniformidade e lead time; projetos residenciais.'
};

function autofillContext(){
  const persona = els.persona.value;
  const preset = DEFAULT_CONTEXTS[persona] || '';
  els.context.value = preset;
}

function splitIntoChunks(text){
  if(!text) return [];
  let parts = text.split('\n\n').map(s=>s.trim()).filter(Boolean);
  if(parts.length <= 1){
    parts = text.split('\n').map(s=>s.trim()).filter(Boolean);
  }
  if(parts.length <= 1){
    parts = text.split(/(?<=[\.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  }
  return parts.length ? parts : [text];
}

function ensureIndicators(text){
  const hay = (text||'').toLowerCase();
  const indicators = ['faz sentido', 'fotos reais', 'foto real', 'padrao de lote', 'padrao do lote', 'posso te mandar', 'posso te enviar', 'te mando', 'te envio'];
  const en = ['does it make sense', 'real photos', 'real photo', 'lot pattern', 'can i send you', 'i can send you', 'shall i send'];
  const hit = indicators.some(k=>hay.includes(k)) || en.some(k=>hay.includes(k));
  if(hit) return text;
  // fallback CTA curto e natural
  return text + '\n\nFaz sentido pra voce? Posso te mandar 2-3 lotes com fotos reais agora.';
}

async function displayAssistantProgressive(fullText){
  const ensure = ensureIndicators(fullText);
  const chunks = splitIntoChunks(ensure);
  for(const chunk of chunks){
    appendMessage('assistant', chunk);
    const delay = 800 + Math.floor(Math.random()*700); // 800-1500ms
    await new Promise(r => setTimeout(r, delay));
  }
}

function appendMessage(role, text){
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.dataset.testid = role === 'assistant' ? 'assistant-message' : 'user-message';
  div.textContent = text;
function updateModelBadge(requested, actual, path){
  if(!els.modelBadge) return;
  const different = requested && actual && requested !== actual;
  const text = different ? `${requested} → ${actual}` : (actual || requested || 'padrão');
  els.modelBadge.textContent = text;
  els.modelBadge.title = path ? `Endpoint: ${path} | Requested: ${requested || 'n/a'} | Used: ${actual || 'n/a'}` : `Modelo: ${text}`;
}

  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
}

async function callChat(message){
  const trimmed = history.length > 16 ? history.slice(-16) : history;
  const payload = { message, conversation_history: trimmed };
  if (selectedModel) payload.model = selectedModel;
  if (threadId) payload.thread_id = threadId;
  const res = await fetch(API_BASE + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Erro ao chamar /chat: ${res.status}`);
  }
  return await res.json();
}

async function startConversation(){
  const persona = els.persona.value;
  const context = els.context.value;
  selectedModel = (els.model && els.model.value) ? els.model.value : '';
  const profileMsg = `[Perfil] ${persona} · ${context}`;

  if (els.modelBadge) {
    els.modelBadge.textContent = selectedModel || 'padrão';
    els.modelBadge.title = selectedModel ? `Modelo: ${selectedModel}` : 'Modelo padrão (fallback do servidor)';
  }

  els.profile.classList.add('hidden');
  els.chat.classList.remove('hidden');

  appendMessage('user', profileMsg);
  history.push({ role: 'user', content: profileMsg });

  try {
    const data = await callChat(profileMsg);
    updateModelBadge(selectedModel, data.model, data.path);
    if (selectedModel && data.model && selectedModel !== data.model) {
      appendMessage('assistant', `[Aviso] Modelo ${selectedModel} indisponvel agora; usando ${data.model}.`);
    }
    if (data.success && data.message) {
      history.push({ role: 'assistant', content: data.message });
      await displayAssistantProgressive(data.message);
    } else {
      appendMessage('assistant', 'Falha ao iniciar a conversa: ' + (data.error || 'Erro desconhecido'));
    }
  } catch (error) {
    appendMessage('assistant', 'Falha ao iniciar a conversa: ' + error.message);
  }
}

async function sendMessage(){
  const text = els.input.value.trim();
  if (!text) return;

  els.input.value = '';
  appendMessage('user', text);
  history.push({ role: 'user', content: text });

  try {
    const data = await callChat(text);
    updateModelBadge(selectedModel, data.model, data.path);
    if (selectedModel && data.model && selectedModel !== data.model) {
      appendMessage('assistant', `[Aviso] Modelo ${selectedModel} indisponvel agora; usando ${data.model}.`);
    }
    if (data.success && data.message) {
      history.push({ role: 'assistant', content: data.message });
      await displayAssistantProgressive(data.message);
    } else {
      appendMessage('assistant', 'Erro: ' + (data.error || 'Resposta inválida'));
    }
  } catch (error) {
    appendMessage('assistant', 'Erro: ' + error.message);
  }
}

async function sendFollowUp(){
  const followUpMsg = '[Follow-up] Solicitar acompanhamento contextual';
  appendMessage('user', followUpMsg);
  history.push({ role: 'user', content: followUpMsg });

  try {
    const data = await callChat(followUpMsg);
    updateModelBadge(selectedModel, data.model, data.path);
    if (selectedModel && data.model && selectedModel !== data.model) {
      appendMessage('assistant', `[Aviso] Modelo ${selectedModel} indisponvel agora; usando ${data.model}.`);
    }
    if (data.success && data.message) {
      history.push({ role: 'assistant', content: data.message });
      await displayAssistantProgressive(data.message);
    } else {
      appendMessage('assistant', 'Erro no follow-up: ' + (data.error || 'Resposta inválida'));
    }
  } catch (error) {
    appendMessage('assistant', 'Erro no follow-up: ' + error.message);
  }
}

// Event listeners
els.persona.addEventListener('change', autofillContext);
els.start.addEventListener('click', startConversation);
els.send.addEventListener('click', sendMessage);
els.followUp.addEventListener('click', sendFollowUp);
els.input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Auto-preencher contexto na inicialização
autofillContext();
