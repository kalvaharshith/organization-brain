from __future__ import annotations

import asyncio
from collections import Counter
from io import BytesIO
from pathlib import Path

import pytest
from fastapi import UploadFile

from app.api.documents import upload_document
from app.config import settings
from app.api.organization import BrainRequest, organization_brain, organization_projects
from app.services.canonical_org import OrganizationalBrainStore, PROJECTS, TASKS
from app.services.memory_learning import DEMO_COMPANY_TAG, MemoryLearningService
from app.services.organizational_seed import ADDITIONAL_HINDSIGHT_EXPERIENCES, CURRENT_RAG_DOCUMENTS, PROJECT_HISTORIES
from app.services.rag_knowledge import RAGKnowledgeStore


EXPECTED_PROJECTS = {
    "PRJ-ATL": "Atlas Analytics Platform",
    "PRJ-PHX": "Phoenix Data Migration",
    "PRJ-APO": "Nova Customer Portal",
    "PRJ-AUTH": "Orion Authentication Service",
    "PRJ-PAY": "Mercury Payment Platform",
    "PRJ-TIT": "Apollo Notification Service",
    "PRJ-NOV": "Titan API Gateway",
    "PRJ-REC": "Vega ML Recommendation Engine",
    "PRJ-VEG": "Helios Observability Platform",
    "PRJ-LUN": "Luna Mobile Application",
    "PRJ-OPS": "Aurora Reporting Service",
    "PRJ-SEC": "Eclipse Search Platform",
    "PRJ-ECL": "Neptune Workflow Engine",
    "PRJ-REL": "Polaris DevOps Platform",
    "PRJ-DOC": "Comet Document Processing",
    "PRJ-POL": "Zenith Security Platform",
    "PRJ-DATA": "Terra Data Warehouse",
    "PRJ-ML": "Vertex AI Support Assistant",
}


def run(coro):
    return asyncio.run(coro)


def local_service(tmp_path: Path, name: str) -> MemoryLearningService:
    service = MemoryLearningService()
    service.bank_id = f"test-{name}"
    service.hindsight.api_key = ""
    service.organization = OrganizationalBrainStore(tmp_path / f"{name}-org.db")
    service.rag = RAGKnowledgeStore(tmp_path / f"{name}-rag.db")

    async def no_generation(_system: str, _user: str):
        return None, "LLMUnavailable"

    service._generate = no_generation
    return service


def test_exact_projects_have_linked_meaningful_histories_and_tasks(tmp_path):
    store = OrganizationalBrainStore(tmp_path / "org.db")
    overview = store.get_overview()
    projects = {item["id"]: item for item in overview["projects"]}

    assert len(PROJECTS) == 18
    assert len(projects) == 18
    assert {item["id"]: item["name"] for item in overview["projects"]} == EXPECTED_PROJECTS
    assert len(PROJECT_HISTORIES) == 18
    assert overview["project_history_count"] == 18
    assert overview["task_count"] >= 24
    required = {
        "decisions", "attempts", "problem", "root_cause", "failed_approaches",
        "successful_approaches", "reviews", "testing", "deployment", "rollback",
        "outcome", "lessons", "constraints", "related_project_ids",
    }
    for project in projects.values():
        assert project["tasks"]
        assert required.issubset(project["history"])
        assert all(project["history"][field] for field in required - {"related_project_ids"})
        assert set(project["history"]["related_project_ids"]).issubset(projects)
    assert "PRJ-ATL" in projects["PRJ-PHX"]["history"]["related_project_ids"]
    assert "PRJ-PHX" in projects["PRJ-ATL"]["history"]["related_project_ids"]
    assert {task["project_id"] for task in TASKS} == set(projects)
    assert {task["status"].casefold() for task in TASKS} >= {
        "completed", "in progress", "under review", "blocked", "deployed"
    }


def test_current_rag_is_separate_and_retrieves_by_stable_id(tmp_path):
    rag = RAGKnowledgeStore(tmp_path / "rag.db")
    hits = rag.search("Atlas PostgreSQL migration connection saturation latency")

    assert len(CURRENT_RAG_DOCUMENTS) >= 10
    assert rag.count() == len(CURRENT_RAG_DOCUMENTS)
    assert any(item["id"] == "RAG-001" for item in hits)
    assert rag.search("moonshot satellite grocery launch") == []
    assert all(item["data_type"] == "current_reference" for item in hits)


