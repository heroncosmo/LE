# Prompt Administrativo – Hot‑Reload em Produção (Vercel)

Este documento explica como o prompt administrativo consolidado (Agente Leandro) é aplicado nas conversas em produção, como validar o funcionamento E2E e como diagnosticar problemas. Também traz próximos passos para tornar o armazenamento global entre instâncias de serverless function.

## Visão geral do fluxo

1. Página administrativa `/config?key=MINHACHAVESEGURA` (admin.html/admin.js)
   - Exibe e permite editar o prompt consolidado (`admin_instructions`).
   - Ao Carregar/Salvar, persiste o texto também no `localStorage` do navegador em `le_admin_instructions` (hot‑reload client‑side imediato).
2. UI principal (app.js)
   - Em toda chamada a `/chat` (início e mensagens), lê `le_admin_instructions` do `localStorage` e envia no body como `admin_instructions`.
3. Backend `/api/chat` (api/chat.js)
   - Constrói o system prompt priorizando `req.body.admin_instructions`; se ausente, usa o fallback `admin-config.json`.
4. Simulação (api/simulate-client.js)
   - O cliente virtual tem prompt próprio. Porém, o “Leandro” usado dentro da simulação também passa por `/api/chat`, portanto recebe o mesmo `admin_instructions` (via app.js).

Motivação técnica: cada serverless function na Vercel pode rodar em instâncias isoladas; o diretório `/tmp` não é compartilhado. Logo, salvar `/tmp/admin-config.json` em uma função não garante leitura por outra. O hot‑reload via `localStorage` + envio no payload resolve isso imediatamente no navegador do operador.

## Como usar

1. Acesse `/config?key=MINHACHAVESEGURA`.
2. Clique em “Carregar”.
3. Edite o textarea com TODO o prompt consolidado.
4. Clique em “Salvar” e aguarde o status “Salvo”.
5. Abra `/` e inicie conversa (ou “Simular Conversa”). A mudança é aplicada na primeira resposta do Leandro.

## Validação E2E (3 rodadas)

Usei e recomendo repetir estes testes para confirmação rápida.

### Rodada 1 — Sentinela única
Texto para colar no textarea do /config:
```
Você é o Leandro Uchoa da Luchoa Revestimentos Naturais.
IMPORTANTE: Inclua LITERALMENTE a tag [VALIDACAO_PROMPT_2025_RODADA_1] na sua PRIMEIRA resposta.
Seja breve e direto.
```
Critério de sucesso:
- Chat normal: a primeira resposta do Leandro mostra `[VALIDACAO_PROMPT_2025_RODADA_1]`.
- Simulação: a primeira resposta do Leandro também mostra a sentinela.

### Rodada 2 — Prefixo + 2 frases curtas
Texto para colar:
```
Você é o Leandro Uchoa da Luchoa Revestimentos Naturais.
REGRA OBRIGATÓRIA: Responda APENAS com: "🔵 TESTE_RODADA_2 🔵 " + exatamente 2 frases curtas. Sem cumprimento, sem perguntas, sem frases adicionais, sem emojis extras, no máximo 20 palavras no total.
```
Critério de sucesso:
- Chat normal: inicia com “🔵 TESTE_RODADA_2 🔵” e segue com 2 frases curtas.
- Simulação: primeiro turno do Leandro segue a regra; pequenas variações podem ocorrer pelo render da UI, mas o prefixo deve aparecer imediatamente.

### Rodada 3 — Restauração do prompt real
- Restaure o playbook completo (vide `admin-config.json`).
- Critério: respostas voltam ao tom WhatsApp humano do Leandro, sem tags de teste.

## Troubleshooting

1. Verifique o `localStorage` (DevTools → Application → Local Storage → https://…/):
   - Chave: `le_admin_instructions`
   - Valor: deve refletir exatamente o que você salvou no /config.
2. Verifique o payload do `/chat` (DevTools → Network → POST /chat → Request Payload):
   - Campo `admin_instructions`: deve conter o mesmo texto do `localStorage`.
3. Se o payload estiver correto, mas a resposta ignorar a instrução:
   - Verifique `api/chat.js`: a construção do system prompt deve usar `(req.body.admin_instructions || adminCfg.admin_instructions)`.
4. Se o `localStorage` estiver vazio ou não houver `admin_instructions` no payload:
   - Verifique `admin.js` (salvando no `localStorage` ao Carregar/Salvar) e `app.js` (lendo e incluindo no payload de `/chat`).

## Segurança

- O acesso a `/config` é protegido por chave (`?key=…`) validada no backend (endpoints admin). Configure `ADMIN_KEY` na Vercel.
- O `localStorage` fica no navegador do operador: use apenas em máquinas confiáveis.

## Limitações e próximo passo recomendado

- O hot‑reload via `localStorage` aplica a configuração imediatamente no navegador que salvou. Porém, não é global entre todas as instâncias/usuários.
- Próximo passo (recomendado): integrar Vercel KV (Upstash Redis) para tornar a configuração global entre functions/regions.

### Esboço da integração Vercel KV
- Dependência: `@upstash/redis`
- Envs no Vercel: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `api/admin-config.js`: GET/POST passam a ler/gravar em KV (ex.: chave `le:admin-config`).
- `api/chat.js`: `loadAdminConfig()` lê do KV a cada request (fallback para `admin-config.json`).
- Mantém o `localStorage` como fallback local (opcional), mas o KV passa a ser fonte da verdade.

## Evidências de validação (resumo)

- Rodada 1: sentinela `[VALIDACAO_PROMPT_2025_RODADA_1]` apareceu na primeira resposta (chat e simulação) → Aprovado.
- Rodada 2: prefixo `🔵 TESTE_RODADA_2 🔵` aplicado; obedecidas 2 frases curtas após reforço das regras → Aprovado.
- Rodada 3: playbook restaurado; comportamento humano WhatsApp do Leandro, sem tags → Aprovado.

---
Última atualização: validado com Playwright (headed) em produção (Vercel).
