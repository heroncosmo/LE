import os
import json
import time
from pathlib import Path
from urllib import request

BASE = os.getenv("BASE_URL", "http://127.0.0.1:8080")
ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports"
DOCS = ROOT / "docs"
REPORTS.mkdir(exist_ok=True)
DOCS.mkdir(exist_ok=True)

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

def validate(name: str, user_msg: str, assistant_msg: str) -> tuple[bool, str, dict]:
    metrics = {
        "length": len(assistant_msg or ""),
        "lines": (assistant_msg or "").count("\n") + 1,
        "has_signature": any(s in (assistant_msg or "") for s in [
            "Faz sentido pra você?",
            "Quer que eu te envie as fotos",
            "Deixa eu separar"
        ]),
    }
    if not assistant_msg:
        return False, "Resposta vazia", metrics
    if BANNED.lower() in assistant_msg.lower():
        return False, "Usou frase proibida", metrics
    # EUA: não falar de container se o usuário não trouxe
    if "US" in name or "US " in name:
        user_mentioned = "container" in user_msg.lower()
        assistant_mentioned = "container" in assistant_msg.lower()
        if assistant_mentioned and not user_mentioned:
            return False, "Falou de container cedo demais no cenário US (sem o usuário)", metrics
    return True, "", metrics

def run_round(round_id: int) -> dict:
    items = []
    for sc in SCENARIOS:
        out = call_chat(sc["msg"])  # novo thread por cenário
        msg = out.get("assistant_message", "").strip()
        ok, reason, metrics = validate(sc["name"], sc["msg"], msg)
        items.append({
            "scenario": sc["name"],
            "user": sc["msg"],
            "assistant": msg,
            "ok": ok,
            "reason": reason,
            "metrics": metrics,
        })
        time.sleep(0.5)
    report = {"round": round_id, "items": items}
    (REPORTS / f"round_{round_id}.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return report

def summarize(round_reports: list[dict]) -> dict:
    summary = {"rounds": []}
    for r in round_reports:
        total = len(r["items"])
        passed = sum(1 for it in r["items"] if it["ok"]) 
        failed = total - passed
        summary["rounds"].append({"round": r["round"], "passed": passed, "failed": failed})
    # comparação simples: variação média de tamanho de respostas entre rodadas
    if len(round_reports) >= 2:
        lens = [[it["metrics"]["length"] for it in r["items"]] for r in round_reports]
        deltas = []
        for i in range(1, len(lens)):
            diffs = [abs(lens[i][j] - lens[i-1][j]) for j in range(len(lens[i]))]
            deltas.append(sum(diffs)/len(diffs))
        summary["avg_length_delta_between_rounds"] = sum(deltas)/len(deltas)
    return summary

def write_markdown(round_reports: list[dict], summary: dict):
    lines = []
    lines.append("# Resultados de Validação – Agente Leandro\n")
    lines.append("## Sumário por rodada\n")
    for r in summary["rounds"]:
        lines.append(f"- Rodada {r['round']}: {r['passed']}/{18} aprovados")
    if "avg_length_delta_between_rounds" in summary:
        lines.append(f"\nVariação média de tamanho entre rodadas: {summary['avg_length_delta_between_rounds']:.1f} caracteres\n")
    lines.append("\n## Amostras (excertos)\n")
    for r in round_reports:
        lines.append(f"\n### Rodada {r['round']}\n")
        for it in r["items"][:3]:  # 3 amostras por rodada
            excerpt = it["assistant"][:220].replace("\n", " ") + ("..." if len(it["assistant"])>220 else "")
            status = "OK" if it["ok"] else f"FAIL ({it['reason']})"
            lines.append(f"- {status} — {it['scenario']}: {excerpt}")
    (DOCS / "TESTES_RESULTADOS.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    if not healthz():
        print("[ERRO] Servidor não está respondendo em /healthz")
        raise SystemExit(2)
    round_reports = []
    for r in range(1, 4):
        print(f"Rodando rodada {r}...")
        rr = run_round(r)
        round_reports.append(rr)
        time.sleep(1)
    summary = summarize(round_reports)
    (REPORTS / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(round_reports, summary)
    print("Concluído. Relatórios em reports/ e docs/TESTES_RESULTADOS.md")

if __name__ == "__main__":
    main()

