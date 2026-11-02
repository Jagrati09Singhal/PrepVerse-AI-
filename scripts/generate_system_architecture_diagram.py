import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ArrowStyle
import os

# Set figure size and DPI for high-resolution publication quality
plt.style.use('default')
fig, ax = plt.subplots(figsize=(18, 12), dpi=300)
ax.set_facecolor('#0B0F19')
fig.patch.set_facecolor('#0B0F19')

# Define custom palette
COLOR_BG = '#0B0F19'
COLOR_TIER_BG = '#111827'
COLOR_TIER_BORDER = '#1E293B'
COLOR_TEXT_WHITE = '#F8FAFC'
COLOR_TEXT_MUTED = '#94A3B8'
COLOR_CYAN = '#38BDF8'
COLOR_VIOLET = '#A855F7'
COLOR_EMERALD = '#34D399'
COLOR_AMBER = '#FBBF24'
COLOR_ROSE = '#F43F5E'
COLOR_BOX_BORDER = '#334155'

# Helper function to draw rounded boxes
def draw_card(ax, x, y, w, h, bg_color, border_color, title, subtitle=None, badge=None, badge_color='#A855F7', radius=0.015):
    # Background card
    bbox = FancyBboxPatch((x, y), w, h,
                          boxstyle=f"round,pad=0,rounding_size={radius}",
                          facecolor=bg_color, edgecolor=border_color, linewidth=1.4, zorder=2)
    ax.add_patch(bbox)
    
    # Title
    title_y = y + h - 0.22 if subtitle else y + h/2
    ax.text(x + 0.15, title_y, title, color=COLOR_TEXT_WHITE, fontsize=10.5, fontweight='bold', va='center', zorder=3)
    
    # Subtitle
    if subtitle:
        ax.text(x + 0.15, y + 0.18, subtitle, color=COLOR_TEXT_MUTED, fontsize=8.2, va='center', zorder=3)
        
    # Badge
    if badge:
        bw = len(badge) * 0.11 + 0.2
        badge_box = FancyBboxPatch((x + w - bw - 0.15, y + h - 0.32), bw, 0.2,
                                   boxstyle="round,pad=0,rounding_size=0.04",
                                   facecolor=badge_color, edgecolor='none', alpha=0.2, zorder=3)
        ax.add_patch(badge_box)
        ax.text(x + w - bw/2 - 0.15, y + h - 0.22, badge, color=badge_color, fontsize=7.5, fontweight='bold', ha='center', va='center', zorder=4)

# ----------------- HEADER & TITLE -----------------
ax.text(9.0, 11.5, "PrepVerse AI — System Architecture & Functional Workflow", 
        color=COLOR_TEXT_WHITE, fontsize=18, fontweight='bold', ha='center', va='center')
ax.text(9.0, 11.15, "Figure 4.2: End-to-End Modular Component Hierarchy, Engine Subsystems & Multi-Modal Data Pipelines", 
        color=COLOR_CYAN, fontsize=11, ha='center', va='center')

