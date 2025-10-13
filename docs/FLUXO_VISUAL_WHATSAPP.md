# 📊 Fluxo Visual: Prospecção via WhatsApp

## 🎯 Visão Geral Simplificada

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   OPERADOR   │ ───▶ │  INTERFACE   │ ───▶ │   BACKEND    │ ───▶ │   WHATSAPP   │
│  (Vendedor)  │      │     WEB      │      │   + IA       │      │   (Cliente)  │
└──────────────┘      └──────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │                      │
       │                     │                      │                      │
       │ 1. Preenche dados   │                      │                      │
       │ ─────────────────▶  │                      │                      │
       │                     │                      │                      │
       │ 2. Clica "Prospecção WhatsApp"             │                      │
       │ ─────────────────▶  │                      │                      │
       │                     │                      │                      │
       │                     │ 3. Envia dados       │                      │
       │                     │ ──────────────────▶  │                      │
       │                     │                      │                      │
       │                     │                      │ 4. IA gera abertura  │
       │                     │                      │ ─────────────────▶   │
       │                     │                      │                      │
       │                     │ 5. Exibe mensagem    │                      │
       │                     │ ◀──────────────────  │                      │
       │                     │                      │                      │
       │                     │                      │                      │
       │                     │                      │ ◀─────────────────   │
       │                     │                      │ 6. Cliente responde  │
       │                     │                      │                      │
       │                     │                      │ 7. IA responde auto  │
       │                     │                      │ ─────────────────▶   │
       │                     │                      │                      │
       │                     │ 8. Polling atualiza  │                      │
       │ ◀─────────────────  │ ◀──────────────────  │                      │
       │ Vê conversa         │                      │                      │
```

---

## 🖥️ Interface do Operador

### Tela Inicial (Antes de Iniciar)

```
┌─────────────────────────────────────────────────────────────┐
│                    🤖 Agente Leandro                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Persona (Quem você é):                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Leandro Uchoa, consultor de vendas da Luchoa...      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Contexto de Venda:                                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Venda de revestimentos naturais (mármore, granito)   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Nome do Cliente:                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ João Silva                                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Número do WhatsApp (E.164):                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ +5511999998888                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────────────────┐    │
│  │ Iniciar Conversa│  │ 📱 Prospecção WhatsApp      │    │
│  └─────────────────┘  └──────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tela de Chat (Após Iniciar)

```
┌─────────────────────────────────────────────────────────────┐
│  ◀ Voltar          🤖 Agente Leandro      [WHATSAPP] 📱     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Assistente:                                      │   │
│  │ Olá João Silva! 👋                                  │   │
│  │                                                     │   │
│  │ Aqui é Leandro Uchoa, da Luchoa Revestimentos.     │   │
│  │ Somos especialistas em pedras naturais...          │   │
│  │                                                     │   │
│  │ Posso te ajudar com algum projeto? 😊              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👤 João Silva:                                      │   │
│  │ Oi! Estou reformando minha cozinha e queria        │   │
│  │ colocar uma bancada de mármore branco.             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🤖 Assistente:                                      │   │
│  │ Que legal! Trabalhamos com várias opções:          │   │
│  │ • Mármore Carrara                                   │   │
│  │ • Mármore Calacatta                                 │   │
│  │ • Mármore Branco Piguês                             │   │
│  │                                                     │   │
│  │ Qual o tamanho da sua bancada? 📏                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐     │
│  │ Digite sua mensagem...                            │ [▶] │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 WhatsApp do Cliente

### O que o cliente vê

```
┌─────────────────────────────────────┐
│  WhatsApp                           │
├─────────────────────────────────────┤
│                                     │
│  Luchoa Revestimentos               │
│  Online                             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Olá João Silva! 👋          │   │
│  │                             │   │
│  │ Aqui é Leandro Uchoa, da    │   │
│  │ Luchoa Revestimentos.       │   │
│  │ Somos especialistas em      │   │
│  │ pedras naturais...          │   │
│  │                             │   │
│  │ Posso te ajudar? 😊         │   │
│  │                      10:30  │   │
│  └─────────────────────────────┘   │
│                                     │
│       ┌─────────────────────────┐  │
│       │ Oi! Estou reformando    │  │
│       │ minha cozinha e queria  │  │
│       │ colocar uma bancada de  │  │
│       │ mármore branco.         │  │
│       │              10:32      │  │
│       └─────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Que legal! Trabalhamos com  │   │
│  │ várias opções:              │   │
│  │ • Mármore Carrara           │   │
│  │ • Mármore Calacatta         │   │
│  │ • Mármore Branco Piguês     │   │
│  │                             │   │
│  │ Qual o tamanho? 📏          │   │
│  │                      10:32  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Digite uma mensagem...      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🔄 Fluxo Técnico Detalhado

### 1️⃣ Início da Conversa

```
OPERADOR                    FRONTEND                    BACKEND                     W-API                    WHATSAPP
   │                           │                           │                           │                          │
   │ Preenche formulário       │                           │                           │                          │
   │ ────────────────────────▶ │                           │                           │                          │
   │                           │                           │                           │                          │
   │ Clica "Prospecção WA"     │                           │                           │                          │
   │ ────────────────────────▶ │                           │                           │                          │
   │                           │                           │                           │                          │
   │                           │ POST /api/whatsapp?op=start                           │                          │
   │                           │ ────────────────────────▶ │                           │                          │
   │                           │                           │                           │                          │
   │                           │                           │ Chama OpenAI GPT          │                          │
   │                           │                           │ ─────────────────────────▶│                          │
   │                           │                           │                           │                          │
   │                           │                           │ ◀─────────────────────────│                          │
   │                           │                           │ Mensagem gerada           │                          │
   │                           │                           │                           │                          │
   │                           │ ◀────────────────────────│                           │                          │
   │ Vê mensagem na tela       │                           │                           │                          │
   │                           │                           │                           │                          │
```

