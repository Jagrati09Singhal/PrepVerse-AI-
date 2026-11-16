#!/usr/bin/env python3
"""
=============================================================================
PrepVerse AI — One-Command Unified Local Launcher & Teacher Demo
Tagline: Prepare Smarter. Practice Deeper. Become Interview-Ready.
=============================================================================

This launcher starts both the FastAPI backend and React/Vite frontend
with a single command, verifies prerequisites, checks database connectivity,
monitors startup, opens the default browser, and terminates child processes cleanly.

Usage:
    python app.py
"""

import os
import sys
import time
import socket
import signal
import shutil
import json
import re
import argparse
import urllib.request
import urllib.error
import subprocess
import webbrowser
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

# Service configurations
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000
FRONTEND_HOST = "127.0.0.1"
FRONTEND_PORT = 5173

BACKEND_HEALTH_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/health"
BACKEND_DOCS_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/docs"
FRONTEND_URL = f"http://{FRONTEND_HOST}:{FRONTEND_PORT}"

# Global process tracking
backend_process = None
frontend_process = None
is_shutting_down = False

# Ensure standard output and error support UTF-8 cleanly on Windows
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


class Colors:
    """ANSI color codes with automatic Windows virtual terminal support."""
    CYAN = "\033[96m"
    VIOLET = "\033[95m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def enable_windows_ansi():
    """Enables virtual terminal processing on Windows consoles if available."""
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
                kernel32.SetConsoleMode(handle, mode.value | 0x0004)  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
        except Exception:
            pass


def log(msg, level="info"):
    """Formatted terminal logging."""
    prefix = {
        "info": f"{Colors.CYAN}[INFO]{Colors.RESET}",
        "success": f"{Colors.GREEN}[OK]{Colors.RESET}",
        "warn": f"{Colors.YELLOW}[WARN]{Colors.RESET}",
        "error": f"{Colors.RED}[ERROR]{Colors.RESET}",
        "step": f"{Colors.VIOLET}[>>]{Colors.RESET}",
    }.get(level, "[*]")
    print(f"{prefix} {msg}", flush=True)


def print_banner():
    """Displays the branded PrepVerse AI startup banner."""
    print(flush=True)
    print(f"{Colors.VIOLET}{Colors.BOLD}+---------------------------------------------------------------------------+{Colors.RESET}", flush=True)
    print(f"{Colors.VIOLET}{Colors.BOLD}|                              PREPVERSE AI                                 |{Colors.RESET}", flush=True)
    print(f"{Colors.VIOLET}{Colors.BOLD}|          Prepare Smarter. Practice Deeper. Become Interview-Ready.        |{Colors.RESET}", flush=True)
    print(f"{Colors.VIOLET}{Colors.BOLD}+---------------------------------------------------------------------------+{Colors.RESET}", flush=True)
    print(f"{Colors.DIM}Unified Local Demonstration Launcher -- FastAPI + React/Vite SaaS Platform{Colors.RESET}\n", flush=True)


