# InterviewAI — Phase 6 Completion Report: AI Interview Coach, Personalized Preparation Roadmap, Preparation Planner & Reliability Checks

**Generated:** October 29, 2026  
**Phase Status:** Complete (Phase 6 Verified)  
**Next Phase:** Phase 7: Production Hardening, Rate Limiting & Enterprise Operations (Awaiting Approval)  

---

## 1. Executive Summary

Phase 6 of **InterviewAI** completes the transition from simulation and historical analysis to active, intelligent preparation acceleration. It introduces an interactive **AI Interview Coach**, an evidence-grounded **Personalized Preparation Roadmap**, and a **Preparation Planner** with daily time pacing and velocity metrics.

Key capabilities delivered:
1. **AI Interview Coach**:
   - Deep, non-destructive coaching evaluations for any evaluated interview question.
   - Diagnoses strengths, identifies high-impact weaknesses, and provides concrete, step-by-step actionable improvements.
   - Generates model exemplar answers: strict **STAR** (Situation, Task, Action, Result with quantifiable impact) format for behavioral questions; multi-tier architectural, trade-off, and edge-case framing for technical questions; incident triage and post-mortem frameworks for situational questions.
   - Formulates probing, contextual interviewer follow-up questions to test candidate depth and resilience.
   - **Guaranteed Score Immutability**: The coach never modifies or overwrites the original candidate answer, content score, communication score, or historical evaluation records.
   - Transparent dual-engine architecture: supports Google Gemini when configured; otherwise falls back transparently to deterministic heuristics, clearly labeled as `deterministic_fallback` without falsely claiming LLM generation.
2. **Personalized Preparation Roadmap**:
   - Grounded strictly in persisted candidate evidence: target role requirements, resume competencies, identified job skill gaps from `job_analyses`, and historical evaluations from `analytics_engine`.
   - Distinguishes confirmed strengths ($\ge 80\%$, $\ge 2$ evaluations), developing skills ($60-79.9\%$), priority weak areas ($< 60\%$), and unevidenced gap skills.
   - Assigns practical priorities (High, Medium, Low) and concrete practice modes (`drill_weak_skills`, `mock_interview`, `behavioral_deep_dive`, `coding_deep_dive`).
   - Dynamic recommendation refresh: updates recommendations while strictly preserving completed tasks, in-progress tasks, and custom user tasks.
3. **Preparation Planner & Velocity Mechanics**:
   - Customizable target interview date with future-date validation (rejects past dates) and countdown tracking.
   - Daily prep goal (5 to 480 minutes/day) with validation against negative durations.
   - Derived velocity metrics: progress percentage $(completed / total \times 100)$, estimated remaining practice minutes, and estimated calendar days required to achieve preparation completion.
   - Task management: create custom preparation tasks, toggle statuses (`not_started`, `in_progress`, `completed`), automatic completion timestamping, reopening support, and direct simulation launching.
4. **Database Migration & Multi-User Isolation**:
   - Alembic migration `0006_coach_roadmap_planner.py` non-destructively creating `preparation_plans` and `roadmap_tasks` tables with foreign keys and cascading deletes.
   - Multi-user tenant isolation: all queries and mutations are strictly authorized via cryptographic JWT Bearer tokens.
5. **Quality & Test Verification**:
   - **111 automated backend tests passing** in 6.27 seconds (100% pass rate, 0 failures, 16 new Phase 6 tests).
   - Frontend production bundle (`vite build`) compiled cleanly in 13.16 seconds with zero bundling or syntax errors.

---

## 2. Actual Repository Inspection Findings

Prior to making any code modifications, the repository state was verified:
1. **Existing Baseline**:
   - Alembic migration head was at `0005_advanced_practice_and_analytics`.
   - Backend test suite passed 95 tests in 8.06 seconds.
   - Frontend built cleanly.
2. **Schema & Model Inspection**:
   - `Session` model required `job_description` (`nullable=False`), which was properly accounted for in new test fixtures.
   - `User` model had relationships to `resumes`, `sessions`, and `job_analyses`.
   - `Answer` records stored `content_score`, `communication_score`, `speech_analytics`, and `star_component_scores`.
