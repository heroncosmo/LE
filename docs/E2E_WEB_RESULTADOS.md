# E2E – Web Chat (Agente Leandro)

## Como rodar local
1. Backend (porta 8080)
   - uvicorn backend.app:app --host 127.0.0.1 --port 8080 --reload
2. Frontend (porta 3000)
   - python -m http.server 3000 --directory web
3. Acesse http://127.0.0.1:3000

## O que validar manualmente
- Preencher perfil (persona + contexto)
- Ao iniciar, o Agente Leandro deve mandar a primeira mensagem (prospecção)
- Manter diálogo com múltiplas trocas (histórico visível)

## Evidências (Playwright MCP – amostras)
Rodada 1, 3 perfis exemplares:
- Arquiteto BR: saudação consultiva, perguntas antes de propor, sugestão de materiais alinhados; sem robotização
- Distribuidor US: inglês, foco em consistência e landed price; não menciona container sem o usuário
- Marmorista BR: tom humano, padrão exportação, CTA suave para fotos/lotes

Screenshots foram capturados (ambiente MCP) e as transcrições constam no DOM; em execução local, você pode replicar com Playwright (Node) para salvar em `reports/e2e/` do repositório.

## Mudança de UX: exibição progressiva (chunking)
- Implementada em web/app.js, sem alterar backend ou prompt
- Quebra por parágrafos/linhas/sentenças, com delays aleatórios 800–1500ms
- Efeito WhatsApp: múltiplas bolhas do Leandro aparecendo em sequência

## Rodada 1 (amostras MCP Playwright)
- Arquiteto BR: abertura consultiva + 2 trocas (chunking OK)
- Distribuidor US: inglês; sem falar de container sem o usuário (chunking OK)
- Marmorista BR: CTA suave e foco em padrão de lote (chunking OK)
- Distribuidor LATAM: foco preço x qualidade de lote (chunking OK)

## Próximos passos sugeridos
- Automatizar 3 rodadas completas (18 cenários) na UI usando apenas MCP Playwright (sem Node), com screenshots e transcrições no relatório consolidado
- Acrescentar verificador de idioma/unidades por cenário (BR/LATAM pt+m²; US en+sqft) – apenas sinalização ou gate, a definir
- Adicionar botão “Baixar transcrição” no frontend (JSON)



## Correcoes aplicadas (2025-10-02)
- Idioma travado por thread: o assistente agora espelha o idioma da ultima mensagem do cliente e mantem o mesmo durante toda a conversa (en/pt/es). Nao muda sozinho.
- Postura de prospeccao ativa: o Leandro sempre inicia a conversa (outbound). Removidas ambigudades de linguagem reativa do prompt; frontend ja instrui para iniciar a conversa.

## Validacao rapida (MCP Playwright)
- US (Distribuidor US)
  - Abertura: ingles, proativa ("this is Leandro from Luchoa...").
  - Manter idioma: respostas subsequentes permaneceram 100% em ingles.
  - Observacao: sem linguagem de atendimento reativo.
- BR (Marmorista BR)
  - Abertura: portugues, proativa ("Aqui e o Leandro Uchoa, da Luchoa...").
  - Manter idioma: respostas subsequentes permaneceram 100% em portugues.

Evidencias: verificadas via DOM na UI; chunking visivel em ambas execucoes.
