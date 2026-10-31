# InterviewAI — Phase 2 Completion Report: Resume Intelligence and Job Description Analysis

**Generated:** October 29, 2026  
**Phase Status:** Complete (Phase 2 Verified)  
**Next Phase:** Phase 3: Adaptive Question Generation & Interview Simulation (Awaiting Approval)  

---

## 1. Phase Objective & Implementation Summary

The objective of **Phase 2** was to implement a complete, explainable **Resume Intelligence and Job Description Analysis** engine for **InterviewAI**.

All Phase 0 foundations (FastAPI app, PostgreSQL/SQLAlchemy models, Alembic migrations, health checks) and Phase 1 security implementations (JWT authentication, salted bcrypt hashing, multi-tenant user isolation) were preserved intact.

Phase 2 introduces:
- In-memory PDF upload and validation with magic byte signature verification (`%PDF-`), file size limits (5 MB default), extension validation, and detection of encrypted or blank files.
- High-fidelity PDF text extraction using `PyMuPDF` with graceful fallback handling.
- Scanned / image-only PDF detection that explicitly clarifies OCR is required without faking OCR.
- Text normalization preserving unicode characters, ligatures, and structural section boundaries.
- Categorized skill extraction (languages, frameworks, databases, cloud & DevOps, data/ML, architectural practices) using regex boundaries and a canonical alias dictionary (`scikit-learn` / `sklearn`, `k8s` / `kubernetes`, `postgres` / `postgresql`, `ts` / `typescript`, etc.).
- Structured resume parsing identifying education (degrees, institutions, graduation years), experience highlights, and projects, clearly distinguishing direct from inferred extractions.
- Job description analyzer segmenting required vs preferred qualifications, duties, experience years, and degree requirements.
- Explainable skill matching engine classifying requirements into 4 distinct categories:
  1. `evidence_found`: Direct textual evidence with relevant quotes.
  2. `possible_match`: Related alias or tool variant detected.
  3. `needs_verification`: Ambiguous or partial context.
  4. `not_found`: Absence of evidence in resume (strictly documented as textual absence, **not** candidate incompetence).
- Transparent, weighted match coverage formula ($0.7 \times \text{Required} + 0.3 \times \text{Preferred}$) with embedded methodology disclaimer.
- Pluggable AI provider abstraction (`DeterministicAIProvider` by default, plus optional `GeminiAIProvider`) that falls back gracefully without requiring external API keys.
- Comprehensive REST endpoints for uploading, listing, fetching, and deleting resumes and job analyses with strict tenant isolation.
- Polished, responsive React 18 + Tailwind CSS dashboard shell featuring a Resume Workspace, Job Workspace, and Skill Gap Results view with accordions and action recommendations.
- **49 total automated tests** passing with 100% success rate.

---

## 2. Final User Workflows Implemented

### User Journey
```mermaid
flowchart TD
    A[Authenticated User Logs In] --> B[Dashboard Overview]
    B --> C[Resume Workspace]
    B --> D[Job Description Workspace]

    subgraph "Resume Management"
        C --> C1[Upload PDF Resume <= 5MB]
        C1 --> C2[Memory Signature Validation %PDF-]
        C2 --> C3[PyMuPDF Text Extraction & Normalization]
        C3 --> C4[Skill & Section Segmentation]
        C4 --> C5[Persisted in PostgreSQL]
        C5 --> C6[Inspect Parsed Skills & Education]
    end

    subgraph "Job Analysis & Gap Matching"
        D --> D1[Select Candidate Resume]
        D --> D2[Paste Job Description Text]
        D2 --> D3[Extract Required vs Preferred Criteria]
        D3 --> D4[Matching Engine: 4-Tier Classification]
        D4 --> D5[Compute Weighted Coverage %]
        D5 --> D6[Display Evidence Quotes & Recommendations]
        D6 --> D7[Save to Analysis History]
    end
```

---

## 3. API Endpoints and Request/Response Behavior

