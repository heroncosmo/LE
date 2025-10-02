import json
import random
from typing import Dict, Any, Optional


class LeandroOpeningGenerator:
    def __init__(self, profile_path: str = "ai_vendedora/leandro_profile.json"):
        with open(profile_path, "r", encoding="utf-8") as f:
            self.profile = json.load(f)

    def _choose(self, rng: random.Random, items):
        return rng.choice(items) if items else ""

    def _language_for_market(self, market: str) -> str:
        m = self.profile["markets"].get(market or "", {})
        return m.get("language", "pt")

    def _greetings_for_market(self, market: str):
        m = self.profile["markets"].get(market or "", {})
        return m.get("greeting_variants", ["Bom dia! Tudo bem?"])

    def _role_hooks(self, market: str, role: Optional[str]):
        m = self.profile["markets"].get(market or "", {})
        hooks = m.get("role_hooks", {})
        role = (role or "prospect").lower()
        # allow fallbacks
        return hooks.get(role, hooks.get("prospect", []))

    def _ctas(self, lang: str):
        return self.profile["ctas"].get(lang, self.profile["ctas"]["pt"])

    def _closing(self, lang: str):
        closings = self.profile["closings"].get(lang, self.profile["closings"]["pt"])
        return closings[0] if closings else ""

    def _signature_phrases(self) -> list:
        return self.profile.get("language_signatures", [])

    def _ensure_constraints(self, text: str) -> str:
        for banned in self.profile.get("banned_phrases", []):
            if banned in text:
                text = text.replace(banned, "")
        return text

    def generate(self,
                 contact: Dict[str, Any],
                 seed: Optional[int] = None,
                 include_signature_phrase: bool = True,
                 include_intro_for_prospect: bool = True,
                 ) -> Dict[str, Any]:
        """
        Generate a unique, contextual opening message for Leandro.
        contact: {
          name: str, role: str (prospect/marmorista/distribuidor/arquiteto/fabricator),
          market: str (BR/US/LATAM/EU), language: optional override (pt/en/es),
          company: str?, recent_activity: str?, last_contact_date: str(YYYY-MM-DD)?
        }
        Returns: { message: str, meta: {...} }
        """
        rng = random.Random(seed if seed is not None else random.randint(1, 10_000_000))

        market = (contact.get("market") or "BR").upper()
        lang = (contact.get("language") or self._language_for_market(market))
        role = (contact.get("role") or "prospect").lower()
        name = contact.get("name") or ""

        greetings = self._greetings_for_market(market)
        greet = self._choose(rng, greetings)

        # Add relational name naturally
        name_part = f" {name.strip()}," if name else ""

        # Build relational opener
        relational = [greet + name_part]
        # light relational question variations
        if lang == "pt":
            relational.append(self._choose(rng, [
                "Tudo bem?", "Como voc\u00ea est\u00e1?", "Como tem sido as \u00faltimas semanas por a\u00ed?"
            ]))
        elif lang == "en":
            relational.append(self._choose(rng, [
                "Hope you're well!", "How have the last weeks been on your side?"
            ]))
        else:  # es
            relational.append(self._choose(rng, [
                "\u00bfTodo bien?", "\u00bfC\u00f3mo han sido estas \u00faltimas semanas por ah\u00ed?"
            ]))

        # Intro for prospects only
        intro = ""
        if role == "prospect" and include_intro_for_prospect:
            if lang == "pt":
                intro = self._choose(rng, [
                    "Sou o Leandro, da Luchoa; trabalhamos com m\u00e1rmores, granitos e quartzitos ex\u00f3ticos.",
                    "Aqui \u00e9 o Leandro (Luchoa). Atendo com padr\u00e3o de exporta\u00e7\u00e3o e curadoria de lotes."
                ])
            elif lang == "en":
                intro = self._choose(rng, [
                    "This is Leandro from Luchoa; premium natural stones with export-grade finishing.",
                    "Leandro here (Luchoa) \u2014 we curate export-grade lots to match your demand."
                ])
            else:
                intro = self._choose(rng, [
                    "Soy Leandro, de Luchoa; trabajamos con piedras naturales premium.",
                    "Leandro (Luchoa) por aqu\u00ed: curadur\u00eda de lotes con est\u00e1ndar de exportaci\u00f3n."
                ])

        # Context hook by role/market
        hook = self._choose(rng, self._role_hooks(market, role))

        # Signature phrase (optional)
        sig = self._choose(rng, self._signature_phrases()) if include_signature_phrase else ""

        # CTA + closing
        cta = self._choose(rng, self._ctas(lang))
        closing = self._closing(lang)

        # Compose with human-like flow (short sentences, slight variability, no templates)
        parts = [p for p in [" ".join(relational).strip(), intro, hook, sig, cta, closing] if p]
        message = " \u2014 ".join(parts)

        message = self._ensure_constraints(message)

        # US constraint: avoid opening with container/logistics
        if market == "US":
            lowered = message.lower()
            if "container" in lowered or "logistics" in lowered:
                message = message.replace("container", "").replace("logistics", "").strip()

        meta = {
            "market": market,
            "language": lang,
            "role": role,
            "seed": seed,
            "greeting": greet,
            "used_signature": sig,
            "cta": cta
        }
        return {"message": message, "meta": meta}


def generate_opening_message(contact: Dict[str, Any], seed: Optional[int] = None) -> str:
    gen = LeandroOpeningGenerator()
    return gen.generate(contact, seed=seed)["message"]

