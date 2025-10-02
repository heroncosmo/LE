import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / ".assistant_state.json"
INSTR_PATH = ROOT / "gpt_instructions.txt"
PROFILE_PATH = ROOT / "perfil completot odos dados ia.txt"
EXAMPLES_PATH = ROOT / "gpt_conversation_examples.json"

load_dotenv(ROOT / "backend" / ".env", override=False)
load_dotenv(ROOT / ".env", override=False)

API_KEY = os.getenv("OPENAI_API_KEY")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1")
ASSISTANT_ID = os.getenv("ASSISTANT_ID")
VECTOR_STORE_ID = os.getenv("VECTOR_STORE_ID")

assert API_KEY, "Defina OPENAI_API_KEY em .env ou no ambiente"

client = OpenAI()


def read_text(path: Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def ensure_vector_store() -> str:
    global VECTOR_STORE_ID
    if VECTOR_STORE_ID:
        return VECTOR_STORE_ID
    vs = client.vector_stores.create(name="LeandroKnowledge")
    VECTOR_STORE_ID = vs.id
    return VECTOR_STORE_ID


def upload_file_to_vector_store(vs_id: str, path: Path) -> None:
    if not path.exists():
        print(f"[WARN] Arquivo não encontrado: {path}")
        return
    f = client.files.create(file=open(path, "rb"), purpose="assistants")
    client.vector_stores.files.create(vector_store_id=vs_id, file_id=f.id)
    print(f"[OK] Upload: {path.name} -> vector_store={vs_id}")


def ensure_assistant(instructions: str, vs_id: str) -> str:
    global ASSISTANT_ID
    tools = [
        {"type": "file_search"},
        {"type": "code_interpreter"},
    ]
    if ASSISTANT_ID:
        asst = client.beta.assistants.update(
            assistant_id=ASSISTANT_ID,
            model=MODEL,
            instructions=instructions,
            tools=tools,
            tool_resources={"file_search": {"vector_store_ids": [vs_id]}},
            name="Agente Leandro Uchoa",
        )
        return asst.id
    asst = client.beta.assistants.create(
        name="Agente Leandro Uchoa",
        model=MODEL,
        instructions=instructions,
        tools=tools,
        tool_resources={"file_search": {"vector_store_ids": [vs_id]}},
    )
    return asst.id


def save_state(assistant_id: str, vs_id: str):
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump({"assistant_id": assistant_id, "vector_store_id": vs_id}, f, ensure_ascii=False, indent=2)
    print(f"[OK] Estado salvo em {STATE_PATH}")


def main():
    print("[BOOTSTRAP] Iniciando...")
    instructions = read_text(INSTR_PATH)
    vs_id = ensure_vector_store()

    # Upload perfil e exemplos (se existir)
    upload_file_to_vector_store(vs_id, PROFILE_PATH)
    if EXAMPLES_PATH.exists():
        upload_file_to_vector_store(vs_id, EXAMPLES_PATH)

    assistant_id = ensure_assistant(instructions, vs_id)
    save_state(assistant_id, vs_id)
    print(f"[READY] assistant_id={assistant_id} | vector_store_id={vs_id}")


if __name__ == "__main__":
    main()

