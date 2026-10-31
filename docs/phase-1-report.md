# InterviewAI — Phase 1 Completion Report: Authentication and Multi-User Security

**Generated:** October 29, 2026  
**Phase Status:** Complete (Phase 1 Verified)  
**Next Phase:** Phase 2: Resume Parsing & Session Creation (Awaiting Approval)  

---

## 1. Phase Objective & Implementation Summary

The objective of **Phase 1** was to implement a secure, multi-user authentication system, token-based identity verification, strict user data isolation, and a responsive authentication user experience for **InterviewAI**.

All Phase 0 foundations (FastAPI application, PostgreSQL/SQLAlchemy models, Alembic migrations, health checks, and 11 baseline tests) were preserved intact. On top of this foundation, Phase 1 introduces:
- Secure candidate account registration with email normalization and duplicate detection (`POST /api/v1/auth/register`).
- Salted `bcrypt` password hashing (cost factor 12) with length validation and timing attack mitigation.
- Cryptographically signed JWT access tokens (HMAC-SHA256) with configurable expiration.
- Constant-time password verification and generic error messaging to defeat account enumeration.
- Reusable authentication dependency (`get_current_user`) enforcing multi-tenant isolation.
- Safe profile retrieval (`GET /api/v1/auth/me`) guaranteeing password hashes are never exposed.
- A polished, responsive React 18 + Tailwind CSS frontend authentication workflow featuring Login/Register modals, client-side validation, session-scoped token management, safe initial state checking, and a protected candidate dashboard.
- 17 new automated tests (28 tests in total across Phase 0 and Phase 1), with 100% passing results.

---

## 2. Authentication Flow and API Endpoints

### Authentication Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate (Browser)
    participant Frontend as React / Vite Frontend
    participant API as FastAPI Backend
    participant Security as Bcrypt & PyJWT Engine
    participant DB as Database (PostgreSQL / SQLite)

    Note over Candidate,DB: Registration Flow
    Candidate->>Frontend: Enters Name, Email, Password (>= 8 chars)
    Frontend->>Frontend: Client-side validation
    Frontend->>API: POST /api/v1/auth/register {name, email, password}
    API->>DB: Query User by normalized email
    alt Email already exists
        API-->>Frontend: HTTP 409 Conflict ("Email already exists")
        Frontend-->>Candidate: Displays inline error
    else Email is unique
        API->>Security: hash_password(password) -> bcrypt salt & hash
        API->>DB: INSERT INTO users (id, name, email, password_hash)
        API->>Security: create_access_token(sub=user.id, email=user.email)
        API-->>Frontend: HTTP 201 Created {access_token, token_type: "bearer", user}
        Frontend->>Frontend: Store token in sessionStorage & state
        Frontend-->>Candidate: Render Protected Candidate Dashboard
    end

    Note over Candidate,DB: Subsequent Requests / Verification
    Candidate->>Frontend: Loads page or navigates
    Frontend->>API: GET /api/v1/auth/me (Header: Authorization: Bearer <token>)
    API->>Security: decode_access_token(token) -> verify signature & expiration
    API->>DB: SELECT * FROM users WHERE id = sub
    API-->>Frontend: HTTP 200 OK {id, name, email, created_at}
    Frontend-->>Candidate: Displays Candidate Dashboard with isolated profile
