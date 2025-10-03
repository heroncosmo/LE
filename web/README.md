# IA Vendedora — Leandro Uchoa (Frontend estático + Vercel Function com Chat Completions)

Este projeto publica a pasta `web/` no Vercel (site estático) e expõe a função serverless `web/api/chat.js`, que usa OpenAI Chat Completions enviando:
- System prompt da persona do Leandro (extraído do arquivo "perfil completot odos dados ia.txt")
- Histórico de conversação mantido no frontend (últimas 16 mensagens)

Resultado: respostas rápidas (1–3s) com persona fiel e exibição progressiva (chunking) simulando digitação humana.

---

## Estrutura
- `web/index.html` — UI: perfil do cliente (persona + contexto), chat, follow-up
- `web/styles.css` — estilos
- `web/app.js` — lógica de UI, histórico, chunking e chamadas ao backend
- `web/api/chat.js` — Vercel Function (Node) chamando `/v1/chat/completions`
- `web/vercel.json` — rewrite: `/chat` → `/api/chat`

---

## Como funciona
1. Usuário acessa a URL (Vercel) → preenche persona e contexto → clica "Iniciar Conversa".
2. O frontend monta uma mensagem inicial de prospecção ativa e envia `message` + `conversation_history` para `/chat` (rewrite para `/api/chat`).
3. A função serverless compõe `[system(persona Leandro), ...history, user(message)]` e chama OpenAI Chat Completions.
4. O frontend recebe a resposta completa e exibe progressivamente (frase a frase), com pequenos delays.

---

## Configuração no Vercel
- Project → Settings
  - Root Directory: `web`
  - Framework Preset: `Other`
  - Build Command: vazio
  - Output Directory: `.`
- Environment Variables
  - `OPENAI_API_KEY` = sua chave
  - `OPENAI_MODEL` = `gpt-4o-mini` (opcional; bom custo/latência)
- Rewrites (já no repo)
  - `web/vercel.json`: `{ "rewrites": [ { "source": "/chat", "destination": "/api/chat" } ] }`

---

## Persona e System Prompt
O system prompt em `web/api/chat.js` foi estruturado a partir de "perfil completot odos dados ia.txt", cobrindo:
- Identidade/estilo do Leandro; prospecção ativa; linguagem travada por thread (espelhar idioma do cliente)
- Rituais: abertura relacional + perguntas abertas; exploração; provas com fotos/vídeos reais; microcompromissos
- Regras por mercado (BR/LATAM, EUA, Europa, Oriente Médio/Ásia); unidades: sqft (EUA), m² (BR/resto)
- Negociação: preço varia por padrão de lote; containers; part-lot em último caso
- Linguagem/CTAs (usar com parcimônia): “Faz sentido pra você?”, “Posso te mandar 2–3 lotes…”, “Quer fotos reais agora?”, “Deixa eu separar algo...”
- Follow-up contextual com próximo passo simples (cadências por mercado)

Ajustes de tom podem ser feitos editando a função `buildSystemPrompt()`.

---

## Chunking progressivo (frontend)
- `splitIntoChunks(text)`: quebrar por parágrafos, linhas ou sentenças
- `displayAssistantProgressive(fullText)`: renderiza chunk a chunk com delays aleatórios (800–1500ms)
- Mantém experiência humana mesmo sem streaming

---

## Testes E2E (Playwright)
Arquivos de teste estão em `tests/e2e/leandro.spec.ts` (paramétrico: 18 cenários × 3 rodadas). Para executar localmente:

1. Autorize instalar dependências e browsers do Playwright (requer internet):
   - `npm init -y`
   - `npm i -D @playwright/test`
   - `npx playwright install`
2. Defina a URL do Vercel em variável de ambiente:
   - PowerShell: `$env:E2E_BASE_URL="https://<seu-projeto>.vercel.app"`
3. Execute:
   - `npx playwright test -c tests/e2e`

Obs.: Os testes não executam chamadas locais — eles navegam no domínio do Vercel (produção/preview).

---

## Troubleshooting
- 401/403 na Function: verifique `OPENAI_API_KEY` no Vercel
- Respostas lentas: use `gpt-4o-mini` ou reduza histórico (app.js mantém no máx. 16 mensagens)
- Tom robótico: revise `buildSystemPrompt()` para reduzir CTAs/fórmulas repetidas
- Idioma trocando sozinho: reforce no prompt a regra de “language lock por thread”

---

## Próximos passos
- (Opcional) Persistir histórico com `localStorage` ou KV (para sobreviver a refresh)
- (Opcional) Criar testes extras por persona real de clientes
- (Opcional) Arquivar `ia-vendedora-luchoa/` em `archive/` para limpar o repo

