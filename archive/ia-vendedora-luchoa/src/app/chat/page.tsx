'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage, UserProfile, ConversationContext } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Send, ArrowLeft, User, MoreVertical, UserPlus } from 'lucide-react';
import { useApiClient } from '@/lib/api-client';
import { useLogger } from '@/lib/logger';

export default function ChatPage() {
  const router = useRouter();
  const apiClient = useApiClient();
  const logger = useLogger('CHAT_PAGE');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Carregar perfil do usuário
      let savedProfile = localStorage.getItem('userProfile');

      // Fallback para E2E: cria um perfil provisório se ausente
      if (!savedProfile && process.env.NEXT_PUBLIC_E2E_ALLOW_NO_PROFILE === '1') {
        const temp = {
          id: `e2e-${Date.now()}`,
          name: 'Visitante E2E',
          personalProfile: 'Perfil de teste gerado automaticamente.',
          preferences: [],
          teamAffiliations: [],
          market: 'brasil',
          userType: 'cliente-final',
          createdAt: new Date(),
        } as unknown as UserProfile;
        localStorage.setItem('userProfile', JSON.stringify(temp));
        savedProfile = JSON.stringify(temp);
      }

      if (!savedProfile) {
        router.push('/');
        return;
      }

      const profile = JSON.parse(savedProfile) as UserProfile;
      setUserProfile(profile);

      // Carregar mensagens salvas
      const savedMessages = localStorage.getItem(`chat_${profile.id}`);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages) as ChatMessage[];
        // Converter timestamps de string para Date
        const messagesWithDates = parsed.map(msg => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        setMessages(messagesWithDates);
      } else {
        // Primeira mensagem de boas-vindas com fallback se não houver nome/contexto
        const firstName = (profile.name || '').trim().split(' ')[0];
        const hasName = Boolean(firstName) && firstName.toLowerCase() !== 'visitante';
        const opening = hasName
          ? `Bom dia, ${firstName}! Tudo bem?`
          : `Bom dia! Tudo bem?`;
        const discovery = (profile.personalProfile && profile.personalProfile.trim().length > 0)
          ? `Vi aqui algumas anotações suas. Como tem sido o mercado por aí nas últimas semanas?`
          : `Quero te ouvir: você está buscando algum material específico ou avaliando tendências? Posso te ajudar do jeito que for melhor pra você.`;

        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          content: `${opening}\n\nSou o Leandro Uchoa, da Luchoa. Trabalhamos com mármores, granitos e quartzitos exóticos — prazer me apresentar!\n\n${discovery}`,
          sender: 'ai',
          timestamp: new Date(),
          userId: profile.id,
          metadata: {
            conversationStage: 'abertura'
          }
        };
        setMessages([welcomeMessage]);
      }
    } catch (e) {
      // em último caso, volta para raiz
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    // Salvar mensagens no localStorage
    if (userProfile && messages.length > 0) {
      localStorage.setItem(`chat_${userProfile.id}`, JSON.stringify(messages));
    }
  }, [messages, userProfile]);

  useEffect(() => {
    // Auto-scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userProfile || isLoading) return;

    const messageContent = inputMessage.trim();
    const startTime = Date.now();

    // Log da ação do usuário
    logger.userAction('send_message', userProfile.id, {
      messageLength: messageContent.length,
      conversationLength: messages.length
    });

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      userId: userProfile.id,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simular delay de digitação realista (mais curto em E2E)
      const e2eFast = process.env.NEXT_PUBLIC_E2E_ALLOW_NO_PROFILE === '1';
      const typingDelay = e2eFast
        ? Math.min(messageContent.length * 10, 500)
        : Math.min(messageContent.length * 50, 3000) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, typingDelay));

      // Chamar API da IA com retry e timeout
      const idempotencyKey = `chat_${userProfile.id}_${Date.now()}`;
      const apiResponse = await apiClient.post('/api/chat', {
        message: messageContent,
        userProfile,
        conversationHistory: messages,
      }, { idempotencyKey });

      const duration = Date.now() - startTime;
      logger.performance('chat_api_call', duration);

      if (apiResponse.error) {
        throw new Error(apiResponse.error);
      }

      const aiResponseData = apiResponse.data;

      // Log da interação com IA
      logger.aiInteraction(
        userProfile.id,
        messageContent,
        aiResponseData.message,
        {
          detectedIntent: aiResponseData.detectedIntent,
          conversationStage: aiResponseData.currentStage,
          confidence: aiResponseData.confidence,
          relationshipMetrics: aiResponseData.relationshipMetrics,
        }
      );

      const progressive = (Array.isArray(aiResponseData.messageChunks) && aiResponseData.messageChunks.length > 0) || process.env.NEXT_PUBLIC_CHAT_PROGRESSIVE === '1';
      console.info('DEBUG chunks', Array.isArray(aiResponseData.messageChunks) ? aiResponseData.messageChunks.length : 'no array', aiResponseData.messageChunks);
      if (progressive && Array.isArray(aiResponseData.messageChunks) && aiResponseData.messageChunks.length > 0) {
        for (const chunk of aiResponseData.messageChunks as string[]) {
          const chunkMessage: ChatMessage = {
            id: uuidv4(),
            content: chunk,
            sender: 'ai',
            timestamp: new Date(),
            userId: userProfile.id,
            metadata: {
              conversationStage: aiResponseData.nextStage,
              detectedIntent: aiResponseData.detectedIntent,
            }
          };
          const words = chunk.trim().split(/\s+/).filter(Boolean).length;
          const e2eFast = process.env.NEXT_PUBLIC_E2E_ALLOW_NO_PROFILE === '1';
          const delay = e2eFast
            ? Math.min(100 + 10 * words, 400)
            : Math.min(350 + 40 * words + Math.floor(Math.random() * 120), 2500);
          await new Promise(resolve => setTimeout(resolve, delay));
          setMessages(prev => [...prev, chunkMessage]);
        }
      } else {
        const aiMessage: ChatMessage = {
          id: uuidv4(),
          content: aiResponseData.message,
          sender: 'ai',
          timestamp: new Date(),
          userId: userProfile.id,
          metadata: {
            conversationStage: aiResponseData.nextStage,
            detectedIntent: aiResponseData.detectedIntent,
          }
        };
        setMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to send message', 'CHAT_API', {
        userId: userProfile.id,
        messageLength: messageContent.length,
        duration,
      }, error as Error);

      // Mensagem de erro amigável
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: 'Desculpe, tive um problema técnico aqui. Pode repetir sua mensagem? Fico à disposição para te ajudar!',
        sender: 'ai',
        timestamp: new Date(),
        userId: userProfile.id,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewProfile = () => {
    setShowConfirmModal(true);
    setShowMenu(false);
  };

  const confirmNewProfile = () => {
    // Limpar localStorage
    if (userProfile) {
      localStorage.removeItem(`chat_${userProfile.id}`);
    }
    localStorage.removeItem('userProfile');

    // Redirecionar para página inicial
    router.push('/');
  };

  const cancelNewProfile = () => {
    setShowConfirmModal(false);
  };

  const formatTime = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '--:--';
      }
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '--:--';
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-whatsapp-green text-white p-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-whatsapp-dark rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <User className="text-whatsapp-green" size={20} />
          </div>
          <div>
            <h1 className="font-semibold">Leandro Uchoa</h1>
            <p className="text-sm opacity-90">Luchoa Revestimentos Naturais</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm opacity-90">Olá, {userProfile.name.split(' ')[0]}!</p>
            <p className="text-xs opacity-75">{userProfile.userType}</p>
          </div>

          {/* Menu dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-whatsapp-dark rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 min-w-48 z-50">
                <button
                  onClick={handleNewProfile}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                >
                  <UserPlus size={16} />
                  Novo Perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 chat-container p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`message-bubble ${
                  message.sender === 'user' ? 'message-user' : 'message-ai'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="message-bubble message-ai">
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full px-4 py-3 pr-12 rounded-full resize-none focus:ring-2 focus:ring-whatsapp-green focus:border-transparent max-h-32 border border-gray-300 dark:border-gray-700 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 shadow-sm"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-whatsapp-green text-white rounded-full hover:bg-whatsapp-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Começar Nova Conversa?</h3>
            <p className="text-gray-600 mb-6">
              Isso apagará sua conversa atual e criará um novo perfil. Tem certeza que deseja continuar?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelNewProfile}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmNewProfile}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                Sim, Começar Nova Conversa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