def check_prerequisites():
    """Validates Python version, essential dependencies, and Node.js/npm."""
    log("Verifying system prerequisites...", "step")

    # 1. Python version check
    if sys.version_info < (3, 9):
        log(f"Python 3.9+ is required. Found Python {sys.version.split()[0]}", "error")
        sys.exit(1)
    log(f"Python runtime: {sys.version.split()[0]} ({Colors.GREEN}Supported{Colors.RESET})", "info")

    # 2. Check essential Python packages
    required_packages = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn"),
        ("sqlalchemy", "sqlalchemy"),
        ("pydantic", "pydantic"),
        ("jwt", "pyjwt"),
        ("bcrypt", "bcrypt"),
        ("fitz", "pymupdf"),
    ]
    missing_packages = []
    for import_name, pkg_name in required_packages:
        try:
            __import__(import_name)
        except ImportError:
            missing_packages.append(pkg_name)

    if missing_packages:
        log(f"Missing required Python dependencies: {', '.join(missing_packages)}", "error")
        log(f"Please install them by running: {Colors.BOLD}pip install -r backend/requirements.txt{Colors.RESET}", "error")
        sys.exit(1)
    log(f"Backend Python packages verified ({Colors.GREEN}All installed{Colors.RESET})", "info")

    # 3. Check Node.js and npm
    node_bin = shutil.which("node")
    npm_bin = shutil.which("npm") or shutil.which("npm.cmd")

    if not node_bin or not npm_bin:
        log("Node.js and npm are required to run the React/Vite frontend.", "error")
        log("Please install Node.js (v18+) from https://nodejs.org/ and verify they are in PATH.", "error")
        sys.exit(1)

    try:
        node_ver = subprocess.check_output([node_bin, "-v"], text=True).strip()
        log(f"Node.js runtime: {node_ver} ({Colors.GREEN}Found{Colors.RESET})", "info")
    except Exception:
        log("Could not determine Node.js version, but executable was found.", "warn")

    # 4. Check frontend dependencies (node_modules)
    node_modules_dir = FRONTEND_DIR / "node_modules"
    if not node_modules_dir.exists():
        log("Frontend node_modules not detected. Installing dependencies...", "warn")
        try:
            subprocess.run([npm_bin, "install"], cwd=str(FRONTEND_DIR), check=True)
            log("Frontend packages installed successfully.", "success")
        except Exception as exc:
            log(f"Failed to install frontend packages: {exc}", "error")
            log(f"Please run manually: {Colors.BOLD}cd frontend && npm install{Colors.RESET}", "error")
            sys.exit(1)
    else:
        log(f"Frontend node_modules verified ({Colors.GREEN}Ready{Colors.RESET})", "info")


def check_database():
    """Checks database configuration and connectivity using a clean subprocess in backend directory."""
    log("Verifying database configuration and connectivity...", "step")

    # Run check script from backend directory to prevent module naming collisions
    check_code = (
        "import sys, json; "
        "from app.core.config import settings; "
        "from app.core.database import check_db_connectivity, engine, Base; "
        "import app.models; "
        "Base.metadata.create_all(bind=engine); "
        "connected, err = check_db_connectivity(); "
        "db_type = 'sqlite' if settings.DATABASE_URL.startswith('sqlite') else 'postgres'; "
        "print(json.dumps({'connected': connected, 'error': err, 'url': settings.DATABASE_URL, 'type': db_type}))"
    )

    try:
        res = subprocess.run(
            [sys.executable, "-c", check_code],
            cwd=str(BACKEND_DIR),
            capture_output=True,
            text=True,
            check=True,
        )
        db_info = json.loads(res.stdout.strip().splitlines()[-1])
    except Exception as exc:
        log(f"Could not verify database connectivity: {exc}", "warn")
        db_info = {"connected": False, "error": str(exc), "type": "unknown", "url": "unknown"}

    if db_info.get("connected"):
        if db_info.get("type") == "sqlite":
            db_file = db_info.get("url", "").replace("sqlite:///", "")
            log(f"Database: SQLite ({Colors.GREEN}Connected & Tables Verified{Colors.RESET}) -- {db_file}", "success")
        else:
            log(f"Database: PostgreSQL ({Colors.GREEN}Connected & Tables Verified{Colors.RESET})", "success")
    else:
        log(f"Database connectivity check failed: {db_info.get('error')}", "warn")
        if db_info.get("type") == "postgres":
            print()
            print(f"{Colors.YELLOW}-----------------------------------------------------------------------------{Colors.RESET}")
            print(f"{Colors.YELLOW}{Colors.BOLD}[!] PostgreSQL is configured in .env but unreachable at localhost:5432.{Colors.RESET}")
            print(f"To use PostgreSQL with PrepVerse AI, please ensure:")
            print(f"  1. PostgreSQL service is active on your machine.")
            print(f"  2. Create the target database: {Colors.BOLD}createdb -U postgres interviewai_dev{Colors.RESET}")
            print(f"  3. Run migrations: {Colors.BOLD}cd backend && python -m alembic upgrade head{Colors.RESET}")
            print()
            print(f"Alternatively, for instant zero-config local evaluation, set in {Colors.BOLD}backend/.env{Colors.RESET}:")
            print(f"  {Colors.BOLD}DATABASE_URL=sqlite:///./prepverse_dev.db{Colors.RESET}")
            print(f"{Colors.YELLOW}-----------------------------------------------------------------------------{Colors.RESET}")
            print()
            sys.exit(1)
        else:
            log("Database could not be verified. Please check file permissions.", "error")
            sys.exit(1)