def test_document_upload_persists_in_rag_with_canonical_project_lineage():
    document_id = "RAG-TEST-PHX-UPLOAD"
    rag = RAGKnowledgeStore()
    try:
        result = run(upload_document(
            file=UploadFile(filename="migration-standard.txt", file=BytesIO(
                b"Current migration guidance: measure PostgreSQL connection saturation and use staged batches."
            )),
            title="Upload API migration standard",
            doc_type="engineering_standard",
            tags="reference:current-fact",
            source_reference="test source record",
            document_id=document_id,
            project_id="PRJ-PHX",
        ))
        stored = next(item for item in rag.list_documents() if item["id"] == document_id)
        assert result["status"] == "stored"
        assert stored["project_id"] == "PRJ-PHX"
        assert stored["department"] == "Engineering"
        assert stored["source_reference"] == "test source record"
    finally:
        with rag._connect() as connection:
            connection.execute("DELETE FROM rag_documents WHERE id = ?", (document_id,))


def test_organization_projects_api_returns_live_canonical_records():
    result = run(organization_projects())
    atlas = next(item for item in result["projects"] if item["id"] == "PRJ-ATL")

    assert result["count"] == 18
    assert result["source"] == "canonical-organization-db"
    assert atlas["owner_name"] == "Meera Shah"
    assert atlas["department_name"] == "Engineering"
    assert atlas["history"]["problem"]


def test_organization_brain_api_returns_retrieved_sources_and_lineage(tmp_path, monkeypatch):
    import app.api.organization as organization_api

    service = local_service(tmp_path, "brain-api")
    service.hindsight._offline_store_knowledge(
        service.bank_id,
        "Phoenix migration workers saturated PostgreSQL connections; smaller batches and pool limits reduced waits.",
        {
            "title": "Phoenix migration retrospective", "document_id": "learning-api-phoenix",
            "tags": ["learning:outcome", "outcome:success", "project:PRJ-PHX"],
            "data_type": "historical_experience",
        },
    )
    monkeypatch.setattr(organization_api, "learning", service)

    result = run(organization_brain(BrainRequest(
        problem="Atlas PostgreSQL migration connection saturation and latency during write batches"
    )))

    assert result["current_state"]
    assert any(item["id"] == "RAG-001" for item in result["rag_memories"])
    assert any("project:PRJ-PHX" in item["tags"] for item in result["hindsight_memories"])
    assert result["lineage"]["canonical_source_ids"]
    assert result["lineage"]["rag_source_ids"]
    assert result["lineage"]["hindsight_source_ids"]


def test_hindsight_seed_has_specific_mixed_outcomes_and_stable_projects(tmp_path):
    service = local_service(tmp_path, "seed-counts")
    result = run(service.seed_demo_history())
    records = [
        item for item in service.hindsight._bank_store(service.bank_id)
        if DEMO_COMPANY_TAG in item["tags"] and "learning:outcome" in item["tags"]
    ]
    statuses = Counter(
        tag.removeprefix("outcome:")
        for item in records for tag in item["tags"] if tag.startswith("outcome:")
    )
    decision_count = sum("experience:decision" in item["tags"] for item in records)
    project_ids = {
        tag.removeprefix("project:")
        for item in records for tag in item["tags"] if tag.startswith("project:")
    }

    assert len(ADDITIONAL_HINDSIGHT_EXPERIENCES) + 16 >= 20
    assert len(records) >= 20
    assert statuses["failure"] >= 5
    assert statuses["success"] >= 5
    assert decision_count >= 5
    assert {"PRJ-PHX", "PRJ-ATL"}.issubset(project_ids)
    assert result["created"] + result["updated"] + result["skipped_existing"] >= 20
    assert all(len(item["text"]) > 300 for item in records)


def test_unrelated_problem_returns_no_invented_history_or_recommendation(tmp_path):
    service = local_service(tmp_path, "unrelated")
    result = run(service.compare(
        "A moonshot satellite grocery launch needs orbital produce routing.", scope="all"
    ))

    assert result["hindsight_memories"] == []
    assert result["rag_memories"] == []
    assert "No verified organizational experience" in result["hindsight_message"]
    assert "No relevant current organizational documentation" in result["rag_message"]
    assert result["recommendation"].startswith("No evidence-grounded recommendation")
    assert result["lineage"]["recommendation_evidence_ids"] == []


