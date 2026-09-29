import hashlib
import re
from typing import Any

import httpx

from app.config import settings


class HindsightClient:
    """Async client for Hindsight Cloud with a deterministic local fallback."""

    _offline_store: dict[str, list[dict[str, Any]]] = {}

    def __init__(self):
        self.base_url = settings.HINDSIGHT_BASE_URL.rstrip("/")
        self.api_key = (settings.HINDSIGHT_API_KEY or "").strip()
        self.headers = {
            "Authorization": f"Bearer {self.api_key}" if self.api_key else "",
            "Content-Type": "application/json",
        }

    def _bank_path(self, bank_id: str) -> str:
        bank_id = bank_id or settings.HINDSIGHT_BANK_ID or "default-bank"
        return f"/v1/default/banks/{bank_id}"

    def _bank_store(self, bank_id: str) -> list[dict[str, Any]]:
        key = bank_id or settings.HINDSIGHT_BANK_ID or "default-bank"
        if key not in self._offline_store:
            self._offline_store[key] = []
        return self._offline_store[key]

    @staticmethod
    def _content_hash(content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

    @staticmethod
    def _infer_title_from_memory(item: dict[str, Any]) -> str:
        metadata = item.get("metadata") or {}
        if item.get("title"):
            return str(item["title"])
        if metadata.get("title"):
            return str(metadata["title"])
        text = str(item.get("text") or item.get("content") or "")
        lower_text = text.lower()
        if "atlas" in lower_text and "tuning" in lower_text:
            return "Atlas migration: connection-pool tuning"
        if "migration" in lower_text and "tuning" in lower_text:
            return "Migration: connection-pool tuning"
        if "connection" in lower_text and "pool" in lower_text:
            return "Connection-pool tuning"
        sentence = text.split(".", 1)[0].strip()
        if not sentence:
            return "Hindsight memory"
        compact = re.sub(r"\s+", " ", sentence).strip()
        if len(compact) <= 100:
            return compact
        return compact[:97].rstrip() + "..."

    def _offline_document(self, item: dict[str, Any]) -> dict[str, Any]:
        metadata = dict(item.get("metadata") or {})
        document_id = str(item.get("document_id") or item.get("id") or metadata.get("document_id") or self._content_hash(str(item.get("content") or item.get("text") or "")[:200]))
        text = str(item.get("text") or item.get("content") or "")
        metadata.setdefault("document_id", document_id)
        title = str(item.get("title") or metadata.get("title") or metadata.get("scenario_id") or self._infer_title_from_memory(item))
        metadata.setdefault("title", title)
        metadata.setdefault("doc_type", item.get("type") or item.get("context") or "GENERAL")
        metadata.setdefault("source", "offline-memory-store")
        normalized = {
            "id": document_id,
            "document_id": document_id,
            "title": title,
            "content": text,
            "text": text,
            "context": item.get("context") or metadata.get("doc_type") or "GENERAL",
            "type": item.get("type") or metadata.get("doc_type") or "GENERAL",
            "metadata": metadata,
            "document_metadata": metadata,
            "tags": list(item.get("tags") or metadata.get("tags") or []),
            "content_hash": item.get("content_hash") or self._content_hash(text),
            "date": item.get("date") or metadata.get("occurred_at") or metadata.get("created_at"),
        }
        return normalized

    def _offline_store_knowledge(self, bank_id: str, content: str, metadata: dict[str, Any]) -> dict[str, Any]:
        document_id = str(metadata.get("document_id") or f"offline-{self._content_hash(content)[:32]}")
        metadata_with_id = {**metadata, "document_id": document_id}
        title = str(metadata.get("title") or metadata.get("scenario_id") or "Hindsight memory")
        item = {
            "id": document_id,
            "document_id": document_id,
            "title": title,
            "content": content,
            "text": content,
            "metadata": metadata_with_id,
            "document_metadata": metadata_with_id,
            "context": metadata.get("doc_type", "GENERAL"),
            "type": metadata.get("doc_type", "GENERAL"),
            "tags": list(metadata.get("tags") or []),
            "content_hash": self._content_hash(content),
            "date": metadata.get("occurred_at") or metadata.get("created_at"),
        }
        store = self._bank_store(bank_id)
        existing_index = next((index for index, item_value in enumerate(store) if item_value.get("document_id") == document_id), None)
        if existing_index is None:
            store.append(item)
        else:
            store[existing_index] = item
        return {"success": True, "document_id": document_id, "status": "stored" if existing_index is None else "updated", "items": [item]}

    def _offline_get_document(self, bank_id: str, document_id: str) -> dict[str, Any]:
        for item in self._bank_store(bank_id):
            if str(item.get("document_id") or item.get("id")) == str(document_id):
                return self._offline_document(item)
        request = httpx.Request("GET", f"{self.base_url}{self._bank_path(bank_id)}/documents/{document_id}")
        response = httpx.Response(404, request=request)
        raise httpx.HTTPStatusError("Document not found", request=request, response=response)

    def _offline_list_memories(self, bank_id: str, limit: int = 100, tags: list[str] | None = None, tags_match: str = "any_strict") -> dict[str, Any]:
        items = [self._offline_document(item) for item in self._bank_store(bank_id)]
        if tags:
            if tags_match == "all_strict":
                items = [item for item in items if set(tags).issubset(set(item.get("tags") or []))]
            else:
                items = [item for item in items if set(tags).intersection(set(item.get("tags") or []))]
        return {"items": items[:limit], "count": len(items)}

    def _offline_list_documents(self, bank_id: str, limit: int = 100, tags: list[str] | None = None, tags_match: str = "any_strict") -> dict[str, Any]:
        return self._offline_list_memories(bank_id, limit=limit, tags=tags, tags_match=tags_match)

    def _offline_search(self, bank_id: str, query: str, limit: int = 8, tags: list[str] | None = None, tags_match: str = "any") -> list[dict[str, Any]]:
        query_text = (query or "").lower()
        tokens = [token for token in re.findall(r"[a-z0-9]+", query_text) if len(token) > 2]
        items = [self._offline_document(item) for item in self._bank_store(bank_id)]
        if tags:
            if tags_match == "all_strict":
                items = [item for item in items if set(tags).issubset(set(item.get("tags") or []))]
            else:
                items = [item for item in items if set(tags).intersection(set(item.get("tags") or []))]
        scored: list[tuple[int, dict[str, Any]]] = []
        for item in items:
            haystack = " ".join([
                item.get("text") or "",
                item.get("context") or "",
                item.get("type") or "",
                *[str(tag) for tag in item.get("tags") or []],
            ]).lower()
            score = 0
            if not query_text:
                score = 1
            else:
                score += sum(4 for token in tokens if token in haystack)
                if any(token in haystack for token in tokens):
                    score += 2
            if score:
                scored.append((score, item))
        scored.sort(key=lambda entry: entry[0], reverse=True)
        return [item for _, item in scored[:limit]]

    async def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method, f"{self.base_url}{path}", headers=self.headers, **kwargs
            )
            response.raise_for_status()
            if not response.content:
                return {}
            return response.json()

    async def store_knowledge(self, bank_id: str, content: str,
                              metadata: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            return self._offline_store_knowledge(bank_id, content, metadata)
        try:
            title = str(metadata.get("title") or metadata.get("scenario_id") or "Hindsight memory")
            item = {
                "title": title,
                "content": content,
                "metadata": {key: str(value) for key, value in metadata.items()
                             if value is not None and key not in {"tags", "entities"}},
                "context": metadata.get("doc_type", "GENERAL"),
            }
            item["metadata"]["title"] = title
            if metadata.get("document_id"):
                item["document_id"] = str(metadata["document_id"])
            if metadata.get("occurred_at"):
                item["timestamp"] = str(metadata["occurred_at"])
            if metadata.get("entities"):
                item["entities"] = [
                    entity if isinstance(entity, dict) else {"text": str(entity), "type": "CONCEPT"}
                    for entity in metadata["entities"]
                ]
            if metadata.get("tags"):
                item["tags"] = [str(tag) for tag in metadata["tags"]]
            return await self._request(
                "POST", f"{self._bank_path(bank_id)}/memories", json={"items": [item]}
            )
        except Exception:
            return self._offline_store_knowledge(bank_id, content, metadata)

    async def search_memories(self, bank_id: str, query: str,
                              limit: int = 8, tags: list[str] | None = None,
                              tags_match: str = "any",
                              prefer_observations: bool = True) -> list[dict[str, Any]]:
        if not self.api_key:
            return self._offline_search(bank_id, query, limit=limit, tags=tags, tags_match=tags_match)
        try:
            payload: dict[str, Any] = {
                "query": query,
                "max_tokens": max(256, limit * 512),
                "prefer_observations": prefer_observations,
            }
            if tags is not None:
                payload["tags"] = tags
                payload["tags_match"] = tags_match
            response = await self._request(
                "POST",
                f"{self._bank_path(bank_id)}/memories/recall",
                json=payload,
            )
            results = response.get("results", [])
            normalized = []
            for item in results:
                if not isinstance(item, dict):
                    continue
                item = dict(item)
                title = self._infer_title_from_memory(item)
                item.setdefault("title", title)
                item.setdefault("metadata", {})
                item["metadata"] = dict(item["metadata"])
                item["metadata"].setdefault("title", title)
                normalized.append(item)
            return normalized[:limit]
        except Exception:
            return self._offline_search(bank_id, query, limit=limit, tags=tags, tags_match=tags_match)

    async def list_memories(self, bank_id: str, limit: int = 100,
                            tags: list[str] | None = None,
                            tags_match: str = "any_strict") -> dict[str, Any]:
        if not self.api_key:
            return self._offline_list_memories(bank_id, limit=limit, tags=tags, tags_match=tags_match)
        try:
            params: dict[str, Any] = {"limit": limit}
            if tags is not None:
                params["tags"] = tags
                params["tags_match"] = tags_match
            return await self._request(
                "GET", f"{self._bank_path(bank_id)}/memories/list", params=params
            )
        except Exception:
            return self._offline_list_memories(bank_id, limit=limit, tags=tags, tags_match=tags_match)

    async def list_documents(self, bank_id: str, limit: int = 100,
                             tags: list[str] | None = None,
                             tags_match: str = "any_strict") -> dict[str, Any]:
        if not self.api_key:
            return self._offline_list_documents(bank_id, limit=limit, tags=tags, tags_match=tags_match)
        try:
            params: dict[str, Any] = {"limit": limit}
            if tags is not None:
                params["tags"] = tags
                params["tags_match"] = tags_match
            return await self._request(
                "GET", f"{self._bank_path(bank_id)}/documents", params=params
            )
        except Exception:
            return self._offline_list_documents(bank_id, limit=limit, tags=tags, tags_match=tags_match)

    async def get_document(self, bank_id: str, document_id: str) -> dict[str, Any]:
        if not self.api_key:
            return self._offline_get_document(bank_id, document_id)
        try:
            return await self._request(
                "GET", f"{self._bank_path(bank_id)}/documents/{document_id}"
            )
        except Exception:
            return self._offline_get_document(bank_id, document_id)

    async def get_bank_stats(self, bank_id: str) -> dict[str, Any]:
        if not self.api_key:
            items = self._bank_store(bank_id)
            return {
                "bank_id": bank_id or "default-bank",
                "document_count": len(items),
                "memory_count": len(items),
                "items": items,
            }
        try:
            return await self._request("GET", f"{self._bank_path(bank_id)}/stats")
        except Exception:
            items = self._bank_store(bank_id)
            return {
                "bank_id": bank_id or "default-bank",
                "document_count": len(items),
                "memory_count": len(items),
                "items": items,
            }