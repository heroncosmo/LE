# 🚀 Guia Completo: Como Usar a Prospecção via WhatsApp

Este guia mostra passo a passo como configurar e usar a integração WhatsApp para prospecção de clientes.

---

## 📋 PARTE 1: Configuração Inicial (Fazer 1 vez)

### Passo 1.1: Configurar Variáveis de Ambiente no Vercel

1. **Acesse o Vercel Dashboard**:
   - Vá para https://vercel.com
   - Entre no seu projeto "persona leandro"

2. **Navegue até Settings → Environment Variables**:
   - Clique na aba "Settings" no menu superior
   - No menu lateral, clique em "Environment Variables"

3. **Adicione as seguintes variáveis** (uma por vez):

   | Nome da Variável | Valor | Ambiente |
   |-----------------|-------|----------|
   | `WAPI_BASE_URL` | `https://api.w-api.app/v1` | Production, Preview, Development |
   | `WAPI_INSTANCE_ID` | `LJ0I5H-XXXY4M-0STRA1` | Production, Preview, Development |
   | `WAPI_TOKEN` | `zBrUGRJ1mpwD8U0q4fnoCl5nrCfNIJUeE` | Production, Preview, Development |
   | `WAPI_WEBHOOK_VERIFY_TOKEN` | `meu_token_secreto_123` | Production, Preview, Development |
   | `OPENAI_API_KEY` | `sk-proj-NMs52ztxh34AHj...` | Production, Preview, Development |

   **⚠️ IMPORTANTE**: 
   - Para `WAPI_WEBHOOK_VERIFY_TOKEN`, escolha um token secreto qualquer (ex: `meu_token_secreto_123`)
   - Anote esse token, você vai usar no próximo passo!

4. **Clique em "Save"** após adicionar cada variável

5. **Faça um novo deploy**:
   - Vá para a aba "Deployments"
   - Clique nos 3 pontinhos do último deployment
   - Clique em "Redeploy"
   - Aguarde o deploy finalizar (1-2 minutos)

---

### Passo 1.2: Configurar Webhook no Painel W-API

1. **Acesse o Painel W-API**:
   - Vá para https://painel.w-api.app
   - Faça login com suas credenciais

2. **Localize sua instância**:
   - Na tela inicial, você verá sua instância `LJ0I5H-XXXY4M-0STRA1`
   - Clique no ícone de **engrenagem (⚙️)** ou "Configurações"

3. **Configure o Webhook**:
   - Clique na aba **"Configurar webhooks"**
   - Você verá 3 campos:

   **Campo 1: "Ao receber uma mensagem"** (OBRIGATÓRIO):
   ```
   https://seu-dominio.vercel.app/api/whatsapp-webhook?token=meu_token_secreto_123
   ```
   
   **Substitua**:
   - `seu-dominio.vercel.app` → pelo domínio real do seu projeto Vercel
   - `meu_token_secreto_123` → pelo token que você definiu no Passo 1.1

   **Exemplo real**:
   ```
   https://persona-leandro.vercel.app/api/whatsapp-webhook?token=meu_token_secreto_123
   ```

   **Campo 2: "Presença do chat"** (OPCIONAL):
   - Pode deixar em branco por enquanto

   **Campo 3: "Receber status da mensagem"** (OPCIONAL):
   - Pode deixar em branco por enquanto

4. **Clique em "Salvar alterações"**

5. **Verifique se o WhatsApp está conectado**:
   - Na tela da instância, deve aparecer "Conectado" ou "Online"
   - Se não estiver, escaneie o QR Code com seu WhatsApp Business

---

### Passo 1.3: Testar a Conexão

Antes de usar a interface, vamos testar se tudo está funcionando:

**Teste 1: Status da Instância**
```bash
curl "https://seu-dominio.vercel.app/api/whatsapp?op=status"
```

**Resultado esperado**:
```json
{
  "success": true,
  "status": {
    "profileName": "Seu Nome",
    "phone": "5511999998888"
  }
}
```

**Teste 2: Envio Manual**
```bash
curl -X POST "https://seu-dominio.vercel.app/api/whatsapp?op=send" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+5511999998888", "text": "Teste de conexão"}'
```

