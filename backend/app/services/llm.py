import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)

FALLBACK_ANSWER = (
    "I couldn't find sufficient information in the organization's knowledge base "
    "to answer this confidently."
)


class LLMService:
    """Thin wrapper around the Groq API (OpenAI-compatible SDK)."""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY is not set — add it to backend/.env")
            self._client = Groq(api_key=settings.GROQ_API_KEY)
        return self._client

    def chat(self, system: str, user: str, temperature: float = 0.1,
             max_tokens: int = 900) -> str:
        response = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()


llm = LLMService()