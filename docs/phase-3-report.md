# InterviewAI — Phase 3 Completion Report: Personalized Interview Engine, Answer Evaluation, and Reports

**Generated:** October 29, 2026  
**Phase Status:** Complete (Phase 3 Verified)  
**Next Phase:** Phase 4: Adaptive Audio/Speech Infrastructure & Advanced Analytics (Awaiting Approval)  

---

## 1. Phase Objective & Implementation Summary

The objective of **Phase 3** was to implement a full **Personalized Interview Engine, Answer Evaluation, and Saved Reports** pipeline for **InterviewAI**.

All Phase 0 foundations (FastAPI application, PostgreSQL/SQLAlchemy schemas, Alembic migrations, database connectivity probes), Phase 1 multi-user security (cryptographic JWT authentication, salted bcrypt password hashing, tenant isolation), and Phase 2 resume intelligence (PDF parsing, skill dictionary extraction, JD requirement segmentation, explainable matching engine) remain 100% intact and functional.

Phase 3 introduces:
1. **Personalized Question Generation Service**:
   - Synthesizes interview questions targeting candidate evidenced stack, target role requirements, and prioritized skill gaps (`not_found` and `needs_verification` from Phase 2).
   - Generates questions matching requested types (`technical`, `behavioral`, `situational`) and difficulty (`easy`, `medium`, `hard`).
   - Private expected-answer criteria/rubric generated and persisted with each question, strictly withheld from candidate responses until after answer submission.
   - Dual-engine architecture: configured AI provider (Google Gemini) with a comprehensive deterministic fallback engine requiring zero external API keys.
2. **Resilient Answer Persistence & Evaluation Engine**:
   - Immediate answer persistence: candidate answers are committed to the database with `evaluation_status="pending"` prior to evaluation, preventing answer loss during network timeouts or model errors.
   - Behavioral STAR Rubric: evaluates responses to behavioral questions across Situation (20%), Task (20%), Action (35%), and Result (25%) with component scores and evidence summaries. Non-behavioral questions do not force STAR rubrics.
   - Technical / Situational Rubric: evaluates concept correctness, question relevance, practical reasoning/trade-offs, and architectural depth.
   - Text-Based Communication Scoring: assesses text-visible qualities (paragraph structure, structural transitions, conciseness, verbal filler phrase deductions) on a 0–100 scale, explicitly labeled as a text-only assessment.
   - Idempotent retries: re-submitting an answer for an existing question updates the existing answer record without creating duplicate entries.
3. **Comprehensive Report Generation & Aggregation**:
   - Computes weighted overall score: $0.75 \times \text{Average Content Score} + 0.25 \times \text{Average Communication Score}$.
   - Excludes pending, failed, or unanswered questions from scoring formulas (never treats missing answers as zero).
   - Computes average STAR component scores across behavioral questions.
   - Pinpoints strongest demonstrated areas, actionable preparation recommendations, and question-by-question feedback.
   - Embedded ethical disclaimer stating the system is an educational preparation aid and does not constitute a hiring guarantee or employment prediction.
4. **Interactive Frontend Experience**:
   - Setup view: selects saved resumes, saved job analyses (or raw JD), question count (1–10), question types, and difficulty.
   - Live text interview simulation: step-by-step single question view, progress bar, target skill badge, and live character counter.
   - In-browser speech-to-text dictation: integrates the browser Web Speech API (`SpeechRecognition`) with explicit user activation, real-time transcript insertion, manual editing, and fallback for unsupported browsers.
   - Saved report view: comprehensive scorecard, STAR component bars, question review accordions, and past session history.
5. **Testing & Build Verification**:
   - **63 automated backend tests passing** in 4.66s (100% pass rate).
   - Production frontend bundle built in 4.54s with zero errors or warnings.
   - Alembic migration `0003_interview_engine` verified at `(head)`.

---

## 2. Completed User Journey

