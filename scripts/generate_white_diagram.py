import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import os

plt.style.use('default')
fig, ax = plt.subplots(figsize=(18, 12), dpi=300)
ax.set_facecolor('#FFFFFF')
fig.patch.set_facecolor('#FFFFFF')

COLOR_TEXT_MAIN = '#0F172A'
COLOR_TEXT_MUTED = '#475569'
COLOR_BLUE = '#0284C7'
COLOR_VIOLET = '#7C3AED'
COLOR_EMERALD = '#059669'
COLOR_AMBER = '#D97706'
COLOR_ROSE = '#E11D48'

def draw_card(ax, x, y, w, h, bg_color, border_color, title, subtitle=None, badge=None, badge_color='#7C3AED', radius=0.015):
    bbox = FancyBboxPatch((x, y), w, h,
                          boxstyle=f"round,pad=0,rounding_size={radius}",
                          facecolor=bg_color, edgecolor=border_color, linewidth=1.5, zorder=2)
    ax.add_patch(bbox)
    
    title_y = y + h - 0.22 if subtitle else y + h/2
    ax.text(x + 0.15, title_y, title, color=COLOR_TEXT_MAIN, fontsize=10.5, fontweight='bold', va='center', zorder=3)
    
    if subtitle:
        ax.text(x + 0.15, y + 0.18, subtitle, color=COLOR_TEXT_MUTED, fontsize=8.2, va='center', zorder=3)
        
    if badge:
        bw = len(badge) * 0.11 + 0.22
        badge_box = FancyBboxPatch((x + w - bw - 0.15, y + h - 0.32), bw, 0.2,
                                   boxstyle="round,pad=0,rounding_size=0.04",
                                   facecolor=badge_color, edgecolor='none', alpha=0.15, zorder=3)
        ax.add_patch(badge_box)
        ax.text(x + w - bw/2 - 0.15, y + h - 0.22, badge, color=badge_color, fontsize=7.5, fontweight='bold', ha='center', va='center', zorder=4)

# Header
ax.text(9.0, 11.5, "PrepVerse AI — System Architecture & Functional Workflow", 
        color=COLOR_TEXT_MAIN, fontsize=18, fontweight='bold', ha='center', va='center')
ax.text(9.0, 11.15, "Figure 4.2: End-to-End Modular Component Hierarchy, Engine Subsystems & Multi-Modal Data Pipelines", 
        color=COLOR_BLUE, fontsize=11, fontweight='semibold', ha='center', va='center')

# Tier Containers
tier1 = FancyBboxPatch((0.5, 8.2), 17.0, 2.5, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier1)
ax.text(0.8, 10.45, "TIER 1: PRESENTATION & WORKSPACE LAYER (React 18 + Vite + Tailwind CSS)", 
        color='#0369A1', fontsize=10, fontweight='bold', va='center')

tier2 = FancyBboxPatch((0.5, 6.2), 17.0, 1.6, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier2)
ax.text(0.8, 7.55, "TIER 2: API GATEWAY, AUTHENTICATION & SECURITY (FastAPI + Pydantic v2 + JWT)", 
        color='#6D28D9', fontsize=10, fontweight='bold', va='center')

tier3 = FancyBboxPatch((0.5, 2.5), 17.0, 3.3, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier3)
ax.text(0.8, 5.55, "TIER 3: CORE AI & APPLICATION ENGINES (Python 3.14 + PyMuPDF + Deterministic Heuristics)", 
        color='#047857', fontsize=10, fontweight='bold', va='center')

tier4 = FancyBboxPatch((0.5, 0.4), 17.0, 1.7, boxstyle="round,pad=0,rounding_size=0.02",
                       facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1.5, linestyle='--', zorder=1)
ax.add_patch(tier4)
ax.text(0.8, 1.85, "TIER 4: DATA PERSISTENCE & DOCUMENT EXPORT (SQLAlchemy 2.0 + SQLite / PostgreSQL + ReportLab)", 
        color='#B45309', fontsize=10, fontweight='bold', va='center')

