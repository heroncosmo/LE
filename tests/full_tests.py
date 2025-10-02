import os
import sys
import json
import time
from urllib import request

BASE = os.getenv("BASE_URL", "http://127.0.0.1:8080")

SCENARIOS = [
    {"name": "Prospect BR – arquiteto (primeiro contato)", "msg": "Sou arquiteta no Brasil. Primeiro contato com você."},
    {"name": "Prospect BR – marmorista (primeiro contato)", "msg": "Sou marmorista no Brasil. Primeiro contato contigo."},
    {"name": "Prospect US – distributor (primeiro contato)", "msg": "I'm a US distributor. First contact with you."},
    {"name": "Follow-up BR – marmorista semanal", "msg": "Seguimos naquele projeto? Alguma novidade?"},
    {"name": "Follow-up US – distributor mensal", "msg": "Following up after a month. Any updates on the projects?"},
    {"name": "Arquiteto – cliente achou caro", "msg": "Meu cliente achou caro o material."},
    {"name": "Arquiteto – quer mais opções", "msg": "Meu cliente quer ver mais opções de materiais."},
    {"name": "Marmorista BR – preço alto vs concorrente", "msg": "Seu preço está alto em relação ao concorrente."},
    {"name": "Marmorista BR – fornecedor fixo", "msg": "Eu já tenho fornecedor fixo."},
    {"name": "Marmorista BR – não fecha container", "msg": "Não consigo fechar container agora."},
    {"name": "Distribuidor BR – mercado parado", "msg": "O mercado está parado por aqui."},
    {"name": "Distribuidor BR – preço alto", "msg": "Seus preços estão altos pro meu mercado."},
    {"name": "Distribuidor US – preço alto vs local", "msg": "Your prices are higher than local distributors."},
    {"name": "Distribuidor US – não fecha container", "msg": "We can't close a full container now."},
    {"name": "Distribuidor LATAM – todos buscam preço", "msg": "En mi mercado, todos buscan precio."},
    {"name": "Distribuidor Europa – prefere via Itália", "msg": "Prefiro comprar via Itália, em volume menor."},
    {"name": "Distribuidor Oriente Médio – logística complica", "msg": "A logística complica pra mim."},
    {"name": "Marmorista US/Europa – prefere distribuidor local", "msg": "I prefer to buy from a local distributor."},
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


def validate(name: str, user_msg: str, assistant_msg: str) -> tuple[bool, str]:
    if not assistant_msg:
        return False, "Resposta vazia"
    if BANNED.lower() in assistant_msg.lower():
        return False, "Usou frase proibida"
    # Cenários US não devem mencionar container se o usuário não trouxe
    if "US" in name or "US " in name:
        user_mentioned = "container" in user_msg.lower()
        assistant_mentioned = "container" in assistant_msg.lower()
        if assistant_mentioned and not user_mentioned:
            return False, "Falou de container cedo demais no cenário US (sem o usuário trazer)"
    return True, ""


def run_round(round_id: int) -> list[tuple[str, bool, str]]:
    print(f"\n=== RODADA {round_id} ===")
    results = []
    for sc in SCENARIOS:
        name = sc["name"]
        user_msg = sc["msg"]
        print(f"[TEST] {name}")
        out = call_chat(user_msg)
        msg = out.get("assistant_message", "").strip()
        ok, reason = validate(name, user_msg, msg)
        print(("OK" if ok else "FAIL"), "-", msg[:160].replace("\n", " ") + ("..." if len(msg) > 160 else ""))
        results.append((name, ok, reason))
        time.sleep(1)
    return results


def main():
    if not healthz():
        print("[ERRO] Servidor não está respondendo em /healthz")
        sys.exit(2)

    all_pass = True
    for r in range(1, 4):
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

