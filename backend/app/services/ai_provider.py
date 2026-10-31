import os
import json
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseAIProvider:
    """Abstract interface for AI analysis providers."""

    def refine_job_analysis(
        self,
        job_description_raw: str,
        baseline_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Optionally refines or validates job description analysis.
        Must fall back gracefully to baseline analysis on any failure.
        """
        raise NotImplementedError

    def generate_questions(self, context: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """Optionally generates interview questions using external AI provider."""
        return None

    def evaluate_answer(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Optionally evaluates candidate answer using external AI provider."""
        return None

    def generate_coaching(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Optionally generates coaching feedback using external AI provider."""
        return None


class DeterministicAIProvider(BaseAIProvider):
    """
    Default deterministic provider.
    Requires zero external API keys, has zero network latency, and zero cloud dependency.
    """

    def refine_job_analysis(
        self,
        job_description_raw: str,
        baseline_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        # Deterministic analysis is returned as-is
        baseline_analysis["analysis_engine"] = "deterministic"
        return baseline_analysis

    def generate_questions(self, context: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        # Signals to caller to execute local deterministic generation
        return None

    def evaluate_answer(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Signals to caller to execute local deterministic evaluation
        return None

    def generate_coaching(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Signals to caller to execute local deterministic coaching
        return None


class GeminiAIProvider(BaseAIProvider):
    """
    Optional Google Gemini provider for advanced job description analysis,
    interview question synthesis, evaluation, and coaching.
    Only active when AI_PROVIDER='gemini' and GEMINI_API_KEY is configured.
    Implements bounded retries for transient issues and honest fallback on quota exhaustion.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    def _generate_with_resilience(self, prompt: str) -> Optional[str]:
        """
        Executes Gemini generation with bounded retry for transient errors.
        Handles rate limits (429 / ResourceExhausted) and quota limits honestly,
        falling back cleanly without infinite retry loops or crashing.
        """
        import time
        max_retries = 2
        backoff_seconds = 0.5

        for attempt in range(max_retries + 1):
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                if response and hasattr(response, "text") and response.text:
                    text = response.text.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[1]
                    if text.endswith("```"):
                        text = text.rsplit("\n", 1)[0]
                    return text.strip()
                return None
            except Exception as exc:
                err_str = str(exc).lower()
                is_quota_or_rate = "429" in err_str or "quota" in err_str or "resourceexhausted" in err_str
                is_transient = "503" in err_str or "timeout" in err_str or "connection" in err_str or "unavailable" in err_str

                if is_quota_or_rate:
                    logger.warning(
                        "Gemini API rate limit or quota exceeded (Attempt %d/%d): %s. "
                        "Falling back cleanly to PrepVerse AI deterministic engine.",
                        attempt + 1, max_retries + 1, exc,
                    )
                    # Quota exhaustion should not be hammered with retries
                    return None

                if is_transient and attempt < max_retries:
                    logger.info("Transient Gemini provider error (%s). Retrying in %.1fs...", exc, backoff_seconds)
                    time.sleep(backoff_seconds)
                    backoff_seconds *= 2
                    continue

                logger.warning("Gemini AI provider invocation failed: %s. Using deterministic fallback.", exc)
                return None

        return None

    def refine_job_analysis(
        self,
        job_description_raw: str,
        baseline_analysis: Dict[str, Any],
    ) -> Dict[str, Any]:
        prompt = (
            "You are an expert HR and recruitment analyst. Extract required and preferred technical skills from this job description. "
            "Respond ONLY with a valid JSON object matching this schema: "
            '{"required_skills": ["skill1"], "preferred_skills": ["skill2"]}\n\n'
            f"Job Description:\n{job_description_raw[:4000]}"
        )
        try:
            text_response = self._generate_with_resilience(prompt)
            if text_response:
                data = json.loads(text_response)
                if isinstance(data.get("required_skills"), list) and isinstance(data.get("preferred_skills"), list):
                    merged_req = sorted(list(set(baseline_analysis.get("required_skills", []) + data["required_skills"])))
                    merged_pref = sorted(list(set(baseline_analysis.get("preferred_skills", []) + data["preferred_skills"])))
                    baseline_analysis["required_skills"] = merged_req
                    baseline_analysis["preferred_skills"] = [s for s in merged_pref if s not in merged_req]
                    baseline_analysis["analysis_engine"] = "gemini"
                    return baseline_analysis
        except Exception as exc:
            logger.warning("Gemini AI JD analysis parse failed: %s. Using deterministic fallback.", exc)

        baseline_analysis["analysis_engine"] = "deterministic"
        return baseline_analysis

    def generate_questions(self, context: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        role = context.get("role_title", "Software Engineer")
        count = context.get("question_count", 5)
        types = context.get("question_types", ["technical", "behavioral", "situational"])
        diff = context.get("difficulty", "medium")
        prev_asked = context.get("previously_asked", [])

        prompt = (
            f"You are an expert technical interviewer assessing a candidate for {role}. "
            f"Generate exactly {count} interview questions with difficulty '{diff}' matching these types: {types}. "
            f"{('Avoid repeating these previously presented questions: ' + str(prev_asked)) if prev_asked else ''} "
            "For behavioral questions, require STAR responses. For technical questions, probe demonstrated and gap skills. "
            "Respond ONLY in valid JSON matching this schema:\n"
            '{"questions": [{"question_text": "...", "type": "technical", "difficulty": "medium", "target_skill": "...", "rubric_criteria": "..."}]}'
        )
        try:
            text_response = self._generate_with_resilience(prompt)
            if text_response:
                data = json.loads(text_response)
                questions = data.get("questions")
                if isinstance(questions, list) and len(questions) == count:
                    for idx, q in enumerate(questions):
                        q["order_index"] = idx
                    return questions
        except Exception as exc:
            logger.warning("Gemini AI question generation failed: %s. Using deterministic fallback.", exc)
        return None

    def evaluate_answer(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        q_text = context.get("question_text", "")
        q_type = context.get("question_type", "technical")
        ans_text = context.get("answer_text", "")

        prompt = (
            f"You are an expert interview evaluator. Evaluate this candidate response.\n"
            f"Question ({q_type}): {q_text}\n"
            f"Candidate Answer: {ans_text}\n\n"
            "Respond ONLY in valid JSON with schema:\n"
            '{"content_score": 85.0, "feedback_text": "...", "strengths": ["..."], "missing_elements": ["..."], "suggestions": ["..."]'
            + (', "star_component_scores": {"situation": 85, "task": 80, "action": 90, "result": 85}}' if q_type == "behavioral" else '}')
        )
        try:
            text_response = self._generate_with_resilience(prompt)
            if text_response:
                data = json.loads(text_response)
                if "content_score" in data:
                    return data
        except Exception as exc:
            logger.warning("Gemini AI answer evaluation failed: %s. Using deterministic fallback.", exc)
        return None

    def generate_coaching(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        q_text = context.get("question_text", "")
        q_type = context.get("question_type", "technical")
        ans_text = context.get("answer_text", "")
        target_skill = context.get("target_skill", "General")
        difficulty = context.get("difficulty", "medium")

        prompt = (
            f"You are an elite interview coach providing actionable coaching feedback to a candidate.\n"
            f"Question Type: {q_type}\n"
            f"Difficulty: {difficulty}\n"
            f"Target Skill: {target_skill}\n"
            f"Interview Question: {q_text}\n"
            f"Candidate's Answer: {ans_text}\n\n"
            "Provide actionable, structured coaching feedback. For behavioral questions, enforce the STAR format in the exemplar answer. "
            "For technical questions, prioritize technical correctness, system design reasoning, trade-offs, and concrete examples in the exemplar answer. "
            "Generate a contextual follow-up question that an interviewer would ask next.\n"
            "Respond ONLY with a valid JSON object matching this schema:\n"
            "{\n"
            '  "strengths": ["string"],\n'
            '  "weaknesses": ["string"],\n'
            '  "actionable_improvements": ["string"],\n'
            '  "exemplar_answer": "string",\n'
            '  "contextual_follow_up": "string"\n'
            "}"
        )
        try:
            text_response = self._generate_with_resilience(prompt)
            if text_response:
                data = json.loads(text_response)
                if "exemplar_answer" in data and "actionable_improvements" in data:
                    return data
        except Exception as exc:
            logger.warning("Gemini AI coaching generation failed: %s. Using deterministic fallback.", exc)
        return None


def get_ai_provider() -> BaseAIProvider:
    """Factory that returns the configured AI provider."""
    provider_name = (settings.AI_PROVIDER or "deterministic").lower()

    if provider_name == "gemini" and settings.GEMINI_API_KEY:
        return GeminiAIProvider(api_key=settings.GEMINI_API_KEY)

    return DeterministicAIProvider()