```mermaid
flowchart TD
    A[Authenticated Candidate] --> B[Interview Simulator Tab]
    B --> C[Configure Interview Session]
    C --> C1[Select Saved Resume]
    C --> C2[Select Job Analysis or Custom JD]
    C --> C3[Choose Question Count, Types & Difficulty]
    C --> D[Generate Personalized Questions]
    
    subgraph "Backend Engine"
        D --> D1[Identify Phase 2 Skill Gaps]
        D1 --> D2[Target Evidenced Stack & Role Context]
        D2 --> D3[Generate Questions & Private Rubrics]
        D3 --> D4[Persist Session as CREATED]
    end

    D4 --> E[Start Live Simulation]
    E --> F[Present Question X of Y]
    F --> G[Candidate Inputs Answer]
    G --> G1[Manual Keyboard Input]
    G --> G2[Optional Web Speech Dictation]
    
    G --> H[Submit Answer]
    H --> H1[Immediate Save to DB as PENDING]
    H1 --> H2[Run Answer Evaluation Engine]
    H2 --> H3[Behavioral: STAR Rubric 0-100]
    H2 --> H4[Technical: Architectural Correctness]
    H2 --> H5[Text Communication Assessment]
    H3 & H4 & H5 --> H6[Update Answer Status to COMPLETED]
    
    H6 --> I[Display Instant Feedback Card]
    I --> J{More Questions?}
    J -- Yes --> F
    J -- No --> K[Complete Interview Session]
    
    K --> L[Generate Comprehensive Report]
    L --> M[Saved Report Dashboard & History]
```

---

## 3. API Endpoints and Session Lifecycle

| Method | Endpoint | Access | Purpose | Success Code | Error Codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/interviews` | Authenticated | Create interview session & synthesize questions | `201 Created` | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| `GET` | `/api/v1/interviews` | Authenticated | List candidate's interview sessions | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/v1/interviews/{session_id}` | Authenticated | Retrieve owned session, questions & submitted answers | `200 OK` | `401 Unauthorized`, `404 Not Found` |
| `POST` | `/api/v1/interviews/{session_id}/start` | Authenticated | Start created session (`created` $\rightarrow$ `in_progress`) | `200 OK` | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| `POST` | `/api/v1/interviews/{session_id}/answers` | Authenticated | Submit & evaluate answer for a question | `200 OK` | `400 Bad Request`, `401 Unauthorized`, `404 Not Found` |
| `POST` | `/api/v1/interviews/{session_id}/complete` | Authenticated | Mark session completed & aggregate final scores | `200 OK` | `401 Unauthorized`, `404 Not Found` |
| `GET` | `/api/v1/interviews/{session_id}/report` | Authenticated | Retrieve report with STAR breakdowns & feedback | `200 OK` | `401 Unauthorized`, `404 Not Found` |
| `DELETE` | `/api/v1/interviews/{session_id}` | Authenticated | Delete session, associated questions, and answers | `204 No Content` | `401 Unauthorized`, `404 Not Found` |

### Session Lifecycle State Machine
* **`created`**: Session initialized with questions and private rubrics; overall score is null.
* **`in_progress`**: Candidate has started the interview or submitted their first answer.
* **`completed`**: All questions answered (or candidate explicitly finished); overall score and completion timestamp persisted.
* **`abandoned`**: Session marked inactive (future administrative use).

---

## 4. Question-Generation Strategy & Provider Configuration

### Strategy & Targeting
The backend `question_generator.py` service synthesizes personalized questions according to:
1. **Target Role & Seniority**: Contextualized to the target role (e.g. "Senior Backend Engineer").
2. **Prioritized Skill Gaps**: Integrates Phase 2 `match_results` classifications. Skills categorized as `not_found` or `needs_verification` are prioritized for technical probing to test adjacent knowledge and practical exposure.
3. **Evidenced Skills**: Explores candidate strengths evidenced in the parsed resume, asking for architectural optimization, concurrency, and reliability trade-offs.
4. **Behavioral (STAR) Framing**: Prompts structured situational storytelling requiring Situation, Task, Action, and Result components.
5. **Private Rubrics**: Each question stores internal criteria (`Question.rubric_criteria`) specifying core concepts, patterns, trade-offs, and expected STAR elements. Rubrics are kept private on the database and excluded from candidate-facing Question schemas (`QuestionOut`).
6. **Anti-Prompt-Injection Safeguards**: Resume text and raw job descriptions are treated as untrusted data and bounded to 2,000 characters when passed to language models.