def is_port_in_use(host, port):
    """Checks if a network port is already occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            s.connect((host, port))
            return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            return False


def wait_for_service(url, service_name, timeout=30, proc=None):
    """Polls an HTTP endpoint until it returns status 200 or timeout expires."""
    start_time = time.time()
    log(f"Awaiting {service_name} readiness at {url}...", "step")
    while time.time() - start_time < timeout:
        if is_shutting_down:
            return False
        if proc and proc.poll() is not None:
            log(f"{service_name} process exited prematurely with code {proc.poll()}.", "error")
            return False
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PrepVerse-Launcher"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    log(f"{service_name} is online and operational! ({Colors.GREEN}200 OK{Colors.RESET})", "success")
                    return True
        except (urllib.error.URLError, ConnectionRefusedError, socket.timeout, Exception):
            pass

        time.sleep(0.5)

    log(f"Timed out waiting for {service_name} at {url}", "error")
    return False


def wait_for_frontend(timeout=30, proc=None):
    """Polls candidate Vite frontend URLs (including auto-fallback ports) until one returns status 200."""
    global FRONTEND_URL
    candidate_urls = [
        FRONTEND_URL,
        f"http://{FRONTEND_HOST}:{FRONTEND_PORT + 1}",
        f"http://localhost:{FRONTEND_PORT}",
        f"http://localhost:{FRONTEND_PORT + 1}",
    ]
    start_time = time.time()
    log(f"Awaiting React/Vite Frontend readiness...", "step")
    while time.time() - start_time < timeout:
        if is_shutting_down:
            return False
        if proc and proc.poll() is not None:
            log(f"React/Vite Frontend process exited prematurely with code {proc.poll()}.", "error")
            return False

        # Inspect frontend_server.log to see if Vite dynamically bound to a specific port
        if os.path.exists("frontend_server.log"):
            try:
                with open("frontend_server.log", "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    matches = re.findall(r"Local:\s+(https?://[0-9a-zA-Z\.\:\-]+)", content)
                    for match in matches:
                        detected_url = match.rstrip("/")
                        if detected_url not in candidate_urls:
                            candidate_urls.insert(0, detected_url)
            except Exception:
                pass

        for target_url in candidate_urls:
            try:
                req = urllib.request.Request(target_url, headers={"User-Agent": "PrepVerse-Launcher"})
                with urllib.request.urlopen(req, timeout=1.0) as resp:
                    if resp.status == 200:
                        FRONTEND_URL = target_url
                        log(f"React/Vite Frontend is online and operational at {FRONTEND_URL}! ({Colors.GREEN}200 OK{Colors.RESET})", "success")
                        return True
            except Exception:
                pass

        time.sleep(0.5)

    log(f"Timed out waiting for React/Vite Frontend", "error")
    return False


def free_port(port):
    """Terminates any process occupying the specified network port to prevent conflicts."""
    if sys.platform == "win32":
        try:
            cmd = f'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort {port} -ErrorAction SilentlyContinue | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }}"'
            subprocess.run(cmd, shell=True, capture_output=True, check=False)
        except Exception:
            pass
        try:
            out = subprocess.check_output(f'netstat -ano | findstr ":{port}"', shell=True, text=True)
            for line in out.strip().splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "LISTENING" in line.upper():
                    pid = parts[-1]
                    if pid and pid != "0" and pid != str(os.getpid()):
                        subprocess.run(["taskkill", "/F", "/T", "/PID", pid], capture_output=True, check=False)
        except Exception:
            pass
    time.sleep(0.5)


def kill_process_tree(proc):
    """Terminates a process and all its child processes cleanly across platforms."""
    if not proc:
        return
    pid = proc.pid
    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True, check=False)
        else:
            proc.terminate()
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                proc.kill()
    except Exception:
        pass


def clean_shutdown(signum=None, frame=None):
    """Handles Ctrl+C and process signals cleanly."""
    global is_shutting_down, backend_process, frontend_process
    if is_shutting_down:
        return
    is_shutting_down = True

    print()
    log("Received shutdown signal. Stopping child services cleanly...", "warn")

    if backend_process:
        log("Stopping FastAPI backend server...", "info")
        kill_process_tree(backend_process)

    if frontend_process:
        log("Stopping React/Vite frontend server...", "info")
        kill_process_tree(frontend_process)

    free_port(BACKEND_PORT)
    free_port(FRONTEND_PORT)

    log("All services terminated. PrepVerse AI shut down cleanly.", "success")
    sys.exit(0)


def start_backend(dev_mode=False):
    """Launches the FastAPI backend server using uvicorn."""
    global backend_process
    reload_str = f" ({Colors.GREEN}Auto-Reload Active{Colors.RESET})" if dev_mode else ""
    log(f"Starting FastAPI backend on {BACKEND_HOST}:{BACKEND_PORT}{reload_str}...", "step")
    cmd_backend = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        BACKEND_HOST,
        "--port",
        str(BACKEND_PORT),
    ]
    if dev_mode:
        cmd_backend.append("--reload")

    try:
        backend_log = open("backend_server.log", "w", encoding="utf-8")
        backend_process = subprocess.Popen(
            cmd_backend,
            cwd=str(BACKEND_DIR),
            env=os.environ.copy(),
            stdout=backend_log,
            stderr=backend_log,
        )
        log(f"FastAPI backend process launched (PID: {backend_process.pid})", "info")
        return backend_process
    except Exception as exc:
        log(f"Failed to start backend: {exc}", "error")
        sys.exit(1)


def restart_backend(dev_mode=False):
    """Restarts the FastAPI backend process cleanly."""
    global backend_process
    print()
    log("Restarting FastAPI backend server...", "step")
    if backend_process:
        kill_process_tree(backend_process)
        backend_process = None
    free_port(BACKEND_PORT)
    start_backend(dev_mode=dev_mode)
    if wait_for_service(BACKEND_HEALTH_URL, "FastAPI Backend", timeout=20, proc=backend_process):
        log("Backend restarted and operational!", "success")
    else:
        log("Backend restart verification timed out.", "warn")


def print_demo_checklist():
    """Prints a clear 10-step teacher demonstration workflow and reference credentials."""
    print(f"\n{Colors.VIOLET}{Colors.BOLD}+---------------------------------------------------------------------------+{Colors.RESET}", flush=True)
    print(f"{Colors.VIOLET}{Colors.BOLD}|                   TEACHER DEMONSTRATION FLOW CHECKLIST                    |{Colors.RESET}", flush=True)
    print(f"{Colors.VIOLET}{Colors.BOLD}+---------------------------------------------------------------------------+{Colors.RESET}", flush=True)
    checklist = [
        ("1. Candidate Dashboard", "View Readiness Index Ring, 4 readiness pillars & quick actions."),
        ("2. Authentication", "Test Login & Create Account tabs with live validation & password toggle."),
        ("3. Resume Intelligence", "Upload a candidate PDF resume to extract skills into categorized tags."),
        ("4. Job Description Match", "Paste a job posting to see keyword alignment & missing skill gaps."),
        ("5. Adaptive Interview Simulator", "Launch a session; view question dots stepper, timer & difficulty."),
        ("6. Voice & Text Answering", "Speak or type answers; test live word counter and answer draft safety."),
        ("7. STAR & Technical Evaluation", "Submit answer to view STAR rubric meters and immediate feedback."),
        ("8. AI Coach Hub & Exemplars", "Review model exemplar answers with 1-click clipboard copy."),
        ("9. Performance Analytics", "Inspect score trajectory chart, speaking pace WPM, and competency matrix."),
        ("10. PDF Report Export", "Export a clean executive PDF report of completed interview sessions."),
    ]
    for step, desc in checklist:
        print(f"  {Colors.CYAN}{step:<32}{Colors.RESET} {desc}", flush=True)
    print(f"{Colors.DIM}-----------------------------------------------------------------------------{Colors.RESET}", flush=True)
    print(f"  {Colors.BOLD}Browser Interface:{Colors.RESET}    {Colors.GREEN}{FRONTEND_URL}{Colors.RESET}", flush=True)
    print(f"  {Colors.BOLD}FastAPI Swagger Docs:{Colors.RESET} {Colors.CYAN}{BACKEND_DOCS_URL}{Colors.RESET}", flush=True)
    print(f"  {Colors.BOLD}API Health Check:{Colors.RESET}     {Colors.CYAN}{BACKEND_HEALTH_URL}{Colors.RESET}", flush=True)
    print(f"  {Colors.BOLD}Admin Telemetry Hub:{Colors.RESET}  {Colors.CYAN}{FRONTEND_URL}/app/admin{Colors.RESET}", flush=True)
    print(f"  {Colors.BOLD}Admin Passcode:{Colors.RESET}       {Colors.YELLOW}PrepVerseAdmin2026!{Colors.RESET} (jagratisinghal9@gmail.com)", flush=True)
    print(f"{Colors.DIM}-----------------------------------------------------------------------------{Colors.RESET}", flush=True)
    print(f"  {Colors.BOLD}Interactive Terminal Controls:{Colors.RESET}", flush=True)
    print(f"    {Colors.GREEN}[r]{Colors.RESET} Restart Backend   {Colors.GREEN}[b]{Colors.RESET} Open Browser   {Colors.GREEN}[c]{Colors.RESET} Re-show Checklist   {Colors.GREEN}[q]{Colors.RESET} Clean Exit", flush=True)
    print(f"{Colors.DIM}-----------------------------------------------------------------------------{Colors.RESET}", flush=True)
    print(f"  {Colors.YELLOW}Press Ctrl+C or 'q' in this terminal at any time to shut down all services cleanly.{Colors.RESET}\n", flush=True)


def main():
    """Main launcher entry point with CLI options and interactive hotkeys."""
    global backend_process, frontend_process, BACKEND_PORT, FRONTEND_PORT, BACKEND_HEALTH_URL, BACKEND_DOCS_URL, FRONTEND_URL

    parser = argparse.ArgumentParser(description="PrepVerse AI — Unified Local Launcher & Demo Runner")
    parser.add_argument("--dev", "--reload", action="store_true", dest="reload", help="Run FastAPI backend with Uvicorn auto-reload")
    parser.add_argument("--no-browser", action="store_true", help="Do not automatically launch the web browser")
    parser.add_argument("--backend-only", action="store_true", help="Launch only the FastAPI backend service")
    parser.add_argument("--frontend-only", action="store_true", help="Launch only the React/Vite frontend service")
    parser.add_argument("--port-backend", type=int, default=8000, help="Override FastAPI backend port (default: 8000)")
    parser.add_argument("--port-frontend", type=int, default=5173, help="Override React/Vite frontend port (default: 5173)")
    parser.add_argument("--verbose", action="store_true", help="Print recent server logs during launch")
    args = parser.parse_args()

    BACKEND_PORT = args.port_backend
    FRONTEND_PORT = args.port_frontend
    BACKEND_HEALTH_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/health"
    BACKEND_DOCS_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/docs"
    FRONTEND_URL = f"http://{FRONTEND_HOST}:{FRONTEND_PORT}"

    enable_windows_ansi()
    signal.signal(signal.SIGINT, clean_shutdown)
    signal.signal(signal.SIGTERM, clean_shutdown)

    print_banner()
    check_prerequisites()
    check_database()

    # Verify ports
    backend_running = is_port_in_use(BACKEND_HOST, BACKEND_PORT) if not args.frontend_only else True
    frontend_running = is_port_in_use(FRONTEND_HOST, FRONTEND_PORT) if not args.backend_only else True

    # Clear log files from prior runs so fresh ports are accurately detected
    for log_path in ["backend_server.log", "frontend_server.log"]:
        try:
            with open(log_path, "w", encoding="utf-8") as lf:
                lf.write("")
        except Exception:
            pass

    if not args.frontend_only and backend_running:
        try:
            req = urllib.request.Request(BACKEND_HEALTH_URL)
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    log(f"Existing PrepVerse backend server detected and responsive on port {BACKEND_PORT}.", "info")
        except Exception:
            log(f"Port {BACKEND_PORT} is occupied by an unresponsive process. Freeing port...", "warn")
            free_port(BACKEND_PORT)
            backend_running = False

    if not args.backend_only and frontend_running:
        try:
            req = urllib.request.Request(f"http://{FRONTEND_HOST}:{FRONTEND_PORT}")
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    log(f"Existing Vite frontend detected and responsive on port {FRONTEND_PORT}.", "info")
        except Exception:
            log(f"Port {FRONTEND_PORT} is occupied by a stale process. Freeing port...", "warn")
            free_port(FRONTEND_PORT)
            frontend_running = False

    # Start FastAPI Backend from backend/ directory to guarantee clean module loading
    if not args.frontend_only and not backend_running:
        start_backend(dev_mode=args.reload)

    # Start React/Vite Frontend
    if not args.backend_only and not frontend_running:
        log(f"Starting React/Vite frontend on {FRONTEND_HOST}:{FRONTEND_PORT}...", "step")
        npm_bin = shutil.which("npm") or shutil.which("npm.cmd")
        cmd_frontend = [npm_bin, "run", "dev", "--", "--host", FRONTEND_HOST, "--port", str(FRONTEND_PORT)]
        try:
            frontend_log = open("frontend_server.log", "w", encoding="utf-8")
            frontend_process = subprocess.Popen(
                cmd_frontend,
                cwd=str(FRONTEND_DIR),
                env=os.environ.copy(),
                stdout=frontend_log,
                stderr=frontend_log,
                shell=(sys.platform == "win32"),
            )
            log(f"Frontend Vite process launched (PID: {frontend_process.pid})", "info")
        except Exception as exc:
            log(f"Failed to start frontend: {exc}", "error")
            if backend_process:
                kill_process_tree(backend_process)
            sys.exit(1)

    # Wait for services to respond
    if not args.frontend_only:
        backend_ready = wait_for_service(BACKEND_HEALTH_URL, "FastAPI Backend", timeout=30, proc=backend_process)
        if not backend_ready:
            if os.path.exists("backend_server.log"):
                try:
                    with open("backend_server.log", "r", encoding="utf-8", errors="ignore") as f:
                        tail = f.read()[-1500:]
                        if tail.strip():
                            log(f"Recent backend server output:\n{tail}", "warn")
                except Exception:
                    pass
            clean_shutdown()

    if not args.backend_only:
        frontend_ready = wait_for_frontend(timeout=30, proc=frontend_process)
        if not frontend_ready:
            if os.path.exists("frontend_server.log"):
                try:
                    with open("frontend_server.log", "r", encoding="utf-8", errors="ignore") as f:
                        tail = f.read()[-1500:]
                        if tail.strip():
                            log(f"Recent frontend server output:\n{tail}", "warn")
                except Exception:
                    pass
            clean_shutdown()

    # Automatically launch browser if not disabled
    if not args.no_browser and not args.backend_only:
        log(f"Opening default browser at {FRONTEND_URL}...", "step")
        try:
            webbrowser.open(FRONTEND_URL)
            log("Browser launched successfully.", "success")
        except Exception as exc:
            log(f"Could not automatically open browser ({exc}). Please open {FRONTEND_URL} manually.", "warn")

    # Present demo checklist and URLs
    print_demo_checklist()

    # Setup non-blocking keyboard input check on Windows
    try:
        import msvcrt
    except ImportError:
        msvcrt = None

    # Keep alive until Ctrl+C or 'q'
    try:
        while True:
            time.sleep(0.5)

            # Keyboard shortcut handler on Windows
            if msvcrt and msvcrt.kbhit():
                try:
                    key = msvcrt.getwch().lower()
                    if key == "q":
                        log("Exit command 'q' received. Initiating clean shutdown...", "info")
                        clean_shutdown()
                    elif key == "b":
                        log(f"Opening browser at {FRONTEND_URL}...", "info")
                        webbrowser.open(FRONTEND_URL)
                    elif key == "c":
                        print_demo_checklist()
                    elif key == "r" and not args.frontend_only:
                        restart_backend(dev_mode=args.reload)
                except Exception:
                    pass

            # Check if any child process unexpectedly died
            if backend_process and backend_process.poll() is not None:
                log(f"FastAPI backend exited unexpectedly with code {backend_process.poll()}.", "error")
                clean_shutdown()
            if frontend_process and frontend_process.poll() is not None:
                log(f"Frontend Vite server exited unexpectedly with code {frontend_process.poll()}.", "error")
                clean_shutdown()
    except KeyboardInterrupt:
        clean_shutdown()


if __name__ == "__main__":
    main()
    