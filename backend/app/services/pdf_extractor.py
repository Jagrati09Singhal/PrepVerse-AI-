import io
import re
import unicodedata
from typing import Dict, Any, Tuple
import pymupdf
import pypdf
from app.core.config import settings

# PDF file signature (Magic Bytes)
PDF_MAGIC_BYTES = b"%PDF-"


class PDFExtractionError(Exception):
    """Base exception for PDF validation and extraction failures."""
    pass


class PDFFileTooLargeError(PDFExtractionError):
    pass


class PDFInvalidSignatureError(PDFExtractionError):
    pass


class PDFEncryptedError(PDFExtractionError):
    pass


class PDFEmptyError(PDFExtractionError):
    pass


def validate_pdf_bytes(file_bytes: bytes, filename: str = "upload.pdf") -> None:
    """
    Validates uploaded file size, extension, and magic byte signature.
    Prevents disguised files or oversized payloads.
    """
    if len(file_bytes) == 0:
        raise PDFEmptyError("The uploaded file is empty (0 bytes).")

    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise PDFFileTooLargeError(
            f"File size exceeds the maximum allowed limit of {max_mb:.1f} MB."
        )

    # Validate file extension
    lower_name = filename.lower()
    if not any(lower_name.endswith(ext) for ext in settings.ALLOWED_EXTENSIONS):
        raise PDFInvalidSignatureError(
            "Unsupported file format. Only PDF files (.pdf) are permitted."
        )

    # Validate magic bytes (%PDF-)
    if not file_bytes.startswith(PDF_MAGIC_BYTES):
        raise PDFInvalidSignatureError(
            "Invalid file signature. The file is not a valid PDF document."
        )


def normalize_extracted_text(text: str) -> str:
    """
    Carefully cleans and normalizes extracted PDF text:
    - Normalizes Unicode ligatures (fi, fl), smart quotes, and dashes.
    - Replaces non-breaking spaces with standard whitespace.
    - Replaces tabs with spaces while preserving bullet symbols (•, -, *).
    - Collapses 3+ consecutive newlines to 2 newlines (preserves paragraph boundaries).
    """
    if not text:
        return ""

    # Normalize unicode to NFKC (unfolds ligatures like 'ﬁ' -> 'fi', 'ﬀ' -> 'ff')
    normalized = unicodedata.normalize("NFKC", text)

    # Standardize line breaks
    normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")

    # Replace special whitespace
    normalized = normalized.replace("\xa0", " ").replace("\u200b", "")

    # Standardize bullet characters
    normalized = re.sub(r"[\u2022\u2023\u25E6\u2043\u2219]", "• ", normalized)

    # Collapse multiple inline spaces while keeping indentation reasonable
    lines = []
    for line in normalized.split("\n"):
        clean_line = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(clean_line)

    result = "\n".join(lines)
    # Collapse 3 or more blank lines
    result = re.sub(r"\n{3,}", "\n\n", result).strip()

    return result


def extract_text_from_pdf_bytes(
    file_bytes: bytes,
    filename: str = "document.pdf",
) -> Dict[str, Any]:
    """
    Extracts text and metadata from PDF bytes in memory.
    Handles encrypted, empty, and image-only/scanned documents gracefully.
    Returns:
        {
            "raw_text": str,
            "page_count": int,
            "parsing_status": "completed" | "scanned_image_no_text",
            "error_message": Optional[str],
            "file_size_bytes": int,
        }
    """
    validate_pdf_bytes(file_bytes, filename)

    page_texts = []
    page_count = 0

    try:
        # Primary extraction using PyMuPDF (fitz)
        with pymupdf.open(stream=file_bytes, filetype="pdf") as doc:
            if doc.is_encrypted:
                raise PDFEncryptedError(
                    "The uploaded PDF is encrypted or password-protected. Please upload an unprotected copy."
                )

            page_count = len(doc)
            if page_count == 0:
                raise PDFEmptyError("The PDF document contains no pages.")

            for page_index in range(page_count):
                page = doc[page_index]
                text = page.get_text("text") or ""
                page_texts.append(text)

    except (PDFEncryptedError, PDFEmptyError):
        raise
    except Exception as primary_exc:
        # Fallback extraction using pypdf if PyMuPDF encounters unexpected structure
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            if reader.is_encrypted:
                raise PDFEncryptedError(
                    "The uploaded PDF is encrypted or password-protected. Please upload an unprotected copy."
                )

            page_count = len(reader.pages)
            if page_count == 0:
                raise PDFEmptyError("The PDF document contains no pages.")

            page_texts = []
            for page in reader.pages:
                text = page.extract_text() or ""
                page_texts.append(text)

        except (PDFEncryptedError, PDFEmptyError):
            raise
        except Exception as fallback_exc:
            raise PDFExtractionError(
                f"Failed to read PDF document structure: {str(primary_exc)}"
            )

    combined_text = "\n".join(page_texts)
    normalized = normalize_extracted_text(combined_text)

    # Detect scanned image or non-text PDF
    # If the document has pages but virtually no extractable words
    word_count = len(re.findall(r"\b[A-Za-z0-9_]{2,}\b", normalized))
    if word_count < 6 or len(normalized.strip()) < 25:
        return {
            "raw_text": normalized,
            "page_count": page_count,
            "parsing_status": "scanned_image_no_text",
            "error_message": (
                "No extractable text was found in this document. This PDF appears to be a scanned image or photo. "
                "PrepVerse AI currently requires text-based PDFs; OCR processing has not been performed on this file."
            ),
            "file_size_bytes": len(file_bytes),
        }

    return {
        "raw_text": normalized,
        "page_count": page_count,
        "parsing_status": "completed",
        "error_message": None,
        "file_size_bytes": len(file_bytes),
    }