```

### Endpoints Implemented

| Method | Endpoint | Access | Purpose | Success Code | Error Codes |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new candidate account | `201 Created` | `409 Conflict`, `422 Unprocessable` |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email & password | `200 OK` | `401 Unauthorized`, `422 Unprocessable` |
| `GET` | `/api/v1/auth/me` | Protected | Retrieve authenticated user profile | `200 OK` | `401 Unauthorized` |

---

## 3. Password Hashing and Token-Storage Decisions

### Password Hashing (`bcrypt`)
- **Library**: `bcrypt` (v5.0.0, official C-extension implementation).
- **Salt Generation**: Automatically generated per password via `bcrypt.gensalt(rounds=12)`.
- **Architectural Constraints**:
  - Minimum password length: 8 characters (enforced via Pydantic schema and security validator).
  - Maximum password length: 72 bytes (enforced strictly to prevent silent bcrypt truncation vulnerabilities).
- **Plaintext Protection**: Passwords are never logged, printed, or saved in plaintext. Only the salted bcrypt hash is stored in `users.password_hash`.

### Token Storage Strategy & Trade-Offs
- **Storage Choice**: Standard HTTP `Authorization: Bearer <token>` delivery, with client-side token storage in `sessionStorage` and active React memory.
- **Why `sessionStorage` was chosen over `localStorage`**:
  - `sessionStorage` is automatically scoped to the active browser tab session and cleared when the tab/browser closes. This prevents indefinite token persistence on shared or public workstations, significantly reducing the attack window compared to permanent `localStorage`.
- **Known Security Limitations of Bearer Tokens in Browser Storage**:
  - Client-accessible storage (`sessionStorage` and `localStorage`) cannot be hidden from JavaScript running in the same origin. If the application were to become vulnerable to Cross-Site Scripting (XSS), an injected script could read the token.
- **Production Hardening Recommendation (Phase 6)**:
  - Migrate authentication token transmission to `HttpOnly`, `SameSite=Strict`, `Secure` cookies with anti-CSRF double-submit cookies or CSRF header verification, coupled with short-lived access tokens (15 minutes) and rotating refresh tokens.

---

## 4. Security Protections and Remaining Risks

### Implemented Protections
1. **Generic Login Failure Messages**: Both incorrect passwords and non-existent accounts return the exact same generic error: `"Invalid email or password"` (HTTP 401).
2. **Timing Side-Channel Mitigation**: When a non-existent email is supplied to `/login`, the backend executes a dummy bcrypt comparison against a precomputed cost-12 hash, equalizing response latency and preventing timing-based username enumeration.
3. **Email Normalization**: Emails are stripped of whitespace and converted to lowercase on both registration and login, preventing account duplication via casing tricks (e.g., `User@Example.com` vs `user@example.com`).
4. **Credential Leak Prevention**: The `UserResponse` Pydantic model explicitly whitelists safe fields (`id`, `name`, `email`, `created_at`) and omits `password_hash`.
5. **No Blind Client Trust**: On application launch, the frontend executes a real verification request to `GET /api/v1/auth/me` rather than assuming valid authentication based solely on cached client tokens.

### Remaining Risks & Out-of-Scope Items for Phase 1
- **No Refresh Tokens**: Access tokens expire after a configured duration (`ACCESS_TOKEN_EXPIRE_MINUTES=60`). Token renewal currently requires re-authenticating.
- **No Password Reset / Forgot Password**: Lost passwords cannot currently be reset self-service.
- **No Rate Limiting / Brute-Force Throttling**: A distributed rate limiter (e.g. Redis-backed slowapi) should be added in production to mitigate credential stuffing.
- **No Multi-Factor Authentication (MFA) or OAuth2**: Social logins and TOTP are not yet supported.

---

## 5. User-Isolation Approach

Multi-user tenant isolation is enforced at the architectural dependency level:
1. **Token-Derived Identity**: The dependency `get_current_user` in `backend/app/api/deps.py` extracts the subject (`sub`) directly from the cryptographically verified JWT payload.
2. **Zero Client Parameter Spoofing**: No user-specific endpoint accepts a `user_id` query, path, or body parameter from the client. User identity is strictly derived from the verified token.
3. **Database Relational Integrity**: All child entities (`resumes`, `sessions`) reference `users.id` via indexed foreign keys, ensuring queries in future phases will filter strictly on `WHERE user_id = current_user.id`.
4. **Automated Verification**: `test_multi_user_data_isolation` explicitly registers two distinct candidates (Alpha and Beta), presents their tokens independently, and proves neither user can view or impersonate the other's profile.

---

## 6. Files Created or Modified

| File Path | Status | Purpose |
|---|---|---|
| `backend/requirements.txt` | Modified | Added `bcrypt>=4.0.0,<6.0.0` and `pyjwt>=2.8.0,<3.0.0`. |
| `backend/app/core/config.py` | Modified | Added `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `BCRYPT_ROUNDS`. |
| `backend/.env.example` | Modified | Added security configuration placeholders with key generation advice. |
| `backend/app/core/security.py` | Created | Salted bcrypt hashing, password verification, JWT creation and decoding. |
| `backend/app/schemas/user.py` | Created | `UserResponse` model safe from credential leakage. |
| `backend/app/schemas/auth.py` | Created | `UserRegisterRequest`, `UserLoginRequest`, `TokenResponse` with Pydantic validation. |
| `backend/app/schemas/__init__.py` | Modified | Registered auth and user schemas. |
| `backend/app/api/deps.py` | Created | `get_current_user` FastAPI dependency for cryptographic JWT extraction and user retrieval. |
| `backend/app/api/auth.py` | Created | `POST /register`, `POST /login`, `GET /me` route implementations. |
| `backend/app/main.py` | Modified | Registered auth router at `/api/v1/auth`, updated root phase indicator. |
| `backend/tests/test_security.py` | Created | 5 tests for hashing, salt variation, length limits, and JWT tampering/expiry. |
| `backend/tests/test_auth.py` | Created | 12 integration tests for registration, normalization, duplicates, login, `/me`, and user isolation. |
| `backend/tests/test_health.py` | Modified | Updated root endpoint assertion to match Phase 1 status string. |
| `frontend/src/config/api.js` | Modified | Added auth endpoint URLs (`AUTH_REGISTER`, `AUTH_LOGIN`, `AUTH_ME`). |
| `frontend/src/context/AuthContext.jsx` | Created | React Auth Context, token storage, login/register/logout methods, and `/me` verification. |
| `frontend/src/components/AuthModal.jsx` | Created | Responsive modal with Sign In and Register tabs, client validation, and error alerts. |
| `frontend/src/components/Dashboard.jsx` | Created | Protected candidate dashboard displaying profile metadata, tenant isolation state, and empty state. |
| `frontend/src/components/Header.jsx` | Modified | Added user initials avatar, Sign Out button, and Sign In / Register action triggers. |
| `frontend/src/components/EmptyState.jsx` | Modified | Updated Phase 1 active status and added registration/login buttons. |
| `frontend/src/App.jsx` | Modified | Integrated `AuthProvider`, route protection based on authentication state, and session loading spinner. |
| `docs/phase-1-report.md` | Created | Complete Phase 1 technical completion report. |