def test_missing_rag_is_reported_when_hindsight_exists(tmp_path):
    service = local_service(tmp_path, "missing-rag")
    service.rag = RAGKnowledgeStore(tmp_path / "empty-rag.db")
    with service.rag._connect() as connection:
        connection.execute("DELETE FROM rag_documents")
    service.hindsight._offline_store_knowledge(
        service.bank_id,
        "A prior queue incident found that bounded retry attempts protected delivery stability.",
        {
            "title": "Queue retry retrospective", "document_id": "learning-queue-01",
            "tags": ["learning:outcome", "outcome:success", "project:PRJ-TIT"],
            "data_type": "historical_experience",
        },
    )

    result = run(service.compare("Queue retry delivery stability and bounded attempts", scope="all"))
    assert result["rag_memories"] == []
    assert result["hindsight_memories"]
    assert result["rag_message"] == "No relevant current organizational documentation was found."


def test_conflicting_history_does_not_replace_current_rag_or_canonical_state(tmp_path):
    service = local_service(tmp_path, "conflict")
    service.rag.store_document(
        "Current policy requires short-lived access tokens and revocable refresh-token rotation.",
        {"document_id": "RAG-AUTH-CURRENT", "title": "Current authentication standard", "project_id": "PRJ-AUTH"},
    )
    service.hindsight._offline_store_knowledge(
        service.bank_id,
        "An older failed experiment extended access-token lifetime and was rejected because revocation was too slow.",
        {
            "title": "Historical token lifetime failure", "document_id": "learning-auth-old",
            "tags": ["learning:outcome", "outcome:failure", "project:PRJ-AUTH"],
            "data_type": "historical_experience",
        },
    )

    result = run(service.compare("Orion authentication access token revocation session rotation", scope="all"))
    assert any(item["id"] == "RAG-AUTH-CURRENT" for item in result["rag_memories"])
    assert any("older failed experiment" in item["text"] for item in result["hindsight_memories"])
    assert result["current_state"]
    assert {item["source_type"] for item in result["evidence"]} >= {"canonical", "rag", "hindsight"}
    assert set(result["lineage"]["rag_source_ids"]).isdisjoint(result["lineage"]["hindsight_source_ids"])