### Provider Configuration
* **Default**: `AI_PROVIDER=deterministic` (offline, zero external API keys, zero network latency).
* **Optional**: `AI_PROVIDER=gemini` with `GEMINI_API_KEY`.
* **Resilience**: Any exception, network error, or malformed JSON from an external provider triggers an immediate, seamless fallback to the local deterministic question generator without user interruption.

---

## 5. Evaluation Methodology & Scoring Formulas

### 1. Behavioral Question Evaluation (STAR Rubric)
Behavioral answers are evaluated on a 0–100 scale across the four STAR pillars:
* **Situation ($S$, 20% weight)**: Background context, company/team setting, technical constraints, and timeline.
* **Task ($T$, 20% weight)**: Candidate's explicit role, objective, or personal responsibility.
* **Action ($A$, 35% weight)**: Decisive first-person contributions ("I designed", "I investigated", "I implemented", "I refactored").
* **Result ($R$, 25% weight)**: Quantifiable outcomes, metrics (latency reduction, uptime %, saved hours), and long-term lessons.

$$\text{Content Score}_{\text{behavioral}} = 0.20 \times S + 0.20 \times T + 0.35 \times A + 0.25 \times R$$

### 2. Technical & Situational Question Evaluation
Technical answers are evaluated on:
* **Correctness & Concept Alignment (35%)**: Alignment with question criteria and target skill.
* **Relevance (25%)**: Responsiveness to the specific scenario.
* **Practical Reasoning & Trade-offs (20%)**: Consideration of alternatives, scalability, latency, and failure modes.
* **Supporting Evidence (20%)**: Real-world examples, metric references, and architectural patterns.

$$\text{Content Score}_{\text{technical}} = 0.35 \times \text{Correctness} + 0.25 \times \text{Relevance} + 0.20 \times \text{Reasoning} + 0.20 \times \text{Evidence}$$

*(STAR component scores are strictly `None` for technical and situational questions).*

### 3. Text-Based Communication Scoring
* Evaluates structural flow, paragraph organization, bullet/numbering formatting, and transition words.
* Analyzes conciseness and deducts points for excessive verbal crutches / filler phrases (`basically`, `you know`, `kind of`, `sort of`, `obviously`, `to be honest`, `actually`, `literally`).
* Word-count calibration penalizes extreme brevity (< 30 words) or rambling (> 600 words).
* Clamped between 30 and 98.

### 4. Overall Session Score
$$\text{Average Content Score} = \frac{\sum_{a \in \text{valid evaluated}} a.\text{content\_score}}{|\text{valid evaluated}|}$$
$$\text{Average Communication Score} = \frac{\sum_{a \in \text{valid evaluated}} a.\text{communication\_score}}{|\text{valid evaluated}|}$$
$$\text{Overall Score} = 0.75 \times \text{Average Content Score} + 0.25 \times \text{Average Communication Score}$$

*Pending and failed evaluations are excluded from averages. Missing answers are never treated as zero.*

---

## 6. STAR Rubric Behavior & Limitations

### Capabilities
- Detects contextual markers, problem descriptions, and timeframe constraints for **Situation**.
- Identifies explicit goals and ownership statements for **Task**.
- Validates personal agency and action verbs for **Action**, favoring individual execution over vague team generalities.
- Captures quantifiable metrics (percentages, units, time frames) and retrospectives for **Result**.
- Returns individual component scores and evidence summaries.

### Limitations
- Cannot independently verify the truth of historical claims made by candidates.
- Contexts with highly non-traditional narrative structures may receive lower situation scores despite containing valid experience.

---

## 7. Communication-Scoring Limitations

- **Text-Only Evaluation**: Assesses written organization, syntax, conciseness, and filler phrase density.
- **No Audio/Vocal Analytics**: Plain text analysis cannot assess vocal tone, inflection, pacing, pronunciation, volume, or facial expressions.
- This boundary is explicitly stated in user reports: *"Text-Based Communication Assessment (Evaluates clarity, structural coherence, and articulation in written form; does not measure vocal tone or spoken delivery)."*

---

## 8. Database Changes & Migrations