3. **AI Provider Pipeline**:
   - `backend/app/services/ai_provider.py` provided `BaseAIProvider`, `DeterministicAIProvider`, and `GeminiAIProvider`.
   - The provider interface was extended cleanly with `generate_coaching` to support optional external LLM generation while maintaining deterministic fallback parity.

---

## 3. AI Interview Coach Architecture & Guardrails

### 3.1 Coaching Service (`backend/app/services/coach_service.py`)
The coaching engine evaluates an answered question across multiple dimensions without modifying stored answer data:
- **Strengths**: Analyzes word count, structure, keyword density, technical terms, and STAR component mastery.
- **Weaknesses**: Identifies absence of quantifiable metrics in behavioral answers, lack of architectural trade-offs or failure handling in technical answers, brevity, and verbal filler density.
- **Actionable Improvements**: Delivers 3 concrete, sequential steps to elevate the candidate's answer to senior-level standards.
- **Exemplar Answer Generation**:
  - *Behavioral*: Structured explicitly with `**Situation:**`, `**Task:**`, `**Action:**`, and `**Result:**` containing concrete business metrics (% improvements, latency reductions, time saved).
  - *Technical*: 4-step framework covering high-level architecture, concurrency/state management, latency vs consistency trade-offs, and production observability.
  - *Situational*: 4-step framework covering immediate blast-radius triage, root-cause isolation, stakeholder communication, and blameless post-mortem.
- **Contextual Follow-Up**: Formulates realistic interviewer follow-up questions tailored to the question category.

### 3.2 Guardrails & Attribution Honesty
- **Non-Mutation Rule**: Calling `POST /api/v1/interviews/{session_id}/questions/{question_id}/coach` does not touch `answer.content_score`, `answer.communication_score`, or `answer.answer_text`.
- **Honest Attribution**: If Gemini is offline or unconfigured, `engine` is set to `"deterministic_fallback"` and disclaimer states: *"Generated using InterviewAI deterministic coaching heuristics. No external LLM was used."*

---

## 4. Personalized Preparation Roadmap & Evidence Grounding

### 4.1 Evidence Aggregation (`backend/app/services/roadmap_service.py`)
The preparation roadmap aggregates evidence across three distinct subsystems:
1. **Evaluation Analytics (`analytics_engine.py`)**:
   - `priority_weak_areas`: Skills with $\ge 2$ evaluations averaging $< 60\%$.
   - `developing_skills`: Skills with $\ge 2$ evaluations averaging $60\% - 79.9\%$.
   - `confirmed_strengths`: Skills with $\ge 2$ evaluations averaging $\ge 80\%$.
2. **Job Description Intelligence (`job_analyses`)**:
   - Identifies required competencies missing from the candidate's resume (`missing_skills`).
3. **Empty-State Heuristics**:
   - When a candidate has no prior evaluations or job analyses, the engine generates four foundational engineering and behavioral preparation tasks covering system architecture, STAR leadership, production incidents, and full mock simulations.

### 4.2 Priority Assignment & Task Generation
- **High Priority**: Weak areas ($< 60\%$) and unpracticed job description skill gaps.
- **Medium Priority**: Developing skills ($60-79.9\%$) and STAR narrative formulation.
- **Low Priority**: Maintenance drills for confirmed strengths ($\ge 80\%$).
- **Preservation Contract**: Refreshing recommendations strictly preserves all `completed`, `in_progress`, and `custom` tasks, deleting only untouched, stale `not_started` system tasks.

---

## 5. Preparation Planner & Velocity Mechanics

### 5.1 Plan Settings & Validation
- **Target Role**: Persisted string indicating career focus.
- **Target Interview Date**: Validated future date (`target_interview_date >= date.today()`). Rejecting past dates at the Pydantic schema level ensures integrity.
- **Daily Prep Target**: Validated integer bounded between 5 and 480 minutes/day.

