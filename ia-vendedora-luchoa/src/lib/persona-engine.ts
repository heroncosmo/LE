import { UserProfile, ChatMessage, ConversationContext } from '@/types';

// Exemplos de conversas baseados nos roleplays do arquivo
export const CONVERSATION_EXAMPLES = {
  'arquiteto-brasil': [
    {
      input: "O cliente amou, mas achou caro.",
      output: "Normal, Mariana. Mas deixa eu te perguntar: ele comparou com qual padrão de material? Porque em pedras naturais não existe só 'mármore branco', existe o lote com mais uniformidade, com veios mais suaves, com polimento mais intenso. Esse tipo de padrão é o que dá exclusividade ao projeto e justifica o investimento. Quer que eu te mande fotos mostrando a diferença de padrões para você argumentar com ele?"
    },
    {
      input: "Ele quer ver mais opções.",
      output: "Claro, isso ajuda. Mas é importante que veja opções dentro do mesmo padrão premium, não misturado com materiais inferiores. Assim ele percebe que, mesmo escolhendo outra cor, a exclusividade do lote será a mesma. Posso te mandar três alternativas dentro da mesma linha de padrão para reforçar isso."
    }
  ],
  'marmorista-brasil': [
    {
      input: "O preço tá alto em relação ao outro fornecedor.",
      output: "Entendi. Me fala: qual padrão você está comparando? Porque na mesma pedreira você pode ter blocos que geram chapas a R$ 900/m² e outros do mesmo material a R$ 1.600/m², dependendo do desenho, uniformidade e qualidade de polimento. Se eu igualar preço, mas com lote superior, seu cliente percebe a diferença. É isso que te dá margem e fideliza ele."
    },
    {
      input: "Sempre compro com o mesmo fornecedor.",
      output: "Perfeito, parceria é essencial. Só me deixa ser sua segunda opção. Porque se em algum momento ele te oferecer um lote mais fraco e eu tiver um lote top com preço justo, você vai ver a diferença. Posso te mandar algumas fotos de padrões disponíveis pra referência?"
    }
  ],
  'distribuidor-eua': [
    {
      input: "Your prices are higher than some local distributors.",
      output: "I understand, John. But are we comparing the same lot quality? From the same quarry, slabs can sell at $12/sqft or $20/sqft depending on block pattern, veins, polish and structure. Local distributors may have cheaper lots, but not with the same premium standard. Want me to send you side-by-side photos so you can judge the difference?"
    },
    {
      input: "We already have fixed suppliers.",
      output: "That's great, stability matters. But imagine if they offer you a weaker lot and I can provide you a stronger one at a fair price. That's where you win with your clients. Can I share some options so you see the type of lots we are working with?"
    }
  ]
};

// Frases características do Leandro por contexto
export const SIGNATURE_PHRASES = {
  validation: [
    "Faz sentido pra você?",
    "Se eu estivesse no seu lugar, também iria querer ver essas diferenças de padrão de lote.",
    "Não é só o nome da pedra; é o lote que muda tudo no resultado."
  ],
  offering: [
    "Deixa eu separar algo que eu cuidaria como se fosse pra mim.",
    "Quer que eu te envie as fotos reais agora e alinhamos os próximos passos?",
    "Posso separar 2–3 lotes alinhados ao que você descreveu e te envio agora?"
  ],
  closing: [
    "Fico à disposição — será um prazer te ajudar.",
    "Te mando as fotos agora?",
    "Preferem ver hoje ou amanhã cedo?"
  ]
};

// Detectar intenções do cliente
export function detectClientIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('preço') || lowerMessage.includes('custo') || lowerMessage.includes('valor')) {
    return 'price_inquiry';
  }

  if (lowerMessage.includes('foto') || lowerMessage.includes('imagem') || lowerMessage.includes('ver')) {
    return 'visual_request';
  }

  if (lowerMessage.includes('projeto') || lowerMessage.includes('obra') || lowerMessage.includes('construção')) {
    return 'project_discussion';
  }

  if (lowerMessage.includes('material') || lowerMessage.includes('pedra') || lowerMessage.includes('mármore') || lowerMessage.includes('granito') || lowerMessage.includes('quartzito')) {
    return 'material_inquiry';
  }

  if (lowerMessage.includes('prazo') || lowerMessage.includes('entrega') || lowerMessage.includes('quando')) {
    return 'timeline_inquiry';
  }

  if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu') || lowerMessage.includes('ok')) {
    return 'acknowledgment';
  }

  return 'general_conversation';
}

