import asyncio
import hashlib
import logging
from typing import Any

from app.services.rag_knowledge import RAGKnowledgeStore
from app.services.llm import llm


FALLBACK_ANSWER = (
    "I couldn't find sufficient information in the organization's knowledge base "
    "to answer this confidently."
)
logger = logging.getLogger(__name__)


class HindsightRAG:
    """Question answering pipeline over current-reference RAG documents."""

    def __init__(self):
        self.knowledge = RAGKnowledgeStore()

    async def ingest_document(self, content: str,
                              metadata: dict[str, Any]) -> dict[str, Any]:
        title = metadata.get("title", "Untitled")
        source_reference = metadata.get("source_reference", f"Uploaded reference: {title}")
        document_id = str(metadata.get("document_id") or hashlib.sha256(content.encode("utf-8")).hexdigest())
        rag_metadata = {
            "title": title,
            "doc_type": metadata.get("doc_type", "GENERAL"),
            "project_id": metadata.get("project_id", metadata.get("project", "")),
            "department": metadata.get("department", ""),
            "source": "uploaded-current-reference",
            "source_reference": source_reference,
            "document_id": document_id,
            "status": "current",
            "tags": [str(tag) for tag in metadata.get("tags", [])],
        }
        return self.knowledge.store_document(content, rag_metadata)

    async def answer_question(self, question: str) -> dict[str, Any]:
        search_results = self.knowledge.search(question, limit=8)

        if not search_results:
            return {
                "answer": FALLBACK_ANSWER,
                "sources": [],
                "confidence": "insufficient",
                "retrieved_count": 0,
            }

        context = self._build_context(search_results)
        system_prompt = """You are the Organizational Brain for Nexus Technologies.
        Answer questions using ONLY the provided organizational context.
        Cite the source title when making a claim. If the context does not support
        an answer, say: "I couldn't find sufficient information in the organization's
        knowledge base to answer this confidently."
        
        Context from organizational memory:
        {context}
        """

        try:
            answer = await asyncio.to_thread(
                llm.chat,
                system_prompt.format(context=context),
                question,
            )
            confidence = "grounded"
        except Exception:
            logger.exception("Groq answer generation failed; returning retrieved facts")
            answer = "I found these relevant facts, but answer generation is unavailable:\n\n" + "\n\n".join(
                memory.get("text", "") for memory in search_results
                if memory.get("text")
            )
            confidence = "retrieved_only"
        sources = self._extract_sources(search_results)
        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "retrieved_count": len(search_results)
        }

    def _build_context(self, memories: list[dict[str, Any]]) -> str:
        context_parts = []
        for i, memory in enumerate(memories, 1):
            metadata = memory.get("metadata") or {}
            context_parts.append(
                f"Source {i} [ID: {memory.get('id') or metadata.get('document_id') or 'unknown'}]: "
                f"{metadata.get('title') or memory.get('title', 'Unknown')}\n"
                f"Type: {metadata.get('doc_type', memory.get('type', 'GENERAL'))}\n"
                f"Content: {memory.get('text', '')}\n---"
            )
        return "\n".join(context_parts)

    def _extract_sources(self, memories: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {
                "id": memory.get("id"),
                "document_id": memory.get("document_id") or (memory.get("metadata") or {}).get("document_id"),
                "title": (memory.get("metadata") or {}).get("title") or memory.get("title", "Unknown"),
                "source_reference": (memory.get("metadata") or {}).get("source_reference"),
                "type": memory.get("type", "world"),
                "text": memory.get("text", ""),
            }
            for memory in memories
        ]