**Resultado esperado**:
- Mensagem "Teste de conexão" chega no WhatsApp do número informado
- Resposta JSON: `{"success": true}`

✅ **Se ambos os testes funcionaram, você está pronto para usar a interface!**

---

## 🎯 PARTE 2: Como Usar a Interface (Operador/Vendedor)

### Passo 2.1: Acessar a Interface

1. Abra o navegador e acesse:
   ```
   https://seu-dominio.vercel.app
   ```

2. Você verá a tela inicial com os campos:
   - **Persona**
   - **Contexto de Venda**
   - **Nome do Cliente**
   - **Número do WhatsApp (E.164)**
   - **Modelo de IA** (opcional)

---

### Passo 2.2: Preencher os Dados da Prospecção

**Exemplo prático de preenchimento**:

1. **Persona** (Quem é você na conversa):
   ```
   Leandro Uchoa, consultor de vendas da Luchoa Revestimentos Naturais. 
   Sou especialista em pedras naturais e revestimentos de alta qualidade. 
   Tenho 15 anos de experiência no mercado e ajudo clientes a transformar 
   seus ambientes com elegância e sofisticação.
   ```

2. **Contexto de Venda** (Sobre o que você vai falar):
   ```
   Venda de revestimentos naturais (mármore, granito, quartzito) para 
   projetos residenciais e comerciais. Oferecemos consultoria gratuita, 
   visita técnica e orçamento personalizado. Trabalhamos com as melhores 
   marcas do mercado e temos pronta entrega.
   ```

3. **Nome do Cliente**:
   ```
   João Silva
   ```

4. **Número do WhatsApp (E.164)**:
   ```
   +5511999998888
   ```
   
   **⚠️ FORMATO IMPORTANTE**:
   - Sempre começar com `+` (sinal de mais)
   - Código do país (55 para Brasil)
   - DDD (11, 21, 47, etc.)
   - Número com 9 dígitos
   - **SEM espaços, parênteses ou traços**
   
   **Exemplos corretos**:
   - ✅ `+5511999998888`
   - ✅ `+5521987654321`
   - ✅ `+5547988776655`
   
   **Exemplos ERRADOS**:
   - ❌ `11999998888` (falta + e código do país)
   - ❌ `+55 11 99999-8888` (tem espaços e traço)
   - ❌ `+55(11)99999-8888` (tem parênteses)

5. **Modelo de IA** (opcional):
   - Deixe em branco ou escolha `gpt-4o` para melhor qualidade

---

### Passo 2.3: Iniciar a Prospecção

1. **Clique no botão "Prospecção WhatsApp"** (botão verde/azul)

2. **O que acontece imediatamente**:
   - ✅ A tela muda para o chat
   - ✅ Aparece um badge **"WHATSAPP"** no topo (indicando modo WhatsApp)
   - ✅ A IA gera uma mensagem de abertura personalizada
   - ✅ A mensagem aparece na tela (efeito de digitação)
   - ✅ A mensagem é enviada para o WhatsApp do cliente

3. **Exemplo de mensagem de abertura gerada**:
   ```
   Olá João Silva! 👋

   Aqui é Leandro Uchoa, da Luchoa Revestimentos Naturais. 
   
   Vi que você pode estar interessado em revestimentos de alta 
   qualidade para seu projeto. Trabalhamos com mármore, granito 
   e quartzito das melhores marcas do mercado.
   
   Posso te ajudar com alguma dúvida ou fazer um orçamento 
   personalizado? 😊
   ```

4. **Verificação**:
   - Abra o WhatsApp do número que você informou
   - A mensagem deve ter chegado!

---

### Passo 2.4: Acompanhar a Conversa

**Na interface web**:

1. **Badge "WHATSAPP"** no topo indica que você está em modo WhatsApp

2. **Polling automático**:
   - A cada 2.5 segundos, a interface busca novas mensagens
   - Mensagens do cliente aparecem automaticamente na tela

