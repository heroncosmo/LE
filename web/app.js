const API_BASE = 'http://127.0.0.1:8080';
const els = {
  profile: document.querySelector('#profile-screen'),
  persona: document.querySelector('#persona'),
  context: document.querySelector('#context'),
  start: document.querySelector('#start'),
  chat: document.querySelector('#chat-screen'),
  messages: document.querySelector('#messages'),
  input: document.querySelector('#msgInput'),
  send: document.querySelector('#sendBtn'),
  followUp: document.querySelector('#followUpBtn'),
};

let threadId = null;
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

// Preenche ao carregar e sempre que mudar a persona
autofillContext();
els.persona.addEventListener('change', autofillContext);


function appendMessage(role, text){
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.dataset.testid = role === 'assistant' ? 'assistant-message' : 'user-message';
  div.textContent = text;
  els.messages.appendChild(div);
  els.messages.scrollTop = els.messages.scrollHeight;
}

function splitIntoChunks(text){
  if(!text) return [];
  // 1) tenta por parágrafos duplos
  let parts = text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  if(parts.length > 1) return parts;
  // 2) tenta por quebras de linha simples
  parts = text.split(/\n/).map(s=>s.trim()).filter(Boolean);
  if(parts.length > 1) return parts;
  // 3) fallback por sentenças simples
  parts = text.split(/(?<=[\.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

async function displayAssistantProgressive(fullText){
  const chunks = splitIntoChunks(fullText);
  for(const chunk of chunks){
    appendMessage('assistant', chunk);
    const delay = 800 + Math.floor(Math.random()*700); // 800-1500ms
    await new Promise(r => setTimeout(r, delay));
  }
}

async function callChat(message){
  const payload = { message };
  if (threadId) payload.thread_id = threadId;
  const res = await fetch(API_BASE + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if(!res.ok){
    throw new Error('Erro ao chamar /chat: ' + res.status);
  }
  return await res.json();
}

async function startConversation(){
  const persona = els.persona.value;
  const ctx = els.context.value.trim();
  // Compor mensagem inicial pedindo para o Leandro iniciar a conversa
  const bootstrap = (
    `Contexto do meu perfil: ${persona}. ` +
    (ctx ? `Detalhes: ${ctx}. ` : '') +
    `Por favor, como Leandro Uchoa, inicie você a conversa com uma saudação de prospecção natural conforme seu estilo (consultivo e humano). ` +
    `Respeite as regras por mercado (ex.: EUA sem falar de container antes do usuário; BR/LATAM em português; US em inglês quando apropriado).`
  );
  try{
    els.profile.classList.add('hidden');
    els.chat.classList.remove('hidden');
    appendMessage('user', `[Perfil] ${persona}${ctx? ' · '+ctx: ''}`);
    const out = await callChat(bootstrap);
    threadId = out.thread_id;
    await displayAssistantProgressive(out.assistant_message);
  }catch(err){
    appendMessage('assistant', 'Falha ao iniciar a conversa: ' + err.message);
  }
}

async function sendMessage(){
  const text = els.input.value.trim();
  if(!text) return;
  els.input.value = '';
  appendMessage('user', text);
  try{
    const out = await callChat(text);
    if(!threadId) threadId = out.thread_id;
    await displayAssistantProgressive(out.assistant_message);
  }catch(err){
    appendMessage('assistant', 'Erro: ' + err.message);
  }
}
async function sendFollowUp(){
  const marker = '[[FOLLOWUP_REQUEST]]';
  const prompt = `${marker}\n` +
    `Você é Leandro Uchoa. Faça um follow-up proativo e natural com base no HISTÓRICO COMPLETO desta thread.\n` +
    `Regras:\n` +
    `- Mantenha o MESMO idioma já usado nesta conversa (pt/en/es).\n` +
    `- Referencie pontos específicos discutidos (interesses, objeções, prazos, próximos passos).\n` +
    `- Pergunte com elegância sobre decisões/pendências e ofereça 1 próximo passo simples (ex.: enviar 2–3 lotes reais com fotos, call curta, reserva).\n` +
    `- Tom consultivo, humano, 2–4 frases; não robotizado.\n` +
    `- EUA: não abrir falando de container.\n` +
    `Contexto: siga seu estilo relacional – a venda acontece no meio do relacionamento.`;
  appendMessage('user', '[Follow-up] Solicitar acompanhamento contextual');
  try{
    const out = await callChat(prompt);
    if(!threadId) threadId = out.thread_id;
    await displayAssistantProgressive(out.assistant_message);
  }catch(err){
    appendMessage('assistant', 'Erro no follow-up: ' + err.message);
  }
}


els.start.addEventListener('click', startConversation);
els.send.addEventListener('click', sendMessage);
if (els.followUp) els.followUp.addEventListener('click', sendFollowUp);
els.input.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

