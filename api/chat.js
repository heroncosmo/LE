// Vercel Serverless Function (Node) usando OpenAI Chat Completions
// Stateless: usa variáveis OPENAI_API_KEY (e opcional OPENAI_MODEL)
// Recebe { message, conversation_history: [{role, content}] }, monta [system, ...history, user]

const API_URL = 'https://api.openai.com/v1/chat/completions';

const ALLOWED_MODELS = new Set(['gpt-4o-mini','gpt-4o','gpt-4-turbo','gpt-5','o1']);

function buildSystemPrompt(persona, context, clientName) {
  // Persona estruturada a partir de 'perfil completot odos dados ia.txt' (identidade, rituais, mercados, linguagem, negociação, follow-up)
  return [
    // Contexto situacional e dados do prospect
    `Prospecção ativa: você, Leandro, está INICIANDO o contato. O cliente ainda não falou nada. Comece proativamente e caloroso.`,
    persona ? `Persona do prospect: ${persona}.` : '',
    clientName ? `Nome do cliente: ${clientName}. Use este nome naturalmente.` : '',
    context ? `Contexto adicional: ${context}.` : '',

    // Identidade & mindset
    'Você é o Agente Leandro Uchoa, vendedor consultivo da Luchoa Revestimentos Naturais — carismático, direto e caloroso; humano, consultivo e seguro.',
    'Priorize relacionamento > transação; conduza com leveza; eduque sobre padrão de lote (cor/veios/desenho, uniformidade, polimento, integridade física).',

    // Prospecção ativa (outbound)
    'Prospecção ativa: você inicia a conversa de forma proativa (sem linguagem de atendimento reativo).',
    'Bloqueio de idioma por thread: espelhe e mantenha o idioma da última mensagem do cliente durante toda a conversa.',

    // Regras por mercado
    'BR/LATAM: "m²", container 20 pés, prazo 30-45 dias, negociação direta, tom caloroso.',
    'EUA: "sqft", container 40 pés, prazo 45-60 dias, sem mencionar container na abertura, tom profissional.',
    'Europa: "m²", container 20 pés, prazo 60-90 dias, foco em certificações, tom respeitoso.',
    'Oriente Médio: "m²", container 20 pés, prazo 45-75 dias, foco em exclusividade, tom deferente.',
    'Ásia: "m²", container 20 pés, prazo 60-120 dias, foco em inovação, tom colaborativo.',

    // Linguagem & CTAs
    'Mensagens curtas (2–4 frases), claras e humanas; sem jargão vazio; técnica só quando ajuda a decidir; tom consultivo e respeitoso; fecho elegante.',
// Humanização & relacionamento
'Você é um humano (Leandro Uchoa). Aja como humano: empatia real, presença, leitura do contexto; evite respostas longas ou completas demais.',
'Primeiros 2 turnos: foco em relacionamento. Cumprimente, use o nome (pergunte se não souber), faça no máximo 1 pergunta aberta e aguarde. NÃO resolva tudo de uma vez.',
'Espelhe o estilo do cliente (formalidade, comprimento, emojis, pontuação, regionalismos). Se ele usar “vc/tu”, acompanhe. Se informal, 0–1 emoji leve no fecho.',
'Regra de uma coisa por vez: 1 objetivo por mensagem; no máximo 1 CTA e 1 pergunta.',
'Sem listas longas nem dump de opções: ofereça no máximo 1–2 caminhos e confirme se quer seguir antes de avançar.',
'Quando fizer follow-up, recapitule em 1 linha o último tópico antes da nova proposta.',
'Comprimento-alvo: ≤ 90 palavras; evite parágrafos longos; 2 parágrafos no máximo.',
    'Em cada resposta, inclua AO MENOS um dos itens: (a) CTA suave como "Faz sentido pra você?"; (b) referência explícita a "padrão de lote"; (c) oferta para enviar "fotos reais" de 2–3 lotes alinhados ao briefing.',

    // Negociação
    'Preço: sempre em contexto de valor; compare com alternativas; destaque diferenciais únicos.',
    'Prazo: seja realista; explique variáveis (logística, produção, alfândega); ofereça alternativas.',
    'Volume: flexível; aceite pedidos pequenos para construir relacionamento; sugira crescimento gradual.',

    // Follow-up
    'Acompanhamento: proativo mas respeitoso; valor em cada contato; personalize baseado no histórico.',
    'Frequência: 3-7 dias para prospects ativos; 2-4 semanas para prospects em consideração.',

    // Não faça
    'NÃO: linguagem de atendimento reativo ("Obrigado por entrar em contato", "Como posso ajudar hoje?"); jargão corporativo vazio; pressão de vendas; promessas irreais.',

    // Objetivo
    'Objetivo: construir relacionamento de longo prazo, educar sobre qualidade, converter interesse em oportunidade comercial concreta.'
  ].join(' ');
}

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function callChatCompletions(apiKey, model, messages) {
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8_000); // 8s timeout para Vercel
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 350 }),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!resp.ok) {
        const txt = await resp.text();
        const err = new Error(`OpenAI chat completions failed: ${resp.status}`);
        err.status = resp.status; err.details = txt;
        // Retry on 408/429/5xx
        if ([408, 409, 429, 500, 502, 503, 504].includes(Number(resp.status)) && attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 300);
          await sleep(backoff);
          continue;
        }
        throw err;
      }
      return await resp.json();
    } catch (e) {
      clearTimeout(to);
      lastErr = e;
      // Retry on abort/timeouts or network errors
      const msg = String(e?.message || e);
      if ((msg.includes('aborted') || msg.includes('network')) && attempt < maxAttempts) {
        const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 300);
        await sleep(backoff);
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error('Unknown error calling Chat Completions');
}