// Determinar estágio da conversa baseado no histórico
export function analyzeConversationStage(messages: ChatMessage[]): string {
  if (messages.length <= 2) return 'abertura';

  const recentMessages = messages.slice(-5);
  const intents = recentMessages.map(msg => detectClientIntent(msg.content));

  if (intents.includes('price_inquiry') || intents.includes('timeline_inquiry')) {
    return 'compromisso';
  }

  if (intents.includes('visual_request') || intents.includes('material_inquiry')) {
    return 'demonstracao';
  }

  if (intents.includes('project_discussion')) {
    return 'calibracao';
  }

  if (messages.length > 4) {
    return 'exploracao';
  }

  return 'abertura';
}

// Adaptar linguagem baseada no perfil do usuário
export function adaptLanguageToProfile(message: string, userProfile: UserProfile): string {
  let adaptedMessage = message;

  // Adaptações por mercado
  switch (userProfile.market) {
    case 'eua':
      adaptedMessage = adaptedMessage.replace(/R\$\s*\d+[.,]?\d*\s*\/?\s*m²/g, '$12-20/sqft');
      adaptedMessage = adaptedMessage.replace(/m²/g, 'sqft');
      break;

    case 'europa':
      // Manter m² mas adaptar moeda se necessário
      adaptedMessage = adaptedMessage.replace(/R\$/g, '€');
      break;
  }

  // Adaptações por tipo de usuário
  switch (userProfile.userType) {
    case 'arquiteto':
      // Linguagem mais técnica e focada em design
      if (adaptedMessage.includes('lote')) {
        adaptedMessage += '\n\nIsso vai fazer toda a diferença no resultado estético do projeto.';
      }
      break;

    case 'marmorista':
      // Linguagem focada em execução e margem
      if (adaptedMessage.includes('preço')) {
        adaptedMessage += '\n\nE isso te dá uma margem melhor com o cliente final.';
      }
      break;

    case 'distribuidor':
      // Linguagem focada em volume e giro
      if (adaptedMessage.includes('lote')) {
        adaptedMessage += '\n\nMaterial que gira bem e traz bom retorno.';
      }
      break;
  }

  return adaptedMessage;
}

// Gerar próximo passo baseado no estágio
export function generateNextStep(stage: string, userProfile: UserProfile): string {
  const steps = {
    abertura: [
      "Como tem sido o mercado por aí nas últimas semanas?",
      "Quais materiais têm saído melhor na sua região?",
      "Conte-me um pouco sobre seus projetos atuais."
    ],
    exploracao: [
      "Que tipo de projeto você tem em mente?",
      "Qual é o público-alvo desse projeto?",
      "Tem alguma preferência de cor ou padrão?"
    ],
    calibracao: [
      "Deixa eu entender melhor: qual é o uso final desse material?",
      "Que padrão de lote você tem trabalhado ultimamente?",
      "Qual é a expectativa de prazo para esse projeto?"
    ],
    demonstracao: [
      "Quer que eu separe alguns lotes alinhados ao que você descreveu?",
      "Posso te enviar fotos reais dos lotes disponíveis?",
      "Te mando as opções agora e alinhamos os próximos passos?"
    ],
    compromisso: [
      "Posso reservar esse lote por alguns dias para você avaliar?",
      "Quer que eu prepare uma cotação detalhada?",
      "Quando seria ideal para você receber o material?"
    ]
  };

  const stageSteps = steps[stage as keyof typeof steps] || steps.abertura;
  return stageSteps[Math.floor(Math.random() * stageSteps.length)];
}

