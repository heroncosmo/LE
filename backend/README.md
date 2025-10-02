# Backend do Agente Leandro (Assistants API)

Este backend expõe um endpoint mínimo para conversar com o Assistente "Leandro" usando a Assistants API.

## Requisitos
- Python 3.10+
- Variáveis de ambiente (ou .env): veja `.env.example`

## Instalação (requer sua autorização)
1) Crie e ative um virtualenv
2) Instale as dependências:
   pip install -r backend/requirements.txt

## Bootstrap (criar/atualizar o Assistente e Knowledge)
1) Garanta os arquivos na raiz do repo:
   - gpt_instructions.txt
   - perfil completot odos dados ia.txt
   - (opcional) gpt_conversation_examples.json
2) Execute:
   python backend/assistants_bootstrap.py
3) O script salvará `.assistant_state.json` na raiz com `assistant_id` e `vector_store_id`.

## Rodar o servidor
uvicorn backend.app:app --reload --port 8080

## Endpoints
- GET /healthz → status
- POST /chat
  Body JSON:
  {
    "message": "texto do usuário",
    "session_id": "opcional, para manter thread",
    "thread_id": "opcional, se já tiver um id de thread"
  }
  Resposta:
  {
    "assistant_message": "...",
    "thread_id": "...",
    "run_id": "..."
  }

## Notas de arquitetura
- Um thread por usuário/sessão. Se não informar thread_id, o backend cria um novo.
- Polling com timeout e backoff; logs básicos.
- Idempotência: reuso de `assistant_id`/`vector_store_id` via `.assistant_state.json`.

## Calibração
- Siga `TESTES_CALIBRACAO.md` (18 cenários, 3 rodadas). Ajustes no `gpt_instructions.txt` e reexecute o bootstrap.

