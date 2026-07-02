import json
from skillNer.general_params import SKILL_DB
from spacy.lang.en.stop_words import STOP_WORDS

with open("excluded_surface_forms.json", "r", encoding="utf-8") as f:
    # Generic English words that happen to be registered as skillNer surface
    # forms for obscure skills — not grammatical stopwords, so STOP_WORDS won't
    # catch them. Add to this list as testing turns up more (e.g. "plus" ->
    # S-PLUS Statistical Software matching on any JD that says "X is a plus").
    EXCLUDED_SURFACE_FORMS = set(json.load(f))

surface_to_canonical = {}
skipped_stopwords = set()
skipped_excluded = set()

for skill_id, skill_data in SKILL_DB.items():
    canonical = skill_data.get("skill_name")
    if not canonical:
        continue

    forms = set()
    high = skill_data.get("high_surfce_forms", {})
    if high.get("full"):
        forms.add(high["full"].strip().lower())
    if high.get("abv"):
        forms.add(high["abv"].strip().lower())

    for low in skill_data.get("low_surface_forms", []):
        if low:
            forms.add(low.strip().lower())

    # skillNer stores JS framework names as two-token forms like "node js", but
    # people actually write these as "Node.js" (one token, dot attached) or
    # "NodeJS" (one token, no separator at all) — neither matches the two-token
    # pattern. Add both single-token variants. Affects ~110 surface forms across
    # the DB (Node.js, Express.js, D3.js, Ember.js, Chart.js, etc.)
    js_variants = set()
    for form in forms:
        parts = form.split(" ")
        if len(parts) == 2 and parts[1] == "js":
            js_variants.add(f"{parts[0]}.js")   # dotted: "node.js"
            js_variants.add(f"{parts[0]}js")    # concatenated: "nodejs"
    forms |= js_variants

    for form in forms:
        if form in STOP_WORDS:
            # e.g. "an" -> AN/PRC-148 radio, "do" -> DO-178B — these would false-positive
            # match on virtually every document if left in
            skipped_stopwords.add(form)
            continue
        if form in EXCLUDED_SURFACE_FORMS:
            skipped_excluded.add(form)
            continue
        # if two skills share a surface form, first one wins (rare, acceptable for v1)
        surface_to_canonical.setdefault(form, canonical)

if skipped_stopwords:
    print(f"Skipped {len(skipped_stopwords)} surface forms that collide with English stopwords: {sorted(skipped_stopwords)}")
if skipped_excluded:
    print(f"Skipped {len(skipped_excluded)} manually excluded surface forms: {sorted(skipped_excluded)}")

with open("skills_dict.json", "w", encoding="utf-8") as f:
    json.dump(surface_to_canonical, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(surface_to_canonical)} surface forms mapping to skills")