### 5.2 Derived Progress & Velocity Math
- $\text{Progress Percentage} = \text{round}\left(\frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100, 1\right)$
- $\text{Remaining Minutes} = \max(0, \text{Total Estimated Minutes} - \text{Completed Minutes})$
- $\text{Estimated Days to Complete} = \left\lceil \frac{\text{Remaining Minutes}}{\max(5, \text{Daily Prep Minutes})} \right\rceil$
- $\text{Days Remaining} = (\text{Target Date} - \text{Today}).\text{days}$
- Schedule state triggers `overdue` when days remaining $< 0$ or any open task has a past due date.

---

## 6. Database Schema Extension & Alembic Migration

### Migration `0006_coach_roadmap_planner.py`
Created two new relational tables:
1. `preparation_plans`:
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Foreign Key `users.id` with `CASCADE` delete, unique index)
   - `target_role`: VARCHAR(255), nullable
   - `target_interview_date`: DATE, nullable
   - `daily_prep_minutes`: INTEGER, default 30, not null
   - `created_at`, `updated_at`: TIMESTAMPTZ
2. `roadmap_tasks`:
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Foreign Key `users.id` with `CASCADE` delete, index)
   - `plan_id`: UUID (Foreign Key `preparation_plans.id` with `CASCADE` delete, index)
   - `title`: VARCHAR(255), not null
   - `description`: TEXT, nullable
   - `topic`: VARCHAR(100), nullable
   - `category`: VARCHAR(50), default "technical", not null
   - `priority`: VARCHAR(20), default "medium", not null
   - `status`: VARCHAR(20), default "not_started", not null
   - `source`: VARCHAR(50), default "recommended", not null
   - `reason`: TEXT, nullable
   - `estimated_minutes`: INTEGER, default 30, not null
   - `recommended_mode`: VARCHAR(50), nullable
   - `due_date`: DATE, nullable
   - `completed_at`: TIMESTAMPTZ, nullable
   - `order_index`: INTEGER, default 0, not null
   - `created_at`, `updated_at`: TIMESTAMPTZ

---