---

## 7. Dependencies Installed

### Backend
- `bcrypt==5.0.0`: Industry standard password hashing
- `pyjwt==2.13.0`: Cryptographic JSON Web Token encoding, signing, and verification
- `email-validator==2.3.0`: RFC-compliant email address validation

### Frontend
- All frontend dependencies from Phase 0 (`react 18.3.1`, `vite 6.4.5`, `tailwindcss 3.4.17`, `lucide-react 0.460.0`) were reused without adding extraneous packages.

---

## 8. Environment Variables and Example Configuration

### Backend (`backend/.env`)
```bash
# Application Configuration
ENVIRONMENT=development
PROJECT_NAME=InterviewAI
DEBUG=True
API_V1_PREFIX=/api/v1
HOST=127.0.0.1
PORT=8000

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/interviewai_dev

# Security & Authentication Configuration
JWT_SECRET_KEY=dev-secret-key-replace-with-openssl-rand-hex-32-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BCRYPT_ROUNDS=12

# Allowed CORS Origins
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

### Frontend (`frontend/.env.local`)
```bash
VITE_API_URL=http://127.0.0.1:8000
VITE_APP_ENV=development
```

---

## 9. Exact Commands to Run Frontend and Backend

### 1. Run Backend Tests
```bash
cd backend
python -m pytest tests -v
```

### 2. Start Backend API Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/health`
- Auth Endpoints: `http://localhost:8000/api/v1/auth/`

### 3. Build & Start Frontend
```bash
cd frontend
npm run build
npm run dev
```
- Accessible in browser: `http://localhost:5173`

---

## 10. Database Migration Requirements

- **Inspection Finding**: The existing `users` table established in Phase 0 migration `0001_initial_schema.py` contains:
  - `id`: UUID Primary Key
  - `name`: VARCHAR(255)
  - `email`: VARCHAR(255) Unique Indexed
  - `password_hash`: VARCHAR(255)
  - `created_at`: TIMESTAMP WITH TIME ZONE
- **Migration Result**: No new Alembic migration was required. The Phase 0 schema already provides all fields needed for Phase 1 authentication. Existing schema heads remain at `0001_initial_schema`.

---

## 11. Tests Run, Results, and Database Engine Used

### Test Suite Execution
Tests were executed using Pytest against an isolated in-memory SQLite test database with `PRAGMA foreign_keys=ON` to verify constraints and cascades:

