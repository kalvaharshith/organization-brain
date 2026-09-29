import React, { FormEvent, useEffect, useState } from 'react';
import { NavigationPath } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

interface RagDocument {
  id: string;
  title: string;
  doc_type: string;
  department: string;
  project_id: string | null;
  status: string;
  source: string;
  source_reference: string;
  content: string;
}

interface Project {
  id: string;
  name: string;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`);
  return payload as T;
}

interface KnowledgeIngestLiveProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const KnowledgeIngestLive: React.FC<KnowledgeIngestLiveProps> = ({ onNavigate, onShowToast }) => {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('engineering_standard');
  const [projectId, setProjectId] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ items: RagDocument[] }>('/documents');
      setDocuments(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Current RAG documents are unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ projects: Project[] }>('/organization/projects'),
      api<{ items: RagDocument[] }>('/documents'),
    ]).then(([projectResult, documentResult]) => {
      if (!active) return;
      setProjects(projectResult.projects);
      setDocuments(documentResult.items);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'RAG data is unavailable');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('title', title.trim() || file.name);
    form.append('doc_type', docType);
    form.append('source_reference', sourceReference.trim());
    form.append('tags', 'reference:current-fact');
    if (projectId) form.append('project_id', projectId);
    if (documentId.trim()) form.append('document_id', documentId.trim());
    try {
      const result = await api<{ status: string; document_id: string }>('/documents/upload', {
        method: 'POST',
        body: form,
      });
      onShowToast(`Current RAG reference ${result.status}: ${result.document_id}`, 'success');
      setFile(null);
      setTitle('');
      setSourceReference('');
      setDocumentId('');
      await refresh();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'RAG reference upload failed';
      setError(message);
      onShowToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant/20 pb-5">
        <div>
          <p className="font-mono-code text-[10px] uppercase text-primary">Current reference knowledge · separate RAG store</p>
          <h1 className="mt-1 font-headline-lg text-headline-lg font-semibold text-on-surface">Ingest a current standard</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Upload current organizational guidance. It is stored separately from canonical project state and historical Hindsight experiences.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-surface-container-low px-3 py-2 font-mono-code text-xs text-on-surface-variant">{documents.length} RAG documents</span>
          <button type="button" onClick={() => onNavigate('knowledge')} className="h-9 rounded-lg border border-outline-variant/25 px-3 text-xs font-semibold text-on-surface-variant">View corpus</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-error/20 bg-error-container/40 p-3 text-xs text-on-error-container">{error}</div>}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <form onSubmit={submit} className="grid gap-4 border-b border-outline-variant/20 pb-6 lg:col-span-7 lg:border-b-0 lg:border-r lg:pr-6">
          <label className="grid gap-1.5 text-xs font-semibold text-on-surface">Reference file
            <input required type="file" accept=".pdf,.docx,.txt,.md" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full rounded-lg border border-outline-variant/30 bg-surface p-2 text-xs" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-on-surface">Document title
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder={file?.name || 'Title used in retrieval'} className="h-10 rounded-lg border border-outline-variant/30 bg-surface px-3 text-sm font-normal" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-on-surface">Reference type
              <select value={docType} onChange={(event) => setDocType(event.target.value)} className="h-10 rounded-lg border border-outline-variant/30 bg-surface px-3 text-sm font-normal">
                <option value="engineering_standard">Engineering standard</option>
                <option value="security_policy">Security policy</option>
                <option value="architecture_document">Architecture document</option>
                <option value="deployment_sop">Deployment SOP</option>
                <option value="incident_procedure">Incident response procedure</option>
                <option value="ai_policy">AI/RAG policy</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-on-surface">Canonical project
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-10 rounded-lg border border-outline-variant/30 bg-surface px-3 text-sm font-normal">
                <option value="">Organization-wide</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.id}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-semibold text-on-surface">Source reference
            <input value={sourceReference} onChange={(event) => setSourceReference(event.target.value)} maxLength={300} placeholder="Standard, policy, review, or source URL" className="h-10 rounded-lg border border-outline-variant/30 bg-surface px-3 text-sm font-normal" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-on-surface">Stable document ID (optional)
            <input value={documentId} onChange={(event) => setDocumentId(event.target.value)} minLength={3} maxLength={128} placeholder="RAG-ENG-015" className="h-10 rounded-lg border border-outline-variant/30 bg-surface px-3 font-mono-code text-xs font-normal" />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-outline">PDF, DOCX, TXT, and Markdown · maximum 15 MB</span>
            <button type="submit" disabled={!file || uploading} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary disabled:opacity-50">
              {uploading ? 'Uploading and indexing…' : 'Store as current RAG knowledge'}
            </button>
          </div>
        </form>

        <section className="flex min-w-0 flex-col gap-3 lg:col-span-5" aria-label="Current RAG documents">
          <div className="flex items-center justify-between gap-2">
            <div><h2 className="font-label-md text-label-md font-semibold text-on-surface">Stored references</h2><p className="mt-1 text-[11px] text-on-surface-variant">Live records from the current-reference RAG API.</p></div>
            <button type="button" onClick={() => void refresh()} disabled={loading} className="h-8 rounded-lg border border-outline-variant/25 px-3 text-[11px] font-semibold text-on-surface-variant disabled:opacity-50">Refresh</button>
          </div>
          {loading ? <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">Loading RAG documents…</p>
            : documents.length ? documents.map((document) => <article key={document.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-3">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-xs font-semibold text-on-surface">{document.title}</h3><span className="font-mono-code text-[9px] text-outline">{document.id}</span></div>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-on-surface-variant">{document.content}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono-code text-[9px] text-outline"><span>{document.status}</span><span>{document.doc_type}</span><span>{projectNames.get(document.project_id || '') || 'Organization-wide'}</span></div>
            </article>)
            : <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">No current RAG documents are stored yet.</p>}
        </section>
      </div>
    </div>
  );
};