| Method | Endpoint | Access | Purpose | Success Code | Error Codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/resumes` | Authenticated | Upload PDF resume, extract text & structure | `201 Created` | `400 Bad Request`, `413 Payload Too Large`, `422 Unprocessable` |
| `GET` | `/api/v1/resumes` | Authenticated | List candidate's uploaded resumes | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/v1/resumes/{resume_id}` | Authenticated | Retrieve owned resume & extracted sections | `200 OK` | `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/v1/resumes/{resume_id}` | Authenticated | Delete an owned resume safely | `204 No Content` | `401 Unauthorized`, `404 Not Found` |
| `POST` | `/api/v1/job-analyses` | Authenticated | Analyze JD against owned resume | `201 Created` | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| `GET` | `/api/v1/job-analyses` | Authenticated | List candidate's saved analyses | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/v1/job-analyses/{analysis_id}`| Authenticated | Retrieve saved analysis details & gaps | `200 OK` | `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/v1/job-analyses/{analysis_id}`| Authenticated | Delete an owned analysis | `204 No Content` | `401 Unauthorized`, `404 Not Found` |

---

## 4. Resume Extraction Approach and Limitations

### Extraction Pipeline
1. **Validation**: Checks file extension (`.pdf`), maximum size (`5 MB`), and magic byte signature (`b"%PDF-"`).
2. **In-Memory Buffer**: Processing uses in-memory byte buffers via `pymupdf.open(stream=file_bytes, filetype="pdf")`. Uploaded PDF files are never written to unauthenticated public directories.
3. **Encryption Guard**: Rejects password-protected PDFs with `PDFEncryptedError` and an explicit user message.
4. **Text Normalization**: Replaces non-breaking spaces (`\xa0`), unfolds unicode ligatures (`ﬁ` $\rightarrow$ `fi`), cleans bullet symbols, and standardizes paragraph whitespace.
5. **Scanned / Image Detection**: If a multi-page document yields fewer than 6 words, it is flagged as `scanned_image_no_text`. The system clearly notes that OCR was not performed rather than fabricating or guessing text.
6. **Structured Parsing**:
   - Matches canonical technical skills and aliases across languages, frameworks, databases, cloud, and data science.
   - Detects education credentials (e.g. BS, MS, PhD) and graduation years.
   - Identifies experience headlines, durations, and project titles.

### Known Limitations
- PDFs with complex multi-column layouts without logical reading orders may occasionally interleave column text.
- Image-only scanned PDFs require optical character recognition (OCR), which is not bundled in this phase to prevent heavy binary dependencies (e.g., Tesseract).

---

## 5. Job-Description Analysis Approach

1. **Section Segmentation**:
   - Uses regex boundary patterns to identify `Required Qualifications / Requirements / Must Have` vs `Preferred Qualifications / Nice to have / Plus / Bonus`.
   - Isolates responsibility bullet points and experience requirements.
2. **Flat / Unstructured Fallback**:
   - For job postings lacking formal section headings, sentence-level modal phrase analysis (`"is a plus"`, `"preferred"`, `"bonus"`) is used to distinguish preferred from required skills.
3. **Canonical Normalization**:
   - All extracted skills are cross-referenced with the alias dictionary to ensure variant names (`postgres`, `psql`, `postgresql`) map to consistent canonical representations.

---

## 6. Skill-Matching Rules and Score Formula

### 4-Tier Match Classification
For each skill extracted from the job description:
1. `evidence_found`: Direct keyword mention or substantive sentence in the resume. Confidence: $0.85 - 0.95$.
2. `possible_match`: An alias, framework family variant, or indirect mention (e.g. `k8s` for `Kubernetes`). Confidence: $0.70$.
3. `needs_verification`: Ambiguous or partial conceptual mention. Confidence: $0.50$.
4. `not_found`: No evidence detected in the resume text. Confidence: $0.0$.

> **Crucial Ethical Guardrail**: The explanation for any `not_found` skill explicitly states:  
> *"No supporting evidence for '[Skill]' was detected in the uploaded resume. Note: This reflects textual absence in the document, not a confirmed lack of candidate competence."*

### Score Formula & Transparency
$$\text{Overall Coverage \%} = \left(0.70 \times \text{Required Ratio}\right) + \left(0.30 \times \text{Preferred Ratio}\right)$$
- `evidence_found`: 1.0 point
- `possible_match`: 0.5 point
- `needs_verification`: 0.25 point
- `not_found`: 0.0 points