```text
============================= test session starts =============================
platform win32 -- Python 3.14.5, pytest-9.2.0, pluggy-1.7.0 -- C:\Program Files\Python314\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\jagra\OneDrive\Desktop\interview macro
plugins: anyio-4.14.1
collecting ... collected 28 items

backend/tests/test_auth.py::test_successful_registration PASSED          [  3%]
backend/tests/test_auth.py::test_email_normalization_on_registration PASSED [  7%]
backend/tests/test_auth.py::test_duplicate_email_registration_conflict PASSED [ 10%]
backend/tests/test_auth.py::test_registration_schema_validation PASSED   [ 14%]
backend/tests/test_auth.py::test_successful_login PASSED                 [ 17%]
backend/tests/test_auth.py::test_login_invalid_password_generic_error PASSED [ 21%]
backend/tests/test_auth.py::test_login_nonexistent_user_generic_error PASSED [ 25%]
backend/tests/test_auth.py::test_get_current_user_profile_me_success PASSED [ 28%]
backend/tests/test_auth.py::test_get_current_user_unauthenticated_missing_token PASSED [ 32%]
backend/tests/test_auth.py::test_get_current_user_invalid_token PASSED   [ 35%]
backend/tests/test_auth.py::test_get_current_user_expired_token PASSED   [ 39%]
backend/tests/test_auth.py::test_multi_user_data_isolation PASSED        [ 42%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 46%]
backend/tests/test_health.py::test_health_check_healthy PASSED           [ 50%]
backend/tests/test_health.py::test_health_check_unhealthy PASSED         [ 53%]
backend/tests/test_health.py::test_check_db_connectivity_failure_handling PASSED [ 57%]
backend/tests/test_models.py::test_user_creation_and_constraints PASSED  [ 60%]
backend/tests/test_models.py::test_resume_creation_and_json_field PASSED [ 64%]
backend/tests/test_models.py::test_session_lifecycle_and_resume_relationship PASSED [ 67%]
backend/tests/test_models.py::test_questions_type_and_difficulty_validation PASSED [ 71%]
backend/tests/test_models.py::test_question_order_uniqueness_per_session PASSED [ 75%]
backend/tests/test_models.py::test_answer_lifecycle_and_star_scores PASSED [ 78%]
backend/tests/test_models.py::test_data_preservation_and_cascade_behaviors PASSED [ 82%]
backend/tests/test_security.py::test_hash_password_and_verification PASSED [ 85%]
backend/tests/test_security.py::test_hash_password_length_constraints PASSED [ 89%]
backend/tests/test_security.py::test_create_and_decode_access_token PASSED [ 92%]
backend/tests/test_security.py::test_expired_token_raises_exception PASSED [ 96%]
backend/tests/test_security.py::test_tampered_token_raises_exception PASSED [100%]

======================= 28 passed, 2 warnings in 4.33s ========================
```
*Note on Database Engine*: Pytest tests executed against an isolated in-memory SQLite database. As noted in Phase 0, a local PostgreSQL daemon is not running on port 5432 in this local environment; live PostgreSQL connectivity remains to be verified once a live PostgreSQL daemon is started.

---

## 12. Frontend Build Results

The React/Vite production build was executed and verified:

```text
> vite build
vite v6.4.5 building for production...
transforming...
✓ 1579 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.84 kB │ gzip:  0.54 kB
dist/assets/index-DMibKPRp.css   20.00 kB │ gzip:  4.45 kB
dist/assets/index-CgwPYgF_.js   179.44 kB │ gzip: 54.69 kB
✓ built in 4.23s
```

---

## 13. Known Issues and Production-Hardening Tasks

1. **Local PostgreSQL Service**:
   - The local Windows workstation does not run a PostgreSQL instance on port 5432. All ORM models and migrations are built for PostgreSQL with full JSONB and UUID compliance, but live integration requires starting PostgreSQL.
2. **Session Hijacking / XSS Protection**:
   - In production, transition bearer tokens stored in `sessionStorage` to `HttpOnly` and `SameSite=Strict` cookies with CSRF defense.
3. **Brute Force Protection**:
   - Add IP-level or account-level rate limiting on `POST /api/v1/auth/login` to prevent credential dictionary attacks.
4. **Password Reset Flow**:
   - Implement signed password reset tokens sent via email in a future security hardening phase.

---

## 14. Confirmation That Phase 2 Has Not Been Started

The following features belong strictly to future phases and **have NOT been implemented**:
- [x] **No Resume Upload or Parsing**: No PDF/DOCX file extractors, OCR, or resume processing routes.
- [x] **No Job Description Analysis**: No skill matching or NLP analysis endpoints.
- [x] **No Interview Session Creation**: No mock interview generation or question dispatching.
- [x] **No Audio or AI Integrations**: No Whisper, Gemini, OpenAI, or speech synthesis integrations.

---

## 15. Recommended Next Phase

**Recommended Next Step: Phase 2 — Resume Parsing and Job Targeting**
- Introduce resume upload endpoint (`POST /api/v1/resumes/upload`) supporting PDF and text ingestion.
- Implement text extraction and structured skill parsing into the `resumes.parsed_skills` JSONB column.
- Implement interview session initialization (`POST /api/v1/sessions`) linking authenticated candidates to target job descriptions and parsed resumes.

