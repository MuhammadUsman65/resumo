# Resumo

Resumo is a resume-to-job-description matcher. Paste a job description, upload your resume, and get a match score, a keyword breakdown, and AI-generated suggestions for closing the gaps, all backed by real NLP and structural analysis instead of a black-box score.

## What it does

1. You paste a job description (or upload a screenshot of one and let OCR extract the text).
2. You upload your resume as a PDF or DOCX.
3. The backend parses both, extracts skill keywords from each using an NLP pipeline, and compares them.
4. You get back an overall score, a breakdown of what's driving it, a list of matched and missing keywords, and AI-generated suggestions for rewriting specific resume bullets to close the gap, honestly, without inventing experience you don't have.
5. You can download the whole analysis as a PDF report.

## Features

- **Job description input** by pasting text directly or uploading a screenshot (OCR via Tesseract).
- **Resume parsing** for PDF and DOCX, including text inside tables (common in Canva-style resume templates).
- **Keyword matching** against a skills dictionary of roughly 58,000 surface forms derived from SkillNER, extended with custom aliases and cleaned of false positives, plus fuzzy matching for typos and near-variants.
- **Structure and completeness checks**: detects contact info, resume sections, dated experience entries, and signs of garbled text extraction (common with multi-column PDF layouts).
- **Weighted final score**: 50% keyword match, 30% structure, 20% completeness.
- **AI-generated suggestions** (Groq, `openai/gpt-oss-120b`) for a tailored summary, rewritten bullet points, and general tips, constrained by a strict no-fabrication rule so it can only rephrase what's actually in your resume.
- **Downloadable PDF report** summarizing the whole analysis.

## Tech stack

**Backend:** Python, FastAPI, spaCy, pdfplumber, python-docx, pytesseract, rapidfuzz, Groq API, fpdf2

**Frontend:** React, Vite, Tailwind CSS

## Architecture

```
Browser (React, Vite)
  |
  |  JD text / image, resume file
  v
FastAPI backend
  |-- /api/ocr           screenshot -> text (pytesseract)
  |-- /api/analyze        resume + JD -> score, keywords, structure/completeness
  |-- /api/suggestions     analysis -> AI-generated rewrite suggestions (Groq)
  |-- /api/report          full analysis -> downloadable PDF (fpdf2)
  v
Groq API (openai/gpt-oss-120b)
```

Every endpoint is stateless. Nothing is written to disk or a database.

## How the score is calculated

```
final_score = 0.5 * keyword_score + 0.3 * structure_score + 0.2 * completeness_score
```

- **Keyword score**: keywords are extracted from both the job description and the resume using a spaCy `PhraseMatcher` against the skills dictionary. Matches are exact where possible, with `rapidfuzz` catching close variants. JD keywords that appear more than once are weighted more heavily, so a skill the job description emphasizes matters more than one mentioned in passing.
- **Structure score**: checks for a detectable email and phone number, recognizable section headers (Experience, Education, Skills, etc.), and signs that the PDF extraction came out garbled (a soft signal, since a short one-item-per-line skills list can look similar to genuinely scrambled text).
- **Completeness score**: checks resume length against a healthy range, whether experience/education/skills sections are all present, and whether there are enough dated entries to suggest real work or project history.

## Getting started

### Prerequisites

- Python 3.11.9 (later versions can hit dependency issues with spaCy)
- Node.js
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) installed and on your PATH, or pointed to explicitly in `main.py`
- A free [Groq API key](https://console.groq.com/keys)

### Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create a `.env` file in `backend/`:

```
GROQ_API_KEY=your_key_here
```

Generate the skills dictionary (only needed once, or after editing the alias/exclusion files):

```bash
python extract_skills.py
```

Run the server:

```bash
uvicorn main:app --reload
```

The API is now running at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

### Frontend setup

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss @tailwindcss/vite

```

Create a `.env` file in `frontend/`:

```
VITE_API_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

The app is now running at `http://localhost:5173`.

## API reference

| Endpoint           | Method | Input                                                 | Output                                                                                                      |
| ------------------ | ------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/health`          | GET    | none                                                  | `{ status: "ok" }`                                                                                          |
| `/api/ocr`         | POST   | image file                                            | `{ extractedText }`                                                                                         |
| `/api/analyze`     | POST   | resume file + `jdText`                                | score, breakdown, matched/missing keywords, structure and completeness details, resume text, candidate name |
| `/api/suggestions` | POST   | resume text, JD text, missing keywords, score details | tailored summary, rewritten bullets, general tips                                                           |
| `/api/report`      | POST   | full analysis payload                                 | PDF file stream                                                                                             |

## Project structure

```
resumo/
  backend/
    main.py
    extract_skills.py
    skills_dict.json           generated by extract_skills.py, not committed
    custom_aliases.json        manual patches for terms the skills dictionary misses
    excluded_surface_forms.json    surface forms that cause false-positive matches
    excluded_canonical_skills.json skills excluded from results as too generic or noisy
    requirements.txt
    .env                       not committed
  frontend/
    src/
      components/
        Header.jsx
        StepIndicator.jsx
        JDInput.jsx
        ResumeUpload.jsx
        ResultsView.jsx
        StatusMessage.jsx
      lib/
        api.js
      App.jsx
      index.css
    .env                       not committed
```

## Keyword dictionary notes

The skills dictionary starts from [SkillNER](https://github.com/AnasAito/SkillNER)'s bundled skill database, but the raw data needs patching to be usable:

- SkillNER's "surface forms" don't cover every real-world spelling. `extract_skills.py` generates dotted and concatenated variants for JS-family frameworks (`node.js`, `nodejs`, etc.) that the raw data only lists as two-word forms.
- Some surface forms collide with ordinary English words or grammatical stopwords (`plus`, `nice`, `go`), which caused false matches on phrases like "Python is a plus." These are filtered out at generation time.
- Some canonical skill names are too generic to mean anything as a resume keyword (`Writing`, `Maintainability`, `Computer Science`). These are excluded from match results entirely, separately from the surface-form filtering.
- `custom_aliases.json` patches gaps the automatic extraction still misses, and always takes priority over the generated dictionary.

Re-run `python extract_skills.py` after editing any of the alias or exclusion files.

## License

Built by Muhammad Usman
