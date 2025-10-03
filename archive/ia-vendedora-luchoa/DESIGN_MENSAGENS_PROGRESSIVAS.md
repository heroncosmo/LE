# 📱 Design Técnico – Mensagens Progressivas (estilo WhatsApp)

Objetivo: transformar respostas longas da IA em **múltiplas mensagens curtas**, com **simulação de digitação** e **ritmo humano**, preservando os rituais da persona.

---

## 1) Diretrizes de Estilo (Persona → WhatsApp)

- 1–2 frases curtas por bolha
- Evitar blocos longos; cortar em pontos naturais (., !, ?, ;, —)
- Tom pessoal, direto, caloroso
- Terminologia da persona (padrão de lote, exclusividade, próximo passo)
- Micro-compromissos em frases curtas: “Te mando as fotos agora?”

---

## 2) Algoritmo de Segmentação (Chunker)

- Entrada: texto completo (stream ou completo)
- Passos:
  1. Normalizar espaços e quebras de linha
  2. Split por sentenças usando regex ([.!?…]+)
  3. Reagrupar sentenças para atingir tamanho alvo (6–18 palavras)
  4. Regras de coalescência:
     - Se < 4 palavras, anexar à próxima
     - Se > 22 palavras, cortar em vírgulas/“—”
  5. Output: lista de chunks curtos

- Timing por chunk: `base 350ms + 40ms * palavras + jitter(±120ms)`
- Máx atraso entre chunks: 2500ms

---

## 3) Pipeline de Streaming (/api/chat)

- Ativar streaming da OpenAI (Responses/Chat Completions stream)
- Bufferizar tokens até formarem frases → alimentar Chunker → emitir
- Protocolo: SSE (text/event-stream) com eventos:
  - `typing:start` | `chunk` | `typing:stop` | `done`
- Idempotência: preservar `requestId` e ordem dos chunks

Exemplo de evento (SSE):
```
:event: chunk
:data: {"requestId":"req_123","part":2,"text":"Não dá pra falar de preço sem falar de padrão de lote."}
```

---

## 4) UI/Front-end

- Mostrar indicador “digitando...” quando `typing:start` chegar
- Cada `chunk` vira **uma nova bolha** (não apenas atualizar a mesma)
- Auto-scroll suave para a última bolha
- Ocultar indicador em `typing:stop`/`done`
- Safari/WebKit: fallback com timers (setTimeout + CSS) se `visibilitychange`

---

## 5) Parâmetros de Configuração

- `NEXT_PUBLIC_CHAT_PROGRESSIVE=1`
- `CHUNK_WORDS_MIN=6`
- `CHUNK_WORDS_MAX=18`
- `CHUNK_DELAY_BASE_MS=350`
- `CHUNK_DELAY_PER_WORD_MS=40`
- `CHUNK_DELAY_JITTER_MS=120`
- `CHUNK_DELAY_CEIL_MS=2500`

---

## 6) Testes E2E (Playwright)

- Deve criar 2–5 bolhas por resposta da IA
- Nenhuma bolha > 180 caracteres
- Delay entre bolhas: 0.5s–2.5s
- Indicador “digitando...” aparece antes do primeiro chunk e some no final
- Safari/WebKit: indicador visível e última bolha renderizada

---

## 7) Telemetria

- Logs por `requestId`:
  - `chunks_total`, `avg_words_per_chunk`, `avg_inter_chunk_ms`
  - `first_token_to_first_chunk_ms`, `total_response_ms`
- Nível info; amostra 100% em dev, 10% em prod

---

## 8) Exemplos (Antes/Depois)

Antes (bloco único):
```
Olá, João! Fico feliz em poder ajudá-lo. Nossa variedade de quartzitos exóticos... (200+ palavras)
```

Depois (progressivo):
```
Olá, João! Tudo bem?

Sou o Leandro, da Luchoa. Prazer te conhecer.

Me conta: como tem sido o mercado por aí nas últimas semanas?
```

Outro exemplo (educação sobre preço):
```
Preço de mármore branco muda conforme o padrão do lote.

É como o vinho: depende do bloco, do polimento e da uniformidade.

Se quiser, separo 2–3 lotes e te mando fotos reais agora.
```

---

## 9) Plano de Implementação

1. Atualizar prompt da persona com diretrizes de mensagens curtas
2. Habilitar streaming na rota `/api/chat`
3. Implementar `sentenceChunker()` e `emitProgressive()`
4. Atualizar front para SSE + múltiplas bolhas
5. Adicionar indicador “digitando...” confiável (incluindo Safari)
6. Instrumentar logs e métricas
7. Escrever testes Playwright de ritmo natural
8. Fazer 3 execuções seguidas (estabilidade) e ajustar parâmetros

---

## 10) Snippets (conceituais)

Chunker (conceitual):
```
function sentenceChunker(text) {
  // split → coalesce → return chunks
}
```

Emissor (conceitual):
```
for (const chunk of chunks) {
  send('chunk', chunk);
  await sleep(delayFor(chunk));
}
```

---

Fim.

