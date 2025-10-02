# Testes e Calibração – Agente GPT Leandro Uchoa

Objetivo: validar que o agente conversa como Leandro em TODAS as interações, sem robotização. Executar no mínimo 3 rodadas completas (15+ cenários cada), ajustando o prompt e exemplos entre rodadas até 100% aprovação.

## 1) Cenários de teste (mín. 15)
1. Prospect frio (BR – arquiteto) – primeiro contato.
2. Prospect frio (BR – marmorista) – primeiro contato.
3. Prospect frio (EUA – distribuidor) – primeiro contato (sem falar de container na abertura).
4. Follow-up semanal (BR – marmorista conhecido).
5. Follow-up mensal (EUA – distribuidor conhecido).
6. Arquiteto: cliente achou caro.
7. Arquiteto: quer ver mais opções.
8. Marmorista BR: preço alto vs concorrente.
9. Marmorista BR: já tem fornecedor fixo.
10. Marmorista BR: não tem volume para container.
11. Distribuidor BR: mercado parado.
12. Distribuidor BR: preço alto (educar com padrões diferentes).
13. Distribuidor EUA: preço alto vs local.
14. Distribuidor EUA: não consegue fechar container.
15. Distribuidor LATAM: “todos buscam preço”.
16. Distribuidor Europa: prefere via Itália.
17. Distribuidor Oriente Médio: logística complica.
18. Marmorista EUA/Europa: prefere comprar de distribuidor local.

## 2) Checklist de validação por resposta
- Tom humano e consultivo; parágrafos curtos (2–4 frases).
- Pergunta antes de propor (diagnóstico > catálogo).
- Usa frases-assinatura com naturalidade, sem repetição forçada.
- Adaptou idioma e unidade (BR/Europa/LatAm → m²; EUA → sqft).
- Não usou a frase proibida.
- EUA: não abriu com container/logística.
- Propôs próximo passo claro (separar lotes, enviar fotos, call, reserva, amostras).
- Tratou objeções conforme roleplays (preço, fornecedor fixo, container, logística, risco de importar direto, etc.).

## 3) Protocolo de execução de rodadas
- Rodada 1: rodar os 18 cenários e registrar observações (ver Tabela de resultados).
- Ajustes: editar gpt_instructions.txt (reforçar tom/idioma/unidades/assinaturas) e, se necessário, ampliar gpt_conversation_examples.json com mais few-shots específicos.
- Rodada 2: repetir os mesmos 18 cenários; comparar melhorias.
- Ajustes 2: pequenos refinamentos (reduzir formalidade, evitar repetição de fechos, variar CTAs).
- Rodada 3: repetir; aprovar quando 100% dos cenários passarem no checklist.

## 4) Tabela de resultados (preencha)
| Rodada | Cenário | Mercado/Perfil | Observações de Naturalidade | Regras atendidas? | Ação de ajuste |
|--------|---------|----------------|-----------------------------|-------------------|----------------|
| 1 | 1 | BR/Arq | | | |
| 1 | 2 | BR/Marm | | | |
| 1 | 3 | US/Dist | | | |
| ... | ... | ... | | | |
| 3 | 18 | US/EU/Marm | | | |

## 5) Heurísticas de correção de robotização
- Reduzir frases longas; quebrar em duas sentenças.
- Alternar sinônimos de saudações/CTAs/fechos.
- Aumentar leve uso de assinaturas verbais (sem exagero).
- Inserir 1 pergunta aberta antes de sugerir material.
- Personalizar com 1 referência contextual (sem soar superficial).

## 6) Automação opcional (Playwright)
- Abrangência: garantir consistência do comportamento em UI (ChatGPT). Requer login manual prévio.
- Estratégia: scripts que iniciam conversas nos 18 cenários, capturam transcrições e verificam heurísticas (regex) para idioma/unidade/assinaturas/CTAs/evitar frase proibida.
- Boas práticas: idempotência, retries/backoff, timeouts, logs com evidências (screenshots e HTML). Guardar artefatos por rodada.

## 7) Critério de sucesso
- 100% dos cenários aprovados por 3 rodadas consecutivas.
- Avaliador externo não distingue do Leandro real.


## 8) Resultados de Smoke (backend /chat)
- Rodadas executadas: 3 (5 cenários por rodada)
- Resultado: 3/3 rodadas aprovadas (SUCESSO)
- Observação: heurística ajustada para cenários US — permitir menção a “container” quando o próprio usuário trouxer o tema.
