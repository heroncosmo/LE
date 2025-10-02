import { ChatMessage, UserProfile } from '@/types';

export interface RelationshipMetrics {
  trustLevel: number; // 0-100
  engagementLevel: number; // 0-100
  readinessToReceiveOffers: number; // 0-100
  relationshipStage: 'inicial' | 'desenvolvimento' | 'confianca' | 'parceria';
  interactionCount: number;
  positiveSignals: string[];
  concerns: string[];
  lastInteractionDate: Date;
}

// Analisar sinais positivos na conversa
export function detectPositiveSignals(message: string): string[] {
  const signals: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Sinais de interesse
  if (lowerMessage.includes('interessante') || lowerMessage.includes('legal') || lowerMessage.includes('bacana')) {
    signals.push('interesse_expresso');
  }
  
  if (lowerMessage.includes('pode enviar') || lowerMessage.includes('manda') || lowerMessage.includes('quero ver')) {
    signals.push('solicitacao_material');
  }
  
  if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu') || lowerMessage.includes('ajudou')) {
    signals.push('gratidao');
  }
  
  if (lowerMessage.includes('projeto') || lowerMessage.includes('obra') || lowerMessage.includes('cliente')) {
    signals.push('contexto_profissional');
  }
  
  if (lowerMessage.includes('quando') || lowerMessage.includes('prazo') || lowerMessage.includes('entrega')) {
    signals.push('urgencia_temporal');
  }
  
  // Sinais de confiança
  if (lowerMessage.includes('experiência') || lowerMessage.includes('tempo de mercado') || lowerMessage.includes('referência')) {
    signals.push('busca_credibilidade');
  }
  
  return signals;
}

// Detectar preocupações ou objeções
export function detectConcerns(message: string): string[] {
  const concerns: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('caro') || lowerMessage.includes('preço alto') || lowerMessage.includes('custoso')) {
    concerns.push('preco_alto');
  }
  
  if (lowerMessage.includes('prazo') || lowerMessage.includes('demora') || lowerMessage.includes('urgente')) {
    concerns.push('prazo_apertado');
  }
  
  if (lowerMessage.includes('qualidade') || lowerMessage.includes('problema') || lowerMessage.includes('defeito')) {
    concerns.push('qualidade_material');
  }
  
  if (lowerMessage.includes('fornecedor') || lowerMessage.includes('já compro') || lowerMessage.includes('parceiro')) {
    concerns.push('fornecedor_existente');
  }
  
  if (lowerMessage.includes('risco') || lowerMessage.includes('garantia') || lowerMessage.includes('segurança')) {
    concerns.push('seguranca_transacao');
  }
  
  return concerns;
}

// Calcular nível de confiança baseado no histórico
export function calculateTrustLevel(messages: ChatMessage[], userProfile: UserProfile): number {
  let trustScore = 30; // Base inicial
  
  // Pontuação por número de interações (relacionamento construído)
  const interactionCount = messages.filter(m => m.sender === 'user').length;
  trustScore += Math.min(interactionCount * 5, 30); // Máximo 30 pontos
  
  // Analisar sinais positivos acumulados
  const allPositiveSignals = messages
    .filter(m => m.sender === 'user')
    .flatMap(m => detectPositiveSignals(m.content));
  
  const uniquePositiveSignals = [...new Set(allPositiveSignals)];
  trustScore += uniquePositiveSignals.length * 8; // 8 pontos por tipo de sinal
  
  // Reduzir por preocupações não resolvidas
  const allConcerns = messages
    .filter(m => m.sender === 'user')
    .flatMap(m => detectConcerns(m.content));
  
  const uniqueConcerns = [...new Set(allConcerns)];
  trustScore -= uniqueConcerns.length * 5; // -5 pontos por preocupação
  
  // Bônus por tipo de usuário (alguns são naturalmente mais confiantes)
  if (userProfile.userType === 'distribuidor') {
    trustScore += 10; // Distribuidores são mais profissionais
  } else if (userProfile.userType === 'arquiteto') {
    trustScore += 5; // Arquitetos valorizam relacionamento
  }
  
  return Math.max(0, Math.min(100, trustScore));
}

// Calcular nível de engajamento
export function calculateEngagementLevel(messages: ChatMessage[]): number {
  const userMessages = messages.filter(m => m.sender === 'user');
  
  if (userMessages.length === 0) return 0;
  
  let engagementScore = 0;
  
  // Pontuação por frequência de mensagens
  engagementScore += Math.min(userMessages.length * 10, 40);
  
  // Pontuação por tamanho médio das mensagens (mais detalhes = mais engajamento)
  const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
  if (avgMessageLength > 100) engagementScore += 20;
  else if (avgMessageLength > 50) engagementScore += 10;
  
  // Pontuação por perguntas feitas (interesse ativo)
  const questionsCount = userMessages.filter(m => m.content.includes('?')).length;
  engagementScore += questionsCount * 5;
  
  // Pontuação por menções a projetos específicos
  const projectMentions = userMessages.filter(m => 
    m.content.toLowerCase().includes('projeto') || 
    m.content.toLowerCase().includes('obra') ||
    m.content.toLowerCase().includes('cliente')
  ).length;
  engagementScore += projectMentions * 8;
  
  return Math.min(100, engagementScore);
}