@pytest.mark.skipif(not settings.HINDSIGHT_API_KEY, reason="Hindsight Cloud credentials are not configured")
def test_e2e_phoenix_atlas_outcome_lesson_nova_future_retrieval():
    service = MemoryLearningService()

    async def no_generation(_system: str, _user: str):
        return None, "LLMUnavailable"

    service._generate = no_generation
    phoenix_record = {
        "scenario_id": "TASK-PHX-E2E-HINDSIGHT-01",
        "title": "Phoenix migration: scaling alone failed, pool tuning succeeded",
        "project_id": "PRJ-PHX",
        "project_name": "Phoenix Data Migration",
        "department": "Engineering",
        "team": "Data Platform",
        "owner_id": "EMP-011",
        "contributor_ids": ["EMP-008", "EMP-005"],
        "status": "completed",
        "occurred_at": "2026-08-02T10:00:00Z",
        "technologies": ["PostgreSQL", "Kafka", "connection pooling"],
        "requirements": "Migrate data with parity while keeping total database connections within measured headroom.",
        "initial_plan": "Scale PostgreSQL capacity before changing worker behavior.",
        "problem": "Phoenix migration workers saturated PostgreSQL connections and raised write latency.",
        "symptoms": "Large write batches increased pool waits and regional reconciliation lag.",
        "root_cause": "Per-worker pools exceeded the shared connection budget and large batches held connections too long.",
        "failed_attempts": "Increasing database compute did not reduce pool waits or lock duration.",
        "solution": "Bound aggregate pool capacity, reduce batch size, and cap worker concurrency.",
        "verification": "Staged replay passed row-count reconciliation and stabilized connection acquisition in synthetic tests.",
        "outcome_status": "success",
        "outcome_detail": "Scaling alone failed to address saturation; measured pool caps and smaller batches passed replay.",
        "lesson": "Measure aggregate connection use and tune pools and migration batches before scaling infrastructure.",
        "constraints": "Preserve ordering and parity; validate all capacity values in the target environment.",
        "reliability": "synthetic demo history; not independently verified",
        "source_reference": "Synthetic Phoenix E2E historical experience",
        "case_context": "Phoenix PostgreSQL connection saturation and latency during a write-heavy data migration.",
        "initial_recommendation": "Scale the database before changing migration workload shape.",
        "action_taken": "The team measured pool use, bounded pool size, and reduced migration batches.",
    }
    phoenix_saved = run(service.record_outcome(phoenix_record, synthetic=True))
    assert phoenix_saved["status"] in {"stored", "updated", "unchanged"}

    atlas_case = (
        "Atlas Analytics Platform has PostgreSQL connection saturation and p95 latency "
        "during a write-heavy database migration. Preserve regional consistency and do not "
        "increase infrastructure without measured evidence."
    )
    atlas = run(service.compare(atlas_case, scope="demo"))
    assert any("project:PRJ-PHX" in item["tags"] for item in atlas["hindsight_memories"])
    assert any(item["id"] == "RAG-001" for item in atlas["rag_memories"])
    assert "PRJ-ATL" in atlas["lineage"]["canonical_source_ids"]
    assert atlas["recommendation"]
    assert atlas["lineage"]["recommendation_evidence_ids"]

    record = {
        "scenario_id": "TASK-ATL-E2E-LEARNING-01",
        "title": "Atlas migration outcome: pool tuning and smaller batches succeeded",
        "project_id": "PRJ-ATL",
        "project_name": "Atlas Analytics Platform",
        "department": "Engineering",
        "team": "Data Platform",
        "owner_id": "EMP-012",
        "contributor_ids": ["EMP-011", "EMP-008"],
        "status": "deployed",
        "occurred_at": "2026-09-21T10:00:00Z",
        "technologies": ["PostgreSQL", "connection pooling", "Redis"],
        "requirements": "Reduce migration latency without increasing saturation or breaking regional consistency.",
        "initial_plan": "Scale database infrastructure before tuning pool settings.",
        "problem": "Atlas migration created database connection saturation and latency spikes.",
        "symptoms": "Write-heavy migration calls piled up and queries slowed during peak ingestion.",
        "root_cause": "Connection saturation remained after scaling because aggregate pool limits and batch sizes were unchanged.",
        "failed_attempts": "Increasing database compute without a pool review did not remove connection waits.",
        "solution": "Tune PostgreSQL pool limits and reduce migration batch size.",
        "verification": "A staged replay passed reconciliation and confirmed stable latency in the synthetic environment.",
        "outcome_status": "success",
        "outcome_detail": "Connection-pool tuning plus smaller migration batches stabilized latency and maintained parity.",
        "lesson": "Inspect aggregate connection saturation before scaling; tune pool limits and batch size, then verify regional parity.",
        "constraints": "Maintain regional consistency; avoid bulk writes during migration windows; measure environment-specific pool limits.",
        "reliability": "synthetic demo scenario; not independently verified",
        "source_reference": "Synthetic Atlas E2E learning-loop test",
        "case_context": atlas_case,
        "initial_recommendation": atlas["recommendation"],
        "action_taken": "The team tuned PostgreSQL pool limits and reduced migration batch size.",
    }
    saved = run(service.record_outcome(record, synthetic=True))
    assert saved["status"] in {"stored", "updated", "unchanged"}
    document = run(service.hindsight.get_document(service.bank_id, saved["document_id"]))
    assert document["document_metadata"]["project_id"] == "PRJ-ATL"

    nova_case = (
        "Nova Customer Portal is starting a related PostgreSQL data migration with connection "
        "waits and high database latency. The team must preserve regional parity and avoid "
        "unmeasured capacity expansion."
    )
    nova = run(service.compare(nova_case, scope="demo"))
    retrieved_projects = {
        tag.removeprefix("project:")
        for item in nova["hindsight_memories"] for tag in item["tags"]
        if tag.startswith("project:")
    }
    new_memory = next(
        item for item in nova["hindsight_memories"]
        if f"experience:{saved['document_id']}" in item["tags"]
    )

    assert {"PRJ-PHX", "PRJ-ATL"}.issubset(retrieved_projects)
    assert any(
        "project:PRJ-PHX" in item["tags"]
        and "connection saturation" in item["text"].casefold()
        for item in nova["hindsight_memories"]
    )
    assert new_memory["document_id"] == saved["document_id"]
    assert any(item["id"] == "RAG-001" for item in nova["rag_memories"])
    assert nova["lineage"]["hindsight_source_ids"]
    assert set(nova["lineage"]["recommendation_evidence_ids"]).issuperset(
        item["id"] for item in nova["hindsight_memories"]
        if f"experience:{saved['document_id']}" in item["tags"]
    )
    assert nova["recommendation"]