### 2️⃣ Cliente Responde

```
WHATSAPP                    W-API                    WEBHOOK                    IA                    WHATSAPP
   │                           │                           │                           │                          │
   │ Cliente digita resposta   │                           │                           │                          │
   │ ────────────────────────▶ │                           │                           │                          │
   │                           │                           │                           │                          │
   │                           │ POST /api/whatsapp-webhook│                           │                          │
   │                           │ ────────────────────────▶ │                           │                          │
   │                           │                           │                           │                          │
   │                           │                           │ Valida token              │                          │
   │                           │                           │ Carrega histórico         │                          │
   │                           │                           │                           │                          │
   │                           │                           │ Chama OpenAI GPT          │                          │
   │                           │                           │ ────────────────────────▶ │                          │
   │                           │                           │                           │                          │
   │                           │                           │ ◀────────────────────────│                          │
   │                           │                           │ Resposta gerada           │                          │
   │                           │                           │                           │                          │
   │                           │ ◀────────────────────────│                           │                          │
   │                           │ Envia resposta            │                           │                          │
   │                           │                           │                           │                          │
   │ ◀────────────────────────│                           │                           │                          │
   │ Cliente recebe resposta   │                           │                           │                          │
   │                           │                           │                           │                          │
```

### 3️⃣ Polling (Atualização da Interface)

```
FRONTEND                    BACKEND                    STORAGE
   │                           │                           │
   │ A cada 2.5 segundos       │                           │
   │                           │                           │
   │ GET /api/whatsapp?op=poll │                           │
   │ ────────────────────────▶ │                           │
   │                           │                           │
   │                           │ Busca inbox               │
   │                           │ ────────────────────────▶ │
   │                           │                           │
   │                           │ ◀────────────────────────│
   │                           │ Novas mensagens           │
   │                           │                           │
   │ ◀────────────────────────│                           │
   │ { messages: [...] }       │                           │
   │                           │                           │
   │ Atualiza tela             │                           │
   │                           │                           │
```

---

## 🎬 Linha do Tempo de uma Conversa

```
T=0s    │ Operador clica "Prospecção WhatsApp"
        │
T=1s    │ IA gera mensagem de abertura
        │ Mensagem aparece na interface
        │
T=2s    │ Mensagem enviada via W-API
        │
T=3s    │ Cliente recebe mensagem no WhatsApp
        │
T=2.5s  │ 🔄 Polling 1 (nada novo)
T=5s    │ 🔄 Polling 2 (nada novo)
T=7.5s  │ 🔄 Polling 3 (nada novo)
        │
T=30s   │ Cliente responde "Oi! Gostaria de saber mais"
        │
T=30.1s │ Webhook recebe mensagem
        │ IA processa e gera resposta
        │
T=31s   │ Resposta enviada ao cliente
        │
T=32.5s │ 🔄 Polling 4 (encontra nova mensagem!)
        │ Interface atualiza com mensagem do cliente
        │ Interface atualiza com resposta da IA
        │
T=35s   │ 🔄 Polling 5 (nada novo)
T=37.5s │ 🔄 Polling 6 (nada novo)
        │
        │ ... conversa continua ...
```

---

## 📊 Componentes do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         SISTEMA COMPLETO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│  │   FRONTEND   │   │   BACKEND    │   │   STORAGE    │       │
│  │              │   │              │   │              │       │
│  │ • index.html │   │ • whatsapp.js│   │ • Upstash KV │       │
│  │ • app.js     │   │ • webhook.js │   │ • Memória    │       │
│  │ • styles.css │   │ • chat.js    │   │              │       │
│  └──────────────┘   └──────────────┘   └──────────────┘       │
│         │                   │                   │              │
│         └───────────────────┼───────────────────┘              │
│                             │                                  │
│  ┌──────────────────────────┼──────────────────────────────┐  │
│  │                    INTEGRAÇÕES                           │  │
│  │                                                          │  │
│  │  ┌──────────────┐   ┌──────────────┐   ┌────────────┐  │  │
│  │  │   W-API      │   │   OpenAI     │   │  Vercel    │  │  │
│  │  │              │   │              │   │            │  │  │
│  │  │ • Envio      │   │ • GPT-4o     │   │ • Deploy   │  │  │
│  │  │ • Webhook    │   │ • Geração    │   │ • Logs     │  │  │
│  │  │ • Status     │   │ • Contexto   │   │ • Env Vars │  │  │
│  │  └──────────────┘   └──────────────┘   └────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Resumo: 3 Passos Simples

### Para o Operador:

1. **Preencher** → Persona, Contexto, Nome, Telefone
2. **Clicar** → Botão "Prospecção WhatsApp"
3. **Acompanhar** → Conversa acontece automaticamente!

### Para o Cliente:

1. **Receber** → Mensagem de abertura no WhatsApp
2. **Responder** → Normalmente, como qualquer conversa
3. **Conversar** → IA responde automaticamente!

### Para o Sistema:

1. **Gerar** → IA cria mensagens contextualizadas
2. **Enviar** → W-API entrega no WhatsApp
3. **Sincronizar** → Webhook + Polling mantém tudo atualizado

---

**Simples assim! 🚀**
