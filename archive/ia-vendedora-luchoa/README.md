# 🤖 IA Vendedora Luchoa - Sistema de Prospecção e Relacionamento

Sistema completo de Inteligência Artificial especializada em prospecção e relacionamento com clientes para rochas ornamentais premium, baseado na persona detalhada do **Leandro Uchoa** da **Luchoa Revestimentos Naturais**.

## 🚀 Como Iniciar o Servidor

### Opção 1: Duplo Clique (Mais Fácil)
```
📁 Duplo clique em: INICIAR_SERVIDOR.bat
```

### Opção 2: Linha de Comando
```bash
# Windows
start-server.bat
# ou
start-server.cmd
# ou
python server.py
```

### Pré-requisitos
- **Python 3.7+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm** (vem com Node.js)

### Acesso
Após iniciar o servidor:
- **URL:** http://localhost:3000
- **Chat:** http://localhost:3000/conversa

## 🎯 Objetivo

Criar uma aplicação web com interface de chat (similar ao WhatsApp) que implementa uma IA especializada em prospecção e relacionamento com clientes, seguindo uma persona específica detalhada e estratégias de relacionamento gradual antes de apresentar ofertas.

## ✨ Características Principais

### 🧠 Persona Leandro Uchoa
- **Personalidade**: Carismático, direto, caloroso, consultivo
- **Abordagem**: Relação > Transação, sempre ouve antes de propor
- **Estilo de Venda**: Fusão Jordan Belfort + Mike Bosworth + Anthony Iannarino
- **Foco**: Educação sobre "padrão de lote" como principal fonte de valor

### 🤝 Sistema de Relacionamento Gradual
- Análise de confiança e engajamento em tempo real
- Detecção de sinais positivos e preocupações
- Adaptação da abordagem baseada no estágio do relacionamento
- Prontidão para ofertas calculada dinamicamente

### 🌍 Adaptação por Mercado e Perfil
- **Mercados**: Brasil, EUA, Europa, América Latina, Ásia, Oriente Médio
- **Tipos de Usuário**: Arquitetos, Marmoristas, Distribuidores, Clientes Finais
- **Linguagem**: Adaptação automática (m² vs sqft, moedas, idiomas)

### ⚙️ Boas Práticas Implementadas
- **Idempotência**: Prevenção de duplicação de requests
- **Retry/Backoff**: Tentativas automáticas com delay exponencial
- **Timeouts**: Controle de tempo limite para APIs
- **Logging**: Sistema estruturado de logs com diferentes níveis
- **Observabilidade**: Métricas de performance e monitoramento

## 🏗️ Arquitetura Técnica

### Frontend
- **Next.js 14** com App Router
- **TypeScript** para type safety
- **Tailwind CSS** para styling responsivo
- **React Hooks** para gerenciamento de estado

### Backend
- **Next.js API Routes** para endpoints
- **OpenAI GPT-4** para processamento de linguagem natural
- **Sistema de Persona** customizado para Leandro Uchoa
- **Engine de Relacionamento** para análise comportamental

### Testes
- **Playwright** para testes E2E
- **Testes automatizados** para todas as funcionalidades
- **Validação de comportamento da IA** conforme persona

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Chave da API OpenAI

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração das Variáveis de Ambiente
Crie o arquivo `.env.local`:
```env
OPENAI_API_KEY=sua_chave_openai_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Executar em Desenvolvimento
```bash
npm run dev
```

### 4. Executar Testes
```bash
# Testes E2E com Playwright
npm run test

# Testes com interface visual
npm run test:ui
```

### 5. Validação do Sistema
```bash
# Executar script de validação (3 iterações)
node scripts/validate-system.js
```

## 📱 Como Usar

### 1. Cadastro do Usuário
- Acesse a página inicial
- Preencha nome, perfil pessoal, preferências
- Selecione tipo de usuário e mercado de atuação
- Adicione afiliações a times/grupos/empresas

### 2. Chat com Leandro Uchoa
- Interface similar ao WhatsApp
- IA responde conforme persona detalhada
- Relacionamento construído gradualmente
- Ofertas apresentadas no momento certo

### 3. Funcionalidades Avançadas
- **Histórico de Conversas**: Salvo automaticamente
- **Análise de Relacionamento**: Métricas em tempo real
- **Adaptação Contextual**: Baseada no perfil e mercado
- **Logging Completo**: Para análise e melhorias

## 🧪 Testes e Validação

### Estrutura de Testes
```
tests/
├── user-registration.spec.ts    # Testes do formulário de cadastro
├── chat-interface.spec.ts       # Testes da interface de chat
└── ai-behavior.spec.ts          # Testes do comportamento da IA
```

### Validações Implementadas
- ✅ Estrutura do projeto completa
- ✅ Configurações corretas
- ✅ Implementação da persona Leandro Uchoa
- ✅ Sistema de relacionamento gradual
- ✅ Boas práticas de desenvolvimento
- ✅ Testes automatizados funcionando

### Executar Validação Completa
```bash
# 3 iterações de validação automática
node scripts/validate-system.js
```

## 📊 Métricas e Observabilidade

### Logs Estruturados
- **Ações do Usuário**: Cadastro, envio de mensagens
- **Interações com IA**: Requests, responses, métricas
- **Performance**: Tempos de resposta, uso de tokens
- **Erros**: Captura e análise de falhas

### Métricas de Relacionamento
- **Nível de Confiança**: 0-100%
- **Nível de Engajamento**: 0-100%
- **Prontidão para Ofertas**: 0-100%
- **Estágio do Relacionamento**: inicial → desenvolvimento → confiança → parceria

## 🔧 Configurações Avançadas

### Persona Customization
Edite `src/lib/persona-engine.ts` para:
- Adicionar novos exemplos de conversas
- Modificar frases características
- Ajustar detecção de intenções

### Relationship Engine
Edite `src/lib/relationship-engine.ts` para:
- Ajustar algoritmos de confiança
- Modificar critérios de prontidão
- Personalizar estratégias de abordagem

### API Configuration
Edite `src/lib/api-client.ts` para:
- Ajustar timeouts e retries
- Modificar estratégias de backoff
- Configurar logging personalizado

## 📈 Roadmap e Melhorias Futuras

### Próximas Funcionalidades
- [ ] Dashboard de analytics para administradores
- [ ] Integração com CRM externo
- [ ] Suporte a múltiplos idiomas
- [ ] Chatbot voice integration
- [ ] Mobile app nativo

### Otimizações Técnicas
- [ ] Cache inteligente de respostas
- [ ] Compressão de dados
- [ ] CDN para assets estáticos
- [ ] Database para persistência
- [ ] Microservices architecture

## 🤝 Contribuição

### Desenvolvimento
1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente com testes
4. Execute validação completa
5. Submeta pull request

### Testes
- Sempre adicione testes para novas funcionalidades
- Execute `npm run test` antes de commits
- Valide com `node scripts/validate-system.js`

## 📄 Licença

Este projeto é proprietário da Luchoa Revestimentos Naturais.

## 📞 Suporte

Para suporte técnico ou dúvidas sobre implementação:
- Documentação completa no código
- Logs estruturados para debugging
- Testes automatizados para validação

---

**Desenvolvido com ❤️ para Luchoa Revestimentos Naturais**

*Sistema de IA Vendedora baseado na expertise e persona do Leandro Uchoa*
