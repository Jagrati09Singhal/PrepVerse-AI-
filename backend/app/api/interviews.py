import logging
import json
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Response, Query
from sqlalchemy.orm import Session as DBSession, selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.job_analysis import JobAnalysis
from app.models.session import Session as InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.roadmap import PreparationPlan
from app.models.enums import SessionStatus, QuestionType, QuestionDifficulty
from app.schemas.interview import (
    InterviewCreate,
    QuestionOut,
    AnswerSubmit,
    AnswerEvaluationOut,
    AudioTranscribeResponse,
    InterviewSessionListItem,
    InterviewSessionDetail,
    InterviewReport,
)
from app.schemas.coach import CoachFeedbackRequest, CoachingFeedbackResponse
from app.services.coach_service import generate_coaching_feedback
from app.services.question_generator import generate_interview_questions
from app.services.answer_evaluator import evaluate_answer
from app.services.report_generator import generate_interview_report
from app.services.pdf_generator import generate_pdf_report
from app.services.speech_transcriber import validate_audio_upload, get_speech_transcriber
from app.services.adaptive_difficulty import adapt_upcoming_question
from app.services.skill_assessment_engine import generate_skill_assessment_questions, detect_student_year_from_resume

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def _build_session_detail(session: InterviewSession) -> InterviewSessionDetail:
    """Helper to convert Session DB model to InterviewSessionDetail schema."""
    questions_out: List[QuestionOut] = []
    answers_out: List[AnswerEvaluationOut] = []

    sorted_questions = sorted(session.questions, key=lambda q: q.order_index)
    for q in sorted_questions:
        q_format = "open_ended"
        q_options = None
        if q.rubric_criteria:
            try:
                meta = json.loads(q.rubric_criteria)
                if isinstance(meta, dict):
                    q_format = meta.get("format", "open_ended")
                    q_options = meta.get("options")
            except Exception:
                pass
        
        q_item = QuestionOut(
            id=q.id,
            session_id=q.session_id,
            question_text=q.question_text,
            type=q.type,
            difficulty=q.difficulty,
            order_index=q.order_index,
            target_skill=q.target_skill,
            adaptation_reason=q.adaptation_reason,
            format=q_format,
            options=q_options,
        )
        questions_out.append(q_item)
        for ans in q.answers:
            answers_out.append(AnswerEvaluationOut.model_validate(ans))

    answered_ids = {ans.question_id for ans in answers_out}
    next_idx = 0
    for idx, q in enumerate(sorted_questions):
        if q.id not in answered_ids:
            next_idx = idx
            break
    else:
        next_idx = len(sorted_questions)

    is_complete = session.status == SessionStatus.COMPLETED or (
        len(sorted_questions) > 0 and len(answered_ids) == len(sorted_questions)
    )

    types_list = None
    if isinstance(session.question_types, list):
        types_list = [str(t) for t in session.question_types]

    return InterviewSessionDetail(
        id=session.id,
        user_id=session.user_id,
        resume_id=session.resume_id,
        job_analysis_id=session.job_analysis_id,
        role_title=session.role_title,
        job_description=session.job_description,
        status=session.status,
        question_count=session.question_count,
        difficulty=session.difficulty,
        question_types=types_list,
        interview_mode=getattr(session, "interview_mode", "text") or "text",
        is_adaptive=getattr(session, "is_adaptive", True),
        practice_mode=getattr(session, "practice_mode", "mock_interview") or "mock_interview",
        target_focus=getattr(session, "target_focus", None),
        overall_score=session.overall_score,
        communication_score=session.communication_score,
        created_at=session.created_at,
        completed_at=session.completed_at,
        questions=questions_out,
        answers=answers_out,
        current_question_index=next_idx,
        is_complete=is_complete,
    )


