import asyncio
import hashlib
import logging
import re
from typing import Any

import httpx

from app.config import settings
from app.services.demo_dataset import SYNTHETIC_EXPERIENCES, SYNTHETIC_ORGANIZATION
from app.services.hindsight_client import HindsightClient
from app.services.llm import llm
from app.services.canonical_org import OrganizationalBrainStore, PROJECTS
from app.services.organizational_seed import ADDITIONAL_HINDSIGHT_EXPERIENCES, DECISION_EXPERIENCE_IDS
from app.services.rag_knowledge import RAGKnowledgeStore

logger = logging.getLogger(__name__)

DEMO_TAGS = ["learning:outcome", "demo:synthetic"]
DEMO_COMPANY_TAG = "company:ORG-NXS-DEMO"

DEMO_RECORDS = [
    {
        "scenario_id": "webhook-fixed-retry-failure-v1",
        "title": "Synthetic demo: fixed-interval webhook retries failed",
        "case_context": (
            "A payment webhook partner returned HTTP 429 during a brief traffic spike. "
            "The delivery queue grew while requests were retried."
        ),
        "initial_recommendation": "Retry every five seconds for three attempts.",
        "action_taken": "A fixed five-second retry schedule was used for the demo case.",
        "outcome_status": "failure",
        "outcome_detail": (
            "The synchronized retries arrived together, caused more HTTP 429 responses, "
            "and extended the queue backlog. This is an illustrative scenario, not a real incident."
        ),
        "lesson": (
            "Fixed-interval retries amplified this synthetic 429 burst; do not repeat that "
            "recommendation for a similar case without checking provider rate limits."
        ),
        "user_preference": "",
        "reliability": "illustrative synthetic example",
        "tags": ["scenario:webhook-retries", "outcome:failure"],
    },
    {
        "scenario_id": "webhook-jitter-success-v1",
        "title": "Synthetic demo: bounded backoff improved webhook recovery",
        "case_context": (
            "A later webhook test had transient HTTP 429 and HTTP 503 responses, "
            "with a risk of duplicate payment-side effects during redelivery."
        ),
        "initial_recommendation": "Use the previous fixed five-second retry schedule.",
        "action_taken": (
            "The demo changed to capped exponential backoff with jitter, a bounded attempt "
            "count, and an idempotency key on event processing."
        ),
        "outcome_status": "success",
        "outcome_detail": (
            "In this synthetic test, the retry burst subsided and redelivered events did not "
            "repeat the payment-side effect. This is a demo result, not a production claim."
        ),
        "lesson": (
            "For the demonstrated transient 429/503 pattern, combine bounded backoff with "
            "jitter and idempotent processing; verify provider-specific limits before rollout."
        ),
        "user_preference": "",
        "reliability": "illustrative synthetic example",
        "tags": ["scenario:webhook-retries", "scenario:idempotency", "outcome:success"],
    },
    {
        "scenario_id": "rollout-preference-success-v1",
        "title": "Synthetic demo: learned preference for reversible rollouts",
        "case_context": (
            "A schema migration needed to roll out across multiple tenant groups while "
            "maintaining an explicit recovery path."
        ),
        "initial_recommendation": "Apply the migration to all tenants in one maintenance window.",
        "action_taken": (
            "The demo used a small canary group, validation gates, staged expansion, "
            "and a documented rollback checkpoint."
        ),
        "outcome_status": "success",
        "outcome_detail": (
            "The canary checks passed before expansion and the rollback point was available. "
            "This is a synthetic demo outcome, not a real deployment record."
        ),
        "lesson": (
            "A staged rollout with observable gates and a prepared rollback path was successful "
            "in this synthetic migration scenario."
        ),
        "user_preference": (
            "Stated in this synthetic demo: prefer small canary batches, observable checks, "
            "and an explicit rollback checkpoint for risky migrations."
        ),
        "reliability": "illustrative synthetic example",
        "tags": ["scenario:rollout", "preference:reversible-rollouts", "outcome:success"],
    },
]

EVALUATION_CASES = [
    {
        "id": "webhook-retries",
        "title": "429 retry bursts",
        "query": (
            "Which retry recommendation failed when fixed-interval HTTP 429 webhook "
            "attempts synchronized?"
        ),
        "expected_tag": "scenario:webhook-retries",
    },
    {
        "id": "idempotency",
        "title": "Duplicate side effects on 503",
        "query": (
            "What outcome was learned about capped exponential backoff with jitter and "
            "idempotency for duplicate payment side effects?"
        ),
        "expected_tag": "scenario:idempotency",
    },
    {
        "id": "database-history",
        "title": "Connection-pool exhaustion across worker types",
        "query": (
            "Which projects had database connection-pool timeouts when worker concurrency increased, "
            "and what was learned?"
        ),
        "expected_tag": "concept:database-connection-pool",
    },
    {
        "id": "cold-start",
        "title": "Recommendation cold-start failure",
        "query": (
            "What failed when collaborative recommendations were used for new users without interaction history?"
        ),
        "expected_tag": "concept:cold-start",
    },
    {
        "id": "rollout-preference",
        "title": "Migration rollout preference",
        "query": (
            "What user preference was learned for small canary batches, observable checks, "
            "and explicit rollback checkpoints in risky migrations?"
        ),
        "expected_tag": "preference:reversible-rollouts",
    },
]


