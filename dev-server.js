// Minimal local dev server for static files + /chat endpoint (no external deps)
// Uses Node built-in http and fetch (Node 18+). Do NOT commit by default.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = process.cwd();

function send(res, status, body, headers = {}){
  const h = { 'Content-Type': 'text/plain; charset=utf-8', ...headers };
  res.writeHead(status, h); res.end(body);
}

function serveStatic(req, res){
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath.replace(/^\/+/, ''));
  if (!filePath.startsWith(ROOT)) return send(res, 403, 'Forbidden');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return send(res, 404, 'Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const map = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    const type = map[ext] || 'application/octet-stream';
    send(res, 200, data, { 'Content-Type': type });
  });
}

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function callChatCompletions(apiKey, model, messages) {
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 350 }),
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!resp.ok) throw new Error(`OpenAI chat completions failed: ${resp.status}`);
    return await resp.json();
  } catch (e) {
    clearTimeout(to);
    throw e;
  }
}

async function callResponses(apiKey, model, messages){
  const API_URL = 'https://api.openai.com/v1/responses';
  const text = messages.map(m=>`[${m.role}] ${m.content}`).join('\n');
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 8000);
  try{
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text, temperature: 0.7, max_output_tokens: 350 }),
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!resp.ok) throw new Error(`OpenAI responses failed: ${resp.status}`);
    return await resp.json();
  } catch(e){
    clearTimeout(to);
    throw e;
  }
}

function buildSystemPrompt(persona, context, clientName) {
  return [
    `Prospecção ativa: você, Leandro, está INICIANDO o contato. O cliente ainda não falou nada. Comece proativamente e caloroso.`,
    persona ? `Persona do prospect: ${persona}.` : '',
    clientName ? `Nome do cliente: ${clientName}. Use este nome naturalmente.` : '',
    context ? `Contexto adicional: ${context}.` : '',

    // Straight Line Persuasion (Jordan Belfort)
    'Linha Reta: mantenha um caminho claro. A cada mensagem, avance APENAS um passo: (1) rapport → (2) entender contexto → (3) qualificar necessidade → (4) micro-compromisso.',
    'Primeiros 3–5 turnos do assistente: EXCLUSIVAMENTE relacionamento (conhecer o cliente, entender, criar confiança). Sem oferta, preço, catálogo ou “fotos reais”.',
    'Rapport + autoridade com carisma: conexão genuína + expertise em frases curtas, sem arrogância; use humor leve e metáforas simples quando couber.',
    'Uma coisa por vez: no máx. 1 pergunta aberta e 1 CTA leve por mensagem. Evite listas longas e “dump” de informações.',
    'Escuta ativa: parafraseie em 1 linha algo que o cliente disse antes de avançar; confirme entendimento.',

    // Regras gerais
    'Mensagens curtas (2–4 frases); sem jargão vazio; técnica só quando ajuda a decidir; tom consultivo e respeitoso; fecho elegante.',
    'Espelhe o estilo do cliente (formalidade, comprimento, emojis, regionalismos). Se usar “vc/tu”, acompanhe. Se informal, 0–1 emoji leve no fecho.',
    'Comprimento-alvo: ≤ 90 palavras; no máx. 2 parágrafos.',
  ].filter(Boolean).join(' ');
}

async function handleChat(req, res, body){
  const { instruction, client_name, persona, context, message, conversation_history = [], model: reqModel } = body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return send(res, 500, JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { 'Content-Type':'application/json' });
  const ALLOWED_MODELS = new Set(['gpt-4o-mini','gpt-4o','gpt-4-turbo','gpt-5','o1']);
  let model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (reqModel && ALLOWED_MODELS.has(reqModel)) model = reqModel;

  const systemPrompt = buildSystemPrompt(persona, context, client_name);
  let messages = [ { role:'system', content: systemPrompt }, ...conversation_history ];
  if (instruction === 'start_prospecting'){
    const nome = client_name ? client_name : 'aí';
    messages.push({ role:'user', content: `TAREFA: Inicie a conversa agora, de forma proativa e calorosa, dirigindo-se a ${nome}. Abertura curta (1–3 frases) com no máximo 1 pergunta leve.` });
  } else if (message){
    messages.push({ role:'user', content: message });
  } else {
    return send(res, 400, JSON.stringify({ error:'Message or start_prospecting required' }), { 'Content-Type':'application/json' });
  }

  const RESPONSES_MODELS = new Set(['gpt-5','o1']);
  let data; let reply; let modelUsed = model; let path = 'chat-completions';
  try{
    if (RESPONSES_MODELS.has(model)){
      path = 'responses';
      data = await callResponses(apiKey, model, messages);
      reply = data.output_text
        || data.choices?.[0]?.message?.content
        || (Array.isArray(data.output) ? (data.output.map(o => o?.content?.map?.(c=>c?.text).filter(Boolean).join(' ')).join('\n').trim()) : null);
      if (!reply) throw new Error('Empty reply');
    } else {
      data = await callChatCompletions(apiKey, model, messages);
      reply = data.choices?.[0]?.message?.content;
    }
  } catch(e){
    if (RESPONSES_MODELS.has(model)){
      modelUsed = 'gpt-4o'; path = 'chat-completions(fallback)';
      data = await callChatCompletions(apiKey, modelUsed, messages);
      reply = data.choices?.[0]?.message?.content;
    } else {
      return send(res, 500, JSON.stringify({ error:'OpenAI call failed', details: e.message }), { 'Content-Type':'application/json' });
    }
  }

  return send(res, 200, JSON.stringify({ success:true, message: reply || 'Desculpe, não consegui processar sua mensagem.', model: modelUsed, path }), { 'Content-Type':'application/json' });
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  if (req.method === 'POST' && (urlPath === '/chat' || urlPath === '/api/chat')){
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try{
        const json = body ? JSON.parse(body) : {};
        await handleChat(req, res, json);
      } catch(e){
        send(res, 400, JSON.stringify({ error:'Invalid JSON', details: e.message }), { 'Content-Type':'application/json' });
      }
    });
    return;
  }
  if (req.method === 'GET') return serveStatic(req, res);
  return send(res, 405, 'Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Dev server listening on http://localhost:${PORT}`);
});

