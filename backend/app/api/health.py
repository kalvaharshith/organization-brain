from fastapi import APIRouter, HTTPException

from app.config import settings
from app.services.hindsight_client import HindsightClient

router = APIRouter()


@router.get("/health")
async def health():
    try:
        stats = await HindsightClient().get_bank_stats(settings.HINDSIGHT_BANK_ID)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Hindsight is unavailable") from exc
    return {
        "status": "ok",
        "hindsight": True,
        "bank_stats": stats,
        "groq_configured": bool(settings.GROQ_API_KEY),
        "groq_model": settings.GROQ_MODEL,
    }