class MemoryLearningService:
    """Outcome-focused learning backed exclusively by Hindsight Cloud."""

    def __init__(self):
        self.hindsight = HindsightClient()
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.rag = RAGKnowledgeStore()
        self.organization = OrganizationalBrainStore()

    @staticmethod
    def _validate_demo_dataset() -> None:
        employee_ids = {person["id"] for person in SYNTHETIC_ORGANIZATION["employees"]}
        project_ids = {project["id"] for project in SYNTHETIC_ORGANIZATION["projects"]}
        task_ids = set()
        required = (
            "scenario_id", "title", "project_id", "project_name", "department", "team",
            "owner_id", "status", "occurred_at", "requirements", "initial_plan", "problem",
            "symptoms", "root_cause", "failed_attempts", "solution", "verification",
            "outcome_status", "outcome_detail", "lesson", "constraints",
        )
        valid_statuses = {
            "completed", "in_progress", "under_review", "blocked", "failed", "cancelled",
            "delayed", "reopened", "waiting_for_approval", "deployed", "rolled_back", "approved",
        }
        for record in SYNTHETIC_EXPERIENCES:
            missing = [key for key in required if not record.get(key)]
            if missing:
                raise ValueError(f"{record.get('scenario_id', 'unknown task')} missing {', '.join(missing)}")
            task_id = record["scenario_id"]
            if task_id in task_ids:
                raise ValueError(f"Duplicate synthetic task ID: {task_id}")
            task_ids.add(task_id)
            if record["project_id"] not in project_ids:
                raise ValueError(f"{task_id} references unknown project {record['project_id']}")
            if record["owner_id"] not in employee_ids:
                raise ValueError(f"{task_id} references unknown owner {record['owner_id']}")
            unknown_contributors = set(record.get("contributor_ids", [])) - employee_ids
            if unknown_contributors:
                raise ValueError(f"{task_id} references unknown contributors {sorted(unknown_contributors)}")
            if record["status"] not in valid_statuses:
                raise ValueError(f"{task_id} has unsupported status {record['status']}")
            if record["outcome_status"] not in {"success", "failure", "partial"}:
                raise ValueError(f"{task_id} has unsupported outcome status {record['outcome_status']}")

    @staticmethod
    def _document_id(record: dict[str, Any], content: str,
                     synthetic: bool = True) -> str:
        scenario_id = record.get("scenario_id")
        company_id = record.get("company_id") or (SYNTHETIC_ORGANIZATION["id"] if synthetic else "")
        identity = f"{company_id}:{scenario_id}" if scenario_id else content
        digest = hashlib.sha256(identity.encode("utf-8")).hexdigest()
        return f"learning-{digest[:32]}"

    @staticmethod
    def _entities_for_record(record: dict[str, Any],
                             company_id: str | None) -> list[dict[str, str]]:
        entities = []
        if company_id:
            entities.append({"text": SYNTHETIC_ORGANIZATION["name"], "type": "ORG"})
        employees = {person["id"]: person for person in SYNTHETIC_ORGANIZATION["employees"]}
        employee_ids = [record.get("owner_id"), *record.get("contributor_ids", [])]
        for employee_id in employee_ids:
            person = employees.get(employee_id)
            if person:
                entities.append({"text": person["name"], "type": "PERSON"})
        values = [
            record.get("department"), record.get("team"),
            record.get("project_name"), record.get("scenario_id"),
            *record.get("technologies", []),
        ]
        entities.extend(
            {"text": str(value), "type": "CONCEPT"} for value in values if value
        )
        unique = {}
        for entity in entities:
            unique[(entity["text"].casefold(), entity["type"])] = entity
        return list(unique.values())

    @staticmethod
    def _organization_registry() -> tuple[str, dict[str, Any]]:
        company = SYNTHETIC_ORGANIZATION
        lines = [
            "SYNTHETIC DEMO REFERENCE — fictional organization directory; not a real company roster or policy.",
            f"Organization: {company['name']} ({company['id']})",
            company["label"],
            "Departments and teams:",
        ]
        for department in company["departments"]:
            lines.append(
                f"- {department['id']} {department['name']}: {', '.join(department['teams'])}"
            )
        lines.append("Fictional employees:")
        for employee in company["employees"]:
            lines.append(
                f"- {employee['id']} {employee['name']}, {employee['role']}, "
                f"team {employee['team']}"
            )
        lines.append("Projects and departments:")
        for project in company["projects"]:
            lines.append(
                f"- {project['id']} {project['name']}, department {project['department']}"
            )
        content = "\n".join(lines)
        entities = [{"text": company["name"], "type": "ORG"}]
        entities.extend(
            {"text": employee["name"], "type": "PERSON"}
            for employee in company["employees"]
        )
        entities.extend(
            {"text": project["name"], "type": "CONCEPT"}
            for project in company["projects"]
        )
        document_id = f"reference-{hashlib.sha256(company['id'].encode()).hexdigest()[:32]}"
        tags = [
            "source:organization", "data:current-reference", "demo:synthetic",
            f"company:{company['id']}", "reference:organization-registry",
        ]
        tags.extend(f"project:{project['id']}" for project in company["projects"])
        tags.extend(f"employee:{employee['id']}" for employee in company["employees"])
        tags.extend(f"department:{department['id']}" for department in company["departments"])
        tags.extend(
            "team:" + re.sub(r"[^a-z0-9]+", "-", team.lower()).strip("-")
            for department in company["departments"] for team in department["teams"]
        )
        metadata = {
            "title": f"Synthetic organization registry: {company['name']}",
            "doc_type": "SYNTHETIC_ORGANIZATION_REFERENCE",
            "data_type": "current_reference",
            "source": "synthetic_demo_dataset_v1",
            "source_reference": "Synthetic Nexus demo dataset authored for this application",
            "record_kind": "organization_registry",
            "company_id": company["id"],
            "company_name": company["name"],
            "version": "1",
            "synthetic_demo": "true",
            "document_id": document_id,
            "tags": tags,
            "entities": entities,
        }
        return content, metadata

    @staticmethod
    def _content(record: dict[str, Any], synthetic: bool) -> str:
        label = (
            "SYNTHETIC DEMO RECORD — fictional training data; not an actual incident, "
            "company policy, or verified organizational fact."
            if synthetic else
            "USER-REPORTED EXPERIENCE — attributed to the submitting user; not independently verified."
        )
        company_name = record.get("company_name") or (
            SYNTHETIC_ORGANIZATION["name"] if synthetic else "Organization not specified"
        )
        company_id = record.get("company_id") or (
            SYNTHETIC_ORGANIZATION["id"] if synthetic else "not specified"
        )
        case_context = record.get("case_context") or (
            f"{record.get('requirements', '')} {record.get('problem', '')} "
            f"{record.get('symptoms', '')}"
        ).strip()
        recommendation = record.get("initial_recommendation") or record.get("initial_plan") or "Not recorded."
        action_taken = record.get("action_taken") or record.get("solution") or "Not recorded."
        lines = [
            label,
            f"Company: {company_name} ({company_id})",
            f"Scenario: {record['title']}",
            f"Project: {record.get('project_name', 'Unassigned')} ({record.get('project_id', 'n/a')})",
            f"Task: {record.get('scenario_id', 'n/a')} | Status: {record.get('status', 'outcome-recorded')}",
            f"Department/team: {record.get('department', 'Unspecified')} / {record.get('team', 'Unspecified')}",
            f"Owner: {record.get('owner_name', record.get('owner_id', 'Unspecified'))} ({record.get('owner_id', 'n/a')})",
            f"Contributors: {', '.join(record.get('contributor_names', record.get('contributor_ids', []))) or 'Unspecified'}",
            f"Occurred at: {record.get('occurred_at', 'not specified')}",
            f"Technologies: {', '.join(record.get('technologies', [])) or 'not specified'}",
            f"Requirements: {record.get('requirements', 'not specified')}",
            f"Initial plan: {record.get('initial_plan', 'not specified')}",
            f"Case context: {case_context or 'Not recorded.'}",
            f"Initial recommendation: {recommendation}",
            f"Action taken: {action_taken}",
            f"Problem: {record.get('problem', 'not specified')}",
            f"Symptoms: {record.get('symptoms', 'not specified')}",
            f"Root cause: {record.get('root_cause', 'not specified')}",
            f"Failed attempts: {record.get('failed_attempts', 'not specified')}",
            f"Solution: {record.get('solution') or action_taken}",
            f"Verification: {record.get('verification', 'not independently verified')}",
            f"Outcome status: {record['outcome_status']}",
            f"Outcome detail: {record['outcome_detail']}",
            f"Learned lesson: {record['lesson']}",
            f"Reliability: {record['reliability']}",
        ]
        if record.get("constraints"):
            lines.append(f"Constraints: {record['constraints']}")
        if record.get("user_preference"):
            lines.append(f"User-stated preference: {record['user_preference']}")
        if record.get("source_reference"):
            lines.append(f"Source attribution: {record['source_reference']}")
        return "\n".join(lines)

    async def record_outcome(self, record: dict[str, Any],
                             synthetic: bool = True) -> dict[str, Any]:
        content = self._content(record, synthetic)
        document_id = self._document_id(record, content, synthetic)
        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        version = int(record.get("version", 1))
        existing_document = None
        try:
            existing_document = await self.hindsight.get_document(self.bank_id, document_id)
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code != 404:
                raise
        existing_needs_lineage_update = False
        if existing_document:
            existing_metadata = existing_document.get("document_metadata") or {}
            existing_tags = existing_document.get("tags") or existing_metadata.get("tags") or []
            has_stable_lineage = f"experience:{document_id}" in existing_tags
            has_decision_tag = (
                record.get("scenario_id") not in DECISION_EXPERIENCE_IDS
                or "experience:decision" in existing_tags
            )
            if existing_document.get("content_hash") == content_hash and has_stable_lineage and has_decision_tag:
                return {
                    "document_id": document_id,
                    "title": record["title"],
                    "status": "unchanged",
                    "version": (existing_document.get("document_metadata") or {}).get("version", str(version)),
                }
            existing_needs_lineage_update = (
                existing_document.get("content_hash") == content_hash
                and (not has_stable_lineage or not has_decision_tag)
            )
            previous_metadata = existing_metadata
            try:
                if not existing_needs_lineage_update:
                    version = max(version, int(previous_metadata.get("version", "1")) + 1)
            except (TypeError, ValueError):
                version = max(version, 2)
        record["version"] = version
        tags = list(record.get("tags", []))
        if record.get("scenario_id") in DECISION_EXPERIENCE_IDS:
            tags.append("experience:decision")
        tags.extend(["learning:outcome", "demo:synthetic"] if synthetic else
                    ["learning:outcome", "source:user-feedback"])
        tags.append(f"outcome:{record['outcome_status']}")
        company_id = record.get("company_id") or (SYNTHETIC_ORGANIZATION["id"] if synthetic else None)
        if company_id:
            tags.append(f"company:{company_id}")
        if record.get("project_id"):
            tags.append(f"project:{record['project_id']}")
        if record.get("scenario_id"):
            tags.append(f"task:{record['scenario_id']}")
        tags.append(f"experience:{document_id}")
        if record.get("owner_id"):
            tags.append(f"employee:{record['owner_id']}")
        tags.extend(f"employee:{employee_id}" for employee_id in record.get("contributor_ids", []))
        if record.get("department"):
            tags.append(f"department:{re.sub(r'[^a-z0-9]+', '-', record['department'].lower()).strip('-')}")
        if record.get("team"):
            tags.append(f"team:{re.sub(r'[^a-z0-9]+', '-', record['team'].lower()).strip('-')}")
        tags = list(dict.fromkeys(tags))
        metadata = {
            "title": record["title"],
            "doc_type": "LEARNING_EXPERIENCE",
            "data_type": "historical_experience",
            "source": "synthetic_demo_dataset" if synthetic else "user_submitted_outcome",
            "source_reference": record.get("source_reference") or (
                "Synthetic demo dataset authored for this application" if synthetic
                else "User-submitted outcome feedback"
            ),
            "record_kind": "outcome",
            "scenario_id": record.get("scenario_id") or document_id,
            "company_id": company_id or "",
            "company_name": record.get("company_name", SYNTHETIC_ORGANIZATION["name"] if synthetic else ""),
            "project_id": record.get("project_id", ""),
            "project_name": record.get("project_name", ""),
            "task_id": record.get("scenario_id", ""),
            "task_status": record.get("status", "outcome-recorded"),
            "department": record.get("department", ""),
            "team": record.get("team", ""),
            "owner_id": record.get("owner_id", ""),
            "owner_name": record.get("owner_name", ""),
            "contributor_ids": record.get("contributor_ids", []),
            "version": str(record.get("version", 1)),
            "occurred_at": record.get("occurred_at", ""),
            "outcome_status": record["outcome_status"],
            "reliability": record["reliability"],
            "synthetic_demo": str(synthetic).lower(),
            "document_id": document_id,
            "tags": tags,
            "entities": self._entities_for_record(record, company_id),
        }
        result = await self.hindsight.store_knowledge(
            bank_id=self.bank_id,
            content=content,
            metadata=metadata,
        )
        if result.get("success") is False:
            raise RuntimeError("Hindsight did not confirm retaining the outcome")
        return {
            "document_id": document_id,
            "title": record["title"],
            "status": "updated" if existing_document else "stored",
            "version": version,
            "hindsight": result,
        }

    async def seed_demo_history(self) -> dict[str, Any]:
        self._validate_demo_dataset()
        existing = await self.hindsight.list_documents(
            self.bank_id, limit=100, tags=[DEMO_COMPANY_TAG], tags_match="all_strict"
        )
        existing_by_id = {item.get("id"): item for item in existing.get("items", [])}
        seeded = []
        skipped = 0
        updated = 0
        project_by_id = {project["id"]: project for project in PROJECTS}
        project_aliases = {
            "PRJ-AUTH-01": "PRJ-AUTH", "PRJ-PAY-02": "PRJ-PAY",
            "PRJ-REC-03": "PRJ-REC", "PRJ-DOC-04": "PRJ-DOC",
            "PRJ-DATA-05": "PRJ-DATA", "PRJ-REL-06": "PRJ-REL",
        }
        histories = [*SYNTHETIC_EXPERIENCES, *ADDITIONAL_HINDSIGHT_EXPERIENCES]
        for source_record in histories:
            canonical_project_id = project_aliases.get(
                source_record.get("project_id"), source_record.get("project_id")
            )
            canonical_project = project_by_id.get(canonical_project_id, {})
            people = {person["id"]: person["name"]
                      for person in SYNTHETIC_ORGANIZATION["employees"]}
            record = {
                **source_record,
                "project_id": canonical_project_id,
                "project_name": canonical_project.get("name", source_record.get("project_name", "")),
                "company_id": SYNTHETIC_ORGANIZATION["id"],
                "company_name": SYNTHETIC_ORGANIZATION["name"],
                "owner_name": people.get(source_record.get("owner_id"), "Unknown synthetic owner"),
                "contributor_names": [
                    people.get(person_id, "Unknown synthetic contributor")
                    for person_id in source_record.get("contributor_ids", [])
                ],
                "source_reference": source_record.get("source_reference") or
                    "Synthetic organizational history authored for this application",
                "reliability": source_record.get("reliability") or
                    "synthetic demo scenario; not independently verified",
            }
            content = self._content(record, synthetic=True)
            document_id = self._document_id(record, content)
            existing_document = existing_by_id.get(document_id)
            digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
            existing_tags = set(
                (existing_document or {}).get("tags")
                or ((existing_document or {}).get("document_metadata") or {}).get("tags")
                or []
            )
            needs_decision_tag = (
                record.get("scenario_id") in DECISION_EXPERIENCE_IDS
                and "experience:decision" not in existing_tags
            )
            if (
                existing_document
                and existing_document.get("content_hash") == digest
                and not needs_decision_tag
            ):
                skipped += 1
                continue
            result = await self.record_outcome(record, synthetic=True)
            seeded.append({**result, "kind": "historical_experience"})
            if existing_document:
                updated += 1
        return {
            "created": len(seeded) - updated,
            "updated": updated,
            "skipped_existing": skipped,
            "records": seeded,
        }

    async def compare(self, case_context: str, scope: str = "demo") -> dict[str, Any]:
        experience_tags = (
            [DEMO_COMPANY_TAG, "learning:outcome"]
            if scope == "demo" else ["learning:outcome"]
        )
        experience_tags_match = "all_strict" if scope == "demo" else "any_strict"
        retrieval_errors = []
        try:
            reference_memories = self.rag.search(case_context, limit=8)
        except Exception as exc:
            logger.exception("Current RAG retrieval failed during comparison")
            reference_memories = []
            retrieval_errors.append(type(exc).__name__)
        try:
            experience_memories = await self.hindsight.search_memories(
                bank_id=self.bank_id,
                query=case_context,
                limit=20,
                tags=experience_tags,
                tags_match=experience_tags_match,
            )
        except Exception as exc:
            logger.exception("Hindsight experience recall failed during comparison")
            experience_memories = []
            retrieval_errors.append(type(exc).__name__)
        reference_memories = self._dedupe_memories(reference_memories)[:8]
        experience_memories = self._dedupe_memories(experience_memories)[:20]
        memories = self._dedupe_memories(reference_memories + experience_memories)
        canonical_projects = self.organization.search_projects(case_context, limit=6)
        canonical_context = [
            {
                "source_type": "canonical",
                "source_id": project["id"],
                "title": project["name"],
                "project_id": project["id"],
                "summary": (
                    f"{project['name']} ({project['id']}) is currently {project['status']}. "
                    f"Requirement: {project['requirements']} History: "
                    f"{project['history'].get('problem', '')}"
                ),
            }
            for project in canonical_projects
        ]

        baseline_prompt = (
            "You are an organizational decision assistant. Give a concise, useful "
            "recommendation using only the current case and general reasoning. You have "
            "not retrieved prior organizational experiences. Do not claim you remember "
            "past cases, user preferences, policies, or outcomes. State any assumptions."
        )
        baseline, baseline_error = await self._generate(baseline_prompt, case_context)

        memory_answer = None
        memory_error = None
        if memories or canonical_context:
            memory_context = (
                "CURRENT CANONICAL ORGANIZATION STATE (authoritative current state):\n"
                f"{self._format_canonical(canonical_context) or 'No related canonical projects retrieved.'}\n\n"
                "CURRENT REFERENCE DOCUMENTS (separate RAG store):\n"
                f"{self._format_memories(reference_memories) or 'No current reference documents retrieved.'}\n\n"
                "HISTORICAL EXPERIENCES (Hindsight learning channel):\n"
                f"{self._format_memories(experience_memories) or 'No previous experiences retrieved.'}"
            )
            memory_prompt = (
                "You are an organizational decision assistant. Separate current canonical "
                "state, current RAG guidance, and historical Hindsight experience. Treat "
                "canonical state and current RAG as current truth; Hindsight is historical "
                "evidence and must never overwrite current state or policy. Compare the "
                "current case with retrieved evidence, state concrete similarities and "
                "differences, distinguish successful from failed approaches, account for "
                "the supplied current constraints, then recommend only what the retrieved "
                "evidence supports. Cite the stable source ID and title for each material "
                "claim. Never claim a source was used unless it appears below. Records "
                "marked SYNTHETIC DEMO are fictional examples, not real incidents or policy. "
                "When evidence conflicts, preserve current canonical/RAG information and "
                "describe the historical difference explicitly. Do not infer preferences.\n\n"
                f"Retrieved evidence:\n{memory_context}"
            )
            memory_answer, memory_error = await self._generate(memory_prompt, case_context)

        recommendation = memory_answer or self._evidence_recommendation(
            reference_memories, experience_memories, canonical_context
        )
        retrieved_project_ids = list(dict.fromkeys(
            tag.removeprefix("project:")
            for memory in experience_memories for tag in memory.get("tags", [])
            if tag.startswith("project:")
        ))
        rag_message = "" if reference_memories else "No relevant current organizational documentation was found."
        hindsight_message = "" if experience_memories else "No verified organizational experience was found for this problem."

        return {
            "case_context": case_context,
            "scope": scope,
            "current_state": canonical_context,
            "canonical_projects": canonical_projects,
            "baseline": baseline,
            "memory_answer": memory_answer,
            "reasoning": memory_answer or recommendation,
            "recommendation": recommendation,
            "rag_message": rag_message,
            "hindsight_message": hindsight_message,
            "rag_memories": [self._memory_summary(memory) for memory in reference_memories],
            "hindsight_memories": [self._memory_summary(memory) for memory in experience_memories],
            "memories": [self._memory_summary(memory) for memory in memories],
            "related_project_ids": retrieved_project_ids,
            "evidence": [
                {"source_type": "canonical", **item} for item in canonical_context
            ] + [
                {"source_type": "rag", "source_id": item.get("id"), "title": item.get("title"),
                 "document_id": item.get("document_id"), "project_id": item.get("project_id")}
                for item in reference_memories
            ] + [
                {"source_type": "hindsight", "source_id": item.get("id"),
                 "title": self._memory_summary(item)["title"],
                 "document_id": item.get("document_id"),
                 "project_id": next((tag.removeprefix("project:") for tag in item.get("tags", []) if tag.startswith("project:")), None)}
                for item in experience_memories
            ],
            "lineage": {
                "input_id": "problem-" + hashlib.sha256(case_context.encode("utf-8")).hexdigest()[:16],
                "canonical_source_ids": [item["source_id"] for item in canonical_context],
                "rag_source_ids": [item.get("id") for item in reference_memories],
                "hindsight_source_ids": [item.get("id") for item in experience_memories],
                "recommendation_evidence_ids": (
                    [item["source_id"] for item in canonical_context]
                    + [item.get("id") for item in memories]
                ),
            },
            "confidence": "evidence-backed" if memories or canonical_context else "insufficient-evidence",
            "limitations": [
                "Historical outcomes are synthetic demo experiences, not verified production incidents."
            ] if any(self._memory_summary(item)["synthetic_demo"] for item in experience_memories) else [],
            "retrieved_count": len(memories) + len(canonical_context),
            "memory_influence": "used" if memories or canonical_context else "none",
            "retrieval_status": (
                "unavailable" if len(retrieval_errors) == 2
                else "partial" if retrieval_errors else "ok"
            ),
            "generation_status": "partial" if baseline_error or memory_error else "ok",
            "errors": retrieval_errors + [
                error for error in (baseline_error, memory_error) if error
            ],
        }

    @staticmethod
    def _evidence_recommendation(
        rag_memories: list[dict[str, Any]],
        experience_memories: list[dict[str, Any]],
        canonical_context: list[dict[str, Any]],
    ) -> str:
        if not rag_memories and not experience_memories and not canonical_context:
            return (
                "No evidence-grounded recommendation is available because no relevant "
                "current guidance or historical experience was retrieved."
            )
        successful = [
            memory for memory in experience_memories
            if "outcome:success" in (memory.get("tags") or [])
        ]
        failed = [
            memory for memory in experience_memories
            if "outcome:failure" in (memory.get("tags") or [])
        ]
        parts = []
        if successful:
            parts.append(
                "Retrieved successful experience to consider: "
                + " ".join(memory.get("text", "") for memory in successful[:2])
            )
        if failed:
            parts.append(
                "Avoid repeating the retrieved failed approach: "
                + " ".join(memory.get("text", "") for memory in failed[:2])
            )
        if rag_memories:
            parts.append(
                "Current guidance retrieved: "
                + " ".join(memory.get("text") or memory.get("content", "") for memory in rag_memories[:2])
            )
        if canonical_context:
            parts.append(
                "Current project state retrieved: "
                + " ".join(item["summary"] for item in canonical_context[:3])
            )
        if not successful and not failed and experience_memories:
            parts.append(
                "Historical evidence retrieved for comparison: "
                + " ".join(memory.get("text", "") for memory in experience_memories[:2])
            )
        parts.append("Validate the approach against the current project's constraints before acting.")
        return " ".join(part for part in parts if part).strip()

    @staticmethod
    def _format_canonical(records: list[dict[str, Any]]) -> str:
        return "\n\n".join(
            f"Project {record['source_id']}: {record['title']}\n{record['summary']}"
            for record in records
        )

    async def _generate(self, system: str, user: str) -> tuple[str | None, str | None]:
        try:
            text = await asyncio.to_thread(llm.chat, system, user, 0.1, 2048)
            if not text.strip():
                raise RuntimeError("LLM returned an empty completion")
            return text, None
        except Exception as exc:
            logger.exception("LLM generation failed during memory comparison")
            return None, type(exc).__name__

    @staticmethod
    def _format_memories(memories: list[dict[str, Any]]) -> str:
        items = []
        for index, memory in enumerate(memories, 1):
            metadata = memory.get("metadata") or {}
            title = metadata.get("title", "Untitled Hindsight memory")
            tags = ", ".join(memory.get("tags") or [])
            items.append(
                f"Memory {index} [ID: {memory.get('id') or memory.get('document_id') or metadata.get('document_id') or 'unknown'}]: {title}\n"
                f"Type: {memory.get('type', 'unknown')}\n"
                f"Context: {memory.get('context') or ''}\n"
                f"Tags: {tags}\n"
                f"Text: {memory.get('text', '')}"
            )
        return "\n\n".join(items)

    @staticmethod
    def _memory_summary(memory: dict[str, Any]) -> dict[str, Any]:
        metadata = memory.get("metadata") or {}
        scores = memory.get("scores") or {}
        tags = memory.get("tags") or []
        title = memory.get("title") or metadata.get("title")
        if not title:
            task_tag = next((tag for tag in tags if tag.startswith("task:")), None)
            if task_tag:
                title = task_tag.removeprefix("task:").replace("-", " ").title()
            if not title:
                scenario_tag = next((tag for tag in tags if tag.startswith("scenario:")), None)
                title = scenario_tag.removeprefix("scenario:").replace("-", " ").title() if scenario_tag else "Hindsight memory"
        if not title:
            scenario_tag = next((tag for tag in tags if tag.startswith("scenario:")), None)
            title = scenario_tag.removeprefix("scenario:").replace("-", " ").title() if scenario_tag else "Hindsight memory"
        project_tag = next((tag for tag in tags if tag.startswith("project:")), None)
        experience_tag = next((tag for tag in tags if tag.startswith("experience:")), None)
        outcome_status = metadata.get("outcome_status") or next(
            (tag.removeprefix("outcome:") for tag in tags if tag.startswith("outcome:")),
            None,
        )
        synthetic_demo = metadata.get("synthetic_demo") == "true" or "demo:synthetic" in tags
        return {
            "id": memory.get("id"),
            "title": title,
            "text": memory.get("text", ""),
            "type": memory.get("type") or memory.get("fact_type", "unknown"),
            "data_type": metadata.get("data_type") or (
                "historical_experience" if "learning:outcome" in tags else "current_reference"
            ),
            "context": memory.get("context"),
            "tags": tags,
            "document_id": memory.get("document_id") or metadata.get("document_id") or (
                experience_tag.removeprefix("experience:") if experience_tag else None
            ),
            "project_id": metadata.get("project_id") or (
                project_tag.removeprefix("project:") if project_tag else None
            ),
            "mentioned_at": memory.get("mentioned_at") or memory.get("date"),
            "outcome_status": outcome_status,
            "source": metadata.get("source") or ("synthetic_demo_dataset" if synthetic_demo else None),
            "source_reference": metadata.get("source_reference"),
            "synthetic_demo": synthetic_demo,
            "final_score": scores.get("final"),
        }

    @staticmethod
    def _dedupe_memories(memories: list[dict[str, Any]]) -> list[dict[str, Any]]:
        unique = []
        seen = set()
        for memory in memories:
            text = re.sub(r"\s+", " ", memory.get("text", "")).strip().casefold()
            if not text or text in seen:
                continue
            seen.add(text)
            unique.append(memory)
        return unique

    async def overview(self, scope: str = "demo") -> dict[str, Any]:
        tags = (
            [DEMO_COMPANY_TAG, "learning:outcome"]
            if scope == "demo" else ["learning:outcome"]
        )
        tags_match = "all_strict" if scope == "demo" else "any_strict"
        stats = await self.hindsight.get_bank_stats(self.bank_id)
        documents = await self.hindsight.list_documents(
            self.bank_id, limit=100, tags=tags, tags_match=tags_match
        )
        memories = await self.hindsight.list_memories(
            self.bank_id, limit=100, tags=tags, tags_match=tags_match
        )
        timeline = []
        for document in documents.get("items", []):
            metadata = document.get("document_metadata") or {}
            timeline.append({
                "document_id": document.get("id"),
                "title": metadata.get("title", "Untitled Hindsight document"),
                "created_at": document.get("created_at"),
                "updated_at": document.get("updated_at"),
                "memory_count": document.get("memory_unit_count", 0),
                "data_type": metadata.get("data_type"),
                "outcome_status": metadata.get("outcome_status"),
                "record_kind": metadata.get("record_kind"),
                "source": metadata.get("source"),
                "company_id": metadata.get("company_id"),
                "project_id": metadata.get("project_id"),
                "task_id": metadata.get("task_id"),
                "department": metadata.get("department"),
                "team": metadata.get("team"),
                "owner_id": metadata.get("owner_id"),
                "synthetic_demo": metadata.get("synthetic_demo") == "true",
                "tags": document.get("tags") or [],
            })
        timeline.sort(key=lambda item: item.get("created_at") or "", reverse=True)
        tags = [tag for document in timeline for tag in document["tags"]]
        outcome_counts = {}
        for document in timeline:
            status = document.get("outcome_status")
            if status:
                outcome_counts[status] = outcome_counts.get(status, 0) + 1
        canonical = self.organization.get_overview()
        project_teams = {
            project["history"].get("team")
            for project in canonical["projects"]
            if project["history"].get("team")
        }
        return {
            "scope": scope,
            "bank_stats": stats,
            "document_count": documents.get("total", 0),
            "memory_count": memories.get("total", 0),
            "organization_counts": {
                "projects": canonical["project_count"],
                "employees": canonical["people_count"],
                "departments": canonical["department_count"],
                "teams": len(project_teams),
                "tasks": canonical["task_count"],
                "experiences": sum(item.get("record_kind") == "outcome" for item in timeline),
                "outcomes": outcome_counts,
                "current_reference_documents": self.rag.count(),
            },
            "documents": timeline,
            "rag_documents": self.rag.list_documents(),
            "memories": [
                self._memory_summary(memory) for memory in memories.get("items", [])
            ],
        }

    async def evaluate(self, scope: str = "demo") -> dict[str, Any]:
        tags = [DEMO_COMPANY_TAG] if scope == "demo" else ["learning:outcome"]
        results = []
        for case in EVALUATION_CASES:
            memories = await self.hindsight.search_memories(
                self.bank_id,
                case["query"],
                limit=4,
                tags=tags,
                tags_match="any_strict",
            )
            relevant = [
                memory for memory in memories
                if case["expected_tag"] in (memory.get("tags") or [])
            ]
            results.append({
                "case_id": case["id"],
                "title": case["title"],
                "query": case["query"],
                "retrieved_count": len(memories),
                "relevant_count": len(relevant),
                "expected_tag": case["expected_tag"],
                "matched_expected_memory": bool(relevant),
                "results": [self._memory_summary(memory) for memory in memories],
            })
        total = len(results)
        hits = sum(result["matched_expected_memory"] for result in results)
        return {
            "scope": scope,
            "cases_total": total,
            "cases_with_expected_memory": hits,
            "retrieval_coverage": hits / total if total else 0,
            "retrieved_facts": sum(result["retrieved_count"] for result in results),
            "cases": results,
        }