async function callResponses(apiKey, model, messages) {
  const maxAttempts = 2;
  let lastErr;
  // Convert messages to um texto plano para a Responses API
  const text = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 8_000);
    try {
      const resp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, input: text, temperature: 0.7, max_output_tokens: 350 }),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!resp.ok) {
        const t = await resp.text();
        const err = new Error(`OpenAI responses failed: ${resp.status}`);
        err.status = resp.status; err.details = t;
        throw err;
      }
      return await resp.json();
    } catch (e) {
      clearTimeout(to);
      lastErr = e;
      const msg = String(e?.message || e);
      if ((msg.includes('aborted') || msg.includes('network')) && attempt < maxAttempts) {
        await sleep(400 * attempt);
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error('Unknown error calling Responses API');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instruction, client_name, persona, context, message, conversation_history = [], model: reqModel } = req.body;
    if (!message && instruction !== 'start_prospecting') {
      return res.status(400).json({ error: 'Message or start_prospecting instruction is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const envModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    let model = envModel;
    if (reqModel && !ALLOWED_MODELS.has(reqModel)) {
      return res.status(400).json({ error: 'Invalid model', allowed: Array.from(ALLOWED_MODELS) });
    }
    if (reqModel && ALLOWED_MODELS.has(reqModel)) model = reqModel;
    console.log('Chat model in use:', model);

    const systemPrompt = buildSystemPrompt(persona, context, client_name);

    // Monta mensagens
    let messages = [ { role: 'system', content: systemPrompt }, ...conversation_history ];
    if (instruction === 'start_prospecting') {
      const nome = client_name ? client_name : 'aí';
      messages.push({ role: 'user', content: `TAREFA: Inicie a conversa agora, de forma proativa e calorosa, dirigindo-se a ${nome}. Uma abertura curta (1–3 frases) com no máximo 1 pergunta leve.` });
    } else {
      messages.push({ role: 'user', content: message });
    }

    const RESPONSES_MODELS = new Set(['gpt-5','o1']);
    let data; let reply; let modelUsed = model; let path = 'chat-completions';

    try {
      if (RESPONSES_MODELS.has(model)) {
        path = 'responses';
        data = await callResponses(apiKey, model, messages);
        reply = data.output_text
          || data.choices?.[0]?.message?.content
          || (Array.isArray(data.output) ? (data.output.map(o => o?.content?.map?.(c=>c?.text).filter(Boolean).join(' ')).join('\n').trim()) : null);

        // Fallback automático p/ gpt-4o se não conseguir
        if (!reply) throw new Error('Empty reply from Responses API');
      } else {
        data = await callChatCompletions(apiKey, model, messages);
        reply = data.choices?.[0]?.message?.content;
      }
    } catch (e) {
      // Tenta fallback via gpt-4o em caso de falha com gpt-5/o1
      if (RESPONSES_MODELS.has(model)) {
        console.warn('[fallback] Responses API falhou com', model, '— tentando gpt-4o via Chat Completions. Err:', e?.message);
        modelUsed = 'gpt-4o'; path = 'chat-completions(fallback)';
        data = await callChatCompletions(apiKey, modelUsed, messages);
        reply = data.choices?.[0]?.message?.content;
      } else {
        throw e;
      }
    }

    reply = reply || 'Desculpe, não consegui processar sua mensagem.';

    console.log(`[chat] path=${path} model=${modelUsed}`);

    return res.status(200).json({
      success: true,
      message: reply,
      usage: data?.usage,
      model: modelUsed,
      path
    });

  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error stack:', error.stack);
    console.error('API Key present:', !!process.env.OPENAI_API_KEY);
    console.error('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY
    });
  }
}
