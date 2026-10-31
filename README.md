# PrepVerse AI — Career Readiness & Skill Assessment Platform

> **Prepare Smarter. Practice Deeper. Become Interview-Ready.**

PrepVerse AI is a full-stack, enterprise-grade AI interview preparation, skill assessment, and personalized coaching platform. It features deep resume intelligence, job description requirement matching, adaptive multimodal interview simulations (text & voice), STAR behavioral evaluation, longitudinal performance analytics, an AI coach with actionable feedback, and an evidence-grounded preparation roadmap.

---

## Brand Identity & Design System
- **Product Name**: PrepVerse AI
- **Tagline**: *Prepare Smarter. Practice Deeper. Become Interview-Ready.*
- **Visual Identity**: Geometric monogram "P" unified with a cosmic orbital arc and forward-propelling momentum beam.
- **Palette**: Deep space navy (`#0B0F19`, `#0F172A`), electric violet (`#8B5CF6`), and radiant cyan (`#38BDF8`).

---

## Core Capabilities

1. **Authentication & Multi-User Isolation (Phase 1)**
   - Salted bcrypt password hashing (cost factor 12).
   - HMAC-SHA256 JWT bearer tokens with configurable expiration.
   - Strict ORM-level tenant isolation derived from authenticated credentials.

2. **Resume Intelligence & Job Matching (Phase 2)**
   - Client & server-side PDF text extraction powered by PyMuPDF.
   - Skill taxonomy parsing, experience categorization, and target role keyword matching.
   - Transparent, explainable skill gap identification and coverage scoring.

3. **Multimodal Interview Simulation Engine (Phases 3 & 4)**
   - Personalized question generation targeting resume skills and job requirements.
   - Flexible question counts (up to 50 questions per session) with cross-session deduplication.
   - Real-time voice and text interaction modes with microphone recording and live browser speech synthesis.
   - Speech delivery analytics: speaking pace (WPM), filler word detection, duration tracking, and STAR rubric scoring.
   - Adaptive difficulty engine adjusting dynamically to candidate answer depth.

4. **Longitudinal Analytics & PDF Reports (Phase 5)**
   - Multi-session performance tracking, score trajectories, and competency breakdown.
   - Direct export of branded PDF reports with comprehensive evaluation summaries and disclaimers.
   - Specialized practice modes: *Mock Interview*, *Quick Practice*, *Weak-Area Focus*, and *Focused Technical*.

5. **AI Interview Coach & Preparation Roadmap (Phase 6)**
   - On-demand AI Coach delivering targeted strengths, constructive weaknesses, follow-up probes, and model exemplar answers.
   - Evidence-grounded preparation roadmap dynamically scheduled around real interview dates and daily study goals.
   - Interactive daily task planner supporting custom task creation and status tracking.

6. **Scalability & Resiliency Upgrade**
   - High-throughput database query pagination (`limit` & `offset`) with SQLAlchemy `selectinload`.
   - Bounded retries and graceful fallback handling for AI provider quota exhaustion (HTTP 429).
   - Candidate Interview Readiness Index with interactive progress widgets.

---

## Technology Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS 3.4, Lucide Icons
- **Backend**: FastAPI 0.141, Python 3.14 / 3.12, Uvicorn
- **Database & ORM**: PostgreSQL (configured) / SQLite (test suite), SQLAlchemy 2.0, Alembic
- **AI Integrations**: Google Gemini API (optional) with robust deterministic heuristic fallback
- **PDF Extraction & Generation**: PyMuPDF (`fitz`), ReportLab
- **Testing**: Pytest 9.2 (116 automated backend unit and integration tests)

---

## Project Structure

```text
.
├── backend/
│   ├── alembic/
│   │   ├── versions/           # Database migration scripts (0001 through 0006)
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/                # API route handlers (auth, resumes, jobs, interviews, analytics, coach, roadmap)
│   │   ├── core/               # Configuration (config.py), database session management
│   │   ├── models/             # SQLAlchemy ORM models (User, Resume, JobAnalysis, Session, Question, Answer, Roadmap)
│   │   ├── schemas/            # Pydantic schemas and validation
│   │   ├── services/           # Business logic (ai_provider, question_generator, answer_evaluator, speech, pdf, coach, roadmap)
│   │   └── main.py             # FastAPI entry point
│   ├── tests/                  # Pytest test suite (116 passing tests)
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── public/                 # Favicon, logo-symbol, and full SVG brand marks
│   ├── src/
│   │   ├── components/         # React components (Logo, Header, AuthModal, Dashboard, InterviewWorkspace, etc.)
│   │   ├── context/            # Authentication context and secure token management
│   │   ├── config/             # API configuration and endpoints
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html              # Branded entry page
│   ├── package.json
│   └── vite.config.js
└── docs/                       # Implementation reports (Phase 0 through PrepVerse AI Upgrade)
```

