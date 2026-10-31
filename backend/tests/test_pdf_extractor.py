import pymupdf
import pytest
from app.services.pdf_extractor import (
    extract_text_from_pdf_bytes,
    validate_pdf_bytes,
    normalize_extracted_text,
    PDFFileTooLargeError,
    PDFInvalidSignatureError,
    PDFEmptyError,
    PDFEncryptedError,
)
from app.core.config import settings


def create_in_memory_pdf(text: str = "", encrypted: bool = False) -> bytes:
    """Helper to generate in-memory PDF byte streams for testing."""
    doc = pymupdf.open()
    page = doc.new_page()
    if text:
        page.insert_text((50, 72), text)

    if encrypted:
        # Encrypt with owner/user password
        perm = int(
            pymupdf.PDF_PERM_ACCESSIBILITY
            | pymupdf.PDF_PERM_PRINT
            | pymupdf.PDF_PERM_COPY
            | pymupdf.PDF_PERM_ANNOTATE
        )
        pdf_bytes = doc.tobytes(
            deflate=True,
            encryption=pymupdf.PDF_ENCRYPT_AES_256,
            owner_pw="secret_owner",
            user_pw="secret_user",
            permissions=perm,
        )
    else:
        pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_valid_pdf_text_extraction():
    """Verify extraction of valid textual PDF."""
    content = (
        "Alice Smith\n"
        "Senior Software Engineer\n"
        "Skills: Python, FastAPI, PostgreSQL, Docker, AWS, React\n"
        "Education: Bachelor of Science in Computer Science, 2021\n"
        "Experience: Built scalable cloud APIs at TechWorks."
    )
    pdf_bytes = create_in_memory_pdf(content)

    result = extract_text_from_pdf_bytes(pdf_bytes, "alice_resume.pdf")

    assert result["parsing_status"] == "completed"
    assert result["error_message"] is None
    assert result["page_count"] == 1
    assert "Alice Smith" in result["raw_text"]
    assert "FastAPI" in result["raw_text"]
    assert result["file_size_bytes"] > 0


def test_invalid_file_signature_rejection():
    """Verify files without %PDF- magic bytes are rejected."""
    fake_pdf = b"This is a text file masquerading as a PDF."
    with pytest.raises(PDFInvalidSignatureError, match="Invalid file signature"):
        validate_pdf_bytes(fake_pdf, "fake.pdf")


def test_invalid_file_extension_rejection():
    """Verify files without .pdf extension are rejected."""
    real_pdf_bytes = create_in_memory_pdf("Valid content")
    with pytest.raises(PDFInvalidSignatureError, match="Unsupported file format"):
        validate_pdf_bytes(real_pdf_bytes, "malicious.exe")


def test_empty_file_rejection():
    """Verify empty 0-byte upload is rejected."""
    with pytest.raises(PDFEmptyError, match="empty"):
        validate_pdf_bytes(b"", "empty.pdf")


def test_oversized_file_rejection(monkeypatch):
    """Verify upload exceeding maximum byte limit is rejected."""
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_BYTES", 500)
    oversized_bytes = create_in_memory_pdf("A" * 1000)

    with pytest.raises(PDFFileTooLargeError, match="exceeds the maximum allowed limit"):
        validate_pdf_bytes(oversized_bytes, "big.pdf")


def test_scanned_image_no_text_detection():
    """Verify that PDFs containing no extractable text are flagged without crashing."""
    # Blank PDF page without text elements
    blank_pdf = create_in_memory_pdf("")

    result = extract_text_from_pdf_bytes(blank_pdf, "scanned_doc.pdf")
    assert result["parsing_status"] == "scanned_image_no_text"
    assert "scanned image or photo" in result["error_message"]
    assert "OCR processing has not been performed" in result["error_message"]


def test_encrypted_pdf_handling():
    """Verify that password-protected/encrypted PDFs are detected and rejected gracefully."""
    encrypted_bytes = create_in_memory_pdf("Confidential text", encrypted=True)

    with pytest.raises(PDFEncryptedError, match="encrypted or password-protected"):
        extract_text_from_pdf_bytes(encrypted_bytes, "locked.pdf")


def test_text_normalization():
    """Verify that ligatures, bullets, and excessive spaces are normalized cleanly."""
    raw = "Software  Engineer\xa0\xa0\n• Built  high-performance   APIs\n\n\n\n• Scaled PostgreSQL"
    normalized = normalize_extracted_text(raw)

    assert "\xa0" not in normalized
    assert "• Built high-performance APIs" in normalized
    assert "\n\n\n" not in normalized

