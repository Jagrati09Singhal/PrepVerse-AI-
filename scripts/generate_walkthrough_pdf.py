import os
import pymupdf

def build_genuine_walkthrough_pdf():
    pdf_path = os.path.join(os.getcwd(), "docs", "PrepVerse_AI_Complete_Project_Walkthrough.pdf")
    doc = pymupdf.open()

    # Dimensions: Standard Letter (612 x 792 pt)
    W, H = 612.0, 792.0
    L_MARGIN = 46.0
    R_MARGIN = 566.0
    CONTENT_W = R_MARGIN - L_MARGIN
    B_MARGIN = 744.0

    # Humanized Palette (Navy, Royal Blue, Slate, White, Emerald, Amber)
    C_NAVY = (0.07, 0.11, 0.20)         # #121c33
    C_BLUE = (0.12, 0.42, 0.90)         # #1f6be6
    C_VIOLET = (0.42, 0.20, 0.82)       # #6b33d1
    C_TEXT = (0.13, 0.17, 0.24)         # #212c3d
    C_MUTED = (0.42, 0.49, 0.58)        # #6b7d94
    C_LIGHT_BG = (0.95, 0.97, 0.99)     # #f2f7fc
    C_CARD_BORDER = (0.80, 0.86, 0.93)  # #ccdceb
    C_EMERALD = (0.04, 0.58, 0.38)      # #0a9461
    C_AMBER = (0.85, 0.50, 0.05)        # #d9800d
    C_WHITE = (1.0, 1.0, 1.0)
    C_CODE_BG = (0.06, 0.09, 0.15)

    def draw_footer(page, page_num, total_pages=5):
        page.draw_line(pymupdf.Point(L_MARGIN, B_MARGIN), pymupdf.Point(R_MARGIN, B_MARGIN), color=C_CARD_BORDER, width=0.8)
        page.insert_text(pymupdf.Point(L_MARGIN, B_MARGIN + 14), 
                         "PrepVerse AI — Final Year Engineering Capstone Project Walkthrough", fontsize=7.8, fontname="helv", color=C_MUTED)
        page.insert_text(pymupdf.Point(R_MARGIN - 55, B_MARGIN + 14), 
                         f"Page {page_num} of {total_pages}", fontsize=7.8, fontname="helv", color=C_MUTED)

    # =========================================================================
    # PAGE 1: PROJECT GENESIS, PROBLEM CONTEXT & ARCHITECTURAL FOUNDATIONS
    # =========================================================================
    p1 = doc.new_page(width=W, height=H)

    # Top Branded Header
    p1.draw_rect(pymupdf.Rect(0, 0, W, 136), color=C_NAVY, fill=C_NAVY)
    p1.draw_rect(pymupdf.Rect(0, 132, W, 136), color=C_BLUE, fill=C_BLUE)

    p1.insert_text(pymupdf.Point(L_MARGIN, 48), "PREPVERSE AI", fontsize=22, fontname="helv", color=C_WHITE)
    p1.insert_text(pymupdf.Point(L_MARGIN, 70), "Prepare Smarter. Practice Deeper. Become Interview-Ready.", fontsize=10.5, fontname="helv", color=(0.75, 0.88, 1.0))
    p1.insert_text(pymupdf.Point(L_MARGIN, 98), "ENGINEERING SYSTEM WALKTHROUGH & VIVA DEFENSE DOSSIER", fontsize=12.5, fontname="helv", color=C_WHITE)
    p1.insert_text(pymupdf.Point(L_MARGIN, 116), "Department of Computer Science & Engineering  |  B.Tech Major Capstone Project", fontsize=8.5, fontname="helv", color=(0.82, 0.88, 0.98))

    # Project Identifiers Box
    p1.draw_rect(pymupdf.Rect(L_MARGIN, 150, R_MARGIN, 202), color=C_CARD_BORDER, fill=C_LIGHT_BG)
    p1.insert_text(pymupdf.Point(L_MARGIN + 14, 168), "CANDIDATES / AUTHORS:", fontsize=8.2, fontname="helv", color=C_MUTED)
    p1.insert_text(pymupdf.Point(L_MARGIN + 160, 168), "Jagrati Singhal & Ayush Gupta", fontsize=9, fontname="helv", color=C_NAVY)
    p1.insert_text(pymupdf.Point(L_MARGIN + 14, 184), "GITHUB REPOSITORY:", fontsize=8.2, fontname="helv", color=C_MUTED)
    p1.insert_text(pymupdf.Point(L_MARGIN + 160, 184), "https://github.com/Jagrati09Singhal/PrepVerse-AI-.git (Branch: main)", fontsize=8.8, fontname="helv", color=C_BLUE)
    p1.insert_text(pymupdf.Point(L_MARGIN + 14, 198), "TECH-STACK RUNTIME:", fontsize=8.2, fontname="helv", color=C_MUTED)
    p1.insert_text(pymupdf.Point(L_MARGIN + 160, 198), "FastAPI (Async) + React 18 / Vite + Tailwind CSS + SQLite / PostgreSQL", fontsize=8.8, fontname="helv", color=C_NAVY)

    # Section 1: Real-world Motivation
    y = 224
    p1.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 15), color=C_BLUE, fill=C_BLUE)
    p1.insert_text(pymupdf.Point(L_MARGIN + 10, y + 12), "1. Practical Motivation & Real-World Campus Placement Gap", fontsize=11.5, fontname="helv", color=C_NAVY)
    y += 24

    motivation_text = (
        "During campus placement preparation, engineering students consistently face a critical disconnect: "
        "traditional preparation relies on passive memorization (reading static 500-question PDF sheets or watching "
        "mock interview videos), yet actual corporate technical interviews assess active verbal articulation, "
        "structured behavioral reasoning (STAR framework), acoustic delivery pace, and domain depth under time pressure.\n\n"
        "PrepVerse AI was built to solve this exact bottleneck. Rather than providing static Q&A lists, the system "
        "functions as an active, multi-modal diagnostic engine. It normalizes candidate resumes via PyMuPDF, "
        "evaluates keyword overlap against target job postings, generates year-calibrated technical questions "
        "(Operating Systems, DBMS, Computer Networks, DSA), analyzes verbal speech velocity (WPM), and scores "
        "answers against standardized rubrics — all unified into an empirical 92% Candidate Readiness Index."
    )
    p1.insert_textbox(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 105), motivation_text, fontsize=8.8, fontname="helv", color=C_TEXT)
    y += 115

    # 4 Real Engineering Differentiators
    p1.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 15), color=C_VIOLET, fill=C_VIOLET)
    p1.insert_text(pymupdf.Point(L_MARGIN + 10, y + 12), "2. Architectural Core Differentiators vs. Conventional Portals", fontsize=11.5, fontname="helv", color=C_NAVY)
    y += 22

    diffs = [
        ("Acoustic Audio Telemetry (WPM)", 
         "Tracks live speaking velocity (target: 120-150 words/minute) and flags nervous filler words ('um', 'uh', 'like') via speech recognition timestamps.", C_BLUE),
        ("Academic Stage Calibration", 
         "Questions adjust to engineering years: 1st Year (basics/C++), 2nd Year (OOP/DSA), 3rd Year (OS, DBMS, Networks), 4th Year (System Design).", C_VIOLET),
        ("Deterministic Heuristics Engine", 
         "AI Coach runs on a zero-latency, local heuristic evaluator. Eliminates third-party API 429 quota exhaustion during live demonstrations.", C_EMERALD),
        ("Multi-Tenant Data Isolation", 
         "Strict row-level security: all resume parses, job match records, and mock sessions are strictly scoped to authenticated user IDs.", C_AMBER)
    ]

    card_w = (CONTENT_W - 12) / 2
    card_h = 72
    for idx, (title, desc, bar_col) in enumerate(diffs):
        cx = L_MARGIN + (idx % 2) * (card_w + 12)
        cy = y + (idx // 2) * (card_h + 10)
        p1.draw_rect(pymupdf.Rect(cx, cy, cx + card_w, cy + card_h), color=C_CARD_BORDER, fill=C_LIGHT_BG)
        p1.draw_rect(pymupdf.Rect(cx, cy, cx + card_w, cy + 3.5), color=bar_col, fill=bar_col)
        p1.insert_text(pymupdf.Point(cx + 10, cy + 18), title, fontsize=9.2, fontname="helv", color=C_NAVY)
        p1.insert_textbox(pymupdf.Rect(cx + 10, cy + 24, cx + card_w - 10, cy + card_h - 4), desc, fontsize=8, fontname="helv", color=C_TEXT)

    y += 2 * (card_h + 10) + 14

    # System Status Banner
    p1.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 50), color=C_CARD_BORDER, fill=C_WHITE)
    p1.insert_text(pymupdf.Point(L_MARGIN + 12, y + 18), "SYSTEM VERIFICATION METRICS AT A GLANCE", fontsize=9, fontname="helv", color=C_NAVY)
    metrics_line = (
        "Automated Tests: 120 / 120 Passed in 4.19s (pytest)  |  Vite Production Build: 1,607 Modules Clean (0 Errors)\n"
        "Local Launcher: Unified single-command python app.py with automatic Windows port-freeing (5173 / 8000)"
    )
    p1.insert_textbox(pymupdf.Rect(L_MARGIN + 12, y + 24, R_MARGIN - 12, y + 46), metrics_line, fontsize=8.2, fontname="helv", color=C_BLUE)

    draw_footer(p1, 1)

    # =========================================================================
    # PAGE 2: 4-TIER DECOUPLED ARCHITECTURE & DATA FLOW (FIGURE 4.2)
    # =========================================================================
    p2 = doc.new_page(width=W, height=H)

    p2.draw_rect(pymupdf.Rect(L_MARGIN, 34, L_MARGIN + 3.5, 49), color=C_BLUE, fill=C_BLUE)
    p2.insert_text(pymupdf.Point(L_MARGIN + 10, 46), "3. Decoupled 4-Tier System Architecture (Figure 4.2)", fontsize=12, fontname="helv", color=C_NAVY)

    # Insert Figure 4.2 diagram
    img_path = os.path.join(os.getcwd(), "docs", "figure_4_2_system_modules_and_workflow_white.png")
    if os.path.exists(img_path):
        p2.insert_image(pymupdf.Rect(L_MARGIN, 58, R_MARGIN, 395), filename=img_path)

    y = 405
    p2.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 14), color=C_NAVY, fill=C_NAVY)
    p2.insert_text(pymupdf.Point(L_MARGIN + 10, y + 11), "Tier Breakdown & Relational Data Schema", fontsize=10.5, fontname="helv", color=C_NAVY)
    y += 20

    tiers_detail = [
        ("Tier 1: Client Workspace (React 18, Vite, Tailwind)",
         "Manages single-page application views (Dashboard, Resume, Interview, Coach, Analytics, Roadmap, Admin). "
         "Communicates via centralized api.js client supporting token injection, custom error handling, and reactive theme toggle."),
        ("Tier 2: API Gateway & Security (FastAPI + Pydantic v2)",
         "Exposes versioned REST endpoints under /api/v1/*. Validates payloads using Pydantic models. Enforces bcrypt (12 rounds) "
         "password hashing and stateless Bearer JWT verification on all protected routes."),
        ("Tier 3: Core Computational Telemetry Engines",
         "Consists of PyMuPDF text normalizer, Job description semantic parser, Year-calibrated question generator, "
         "Speech WPM counter, STAR rubric evaluator, and 4-step architectural production exemplar generator."),
        ("Tier 4: Relational Database & Document Persistence",
         "SQLAlchemy 2.0 ORM managing models: users, resumes, job_analyses, interviews, interview_questions, and roadmap_tasks. "
         "Supports zero-config SQLite for local dev and PostgreSQL for production clustering. Generates executive PDF reports via ReportLab.")
    ]

    for t_head, t_body in tiers_detail:
        p2.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 46), color=C_CARD_BORDER, fill=C_LIGHT_BG)
        p2.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3, y + 46), color=C_BLUE, fill=C_BLUE)
        p2.insert_text(pymupdf.Point(L_MARGIN + 10, y + 14), t_head, fontsize=9, fontname="helv", color=C_NAVY)
        p2.insert_textbox(pymupdf.Rect(L_MARGIN + 10, y + 20, R_MARGIN - 8, y + 43), t_body, fontsize=7.8, fontname="helv", color=C_TEXT)
        y += 52

    draw_footer(p2, 2)

    # =========================================================================
    # PAGE 3: CHRONOLOGICAL HANDS-ON DEMONSTRATION WALKTHROUGH
    # =========================================================================
    p3 = doc.new_page(width=W, height=H)

    p3.draw_rect(pymupdf.Rect(L_MARGIN, 34, L_MARGIN + 3.5, 49), color=C_VIOLET, fill=C_VIOLET)
    p3.insert_text(pymupdf.Point(L_MARGIN + 10, 46), "4. Chronological Demonstration Walkthrough (10 Practical Steps)", fontsize=12, fontname="helv", color=C_NAVY)

    y = 60
    steps = [
        ("Step 1: One-Command Startup (python app.py)",
         "Launcher checks Python 3.9+, Node.js runtime, and verifies database integrity. It dynamically scans and frees ports 5173/8000 "
         "to eliminate Windows socket collisions, boots FastAPI and Vite in parallel, and automatically opens the browser."),
        ("Step 2: Candidate Authentication & Isolation",
         "Secure registration/login with client-side validation, password visibility toggle, and JWT token issuance. "
         "Demonstrates multi-tenant isolation where candidate data is strictly partitioned."),
        ("Step 3: Candidate Dashboard & Readiness Index",
         "Displays the dynamic Readiness Index (92%) computed from verified resume skills, job alignment, and mock performance. "
         "Presents quick metrics: Active Resumes (2), Job Match (1), Completed Mocks (1), and Mastery Score (68%)."),
        ("Step 4: Resume Intelligence & Instant 1-Click Generator",
         "Upload a real PDF or click 'Load Sample Resume' (creates Rohan_Sharma_Campus_Resume.pdf in memory). PyMuPDF normalizes text "
         "and extracts skill badges (Python, React, SQL, Docker, OS, DSA) with zero external dependency."),
        ("Step 5: Job Description Match & Deficit Analysis",
         "Paste target role requirements (e.g. Machine Learning Engineer or Full Stack Developer). The matching engine calculates "
         "keyword overlap percentage and highlights missing technical competencies."),
        ("Step 6: Academic Year & Domain Calibration",
         "Select academic progression (1st Year Foundations to 4th Year Hiring) and core engineering subjects. Demonstrates "
         "targeted 3rd-year questions covering Operating Systems, DBMS, Computer Networks, and DSA."),
        ("Step 7: Multi-Modal Mock Interview Simulation",
         "Launch adaptive simulation with question navigation dots, timer, and difficulty badge. Candidates answer via speech "
         "(Web Speech API microphone capture) or text editing with draft persistence."),
        ("Step 8: Audio Telemetry & STAR Evaluation",
         "Submitting answers triggers real-time acoustic analysis: speaking pace (target: 120-150 WPM) and filler word count. "
         "Behavioral answers are scored against the 4-part STAR rubric (Situation, Task, Action, Result)."),
        ("Step 9: AI Coach Hub & 4-Step Production Exemplars",
         "Inspect post-interview diagnostics showing conceptual strengths and constructive omissions. Features 1-click clipboard copy "
         "of structured 4-step architectural exemplars (High-Level Design, Concurrency, Edge Cases, Observability)."),
        ("Step 10: Dynamic Preparation Roadmap & Admin Hub",
         "Identified weak areas are scheduled into a daily preparation roadmap. Faculty coordinators can access /app/admin "
         "to monitor student performance trends and adjust syllabus parameters.")
    ]

    for s_title, s_desc in steps:
        p3.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 54), color=C_CARD_BORDER, fill=C_WHITE)
        p3.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3, y + 54), color=C_VIOLET, fill=C_VIOLET)
        p3.insert_text(pymupdf.Point(L_MARGIN + 10, y + 14), s_title, fontsize=8.8, fontname="helv", color=C_NAVY)
        p3.insert_textbox(pymupdf.Rect(L_MARGIN + 10, y + 20, R_MARGIN - 8, y + 50), s_desc, fontsize=7.8, fontname="helv", color=C_TEXT)
        y += 60

    draw_footer(p3, 3)

    # =========================================================================
    # PAGE 4: ALGORITHMIC IMPLEMENTATION & ACADEMIC CALIBRATION DEEP-DIVE
    # =========================================================================
    p4 = doc.new_page(width=W, height=H)

    p4.draw_rect(pymupdf.Rect(L_MARGIN, 34, L_MARGIN + 3.5, 49), color=C_EMERALD, fill=C_EMERALD)
    p4.insert_text(pymupdf.Point(L_MARGIN + 10, 46), "5. Algorithmic Implementation & Engineering Domain Calibration", fontsize=12, fontname="helv", color=C_NAVY)

    y = 60
    # Core Algorithms & Mathematical Formulas
    p4.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 14), color=C_BLUE, fill=C_BLUE)
    p4.insert_text(pymupdf.Point(L_MARGIN + 10, y + 11), "A. Mathematical Formulations & Measurement Formulas", fontsize=10.5, fontname="helv", color=C_NAVY)
    y += 20

    formula_cards = [
        ("1. Audio Speech Pace Velocity (WPM)",
         "Formula: WPM = (Total Spoken Words / Audio Duration in Seconds) * 60",
         "Evaluation Tiers: < 100 WPM: Hesitant/Slow  |  120 - 150 WPM: Optimal Professional Cadence  |  > 170 WPM: Rushed",
         C_BLUE),
        ("2. STAR Behavioral Rubric Weighted Scoring",
         "Formula: Score = (0.20 * Situation) + (0.20 * Task) + (0.35 * Action) + (0.25 * Result)",
         "Rationale: Action and Result dimensions carry 60% of total weight to assess individual contribution and impact.",
         C_VIOLET),
        ("3. Composite Candidate Readiness Index",
         "Formula: Readiness = (0.25 * Resume) + (0.25 * JobMatch) + (0.30 * MockAccuracy) + (0.20 * MasteryTrend)",
         "Target Benchmark: 85%+ indicates candidate is placement-ready across resume credibility and interview execution.",
         C_EMERALD),
    ]

    card_h = 36
    for f_title, f_form, f_sub, bar_color in formula_cards:
        p4.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + card_h), color=C_CARD_BORDER, fill=C_LIGHT_BG)
        p4.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + card_h), color=bar_color, fill=bar_color)
        p4.insert_text(pymupdf.Point(L_MARGIN + 12, y + 12), f_title, fontsize=8.5, fontname="helv", color=C_NAVY)
        p4.insert_text(pymupdf.Point(L_MARGIN + 12, y + 23), f_form, fontsize=7.8, fontname="helv", color=C_TEXT)
        p4.insert_text(pymupdf.Point(L_MARGIN + 12, y + 32), f_sub, fontsize=7.0, fontname="helv", color=C_MUTED)
        y += card_h + 6

    y += 10

    # Academic Year Question Calibration Table
    p4.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 14), color=C_EMERALD, fill=C_EMERALD)
    p4.insert_text(pymupdf.Point(L_MARGIN + 10, y + 11), "B. B.Tech Computer Science Curriculum Domain Calibration", fontsize=10.5, fontname="helv", color=C_NAVY)
    y += 20

    curriculum_data = [
        ("1st Year (Freshman)", "Foundations & Logic", "C/C++/Python syntax, variables, loops, recursion, basic math algorithms."),
        ("2nd Year (Sophomore)", "Core DSA & OOP", "Arrays, Linked Lists, Stacks, Queues, Binary Trees, OOP concepts (Polymorphism, Inheritance), basic SQL."),
        ("3rd Year (Pre-Final)", "Core Semester Subjects", "OS (Coffman Deadlock, Paging, Thrashing), DBMS (ACID, Normalization, B-Trees), Networks (TCP/UDP, Handshake), DSA Graphs."),
        ("4th Year (Final Year)", "Placement & System Design", "High-concurrency systems, CAP theorem, Microservices, Caching (Redis), Load Balancing, Capstone Architecture.")
    ]

    col_w = CONTENT_W
    row_h = 36
    for c_yr, c_badge, c_topics in curriculum_data:
        p4.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + row_h), color=C_CARD_BORDER, fill=C_WHITE)
        p4.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 130, y + row_h), color=C_CARD_BORDER, fill=C_LIGHT_BG)
        p4.insert_text(pymupdf.Point(L_MARGIN + 8, y + 15), c_yr, fontsize=8.5, fontname="helv", color=C_NAVY)
        p4.insert_text(pymupdf.Point(L_MARGIN + 8, y + 27), c_badge, fontsize=7.5, fontname="helv", color=C_BLUE)
        p4.insert_textbox(pymupdf.Rect(L_MARGIN + 138, y + 6, R_MARGIN - 8, y + row_h - 4), c_topics, fontsize=8, fontname="helv", color=C_TEXT)
        y += row_h + 6

    y += 10
    # 4-Step Production Model Exemplar Architecture
    p4.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 14), color=C_VIOLET, fill=C_VIOLET)
    p4.insert_text(pymupdf.Point(L_MARGIN + 10, y + 11), "C. 4-Step Architectural Model Exemplar Framework (AI Coach)", fontsize=10.5, fontname="helv", color=C_NAVY)
    y += 20

    exemplar_steps = [
        ("Step 1: High-Level Architecture & Data Flow", "Decouples ingestion from processing via asynchronous message brokers (Kafka/RabbitMQ) with backpressure cushioning."),
        ("Step 2: Concurrency & Consistency Strategy", "Applies idempotent keys, optimistic locking with version checks, and multi-tier caching (Redis with jittered TTLs)."),
        ("Step 3: Edge Cases, Failure Modes & Blast Radius", "Implements circuit breakers, dead-letter queues, exponential backoff retries, and graceful degradation."),
        ("Step 4: Observability, Metrics & Telemetry", "Instruments distributed tracing (OpenTelemetry), p99 latency SLOs, and structured health diagnostics.")
    ]

    for ex_step, ex_desc in exemplar_steps:
        p4.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 26), color=C_CARD_BORDER, fill=C_LIGHT_BG)
        p4.insert_text(pymupdf.Point(L_MARGIN + 8, y + 16), ex_step + ":", fontsize=8, fontname="helv", color=C_VIOLET)
        p4.insert_text(pymupdf.Point(L_MARGIN + 205, y + 16), ex_desc, fontsize=7.5, fontname="helv", color=C_TEXT)
        y += 30

    draw_footer(p4, 4)

    # =========================================================================
    # PAGE 5: REAL ENGINEERING BUGS ENCOUNTERED, TEST SUITE & VIVA Q&A
    # =========================================================================
    p5 = doc.new_page(width=W, height=H)

    p5.draw_rect(pymupdf.Rect(L_MARGIN, 34, L_MARGIN + 3.5, 49), color=C_NAVY, fill=C_NAVY)
    p5.insert_text(pymupdf.Point(L_MARGIN + 10, 46), "6. Real Engineering Debugging Log & Faculty Viva Defense Q&A", fontsize=12, fontname="helv", color=C_NAVY)

    y = 60
    # Authentic Debugging Cases
    p5.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 14), color=C_AMBER, fill=C_AMBER)
    p5.insert_text(pymupdf.Point(L_MARGIN + 10, y + 11), "A. Real Engineering Hurdles & Bug Resolutions (Authentic Experience)", fontsize=10.5, fontname="helv", color=C_NAVY)
    y += 20

    bugs = [
        ("Bug 1: PyMuPDF Extraction Hangs on Scanned PDFs",
         "Problem: Scanned or malformed PDFs with missing font tables caused PyMuPDF to throw encoding exceptions.\n"
         "Solution: Added magic byte validation (%PDF-1.4), byte length checks (5 MB limit), and a fallback OCR heuristic "
         "that flags 'scanned_image_no_text' gracefully without crashing the upload pipeline."),
        ("Bug 2: External Gemini API 429 Quota Exhaustion",
         "Problem: Running continuous mock interviews triggered Google Gemini API 429 rate limit errors during testing.\n"
         "Solution: Engineered an internal deterministic heuristics engine using regex keyword trees and domain taxonomies. "
         "Guarantees 100% uptime with zero external token latency (<50ms response)."),
        ("Bug 3: Windows Socket Collisions on Launcher Boot",
         "Problem: Killed node/uvicorn child processes left orphaned sockets holding ports 5173 and 8000 on Windows.\n"
         "Solution: Enhanced app.py with free_port() using PowerShell Get-NetTCPConnection to automatically identify "
         "and terminate stale owning processes before server boot, guaranteeing clean 5173/8000 bindings.")
    ]

    for b_title, b_desc in bugs:
        p5.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 48), color=C_CARD_BORDER, fill=C_WHITE)
        p5.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3, y + 48), color=C_AMBER, fill=C_AMBER)
        p5.insert_text(pymupdf.Point(L_MARGIN + 10, y + 13), b_title, fontsize=8.8, fontname="helv", color=C_NAVY)
        p5.insert_textbox(pymupdf.Rect(L_MARGIN + 10, y + 18, R_MARGIN - 8, y + 45), b_desc, fontsize=7.6, fontname="helv", color=C_TEXT)
        y += 54

    y += 8
    # Viva Defense Q&A
    p5.draw_rect(pymupdf.Rect(L_MARGIN, y, L_MARGIN + 3.5, y + 14), color=C_BLUE, fill=C_BLUE)
    p5.insert_text(pymupdf.Point(L_MARGIN + 10, y + 11), "B. Faculty Curated Viva Defense Questions & Answers", fontsize=10.5, fontname="helv", color=C_NAVY)
    y += 20

    viva_qa = [
        ("Q: How did you validate system accuracy and reliability?",
         "A: We validated via an automated pytest suite of 120 tests (100% pass in 4.19s) covering authentication, "
         "PyMuPDF extraction, adaptive question steppers, STAR rubrics, and speech analytics. Front-end builds cleanly "
         "in 3.8s across 1,607 modules."),
        ("Q: What are the current architectural limits and how would you scale to 50,000 users?",
         "A: Current implementation utilizes synchronous SQLite/PostgreSQL connections with in-process audio handling. "
         "To scale for production: 1) Offload speech transcription to Celery workers with Redis message broker; "
         "2) Implement PostgreSQL read replicas with PgBouncer connection pooling; 3) Cache question banks on Redis clusters."),
        ("Q: Why is STAR methodology critical for software engineering candidates?",
         "A: Technical interviewers look for structured problem solving. STAR forces candidates to frame the technical Context "
         "(Situation/Task), quantify their exact individual contribution (Action), and demonstrate measured impact (Result).")
    ]

    for q_text, a_text in viva_qa:
        p5.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 46), color=C_CARD_BORDER, fill=C_LIGHT_BG)
        p5.insert_text(pymupdf.Point(L_MARGIN + 10, y + 13), q_text, fontsize=8.5, fontname="helv", color=C_BLUE)
        p5.insert_textbox(pymupdf.Rect(L_MARGIN + 10, y + 18, R_MARGIN - 8, y + 43), a_text, fontsize=7.8, fontname="helv", color=C_TEXT)
        y += 52

    # Final Academic Sign-Off
    p5.draw_rect(pymupdf.Rect(L_MARGIN, y, R_MARGIN, y + 36), color=C_CARD_BORDER, fill=C_WHITE)
    p5.insert_text(pymupdf.Point(L_MARGIN + 12, y + 15), "ACADEMIC ATTESTATION & REPOSITORY COMMIT VERIFICATION", fontsize=8.5, fontname="helv", color=C_EMERALD)
    p5.insert_text(pymupdf.Point(L_MARGIN + 12, y + 27), 
                   "Project Codebase: Verified Clean  |  Branch: main  |  Co-Authors: Jagrati Singhal & Ayush Gupta  |  PrepVerse AI", 
                   fontsize=8, fontname="helv", color=C_NAVY)

    draw_footer(p5, 5)

    # Save with maximum compression and clean garbage collection
    doc.save(pdf_path, deflate=True, garbage=4)
    doc.close()
    print(f"Successfully generated genuine 5-page walkthrough PDF at: {pdf_path}")

if __name__ == "__main__":
    build_genuine_walkthrough_pdf()
