import logging
from datetime import date
from pathlib import Path

from app.database import SessionLocal
from app.models import (Department, Document, Employee, Message,
                        Conversation, Feedback, DocumentChunk, Organization,
                        Project, Relationship)

logger = logging.getLogger(__name__)

SAMPLE_DOCS_DIR = Path(__file__).parent / "sample_docs"

DOCS = {
    "phoenix_architecture.md": {
        "title": "Phoenix Architecture Decision Record",
        "doc_type": "TECHNICAL_DOCUMENT", "project": "Project Phoenix",
        "tags": ["architecture", "phoenix", "database"],
        "content": """# Phoenix Architecture Decision Record

## Overview
Project Phoenix migrates the customer analytics platform from the legacy PHP monolith to a modern service-oriented architecture. The platform serves 400,000 monthly active customers and processes roughly 12 million analytics events per day.

## System Architecture
The target architecture is a three-tier design:

- Frontend: React single-page application
- Backend: Python FastAPI services (catalog, ingestion, reporting)
- Data: PostgreSQL as the primary transactional datastore, Redis for caching and rate limiting

## Database Selection
PostgreSQL 16 was selected as the primary datastore. The decisive factors were:

1. Strong transactional consistency (full ACID compliance) for billing-grade accuracy
2. Relational data integrity across customer, subscription, and event entities
3. JSONB support for semi-structured analytics events without a second database
4. Deep team expertise — the database engineering group has run PostgreSQL at scale for six years
5. Mature tooling for backup, point-in-time recovery, and logical replication

MongoDB was considered for the event store but rejected because billing and subscription flows require multi-statement transactions with strict integrity guarantees.

## Scalability Plan
- Read replicas for reporting workloads, routed at the service layer
- Table partitioning by tenant_id for the events table
- Connection pooling via PgBouncer

## Security
Row-level security for tenant isolation, encryption at rest, and SOC 2 alignment following the Security Policy. Maria Garcia's team owns the security review.
""",
    },
    "database_decision.md": {
        "title": "Database Selection Decision — Project Phoenix",
        "doc_type": "DECISION", "project": "Project Phoenix",
        "tags": ["decision", "database", "postgresql"],
        "content": """# Database Selection Decision — Project Phoenix

## Decision
Project Phoenix will use PostgreSQL 16 as its primary transactional datastore.

Date: 2026-08-15
Status: Approved

## Options Considered
- PostgreSQL 16 — full ACID, relational integrity, JSONB, mature operations
- MongoDB 7 — flexible schema and horizontal scaling, but weaker multi-document transaction guarantees
- MySQL 8 — solid OLTP engine, but a thinner feature set for mixed analytical workloads

## Evaluation Criteria
1. Transactional consistency for billing and payment flows
2. Relational data integrity across customer entities
3. Operational maturity and in-house expertise
4. Ability to handle mixed OLTP plus lightweight analytics workloads

## Rationale
The project requires strong transactional consistency and relational data integrity for billing-grade customer data. PostgreSQL satisfied all four criteria, while MongoDB failed criterion one for our payment flows and MySQL scored lower on criterion four.

## Approval
The database selection was reviewed and approved by the Engineering leadership team as part of the phase-1 architecture sign-off.
""",
    },
    "engineering_standards.md": {
        "title": "Nexus Engineering Standards",
        "doc_type": "POLICY", "project": None, "department": "Engineering",
        "tags": ["standards", "policy"],
        "content": """# Nexus Technologies Engineering Standards

## Database Standards
- PostgreSQL is the company standard for transactional systems
- Every production database must have automated daily backups with point-in-time recovery
- Schema changes require a versioned migration script reviewed by the Database Guild
- No database may be reachable from the public internet

## API Standards
- All internal services expose REST or gRPC interfaces with a published OpenAPI specification
- Every endpoint requires authentication; service-to-service calls use short-lived tokens

## Code Review
- Minimum one reviewer for all changes; two reviewers for anything touching payment paths
- Reviews should complete within 24 hours

## Deployment
- All deployments follow the Deployment SOP, including a documented rollback plan
- Database migrations run before application rollout, and must be backward compatible
""",
    },
    "phoenix_project_plan.md": {
        "title": "Project Phoenix — Project Plan",
        "doc_type": "PROJECT", "project": "Project Phoenix",
        "tags": ["plan", "phoenix"],
        "content": """# Project Phoenix — Project Plan

## Objective
Migrate the customer analytics platform to a modern architecture while preserving zero-downtime service for 400,000 monthly active customers.

## Phases
- Phase 1 (Aug–Oct 2026): Core migration — billing, subscriptions, customer data
- Phase 2 (Nov–Dec 2026): Analytics and reporting workloads
- Phase 3 (Q1 2027): Legacy monolith decommission

## Team
- Sarah Chen — Project owner, architecture
- John Smith — Database engineering and migrations
- Alex Kim — Data pipeline and events
- Tom Becker — Quality assurance

## Milestones
- M1 (Aug 30): Architecture sign-off — complete
- M2 (Sep 30): Billing migration dual-write complete
- M3 (Oct 31): Cutover and legacy freeze

## Budget
Phase 1 budget is $480,000, including 15% contingency.
""",
    },
    "phoenix_meeting_notes.md": {
        "title": "Phoenix Weekly Sync — Sprint 14",
        "doc_type": "MEETING", "project": "Project Phoenix",
        "tags": ["meeting", "risks", "phoenix"],
        "content": """# Phoenix Weekly Sync — Sprint 14

Date: 2026-09-12
Attendees: Sarah Chen, John Smith, Alex Kim, Tom Becker

## Discussion
- Migration velocity is slower than planned; the legacy schema is more complex than estimated
- Initial dashboard queries are hitting 4-second p95 latency
- Security review with Maria Garcia is scheduled for next week to assess SOC 2 evidence readiness

## Risks Raised
- Data migration timeline risk — medium likelihood, high impact
- Query performance on unified analytics views — high likelihood, medium impact
- SOC 2 audit readiness — medium likelihood, medium impact

## Action Items
- John: implement composite indexes on customer_events by end of sprint
- Alex: prototype read-replica routing for the reporting service
- Sarah: escalate the timeline risk to the steering committee
""",
    },
    "phoenix_lessons_learned.md": {
        "title": "Project Phoenix — Lessons Learned",
        "doc_type": "LESSON", "project": "Project Phoenix",
        "tags": ["lessons", "retrospective", "phoenix"],
        "content": """# Project Phoenix — Lessons Learned (Phase 1)

## What Went Well
- Early investment in migration tooling paid off; dual-write verification caught three data drift issues before cutover rehearsal
- The PostgreSQL choice is validated: zero transactional integrity incidents in billing during dual-write
- Weekly syncs with a standing risk review kept issues visible early

## What Went Poorly
- Legacy schema complexity was underestimated by roughly 2x
- Missing composite indexes caused dashboard latency early in the phase
- SOC 2 evidence collection started too late

## Key Risks Going Forward
- Query performance on unified analytics views in Phase 2
- Coordination overhead with the Security team for audit evidence
- Knowledge concentration: only John fully understands the migration tooling

## Recommendations
- Reserve a 20% buffer for any schema-driven workstream
- Run an index strategy review before each analytics milestone
- Cross-train a second engineer on migration tooling
""",
    },
    "deployment_sop.md": {
        "title": "Deployment SOP",
        "doc_type": "PROCESS", "project": None, "department": "Engineering",
        "tags": ["sop", "deployment", "process"],
        "content": """# Deployment Standard Operating Procedure

## Scope
This SOP applies to all production deployments for customer-facing services.

## Pre-Deployment Checklist
1. All CI checks green and code review approved
2. Database migration scripts reviewed and rehearsed on staging
3. Backup verified within the last 24 hours
4. Rollback plan documented in the ticket

## Deployment Steps
1. Announce in #deployments with the ticket link
2. Run database migrations (must be backward compatible)
3. Deploy application in a rolling fashion, one instance at a time
4. Verify health checks and error rates for 10 minutes
5. Confirm key business metrics are nominal

## Rollback Procedure
1. Revert the application deployment to the previous image
2. Database rollbacks are not automated — restore from backup only as a last resort
3. Page the on-call engineer if rollback does not restore service within 15 minutes
""",
    },
    "security_policy.md": {
        "title": "Nexus Security Policy",
        "doc_type": "POLICY", "project": None, "department": "Engineering",
        "tags": ["security", "compliance"],
        "content": """# Nexus Technologies Security Policy

## Access Control
- Least privilege is mandatory; access reviews run quarterly
- Production access requires just-in-time approval and is logged

## Data Protection
- Encryption at rest for all production databases
- TLS 1.2 or higher for all data in transit
- Customer data may not be copied to non-production environments without anonymization

## Incident Response
- Severity 1 incidents require notification within 24 hours and a postmortem within 5 business days
- All incidents are tracked in the incident register

## Compliance
- SOC 2 Type II is the current certification target
- GDPR obligations apply to all EU customer data
""",
    },
}


