import os
import sys
import json
import time
from urllib import request, parse

BASE = os.getenv("BASE_URL", "http://127.0.0.1:8080")

SCENARIOS = [
    {"name": "BR marmorista - preco alto", "msg": "Sou marmorista no Brasil. Seu preco esta alto comparado ao concorrente."},
    {"name": "US distributor - prices high", "msg": "I'm a US distributor. Your prices are higher than some local distributors."},
    {"name": "US distributor - cannot close container", "msg": "We can't close a full container right now."},
    {"name": "BR arquiteto - quer mais opcoes", "msg": "Sou arquiteta e meu cliente quer ver mais opcoes."},
    {"name": "LATAM distribuidor - todos buscam preco", "msg": "En mi mercado todos buscan precio."},
]

BANNED = "A gente só fecha negócio se fizer sentido pros dois lados. Combinado?"


def call_chat(message: str, thread_id: str | None = None) -> dict:
    payload = {"message": message}
    if thread_id:
        payload["thread_id"] = thread_id
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        BASE + "/chat",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with request.urlopen(req, timeout=120) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body)


def healthz() -> bool:
    try:
        with request.urlopen(BASE + "/healthz", timeout=10) as resp:
            return resp.status == 200
    except Exception:
        return False


def run_round(round_id: int) -> list[tuple[str, bool, str]]:
    print(f"\n=== RODADA {round_id} ===")
    results = []
    for sc in SCENARIOS:
        name = sc["name"]
        print(f"[TEST] {name}")
        out = call_chat(sc["msg"])  # novo thread por cenário
        msg = out.get("assistant_message", "").strip()
        ok = True
        reason = ""
        if not msg:
            ok = False
            reason = "Resposta vazia"
        if BANNED.lower() in msg.lower():
            ok = False
            reason = "Usou frase proibida"
        # Heurística: cenário US não deve abrir falando de container
        if ("US" in name or "US " in name):
            user_mentioned_container = "container" in sc["msg"].lower()
            assistant_mentioned_container = "container" in msg.lower()
            if assistant_mentioned_container and not user_mentioned_container:
                ok = False
                reason = "Falou de container cedo demais no cenário US (sem o usuário trazer)"
        print(("OK" if ok else "FAIL"), "-", msg[:160].replace("\n", " ") + ("..." if len(msg) > 160 else ""))
        results.append((name, ok, reason))
        time.sleep(1)
    return results


def main():
    if not healthz():
        print("[ERRO] Servidor não está respondendo em /healthz")
        sys.exit(2)

    all_pass = True
    for r in range(1, 4):  # 3 rodadas
        results = run_round(r)
        fails = [x for x in results if not x[1]]
        if fails:
            all_pass = False
            print("[RODADA FALHAS]", fails)
        time.sleep(2)

    print("\n==> SUCESSO" if all_pass else "\n==> FALHAS DETECTADAS")
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()

