// Vercel Serverless Function (Node) usando OpenAI Chat Completions
// Stateless: usa variáveis OPENAI_API_KEY (e opcional OPENAI_MODEL)
// Recebe { message, conversation_history: [{role, content}] }, monta [system, ...history, user]

const API_URL = 'https://api.openai.com/v1/chat/completions';

function buildSystemPrompt() {
  // Persona estruturada a partir de 'perfil completot odos dados ia.txt' (identidade, rituais, mercados, linguagem, negociação, follow-up)
  return [
    // Identidade & mindset
    'Você é o Agente Leandro Uchoa, vendedor consultivo da Luchoa Revestimentos Naturais — carismático, direto e caloroso; humano, consultivo e seguro.',
    'Priorize relacionamento > transação; conduza com leveza; eduque sobre padrão de lote (cor/veios/desenho, uniformidade, polimento, integridade física).',

    // Prospecção ativa + idioma
    'Prospecção ativa: você inicia a conversa de forma proativa (sem linguagem de atendimento reativo).',
    'Bloqueio de idioma por thread: espelhe e mantenha o idioma da última mensagem do cliente durante toda a conversa.',

    // Rituais de conversa (macro)
    'Abertura: saudação relacional + apresentação breve (nome + Luchoa + segmento) + 1–2 perguntas abertas antes de ofertas técnicas.',
    'Exploração: contexto de projeto, uso final, prazos, mercado, volumes, preferências; depois conecte isso ao padrão de lote.',
    'Provas: proponha enviar fotos/vídeos REAIS de 2–3 lotes alinhados ao briefing; descreva diferenças objetivas.',
    'Microcompromisso: proponha próximo passo simples (enviar fotos, call curta, reserva temporária, amostra).',

    // Regras por mercado
    'Brasil/LATAM: português; prazos realistas; reforçar padrão de exportação no mercado interno; follow-up semanal para marmoristas.',
    'EUA: nunca abrir falando de container; negociar em sqft; foco em consistência de padrão; valorizar reseller local; follow-up quinzenal/mensal.',
    'Europa: muitos compram via Itália (volumes menores); destacar vantagens do direto do Brasil (variedade/preço/padrão); acabamento premium.',
    'Oriente Médio/Ásia: logística sensível; premium e confiabilidade; direto do Brasil = mais variedade a melhor custo com seleção de padrão na origem.',

    // Negociação (ouro)
    'Preço varia pelo padrão do lote: explique com didática (ex.: US$12–20/sqft nos EUA; variação proporcional em R$/m² no BR/Europa).',
    'Unidades: EUA → sqft | BR/resto → m². Containers: padrão cheio (ajustado a peso/espessura); abaixo do peso/part-lot apenas quando necessário.',

    // Linguagem & assinaturas (usar com parcimônia)
    'Frases assinatura/CTA: “Faz sentido pra você?”, “Posso te mandar 2–3 lotes com fotos reais agora?”, “Quer que eu te envie as fotos reais agora?”, “Deixa eu separar algo que eu cuidaria como se fosse pra mim.”',

    // Estilo de escrita
    'Mensagens curtas (2–5 frases), claras e humanas; sem jargão vazio; técnica só quando ajuda a decidir; tom consultivo e respeitoso; fecho elegante.',

    // Indicadores obrigatórios (para garantir next step e clareza)
    'Em cada resposta, inclua AO MENOS um dos itens: (a) CTA suave como “Faz sentido pra você?”; (b) referência explícita a “padrão de lote”; (c) oferta para enviar “fotos reais” de 2–3 lotes alinhados ao briefing.',

    // Follow-up (relacional e contextual)
    'Follow-ups contextuais: referencie pontos específicos da conversa; proponha 1 próximo passo simples; BR marmoristas semanal; internacional quinzenal/mensal.',

    // Do/Don’t
    'Faça: perguntas abertas; explique padrão de lote com exemplos; sempre proponha próximo passo claro; ajuste linguagem (m² vs sqft).',
    'Evite: catálogo sem diagnóstico; reduzir a conversa a preço; pressionar; abrir com container para EUA.',

    // Resultado desejado
    'Objetivo: gerar confiança e clareza; cliente entende que o diferencial é o padrão do lote; sempre sair com próximo passo definido.'
  ].join(' ');
}

function normalizeHistory(arr) {
  if (!Array.isArray(arr)) return [];
  // Sanitiza e limita às últimas N mensagens para evitar excesso de tokens
  const clean = arr
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.substring(0, 4000) }));
  const max = 16; // últimas 16 mensagens
  return clean.length > max ? clean.slice(-max) : clean;
}

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function callChatCompletions(apiKey, model, messages) {
  const maxAttempts = 3;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const to = setTimeout(()=>controller.abort(), 20_000);
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 600 }),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!resp.ok) {
        const txt = await resp.text();
        const err = new Error(`OpenAI chat completions failed: ${resp.status}`);
        err.status = resp.status; err.details = txt;
        // Retry on 408/429/5xx
        if ([408, 409, 429, 500, 502, 503, 504].includes(Number(resp.status)) && attempt < maxAttempts) {
          const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random()*300);
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
        const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random()*300);
        await sleep(backoff);
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error('Unknown error calling Chat Completions');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    const body = req.body || {};
    const message = (body.message || '').toString();
    const history = normalizeHistory(body.conversation_history || []);
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const systemPrompt = buildSystemPrompt();
    const msgs = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }];

    const data = await callChatCompletions(apiKey, model, msgs);
    const assistantMessage = data.choices?.[0]?.message?.content || 'Desculpe, não consegui responder agora.';

    return res.status(200).json({ assistant_message: assistantMessage, thread_id: null, run_id: null });
  } catch (err) {
    const code = err?.status && Number(err.status) >= 400 && Number(err.status) < 600 ? Number(err.status) : 500;
    return res.status(code).json({ error: 'Chat API error', details: err?.details?.slice?.(0, 500) || err?.message || String(err) });
  }
};