# ----------------- TIER CONTAINERS -----------------
# Tier 1: Client Presentation Layer
tier1 = FancyBboxPatch((0.5, 8.2), 17.0, 2.5, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#0F172A', edgecolor='#334155', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier1)
ax.text(0.8, 10.45, "TIER 1: PRESENTATION & WORKSPACE LAYER (React 18 + Vite + Tailwind CSS)", 
        color='#93C5FD', fontsize=10, fontweight='bold', va='center')

# Tier 2: API Gateway & Controllers
tier2 = FancyBboxPatch((0.5, 6.2), 17.0, 1.6, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#0F172A', edgecolor='#334155', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier2)
ax.text(0.8, 7.55, "TIER 2: API GATEWAY, AUTHENTICATION & SECURITY (FastAPI + Pydantic v2 + JWT)", 
        color='#C084FC', fontsize=10, fontweight='bold', va='center')

# Tier 3: Core Computational Engines
tier3 = FancyBboxPatch((0.5, 2.5), 17.0, 3.3, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#0F172A', edgecolor='#334155', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier3)
ax.text(0.8, 5.55, "TIER 3: CORE AI & APPLICATION ENGINES (Python 3.14 + PyMuPDF + Deterministic Heuristics)", 
        color='#34D399', fontsize=10, fontweight='bold', va='center')

# Tier 4: Data Persistence & Report Generation
tier4 = FancyBboxPatch((0.5, 0.4), 17.0, 1.7, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#0F172A', edgecolor='#334155', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier4)
ax.text(0.8, 1.85, "TIER 4: DATA PERSISTENCE & DOCUMENT EXPORT (SQLAlchemy 2.0 + SQLite / PostgreSQL + ReportLab)", 
        color='#FBBF24', fontsize=10, fontweight='bold', va='center')

# ----------------- TIER 1 MODULES (Client) -----------------
draw_card(ax, 0.8, 8.6, 2.5, 1.5, '#1E293B', '#38BDF8', "Candidate Dashboard", "Readiness Ring & Metrics", "UI/UX", '#38BDF8')
draw_card(ax, 3.6, 8.6, 2.5, 1.5, '#1E293B', '#38BDF8', "Resume Intelligence", "PDF Upload & Skill Badges", "Client", '#38BDF8')
draw_card(ax, 6.4, 8.6, 2.5, 1.5, '#1E293B', '#A855F7', "Interview Simulator", "Voice / Text Dual-Mode", "Core", '#A855F7')
draw_card(ax, 9.2, 8.6, 2.5, 1.5, '#1E293B', '#34D399', "AI Coach Hub", "Rubrics & Exemplars", "Feedback", '#34D399')
draw_card(ax, 12.0, 8.6, 2.5, 1.5, '#1E293B', '#FBBF24', "Roadmap & Analytics", "WPM Pacing & Trends", "Tracking", '#FBBF24')
draw_card(ax, 14.8, 8.6, 2.4, 1.5, '#1E293B', '#F43F5E', "Admin Control Hub", "Curriculum & Analytics", "Faculty", '#F43F5E')

# ----------------- TIER 2 MODULES (Gateway) -----------------
draw_card(ax, 0.8, 6.5, 3.7, 0.85, '#1A2234', '#C084FC', "JWT Auth & Session Guard", "OAuth2 Password Bearer / RBAC", "Security", '#C084FC')
draw_card(ax, 4.9, 6.5, 3.7, 0.85, '#1A2234', '#C084FC', "REST Routing & Middleware", "CORS, Error Handlers, Endpoints", "FastAPI", '#C084FC')
draw_card(ax, 9.0, 6.5, 3.7, 0.85, '#1A2234', '#C084FC', "Pydantic Schema Validation", "Payload Serialization & Contracts", "Schemas", '#C084FC')
draw_card(ax, 13.1, 6.5, 4.1, 0.85, '#1A2234', '#C084FC', "Multi-Tenant Data Isolation", "Scoped Queries & User Verification", "Isolation", '#C084FC')

# ----------------- TIER 3 MODULES (Engines) -----------------
draw_card(ax, 0.8, 4.1, 3.8, 1.15, '#132338', '#38BDF8', "PyMuPDF Resume Parser", "Text Normalization & Regex Taxonomy", "Extraction", '#38BDF8')
draw_card(ax, 4.9, 4.1, 3.8, 1.15, '#132338', '#A855F7', "Job Matching Engine", "Role Alignment & Skill Gap Analysis", "Matching", '#A855F7')
draw_card(ax, 9.0, 4.1, 3.8, 1.15, '#132338', '#34D399', "Adaptive Question Generator", "Year-Calibrated (1st-4th / OS, DBMS, DSA)", "Adaptive", '#34D399')
draw_card(ax, 13.1, 4.1, 4.1, 1.15, '#132338', '#FBBF24', "Speech Analytics Engine", "WPM Audio Pacing & Filler Word Counter", "Audio", '#FBBF24')

draw_card(ax, 0.8, 2.7, 5.0, 1.15, '#132338', '#F43F5E', "STAR & Technical Evaluation Engine", "Deterministic Rubric Scoring (Situation, Task, Action, Result)", "Scoring", '#F43F5E')
draw_card(ax, 6.1, 2.7, 5.2, 1.15, '#132338', '#A855F7', "AI Coach & Model Exemplar Service", "4-Step Production Architectural Reference Generator", "AI Coach", '#A855F7')
draw_card(ax, 11.6, 2.7, 5.6, 1.15, '#132338', '#38BDF8', "Preparation Roadmap Planner", "Dynamic Curriculum, Milestone Timeline & Tasks", "Roadmap", '#38BDF8')

# ----------------- TIER 4 MODULES (Storage & PDF) -----------------
draw_card(ax, 0.8, 0.65, 5.0, 0.95, '#1A2234', '#FBBF24', "SQLAlchemy 2.0 ORM Engine", "Declarative Models, Relationships & DB Pool", "ORM", '#FBBF24')
draw_card(ax, 6.1, 0.65, 5.2, 0.95, '#1A2234', '#34D399', "Relational Database Engine", "SQLite (Local Dev) / PostgreSQL (Production)", "Database", '#34D399')
draw_card(ax, 11.6, 0.65, 5.6, 0.95, '#1A2234', '#F43F5E', "ReportLab Executive PDF Exporter", "Generates Comprehensive Performance Transcript PDF", "Export", '#F43F5E')

# ----------------- WORKFLOW FLOW ARROWS -----------------
arrow_kw = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#60A5FA', zorder=5)
arrow_violet = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#C084FC', zorder=5)
arrow_emerald = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#34D399', zorder=5)
arrow_amber = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#FBBF24', zorder=5)

# Tier 1 to Tier 2
ax.annotate("", xy=(2.6, 7.35), xytext=(2.6, 8.6), arrowprops=arrow_kw)
ax.annotate("", xy=(7.6, 7.35), xytext=(7.6, 8.6), arrowprops=arrow_violet)
ax.annotate("", xy=(10.8, 7.35), xytext=(10.8, 8.6), arrowprops=arrow_emerald)
ax.annotate("", xy=(15.8, 7.35), xytext=(15.8, 8.6), arrowprops=arrow_amber)

# Tier 2 to Tier 3
ax.annotate("", xy=(2.7, 5.25), xytext=(2.7, 6.5), arrowprops=arrow_kw)
ax.annotate("", xy=(6.8, 5.25), xytext=(6.8, 6.5), arrowprops=arrow_violet)
ax.annotate("", xy=(10.9, 5.25), xytext=(10.9, 6.5), arrowprops=arrow_emerald)
ax.annotate("", xy=(15.1, 5.25), xytext=(15.1, 6.5), arrowprops=arrow_amber)

# Tier 3 internal flow
ax.annotate("", xy=(4.9, 4.67), xytext=(4.6, 4.67), arrowprops=dict(arrowstyle="->", lw=1.5, color='#94A3B8'))
ax.annotate("", xy=(9.0, 4.67), xytext=(8.7, 4.67), arrowprops=dict(arrowstyle="->", lw=1.5, color='#94A3B8'))
ax.annotate("", xy=(13.1, 4.67), xytext=(12.8, 4.67), arrowprops=dict(arrowstyle="->", lw=1.5, color='#94A3B8'))

# Tier 3 to Tier 4
ax.annotate("", xy=(3.3, 1.6), xytext=(3.3, 2.7), arrowprops=arrow_kw)
ax.annotate("", xy=(8.7, 1.6), xytext=(8.7, 2.7), arrowprops=arrow_emerald)
ax.annotate("", xy=(14.4, 1.6), xytext=(14.4, 2.7), arrowprops=arrow_amber)

# Numbered workflow sequence badges on arrows for academic rigor
def add_step_badge(ax, x, y, num, text):
    box = FancyBboxPatch((x-0.2, y-0.15), 0.4, 0.3, boxstyle="round,pad=0,rounding_size=0.08",
                         facecolor='#1E293B', edgecolor='#38BDF8', linewidth=1.2, zorder=6)
    ax.add_patch(box)
    ax.text(x, y, str(num), color='#38BDF8', fontsize=8, fontweight='bold', ha='center', va='center', zorder=7)
    ax.text(x + 0.3, y, text, color=COLOR_TEXT_WHITE, fontsize=7.5, va='center', zorder=7)

add_step_badge(ax, 2.6, 8.0, 1, "Resume Upload")
add_step_badge(ax, 7.6, 8.0, 2, "Adaptive Session Launch")
add_step_badge(ax, 10.8, 8.0, 3, "Speech & Text Ingestion")
add_step_badge(ax, 15.8, 8.0, 4, "Admin Faculty Monitoring")

add_step_badge(ax, 2.7, 5.85, 5, "PyMuPDF Parse")
add_step_badge(ax, 6.8, 5.85, 6, "Skill Gap Match")
add_step_badge(ax, 10.9, 5.85, 7, "Calibrated Question Gen")
add_step_badge(ax, 15.1, 5.85, 8, "Acoustic Telemetry")

add_step_badge(ax, 3.3, 2.15, 9, "DB Commit")
add_step_badge(ax, 8.7, 2.15, 10, "Persistence")
add_step_badge(ax, 14.4, 2.15, 11, "Executive PDF Export")

ax.set_xlim(0, 18)
ax.set_ylim(0, 12.2)
ax.axis('off')

output_path = os.path.join(os.getcwd(), 'docs', 'figure_4_2_system_modules_and_workflow.png')
plt.tight_layout()
plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close()

print(f"Successfully generated high-resolution diagram at: {output_path}")