3. **Você pode**:
   - **Enviar mensagens manuais**: Digite no campo de texto e clique "Enviar"
   - **Ver histórico completo**: Todas as mensagens ficam salvas

**No WhatsApp do cliente**:

1. O cliente recebe a mensagem de abertura
2. Quando ele responde, acontece:
   - ✅ Webhook recebe a mensagem
   - ✅ IA analisa o contexto e gera resposta
   - ✅ Resposta é enviada automaticamente para o cliente
   - ✅ Resposta aparece na interface web (via polling)

---

## 🔄 PARTE 3: Fluxo Técnico Completo (Bastidores)

### 3.1: O que acontece quando você clica "Prospecção WhatsApp"

```
┌─────────────────────────────────────────────────────────────┐
│ 1. FRONTEND (app.js)                                        │
│    - Captura dados do formulário                            │
│    - Valida telefone (formato E.164)                        │
│    - Chama: POST /api/whatsapp?op=start                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND (api/whatsapp.js)                                │
│    - Recebe: { phone, persona, context, client_name }       │
│    - Chama função generateReply() do api/chat.js            │
│    - Instrução: "start_prospecting"                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. IA (OpenAI GPT)                                          │
│    - Recebe persona + contexto + nome do cliente            │
│    - Gera mensagem de abertura personalizada                │
│    - Retorna texto da mensagem                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ENVIO W-API (api/whatsapp.js → wapiSendText)            │
│    - URL: https://api.w-api.app/v1/message/send-text       │
│    - Headers: Authorization: Bearer {TOKEN}                 │
│    - Body: { phone: "5511999998888", message: "..." }      │
│    - Retry: 3 tentativas com backoff exponencial            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. WHATSAPP DO CLIENTE                                      │
│    - Cliente recebe a mensagem                              │
│    - Mensagem aparece como vindo do seu número WhatsApp     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PERSISTÊNCIA (Upstash KV ou memória)                    │
│    - Salva histórico da conversa                            │
│    - Salva mensagem no inbox para polling                   │
│    - Key: wa:conv:{phone} e wa:inbox:{phone}                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. FRONTEND (app.js → pollWhatsAppInbox)                   │
│    - A cada 2.5s busca: GET /api/whatsapp?op=poll           │
│    - Exibe novas mensagens na tela                          │
│    - Badge "WHATSAPP" permanece visível                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2: O que acontece quando o cliente responde

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENTE RESPONDE NO WHATSAPP                             │
│    Exemplo: "Olá! Gostaria de saber preços de mármore"     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. W-API ENVIA WEBHOOK                                      │
│    POST /api/whatsapp-webhook?token=meu_token_secreto_123   │
│    Body: { from: "5511999998888", text: "..." }            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WEBHOOK RECEIVER (api/whatsapp-webhook.js)              │
│    - Valida token de segurança                              │
│    - Extrai phone e text do payload                         │
│    - Carrega histórico da conversa                          │
│    - Adiciona mensagem do cliente ao histórico              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. IA GERA RESPOSTA (OpenAI GPT)                           │
│    - Contexto: persona + histórico completo                 │
│    - Gera resposta contextualizada                          │
│    Exemplo: "Ótimo! Temos várias opções de mármore..."     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ENVIO AUTOMÁTICO DA RESPOSTA                            │
│    - Envia resposta via W-API para o cliente               │
│    - Salva no histórico e inbox                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CLIENTE RECEBE RESPOSTA NO WHATSAPP                      │
│    - Resposta chega em segundos                             │
│    - Conversa continua naturalmente                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. INTERFACE WEB ATUALIZA (via polling)                    │
│    - Mensagem do cliente aparece na tela                    │
│    - Resposta da IA aparece na tela                         │
│    - Operador pode acompanhar em tempo real                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💬 PARTE 4: Exemplo Completo de Conversa

### Dados de Entrada

```
Persona: Leandro Uchoa, consultor de vendas da Luchoa Revestimentos
Contexto: Venda de revestimentos naturais (mármore, granito, quartzito)
Nome do Cliente: João Silva
Telefone: +5511999998888
```

### Conversa Completa

**[ABERTURA - Gerada pela IA e enviada automaticamente]**
```
Olá João Silva! 👋