**Disclaimer Embedded in Every Response**:
> *"This metric quantifies textual keyword alignment between the uploaded resume and the job description. It does NOT represent a scientifically validated appraisal of overall candidate capability, intellect, or career potential."*

---

## 7. AI Provider Integration & Fallback Behavior

- **Abstraction**: `BaseAIProvider` defined in `backend/app/services/ai_provider.py`.
- **Default Engine**: `DeterministicAIProvider` (100% local, zero latency, zero external API keys needed).
- **Optional Gemini Provider**: `GeminiAIProvider` activates only when `AI_PROVIDER=gemini` and `GEMINI_API_KEY` are provided.
- **Fail-Safe Mechanism**: Any API timeout, rate limit, or network exception during AI processing is caught and logged, automatically falling back to deterministic analysis with `analysis_engine: "deterministic"`.
- **Prompt Injection Defense**: Raw job description text is treated strictly as passive text data and never executed.
- **Automated Tests**: Never make live external API calls; all tests execute deterministically.

---

## 8. Database Models, Relationships, and Migrations

### Model Updates
1. **`Resume`** extended with:
   - `filename`: `String(255)`
   - `file_size_bytes`: `Integer`
   - `parsing_status`: `String(50)`
   - `error_message`: `Text`
   - `structured_data`: `JSONB` / `JSON`
   - Relationship to `JobAnalysis`
2. **`JobAnalysis`** created with:
   - `id`: UUID (Primary Key, Indexed)
   - `user_id`: UUID (Foreign Key $\rightarrow$ `users.id`, `ON DELETE CASCADE`, Indexed)
   - `resume_id`: UUID (Foreign Key $\rightarrow$ `resumes.id`, `ON DELETE CASCADE`, Indexed)
   - `role_title`: `String(255)`
   - `company_name`: `String(255)`
   - `experience_level`: `String(50)`
   - `job_description_raw`: `Text`
   - `extracted_requirements`: `JSONB` / `JSON`
   - `match_results`: `JSONB` / `JSON`
   - `created_at`: `TIMESTAMP WITH TIME ZONE`

### Migration
- Created Alembic migration: `backend/alembic/versions/0002_resume_intelligence.py`.
- Preserved existing `0001_initial_schema.py` without dropping or resetting tables.
- Migration head is at `0002_resume_intelligence`.

---

## 9. Files Created or Modified