---

## One-Command Local Launch (Recommended)

To run the complete full-stack application (FastAPI backend + React/Vite frontend + Database) with a single command:

```bash
python app.py
```

### What `python app.py` does automatically:
1. **Verifies Prerequisites**: Checks Python (3.9+), required backend libraries, and Node.js/npm.
2. **Verifies Database**: Connects to the configured database (zero-config SQLite or PostgreSQL) and verifies all schema tables.
3. **Spawns Services**: Concurrently starts the FastAPI backend (port 8000) and React/Vite frontend (port 5173).
4. **Health Check Polling**: Awaits verified HTTP 200 OK responses from both services before announcing success.
5. **Launches Default Browser**: Automatically opens the web application at `http://127.0.0.1:5173`.
6. **Graceful Teardown**: Intercepts `Ctrl+C` and cleanly terminates all child processes without leaving orphaned processes.

---

## Teacher Demonstration Checklist

When presenting PrepVerse AI to teachers or evaluators, follow this recommended walkthrough:

| # | Feature Flow | What to Demonstrate |
| :--- | :--- | :--- |
| **1** | **Candidate Dashboard** | Show the **Interview Readiness Index** circular ring (0–100%), 4 readiness pillars, and elevated action shortcuts. |
| **2** | **Theme Toggle & Shell** | Demonstrate the **Dark / Light theme switch** in the topbar, responsive collapsible sidebar (240px ↔ 80px), and system health telemetry. |
| **3** | **Authentication** | Demonstrate Sign In and Create Account tabs with client validation and password visibility toggle. |
| **4** | **Resume Intelligence** | Upload a candidate PDF resume to view extracted skills categorized into languages, frameworks, databases, and DevOps tools. |
| **5** | **Job Description Match** | Paste a target job description to view keyword alignment percentage and missing skill gaps. |
| **6** | **Interview Simulator** | Launch an adaptive simulation; highlight question stepper dots, elapsed timer, mode switcher, and unsaved draft warning. |
| **7** | **Voice & Text Answering** | Demonstrate live audio speech-to-text recording or text typing with live word counter (`X words • Y / 5000 chars`). |
| **8** | **STAR Rubric Evaluation** | Submit an answer to view instant scoring across Situation, Task, Action, and Result components. |
| **9** | **AI Coach Hub & Exemplars** | Open the dedicated **AI Coach Hub** to study a model exemplar answer with 1-click clipboard copy and interviewer follow-up questions. |
| **10** | **Longitudinal Analytics** | Inspect the historical score trajectory SVG bar chart, speaking pace (WPM), and 3-column competency matrix. |
| **11** | **Executive PDF Report** | Click **Download PDF Report** to export a formatted executive candidate evaluation report. |
| **12** | **Roadmap & Daily Planner** | Set a target interview date to generate an evidence-grounded milestone roadmap and daily practice planner with task toggles. |

---

## Manual Setup & Development Guide

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python -m alembic upgrade head

# Run backend test suite
python -m pytest tests -v

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API documentation: `http://localhost:8000/docs`  
Health check endpoint: `http://localhost:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build check
npm run build

# Start Vite development server
npm run dev
```

Frontend application will be accessible at `http://localhost:5173`.

---

## Troubleshooting & FAQ

### Port 8000 or 5173 is already in use
If an earlier process was not terminated, free the ports:
- **Windows**:
  ```powershell
  # Find process using port 8000 or 5173
  netstat -ano | findstr :8000
  # Terminate by PID
  taskkill /F /PID <PID>
  ```
- **macOS / Linux**:
  ```bash
  lsof -ti:8000 | xargs kill -9
  lsof -ti:5173 | xargs kill -9
  ```

### Database Options (SQLite vs PostgreSQL)
- **Default (Zero-Config SQLite)**: `prepverse_dev.db` in project root. Requires no external database servers or services installed.
- **Production PostgreSQL**: If you prefer PostgreSQL, ensure PostgreSQL is running, create the database (`createdb -U postgres interviewai_dev`), and set in `backend/.env`:
  ```env
  DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/interviewai_dev
  ```
  Then run migrations: `cd backend && python -m alembic upgrade head`.

### AI Engine Modes
- **Offline / Deterministic (Default)**: `AI_PROVIDER=deterministic` runs locally with zero external network dependencies, generating tailored questions, evaluations, and coaching exemplars.
- **Google Gemini (Optional)**: Set `AI_PROVIDER=gemini` and provide `GEMINI_API_KEY=your_key` in `backend/.env`. If the key is missing or quota is exhausted, the system falls back gracefully to the deterministic engine without breaking.

### Voice & Speech Permissions
- Voice recording uses the browser's native Web Speech API. Ensure microphone access is permitted when prompted by your browser. If using an unsupported browser or microphone is disabled, text answering mode is available seamlessly.