Aqui é Leandro Uchoa, da Luchoa Revestimentos Naturais.

Somos especialistas em pedras naturais de alta qualidade - mármore, 
granito e quartzito para projetos residenciais e comerciais.

Posso te ajudar com algum projeto ou tirar dúvidas sobre nossos 
produtos? Oferecemos consultoria gratuita e orçamento personalizado! 😊
```

**[CLIENTE RESPONDE]**
```
Oi Leandro! Estou reformando minha cozinha e queria colocar uma 
bancada de mármore. Vocês trabalham com mármore branco?
```

**[IA RESPONDE AUTOMATICAMENTE]**
```
Que legal, João! Reforma de cozinha é sempre empolgante! 🏠

Sim, trabalhamos com várias opções de mármore branco:

• Mármore Carrara - clássico italiano, com veios cinza suaves
• Mármore Calacatta - mais exclusivo, veios marcantes
• Mármore Branco Piguês - nacional, ótimo custo-benefício

Qual o tamanho aproximado da sua bancada? E você prefere um 
visual mais clean ou com veios mais marcantes?

Posso agendar uma visita técnica gratuita para tirar medidas 
e mostrar amostras! 📏
```

**[CLIENTE RESPONDE]**
```
A bancada tem uns 3 metros. Prefiro algo mais clean, sem muitos 
veios. Quanto fica mais ou menos?
```

**[IA RESPONDE AUTOMATICAMENTE]**
```
Perfeito! Para 3 metros com visual clean, recomendo o Carrara ou 
o Branco Piguês.

Valores aproximados (incluindo material + instalação):
• Branco Piguês: R$ 4.500 a R$ 5.500
• Carrara Italiano: R$ 7.000 a R$ 8.500

Os valores variam conforme espessura (2cm ou 3cm) e acabamento.

Posso agendar uma visita para:
1. Tirar medidas exatas
2. Mostrar amostras físicas
3. Fazer orçamento detalhado

Qual seu bairro? Atendemos toda a região! 📍
```

**[OPERADOR PODE INTERVIR MANUALMENTE]**
```
[Se necessário, o operador pode enviar mensagens manuais 
digitando no campo de texto da interface]
```

---

## ✅ PARTE 5: Checklist de Verificação

Antes de usar em produção, verifique:

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Webhook configurado no painel W-API
- [ ] WhatsApp conectado na instância W-API
- [ ] Teste de status funcionando (curl)
- [ ] Teste de envio manual funcionando (curl)
- [ ] Interface acessível via navegador
- [ ] Badge "WHATSAPP" aparece ao iniciar conversa
- [ ] Mensagem de abertura chega no WhatsApp
- [ ] Respostas do cliente chegam via webhook
- [ ] IA gera respostas automáticas
- [ ] Polling atualiza a interface

---

## 🆘 Problemas Comuns e Soluções

### Problema 1: "W-API send URL not configured"
**Solução**: Verifique se `WAPI_BASE_URL` e `WAPI_INSTANCE_ID` estão configurados no Vercel

### Problema 2: Mensagem não chega no WhatsApp
**Solução**: 
- Verifique se o WhatsApp está conectado no painel W-API
- Verifique se o telefone está no formato correto (+5511999998888)
- Veja os logs no Vercel (aba "Logs")

### Problema 3: Webhook não recebe mensagens
**Solução**:
- Verifique se a URL do webhook está correta no painel W-API
- Verifique se o token no webhook bate com `WAPI_WEBHOOK_VERIFY_TOKEN`
- Teste o webhook manualmente com curl

### Problema 4: IA não responde
**Solução**:
- Verifique se `OPENAI_API_KEY` está configurada
- Veja os logs no Vercel para erros da OpenAI
- Verifique se há créditos na conta OpenAI

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Vercel (aba "Logs")
2. Teste os endpoints manualmente com curl
3. Consulte a documentação técnica em `docs/WHATSAPP_WAPI.md`

---

**Pronto! Agora você está pronto para prospectar clientes via WhatsApp! 🚀**