### Alembic Migration: `0003_interview_engine.py`

#### Schema Updates to `sessions` table:
* Added `job_analysis_id` (`UUID`, foreign key $\rightarrow$ `job_analyses.id` ON DELETE SET NULL, indexed).
* Added `role_title` (`VARCHAR(255)`, nullable).
* Added `question_count` (`INTEGER`, default 5, not null).
* Added `difficulty` (`VARCHAR(50)`, nullable).
* Added `question_types` (`JSONB` / `JSON`, nullable).
* Added `communication_score` (`FLOAT`, nullable).
* Added `completed_at` (`TIMESTAMPTZ`, nullable).

#### Schema Updates to `questions` table:
* Added `rubric_criteria` (`TEXT`, nullable) — private key concepts and STAR evaluation guide.
* Added `target_skill` (`VARCHAR(100)`, nullable) — targeted technology or capability.

#### Schema Updates to `answers` table:
* Added `evaluation_status` (`VARCHAR(50)`, default `'completed'`, not null).
* Added `evaluation_details` (`JSONB` / `JSON`, nullable) — stores strengths, missing elements, suggestions, and communication breakdowns.
* Added `evaluated_at` (`TIMESTAMPTZ`, nullable).

*All migrations are non-destructive and preserve existing user, resume, and job analysis records.*

---

## 9. Files Created or Modified

