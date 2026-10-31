import os
import logging
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

# Allowed audio formats and magic signatures
ALLOWED_AUDIO_EXTENSIONS = [".webm", ".wav", ".mp3", ".ogg", ".m4a"]
ALLOWED_MIME_TYPES = [
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
]
MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024  # 10 Megabytes


def validate_audio_upload(
    file_bytes: bytes,
    filename: Optional[str],
    content_type: Optional[str],
    max_size: int = MAX_AUDIO_SIZE_BYTES,
) -> Tuple[bool, Optional[str]]:
    """
    Validates uploaded audio payload:
    - Empty file check.
    - Size bound check (max 10MB default).
    - Extension check.
    - MIME type check.
    """
    if not file_bytes or len(file_bytes) == 0:
        return False, "Audio file is empty (0 bytes)."

    if len(file_bytes) > max_size:
        return False, f"Audio file exceeds maximum permitted size of {max_size // (1024 * 1024)} MB."

    clean_filename = (filename or "").lower()
    has_valid_ext = any(clean_filename.endswith(ext) for ext in ALLOWED_AUDIO_EXTENSIONS)
    has_valid_mime = bool(content_type and any(content_type.lower().startswith(m) for m in ALLOWED_MIME_TYPES))

    if not has_valid_ext and not has_valid_mime:
        return False, (
            f"Unsupported audio format. Supported formats include: {', '.join(ALLOWED_AUDIO_EXTENSIONS)} "
            f"(received filename: '{filename}', mime-type: '{content_type}')."
        )

    # Basic signature sanity check (avoiding completely corrupted headers)
    # webm/mkv: 1A 45 DF A3
    # wav: RIFF
    # mp3: ID3 or FF FB/FA
    # ogg: OggS
    # m4a: ftyp
    header = file_bytes[:12]
    is_plausible = (
        header.startswith(b"\x1a\x45\xdf\xa3")  # WebM
        or header.startswith(b"RIFF")            # WAV
        or header.startswith(b"ID3")             # MP3 ID3
        or header.startswith(b"OggS")            # Ogg
        or b"ftyp" in header                     # M4A/MP4
        or header.startswith(b"\xff\xfb")        # MP3 sync
        or header.startswith(b"\xff\xf3")
    )

    if not is_plausible and len(file_bytes) < 64:
        return False, "Audio file appears corrupted or invalid header signature."

    return True, None


class BaseSpeechTranscriber:
    """Interface for server-side audio transcription engines."""

    def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError


class LocalFallbackTranscriber(BaseSpeechTranscriber):
    """
    Local fallback transcription handler.
    Does NOT invent fake transcriptions; clearly informs user if server-side
    transcription provider is unconfigured, allowing in-browser Web Speech or text fallback.
    """

    def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "status": "unsupported",
            "transcript": "",
            "provider": "local_fallback",
            "message": (
                "Server-side transcription model is not configured with external credentials. "
                "Please use browser speech-to-text dictation or manual text entry."
            ),
        }


class GeminiSpeechTranscriber(BaseSpeechTranscriber):
    """
    Google Gemini multimodal audio transcription provider.
    Active only when GEMINI_API_KEY is configured.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str,
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            # Standardize mime-type for Gemini
            clean_mime = mime_type if mime_type in ("audio/wav", "audio/mp3", "audio/ogg", "audio/webm") else "audio/webm"

            audio_part = {
                "mime_type": clean_mime,
                "data": audio_bytes,
            }
            prompt = (
                "Transcribe the following interview answer audio accurately. "
                "Do not add conversational commentary or pleasantries. "
                "Return ONLY the verbatim spoken transcript text."
            )

            response = model.generate_content([prompt, audio_part])
            text = response.text.strip() if response and response.text else ""

            return {
                "status": "completed",
                "transcript": text,
                "provider": "gemini",
                "message": None,
            }
        except Exception as exc:
            logger.warning("Gemini audio transcription failed: %s", exc)
            return {
                "status": "failed",
                "transcript": "",
                "provider": "gemini",
                "message": f"Transcription provider error: {str(exc)}",
            }


def get_speech_transcriber() -> BaseSpeechTranscriber:
    """Factory for selecting the active speech transcriber."""
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiSpeechTranscriber(api_key=settings.GEMINI_API_KEY)
    return LocalFallbackTranscriber()

