import re
import json
from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeListItem
from app.services.pdf_extractor import (
    extract_text_from_pdf_bytes,
    PDFExtractionError,
    PDFFileTooLargeError,
    PDFInvalidSignatureError,
    PDFEncryptedError,
    PDFEmptyError,
)
from app.services.resume_parser import parse_resume_content

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process a PDF resume",
)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeResponse:
    """
    Accepts a candidate's PDF resume upload.
    Validates file signature and size in memory, extracts normalized text,
    and structures skills, education, and experience.
    Ownership is strictly bound to the authenticated user.
    """
    filename = file.filename or "uploaded_resume.pdf"

    # Read uploaded bytes into memory (never saved to public directories)
    try:
        content = file.file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(exc)}",
        )

    # Validate and extract text
    try:
        extracted = extract_text_from_pdf_bytes(content, filename=filename)
    except PDFFileTooLargeError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(exc),
        )
    except (PDFInvalidSignatureError, PDFEmptyError, PDFEncryptedError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except PDFExtractionError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    # Parse structured sections and skills from normalized text
    structured_data = parse_resume_content(extracted["raw_text"])
    parsed_skills_data = structured_data.get("skills", {})

    # Create and persist the user-owned Resume record
    resume = Resume(
        user_id=current_user.id,
        filename=filename,
        file_size_bytes=extracted["file_size_bytes"],
        parsing_status=extracted["parsing_status"],
        error_message=extracted["error_message"],
        parsed_skills=parsed_skills_data,
        structured_data=structured_data,
        raw_text=extracted["raw_text"],
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return ResumeResponse.model_validate(resume)


@router.get(
    "",
    response_model=List[ResumeListItem],
    status_code=status.HTTP_200_OK,
    summary="List authenticated user's uploaded resumes",
)
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[ResumeListItem]:
    """
    Returns all resumes owned by the authenticated candidate.
    Data is strictly isolated to current_user.id.
    """
    resumes = db.scalars(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.uploaded_at.desc())
    ).all()

    items = []
    for r in resumes:
        ps = r.parsed_skills
        if isinstance(ps, str):
            try:
                ps = json.loads(ps)
            except Exception:
                ps = {}

        if isinstance(ps, dict):
            skills_list = ps.get('all_skills', []) or []
        elif isinstance(ps, list):
            skills_list = ps
        else:
            skills_list = []

        total_skills = len(skills_list)

        # Dynamic calculation of ATS score if missing from older records
        sd = r.structured_data
        if isinstance(sd, str):
            try:
                sd = json.loads(sd)
            except Exception:
                sd = {}

        ats_score = None
        ats_potential = None
        if isinstance(sd, dict):
            ats_analysis = sd.get("ats_analysis")
            if not ats_analysis and r.raw_text:
                try:
                    from app.services.resume_parser import calculate_ats_metrics, segment_resume_sections
                    sections = segment_resume_sections(r.raw_text)
                    ats_analysis = calculate_ats_metrics(r.raw_text, sections, ps if isinstance(ps, dict) else {})
                    sd["ats_analysis"] = ats_analysis
                    r.structured_data = sd
                    db.add(r)
                    db.commit()
                except Exception:
                    pass

            if ats_analysis and isinstance(ats_analysis, dict):
                ats_score = ats_analysis.get("ats_score")
                ats_potential = ats_analysis.get("potential_score")

        items.append(
            ResumeListItem(
                id=r.id,
                filename=r.filename,
                file_size_bytes=r.file_size_bytes,
                parsing_status=r.parsing_status,
                error_message=r.error_message,
                total_skills=total_skills,
                skills=skills_list[:8],
                ats_score=ats_score,
                ats_potential=ats_potential,
                uploaded_at=r.uploaded_at,
            )
        )

    return items


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve details of an owned resume",
)
def get_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ResumeResponse:
    """
    Retrieves a single resume owned by the authenticated user.
    Enforces multi-user isolation: attempts to access another user's resume yield 404.
    """
    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied",
        )

    # Dynamic backwards-compatibility check for ATS analysis
    sd = resume.structured_data
    if isinstance(sd, str):
        try:
            sd = json.loads(sd)
            resume.structured_data = sd
        except Exception:
            sd = {}

    if isinstance(sd, dict) and "ats_analysis" not in sd and resume.raw_text:
        try:
            from app.services.resume_parser import calculate_ats_metrics, segment_resume_sections
            sections = segment_resume_sections(resume.raw_text)
            ps = resume.parsed_skills if isinstance(resume.parsed_skills, dict) else {}
            sd["ats_analysis"] = calculate_ats_metrics(resume.raw_text, sections, ps)
            resume.structured_data = sd
            db.add(resume)
            db.commit()
            db.refresh(resume)
        except Exception:
            pass

    return ResumeResponse.model_validate(resume)


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an owned resume",
)
def delete_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Deletes an owned resume.
    Historical interview sessions preserve their records with resume_id set to NULL.
    """
    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied",
        )

    db.delete(resume)
    db.commit()
    return None

@router.get(
    "/{resume_id}/report/pdf",
    response_class=Response,
    status_code=status.HTTP_200_OK,
    summary="Download comprehensive ATS & Resume Analysis PDF Report",
)
def download_resume_ats_pdf(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates and returns an ATS & Resume Diagnostic Audit PDF report
    for an owned resume, strictly isolated to current_user.
    """
    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or access denied",
        )

    sd = resume.structured_data
    if isinstance(sd, str):
        try:
            sd = json.loads(sd)
        except Exception:
            sd = {}

    if not isinstance(sd, dict):
        sd = {}

    ps = resume.parsed_skills
    if isinstance(ps, str):
        try:
            ps = json.loads(ps)
        except Exception:
            ps = {}

    if not isinstance(ps, dict):
        ps = {}

    from app.services.resume_parser import calculate_ats_metrics, segment_resume_sections
    sections = segment_resume_sections(resume.raw_text or "")
    ats_analysis = calculate_ats_metrics(resume.raw_text or "", sections, ps)
    sd["ats_analysis"] = ats_analysis
    resume.structured_data = sd
    db.add(resume)
    db.commit()

    report_payload = {
        "filename": resume.filename,
        "uploaded_at": resume.uploaded_at.isoformat() if resume.uploaded_at else "",
        "user_email": current_user.email,
        "user_name": getattr(current_user, "name", None) or getattr(current_user, "full_name", None) or "Candidate",
        "raw_text": resume.raw_text or "",
        "skills": ps,
        "sections": sections,
        "ats_analysis": ats_analysis,
        "education": sd.get("education", []),
        "experience": sd.get("experience", []),
        "projects": sd.get("projects", []),
        "certifications": sd.get("certifications", []),
    }

    from app.services.pdf_generator import generate_ats_pdf_report
    try:
        pdf_bytes = generate_ats_pdf_report(report_payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ATS PDF report: {str(exc)}",
        )

    clean_name = re.sub(r'[^a-zA-Z0-9_\-.]', '_', resume.filename or 'resume')
    if clean_name.lower().endswith(".pdf"):
        clean_name = clean_name[:-4]
    download_filename = f"prepverse_ats_report_{clean_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"',
            "Cache-Control": "no-cache",
        },
    )