### Backend Files
* [`backend/app/models/session.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/models/session.py): Extended with `job_analysis_id`, `role_title`, `question_count`, `difficulty`, `question_types`, `communication_score`, `completed_at`.
* [`backend/app/models/question.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/models/question.py): Added `rubric_criteria` and `target_skill`.
* [`backend/app/models/answer.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/models/answer.py): Added `evaluation_status`, `evaluation_details`, `evaluated_at`.
* [`backend/app/models/job_analysis.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/models/job_analysis.py): Linked relationship to `Session`.
* [`backend/alembic/versions/0003_interview_engine.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/alembic/versions/0003_interview_engine.py): Phase 3 schema migration.
* [`backend/app/core/config.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/core/config.py): Added interview count and answer length bounds.
* [`backend/app/schemas/interview.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/schemas/interview.py): Defined Pydantic schemas for creation, questions, answers, evaluations, and reports.
* [`backend/app/schemas/__init__.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/schemas/__init__.py): Re-exported interview schemas.
* [`backend/app/services/ai_provider.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/services/ai_provider.py): Extended provider interface with question generation and answer evaluation.
* [`backend/app/services/question_generator.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/services/question_generator.py): Question synthesis engine with gap prioritization and private rubrics.
* [`backend/app/services/answer_evaluator.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/services/answer_evaluator.py): Dedicated answer evaluator with STAR rubric and text communication metrics.
* [`backend/app/services/report_generator.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/services/report_generator.py): Final report generator, score aggregations, and recommendations.
* [`backend/app/api/interviews.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/api/interviews.py): REST endpoints for session lifecycle, answer submission, reports, and tenant isolation.
* [`backend/app/main.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/app/main.py): Registered interview router and updated metadata to Phase 3.
* [`backend/tests/test_interviews_api.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/tests/test_interviews_api.py): 14 comprehensive tests for Phase 3 functionality.
* [`backend/tests/test_health.py`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/backend/tests/test_health.py): Updated version and metadata assertions.

### Frontend Files
* [`frontend/src/config/api.js`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/frontend/src/config/api.js): Added interview API endpoints.
* [`frontend/src/components/SpeechToTextButton.jsx`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/frontend/src/components/SpeechToTextButton.jsx): Browser speech recognition button with microphone controls and fallback indicator.
* [`frontend/src/components/InterviewReport.jsx`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/frontend/src/components/InterviewReport.jsx): Comprehensive interview report viewer with STAR component breakdown and question feedback.
* [`frontend/src/components/InterviewWorkspace.jsx`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/frontend/src/components/InterviewWorkspace.jsx): Interactive interview setup form, past session history, and live step-by-step simulator.
* [`frontend/src/components/Dashboard.jsx`](file:///c:/Users/jagra/OneDrive/Desktop/interview%20macro/frontend/src/components/Dashboard.jsx): Integrated Interview Simulator navigation tab and quick-action cards.

---

## 10. Dependencies Added

No external pip packages were added; standard libraries and existing Phase 0–2 dependencies (`FastAPI`, `SQLAlchemy`, `Alembic`, `Pydantic`, `PyJWT`, `bcrypt`, `PyMuPDF`) were sufficient.
The frontend uses standard browser Web Speech APIs and existing `lucide-react` icons.

---

## 11. Environment Variables Required

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | String | `postgresql+psycopg://postgres:postgres@localhost:5432/interviewai_dev` | PostgreSQL connection URL |
| `JWT_SECRET_KEY` | String | *(secret random key)* | HMAC-SHA256 token signing key |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Integer | `60` | JWT token validity window |
| `AI_PROVIDER` | String | `deterministic` | Active AI provider (`deterministic` or `gemini`) |
| `GEMINI_API_KEY` | String | `None` | Optional Google Gemini API key |
| `DEFAULT_QUESTION_COUNT` | Integer | `5` | Default number of interview questions |
| `MIN_ANSWER_LENGTH` | Integer | `10` | Minimum allowed answer character length |
| `MAX_ANSWER_LENGTH` | Integer | `5000` | Maximum allowed answer character length |

---

## 12. Exact Commands to Configure, Migrate, and Run

### 1. Database Migration
```powershell
cd backend
python -m alembic upgrade head
```

### 2. Run Backend Test Suite
```powershell
python -m pytest backend/tests -v
```

### 3. Run Backend Server
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Build & Run Frontend
```powershell
cd frontend
npm run build
npm run dev
```

---

## 13. Backend Test Results & Database Engine

### Test Execution Summary
* **Command**: `python -m pytest backend/tests -v`
* **Test Database Engine**: In-memory SQLite with `PRAGMA foreign_keys=ON` event listener fixture (isolated per test run).
* **Real PostgreSQL Verification**: Local workstation does not run a PostgreSQL service on port 5432. All schemas and migrations use PostgreSQL-native UUIDs and JSONB with dialect fallback. PostgreSQL integration against a live database service remains unverified locally until a PostgreSQL daemon is provisioned.
* **Result**: **63 passed, 0 failed, 2 deprecation warnings in 4.66s (100% pass rate)**.

### Test Categories
* `test_auth.py`: 12 tests (registration, password hashing, JWT expiry, tenant profile isolation).
* `test_health.py`: 4 tests (health probes, root metadata, database disconnection handling).
* `test_interviews_api.py`: 14 tests (session creation with gaps, raw JD creation, cross-user isolation attacks on resumes, analyses, and sessions, question order uniqueness, private rubric isolation, STAR behavioral evaluation, technical evaluation without STAR, idempotent answer updating, incomplete report score isolation, safe deletion).
* `test_job_analyzer.py`: 2 tests (required vs preferred segmentation, flat JD analysis).
* `test_matching_engine.py`: 3 tests (4-tier classification, ethical missing evidence wording, weighted coverage formula).
* `test_models.py`: 7 tests (constraints, cascade deletes, JSON types, relationships).
* `test_pdf_extractor.py`: 7 tests (magic byte validation, size bounds, scanned image detection, encryption guard, normalization).
* `test_resume_parser.py`: 3 tests (skill categorization, aliases, structured sections).
* `test_resumes_and_analyses_api.py`: 6 tests (resume upload, cross-user resume isolation, job analysis creation, tenant cross-attack denial).
* `test_security.py`: 5 tests (bcrypt cost factor, length truncation guards, token signatures).

---

## 14. Frontend Build Results

* **Command**: `cd frontend; npm run build`
* **Tool**: Vite v6.4.5 + React 18 + Tailwind CSS v3.4.17
* **Duration**: 4.54s
* **Output**:
  * `dist/index.html`: 0.84 kB (gzip: 0.54 kB)
  * `dist/assets/index-CGFqGbUw.css`: 27.62 kB (gzip: 5.69 kB)
  * `dist/assets/index-BDZ6lNvd.js`: 258.92 kB (gzip: 69.28 kB)
* **Errors / Warnings**: 0 errors, 0 warnings.

---

## 15. End-to-End Verification Performed

| Workflow Step | Test Mechanism | Outcome |
|---|---|---|
| User selects resume and job analysis | Automated API test & UI state binding | Session initialized with role and matched criteria |
| Personalized questions generated | `test_create_interview_session_with_resume_and_analysis` | Questions synthesized targeting skill gaps and evidenced stack |
| Private rubric hidden from candidate | `test_private_rubric_not_exposed_in_candidate_api` | Rubrics stored in DB but stripped from API responses |
| Answer submitted and saved before evaluation | `test_submit_and_evaluate_behavioral_answer_with_star` | Answer committed to DB with pending status, updated to completed on evaluation |
| Behavioral STAR scoring | `test_submit_and_evaluate_behavioral_answer_with_star` | Situation, Task, Action, and Result scored individually |
| Technical non-STAR scoring | `test_submit_and_evaluate_technical_answer_no_star_rubric` | Correctness and reasoning scored; STAR components null |
| Incomplete interview reporting | `test_incomplete_interview_report_does_not_treat_missing_as_zero` | Unanswered questions excluded from score averages |
| Retry without duplicate records | `test_answer_idempotent_retry_updates_without_duplicates` | Updated answer modified existing row; record count = 1 |
| Speech-to-text dictation | Component verification in browser | Microphone activates, inserts recognized text, permits manual edits |

---

## 16. Authentication, Tenant Isolation, and Data Preservation Checks

1. **Authentication Enforcement**: All `/api/v1/interviews` routes reject unauthenticated requests with HTTP 401.
2. **Tenant Isolation Enforced**:
   - Creating an interview using another candidate's resume returns HTTP 404 (`test_interview_cross_user_resume_isolation`).
   - Creating an interview using another candidate's job analysis returns HTTP 404 (`test_interview_cross_user_analysis_isolation`).
   - Viewing, starting, submitting answers to, or retrieving reports for another candidate's session returns HTTP 404 (`test_interview_cross_user_session_access_denied`).
   - Identity is derived strictly from the cryptographic JWT `sub` claim.
3. **Data Preservation**:
   - Cascade delete on `Session` cleans up only its own `Question` and `Answer` records.
   - Deleting a session does not delete the parent `Resume` or `JobAnalysis`.
   - Deleting a `Resume` sets `Session.resume_id` to `NULL` via `ON DELETE SET NULL`, preserving historical interview reports.

---

## 17. Known Issues, Provider Limitations, and Outstanding Security Concerns

1. **Local PostgreSQL Service Inactive**: PostgreSQL server is not running on port 5432 of the local development workstation. While all migrations and models are PostgreSQL-native, local test runs use in-memory SQLite.
2. **Speech Recognition Browser Support**: Web Speech API is natively supported in Chromium browsers (Chrome, Edge) but may require vendor prefixes or be disabled in Firefox / Safari without permissions. The frontend provides a clear fallback notice and never disables manual text entry.
3. **Token Storage**: JWT access tokens are stored in browser `sessionStorage` (isolated to browser tab session). Production deployments should migrate to HttpOnly SameSite cookies with CSRF tokens.
4. **Rate Limiting & Cost Controls**: When `AI_PROVIDER=gemini` is active, API requests should be bounded by external rate limiting or request throttling in production.

---

## 18. Features Explicitly Deferred to Later Phases

- **Phase 4**: Real-time streaming voice/audio processing, server-side audio file storage, speech pacing/pause analytics, and adaptive difficulty adjustment.
- **Phase 5**: PDF report export, historical analytics dashboards, and comparative progress tracking.
- **Phase 6**: Enterprise authentication (OAuth2, MFA, HttpOnly cookie sessions) and cloud container deployment.

---

## 19. Confirmation That Phase 4 Has Not Been Started

Phase 4 has **not** been started. No audio file storage, audio streaming pipelines, adaptive difficulty hooks, or PDF export utilities have been scaffolded.

---

## 20. Recommended Next Step

Wait for user review and explicit approval of Phase 3 before beginning **Phase 4: Adaptive Audio/Speech Infrastructure & Advanced Analytics**.