# Tier 1 Cards
draw_card(ax, 0.8, 8.6, 2.5, 1.5, '#FFFFFF', '#0284C7', "Candidate Dashboard", "Readiness Ring & Metrics", "UI/UX", '#0284C7')
draw_card(ax, 3.6, 8.6, 2.5, 1.5, '#FFFFFF', '#0284C7', "Resume Intelligence", "PDF Upload & Skill Badges", "Client", '#0284C7')
draw_card(ax, 6.4, 8.6, 2.5, 1.5, '#FFFFFF', '#7C3AED', "Interview Simulator", "Voice / Text Dual-Mode", "Core", '#7C3AED')
draw_card(ax, 9.2, 8.6, 2.5, 1.5, '#FFFFFF', '#059669', "AI Coach Hub", "Rubrics & Exemplars", "Feedback", '#059669')
draw_card(ax, 12.0, 8.6, 2.5, 1.5, '#FFFFFF', '#D97706', "Roadmap & Analytics", "WPM Pacing & Trends", "Tracking", '#D97706')
draw_card(ax, 14.8, 8.6, 2.4, 1.5, '#FFFFFF', '#E11D48', "Admin Control Hub", "Curriculum & Analytics", "Faculty", '#E11D48')

# Tier 2 Cards
draw_card(ax, 0.8, 6.5, 3.7, 0.85, '#FFFFFF', '#7C3AED', "JWT Auth & Session Guard", "OAuth2 Password Bearer / RBAC", "Security", '#7C3AED')
draw_card(ax, 4.9, 6.5, 3.7, 0.85, '#FFFFFF', '#7C3AED', "REST Routing & Middleware", "CORS, Error Handlers, Endpoints", "FastAPI", '#7C3AED')
draw_card(ax, 9.0, 6.5, 3.7, 0.85, '#FFFFFF', '#7C3AED', "Pydantic Schema Validation", "Payload Serialization & Contracts", "Schemas", '#7C3AED')
draw_card(ax, 13.1, 6.5, 4.1, 0.85, '#FFFFFF', '#7C3AED', "Multi-Tenant Data Isolation", "Scoped Queries & User Verification", "Isolation", '#7C3AED')

# Tier 3 Cards
draw_card(ax, 0.8, 4.1, 3.8, 1.15, '#FFFFFF', '#0284C7', "PyMuPDF Resume Parser", "Text Normalization & Regex Taxonomy", "Extraction", '#0284C7')
draw_card(ax, 4.9, 4.1, 3.8, 1.15, '#FFFFFF', '#7C3AED', "Job Matching Engine", "Role Alignment & Skill Gap Analysis", "Matching", '#7C3AED')
draw_card(ax, 9.0, 4.1, 3.8, 1.15, '#FFFFFF', '#059669', "Adaptive Question Generator", "Year-Calibrated (1st-4th / OS, DBMS, DSA)", "Adaptive", '#059669')
draw_card(ax, 13.1, 4.1, 4.1, 1.15, '#FFFFFF', '#D97706', "Speech Analytics Engine", "WPM Audio Pacing & Filler Word Counter", "Audio", '#D97706')

draw_card(ax, 0.8, 2.7, 5.0, 1.15, '#FFFFFF', '#E11D48', "STAR & Technical Evaluation Engine", "Deterministic Rubric Scoring (Situation, Task, Action, Result)", "Scoring", '#E11D48')
draw_card(ax, 6.1, 2.7, 5.2, 1.15, '#FFFFFF', '#7C3AED', "AI Coach & Model Exemplar Service", "4-Step Production Architectural Reference Generator", "AI Coach", '#7C3AED')
draw_card(ax, 11.6, 2.7, 5.6, 1.15, '#FFFFFF', '#0284C7', "Preparation Roadmap Planner", "Dynamic Curriculum, Milestone Timeline & Tasks", "Roadmap", '#0284C7')

