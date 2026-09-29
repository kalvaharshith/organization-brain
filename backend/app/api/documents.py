import hashlib
import io
from pathlib import Path
import re
from typing import Any

from docx import Document as DocxDocument
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pypdf import PdfReader

from app.services.hindsight_rag import HindsightRAG
from app.services.rag_knowledge import RAGKnowledgeStore
from app.services.canonical_org import get_organization_store

router = APIRouter()
MAX_FILE_SIZE = 15 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md"}


def _extract_text(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension == ".pdf":
        return "\n".join(
            page.extract_text() or "" for page in PdfReader(io.BytesIO(content)).pages
        )
    if extension == ".docx":
        document = DocxDocument(io.BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    return content.decode("utf-8-sig")


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str | None = Form(None),
    doc_type: str | None = Form(None),
    tags: str | None = Form(None),
    source_reference: str | None = Form(None),
    document_id: str | None = Form(None),
    project_id: str | None = Form(None),
):
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '.{ext}'. Allowed: pdf, docx, txt, md")

    content = await file.read()
    if not content:
        raise HTTPException(400, "Uploaded file is empty")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large (max 15 MB)")
    if document_id and not re.fullmatch(r"[A-Za-z0-9._:-]{3,128}", document_id):
        raise HTTPException(422, "Document ID must be 3-128 letters, digits, '.', '_', ':', or '-'")
    if source_reference is not None and len(source_reference.strip()) > 300:
        raise HTTPException(422, "Source reference must be at most 300 characters")

    project = None
    department_name = ""
    if project_id:
        organization = get_organization_store()
        project = next((item for item in organization.list_projects() if item["id"] == project_id), None)
        if project is None:
            raise HTTPException(422, "Project ID is not present in the canonical organization")
        department_name = next(
            (item["name"] for item in organization.get_overview()["departments"]
             if item["id"] == project["department_id"]),
            "",
        )

    try:
        extracted = _extract_text(filename, content).strip()
    except Exception as exc:
        raise HTTPException(422, "Could not extract text from the uploaded file") from exc
    if not extracted:
        raise HTTPException(422, "No readable text was found in the uploaded file")

    metadata: dict[str, Any] = {
        "title": title or filename,
        "doc_type": doc_type or "GENERAL",
        "tags": [tag.strip() for tag in (tags or "").split(",") if tag.strip()],
        "document_id": document_id or hashlib.sha256(content).hexdigest(),
        "source_reference": source_reference.strip() if source_reference and source_reference.strip() else f"Uploaded file: {filename}",
        "version": "1",
        "project_id": project["id"] if project else None,
        "department": department_name,
    }
    try:
        result = await HindsightRAG().ingest_document(extracted, metadata)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail="Document could not be retained in the current RAG store"
        ) from exc
    return {
        "status": result.get("status", "stored"),
        "title": metadata["title"],
        "document_id": metadata["document_id"],
        "rag": result,
    }


@router.get("/documents")
async def list_documents():
    documents = RAGKnowledgeStore().list_documents()
    return {"items": documents, "count": len(documents), "store": "current-reference-rag"}