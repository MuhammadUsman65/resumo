import json
from skillNer.general_params import SKILL_DB
from spacy.lang.en.stop_words import STOP_WORDS  # no need to load a full model for this

surface_to_canonical = {}

for skill_id, skill_data in SKILL_DB.items():
    canonical = skill_data.get("skill_name")
    if not canonical:
        continue

    forms = set()
    high = skill_data.get("high_surfce_forms", {})
    if high.get("full"):
        forms.add(high["full"].strip().lower())

    for low in skill_data.get("low_surface_forms", []):
        if low:
            forms.add(low.strip().lower())

    for form in forms:
        if form in STOP_WORDS:
            continue
        surface_to_canonical.setdefault(form, canonical)


with open("skills_dict.json", "w", encoding="utf-8") as f:
    json.dump(surface_to_canonical, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(surface_to_canonical)} surface forms mapping to skills")