# Tier 4 Cards
draw_card(ax, 0.8, 0.65, 5.0, 0.95, '#FFFFFF', '#D97706', "SQLAlchemy 2.0 ORM Engine", "Declarative Models, Relationships & DB Pool", "ORM", '#D97706')
draw_card(ax, 6.1, 0.65, 5.2, 0.95, '#FFFFFF', '#059669', "Relational Database Engine", "SQLite (Local Dev) / PostgreSQL (Production)", "Database", '#059669')
draw_card(ax, 11.6, 0.65, 5.6, 0.95, '#FFFFFF', '#E11D48', "ReportLab Executive PDF Exporter", "Generates Comprehensive Performance Transcript PDF", "Export", '#E11D48')

# Arrows
arrow_blue = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#0284C7', zorder=5)
arrow_violet = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#7C3AED', zorder=5)
arrow_emerald = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#059669', zorder=5)
arrow_amber = dict(arrowstyle="->,head_width=0.4,head_length=0.6", lw=1.6, color='#D97706', zorder=5)

ax.annotate("", xy=(2.6, 7.35), xytext=(2.6, 8.6), arrowprops=arrow_blue)
ax.annotate("", xy=(7.6, 7.35), xytext=(7.6, 8.6), arrowprops=arrow_violet)
ax.annotate("", xy=(10.8, 7.35), xytext=(10.8, 8.6), arrowprops=arrow_emerald)
ax.annotate("", xy=(15.8, 7.35), xytext=(15.8, 8.6), arrowprops=arrow_amber)

ax.annotate("", xy=(2.7, 5.25), xytext=(2.7, 6.5), arrowprops=arrow_blue)
ax.annotate("", xy=(6.8, 5.25), xytext=(6.8, 6.5), arrowprops=arrow_violet)
ax.annotate("", xy=(10.9, 5.25), xytext=(10.9, 6.5), arrowprops=arrow_emerald)
ax.annotate("", xy=(15.1, 5.25), xytext=(15.1, 6.5), arrowprops=arrow_amber)

ax.annotate("", xy=(4.9, 4.67), xytext=(4.6, 4.67), arrowprops=dict(arrowstyle="->", lw=1.5, color='#64748B'))
ax.annotate("", xy=(9.0, 4.67), xytext=(8.7, 4.67), arrowprops=dict(arrowstyle="->", lw=1.5, color='#64748B'))
ax.annotate("", xy=(13.1, 4.67), xytext=(12.8, 4.67), arrowprops=dict(arrowstyle="->", lw=1.5, color='#64748B'))

ax.annotate("", xy=(3.3, 1.6), xytext=(3.3, 2.7), arrowprops=arrow_blue)
ax.annotate("", xy=(8.7, 1.6), xytext=(8.7, 2.7), arrowprops=arrow_emerald)
ax.annotate("", xy=(14.4, 1.6), xytext=(14.4, 2.7), arrowprops=arrow_amber)

def add_step_badge(ax, x, y, num, text):
    box = FancyBboxPatch((x-0.2, y-0.15), 0.4, 0.3, boxstyle="round,pad=0,rounding_size=0.08",
                         facecolor='#FFFFFF', edgecolor='#0284C7', linewidth=1.2, zorder=6)
    ax.add_patch(box)
    ax.text(x, y, str(num), color='#0284C7', fontsize=8, fontweight='bold', ha='center', va='center', zorder=7)
    ax.text(x + 0.3, y, text, color=COLOR_TEXT_MAIN, fontsize=7.5, fontweight='semibold', va='center', zorder=7)

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

output_path = os.path.join(os.getcwd(), 'docs', 'figure_4_2_system_modules_and_workflow_white.png')
plt.tight_layout()
plt.savefig(output_path, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
plt.close()

print(f"Successfully generated light-theme diagram at: {output_path}")
