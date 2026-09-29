import logging
import re
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.memory_learning import MemoryLearningService
from app.services.canonical_org import get_organization_store

router = APIRouter()
logger = logging.getLogger(__name__)
learning = MemoryLearningService()
organization = get_organization_store()


class CompareRequest(BaseModel):
    case_context: str = Field(min_length=20, max_length=4000)
    scope: Literal["demo", "all"] = "demo"


class OutcomeRequest(BaseModel):
    scenario_id: str | None = Field(None, min_length=3, max_length=100)
    project_id: str | None = Field(None, min_length=3, max_length=100)
    version: int = Field(default=1, ge=1)
    case_title: str = Field(min_length=5, max_length=160)
    case_context: str = Field(min_length=25, max_length=2500)
    initial_recommendation: str = Field(min_length=12, max_length=1500)
    action_taken: str = Field(min_length=12, max_length=1500)
    outcome_status: Literal["success", "failure", "partial"]
    outcome_detail: str = Field(min_length=25, max_length=2500)
    lesson: str = Field(min_length=15, max_length=1500)
    user_preference: str | None = Field(None, max_length=1000)
    constraints: list[str] = Field(default_factory=list, max_length=20)
    reliability: Literal["low", "medium", "high"] = "medium"
    source_reference: str | None = Field(None, max_length=300)
    synthetic_demo: bool = True


def _has_substance(value: str, minimum_words: int) -> bool:
    words = re.findall(r"[A-Za-z0-9]+", value)
    return len(words) >= minimum_words and len(set(word.lower() for word in words)) >= 3


@router.get("/memory/overview")
async def memory_overview(scope: Literal["demo", "all"] = "demo"):
    try:
        return await learning.overview(scope)
    except Exception as exc:
        logger.exception("Hindsight memory overview failed")
        raise HTTPException(status_code=503, detail="Hindsight memory data is unavailable") from exc


@router.post("/memory/compare")
async def compare_reasoning(request: CompareRequest):
    try:
        return await learning.compare(request.case_context.strip(), request.scope)
    except Exception as exc:
        logger.exception("Memory comparison failed")
        raise HTTPException(status_code=502, detail="Could not compare reasoning") from exc


@router.post("/memory/outcomes")
async def record_outcome(request: OutcomeRequest):
    if not request.synthetic_demo and not (request.source_reference or "").strip():
        raise HTTPException(
            422,
            "A source reference is required for information marked as non-synthetic",
        )
    if not _has_substance(request.case_context, 5):
        raise HTTPException(422, "Case context needs at least five meaningful words")
    if not _has_substance(request.action_taken, 3):
        raise HTTPException(422, "Action taken needs a specific description")
    if not _has_substance(request.outcome_detail, 5):
        raise HTTPException(422, "Outcome detail needs a specific result")
    if not _has_substance(request.lesson, 4):
        raise HTTPException(422, "Lesson needs a reusable, specific takeaway")
    if request.user_preference and not _has_substance(request.user_preference, 4):
        raise HTTPException(422, "Preference should describe a durable, explicit preference")

    record = request.model_dump()
    if request.project_id:
        project = next(
            (item for item in organization.list_projects() if item["id"] == request.project_id),
            None,
        )
        if project is None:
            raise HTTPException(422, "Project ID is not present in the canonical organization")
        department = next(
            (item for item in organization.get_overview()["departments"] if item["id"] == project["department_id"]),
            None,
        )
        record.update({
            "project_name": project["name"],
            "owner_id": project["owner_id"],
            "department": department["name"] if department else "",
        })
    record["title"] = request.case_title.strip()
    record["case_context"] = request.case_context.strip()
    record["initial_recommendation"] = request.initial_recommendation.strip()
    record["action_taken"] = request.action_taken.strip()
    record["outcome_detail"] = request.outcome_detail.strip()
    record["lesson"] = request.lesson.strip()
    record["source_reference"] = (
        request.source_reference.strip() if request.source_reference else
        ("Synthetic demo feedback entered in the application" if request.synthetic_demo
         else "User-submitted outcome feedback")
    )
    record["reliability"] = f"user-assessed {request.reliability}"
    try:
        result = await learning.record_outcome(record, synthetic=request.synthetic_demo)
        return {"status": result["status"], "record": result}
    except Exception as exc:
        logger.exception("Could not retain outcome in Hindsight")
        raise HTTPException(status_code=502, detail="Outcome could not be stored in Hindsight") from exc


@router.post("/memory/demo/seed")
async def seed_synthetic_demo_history():
    try:
        return await learning.seed_demo_history()
    except Exception as exc:
        logger.exception("Could not seed explicitly synthetic demo memories")
        raise HTTPException(status_code=502, detail="Synthetic demo history could not be added") from exc


@router.get("/memory/evaluate")
async def evaluate_memory_retrieval(scope: Literal["demo", "all"] = "demo"):
    try:
        return await learning.evaluate(scope)
    except Exception as exc:
        logger.exception("Hindsight retrieval evaluation failed")
        raise HTTPException(status_code=502, detail="Could not evaluate Hindsight retrieval") from exc