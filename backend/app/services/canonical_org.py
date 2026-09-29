from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
from typing import Any

from app.services.organizational_seed import CURRENT_RAG_DOCUMENTS, PROJECT_HISTORIES
from app.services.rag_knowledge import RAGKnowledgeStore


ORGANIZATION_SEED = {
    "id": "ORG-001",
    "name": "Nexora Systems",
    "description": "A fictional but internally consistent enterprise technology organization."
}

DEPARTMENTS = [
    {"id": "DEPT-ENG", "name": "Engineering", "lead": "Asha Raman"},
    {"id": "DEPT-PROD", "name": "Product", "lead": "Imani Okafor"},
    {"id": "DEPT-QA", "name": "Quality Engineering", "lead": "Priya Nair"},
    {"id": "DEPT-SEC", "name": "Security", "lead": "Owen Brooks"},
    {"id": "DEPT-OPS", "name": "Operations", "lead": "Elena Petrova"},
]

PEOPLE = [
    {"id": "EMP-001", "name": "Asha Raman", "role": "Backend Engineer", "department_id": "DEPT-ENG", "skills": ["PostgreSQL", "FastAPI", "system design"], "expertise": ["database migration", "API reliability", "event processing"], "projects": ["PRJ-PHX", "PRJ-PAY", "PRJ-DOC"]},
    {"id": "EMP-002", "name": "Lucas Wei", "role": "Frontend Engineer", "department_id": "DEPT-ENG", "skills": ["React", "TypeScript", "Web performance"], "expertise": ["frontend reliability", "authentication UX"], "projects": ["PRJ-AUTH", "PRJ-ATL"]},
    {"id": "EMP-003", "name": "Noor Haddad", "role": "ML Engineer", "department_id": "DEPT-ENG", "skills": ["Python", "ranking", "feature engineering"], "expertise": ["recommendation systems", "cold-start retrieval"], "projects": ["PRJ-REC", "PRJ-ML"]},
    {"id": "EMP-004", "name": "Mateo Silva", "role": "DevOps Engineer", "department_id": "DEPT-ENG", "skills": ["Kubernetes", "CI/CD", "observability"], "expertise": ["rollout safety", "deployment automation"], "projects": ["PRJ-DOC", "PRJ-REL", "PRJ-OPS"]},
    {"id": "EMP-005", "name": "Priya Nair", "role": "QA Engineer", "department_id": "DEPT-QA", "skills": ["test strategy", "load testing", "verification"], "expertise": ["migration validation", "replay testing"], "projects": ["PRJ-PHX", "PRJ-PAY", "PRJ-REC"]},
    {"id": "EMP-006", "name": "Imani Okafor", "role": "Product Manager", "department_id": "DEPT-PROD", "skills": ["roadmapping", "prioritization", "governance"], "expertise": ["product strategy", "release gating"], "projects": ["PRJ-REC", "PRJ-ATL", "PRJ-PHX"]},
    {"id": "EMP-007", "name": "Owen Brooks", "role": "Security Engineer", "department_id": "DEPT-SEC", "skills": ["identity", "threat modeling", "audit"], "expertise": ["JWT flows", "revocation design"], "projects": ["PRJ-AUTH", "PRJ-SEC", "PRJ-OPS"]},
    {"id": "EMP-008", "name": "Elena Petrova", "role": "Site Reliability Engineer", "department_id": "DEPT-OPS", "skills": ["SRE", "incident response", "monitoring"], "expertise": ["database saturation", "deployments"], "projects": ["PRJ-ATL", "PRJ-PHX", "PRJ-OPS"]},
    {"id": "EMP-009", "name": "Ravi Shah", "role": "Data Engineer", "department_id": "DEPT-ENG", "skills": ["Kafka", "ETL", "analytics"], "expertise": ["event pipelines", "data quality"], "projects": ["PRJ-PAY", "PRJ-ML", "PRJ-DATA"]},
    {"id": "EMP-010", "name": "Mia Chen", "role": "Operations Analyst", "department_id": "DEPT-OPS", "skills": ["incident triage", "workflow", "reporting"], "expertise": ["operational review", "deployment follow-up"], "projects": ["PRJ-REL", "PRJ-OPS", "PRJ-PAY"]},
    {"id": "EMP-011", "name": "Arjun Rao", "role": "Database Engineer", "department_id": "DEPT-ENG", "skills": ["PostgreSQL", "partitioning", "database tuning"], "expertise": ["migration latency", "connection pooling"], "projects": ["PRJ-PHX", "PRJ-ATL", "PRJ-DATA"]},
    {"id": "EMP-012", "name": "Meera Shah", "role": "Platform Engineer", "department_id": "DEPT-ENG", "skills": ["Redis", "caching", "API performance"], "expertise": ["latency optimization", "cache warming"], "projects": ["PRJ-ATL", "PRJ-PAY", "PRJ-OPS"]},
    {"id": "EMP-013", "name": "Haruto Sato", "role": "Data Quality Lead", "department_id": "DEPT-QA", "skills": ["data validation", "quality gates", "monitoring"], "expertise": ["schema drift", "data parity"], "projects": ["PRJ-DATA", "PRJ-PHX"]},
    {"id": "EMP-014", "name": "Nina Patel", "role": "Security Operations Analyst", "department_id": "DEPT-SEC", "skills": ["audit", "secrets management", "logging"], "expertise": ["security review", "approval governance"], "projects": ["PRJ-SEC", "PRJ-AUTH"]},
    {"id": "EMP-015", "name": "Chris Novak", "role": "Service Reliability Engineer", "department_id": "DEPT-OPS", "skills": ["alerting", "incident management", "deployment"], "expertise": ["rollout rollback", "operational playbooks"], "projects": ["PRJ-REL", "PRJ-ATL", "PRJ-DOC"]},
    {"id": "EMP-016", "name": "Sofia Gomez", "role": "Product Analyst", "department_id": "DEPT-PROD", "skills": ["requirements", "stakeholder communication", "risk analysis"], "expertise": ["requirements refinement", "decision evaluation"], "projects": ["PRJ-PHX", "PRJ-REC", "PRJ-ATL"]},
    {"id": "EMP-017", "name": "Daniel Park", "role": "Systems Engineer", "department_id": "DEPT-ENG", "skills": ["Linux", "load testing", "networking"], "expertise": ["capacity planning", "traffic shaping"], "projects": ["PRJ-ATL", "PRJ-OPS", "PRJ-DATA"]},
    {"id": "EMP-018", "name": "Leah Martin", "role": "API Platform Engineer", "department_id": "DEPT-ENG", "skills": ["API gateways", "rate limiting", "authentication"], "expertise": ["gateway controls", "latency containment"], "projects": ["PRJ-AUTH", "PRJ-SEC", "PRJ-PAY"]},
    {"id": "EMP-019", "name": "Jae Park", "role": "AI Safety Analyst", "department_id": "DEPT-ENG", "skills": ["ML evaluation", "risk review", "model observability"], "expertise": ["policy evaluation", "model governance"], "projects": ["PRJ-REC", "PRJ-ML"]},
    {"id": "EMP-020", "name": "Tara Nguyen", "role": "Operations Lead", "department_id": "DEPT-OPS", "skills": ["incident drills", "runbooks", "resilience"], "expertise": ["failure response", "deployment recovery"], "projects": ["PRJ-REL", "PRJ-OPS", "PRJ-PAY"]},
]

