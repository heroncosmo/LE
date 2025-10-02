# IA Vendedora – Leandro Uchoa (Mensagens de Abertura)

Este módulo implementa geração de mensagens iniciais únicas, contextuais e alinhadas ao perfil do Agente Leandro Uchoa, com base no arquivo de perfil e regras operacionais.

## Estrutura
- ai_vendedora/leandro_profile.json: instruções estruturadas (persona, mercados, CTAs, fechos, frases assinatura, frases proibidas)
- ai_vendedora/generator.py: gerador de mensagens de abertura
- tests/run_tests.py: teste auto-contido (3 rodadas)

## Uso rápido
```python
from ai_vendedora.generator import generate_opening_message

msg = generate_opening_message({
  "name": "Tiago",
  "role": "marmorista",
  "market": "BR",
  "language": "pt"
}, seed=123)
print(msg)
```

## Decisões técnicas
- Mensagem 100% contextual: saudações, ganchos por mercado/role, CTA suave e fecho elegante
- Variação humana: combinações estocásticas com seed (reprodutível) e sem templates fixos
- Regras fortes:
  - Frase proibida removida automaticamente
  - EUA: evitar container/logistics na abertura
  - Idioma por mercado, com override por contato
- Observabilidade: retorno inclui meta (mercado, idioma, seed, greeting, CTA)

## Testes (3 rodadas)
- Execução: `python tests/run_tests.py`
- Validações:
  - Unicidade entre seeds
  - Saudações por idioma
  - Respeito a restrições dos EUA
  - Ausência de frases proibidas

## Calibração
- Ajuste de persona/mercados no JSON: CTAs, ganchos por papel (role), variações de saudação
- Forçar tom mais consultivo: aumentar probabilidade de `language_signatures`
- Reduzir/elevar formalidade: editar frases no JSON

## Integração
- Backend: use `generate_opening_message(contact, seed)` antes do primeiro turno
- CRM: passar `seed` como hash do contato para variação consistente
- Multilingue: defina `language` no contato quando necessário

