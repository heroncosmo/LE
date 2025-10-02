import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ai_vendedora.generator import LeandroOpeningGenerator


def assert_unique(messages):
    assert len(set(messages)) == len(messages), "Messages should be unique across seeds"


def assert_no_banned(text):
    banned = ["A gente só fecha negócio se fizer sentido pros dois lados. Combinado?"]
    for b in banned:
        assert b not in text


def assert_language_expectations(text, lang):
    if lang == "pt":
        must_have_any = ["Bom dia", "Boa tarde", "Oi!"]
    elif lang == "en":
        must_have_any = ["Good morning", "Hi there", "Hello"]
    else:
        must_have_any = ["Buen día", "Hola"]
    assert any(s in text for s in must_have_any), f"Greeting missing for lang={lang}"


def assert_us_constraints(text, market):
    if market == "US":
        lower = text.lower()
        assert "container" not in lower and "logistic" not in lower, "US opener must avoid container/logistics"


def run_round(generator, cases):
    ok = 0
    for i, case in enumerate(cases):
        seed_msgs = []
        for seed in (111, 222, 333):
            msg = generator.generate(case, seed=seed)["message"]
            seed_msgs.append(msg)
            assert_no_banned(msg)
            assert_language_expectations(msg, case.get("language") or generator._language_for_market(case.get("market")))
            assert_us_constraints(msg, case.get("market"))
        assert_unique(seed_msgs)
        ok += 1
    return ok


def main():
    gen = LeandroOpeningGenerator()

    cases = [
        {"name": "Tiago", "role": "marmorista", "market": "BR", "language": "pt"},
        {"name": "John", "role": "distributor", "market": "US"},
        {"name": "Mariana", "role": "arquiteto", "market": "BR", "language": "pt"},
        {"name": "Carlos", "role": "distribuidor", "market": "LATAM"},
        {"name": "Prospect X", "role": "prospect", "market": "EU"},
    ]

    # 3 rounds
    rounds_ok = 0
    for r in range(1, 4):
        try:
            ok = run_round(gen, cases)
            print(f"Round {r}: passed {ok} cases")
            rounds_ok += 1
        except AssertionError as e:
            print(f"Round {r} FAILED: {e}")
            sys.exit(1)

    print(f"All {rounds_ok} rounds passed.")


if __name__ == "__main__":
    main()