@router.post("", response_model=InterviewSessionDetail, status_code=status.HTTP_201_CREATED)
def create_interview_session(
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Creates a new personalized interview session using an owned resume and job analysis.
    Generates personalized questions tailored to role requirements and skill gaps.
    Enforces tenant isolation: user can only use resumes and analyses they own.
    Supports voice and text interview modes and adaptive difficulty.
    """
    # 1. Verify resume ownership
    resume = db.get(Resume, payload.resume_id)
    if not resume or resume.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or does not belong to the authenticated candidate",
        )

    # 2. Extract job context and skill gaps
    role_title = payload.role_title
    skill_gaps: List[str] = []
    evidenced_skills: List[str] = []
    jd_req_skills: List[str] = []
    jd_pref_skills: List[str] = []
    job_desc = payload.job_description or getattr(payload, "job_description_raw", None) or ""

    if payload.job_analysis_id:
        analysis = db.get(JobAnalysis, payload.job_analysis_id)
        if not analysis or analysis.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job analysis not found or does not belong to the authenticated candidate",
            )
        job_desc = analysis.job_description_raw
        if not role_title and analysis.role_title:
            role_title = analysis.role_title

        if isinstance(analysis.match_results, list):
            for m in analysis.match_results:
                skill_name = m.get("skill")
                classification = m.get("classification")
                if classification in ("not_found", "needs_verification") and skill_name:
                    skill_gaps.append(skill_name)
                elif classification == "evidence_found" and skill_name:
                    evidenced_skills.append(skill_name)

        if isinstance(analysis.extracted_requirements, dict):
            jd_req_skills = analysis.extracted_requirements.get("required_skills", [])
            jd_pref_skills = analysis.extracted_requirements.get("preferred_skills", [])

    final_role = (role_title or "Software Engineer").strip()

    # Gracefully default to role-specific interview requirements if job description is short or not provided
    if not job_desc or len(job_desc.strip()) < 10:
        job_desc = (
            f"Comprehensive technical, behavioral, and architectural interview requirements for {final_role} "
            f"covering core competencies, system design, testing, and team leadership."
        )

    resume_skills = resume.parsed_skills if isinstance(resume.parsed_skills, list) else []

    # 3. Practice Mode Handling
    practice_mode = getattr(payload, "practice_mode", "mock_interview") or "mock_interview"
    target_focus = getattr(payload, "target_focus", None)
    question_count = payload.question_count
    question_types = payload.question_types

    if practice_mode == "quick_practice":
        # Quick practice: 3-5 questions, default 3 if default 5 was passed
        question_count = 3 if question_count == 5 else max(1, min(question_count, 5))
    elif practice_mode == "focused_technical":
        question_types = [QuestionType.TECHNICAL]
        if not target_focus:
            target_focus = skill_gaps[0] if skill_gaps else (resume_skills[0] if resume_skills else "Core Architecture")
    elif practice_mode == "weak_area":
        if not target_focus:
            # Query user's real historical low-scoring skills (< 60%)
            low_score_skills = (
                db.query(Question.target_skill)
                .join(Answer, Answer.question_id == Question.id)
                .join(InterviewSession, InterviewSession.id == Question.session_id)
                .filter(
                    InterviewSession.user_id == current_user.id,
                    Answer.evaluation_status == "completed",
                    Answer.content_score < 60.0,
                    Question.target_skill.isnot(None),
                )
                .distinct()
                .all()
            )
            hist_weak = [r[0] for r in low_score_skills if r[0]]
            if hist_weak:
                skill_gaps = hist_weak + [s for s in skill_gaps if s not in hist_weak]
                target_focus = hist_weak[0]
            elif skill_gaps:
                target_focus = skill_gaps[0]

    # 4. Generate personalized questions with cross-session deduplication
    previous_q_rows = (
        db.query(Question.question_text)
        .join(InterviewSession, InterviewSession.id == Question.session_id)
        .filter(InterviewSession.user_id == current_user.id)
        .all()
    )
    previously_asked = {r[0].strip() for r in previous_q_rows if r[0]}

    if practice_mode in ("skill_assessment", "resume_verification"):
        # Fetch user's recorded weak skills across earlier sessions for targeted reinforcement
        low_score_skills = (
            db.query(Question.target_skill)
            .join(Answer, Answer.question_id == Question.id)
            .join(InterviewSession, InterviewSession.id == Question.session_id)
            .filter(
                InterviewSession.user_id == current_user.id,
                Answer.content_score < 70.0,
                Question.target_skill.isnot(None),
            )
            .distinct()
            .all()
        )
        user_weak_skills = [r[0] for r in low_score_skills if r[0]]
        
        # Retrieve student's academic profile (studying year, branch, ongoing subjects, interests)
        user_plan = db.query(PreparationPlan).filter(PreparationPlan.user_id == current_user.id).first()
        saved_year = getattr(user_plan, "academic_year", None) if user_plan else None
        saved_subjects_str = getattr(user_plan, "ongoing_subjects", None) if user_plan else None
        saved_subjects = [s.strip() for s in saved_subjects_str.split(",") if s.strip()] if saved_subjects_str else []
        saved_interests_str = getattr(user_plan, "core_interests", None) if user_plan else None
        saved_interests = [s.strip() for s in saved_interests_str.split(",") if s.strip()] if saved_interests_str else []

        # Detect student academic year / tier from resume or saved profile
        detected_tier = detect_student_year_from_resume(resume.raw_text or "")
        student_tier = getattr(payload, "student_level", None) or saved_year or detected_tier.get("tier_key", "3rd_year")

        raw_questions = generate_skill_assessment_questions(
            resume_skills=resume_skills,
            student_level=student_tier,
            ongoing_subjects=saved_subjects,
            core_interests=saved_interests,
            weak_skills=user_weak_skills,
            question_count=question_count,
            previously_asked=previously_asked,
        )
    else:
        raw_questions = generate_interview_questions(
            role_title=final_role,
            resume_skills=resume_skills,
            resume_raw_text=resume.raw_text,
            jd_required_skills=jd_req_skills,
            jd_preferred_skills=jd_pref_skills,
            skill_gaps=skill_gaps,
            evidenced_skills=evidenced_skills,
            question_count=question_count,
            question_types=question_types,
            difficulty=payload.difficulty,
            target_focus=target_focus,
            previously_asked=previously_asked,
        )

    types_list = [
        qt.value if hasattr(qt, "value") else str(qt)
        for qt in (question_types or [QuestionType.TECHNICAL, QuestionType.BEHAVIORAL, QuestionType.SITUATIONAL])
    ]

    # 5. Persist session
    session = InterviewSession(
        user_id=current_user.id,
        resume_id=resume.id,
        job_analysis_id=payload.job_analysis_id,
        role_title=final_role,
        job_description=job_desc,
        status=SessionStatus.CREATED,
        question_count=len(raw_questions),
        difficulty=payload.difficulty,
        question_types=types_list,
        interview_mode=getattr(payload, "interview_mode", "text") or "text",
        is_adaptive=getattr(payload, "is_adaptive", True),
        practice_mode=practice_mode,
        target_focus=target_focus,
        overall_score=None,
    )
    db.add(session)
    db.flush()  # Generate session.id

    # 5. Persist questions with private rubric
    for q_data in raw_questions:
        q_obj = Question(
            session_id=session.id,
            question_text=q_data["question_text"],
            type=q_data["type"],
            difficulty=q_data["difficulty"],
            order_index=q_data["order_index"],
            target_skill=q_data.get("target_skill"),
            rubric_criteria=q_data.get("rubric_criteria"),
            adaptation_reason="Derives from baseline interview setup.",
        )
        db.add(q_obj)

    db.commit()
    db.refresh(session)

    return _build_session_detail(session)


@router.get("", response_model=List[InterviewSessionListItem])
def list_interview_sessions(
    limit: Optional[int] = None,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Lists interview sessions created by the authenticated user with optional pagination.
    Protects memory by loading sessions cleanly and allowing scalable historical access.
    """
    # Safe fallback if called directly as a function with Query objects
    actual_limit = limit.default if hasattr(limit, "default") else limit
    actual_offset = offset.default if hasattr(offset, "default") else (offset or 0)

    query = (
        db.query(InterviewSession)
        .options(selectinload(InterviewSession.questions).selectinload(Question.answers))
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
    )
    if actual_limit is not None and isinstance(actual_limit, int):
        query = query.offset(actual_offset).limit(actual_limit)
    elif actual_offset > 0:
        query = query.offset(actual_offset)

    sessions = query.all()

    results = []
    for s in sessions:
        answered_count = sum(len(q.answers) for q in s.questions)
        results.append(
            InterviewSessionListItem(
                id=s.id,
                resume_id=s.resume_id,
                job_analysis_id=s.job_analysis_id,
                role_title=s.role_title,
                status=s.status,
                question_count=s.question_count,
                answered_count=answered_count,
                overall_score=s.overall_score,
                communication_score=s.communication_score,
                interview_mode=getattr(s, "interview_mode", "text") or "text",
                is_adaptive=getattr(s, "is_adaptive", True),
                practice_mode=getattr(s, "practice_mode", "mock_interview") or "mock_interview",
                target_focus=getattr(s, "target_focus", None),
                created_at=s.created_at,
                completed_at=s.completed_at,
            )
        )
    return results


@router.get("/{session_id}", response_model=InterviewSessionDetail)
def get_interview_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Retrieves an owned interview session, its questions, and submitted answers."""
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found or does not belong to the authenticated candidate",
        )
    return _build_session_detail(session)


@router.post("/{session_id}/start", response_model=InterviewSessionDetail)
def start_interview_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Starts an interview session, transitioning status from CREATED to IN_PROGRESS.
    Rejects invalid state transitions.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    if session.status in (SessionStatus.COMPLETED, SessionStatus.ABANDONED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start an interview that is already {session.status.value}",
        )

    if session.status == SessionStatus.CREATED:
        session.status = SessionStatus.IN_PROGRESS
        db.commit()
        db.refresh(session)

    return _build_session_detail(session)


@router.post("/{session_id}/answers", response_model=AnswerEvaluationOut)
def submit_answer(
    session_id: UUID,
    payload: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Submits and evaluates an answer for a specific question within the owned session.
    - Validates session ownership.
    - Ensures question belongs strictly to the target session.
    - Saves answer reliably before evaluation so data is never lost.
    - Idempotently updates existing answer on retry without creating duplicates.
    - Computes speech analytics when duration or audio timing data is provided.
    - Adapts next question difficulty dynamically when is_adaptive is enabled.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    if session.status in (SessionStatus.COMPLETED, SessionStatus.ABANDONED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit answers to an interview that is {session.status.value}",
        )

    # Auto-start if still in created status
    if session.status == SessionStatus.CREATED:
        session.status = SessionStatus.IN_PROGRESS

    # Verify question belongs to this session
    question = db.get(Question, payload.question_id)
    if not question or question.session_id != session.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not belong to this interview session",
        )

    # 1. Reliable persistence: find existing answer or create new
    answer = db.query(Answer).filter(Answer.question_id == question.id).first()
    if not answer:
        answer = Answer(
            question_id=question.id,
            answer_text=payload.answer_text,
            audio_duration_seconds=payload.audio_duration_seconds,
            evaluation_status="pending",
        )
        db.add(answer)
    else:
        answer.answer_text = payload.answer_text
        answer.audio_duration_seconds = payload.audio_duration_seconds
        answer.evaluation_status = "pending"

    db.commit()
    db.refresh(answer)

    # 2. Evaluate answer (supports MCQ instant verification as well as open-ended evaluation)
    is_mcq = False
    mcq_meta = {}
    if question.rubric_criteria:
        try:
            meta = json.loads(question.rubric_criteria)
            if isinstance(meta, dict) and meta.get("format") == "mcq":
                is_mcq = True
                mcq_meta = meta
        except Exception:
            pass

    if is_mcq:
        correct_opt = mcq_meta.get("correct_answer", "").strip().upper()
        explanation = mcq_meta.get("explanation", "")
        raw_ans = payload.answer_text.strip().upper()
        # Accept "A", "OPTION A", "A) ...", or text containing the option letter
        is_correct = (
            raw_ans == correct_opt
            or raw_ans.startswith(f"{correct_opt})")
            or raw_ans.startswith(f"OPTION {correct_opt}")
            or f"({correct_opt})" in raw_ans
        )
        score = 100.0 if is_correct else 40.0
        feedback = (
            f"Spot on! Correct answer is ({correct_opt}). {explanation}"
            if is_correct
            else f"Good effort! The correct answer is ({correct_opt}). {explanation} Don't worry—reviewing this will help lock it into your memory."
        )
        answer.content_score = score
        answer.communication_score = 90.0
        answer.feedback_text = feedback
        answer.evaluation_status = "completed"
        answer.evaluated_at = datetime.now(timezone.utc)
        answer.evaluation_details = {
            "strengths": ["Quick and decisive conceptual identification."] if is_correct else [],
            "missing_elements": [f"Review {question.target_skill or 'topic'} core fundamentals."] if not is_correct else [],
            "suggestions": [explanation] if not is_correct else ["Ready for more advanced concepts!"],
        }
    else:
        try:
            eval_result = evaluate_answer(
                question_text=question.question_text,
                question_type=question.type,
                difficulty=question.difficulty,
                answer_text=payload.answer_text,
                rubric_criteria=question.rubric_criteria,
                target_skill=question.target_skill,
                role_title=session.role_title,
                duration_seconds=payload.audio_duration_seconds,
                pause_data=payload.pause_data,
            )

            answer.content_score = eval_result.get("content_score")
            answer.communication_score = eval_result.get("communication_score")
            answer.filler_word_count = eval_result.get("filler_word_count")
            answer.star_component_scores = eval_result.get("star_component_scores")
            answer.speech_analytics = eval_result.get("speech_analytics")
            answer.feedback_text = eval_result.get("feedback_text")
            answer.evaluation_details = eval_result.get("evaluation_details")
            answer.evaluation_status = "completed"
            answer.evaluated_at = datetime.now(timezone.utc)
        except Exception as exc:
            logger.error("Error evaluating answer: %s", exc)
            answer.evaluation_status = "failed"
            answer.feedback_text = "Evaluation failed due to an unexpected error. Your answer has been saved and can be re-evaluated."

    db.commit()
    db.refresh(answer)

    # 3. Dynamic Adaptive Difficulty for Next Question
    if getattr(session, "is_adaptive", True) and answer.evaluation_status == "completed":
        try:
            # Find next unanswered question
            all_questions = sorted(session.questions, key=lambda q: q.order_index)
            answered_q_ids = {
                ans.question_id for ans in db.query(Answer.question_id)
                .filter(Answer.question_id.in_([q.id for q in all_questions]))
                .all()
            }
            upcoming_questions = [
                q for q in all_questions
                if q.id not in answered_q_ids and q.order_index > question.order_index
            ]

            if upcoming_questions:
                next_q = upcoming_questions[0]
                completed_answers = (
                    db.query(Answer)
                    .join(Question)
                    .filter(Question.session_id == session.id, Answer.evaluation_status == "completed")
                    .all()
                )
                adapt_upcoming_question(next_q, completed_answers, role_title=session.role_title)
                db.add(next_q)
                db.commit()
        except Exception as adapt_err:
            logger.warning("Error adapting next question difficulty: %s", adapt_err)

    return AnswerEvaluationOut.model_validate(answer)


@router.post("/{session_id}/transcribe", response_model=AudioTranscribeResponse)
def transcribe_interview_audio(
    session_id: UUID,
    file: UploadFile = File(...),
    duration_seconds: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Transcribes uploaded audio for a voice interview session.
    - Validates session ownership.
    - Validates file format, MIME type, and size bounds (max 10MB).
    - Audio bytes are processed in memory and never permanently stored.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    try:
        audio_bytes = file.file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read audio stream: {exc}",
        )

    is_valid, error_msg = validate_audio_upload(
        file_bytes=audio_bytes,
        filename=file.filename,
        content_type=file.content_type,
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )

    transcriber = get_speech_transcriber()
    try:
        res = transcriber.transcribe(
            audio_bytes=audio_bytes,
            mime_type=file.content_type or "audio/webm",
            filename=file.filename,
        )
        return AudioTranscribeResponse(
            status=res.get("status", "completed"),
            transcript=res.get("transcript", ""),
            provider=res.get("provider", "local_fallback"),
            duration_seconds=duration_seconds,
            message=res.get("message"),
        )
    except Exception as exc:
        logger.error("Transcription execution error: %s", exc)
        return AudioTranscribeResponse(
            status="failed",
            transcript="",
            provider="error",
            duration_seconds=duration_seconds,
            message=f"Transcription failed: {str(exc)}",
        )


@router.post("/{session_id}/complete", response_model=InterviewSessionDetail)
def complete_interview_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Marks an interview session as completed.
    Computes aggregated content and overall scores from valid evaluations.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    # Aggregate scores from valid evaluations
    valid_content_scores = []
    valid_comm_scores = []
    for q in session.questions:
        for ans in q.answers:
            if ans.evaluation_status == "completed":
                if ans.content_score is not None:
                    valid_content_scores.append(ans.content_score)
                if ans.communication_score is not None:
                    valid_comm_scores.append(ans.communication_score)

    avg_content = round(sum(valid_content_scores) / len(valid_content_scores), 1) if valid_content_scores else None
    avg_comm = round(sum(valid_comm_scores) / len(valid_comm_scores), 1) if valid_comm_scores else None

    if avg_content is not None and avg_comm is not None:
        session.overall_score = round(0.75 * avg_content + 0.25 * avg_comm, 1)
        session.communication_score = avg_comm
    elif avg_content is not None:
        session.overall_score = avg_content
        session.communication_score = avg_comm

    session.status = SessionStatus.COMPLETED
    session.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)

    return _build_session_detail(session)


@router.get("/{session_id}/report", response_model=InterviewReport)
def get_interview_report(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Generates and returns the comprehensive interview report for an owned session.
    Can be retrieved at any time to inspect performance, STAR breakdowns, speech analytics, and feedback.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    report_data = generate_interview_report(session)
    return InterviewReport.model_validate(report_data)


@router.get("/{session_id}/report/pdf")
def download_interview_report_pdf(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Exports and downloads a formatted, vector PDF evaluation report for an owned session.
    - Validates ownership (returns 404 if not found or owned by another user).
    - Generates PDF entirely in memory without writing files to disk.
    - Excludes internal evaluation rubrics and secrets.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    report_data = generate_interview_report(session)
    pdf_bytes = generate_pdf_report(report_data)

    safe_role = "".join(c for c in (session.role_title or "interview") if c.isalnum() or c in ("-", "_")).lower()
    filename = f"prepverse_report_{safe_role}_{str(session.id)[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "application/pdf",
        },
    )


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """Safely deletes an owned interview session and all cascade-associated questions and answers."""
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    db.delete(session)
    db.commit()
    return None


@router.post(
    "/{session_id}/questions/{question_id}/coach",
    response_model=CoachingFeedbackResponse,
    status_code=status.HTTP_200_OK,
)
def get_coaching_feedback(
    session_id: UUID,
    question_id: UUID,
    payload: Optional[CoachFeedbackRequest] = None,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db),
):
    """
    Provides constructive AI coaching, strengths, weaknesses, exemplar answers,
    and contextual follow-up questions for an evaluated answer.
    Guaranteed: strictly non-destructive; never modifies original answers or scores.
    """
    session = db.get(InterviewSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )

    question = db.get(Question, question_id)
    if not question or question.session_id != session.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found in this interview session",
        )

    answer = db.query(Answer).filter(Answer.question_id == question.id).first()
    if not answer or not answer.answer_text or answer.evaluation_status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question has not been answered and evaluated yet. Submit an answer first.",
        )

    user_note = payload.user_focus_note if payload else None

    # Generate coaching feedback without mutating answer
    coaching = generate_coaching_feedback(
        question_id=question.id,
        session_id=session.id,
        question_text=question.question_text,
        question_type=question.type,
        difficulty=question.difficulty,
        target_skill=question.target_skill,
        rubric_criteria=question.rubric_criteria,
        answer_text=answer.answer_text,
        content_score=answer.content_score,
        communication_score=answer.communication_score,
        star_component_scores=answer.star_component_scores,
        evaluation_details=answer.evaluation_details,
        user_focus_note=user_note,
    )

    return CoachingFeedbackResponse(**coaching)
