# Resume ↔ Job Description Matcher — Project Plan (Path B: Python Backend)

A hybrid ATS-score + AI-suggestion tool, with real server-side processing in Python. Still fully free, no auth, no persistent storage.

---

## 1. Architecture Overview

The frontend gets thinner; the backend does the actual work now. Two free hosts, split by what each is good at: Vercel for the static React app, Render for the Python container (since it needs a real OS-level Tesseract binary that serverless can't provide).

```
┌────────────── BROWSER (React SPA, hosted on Vercel) ──────────────┐
│                                                                     │
│  JD Input UI          Resume Upload UI        Results UI           │
│  (paste / image)      (drag-and-drop)         (score, keywords,    │
│       │                     │                  suggestions,        │
│       │                     │                  download report)    │
└───────┼─────────────────────┼──────────────────────┬───────────────┘
        │                     │                       │
        ▼                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│              FastAPI backend (Docker container, on Render)          │
│                                                                       │
│  POST /api/ocr          POST /api/analyze         POST /api/report  │
│  pytesseract             pdfplumber / python-docx   fpdf2            │
│  (JD image → text)       + spaCy / scikit-learn     (build PDF from  │
│                           (parse resume, score       analysis JSON) │
│                            match, ATS structure                     │
│                            checks)                                   │
│                                                                       │
│                       POST /api/suggestions                          │
│                       (calls out to Groq/Gemini)                     │
└───────────────────────────────┬───────────────────────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Groq API (free tier)   │
                    │   Llama 3.3 70B           │
                    └─────────────────────────┘
```

Every endpoint is stateless: request in, response out, nothing written to a database, nothing kept between requests. Render's free web service filesystem is ephemeral anyway (wiped on every restart/spin-down), so even accidental temp files never persist.

---

## 2. Tech Stack

| Layer                 | Choice                                                                                                                  | Why                                                                                                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend framework    | **React + Vite**                                                                                                        | Same as before — you already know this well                                                                                                                                                                                                                          |
| Styling               | **Tailwind CSS**                                                                                                        | Fast to build with                                                                                                                                                                                                                                                   |
| Backend framework     | **FastAPI**                                                                                                             | Async, typed, auto-generated OpenAPI docs — matches what you've already prepped for backend interviews                                                                                                                                                               |
| OCR                   | **pytesseract** + system `tesseract-ocr`                                                                                | More accurate than the browser WASM version; needs a real container to run in, which is why this path needs Render, not Vercel                                                                                                                                       |
| PDF resume parsing    | **pdfplumber** (or `pypdf` as a fallback)                                                                               | Handles messy layouts better than most JS equivalents                                                                                                                                                                                                                |
| DOCX resume parsing   | **python-docx**                                                                                                         | Standard, reliable                                                                                                                                                                                                                                                   |
| Keyword/NLP           | **spaCy** (`en_core_web_sm`) for noun-phrase & entity extraction, **scikit-learn** `TfidfVectorizer` for term weighting | Python's NLP ecosystem is genuinely stronger here than JS                                                                                                                                                                                                            |
| Fuzzy matching        | **rapidfuzz**                                                                                                           | Catches variants like "React.js" vs "ReactJS" vs "React"                                                                                                                                                                                                             |
| AI suggestions        | **Groq API** (Llama 3.3 70B) via the `groq` Python SDK                                                                  | Free tier, no credit card, fast                                                                                                                                                                                                                                      |
| PDF report generation | **fpdf2**                                                                                                               | Pure Python, no system dependencies — reliable to deploy. (WeasyPrint gives nicer HTML/CSS-styled output but needs Pango/Cairo system libraries in the Dockerfile, which is a common source of deploy headaches on free containers — worth trying later, not for v1) |
| Backend hosting       | **Render** (free Docker web service)                                                                                    | Free tier still requires no credit card and supports Docker, so `apt-get install tesseract-ocr` in the Dockerfile just works                                                                                                                                         |
| Frontend hosting      | **Vercel** (Hobby/free tier)                                                                                            | Static hosting for the React build                                                                                                                                                                                                                                   |

---

## 3. Feature-by-Feature Implementation

### 3.1 Job Description Input — `POST /api/ocr`

- Frontend: paste-text tab, or image upload that POSTs the file (multipart/form-data) to `/api/ocr`.
- Backend: Pillow loads the image, `pytesseract.image_to_string()` extracts text, returned as JSON.
- Same UX rule as before: show the extracted text in an **editable textarea** so the user can fix OCR mistakes before analysis runs.

### 3.2 + 3.3 Resume Upload & Algorithmic Scoring — `POST /api/analyze`

One endpoint, two internal steps:

**Parsing** — resume file arrives as multipart form data alongside the JD text string.

- `.pdf` → `pdfplumber` extracts text page by page
- `.docx` → `python-docx` extracts paragraph text
- Same rule as before: skip legacy `.doc`, ask users to re-save as `.docx`/`.pdf`

**Scoring** (roughly, in Python terms):

```python
def extract_keywords(text: str, skills_dict: set[str]) -> dict[str, int]:
    doc = nlp(text)  # spaCy
    candidates = {chunk.text.lower() for chunk in doc.noun_chunks}
    candidates |= {t.lower() for t in skills_dict if t.lower() in text.lower()}
    return {term: text.lower().count(term) for term in candidates}

jd_keywords = extract_keywords(jd_text, SKILLS_DICT)
resume_keywords = extract_keywords(resume_text, SKILLS_DICT)

matched = set(jd_keywords) & set(resume_keywords)
missing = set(jd_keywords) - set(resume_keywords)
# weight by frequency in the JD — repeated terms matter more
keyword_score = weighted_overlap(jd_keywords, matched)

structure_score = check_structure(resume_text)     # sections, contact info, length
completeness_score = check_completeness(resume_text)

final_score = 0.5 * keyword_score + 0.3 * structure_score + 0.2 * completeness_score
```

Same weighting philosophy as the original plan — keyword match (50%), ATS structural checks like detectable contact info, section headers, and garbled-text signals from tables/columns (30%), completeness (20%). `rapidfuzz` helps here too, catching near-matches so "Node.js" in a resume still counts against a JD asking for "NodeJS."

Returns the score breakdown, matched keywords, and missing keywords — all instantly usable by the frontend.

### 3.4 AI-Generated Suggestions — `POST /api/suggestions`

Takes the output of `/api/analyze` (resume text, JD text, missing keywords, score breakdown) and calls Groq for structured JSON: 3-5 rewritten bullet points that naturally work in the missing keywords, a tailored summary suggestion, and general tips. Kept as a **separate call from `/api/analyze`** on purpose — the frontend can show the (fast) algorithmic results immediately, and let the AI suggestions load in underneath. If that call fails or hits a rate limit, the rest of the page still works.

### 3.5 PDF Report Generation — `POST /api/report`

Takes the full analysis payload (score, keywords, AI suggestions) and builds a multi-section PDF with `fpdf2` — overview, score breakdown, matched/missing keywords, AI suggestions, formatting checklist. Returned as a streamed file response, generated in memory (`io.BytesIO`), never written to disk.

---

## 4. API Summary

| Endpoint           | Method | Input                                             | Output                                                               |
| ------------------ | ------ | ------------------------------------------------- | -------------------------------------------------------------------- |
| `/api/ocr`         | POST   | image file                                        | `{ extractedText }`                                                  |
| `/api/analyze`     | POST   | resume file + jdText                              | `{ score, breakdown, matchedKeywords, missingKeywords, resumeText }` |
| `/api/suggestions` | POST   | resumeText + jdText + missingKeywords + breakdown | `{ suggestions }`                                                    |
| `/api/report`      | POST   | full analysis payload                             | PDF file stream                                                      |
| `/health`          | GET    | —                                                 | `{ status: "ok" }` (see spin-up tip below)                           |

---

## 5. No-Storage / No-Auth Design

- Every endpoint is a pure function: request in, response out. No database, no ORM, no sessions.
- File uploads are read into memory (or FastAPI's temp `UploadFile` buffer) and discarded after the request completes.
- The PDF report is generated in-memory and streamed straight back — never saved to disk.
- Render's free-tier filesystem is ephemeral by design anyway, so nothing survives a restart even if something were accidentally written.

---

## 6. Deployment: Vercel (frontend) + Render (backend)

**Dockerfile sketch** for the FastAPI service:

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y tesseract-ocr && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY . .
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
```

Render provides the `PORT` environment variable at runtime — bind to it rather than hardcoding a port.

**CORS**: since frontend (on a `vercel.app` domain) and backend (on a `render.com` domain) are now different origins, add `CORSMiddleware` in FastAPI allowing your Vercel domain explicitly — this is new compared to Path A, where everything lived under one domain.

**Environment variables**: `GROQ_API_KEY` goes in Render's dashboard (never in the frontend bundle).

---

## 7. Suggested Build Order

1. Scaffold FastAPI project locally, get `/health` returning 200.
2. Build `/api/ocr` — test with a few JD screenshots.
3. Build `/api/analyze` — parsing first, then layer in the scoring engine (this is the meatiest logic; get it right locally before deploying).
4. Write the Dockerfile, deploy to Render, confirm Tesseract actually works inside the container (a common first-deploy gotcha — test this early).
5. Build `/api/suggestions` with Groq integration.
6. Build `/api/report` with fpdf2.
7. Scaffold the React frontend against your now-working API (or build both in parallel once the API contract above is stable).
8. Add CORS, error handling, loading states — especially around Render's cold-start delay (see below).
9. Deploy frontend to Vercel, point it at the Render backend URL, test end-to-end.

---

## 8. Gotchas to Watch For

- **Cold starts**: Render's free web services spin down after 15 minutes of no traffic and take roughly 30-60 seconds to wake back up on the next request. Mitigate with a `GET /health` "warm-up" ping fired the moment the page loads (before the user's even finished pasting the JD), so the container is likely already awake by the time they hit "Analyze." Also show a friendly loading message on first request ("waking up the server, this can take a minute") rather than a silent spinner.
- **Tesseract in Docker**: confirm the apt install actually resolves at build time — this is the single most common first-deploy failure with `pytesseract`.
- **WeasyPrint vs fpdf2**: if you're tempted by WeasyPrint's nicer HTML/CSS-based output later, budget extra time for its Pango/Cairo system dependencies in the Dockerfile — it's a known source of "works locally, fails in Docker" bugs.
- **CORS** — easy to forget until the frontend is deployed and every request silently fails.
- **Legacy `.doc` files** — still not worth supporting; ask users to re-save as `.docx`/`.pdf`.
- **PII through a third-party AI API** — same as before: a small disclaimer near the upload step is worth adding, since resume text still leaves your infrastructure for the AI suggestion step.
- **750 free instance hours/month cap on Render** — one always-on service uses ~730 hours/month by itself, so if you spin up a second free service (staging, etc.) you can run out before month-end. Not a concern for a single portfolio deployment.

## 9. Possible Stretch Features (later, not needed for v1)

- Swap fpdf2 for WeasyPrint once you're comfortable debugging Docker system deps, for a more polished report layout.
- Add `rapidfuzz`-powered "did you mean" suggestions when a resume uses a slightly different term than the JD.
- Multiple resume versions compared against the same JD side-by-side.

---

_This plan assumes zero ongoing cost: Vercel Hobby (frontend) + Render free web service (backend) + Groq free tier, no database, no auth layer._
