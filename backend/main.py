import pytesseract
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import pdfplumber
import docx
import spacy
from spacy.matcher import PhraseMatcher
from spacy.util import filter_spans
import json
from pathlib import Path
import re
from rapidfuzz import fuzz

BASE_DIR = Path(__file__).parent

app = FastAPI(title="Resumo Backend")

# Wide open for local dev — we'll lock this to the Vercel domain in step 8
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

nlp = spacy.load("en_core_web_sm")

with open(BASE_DIR / "skills_dict.json", "r", encoding="utf-8") as f:
    SURFACE_TO_CANONICAL = json.load(f)

with open(BASE_DIR / "custom_aliases.json", "r", encoding="utf-8") as f:
    CUSTOM_ALIASES = json.load(f)

# custom aliases win on conflict — they exist specifically to override/patch gaps
SURFACE_TO_CANONICAL.update(CUSTOM_ALIASES)

# Build the matcher once at startup — not per-request
skill_matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
skill_patterns = [nlp.make_doc(surface) for surface in SURFACE_TO_CANONICAL.keys()]
skill_matcher.add("SKILLS", skill_patterns)

FUZZY_MATCH_THRESHOLD = 85  # 0-100, tune later based on real test cases
MIN_LEN_FOR_FUZZY = 4  # below this, fuzzy comparisons are too noisy to trust

def clean_for_fuzzy(term: str) -> str:
    # canonical names carry disambiguating annotations like "(Software)" or
    # "(Programming Language)" that skew string-similarity comparisons — strip
    # them before comparing
    return re.sub(r"\s*\(.*?\)\s*", "", term).strip().lower()

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/ocr")
async def ocr(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        extracted_text = pytesseract.image_to_string(image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

    return {"extractedText": extracted_text.strip()}

def parse_pdf(contents: bytes) -> str:
    text_parts = []
    with pdfplumber.open(io.BytesIO(contents)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)

def parse_docx(contents: bytes) -> str:
    document = docx.Document(io.BytesIO(contents))
    parts = [p.text for p in document.paragraphs if p.text]
    # a lot of resume templates (Canva exports especially) put contact info or
    # skills inside tables, which document.paragraphs skips entirely
    for table in document.tables:
        for row in table.rows:
            parts.extend(cell.text for cell in row.cells if cell.text)
    return "\n".join(parts)

@app.post("/api/analyze")
async def analyze(resume: UploadFile = File(...), jdText: str = Form(...)):
    filename = resume.filename.lower()
    contents = await resume.read()

    if filename.endswith(".pdf"):
        resume_text = parse_pdf(contents)
    elif filename.endswith(".docx"):
        resume_text = parse_docx(contents)
    elif filename.endswith(".doc"):
        raise HTTPException(
            status_code=400,
            detail="Legacy .doc files aren't supported — please re-save as .docx or .pdf"
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the resume")

    # Scoring logic comes next step — for now just return what we parsed
    return {
        "resumeText": resume_text,
        "jdText": jdText,
        "resumeLength": len(resume_text),
    }

def extract_keywords(text: str) -> dict[str, int]:
    # make_doc only tokenizes — same as what we already use to build the matcher's
    # patterns — so we skip the tagger/parser/NER, which PhraseMatcher never needed anyway
    doc = nlp.make_doc(text)
    matches = skill_matcher(doc)

    # PhraseMatcher returns overlapping/nested matches by default (e.g. "full stack"
    # AND "full stack developer" both hitting on the same words) — filter_spans keeps
    # only the longest non-overlapping span so we don't double-count
    spans = filter_spans([doc[start:end] for _, start, end in matches])

    counts: dict[str, int] = {}
    for span in spans:
        surface_form = span.text.lower()
        canonical = SURFACE_TO_CANONICAL.get(surface_form, surface_form)
        counts[canonical] = counts.get(canonical, 0) + 1

    return counts

@app.post("/api/debug-keywords")
async def debug_keywords(text: str = Form(...)):
    return extract_keywords(text)

def match_keywords(jd_keywords: dict[str, int], resume_keywords: dict[str, int]):
    jd_terms = set(jd_keywords)
    resume_terms = set(resume_keywords)

    exact_matched = jd_terms & resume_terms
    remaining_jd = jd_terms - exact_matched

    fuzzy_matched = set()
    for jd_term in remaining_jd:
        jd_clean = clean_for_fuzzy(jd_term)
        if len(jd_clean) < MIN_LEN_FOR_FUZZY:
            continue
        for resume_term in resume_terms:
            resume_clean = clean_for_fuzzy(resume_term)
            if len(resume_clean) < MIN_LEN_FOR_FUZZY:
                continue
            # ratio, not partial_ratio: partial_ratio only needs the shorter string
            # to align against SOME substring of the longer one, which scores things
            # like java/javascript, react/reactor, and go/django all at 100 — exactly
            # the skill confusions this is supposed to avoid
            if fuzz.ratio(jd_clean, resume_clean) >= FUZZY_MATCH_THRESHOLD:
                fuzzy_matched.add(jd_term)
                break

    matched = exact_matched | fuzzy_matched
    missing = jd_terms - matched

    # weighted overlap: JD terms mentioned more often count for more
    total_jd_weight = sum(jd_keywords.values())
    matched_weight = sum(jd_keywords[term] for term in matched)
    keyword_score = (matched_weight / total_jd_weight * 100) if total_jd_weight > 0 else 0

    return {
        "matchedKeywords": sorted(matched),
        "missingKeywords": sorted(missing),
        "exactMatchCount": len(exact_matched),
        "fuzzyMatchCount": len(fuzzy_matched),
        "keywordScore": round(keyword_score, 1),
    }

@app.post("/api/debug-match")
async def debug_match(jdText: str = Form(...), resumeText: str = Form(...)):
    jd_keywords = extract_keywords(jdText)
    resume_keywords = extract_keywords(resumeText)
    return match_keywords(jd_keywords, resume_keywords)