| File | Status | Description |
|---|---|---|
| `backend/requirements.txt` | Modified | Added `pymupdf>=2.0.0` and `pypdf>=6.0.0`. |
| `backend/app/core/config.py` | Modified | Added `MAX_UPLOAD_SIZE_BYTES`, `ALLOWED_EXTENSIONS`, `AI_PROVIDER`, `GEMINI_API_KEY`. |
| `backend/.env.example` | Modified | Added Phase 2 environment variables. |
| `backend/app/models/resume.py` | Modified | Added `filename`, `file_size_bytes`, `parsing_status`, `error_message`, `structured_data`. |
| `backend/app/models/job_analysis.py` | Created | `JobAnalysis` SQLAlchemy entity. |
| `backend/app/models/user.py` | Modified | Added `job_analyses` relationship. |
| `backend/app/models/__init__.py` | Modified | Exported `JobAnalysis`. |
| `backend/alembic/versions/0002_resume_intelligence.py` | Created | Alembic migration extending `resumes` and creating `job_analyses`. |
| `backend/app/services/skill_dictionary.py` | Created | Canonical skill list, categories, and alias mappings. |
| `backend/app/services/pdf_extractor.py` | Created | PDF validation, PyMuPDF extraction, normalization, and scanned doc detection. |
| `backend/app/services/resume_parser.py` | Created | Extraction of categorized skills, education, experience, and projects. |
| `backend/app/services/job_analyzer.py` | Created | Requirement extraction, required vs preferred separation, years of experience. |
| `backend/app/services/matching_engine.py` | Created | 4-tier match classification, coverage score formula, and gap recommendations. |
| `backend/app/services/ai_provider.py` | Created | AI provider interface with deterministic baseline and optional Gemini support. |
| `backend/app/schemas/resume.py` | Created | `ResumeResponse` and `ResumeListItem` Pydantic schemas. |
| `backend/app/schemas/job_analysis.py` | Created | `JobAnalysisCreateRequest`, `JobAnalysisResponse`, and `JobAnalysisListItem`. |
| `backend/app/schemas/__init__.py` | Modified | Registered new schemas. |
| `backend/app/api/resumes.py` | Created | Endpoints for resume upload, listing, retrieval, and deletion. |
| `backend/app/api/job_analyses.py` | Created | Endpoints for job description analysis, listing, retrieval, and deletion. |
| `backend/app/main.py` | Modified | Registered `resumes` and `job-analyses` routers; updated root phase info. |
| `backend/tests/test_pdf_extractor.py` | Created | 8 unit tests for PDF extraction, validation, encryption, and normalization. |
| `backend/tests/test_resume_parser.py` | Created | 3 unit tests for skill normalization, categories, and structured sections. |
| `backend/tests/test_job_analyzer.py` | Created | 2 unit tests for required vs preferred classification and flat JDs. |
| `backend/tests/test_matching_engine.py` | Created | 3 unit tests for match classifications, evidence statements, and coverage scoring. |
| `backend/tests/test_resumes_and_analyses_api.py` | Created | 5 integration tests for API endpoints, upload, and multi-tenant isolation. |
| `backend/tests/test_health.py` | Modified | Updated root endpoint assertion to match Phase 2 status. |
| `frontend/src/config/api.js` | Modified | Added `RESUMES` and `JOB_ANALYSES` endpoints. |
| `frontend/src/components/ResumeWorkspace.jsx` | Created | PDF upload, resume list, details modal, and delete actions. |
| `frontend/src/components/JobWorkspace.jsx` | Created | Job description input, resume selector, and past analyses history. |
| `frontend/src/components/SkillGapResults.jsx` | Created | Match coverage scores, required vs preferred breakdown, evidence quotes, and recommendations. |
| `frontend/src/components/Dashboard.jsx` | Modified | Tab navigation for Overview, Resume Workspace, and Job Analysis. |
| `frontend/src/components/Header.jsx` | Modified | Updated Phase badge to Phase 2. |
| `frontend/src/components/EmptyState.jsx` | Modified | Updated architectural roadmap pillars. |
| `docs/phase-2-report.md` | Created | Phase 2 completion report. |

---

## 10. Dependencies Added

### Backend
- `pymupdf==2.0.0`: C-accelerated PDF text extraction, document inspection, and metadata parser.
- `pypdf==6.21.4`: Pure-Python fallback PDF parser.

### Frontend
- All frontend functionality was implemented using existing packages (`react`, `vite`, `tailwindcss`, `lucide-react`).

---

## 11. Environment Variables Required

### Backend (`backend/.env`)
```bash
# Application Configuration
ENVIRONMENT=development
PROJECT_NAME=InterviewAI
DEBUG=True
API_V1_PREFIX=/api/v1
HOST=127.0.0.1
PORT=8000

# Database Configuration
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/interviewai_dev

# Security Settings (Phase 1)
JWT_SECRET_KEY=dev-secret-key-replace-with-openssl-rand-hex-32-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BCRYPT_ROUNDS=12

# File Upload Settings (Phase 2)
MAX_UPLOAD_SIZE_BYTES=5242880

# AI Provider Settings (Phase 2)
AI_PROVIDER=deterministic
GEMINI_API_KEY=

# CORS Settings
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

---

## 12. Exact Commands to Install, Migrate, and Run

### 1. Backend Installation & Migration
```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
```

### 2. Run Backend Tests
```bash
python -m pytest tests -v
```

### 3. Launch Backend API Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Build & Launch Frontend
```bash
cd frontend
npm run build
npm run dev
```
Access in browser: `http://localhost:5173`.

---

## 13. Tests Executed, Actual Results, and Test Database Engine

### Automated Test Suite Execution
Tests were executed using Pytest against an isolated in-memory SQLite engine with `PRAGMA foreign_keys=ON`:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-9.2.0, pluggy-1.7.0 -- C:\Program Files\Python314\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\jagra\OneDrive\Desktop\interview macro
plugins: anyio-4.14.1
collecting ... collected 49 items