PROJECTS = [
    {"id": "PRJ-PHX", "code": "PROJ-PHX", "name": "Phoenix Data Migration", "department_id": "DEPT-ENG", "owner_id": "EMP-011", "status": "Completed", "architecture": "PostgreSQL migration with staged rollout and observability", "requirements": "Migrate payroll and billing datasets with zero-drift reconciliation", "technology_stack": ["PostgreSQL", "FastAPI", "Kafka", "Redis"], "tasks": ["TASK-PHX-01", "TASK-PHX-02"], "problem_history": ["database latency during migration", "connection saturation", "batch-size tuning"]},
    {"id": "PRJ-ATL", "code": "PROJ-ATL", "name": "Atlas Analytics Platform", "department_id": "DEPT-ENG", "owner_id": "EMP-012", "status": "In Progress", "architecture": "Distributed PostgreSQL plus Redis cache and edge telemetry", "requirements": "Reduce p95 latency while preserving regional consistency", "technology_stack": ["PostgreSQL", "Redis", "FastAPI", "Grafana"], "tasks": ["TASK-ATL-01", "TASK-ATL-02"], "problem_history": ["database latency", "cache warming", "migration pressure"]},
    {"id": "PRJ-AUTH", "code": "PROJ-AUTH", "name": "Orion Authentication Service", "department_id": "DEPT-SEC", "owner_id": "EMP-018", "status": "In Progress", "architecture": "JWT and refresh-token rotation with strict replay detection", "requirements": "Secure long-lived sessions while preserving user continuity", "technology_stack": ["JWT", "OAuth 2.0", "Redis", "FastAPI"], "tasks": ["TASK-AUTH-01", "TASK-AUTH-02"], "problem_history": ["session continuity", "token expiry", "refresh race conditions"]},
    {"id": "PRJ-PAY", "code": "PROJ-PAY", "name": "Mercury Payment Platform", "department_id": "DEPT-ENG", "owner_id": "EMP-001", "status": "Deployed", "architecture": "Payment event service with safety checks and idempotent ledger writes", "requirements": "Ensure stable webhook delivery under provider throttling", "technology_stack": ["FastAPI", "PostgreSQL", "webhooks", "Redis"], "tasks": ["TASK-PAY-01", "TASK-PAY-02"], "problem_history": ["HTTP 429", "retry bursts", "duplicate event handling"]},
    {"id": "PRJ-REC", "code": "PROJ-REC", "name": "Vega ML Recommendation Engine", "department_id": "DEPT-ENG", "owner_id": "EMP-003", "status": "Under Review", "architecture": "Hybrid ranking with content and collaborative features", "requirements": "Improve cold-start recommendation quality for new users", "technology_stack": ["Python", "ranking", "feature pipelines", "model serving"], "tasks": ["TASK-REC-01", "TASK-REC-02"], "problem_history": ["cold-start failure", "feature normalization", "ranking drift"]},
    {"id": "PRJ-DOC", "code": "PROJ-DOC", "name": "Comet Document Processing", "department_id": "DEPT-ENG", "owner_id": "EMP-004", "status": "Deployed", "architecture": "Background ingestion service with async parsing and traceability", "requirements": "Process large uploaded documents without blocking user requests", "technology_stack": ["FastAPI", "PDF parsing", "background workers"], "tasks": ["TASK-DOC-01", "TASK-DOC-02"], "problem_history": ["document parse timeout", "async processing", "operation tracking"]},
    {"id": "PRJ-DATA", "code": "PROJ-DATA", "name": "Terra Data Warehouse", "department_id": "DEPT-ENG", "owner_id": "EMP-013", "status": "In Progress", "architecture": "Quality validation and schema drift detection across analytics services", "requirements": "Surface data drift and ensure pipeline consistency", "technology_stack": ["Kafka", "PostgreSQL", "Python"], "tasks": ["TASK-DATA-01"], "problem_history": ["data drift", "quality gates", "pipeline parity"]},
    {"id": "PRJ-REL", "code": "PROJ-REL", "name": "Polaris DevOps Platform", "department_id": "DEPT-SEC", "owner_id": "EMP-015", "status": "Blocked", "architecture": "Role-aware gateway with release gating and operational rollback", "requirements": "Protect service network while keeping deployment and recovery paths safe", "technology_stack": ["Docker", "CI/CD", "immutable image digests"], "tasks": ["TASK-REL-01"], "problem_history": ["deployment failures", "rollback", "gateway policy mismatch"]},
    {"id": "PRJ-OPS", "code": "PROJ-OPS", "name": "Aurora Reporting Service", "department_id": "DEPT-OPS", "owner_id": "EMP-020", "status": "In Progress", "architecture": "Reporting and alerting service with operational runbooks", "requirements": "Improve uptime visibility and incident response clarity", "technology_stack": ["Grafana", "Prometheus", "FastAPI"], "tasks": ["TASK-OPS-01", "TASK-OPS-02"], "problem_history": ["incident response", "alert clarity", "runbook drift"]},
    {"id": "PRJ-ML", "code": "PROJ-ML", "name": "Vertex AI Support Assistant", "department_id": "DEPT-ENG", "owner_id": "EMP-019", "status": "Under Review", "architecture": "Multi-model inference and safety evaluation pipeline", "requirements": "Serve explainable ML feedback with safe degradation", "technology_stack": ["Python", "model serving", "RAG", "monitoring"], "tasks": ["TASK-ML-01"], "problem_history": ["model drift", "QA review", "observability gaps"]},
    {"id": "PRJ-SEC", "code": "PROJ-SEC", "name": "Eclipse Search Platform", "department_id": "DEPT-SEC", "owner_id": "EMP-014", "status": "Deployed", "architecture": "Search and access control with permission-aware indexing", "requirements": "Make search and access policy consistent across all content", "technology_stack": ["vector search", "RBAC", "indexing"], "tasks": ["TASK-SEC-01"], "problem_history": ["permission mismatch", "search indexing", "access review"]},
    {"id": "PRJ-NOV", "code": "PROJ-NOV", "name": "Titan API Gateway", "department_id": "DEPT-ENG", "owner_id": "EMP-018", "status": "Completed", "architecture": "Gateway and routing layer with rate limiting and caching", "requirements": "Protect upstream services while improving latency and reuse", "technology_stack": ["Gateway", "Redis", "rate limiting"], "tasks": ["TASK-NOV-01"], "problem_history": ["rate-limiting", "cache TTL", "latency spikes"]},
    {"id": "PRJ-APO", "code": "PROJ-APO", "name": "Nova Customer Portal", "department_id": "DEPT-PROD", "owner_id": "EMP-016", "status": "In Progress", "architecture": "Portal service and access-sensitive account views", "requirements": "Provide account actions without unsafe caching", "technology_stack": ["React", "FastAPI", "identity tokens"], "tasks": ["TASK-APO-01"], "problem_history": ["customer session continuity", "token expiry", "UX reliability"]},
    {"id": "PRJ-TIT", "code": "PROJ-TIT", "name": "Apollo Notification Service", "department_id": "DEPT-ENG", "owner_id": "EMP-004", "status": "Under Review", "architecture": "Notification fan-out with retry and idempotency controls", "requirements": "Deliver user notifications at scale without duplicate sends", "technology_stack": ["Queue", "retry policy", "webhooks"], "tasks": ["TASK-TIT-01"], "problem_history": ["duplicate sends", "retry bursts", "failed delivery visibility"]},
    {"id": "PRJ-VEG", "code": "PROJ-VEG", "name": "Helios Observability Platform", "department_id": "DEPT-OPS", "owner_id": "EMP-008", "status": "In Progress", "architecture": "Trace, metric, and event correlations for incident analysis", "requirements": "Improve signal quality and incident triage", "technology_stack": ["OpenTelemetry", "Prometheus", "Grafana"], "tasks": ["TASK-VEG-01"], "problem_history": ["alert noise", "slow signals", "observability gaps"]},
    {"id": "PRJ-LUN", "code": "PROJ-LUN", "name": "Luna Mobile Application", "department_id": "DEPT-ENG", "owner_id": "EMP-004", "status": "Delayed", "architecture": "Mobile client with resumable document upload and identity-scoped local state", "requirements": "Preserve user work across network loss without duplicate uploads", "technology_stack": ["React Native", "OAuth 2.0", "background uploads"], "tasks": ["TASK-LUN-01"], "problem_history": ["document inconsistency", "network interruption", "session continuity"]},
    {"id": "PRJ-POL", "code": "PROJ-POL", "name": "Zenith Security Platform", "department_id": "DEPT-SEC", "owner_id": "EMP-014", "status": "Under Review", "architecture": "Policy evaluation and approval workflow", "requirements": "Enforce approval and access controls without blocking operations", "technology_stack": ["policy engine", "approval rules", "audit"], "tasks": ["TASK-POL-01"], "problem_history": ["approval delays", "governance conflicts", "policy drift"]},
    {"id": "PRJ-ECL", "code": "PROJ-ECL", "name": "Neptune Workflow Engine", "department_id": "DEPT-ENG", "owner_id": "EMP-017", "status": "In Progress", "architecture": "Workflow orchestration with durable state, retries, and rollback control", "requirements": "Support multi-step workflows with safe rerun semantics", "technology_stack": ["workflow engine", "state machine", "queues"], "tasks": ["TASK-ECL-01"], "problem_history": ["parallel retries", "workflow drift", "state resets"]},
]