// Determinar prontidão para receber ofertas
export function calculateOfferReadiness(
  trustLevel: number, 
  engagementLevel: number, 
  messages: ChatMessage[]
): number {
  // Base: média ponderada de confiança e engajamento
  let readiness = (trustLevel * 0.6 + engagementLevel * 0.4);
  
  // Sinais específicos de prontidão
  const recentMessages = messages.slice(-5);
  const hasRequestedMaterial = recentMessages.some(m => 
    m.sender === 'user' && (
      m.content.toLowerCase().includes('pode enviar') ||
      m.content.toLowerCase().includes('manda') ||
      m.content.toLowerCase().includes('quero ver') ||
      m.content.toLowerCase().includes('preço')
    )
  );
  
  if (hasRequestedMaterial) {
    readiness += 20;
  }
  
  // Reduzir se há muitas preocupações não resolvidas
  const recentConcerns = recentMessages
    .filter(m => m.sender === 'user')
    .flatMap(m => detectConcerns(m.content));
  
  if (recentConcerns.length > 2) {
    readiness -= 15;
  }
  
  return Math.max(0, Math.min(100, readiness));
}

// Determinar estágio do relacionamento
export function determineRelationshipStage(
  trustLevel: number,
  engagementLevel: number,
  interactionCount: number
): 'inicial' | 'desenvolvimento' | 'confianca' | 'parceria' {
  if (interactionCount <= 2) return 'inicial';
  
  if (trustLevel >= 80 && engagementLevel >= 70) return 'parceria';
  if (trustLevel >= 60 && engagementLevel >= 50) return 'confianca';
  if (trustLevel >= 40 || engagementLevel >= 40) return 'desenvolvimento';
  
  return 'inicial';
}

// Função principal para analisar relacionamento
export function analyzeRelationship(
  messages: ChatMessage[],
  userProfile: UserProfile
): RelationshipMetrics {
  const interactionCount = messages.filter(m => m.sender === 'user').length;
  const trustLevel = calculateTrustLevel(messages, userProfile);
  const engagementLevel = calculateEngagementLevel(messages);
  const readinessToReceiveOffers = calculateOfferReadiness(trustLevel, engagementLevel, messages);
  const relationshipStage = determineRelationshipStage(trustLevel, engagementLevel, interactionCount);
  
  // Coletar sinais positivos e preocupações recentes
  const recentMessages = messages.slice(-5).filter(m => m.sender === 'user');
  const positiveSignals = [...new Set(recentMessages.flatMap(m => detectPositiveSignals(m.content)))];
  const concerns = [...new Set(recentMessages.flatMap(m => detectConcerns(m.content)))];
  
  return {
    trustLevel,
    engagementLevel,
    readinessToReceiveOffers,
    relationshipStage,
    interactionCount,
    positiveSignals,
    concerns,
    lastInteractionDate: new Date()
  };
}

// Gerar estratégia de abordagem baseada no relacionamento
export function generateApproachStrategy(metrics: RelationshipMetrics): {
  shouldMakeOffer: boolean;
  approachType: 'educational' | 'consultative' | 'direct' | 'nurturing';
  focusAreas: string[];
  nextSteps: string[];
} {
  const { trustLevel, engagementLevel, readinessToReceiveOffers, relationshipStage, concerns } = metrics;
  
  // Decidir se deve fazer oferta
  const shouldMakeOffer = readinessToReceiveOffers >= 70 && relationshipStage !== 'inicial';
  
  // Determinar tipo de abordagem
  let approachType: 'educational' | 'consultative' | 'direct' | 'nurturing';
  
  if (relationshipStage === 'parceria') {
    approachType = 'direct';
  } else if (relationshipStage === 'confianca') {
    approachType = 'consultative';
  } else if (engagementLevel >= 60) {
    approachType = 'educational';
  } else {
    approachType = 'nurturing';
  }
  
  // Definir áreas de foco baseadas nas preocupações
  const focusAreas: string[] = [];
  
  if (concerns.includes('preco_alto')) {
    focusAreas.push('valor_padrao_lote');
  }
  if (concerns.includes('qualidade_material')) {
    focusAreas.push('provas_qualidade');
  }
  if (concerns.includes('fornecedor_existente')) {
    focusAreas.push('diferenciacao');
  }
  if (concerns.includes('seguranca_transacao')) {
    focusAreas.push('credibilidade');
  }
  
  // Se não há preocupações específicas, focar no relacionamento
  if (focusAreas.length === 0) {
    if (relationshipStage === 'inicial') {
      focusAreas.push('construcao_rapport');
    } else {
      focusAreas.push('exploracao_necessidades');
    }
  }
  
  // Definir próximos passos
  const nextSteps: string[] = [];
  
  if (shouldMakeOffer) {
    nextSteps.push('apresentar_opcoes_lote');
    nextSteps.push('enviar_fotos_reais');
  } else {
    if (trustLevel < 50) {
      nextSteps.push('construir_confianca');
    }
    if (engagementLevel < 50) {
      nextSteps.push('aumentar_engajamento');
    }
    nextSteps.push('explorar_necessidades');
  }
  
  return {
    shouldMakeOffer,
    approachType,
    focusAreas,
    nextSteps
  };
}
