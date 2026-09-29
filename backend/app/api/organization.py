from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.canonical_org import get_organization_store
from app.services.memory_learning import MemoryLearningService

router = APIRouter()
store = get_organization_store()
learning = MemoryLearningService()


class BrainRequest(BaseModel):
    problem: str = Field(..., min_length=10, max_length=4000)


@router.get("/organization/overview")
async def organization_overview():
    return store.get_overview()


@router.get("/organization/projects")
async def organization_projects():
    overview = store.get_overview()
    people_by_id = {person["id"]: person["name"] for person in overview["people"]}
    departments_by_id = {department["id"]: department["name"] for department in overview["departments"]}
    projects = store.list_projects()
    for project in projects:
        project["owner_name"] = people_by_id.get(project["owner_id"], project["owner_id"])
        project["department_name"] = departments_by_id.get(project["department_id"], project["department_id"])
    return {"projects": projects, "count": len(projects), "source": "canonical-organization-db"}


@router.get("/organization/people")
async def organization_people():
    return {"people": store.list_people()}


@router.post("/organization/brain")
async def organization_brain(request: BrainRequest):
    comparison = await learning.compare(request.problem.strip(), scope="all")
    return {
        **comparison,
        "problem_text": request.problem.strip(),
        "canonical_context": [item["summary"] for item in comparison["current_state"]],
        "rag_context": [item["text"] for item in comparison["rag_memories"]],
        "hindsight_context": [item["text"] for item in comparison["hindsight_memories"]],
    }