TASKS = [
    {"id": "TASK-PHX-01", "project_id": "PRJ-PHX", "owner_id": "EMP-011", "status": "Completed", "title": "PostgreSQL migration batch tuning"},
    {"id": "TASK-PHX-02", "project_id": "PRJ-PHX", "owner_id": "EMP-011", "status": "Completed", "title": "Database connection pool review"},
    {"id": "TASK-ATL-01", "project_id": "PRJ-ATL", "owner_id": "EMP-012", "status": "In Progress", "title": "Redis cache warm-up and latency analysis"},
    {"id": "TASK-ATL-02", "project_id": "PRJ-ATL", "owner_id": "EMP-011", "status": "In Progress", "title": "Migration connection saturation analysis"},
    {"id": "TASK-AUTH-01", "project_id": "PRJ-AUTH", "owner_id": "EMP-018", "status": "Completed", "title": "Session continuity token refresh"},
    {"id": "TASK-AUTH-02", "project_id": "PRJ-AUTH", "owner_id": "EMP-018", "status": "Reopened", "title": "Mobile refresh token race handling"},
    {"id": "TASK-PAY-01", "project_id": "PRJ-PAY", "owner_id": "EMP-001", "status": "Completed", "title": "Webhook retry burst prevention"},
    {"id": "TASK-PAY-02", "project_id": "PRJ-PAY", "owner_id": "EMP-001", "status": "Deployed", "title": "Idempotent event processing"},
    {"id": "TASK-REC-01", "project_id": "PRJ-REC", "owner_id": "EMP-003", "status": "Under Review", "title": "Cold-start recommendation evaluation"},
    {"id": "TASK-REC-02", "project_id": "PRJ-REC", "owner_id": "EMP-003", "status": "Blocked", "title": "Feature parity check"},
    {"id": "TASK-DOC-01", "project_id": "PRJ-DOC", "owner_id": "EMP-004", "status": "Failed", "title": "Synchronous parsing prototype"},
    {"id": "TASK-DOC-02", "project_id": "PRJ-DOC", "owner_id": "EMP-004", "status": "Deployed", "title": "Operation tracking for large documents"},
    {"id": "TASK-DATA-01", "project_id": "PRJ-DATA", "owner_id": "EMP-013", "status": "In Progress", "title": "Data quality drift detection"},
    {"id": "TASK-REL-01", "project_id": "PRJ-REL", "owner_id": "EMP-015", "status": "Rolled Back", "title": "All-at-once gateway configuration rollout"},
    {"id": "TASK-OPS-01", "project_id": "PRJ-OPS", "owner_id": "EMP-020", "status": "In Progress", "title": "Incident runbook refinement"},
    {"id": "TASK-OPS-02", "project_id": "PRJ-OPS", "owner_id": "EMP-010", "status": "Cancelled", "title": "Live-table report query prototype"},
    {"id": "TASK-ML-01", "project_id": "PRJ-ML", "owner_id": "EMP-019", "status": "Under Review", "title": "Model anomaly detection review"},
    {"id": "TASK-SEC-01", "project_id": "PRJ-SEC", "owner_id": "EMP-014", "status": "Deployed", "title": "Access-control search indexing"},
    {"id": "TASK-NOV-01", "project_id": "PRJ-NOV", "owner_id": "EMP-018", "status": "Completed", "title": "Rate-limit and cache tuning"},
    {"id": "TASK-APO-01", "project_id": "PRJ-APO", "owner_id": "EMP-016", "status": "In Progress", "title": "Session continuity in customer portal"},
    {"id": "TASK-TIT-01", "project_id": "PRJ-TIT", "owner_id": "EMP-004", "status": "Waiting for approval", "title": "Per-recipient notification retry refinement"},
    {"id": "TASK-VEG-01", "project_id": "PRJ-VEG", "owner_id": "EMP-008", "status": "In Progress", "title": "Observability signal normalization"},
    {"id": "TASK-LUN-01", "project_id": "PRJ-LUN", "owner_id": "EMP-004", "status": "Delayed", "title": "Resumable mobile upload verification"},
    {"id": "TASK-POL-01", "project_id": "PRJ-POL", "owner_id": "EMP-014", "status": "Under Review", "title": "Approval workflow tuning"},
    {"id": "TASK-ECL-01", "project_id": "PRJ-ECL", "owner_id": "EMP-017", "status": "In Progress", "title": "Workflow retry coordination review"},
]

