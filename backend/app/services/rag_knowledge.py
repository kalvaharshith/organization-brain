from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
from typing import Any

from app.services.organizational_seed import CURRENT_RAG_DOCUMENTS


_STOP_WORDS = {
    "about", "after", "against", "also", "been", "being", "could", "during",
        "for", "from", "have", "into", "more", "other", "should", "some", "than", "that",
        "need", "needs", "product", "service",
    "their", "there", "these", "this", "those", "through", "under", "using",
    "were", "what", "when", "where", "which", "while", "with", "would",
}


class RAGKnowledgeStore:
    """Persistent current/reference knowledge, separate from canonical state and Hindsight."""

    def __init__(self, db_path: str | Path | None = None):
        base = Path(__file__).resolve().parents[1]
        self.db_path = Path(db_path) if db_path else base / "data" / "rag_knowledge.db"
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(str(self.db_path))
        connection.row_factory = sqlite3.Row
        return connection

    def _initialize(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """CREATE TABLE IF NOT EXISTS rag_documents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    doc_type TEXT NOT NULL,
                    department TEXT NOT NULL,
                    project_id TEXT,
                    status TEXT NOT NULL,
                    source TEXT NOT NULL,
                    source_reference TEXT NOT NULL DEFAULT '',
                    content TEXT NOT NULL,
                    tags TEXT NOT NULL
                )"""
            )
            columns = {
                row["name"] for row in connection.execute("PRAGMA table_info(rag_documents)")
            }
            if "source_reference" not in columns:
                connection.execute(
                    "ALTER TABLE rag_documents ADD COLUMN source_reference TEXT NOT NULL DEFAULT ''"
                )
            for document in CURRENT_RAG_DOCUMENTS:
                connection.execute(
                    """INSERT INTO rag_documents
                    (id, title, doc_type, department, project_id, status, source, source_reference, content, tags)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title, doc_type=excluded.doc_type,
                        department=excluded.department, project_id=excluded.project_id,
                        status=excluded.status, source=excluded.source,
                        source_reference=excluded.source_reference,
                        content=excluded.content, tags=excluded.tags""",
                    (
                        document["id"], document["title"], document["type"],
                        document.get("department", ""), document.get("project_id"),
                        document.get("status", "current"), document.get("source", "organization"),
                        document.get("source_reference", "Seeded current organizational standard"),
                        document["content"], json.dumps(document.get("tags", [])),
                    ),
                )

    @staticmethod
    def tokenize(text: str) -> set[str]:
        return {
            token for token in re.findall(r"[a-z0-9]+", text.casefold())
            if len(token) > 2 and token not in _STOP_WORDS
        }

    def search(self, query: str, limit: int = 8) -> list[dict[str, Any]]:
        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM rag_documents WHERE status = 'current'"
            ).fetchall()
        ranked: list[tuple[int, dict[str, Any]]] = []
        for row in rows:
            document = dict(row)
            searchable = f"{document['title']} {document['content']} {document['department']}"
            document_tokens = self.tokenize(searchable)
            overlap = query_tokens & document_tokens
            if not overlap:
                continue
            title_overlap = query_tokens & self.tokenize(document["title"])
            score = len(overlap) + len(title_overlap) * 2
            document["tags"] = json.loads(document["tags"])
            document["data_type"] = "current_reference"
            document["document_id"] = document["id"]
            document["text"] = document["content"]
            document["type"] = document["doc_type"]
            document["metadata"] = {
                "title": document["title"],
                "doc_type": document["doc_type"],
                "data_type": "current_reference",
                "source": document["source"],
                "source_reference": document["source_reference"],
                "project_id": document["project_id"],
                "document_id": document["id"],
            }
            document["scores"] = {"final": float(score)}
            ranked.append((score, document))
        ranked.sort(key=lambda item: (-item[0], item[1]["id"]))
        return [document for _, document in ranked[:limit]]

    def list_documents(self) -> list[dict[str, Any]]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT * FROM rag_documents ORDER BY id"
            ).fetchall()
        return [dict(row) for row in rows]

    def store_document(self, content: str, metadata: dict[str, Any]) -> dict[str, Any]:
        document_id = str(metadata.get("document_id") or metadata.get("id") or "")
        if not document_id:
            raise ValueError("A stable document_id is required for current RAG knowledge")
        title = str(metadata.get("title") or document_id)
        with self._connect() as connection:
            connection.execute(
                """INSERT INTO rag_documents
                (id, title, doc_type, department, project_id, status, source, source_reference, content, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET title=excluded.title,
                    doc_type=excluded.doc_type, department=excluded.department,
                    project_id=excluded.project_id, status=excluded.status,
                    source=excluded.source, source_reference=excluded.source_reference,
                    content=excluded.content, tags=excluded.tags""",
                (
                    document_id, title, str(metadata.get("doc_type", "reference")),
                    str(metadata.get("department", "")), metadata.get("project_id"),
                    str(metadata.get("status", "current")),
                    str(metadata.get("source", "uploaded-reference")),
                    str(metadata.get("source_reference", "")),
                    content,
                    json.dumps(metadata.get("tags", [])),
                ),
            )
        return {"success": True, "status": "stored", "document_id": document_id, "title": title}

    def count(self) -> int:
        with self._connect() as connection:
            return int(connection.execute("SELECT COUNT(*) FROM rag_documents").fetchone()[0])
