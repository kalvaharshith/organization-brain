from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.hindsight_rag import HindsightRAG

router = APIRouter()
rag = HindsightRAG()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        return await rag.answer_question(request.message)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Chat request failed") from exc