RAG_DOCS = CURRENT_RAG_DOCUMENTS

PROJECT_TEAMS = {
    "PRJ-PHX": "Data Platform", "PRJ-ATL": "Data Platform",
    "PRJ-APO": "Frontend", "PRJ-AUTH": "Security Engineering",
    "PRJ-PAY": "Backend", "PRJ-TIT": "Backend", "PRJ-NOV": "Backend",
    "PRJ-REC": "AI/ML", "PRJ-VEG": "Site Reliability",
    "PRJ-LUN": "Frontend", "PRJ-OPS": "Site Reliability",
    "PRJ-SEC": "Security Engineering", "PRJ-ECL": "Backend",
    "PRJ-REL": "DevOps", "PRJ-DOC": "DevOps",
    "PRJ-POL": "Security Engineering", "PRJ-DATA": "Data Platform",
    "PRJ-ML": "AI/ML",
}


def _iter_keywords(problem_text: str) -> list[str]:
    lower = problem_text.lower()
    if not lower:
        return []
    return [word for word in re.findall(r"[a-z0-9]+", lower) if len(word) > 2]


class OrganizationalBrainStore:
    def __init__(self, db_path: str | None = None):
        base = Path(__file__).resolve().parents[1]
        self.db_path = Path(db_path) if db_path else base / "data" / "organizational_brain.db"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.db_path))
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS organization (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS departments (
                    id TEXT PRIMARY KEY,
                    organization_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    lead TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS people (
                    id TEXT PRIMARY KEY,
                    organization_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    department_id TEXT NOT NULL,
                    skills TEXT NOT NULL,
                    expertise TEXT NOT NULL,
                    projects TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    organization_id TEXT NOT NULL,
                    code TEXT NOT NULL,
                    name TEXT NOT NULL,
                    department_id TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    architecture TEXT NOT NULL,
                    requirements TEXT NOT NULL,
                    technology_stack TEXT NOT NULL,
                    tasks TEXT NOT NULL,
                    problem_history TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    owner_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    title TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """CREATE TABLE IF NOT EXISTS project_histories (
                    project_id TEXT PRIMARY KEY,
                    history_json TEXT NOT NULL
                )"""
            )
            conn.execute("SELECT COUNT(*) FROM organization")
            count = conn.execute("SELECT COUNT(*) FROM organization").fetchone()[0]
            if count == 0:
                conn.execute("INSERT INTO organization (id, name, description) VALUES (?, ?, ?)", (ORGANIZATION_SEED["id"], ORGANIZATION_SEED["name"], ORGANIZATION_SEED["description"]))
                for dept in DEPARTMENTS:
                    conn.execute(
                        "INSERT INTO departments (id, organization_id, name, lead) VALUES (?, ?, ?, ?)",
                        (dept["id"], ORGANIZATION_SEED["id"], dept["name"], dept["lead"]),
                    )
                for person in PEOPLE:
                    conn.execute(
                        "INSERT INTO people (id, organization_id, name, role, department_id, skills, expertise, projects) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        (
                            person["id"],
                            ORGANIZATION_SEED["id"],
                            person["name"],
                            person["role"],
                            person["department_id"],
                            json.dumps(person["skills"]),
                            json.dumps(person["expertise"]),
                            json.dumps(person["projects"]),
                        ),
                    )
                for project in PROJECTS:
                    conn.execute(
                        "INSERT INTO projects (id, organization_id, code, name, department_id, owner_id, status, architecture, requirements, technology_stack, tasks, problem_history) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (
                            project["id"],
                            ORGANIZATION_SEED["id"],
                            project["code"],
                            project["name"],
                            project["department_id"],
                            project["owner_id"],
                            project["status"],
                            project["architecture"],
                            project["requirements"],
                            json.dumps(project["technology_stack"]),
                            json.dumps(project["tasks"]),
                            json.dumps(project["problem_history"]),
                        ),
                    )
                for task in TASKS:
                    conn.execute(
                        "INSERT INTO tasks (id, project_id, owner_id, status, title) VALUES (?, ?, ?, ?, ?)",
                        (task["id"], task["project_id"], task["owner_id"], task["status"], task["title"]),
                    )
            for project in PROJECTS:
                conn.execute(
                    """INSERT INTO projects
                    (id, organization_id, code, name, department_id, owner_id, status,
                     architecture, requirements, technology_stack, tasks, problem_history)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        code=excluded.code, name=excluded.name,
                        department_id=excluded.department_id, owner_id=excluded.owner_id,
                        architecture=excluded.architecture, requirements=excluded.requirements,
                        technology_stack=excluded.technology_stack, tasks=excluded.tasks,
                        problem_history=excluded.problem_history""",
                    (
                        project["id"], ORGANIZATION_SEED["id"], project["code"],
                        project["name"], project["department_id"], project["owner_id"],
                        project["status"], project["architecture"], project["requirements"],
                        json.dumps(project["technology_stack"]), json.dumps(project["tasks"]),
                        json.dumps(project["problem_history"]),
                    ),
                )
            for task in TASKS:
                conn.execute(
                    """INSERT INTO tasks (id, project_id, owner_id, status, title)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id,
                    owner_id=excluded.owner_id, status=excluded.status, title=excluded.title""",
                    (task["id"], task["project_id"], task["owner_id"], task["status"], task["title"]),
                )
            for history in PROJECT_HISTORIES:
                project = next(item for item in PROJECTS if item["id"] == history["project_id"])
                department = next(item for item in DEPARTMENTS if item["id"] == project["department_id"])
                related_people = [
                    person["id"] for person in PEOPLE
                    if person["id"] != project["owner_id"]
                    and project["id"] in person["projects"]
                ]
                if len(related_people) < 2:
                    related_people.extend(
                        person["id"] for person in PEOPLE
                        if person["department_id"] == project["department_id"]
                        and person["id"] != project["owner_id"]
                        and person["id"] not in related_people
                    )
                project_tasks = [task for task in TASKS if task["project_id"] == project["id"]]
                people_by_id = {person["id"]: person["name"] for person in PEOPLE}
                full_history = {
                    **history,
                    "project_name": project["name"],
                    "department_id": project["department_id"],
                    "department": department["name"],
                    "team": PROJECT_TEAMS[project["id"]],
                    "owner_id": project["owner_id"],
                    "owner_name": people_by_id[project["owner_id"]],
                    "contributor_ids": related_people[:3],
                    "contributor_names": [people_by_id[person_id] for person_id in related_people[:3]],
                    "description": project["requirements"],
                    "requirements": project["requirements"],
                    "technologies": project["technology_stack"],
                    "architecture": project["architecture"],
                    "tasks": project_tasks,
                    "task_ids": [task["id"] for task in project_tasks],
                }
                conn.execute(
                    """INSERT INTO project_histories (project_id, history_json)
                    VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET
                    history_json=excluded.history_json""",
                    (history["project_id"], json.dumps(full_history)),
                )

    def get_overview(self) -> dict[str, Any]:
        with self._connect() as conn:
            org = conn.execute("SELECT * FROM organization LIMIT 1").fetchone()
            departments = conn.execute("SELECT * FROM departments ORDER BY name").fetchall()
            people = conn.execute("SELECT * FROM people ORDER BY name").fetchall()
            projects = conn.execute("SELECT * FROM projects ORDER BY name").fetchall()
            tasks = conn.execute("SELECT * FROM tasks").fetchall()
            histories = {
                row["project_id"]: json.loads(row["history_json"])
                for row in conn.execute("SELECT * FROM project_histories").fetchall()
            }
            organization = {
                "id": org["id"],
                "name": org["name"],
                "description": org["description"],
            }
            department_rows = [dict(row) for row in departments]
            people_rows = [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "role": row["role"],
                    "department_id": row["department_id"],
                    "skills": json.loads(row["skills"]),
                    "expertise": json.loads(row["expertise"]),
                    "projects": json.loads(row["projects"]),
                }
                for row in people
            ]
            project_rows = [
                {
                    "id": row["id"],
                    "code": row["code"],
                    "name": row["name"],
                    "department_id": row["department_id"],
                    "owner_id": row["owner_id"],
                    "status": row["status"],
                    "architecture": row["architecture"],
                    "requirements": row["requirements"],
                    "technology_stack": json.loads(row["technology_stack"]),
                    "tasks": json.loads(row["tasks"]),
                    "problem_history": json.loads(row["problem_history"]),
                    "history": histories.get(row["id"], {}),
                }
                for row in projects
            ]
            return {
                "organization": organization,
                "departments": department_rows,
                "people": people_rows,
                "projects": project_rows,
                "project_count": len(project_rows),
                "people_count": len(people_rows),
                "department_count": len(department_rows),
                "task_count": len(tasks),
                "project_history_count": len(histories),
                "active_tasks": sum(1 for row in tasks if row["status"] not in {"Completed", "Deployed", "Approved"}),
            }

    def get_project_by_code(self, code: str) -> dict[str, Any] | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM projects WHERE code = ? LIMIT 1", (code,)).fetchone()
            if row is None:
                return None
            return {
                "id": row["id"],
                "code": row["code"],
                "name": row["name"],
                "department_id": row["department_id"],
                "owner_id": row["owner_id"],
                "status": row["status"],
                "architecture": row["architecture"],
                "requirements": row["requirements"],
                "technology_stack": json.loads(row["technology_stack"]),
                "tasks": json.loads(row["tasks"]),
                "problem_history": json.loads(row["problem_history"]),
                "history": next((history for history in PROJECT_HISTORIES if history["project_id"] == row["id"]), {}),
            }

    def list_projects(self) -> list[dict[str, Any]]:
        return self.get_overview()["projects"]

    def list_people(self) -> list[dict[str, Any]]:
        return self.get_overview()["people"]

    def search_projects(self, problem_text: str, limit: int = 6) -> list[dict[str, Any]]:
        query_terms = RAGKnowledgeStore.tokenize(problem_text)
        if not query_terms:
            return []
        ranked = []
        for project in self.list_projects():
            searchable = json.dumps(project, ensure_ascii=True).casefold()
            project_terms = RAGKnowledgeStore.tokenize(searchable)
            overlap = query_terms & project_terms
            title_overlap = query_terms & RAGKnowledgeStore.tokenize(project["name"])
            if len(overlap) >= 2 or title_overlap:
                score = len(overlap) + 2 * len(title_overlap)
                ranked.append((score, project["id"], project))
        ranked.sort(key=lambda item: (-item[0], item[1]))
        return [project for _, _, project in ranked[:limit]]

    def build_brain_context(self, problem_text: str) -> dict[str, Any]:
        projects = self.search_projects(problem_text)
        rag_documents = RAGKnowledgeStore().search(problem_text)
        canonical_context = [
            {
                "source_type": "canonical", "source_id": project["id"],
                "title": project["name"], "project_id": project["id"],
                "summary": f"{project['name']} is currently {project['status']}. {project['requirements']}",
            }
            for project in projects
        ]
        rag_context = [
            {
                "source_type": "rag", "source_id": document["id"],
                "title": document["title"], "project_id": document.get("project_id"),
                "summary": document["content"],
            }
            for document in rag_documents
        ]
        evidence = canonical_context + rag_context
        hindsight_message = "Historical Hindsight evidence is retrieved only by the live asynchronous comparison endpoint."
        return {
            "problem_text": problem_text,
            "canonical_context": canonical_context,
            "rag_context": [item["summary"] for item in rag_context],
            "hindsight_context": [],
            "recommendation": None,
            "rag_message": "" if rag_context else "No relevant current organizational documentation was found.",
            "hindsight_message": hindsight_message,
            "evidence": evidence,
            "lineage": {
                "canonical_source_ids": [item["source_id"] for item in canonical_context],
                "rag_source_ids": [item["source_id"] for item in rag_context],
                "hindsight_source_ids": [],
            },
        }


_global_store = OrganizationalBrainStore()


def build_brain_context(store: OrganizationalBrainStore, problem_text: str) -> dict[str, Any]:
    return store.build_brain_context(problem_text)


def get_organization_store() -> OrganizationalBrainStore:
    return _global_store
