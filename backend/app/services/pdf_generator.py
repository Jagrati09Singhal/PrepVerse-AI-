import io
import textwrap
from typing import Dict, Any, List, Optional
import pymupdf


class PDFReportBuilder:
    """
    Constructs a multi-page, formatted PDF interview report in memory using PyMuPDF.
    Ensures safe margins, automatic pagination, visual sectioning, and disclaimer headers/footers.
    Strictly excludes internal scoring rubrics and confidential prompts.
    """

    PAGE_WIDTH = 612.0  # Standard Letter width
    PAGE_HEIGHT = 792.0  # Standard Letter height
    LEFT_MARGIN = 50.0
    RIGHT_MARGIN = 562.0
    CONTENT_WIDTH = 512.0
    TOP_MARGIN = 50.0
    BOTTOM_MARGIN = 740.0

    # Professional color palette (RGB normalized 0.0 - 1.0)
    COLOR_PRIMARY = (0.06, 0.09, 0.16)       # #0f172a Deep navy
    COLOR_BLUE = (0.15, 0.39, 0.92)          # #2563eb Brand blue
    COLOR_EMERALD = (0.02, 0.59, 0.41)       # #059669 Emerald green
    COLOR_AMBER = (0.85, 0.47, 0.02)         # #d97706 Amber
    COLOR_ROSE = (0.88, 0.11, 0.28)          # #e11d48 Rose
    COLOR_SLATE = (0.40, 0.47, 0.58)         # #64748b Slate gray
    COLOR_LIGHT_BG = (0.95, 0.96, 0.98)      # #f1f5f9 Card background
    COLOR_BORDER = (0.85, 0.88, 0.92)        # #cbd5e1 Light border

    def __init__(self, report_data: Dict[str, Any]):
        self.data = report_data
        self.doc = pymupdf.open()
        self.current_page = None
        self.y = self.TOP_MARGIN
        self._new_page()

    def _new_page(self):
        """Creates a new page and resets y cursor."""
        self.current_page = self.doc.new_page(width=self.PAGE_WIDTH, height=self.PAGE_HEIGHT)
        self.y = self.TOP_MARGIN + 15.0

    def _ensure_space(self, required_height: float):
        """Ensures sufficient vertical space exists; triggers page break if needed."""
        if self.y + required_height > self.BOTTOM_MARGIN:
            self._new_page()

    def add_header(self):
        """Draws top title banner with branding and session details."""
        # Top banner background
        self.current_page.draw_rect(
            pymupdf.Rect(self.LEFT_MARGIN, self.y, self.RIGHT_MARGIN, self.y + 55),
            color=self.COLOR_BLUE,
            fill=self.COLOR_PRIMARY,
        )

        # Title
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN + 15, self.y + 26),
            "PrepVerse AI — Evaluation Report",
            fontsize=16,
            fontname="helv",
            color=(1.0, 1.0, 1.0),
        )

        role = self.data.get("role_title") or "Software Engineer"
        mode = self.data.get("interview_mode", "text").capitalize()
        practice_mode = self.data.get("practice_mode", "mock_interview").replace("_", " ").title()
        subtitle = f"{role}  |  {mode} Mode  |  {practice_mode}"
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN + 15, self.y + 44),
            subtitle,
            fontsize=10,
            fontname="helv",
            color=(0.8, 0.85, 0.95),
        )

        self.y += 70

    def add_meta_cards(self):
        """Draws key session parameters in structured boxes."""
        self._ensure_space(60)
        box_y = self.y
        box_h = 50.0
        col_w = (self.CONTENT_WIDTH - 20) / 3

        # 1. Overall Score Box
        score_val = self.data.get("overall_score")
        score_str = f"{score_val}%" if score_val is not None else "N/A"
        self.current_page.draw_rect(
            pymupdf.Rect(self.LEFT_MARGIN, box_y, self.LEFT_MARGIN + col_w, box_y + box_h),
            color=self.COLOR_BORDER,
            fill=self.COLOR_LIGHT_BG,
        )
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN + 10, box_y + 18),
            "OVERALL SCORE",
            fontsize=8,
            fontname="helv",
            color=self.COLOR_SLATE,
        )
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN + 10, box_y + 40),
            score_str,
            fontsize=18,
            fontname="helv",
            color=self.COLOR_PRIMARY,
        )

        # 2. Questions Status Box
        q_count = self.data.get("total_questions", 0)
        eval_count = self.data.get("evaluated_count", 0)
        q_str = f"{eval_count} of {q_count} Evaluated"
        col2_x = self.LEFT_MARGIN + col_w + 10
        self.current_page.draw_rect(
            pymupdf.Rect(col2_x, box_y, col2_x + col_w, box_y + box_h),
            color=self.COLOR_BORDER,
            fill=self.COLOR_LIGHT_BG,
        )
        self.current_page.insert_text(
            pymupdf.Point(col2_x + 10, box_y + 18),
            "QUESTIONS STATUS",
            fontsize=8,
            fontname="helv",
            color=self.COLOR_SLATE,
        )
        self.current_page.insert_text(
            pymupdf.Point(col2_x + 10, box_y + 38),
            q_str,
            fontsize=12,
            fontname="helv",
            color=self.COLOR_PRIMARY,
        )

        # 3. Mode & Difficulty Box
        is_adaptive = self.data.get("is_adaptive", True)
        adaptive_str = "Adaptive: On" if is_adaptive else "Standard Fixed"
        col3_x = col2_x + col_w + 10
        self.current_page.draw_rect(
            pymupdf.Rect(col3_x, box_y, col3_x + col_w, box_y + box_h),
            color=self.COLOR_BORDER,
            fill=self.COLOR_LIGHT_BG,
        )
        self.current_page.insert_text(
            pymupdf.Point(col3_x + 10, box_y + 18),
            "SYSTEM CONFIG",
            fontsize=8,
            fontname="helv",
            color=self.COLOR_SLATE,
        )
        self.current_page.insert_text(
            pymupdf.Point(col3_x + 10, box_y + 38),
            adaptive_str,
            fontsize=12,
            fontname="helv",
            color=self.COLOR_PRIMARY,
        )

        self.y += box_h + 18

    def add_section_header(self, title: str):
        """Renders section header with divider."""
        self._ensure_space(30)
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN, self.y + 12),
            title.upper(),
            fontsize=11,
            fontname="helv",
            color=self.COLOR_BLUE,
        )
        self.current_page.draw_line(
            pymupdf.Point(self.LEFT_MARGIN, self.y + 18),
            pymupdf.Point(self.RIGHT_MARGIN, self.y + 18),
            color=self.COLOR_BORDER,
            width=1.0,
        )
        self.y += 28

    def add_executive_summary(self):
        """Renders executive performance scores and methodology."""
        avg_content = self.data.get("average_content_score")
        avg_comm = self.data.get("average_communication_score")

        content_str = f"{avg_content}%" if avg_content is not None else "N/A"
        comm_str = f"{avg_comm}%" if avg_comm is not None else "N/A"

        summary_text = (
            f"Candidate demonstrated an average Content Score of {content_str} and an average "
            f"Communication Score of {comm_str}. Evaluated across technical reasoning, problem-solving, "
            f"and structured behavioral responses."
        )

        self._ensure_space(50)
        lines = textwrap.wrap(summary_text, width=82)
        for line in lines:
            self.current_page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN, self.y),
                line,
                fontsize=9.5,
                fontname="helv",
                color=self.COLOR_PRIMARY,
            )
            self.y += 14

        methodology = self.data.get("scoring_methodology")
        if methodology:
            self.y += 4
            meth_lines = textwrap.wrap(f"Scoring Methodology: {methodology}", width=88)
            for line in meth_lines:
                self.current_page.insert_text(
                    pymupdf.Point(self.LEFT_MARGIN, self.y),
                    line,
                    fontsize=8.5,
                    fontname="helv",
                    color=self.COLOR_SLATE,
                )
                self.y += 12

        self.y += 10

    def add_speech_analytics_summary(self):
        """Renders delivery and speech analytics if present."""
        sa_sum = self.data.get("speech_analytics_summary")
        if not sa_sum:
            return

        self.add_section_header("Speech & Delivery Analytics")
        self._ensure_space(70)

        # Draw summary box
        wpm = sa_sum.get("average_pace_wpm")
        wpm_str = f"{Math_round(wpm)} WPM" if wpm is not None else "Unavailable"
        category = sa_sum.get("pace_assessment", "N/A")
        fillers = sa_sum.get("total_filler_count", 0)
        filler_rate = sa_sum.get("average_filler_rate_percentage", 0.0)
        voice_count = sa_sum.get("voice_answers_analyzed", 0)

        metrics_text = (
            f"Voice Responses Analyzed: {voice_count}   |   Average Pace: {wpm_str} ({category})   |   "
            f"Total Fillers: {fillers} ({filler_rate}% rate)"
        )

        self.current_page.draw_rect(
            pymupdf.Rect(self.LEFT_MARGIN, self.y, self.RIGHT_MARGIN, self.y + 45),
            color=self.COLOR_BORDER,
            fill=self.COLOR_LIGHT_BG,
        )
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN + 12, self.y + 18),
            metrics_text,
            fontsize=9,
            fontname="helv",
            color=self.COLOR_PRIMARY,
        )
        self.current_page.insert_text(
            pymupdf.Point(self.LEFT_MARGIN + 12, self.y + 34),
            "Note: Speaking pace requires >= 5.0s audio duration. Delivery metrics do not alter technical content score.",
            fontsize=8,
            fontname="helv",
            color=self.COLOR_SLATE,
        )

        self.y += 55

    def add_star_breakdown(self):
        """Renders STAR behavioral competencies if available."""
        star = self.data.get("star_breakdown")
        if not star:
            return

        self.add_section_header("Behavioral STAR Competency Breakdown")
        self._ensure_space(50)

        box_y = self.y
        box_h = 38.0
        col_w = (self.CONTENT_WIDTH - 30) / 4

        star_items = [
            ("SITUATION (20%)", star.get("situation", 0.0)),
            ("TASK (20%)", star.get("task", 0.0)),
            ("ACTION (35%)", star.get("action", 0.0)),
            ("RESULT (25%)", star.get("result", 0.0)),
        ]

        for i, (label, val) in enumerate(star_items):
            bx = self.LEFT_MARGIN + i * (col_w + 10)
            self.current_page.draw_rect(
                pymupdf.Rect(bx, box_y, bx + col_w, box_y + box_h),
                color=self.COLOR_BORDER,
                fill=self.COLOR_LIGHT_BG,
            )
            self.current_page.insert_text(
                pymupdf.Point(bx + 8, box_y + 15),
                label,
                fontsize=7.5,
                fontname="helv",
                color=self.COLOR_SLATE,
            )
            self.current_page.insert_text(
                pymupdf.Point(bx + 8, box_y + 30),
                f"{val}%",
                fontsize=12,
                fontname="helv",
                color=self.COLOR_EMERALD if val >= 75 else self.COLOR_PRIMARY,
            )

        self.y += box_h + 15

    def add_questions_review(self):
        """Renders comprehensive question review with feedback."""
        questions_feedback = self.data.get("questions_feedback", [])
        if not questions_feedback:
            return

        self.add_section_header("Detailed Question Evaluations")

        for idx, qf in enumerate(questions_feedback, start=1):
            q_text = qf.get("question_text", "")
            q_type = qf.get("type", "Technical").capitalize()
            difficulty = qf.get("difficulty", "medium").upper()
            target_skill = qf.get("target_skill") or "Engineering"
            ans_text = qf.get("answer_text") or "(No answer recorded)"
            feedback = qf.get("feedback_text") or "No detailed evaluation available."
            c_score = qf.get("content_score")
            comm_score = qf.get("communication_score")
            adaptation_reason = qf.get("adaptation_reason")

            score_badge = f"Content: {c_score}%" if c_score is not None else "Pending"
            if comm_score is not None:
                score_badge += f"  |  Comm: {comm_score}%"

            # Check if block fits or needs page break
            self._ensure_space(110)

            # Question header row
            self.current_page.draw_rect(
                pymupdf.Rect(self.LEFT_MARGIN, self.y, self.RIGHT_MARGIN, self.y + 20),
                color=self.COLOR_BORDER,
                fill=self.COLOR_LIGHT_BG,
            )
            q_header_text = f"Q{idx}. [{q_type} — {difficulty}]  Target: {target_skill}   |   {score_badge}"
            self.current_page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN + 8, self.y + 14),
                q_header_text,
                fontsize=8.5,
                fontname="helv",
                color=self.COLOR_PRIMARY,
            )
            self.y += 26

            # Question Text
            self.current_page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN, self.y),
                "Question Prompt:",
                fontsize=8.5,
                fontname="helv",
                color=self.COLOR_SLATE,
            )
            self.y += 12
            q_lines = textwrap.wrap(q_text, width=86)
            for line in q_lines:
                self._ensure_space(14)
                self.current_page.insert_text(
                    pymupdf.Point(self.LEFT_MARGIN, self.y),
                    line,
                    fontsize=9,
                    fontname="helv",
                    color=self.COLOR_PRIMARY,
                )
                self.y += 12
            self.y += 4

            # Candidate Answer
            self._ensure_space(14)
            self.current_page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN, self.y),
                "Candidate Response:",
                fontsize=8.5,
                fontname="helv",
                color=self.COLOR_SLATE,
            )
            self.y += 12
            ans_lines = textwrap.wrap(ans_text[:800] + ("..." if len(ans_text) > 800 else ""), width=86)
            for line in ans_lines:
                self._ensure_space(14)
                self.current_page.insert_text(
                    pymupdf.Point(self.LEFT_MARGIN, self.y),
                    line,
                    fontsize=8.5,
                    fontname="helv",
                    color=self.COLOR_PRIMARY,
                )
                self.y += 11
            self.y += 4

            # Feedback
            self._ensure_space(14)
            self.current_page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN, self.y),
                "Evaluation & Feedback:",
                fontsize=8.5,
                fontname="helv",
                color=self.COLOR_BLUE,
            )
            self.y += 12
            fb_lines = textwrap.wrap(feedback, width=86)
            for line in fb_lines:
                self._ensure_space(14)
                self.current_page.insert_text(
                    pymupdf.Point(self.LEFT_MARGIN, self.y),
                    line,
                    fontsize=8.5,
                    fontname="helv",
                    color=self.COLOR_PRIMARY,
                )
                self.y += 11

            # Adaptation Reason if applicable
            if adaptation_reason:
                self.y += 2
                self._ensure_space(14)
                self.current_page.insert_text(
                    pymupdf.Point(self.LEFT_MARGIN, self.y),
                    f"Adaptive Trajectory: {adaptation_reason}",
                    fontsize=8,
                    fontname="helv",
                    color=self.COLOR_AMBER,
                )
                self.y += 12

            self.y += 14

    def add_recommendations_and_disclaimer(self):
        """Renders recommendations and closing disclaimers."""
        recs = self.data.get("actionable_recommendations", [])
        if recs:
            self.add_section_header("Actionable Recommendations")
            for rec in recs:
                self._ensure_space(20)
                bullet_lines = textwrap.wrap(f"• {rec}", width=84)
                for line in bullet_lines:
                    self.current_page.insert_text(
                        pymupdf.Point(self.LEFT_MARGIN, self.y),
                        line,
                        fontsize=9,
                        fontname="helv",
                        color=self.COLOR_PRIMARY,
                    )
                    self.y += 12
                self.y += 2

        self.y += 10
        self._ensure_space(40)

        # Closing Educational Disclaimer Banner
        disclaimer = self.data.get("disclaimer") or (
            "PrepVerse AI is an educational preparation aid and skill assessment tool. "
            "Evaluations do not guarantee employment or predict formal hiring decisions."
        )
        self.current_page.draw_rect(
            pymupdf.Rect(self.LEFT_MARGIN, self.y, self.RIGHT_MARGIN, self.y + 36),
            color=self.COLOR_BORDER,
            fill=self.COLOR_LIGHT_BG,
        )
        d_lines = textwrap.wrap(disclaimer, width=88)
        text_y = self.y + 14
        for line in d_lines:
            self.current_page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN + 10, text_y),
                line,
                fontsize=7.5,
                fontname="helv",
                color=self.COLOR_SLATE,
            )
            text_y += 10

    def finalize(self) -> bytes:
        """Adds footers with running page numbers on all pages and generates PDF bytes."""
        total_pages = self.doc.page_count
        for i, page in enumerate(self.doc, start=1):
            footer_text = f"PrepVerse AI Report  |  Page {i} of {total_pages}  |  Strictly Confidential"
            page.draw_line(
                pymupdf.Point(self.LEFT_MARGIN, self.BOTTOM_MARGIN + 15),
                pymupdf.Point(self.RIGHT_MARGIN, self.BOTTOM_MARGIN + 15),
                color=self.COLOR_BORDER,
                width=0.8,
            )
            page.insert_text(
                pymupdf.Point(self.LEFT_MARGIN, self.BOTTOM_MARGIN + 28),
                footer_text,
                fontsize=8,
                fontname="helv",
                color=self.COLOR_SLATE,
            )

        pdf_bytes = self.doc.tobytes()
        self.doc.close()
        return pdf_bytes


def Math_round(val: Optional[float]) -> int:
    """Helper for integer rounding."""
    if val is None:
        return 0
    return int(round(val))


def generate_pdf_report(report_data: Dict[str, Any]) -> bytes:
    """
    Public entry point to generate a formatted PDF report bytes payload from report dictionary.
    """
    builder = PDFReportBuilder(report_data)
    builder.add_header()
    builder.add_meta_cards()
    builder.add_executive_summary()
    builder.add_speech_analytics_summary()
    builder.add_star_breakdown()
    builder.add_questions_review()
    builder.add_recommendations_and_disclaimer()
    return builder.finalize()