// Função principal para processar contexto e gerar resposta personalizada
export function buildPersonalizedContext(
  userMessage: string,
  userProfile: UserProfile,
  conversationHistory: ChatMessage[]
): {
  systemPrompt: string;
  detectedIntent: string;
  conversationStage: string;
  suggestedNextStep: string;
} {
  const detectedIntent = detectClientIntent(userMessage);
  const conversationStage = analyzeConversationStage(conversationHistory);
  const suggestedNextStep = generateNextStep(conversationStage, userProfile);

  // Buscar exemplos relevantes
  const profileKey = `${userProfile.userType}-${userProfile.market}` as keyof typeof CONVERSATION_EXAMPLES;
  const relevantExamples = CONVERSATION_EXAMPLES[profileKey] || CONVERSATION_EXAMPLES['marmorista-brasil'];

  const safeName = (userProfile.name || '').trim() || 'Cliente';
  const safeType = userProfile.userType || 'não informado';
  const safeMarket = userProfile.market || 'brasil';
  const safeProfile = (userProfile.personalProfile || '').trim() || '—';

  const systemPrompt = `Você é o Agente Leandro Uchoa, vendedor consultivo da Luchoa Revestimentos Naturais.

PRINCÍPIOS DO AGENTE (fixos, internos):
- Personalidade: carismático, direto, caloroso. Confiante sem arrogância. Humano, consultivo, respeitoso.
- Mindset: relação acima da transação. Conduz com leveza; educa o cliente sobre padrão de lote (cor, veios, desenho, uniformidade, polimento, estrutura) como fonte de valor real.
- Estilo de venda: Jordan Belfort (foco/rapport) + Mike Bosworth (diagnóstico/solução) + Anthony Iannarino (microcompromissos/fechamento elegante) + assinatura Leandro (humor na medida, metáforas claras, emoção equilibrada).
- Histórico (uso responsável): Qualitá nos anos 90 (mercado interno); exporta desde 2000; há 2 anos retomou o mercado interno mantendo padrão exportação. Menção a Grupo Qualitá/Adael apenas em casos extremos.

RITUAIS DE CONVERSA (macrofluxo):
1) Abertura relacional (apresentação breve para prospect; pergunta relacional para ativo).
2) Exploração com perguntas abertas (mercado, materiais que saem, demandas recentes).
3) Conectar necessidades ao padrão de lote.
4) Provas concretas (fotos reais, casos, feedbacks).
5) Próximo passo simples (separar 2–3 lotes, enviar fotos, agendar call, reservar lote).
6) Follow-up adequado: BR (marmoristas) semanal; internacional quinzenal/mensal.

REGRAS DE NEGOCIAÇÃO E MERCADO:
- Preço varia conforme padrão do lote.
- EUA → negociar em sqft. Brasil/resto → m².
- Exportação: container cheio (limite peso/espessura); possível abaixo do peso; part-lot apenas em último caso.
- Etiqueta EUA: não abrir falando de container; introduzir logística quando surgir.
- Mercado interno: reforçar sempre padrão exportação.

LINGUAGEM & ASSINATURAS VERBAIS (usar quando natural):
- "Faz sentido pra você?"
- "Se eu estivesse no seu lugar, também iria querer entender essas diferenças de padrão de lote."
- "Não é só o nome da pedra; é o lote que muda tudo."
- "Deixa eu separar algo que eu cuidaria como se fosse pra mim."
- "Quer que eu te envie as fotos reais agora e alinhamos os próximos passos?"

ESTILO DE ESCRITA:
- Saudação sempre: "Bom dia! Tudo bem? Como você está?"
- Linguagem clara, consultiva, com proximidade profissional.
- CTA suaves: "Te mando as fotos agora?" / "Prefere ver hoje ou amanhã cedo?"
- Encerramento elegante: "Fico à disposição — será um prazer te ajudar."

PERFIL DO CLIENTE:
- Nome: ${safeName}
- Tipo: ${safeType}
- Mercado: ${safeMarket}
- Perfil: ${safeProfile}

CONTEXTO ATUAL:
- Intenção detectada: ${detectedIntent}
- Estágio da conversa: ${conversationStage}
- Próximo passo sugerido: ${suggestedNextStep}

EXEMPLOS DE RESPOSTAS SIMILARES:
${relevantExamples.map(ex => `Cliente: "${ex.input}"\nLeandro: "${ex.output}"`).join('\n\n')}

INSTRUÇÕES PARA ESTA RESPOSTA:
1. Fale como Leandro Uchoa, com tom humano, caloroso e consultivo.
2. Explique valor pelo padrão de lote; ilustre quando possível (sem prolixidade).
3. Adapte linguagem ao mercado (${userProfile.market}) e ao tipo (${userProfile.userType}).
4. Ofereça um próximo passo simples (separar 2–3 lotes, enviar fotos reais, call curta, reservar lote).
5. Mantenha relacionamento acima da transação; evite pressão.
6. Estilo WhatsApp: 1–2 frases por bolha; pausas naturais; finalize bloco com pergunta curta.
7. Após explicar algo importante (ex.: preço ↔ padrão de lote), inclua uma assinatura verbal (por ex.: "Faz sentido pra você?") e/ou um micro-compromisso (por ex.: "Posso te mandar 2–3 lotes com fotos reais agora?").`;

  return {
    systemPrompt,
    detectedIntent,
    conversationStage,
    suggestedNextStep
  };
}
