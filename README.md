<div align="center">

# 🚀 PrepVerse AI
### *Prepare Smarter. Practice Deeper. Become Interview-Ready.*

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Pytest-120%20Passed%20(100%25)-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)

<p align="center">
  <b>An adaptive technical interview simulation & semester-aligned diagnostic platform designed to bridge the "Resume Reality Gap" for engineering undergraduates.</b>
</p>

[Explore Features](#-key-capabilities) • [System Architecture](#-system-architecture) • [One-Command Launch](#-quick-start) • [Engineering Team](#-project-contributors--team)

---

</div>

## 📌 The Problem: The "Resume Reality Gap"

Most engineering students list technologies like **React, Docker, SQL, or Python** on their resumes after completing an introductory course or hobby project. But when asked about core syntax, lifecycle hooks, or transaction isolation in live placement drives, they freeze due to rusty fundamentals and interview panic.

**PrepVerse AI** replaces intimidating, paragraph-heavy mock vivas with **active retrieval diagnostics**—calibrating questions directly to the candidate's exact college year and active semester courses, and automatically injecting extra practice questions on weak topics until true mastery is achieved.

---

## ✨ Key Capabilities

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PREPVERSE AI ENGINE                                  │
├─────────────────────────┬──────────────────────────┬───────────────────────────────────┤
│ 📄 Resume Intelligence  │ 🎓 Semester Alignment    │ ⚡ Adaptive Reinforcement         │
│ Direct PDF parsing to   │ Tuned for 1st to 4th     │ Questions scored < 70% are placed │
│ extract claimed skills  │ year + active subjects   │ at front of queue for targeted    │
│ and tech stacks.        │ (OS, DBMS, CN, DSA).     │ active-recall practice.           │
├─────────────────────────┼──────────────────────────┼───────────────────────────────────┤
│ 🎙️ Multi-Modal Input    │ 🛡️ Faculty Admin Hub     │ 📊 Visual Growth Sheets           │
│ 1-click MCQs, 3-line    │ Passcode-gated console   │ Transparent report of verified    │
│ code logic, and STAR    │ tracking cohort readiness│ skills vs. topics flagged for     │
│ voice speech analytics. │ and class-wide deficits. │ revision with mentor tips.        │
└─────────────────────────┴──────────────────────────┴───────────────────────────────────┘
```

### 1. 🎓 College Academic Year Calibration
- **1st Year (Freshman):** Programming logic, control flow, functions, and variable truthiness (C/C++, Python, JS).
- **2nd Year (Sophomore):** Core Data Structures (Arrays, Stacks, Queues, Linked Lists) & Object-Oriented Programming (Java/C++).
- **3rd Year (Pre-Final):** Placement rounds & core semester subjects: **Operating Systems** (Deadlocks, Threads, Thrashing), **DBMS** (ACID, 3NF Normalization, Indexing), and **Computer Networks** (TCP 3-Way Handshake, DNS, UDP).
- **4th Year (Final Year):** Campus recruitment interviews: System design, framework internals (React hooks, FastAPI), and concurrency.
- **Graduate / Pro:** Clean code architecture, database indexing strategies, and production debugging.

### 2. ⚡ Active Practice Over Passive Lectures
Instead of generating 500-word text essays that students passively skim, PrepVerse AI detects concepts scored below 70% and serves **targeted follow-up practice questions** on those exact topics until the student demonstrates genuine comprehension.

### 3. 🎯 Approachable Answering Formats
- **Interactive 4-Option MCQs:** Rapid, dopamine-friendly conceptual diagnostic checks.
- **3-to-5 Line Code Output Challenges:** Tests real debugging ability without heavy typing.
- **STAR Speech Evaluations:** Measures speaking pace (WPM), duration, and content depth using native browser Web Speech transcription.

### 4. 🛡️ Faculty Admin & Cohort Telemetry
An isolated, security-passcode authenticated hub where mentors and placement cells can:
- Inspect total verified candidate accounts and average cohort readiness.
- View top struggling topics across the student batch (e.g., *"40% struggling with SQL JOINs"*).
- Filter the student roster by name, college year, and engineering branch.

---

## 🏛️ System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │      React 18 + Vite 6 Client SPA       │
                    │  (Dark/Light Themes • Web Speech API)   │
                    └────────────────────┬────────────────────┘
                                         │ Asynchronous REST (JSON / JWT)
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │          FastAPI Backend Service        │
                    │      (Pydantic v2 • Uvicorn ASGI)       │
                    └────┬─────────────────┬────────────────┬─┘
                         │                 │                │
            ┌────────────┴───┐    ┌────────┴────────┐    ┌──┴─────────────┐
            │ PyMuPDF Parser │    │ Adaptive Engine │    │ ReportLab PDF  │
            │ (Resume Text)  │    │ (Year Calibrated│    │ (Growth Sheets)│
            └────────────────┘    └─────────────────┘    └────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │          SQLAlchemy 2.0 ORM             │
                    │ (Zero-Config SQLite / Prod PostgreSQL)  │
                    └─────────────────────────────────────────┘
```

---

## 🚀 Quick Start (One-Command Launcher)

PrepVerse AI features a unified launcher script that verifies prerequisites, checks database connectivity, starts both child processes, and automatically opens your browser:

### Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm**

### Run Application
```bash
# Clone the repository
git clone https://github.com/Jagrati09Singhal/PrepVerse-AI-.git
cd PrepVerse-AI-

# Launch entire platform with single command
python app.py
```

- 🌐 **Web Application:** `http://127.0.0.1:5174`
- 🛡️ **Admin Control Hub:** `http://127.0.0.1:5174/app/admin` 
- 📖 **FastAPI Swagger API Docs:** `http://127.0.0.1:8000/docs`
- 🩺 **Health Check:** `http://127.0.0.1:8000/health`

---

## 🧪 Testing & Verification

The platform is backed by a comprehensive automated test suite guaranteeing stability, regression prevention, and contract accuracy:

```bash
# Run all automated tests
python -m pytest backend/tests -v
```

```text
======================= 120 passed, 2 warnings in 4.24s =======================
```
- **120 / 120 unit & integration tests passing** across 20 test modules.
- **100% clean production bundle** compiled via Vite in 3.68 seconds.
- Sub-90ms API response latency on standard hardware.

---

## 👥 Project Contributors & Engineering Team

<table align="center">
  <tr>
    <td align="center" width="50%">
      <a href="https://github.com/Jagrati09Singhal">
        <img src="https://github.com/Jagrati09Singhal.png" width="100px;" alt="Jagrati Singhal"/><br />
        <sub><b>Jagrati Singhal</b></sub>
      </a><br />
      <small>Lead Architect & Backend Engineer</small><br />
      <sub>FastAPI Core • Adaptive Engine • Database Modeling • Admin Telemetry</sub>
    </td>
    <td align="center" width="50%">
      <a href="https://github.com/guptaayush006">
        <img src="https://github.com/guptaayush006.png" width="100px;" alt="Ayush Gupta"/><br />
        <sub><b>Ayush Gupta</b></sub>
      </a><br />
      <small>Lead Frontend & Systems Engineer</small><br />
      <sub>React/Vite UI Architecture • Gen-Z Motion Design • Speech Analytics • Multi-Modal Evaluator</sub>
    </td>
  </tr>
</table>

<p align="center">
  <i>Developed as an engineering project under shared co-authorship and equal contribution.</i>
</p>

---

## 📄 License & Attribution

This project is open-source under the MIT License. Built with ❤️ for college students striving to conquer technical interviews.
