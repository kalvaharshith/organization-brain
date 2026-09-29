import asyncio

from app.services.canonical_org import OrganizationalBrainStore, build_brain_context
from app.services.memory_learning import MemoryLearningService


def test_organization_seed_data_is_coherent():
    store = OrganizationalBrainStore()
    overview = store.get_overview()

    assert overview["organization"]["name"] == "Nexora Systems"
    assert len(overview["departments"]) >= 5
    assert len(overview["people"]) >= 18
    assert len(overview["projects"]) == 18
    assert overview["project_count"] == 18
    assert overview["project_history_count"] == 18


def test_projects_share_interconnections():
    store = OrganizationalBrainStore()
    atlas = store.get_project_by_code("PROJ-ATL")
    phoenix = store.get_project_by_code("PROJ-PHX")

    assert atlas is not None
    assert phoenix is not None
    assert "PRJ-ATL" in phoenix["history"]["related_project_ids"]
    assert "PRJ-PHX" in atlas["history"]["related_project_ids"]
    assert atlas["technology_stack"]
    assert phoenix["technology_stack"]


def test_brain_context_includes_current_and_historical_evidence():
    store = OrganizationalBrainStore()
    result = build_brain_context(store, "Atlas is experiencing high database latency during migration.")

    assert result["canonical_context"]
    assert result["rag_context"]
    assert result["hindsight_context"] == []
    assert result["recommendation"] is None
    assert result["lineage"]["rag_source_ids"]
    assert result["evidence"]


def test_brain_context_reports_missing_evidence_without_hallucinating():
    store = OrganizationalBrainStore()
    result = build_brain_context(store, "A totally unrelated product launch for a moonshot satellite grocery service.")

    assert result["hindsight_context"] == []
    assert "No relevant current organizational documentation was found." in result.get("rag_message", "")
    assert result["recommendation"] is None


def test_outcome_recording_creates_a_recallable_hindsight_memory():
    service = MemoryLearningService()
    service.bank_id = "test-atlas-outcome-local"
    service.hindsight.api_key = ""
    service._generate = lambda system, user: asyncio.sleep(0, result=(None, "LLMUnavailable"))

    record = {
        "scenario_id": "TASK-ATL-RETRO-01",
        "title": "Atlas migration: connection-pool tuning proved effective",
        "project_id": "PRJ-ATL",
        "project_name": "Atlas Analytics Platform",
        "department": "Engineering",
        "team": "Data Platform",
        "owner_id": "EMP-012",
        "contributor_ids": ["EMP-011", "EMP-008"],
        "status": "deployed",
        "occurred_at": "2026-09-21T10:00:00Z",
        "technologies": ["PostgreSQL", "connection pooling", "Redis"],
        "requirements": "Reduce latency during migration without increasing database saturation.",
        "initial_plan": "Scale database infrastructure before tuning pool settings.",
        "problem": "Atlas migration created database connection saturation and latency spikes.",
        "symptoms": "Write-heavy migration calls piled up and queries slowed during peak ingestion.",
        "root_cause": "Connection saturation was the main bottleneck; scaling the database without adjusting pool settings simply increased pressure.",
        "failed_attempts": "The team attempted to scale the database instance and increased compute without a pool review.",
        "solution": "Connection-pool tuning and smaller migration batches stabilized latency.",
        "verification": "A staged migration replay confirmed lower latency and stable throughput.",
        "outcome_status": "success",
        "outcome_detail": "Latency stabilized after tuning the pool and reducing batch size during migration.",
        "lesson": "Inspect connection saturation before scaling infrastructure; tune the pool and batch size first.",
        "constraints": "Keep regional consistency and avoid bulk writes during migration windows.",
        "reliability": "high",
        "source_reference": "Atlas migration follow-up from the platform engineering team",
        "case_context": "Atlas is experiencing high database latency during migration. The database is saturating under write-heavy traffic while the team considers scaling infrastructure.",
        "initial_recommendation": "Tune the connection pool and reduce migration batch size before scaling infrastructure.",
        "action_taken": "The team tuned the PostgreSQL pool limits and reduced migration batch size while keeping the same workload profile.",
        "user_preference": "Prefer cheaper operational fixes before infrastructure expansion.",
    }

    saved = asyncio.run(service.record_outcome(record, synthetic=False))
    assert saved["status"] in {"stored", "updated", "unchanged"}

    comparison = asyncio.run(service.compare("Atlas migration connection saturation during migration and database latency", scope="all"))
    titles = [item["title"].lower() for item in comparison["hindsight_memories"]]
    assert any("atlas migration" in title or "connection-pool tuning" in title for title in titles)
    assert comparison["retrieved_count"] >= 1