def _wipe(db):
    for model in (Relationship, Message, Conversation, Feedback, DocumentChunk,
                  Document, Project, Employee, Department, Organization):
        db.query(model).delete()
    db.commit()


def run_seed(reset: bool = False) -> dict:
    db = SessionLocal()
    try:
        if reset:
            _wipe(db)
        if db.query(Organization).count() > 0:
            return {"status": "skipped",
                    "message": "Data already present (POST /api/seed?reset=true to wipe & reseed)"}

        # ── Organization ──────────────────────────────────────────
        org = Organization(name="Nexus Technologies", domain="nexus.example.com")
        db.add(org)
        db.flush()

        # ── Departments ───────────────────────────────────────────
        depts = {}
        for name, code in [("Engineering", "ENG"), ("Product", "PROD"),
                           ("Marketing", "MKT"), ("Operations", "OPS"),
                           ("Finance", "FIN")]:
            d = Department(org_id=org.id, name=name, code=code)
            db.add(d)
            depts[name] = d
        db.flush()

        # ── Employees (experts flagged) ───────────────────────────
        emp = {}
        people = [
            ("sarah", "Sarah Chen", "VP Engineering", "Engineering", True,
             ["architecture", "PostgreSQL", "distributed systems"]),
            ("john", "John Smith", "Senior Database Engineer", "Engineering", True,
             ["PostgreSQL", "performance tuning", "migrations"]),
            ("maria", "Maria Garcia", "Security Lead", "Engineering", True,
             ["security", "SOC 2", "incident response"]),
            ("david", "David Okafor", "DevOps Lead", "Engineering", True,
             ["Kubernetes", "CI/CD", "deployments"]),
            ("emily", "Emily Watson", "Product Manager", "Product", False,
             ["product strategy", "roadmapping"]),
            ("rachel", "Rachel Torres", "Engineering Manager", "Engineering", False,
             ["team leadership", "delivery"]),
            ("alex", "Alex Kim", "Data Engineer", "Engineering", False,
             ["data pipelines", "events"]),
            ("tom", "Tom Becker", "QA Lead", "Engineering", False,
             ["testing", "release quality"]),
        ]
        for key, name, title, dept, is_expert, tags in people:
            e = Employee(org_id=org.id, department_id=depts[dept].id, name=name,
                         email=f"{key}.{name.split()[-1].lower()}@nexus.example.com",
                         title=title, is_expert=is_expert, expertise_tags=tags)
            db.add(e)
            emp[key] = e
        db.flush()

        # ── Projects ──────────────────────────────────────────────
        phoenix = Project(org_id=org.id, name="Project Phoenix",
                           description="Customer analytics platform migration from legacy monolith",
                           status="active", owner_id=emp["sarah"].id,
                           department_id=depts["Engineering"].id,
                           technologies=["PostgreSQL", "Python", "FastAPI", "React", "Redis"],
                           start_date=date(2026, 8, 1))
        atlas = Project(org_id=org.id, name="Project Atlas",
                        description="Internal knowledge management system",
                        status="active", owner_id=emp["emily"].id,
                        department_id=depts["Product"].id,
                        technologies=["Next.js", "TypeScript", "PostgreSQL"],
                        start_date=date(2026, 6, 15))
        orion = Project(org_id=org.id, name="Project Orion",
                        description="ML-powered recommendation engine",
                        status="active", owner_id=emp["rachel"].id,
                        department_id=depts["Engineering"].id,
                        technologies=["Python", "PyTorch", "Kubernetes"],
                        start_date=date(2026, 7, 1))
        db.add_all([phoenix, atlas, orion])
        db.commit()

        # ── Knowledge graph relationships ─────────────────────────
        def rel(src_type, src_id, src_label, rtype, tgt_type, tgt_id, tgt_label):
            db.add(Relationship(source_type=src_type, source_id=src_id,
                                source_label=src_label, relationship_type=rtype,
                                target_type=tgt_type, target_id=tgt_id,
                                target_label=tgt_label))

        rel("project", phoenix.id, phoenix.name, "owned_by", "employee",
            emp["sarah"].id, emp["sarah"].name)
        for tech in phoenix.technologies:
            rel("project", phoenix.id, phoenix.name, "uses", "technology", None, tech)
        rel("project", atlas.id, atlas.name, "owned_by", "employee",
            emp["emily"].id, emp["emily"].name)
        for tech in atlas.technologies:
            rel("project", atlas.id, atlas.name, "uses", "technology", None, tech)
        rel("project", orion.id, orion.name, "owned_by", "employee",
            emp["rachel"].id, emp["rachel"].name)
        for tech in orion.technologies:
            rel("project", orion.id, orion.name, "uses", "technology", None, tech)
        db.commit()

        # ── Documents: through the REAL ingestion pipeline ────────
        from app.services.ingestion import ingest_document
        SAMPLE_DOCS_DIR.mkdir(parents=True, exist_ok=True)
        dept_engineering_id = str(depts["Engineering"].id)

        ingested = []
        for filename, spec in DOCS.items():
            path = SAMPLE_DOCS_DIR / filename
            path.write_text(spec["content"], encoding="utf-8")
            result = ingest_document(
                db, str(path), filename, title=spec["title"],
                doc_type=spec["doc_type"],
                project_name=spec.get("project"),
                department_id=dept_engineering_id if spec.get("department") else None,
                tags=spec.get("tags"))
            ingested.append({"title": spec["title"], "status": result["status"],
                             "chunks": result.get("chunks", 0)})

        # ── Project ↔ document graph edges (decisions highlighted) ─
        for doc in db.query(Document).all():
            if doc.project_id:
                project = db.get(Project, doc.project_id)
                rel("project", project.id, project.name, "documented_by",
                    "document", doc.id, doc.title)
                if doc.doc_type == "DECISION":
                    rel("project", project.id, project.name, "has_decision",
                        "document", doc.id, doc.title)
        db.commit()

        logger.info("✅ Seeded Nexus Technologies: %d employees, 3 projects, %d documents",
                    len(people), len(ingested))
        return {"status": "ok", "message": "Nexus Technologies seeded",
                "documents": ingested}
    except Exception as e:
        db.rollback()
        logger.exception("Seeding failed")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()