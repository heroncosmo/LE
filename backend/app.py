import asyncio
import json
import os
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / "backend" / ".env", override=False)
load_dotenv(ROOT / ".env", override=False)

API_KEY = os.getenv("OPENAI_API_KEY")
if not API_KEY:
    raise RuntimeError("Defina OPENAI_API_KEY no ambiente ou .env")

STATE_PATH = ROOT / ".assistant_state.json"
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")
PORT = int(os.getenv("PORT", "8080"))

client = OpenAI()
app = FastAPI(title="Agente Leandro API")
# CORS para frontend em localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    thread_id: Optional[str] = None


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


def load_state():
    if not STATE_PATH.exists():
        raise RuntimeError("Arquivo .assistant_state.json não encontrado. Rode o bootstrap primeiro.")
    data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    if not data.get("assistant_id"):
        raise RuntimeError("assistant_id ausente no estado.")
    return data


async def poll_run(thread_id: str, run_id: str, timeout_s: int = 90) -> None:
    start = time.time()
    while True:
        run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run_id)
        status = run.status
        if status in ("completed", "failed", "cancelled", "expired"):
            if status != "completed":
                raise HTTPException(500, f"Run terminou com status={status}")
            return
        if time.time() - start > timeout_s:
            client.beta.threads.runs.cancel(thread_id=thread_id, run_id=run_id)
            raise HTTPException(504, "Timeout aguardando a resposta do Assistente")
        await asyncio.sleep(1)


@app.post("/chat")
async def chat(req: ChatRequest):
    state = load_state()
    assistant_id = state["assistant_id"]

    # Thread
    thread_id = req.thread_id
    if not thread_id:
        th = client.beta.threads.create()
        thread_id = th.id

    # Mensagem do usuário
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=req.message,
    )

    # Executa
    run = client.beta.threads.runs.create(thread_id=thread_id, assistant_id=assistant_id)
    await poll_run(thread_id, run.id)

    # Coleta última resposta do assistente
    msgs = client.beta.threads.messages.list(thread_id=thread_id, order="desc", limit=5)
    assistant_msg = None
    for m in msgs.data:
        if m.role == "assistant":
            # Conteúdo pode vir em múltiplas partes (texto, blobs etc.)
            parts = []
            for c in m.content:
                if c.type == "text":
                    parts.append(c.text.value)
            assistant_msg = "\n\n".join(parts) if parts else None
            break

    if not assistant_msg:
        raise HTTPException(500, "Não foi possível obter a resposta do assistente")

    return {"assistant_message": assistant_msg, "thread_id": thread_id, "run_id": run.id}