backend/tests/test_auth.py ............                                  [ 24%]
backend/tests/test_health.py ....                                        [ 32%]
backend/tests/test_job_analyzer.py ..                                    [ 36%]
backend/tests/test_matching_engine.py ...                                [ 42%]
backend/tests/test_models.py .......                                     [ 57%]
backend/tests/test_pdf_extractor.py ........                             [ 73%]
backend/tests/test_resume_parser.py ...                                  [ 79%]
backend/tests/test_resumes_and_analyses_api.py .....                      [ 89%]
backend/tests/test_security.py .....                                     [100%]

======================= 49 passed, 2 warnings in 4.80s ========================
```
- **100% Pass Rate**: All 49 tests passed.
- **Database Engine Used**: In-memory SQLite with enforced foreign key cascades.
- **PostgreSQL Note**: As documented in Phase 0 and Phase 1, PostgreSQL was not running locally on port 5432. All schemas and migration files are PostgreSQL-native with JSONB and UUID compatibility.

---

## 14. Frontend Production Build Results

Executed `npm run build` in `frontend`:

```text
> vite build
vite v6.4.5 building for production...
transforming...
✓ 1582 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.84 kB │ gzip:  0.54 kB
dist/assets/index-o-lj2pch.css   23.52 kB │ gzip:  5.00 kB
dist/assets/index-DskATc6u.js   211.34 kB │ gzip: 60.75 kB
✓ built in 5.72s
```
- **0 errors, 0 build warnings.**

---

## 15. Security, Privacy, Retention, and Data-Isolation Checks

1. **Authentication Enforcement**: Every resume and job analysis endpoint requires a verified JWT Bearer token via `get_current_user`. Unauthenticated requests receive HTTP 401.
2. **Cross-Tenant Resume Isolation**:
   - `GET /api/v1/resumes/{resume_id}` verifies `user_id == current_user.id`. Requests for other candidates' resumes return HTTP 404.
   - `DELETE /api/v1/resumes/{resume_id}` prevents unauthorized deletion.
3. **Cross-Tenant Analysis Isolation**:
   - `POST /api/v1/job-analyses` verifies that `payload.resume_id` belongs to `current_user.id`. Attempts to reference another candidate's resume return HTTP 404.
   - `GET /api/v1/job-analyses/{analysis_id}` verifies ownership.
4. **Untrusted Document Defense**:
   - Resumes and job descriptions are treated as untrusted text strings. Prompt injection attempts embedded in document text are not executed.
5. **Data Privacy & Storage**:
   - PDF files are parsed in memory and never stored in publicly accessible filesystem directories.
   - Raw resume content, passwords, and JWTs are never logged.

---

## 16. Known Issues, Limitations, and Production-Readiness Work

1. **No Local PostgreSQL Daemon**: PostgreSQL is not running locally on port 5432; testing ran against SQLite. Live PostgreSQL verification should occur once a daemon is launched.
2. **OCR Engine Omission**: Scanned or photographed PDFs currently return a clear warning rather than running OCR. For production, asynchronous Celery/Redis workers with Tesseract or Google Cloud Vision can be introduced.
3. **Cookie-Based Token Storage**: Tokens remain in `sessionStorage` for Phase 2; migration to HttpOnly cookies is planned for production hardening.

---

## 17. Confirmation That Phase 3 Has Not Been Started

The following features belong strictly to future phases and **have NOT been implemented**:
- [x] **No Question Generation**: No behavioral or technical interview questions are generated.
- [x] **No Audio or Speech Processing**: No microphone recording, WebRTC, or Whisper integrations.
- [x] **No Interview Sessions**: No session execution or mock interview workflows.
- [x] **No Voice or Video Analysis**: No filler word or speech analysis.

---

## 18. Recommended Next Phase

**Recommended Next Step: Phase 3 — Adaptive Question Generation & Interview Simulation**
- Use the job description requirements and identified skill gaps from Phase 2 to generate tailored interview questions.
- Implement structured question sequences (behavioral, technical, situational) with difficulty balancing.
- Initialize live interview sessions linked to the candidate's selected resume and target job description.

