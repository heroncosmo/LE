// Serverless function: simulate client responses based on persona/context/history
// Suporta Chat Completions (gpt-4o*/gpt-4-turbo) e Responses API (gpt-5/o1). Stateless.

const CHAT_API_URL = 'https://api.openai.com/v1/chat/completions';

function buildClientPrompt(persona, context, clientName, turnIndex){
  const seed = [
    `Você é um cliente ${persona || ''} chamado ${clientName || 'Cliente'}.`,
    context ? `Contexto: ${context}.` : '',
    `Turno atual: ${turnIndex}.`,
    'Responda à última mensagem do vendedor Leandro de forma NATURAL, realista e coerente com seu perfil. 1–3 frases.',
    'Varie o comportamento ao longo dos turnos:',
    ' - Turnos 1–3: receptivo, curioso; faça 1 pergunta relevante.',
    ' - Turnos 4–6: traga 1 objeção leve OU peça 1 detalhe específico.',
    ' - Turnos 7+: aceite 1 próximo passo simples OU peça tempo para decidir com elegância.',
    'Evite respostas monossilábicas como “certo/ok”.',
    'Nunca imite o papel do vendedor; você é o cliente. Mantenha o mesmo idioma do histórico.',
  ].filter(Boolean).join(' ');
  return seed;
}

async function callChatCompletions(apiKey, model, messages) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.9, max_tokens: 160 }),
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
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 8000);
  // Responses API recebe um texto único
  const input = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  try{
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input, temperature: 0.9, max_output_tokens: 160 }),
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!resp.ok) throw new Error(`OpenAI responses failed: ${resp.status}`);
    return await resp.json();
  }catch(e){
    clearTimeout(to);
    throw e;
  }
}

async function handler(req, res){
  if (req.method !== 'POST'){
    res.statusCode = 405;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    return res.end(JSON.stringify({ error:'method_not_allowed' }));
  }
  try{
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    const { persona, client_name, context, conversation_history = [], last_assistant_message, turn_index = 1, model } = req.body || {};
    let mdl = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const system = buildClientPrompt(persona, context, client_name, turn_index);
    const history = [ { role:'system', content: system }, ...conversation_history ];
    if (last_assistant_message){
      history.push({ role:'assistant', content: last_assistant_message });
    }
    history.push({ role:'user', content: 'Responda agora como cliente, 1–3 frases naturais e contextuais.' });

    const RESPONSES_MODELS = new Set(['gpt-5','o1']);
    let data, reply, path = 'chat-completions', modelUsed = mdl;
    try{
      if (RESPONSES_MODELS.has(mdl)){
        path = 'responses';
        data = await callResponses(apiKey, mdl, history);
        reply = data?.output_text
          || data?.choices?.[0]?.message?.content
          || (Array.isArray(data?.output) ? (data.output.map(o => o?.content?.map?.(c=>c?.text).filter(Boolean).join(' ')).join('\n').trim()) : null);
        if (!reply) throw new Error('Empty reply from Responses API');
      } else {
        data = await callChatCompletions(apiKey, mdl, history);
        reply = data?.choices?.[0]?.message?.content;
      }
    }catch(e){
      // Fallback automático para gpt-4o se gpt-5/o1 falharem
      if (RESPONSES_MODELS.has(mdl)){
        modelUsed = 'gpt-4o'; path = 'chat-completions(fallback)';
        data = await callChatCompletions(apiKey, modelUsed, history);
        reply = data?.choices?.[0]?.message?.content;
      } else { throw e; }
    }

    reply = (reply && reply.trim()) || 'Tudo bem. Pode me detalhar um pouco mais?';

    res.statusCode = 200;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    return res.end(JSON.stringify({ success:true, message: reply, model: modelUsed, path }));
  } catch(e){
    res.statusCode = 500;
    res.setHeader('Content-Type','application/json; charset=utf-8');
    return res.end(JSON.stringify({ error:'internal', details: String(e?.message||e) }));
  }
}

module.exports = handler;
module.exports.default = handler;
