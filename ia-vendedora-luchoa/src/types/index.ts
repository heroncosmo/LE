// Tipos principais do sistema
export interface UserProfile {
  id: string;
  name: string;
  personalProfile: string;
  preferences: string[];
  teamAffiliations: string[];
  market?: 'brasil' | 'eua' | 'europa' | 'america-latina' | 'asia' | 'oriente-medio';
  userType?: 'arquiteto' | 'marmorista' | 'distribuidor' | 'cliente-final';
  createdAt: Date;
}

// Informações fornecidas ANTES de cada conversa (dados do cliente)
export interface ClientInfo {
  name?: string;
  company?: string;
  region?: string; // ex.: Brasil, EUA, Europa, etc.
  language?: 'pt-BR' | 'en' | 'es';
  lastContact?: string; // ISO date ou texto livre
  notes?: string; // Observações/contexto
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  userId: string;
  metadata?: {
    conversationStage?: 'abertura' | 'exploracao' | 'calibracao' | 'demonstracao' | 'compromisso' | 'followup';
    detectedIntent?: string;
    suggestedResponse?: string;
  };
}

export interface ConversationContext {
  userId: string;
  currentStage: 'abertura' | 'exploracao' | 'calibracao' | 'demonstracao' | 'compromisso' | 'followup';
  userProfile: UserProfile;
  conversationHistory: ChatMessage[];
  detectedNeeds: string[];
  relationshipLevel: 'inicial' | 'desenvolvimento' | 'confianca' | 'parceria';
  lastInteraction: Date;
  followupScheduled?: Date;
}

export interface AIResponse {
  message: string;
  nextStage?: string;
  suggestedActions?: string[];
  confidence: number;
  reasoning?: string;
}