## 7. API Endpoints & Schema Contracts

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/interviews/{session_id}/questions/{question_id}/coach` | Generates AI coaching feedback, strengths, weaknesses, exemplar answer, and follow-up question. |
| `GET` | `/api/v1/roadmap` | Retrieves the candidate's active plan, prioritized tasks, velocity metrics, and evidence summary. |
| `POST` | `/api/v1/roadmap/generate` | Refreshes roadmap recommendations against recent evidence while preserving completed tasks. |
| `PUT` | `/api/v1/roadmap/plan` | Updates target role, future interview date, and daily prep goal. |
| `POST` | `/api/v1/roadmap/tasks` | Creates a custom preparation task. |
| `PATCH` | `/api/v1/roadmap/tasks/{task_id}` | Updates task status, priority, or notes; auto-updates `completed_at`. |
| `DELETE` | `/api/v1/roadmap/tasks/{task_id}` | Deletes an owned preparation task. |

---

## 8. Frontend Components & User Experience

### 8.1 `AICoachModal.jsx`
- Interactive modal triggered by the "Ask AI Coach" button in `InterviewWorkspace` and `InterviewReport`.
- Displays question context, candidate response, strengths, weaknesses, step-by-step improvements, and formatted exemplar answers.
- Engine attribution banner clearly distinguishing Gemini vs. Deterministic Heuristics.
- One-click copy button for exemplar responses.
- Contextual interviewer follow-up questions with preparation guidance.

### 8.2 `RoadmapPlanner.jsx`
- Dedicated roadmap dashboard tab with goal management and velocity tracking.
- Goal Card: edit target role, interview date, and daily prep target.
- Metrics Cards: visual progress bar, total vs completed minutes, velocity pace calculation, and schedule timeline assessment.
- Evidence Grounding Matrix: visual display of confirmed strengths, developing skills, and JD gaps.
- Filter Tabs: All, Pending, Completed, and High Priority.
- Direct Practice Launch: "Practice Now" button transfers topic and mode directly into the interview simulator.
- Custom Task Modal: add custom study topics with category and priority.

### 8.3 Integrated Navigation (`Dashboard.jsx`)
- Added "Preparation Roadmap" tab with `Compass` icon between Overview and Performance Analytics.
- Integrated "Ask AI Coach" action buttons across both `InterviewWorkspace.jsx` and `InterviewReport.jsx`.

---

## 9. Automated Testing & Verification Results

### Backend Automated Test Suite
- Executed: `python -m pytest backend/tests -v`
- Result: **111 passed, 0 failed in 6.27 seconds (100% pass rate)**.
- New Phase 6 Tests:
  - `test_coach_service_behavioral_exemplar_and_star`: Verified STAR exemplar and actionable feedback.
  - `test_coach_service_technical_architecture`: Verified architectural reasoning and trade-offs.
  - `test_coach_service_situational`: Verified triage and post-mortem guidance.
  - `test_coach_service_short_answer_feedback`: Verified brevity feedback.
  - `test_coach_non_mutation_of_answer_and_scores`: Verified strict immutability of submitted answers and historical scores.
  - `test_coach_unanswered_question_rejected`: Verified 400 Bad Request on unanswered questions.
  - `test_coach_cross_user_isolation`: Verified 404 on cross-user coaching requests.
  - `test_get_roadmap_overview_creates_defaults`: Verified initial plan and foundational tasks.
  - `test_update_plan_valid_and_future_date`: Verified updating plan settings.
  - `test_update_plan_rejects_past_date`: Verified validation rejection of past dates.
  - `test_update_plan_rejects_invalid_daily_minutes`: Verified rejection of negative or excessive daily minutes.
  - `test_roadmap_generation_from_evidence`: Verified priority assignment from weak areas, developing skills, and JD gaps.
  - `test_roadmap_refresh_preserves_completed_and_custom_tasks`: Verified preservation of completed and custom tasks.
  - `test_task_status_toggle_and_completed_at`: Verified timestamp toggle behavior.
  - `test_metrics_calculation_math`: Verified mathematical accuracy of progress percentages and velocity.
  - `test_custom_task_crud_and_isolation`: Verified CRUD operations and tenant isolation.

### Frontend Production Build
- Executed: `npm --prefix frontend run build`
- Result: **Clean build in 13.16 seconds, 0 errors, 0 warnings**.
- Assets generated: `dist/index.html` (0.84 kB), `dist/assets/index.css` (36.93 kB), `dist/assets/index.js` (347.10 kB).

---

## 10. Honest Limitations & Future Architectural Considerations

1. **Local Database Verification**: Automated tests run against SQLite with enforced foreign keys. Production PostgreSQL deployment requires a live connection to execute Alembic migration `0006_coach_roadmap_planner.py`.
2. **Notification Infrastructure**: Preparation planner tracking is strictly local-first and on-demand within the UI. No background worker, cron scheduler, or external push/email notification system was built.
3. **LLM Provider Availability**: Gemini coaching is active when `AI_PROVIDER='gemini'` and `GEMINI_API_KEY` is present. The platform's deterministic fallback handles offline/unauthenticated scenarios.
4. **Exemplar Customization**: Deterministic exemplar answers are dynamically tailored based on question category, difficulty, and target skill, but do not synthesize novel domain stories without an external LLM.

---

## 11. Summary of Completed Capabilities

- [x] Non-destructive Alembic migration (`0006_coach_roadmap_planner.py`) creating `preparation_plans` and `roadmap_tasks`.
- [x] AI Interview Coach service with strengths, weaknesses, actionable improvements, exemplar answers, and follow-up questions.
- [x] Strict immutability guarantee: coaching requests never alter answer text or scores.
- [x] Transparent dual-engine architecture: Gemini support with honest deterministic fallback labeling.
- [x] Personalized preparation roadmap grounded in performance analytics and job description skill gaps.
- [x] Task preservation: refreshing recommendations never deletes completed or custom tasks.
- [x] Preparation planner with future-date validation, daily prep minute goals, and countdown tracking.
- [x] Derived velocity metrics: progress percentage, remaining practice minutes, and estimated completion days.
- [x] Interactive `AICoachModal` component integrated into both the interview simulator and post-interview reports.
- [x] Comprehensive `RoadmapPlanner` frontend tab with filterable task boards and direct simulation launching.
- [x] 111 passing automated backend tests and 0-error frontend production build.

