import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Activity, ArrowDown, Brain, Check, CircleAlert, Clock3, Database, GitBranch, LoaderCircle, RefreshCw, Search, Sparkles, Upload, X } from 'lucide-react';

interface MemorySummary {
  id: string | null;
  title: string;
  text: string;
  type: string;
  context: string | null;
  tags: string[];
  document_id: string | null;
  mentioned_at: string | null;
  outcome_status: string | null;
  source: string | null;
  synthetic_demo: boolean;
  final_score: number | null;
  source_reference?: string | null;
  project_id?: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
  status: string;
}

interface TimelineItem {
  document_id: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
  memory_count: number;
  data_type: string | null;
  outcome_status: string | null;
  record_kind: string | null;
  source: string | null;
  company_id: string | null;
  project_id: string | null;
  task_id: string | null;
  department: string | null;
  team: string | null;
  owner_id: string | null;
  synthetic_demo: boolean;
  tags: string[];
}

interface Overview {
  scope: string;
  document_count: number;
  memory_count: number;
  organization_counts: {
    projects: number;
    employees: number;
    departments: number;
    teams: number;
    tasks: number;
    experiences: number;
    outcomes: Record<string, number>;
    current_reference_documents: number;
  };
  documents: TimelineItem[];
  rag_documents: Array<{ id: string; title: string; project_id: string | null; source_reference: string; content: string }>;
  memories: MemorySummary[];
}

interface EvaluationCase {
  case_id: string;
  title: string;
  query: string;
  retrieved_count: number;
  relevant_count: number;
  expected_tag: string;
  matched_expected_memory: boolean;
  results: MemorySummary[];
}

interface Evaluation {
  cases_total: number;
  cases_with_expected_memory: number;
  retrieval_coverage: number;
  retrieved_facts: number;
  cases: EvaluationCase[];
}

interface Comparison {
  case_context: string;
  current_state: Array<{ source_id: string; title: string; project_id: string; summary: string }>;
  canonical_projects: ProjectOption[];
  baseline: string | null;
  memory_answer: string | null;
  reasoning: string | null;
  recommendation: string | null;
  rag_message: string;
  hindsight_message: string;
  rag_memories: MemorySummary[];
  hindsight_memories: MemorySummary[];
  memories: MemorySummary[];
  retrieved_count: number;
  memory_influence: 'used' | 'none';
  retrieval_status: 'ok' | 'partial' | 'unavailable';
  generation_status: 'ok' | 'partial';
  errors: string[];
  related_project_ids: string[];
  lineage: { input_id: string; canonical_source_ids: string[]; rag_source_ids: string[]; hindsight_source_ids: string[]; recommendation_evidence_ids: string[] };
}

interface MemoryLabProps {
  initialQuery?: string;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const INITIAL_CASE = 'A payment webhook returns HTTP 429 while fixed-interval retries are synchronized. What do our earlier outcomes show?';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status})`);
  }
  return payload as T;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Date not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleString();
}

function outcomeStyle(status: string | null | undefined): string {
  if (status === 'success') return 'bg-tertiary-fixed/40 text-tertiary';
  if (status === 'failure') return 'bg-error-container text-on-error-container';
  return 'bg-surface-container-high text-on-surface-variant';
}

function EvidenceCard({ memory }: { memory: MemorySummary }) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-label-md text-label-md font-semibold text-on-surface">{memory.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono-code text-[10px] text-outline">
            <span>{memory.type}</span>
            {memory.document_id && <span>{memory.document_id}</span>}
            {memory.project_id && <span>{memory.project_id}</span>}
            {memory.mentioned_at && <span>{formatDate(memory.mentioned_at)}</span>}
          </div>
        </div>
        {memory.outcome_status && (
          <span className={`rounded-md px-2 py-1 font-label-sm text-label-sm font-semibold ${outcomeStyle(memory.outcome_status)}`}>
            {memory.outcome_status}
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">{memory.text}</p>
      <div className="flex flex-wrap gap-1.5">
        {memory.tags.map((tag) => (
          <span key={tag} className="rounded bg-surface-container-low px-2 py-0.5 font-mono-code text-[9px] text-outline">{tag}</span>
        ))}
        {memory.synthetic_demo && <span className="rounded bg-amber-100 px-2 py-0.5 font-mono-code text-[9px] text-amber-900">SYNTHETIC DEMO</span>}
      </div>
      {memory.source_reference && <p className="text-[10px] text-outline">Source: {memory.source_reference}</p>}
    </article>
  );
}

export const MemoryLab: React.FC<MemoryLabProps> = ({ initialQuery, onShowToast }) => {
  const [tab, setTab] = useState<'compare' | 'timeline'>('compare');
  const [scope, setScope] = useState<'demo' | 'all'>('demo');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [caseContext, setCaseContext] = useState(initialQuery || INITIAL_CASE);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceSource, setReferenceSource] = useState('');
  const [referenceDocumentId, setReferenceDocumentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [learningProof, setLearningProof] = useState<{ title: string; action: string; outcome: string; lesson: string; documentId: string; futureFound: boolean } | null>(null);
  const [syntheticOutcome, setSyntheticOutcome] = useState(true);
  const [outcome, setOutcome] = useState({
    scenario_id: '',
    case_title: '',
    initial_recommendation: '',
    action_taken: '',
    outcome_status: 'success',
    outcome_detail: '',
    lesson: '',
    user_preference: '',
    source_reference: '',
  });

  const refresh = useCallback(async () => {
    setLoadingOverview(true);
    setError(null);
    const [overviewResult, evaluationResult] = await Promise.allSettled([
      api<Overview>(`/memory/overview?scope=${scope}`),
      api<Evaluation>(`/memory/evaluate?scope=${scope}`),
    ]);
    if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
    else setError(overviewResult.reason instanceof Error ? overviewResult.reason.message : 'Hindsight is unavailable');
    if (evaluationResult.status === 'fulfilled') setEvaluation(evaluationResult.value);
    setLoadingOverview(false);
  }, [scope]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    void api<{ projects: ProjectOption[] }>('/organization/projects')
      .then((result) => setProjects(result.projects))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (initialQuery?.trim()) setCaseContext(initialQuery);
  }, [initialQuery]);

  const runComparison = async (event?: FormEvent) => {
    event?.preventDefault();
    if (caseContext.trim().length < 20 || comparing) return;
    setComparing(true);
    setError(null);
    setComparison(null);
    try {
      const result = await api<Comparison>('/memory/compare', {
        method: 'POST',
        body: JSON.stringify({ case_context: caseContext.trim(), scope }),
      });
      setComparison(result);
      if (result.canonical_projects.length && !projectId) {
        const namedMatch = result.canonical_projects.find((project) =>
          caseContext.toLowerCase().includes(project.name.toLowerCase().split(' ')[0]),
        );
        setProjectId(namedMatch?.id || result.canonical_projects[0].id);
      }
      setOutcome((current) => ({
        ...current,
        case_title: current.case_title || caseContext.trim().slice(0, 120),
        initial_recommendation: (result.recommendation || result.baseline || '').slice(0, 1500),
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const seedDemo = async () => {
    if (seeding) return;
    setSeeding(true);
    setError(null);
    try {
      const result = await api<{ created: number; updated: number; skipped_existing: number }>(
        '/memory/demo/seed', { method: 'POST', body: '{}' },
      );
      onShowToast(
        `Hindsight: ${result.created} created, ${result.updated} updated, ${result.skipped_existing} unchanged`,
        'success',
      );
      await refresh();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Demo data could not be stored';
      setError(message);
      onShowToast(message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const submitOutcome = async (event: FormEvent) => {
    event.preventDefault();
    if (!comparison?.recommendation || savingOutcome) return;
    setSavingOutcome(true);
    setError(null);
    try {
      const result = await api<{ status: string; record: { document_id: string; title: string } }>('/memory/outcomes', {
        method: 'POST',
        body: JSON.stringify({
          scenario_id: outcome.scenario_id || null,
          project_id: projectId || null,
          case_title: outcome.case_title,
          case_context: caseContext,
          initial_recommendation: outcome.initial_recommendation,
          action_taken: outcome.action_taken,
          outcome_status: outcome.outcome_status,
          outcome_detail: outcome.outcome_detail,
          lesson: outcome.lesson,
          user_preference: outcome.user_preference || null,
          source_reference: syntheticOutcome
            ? 'Synthetic demo feedback entered in Organizational Memory'
            : outcome.source_reference,
          synthetic_demo: syntheticOutcome,
          reliability: 'medium',
        }),
      });
      if (!['stored', 'updated', 'unchanged'].includes(result.status)) {
        throw new Error('Hindsight did not confirm the outcome write');
      }
      const statusMessage = result.status === 'updated'
        ? 'Existing Hindsight task record updated to a new version.'
        : result.status === 'unchanged'
          ? 'Hindsight already contains this unchanged task record.'
          : 'Outcome stored in Hindsight for future retrieval.';
      onShowToast(statusMessage, 'success');
      setOutcomeOpen(false);
      await refresh();
      const projectName = projects.find((project) => project.id === projectId)?.name || 'the related project';
      const futureCase = `Future related task for ${projectName}: ${caseContext} Reuse this lesson if its constraints match: ${outcome.lesson}`.slice(0, 3900);
      const futureScope = syntheticOutcome ? scope : 'all';
      let futureResult: Comparison;
      try {
        futureResult = await api<Comparison>('/memory/compare', {
          method: 'POST',
          body: JSON.stringify({ case_context: futureCase, scope: futureScope }),
        });
      } catch (recallError) {
        setLearningProof({
          title: result.record.title,
          action: outcome.action_taken,
          outcome: outcome.outcome_detail,
          lesson: outcome.lesson,
          documentId: result.record.document_id,
          futureFound: false,
        });
        const message = recallError instanceof Error ? recallError.message : 'Future Hindsight recall failed';
        setError(`Outcome was stored in Hindsight, but future retrieval could not be confirmed: ${message}`);
        onShowToast('Outcome stored; future retrieval could not be confirmed.', 'error');
        return;
      }
      setComparison(futureResult);
      setCaseContext(futureCase);
      setLearningProof({
        title: result.record.title,
        action: outcome.action_taken,
        outcome: outcome.outcome_detail,
        lesson: outcome.lesson,
        documentId: result.record.document_id,
          futureFound: futureResult.hindsight_memories.some((memory) =>
          memory.document_id === result.record.document_id || memory.tags.includes(`experience:${result.record.document_id}`),
        ),
      });
      if (!futureResult.hindsight_memories.some((memory) => memory.document_id === result.record.document_id || memory.tags.includes(`experience:${result.record.document_id}`))) {
        onShowToast('Outcome stored, but the future-task recall did not return its new memory.', 'error');
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Outcome was not stored';
      setError(message);
      onShowToast(message, 'error');
    } finally {
      setSavingOutcome(false);
    }
  };

  const uploadReference = async (event: FormEvent) => {
    event.preventDefault();
    if (!referenceFile || uploadingReference) return;
    setUploadingReference(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', referenceFile);
    formData.append('title', referenceTitle.trim() || referenceFile.name);
    formData.append('doc_type', 'REFERENCE');
    formData.append('source_reference', referenceSource.trim());
    formData.append('tags', 'reference:current-fact');
    if (referenceDocumentId.trim()) formData.append('document_id', referenceDocumentId.trim());
    try {
      const result = await api<{ status: string; document_id: string }>('/documents/upload', {
        method: 'POST',
        body: formData,
      });
      onShowToast(`Current RAG reference ${result.status}: ${result.document_id}`, 'success');
      setReferenceFile(null);
      setReferenceTitle('');
      setReferenceSource('');
      setReferenceDocumentId('');
      await refresh();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Reference document upload failed';
      setError(message);
      onShowToast(message, 'error');
    } finally {
      setUploadingReference(false);
    }
  };

  const counts = overview?.organization_counts;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-xs md:flex-row md:items-end">
        <div className="max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-primary-fixed px-2 py-1 font-mono-code text-[10px] uppercase text-primary">Current knowledge + hindsight</span>
            <span className={`rounded px-2 py-1 font-mono-code text-[10px] uppercase ${scope === 'demo' ? 'bg-amber-100 text-amber-900' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {scope === 'demo' ? 'Synthetic org context' : 'All Hindsight bank records'}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Organizational Memory</h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
            Compare the current organizational context with previous outcomes, decisions, and lessons so the team can reason from both present facts and accumulated experience.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface px-2.5 text-[10px] font-semibold text-on-surface-variant">
            Scope
            <select value={scope} onChange={(event) => setScope(event.target.value as 'demo' | 'all')} className="bg-transparent text-xs text-on-surface outline-none">
              <option value="demo">Synthetic company</option>
              <option value="all">Entire bank</option>
            </select>
          </label>
          <button onClick={() => void refresh()} disabled={loadingOverview} className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface px-3 text-xs font-semibold text-on-surface-variant disabled:opacity-50">
            {loadingOverview ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh live data
          </button>
              {scope === 'demo' && (
            <button onClick={() => void seedDemo()} disabled={seeding} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary disabled:opacity-50">
              {seeding ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Seed synthetic experiences
            </button>
          )}
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-container/40 p-3 text-xs text-on-error-container">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8" aria-label="Live organizational memory counts">
        {[
          ['Projects', counts?.projects], ['Tasks', counts?.tasks], ['Employees', counts?.employees],
          ['Teams', counts?.teams], ['Experiences', counts?.experiences], ['Facts', overview?.memory_count],
          ['Current docs', counts?.current_reference_documents], ['Eval hits', evaluation ? `${evaluation.cases_with_expected_memory}/${evaluation.cases_total}` : undefined],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-3 shadow-xs">
            <div className="font-mono-code text-[9px] uppercase tracking-wider text-outline">{label}</div>
            <div className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface">
              {loadingOverview ? '—' : value ?? 0}
            </div>
          </div>
        ))}
      </section>

      <nav className="flex gap-1 rounded-xl border border-outline-variant/15 bg-surface-container-low p-1" aria-label="Memory lab views">
        <button onClick={() => setTab('compare')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'compare' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'}`}>
          <GitBranch className="h-4 w-4" /> Compare reasoning
        </button>
        <button onClick={() => setTab('timeline')} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${tab === 'timeline' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'}`}>
          <Clock3 className="h-4 w-4" /> Memory timeline
        </button>
      </nav>

      {tab === 'compare' ? (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          <section className="flex min-w-0 flex-col gap-4 xl:col-span-7">
            <form onSubmit={runComparison} className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
              <label htmlFor="memory-case" className="mb-2 block font-label-md text-label-md font-semibold text-on-surface">New task / case</label>
              <textarea
                id="memory-case"
                value={caseContext}
                onChange={(event) => setCaseContext(event.target.value)}
                minLength={25}
                maxLength={4000}
                rows={4}
                className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface p-3 text-sm leading-relaxed text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
                placeholder="Describe the new issue, constraints, and desired outcome."
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono-code text-[10px] text-outline">Baseline = same case, without retrieved history. Memory run = real Hindsight recall.</span>
                <button type="submit" disabled={comparing || caseContext.trim().length < 25} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary disabled:opacity-50">
                  {comparing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Compare with memory
                </button>
              </div>
            </form>

            {comparison && (
              <>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <article className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-on-surface"><Activity className="h-4 w-4 text-outline" /> Without historical memory</div>
                      <span className="rounded-md bg-surface-container-high px-2 py-1 font-mono-code text-[9px] text-on-surface-variant">BASELINE</span>
                    </div>
                    {comparison.baseline ? <p className="whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">{comparison.baseline}</p> : <p className="text-xs text-on-surface-variant">The baseline LLM request did not return an answer.</p>}
                  </article>
                  <article className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-on-surface"><Brain className="h-4 w-4 text-primary" /> Evidence-grounded recommendation</div>
                      <span className={`rounded-md px-2 py-1 font-mono-code text-[9px] ${comparison.memory_influence === 'used' ? 'bg-tertiary-fixed/40 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {comparison.memory_influence === 'used' ? `${comparison.retrieved_count} SOURCES RETRIEVED` : 'NO EVIDENCE USED'}
                      </span>
                    </div>
                    {comparison.recommendation ? <p className="whitespace-pre-wrap text-xs leading-relaxed text-on-surface-variant">{comparison.recommendation}</p> : <p className="text-xs leading-relaxed text-on-surface-variant">{comparison.rag_message || comparison.hindsight_message || 'No evidence-grounded recommendation is available.'}</p>}
                  </article>
                </div>

                {learningProof && (
                  <section className="rounded-xl border border-tertiary/25 bg-tertiary-fixed/20 p-4" aria-live="polite">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-label-md text-label-md font-semibold text-on-surface">Outcome → lesson → future retrieval</h2>
                      <span className={`rounded px-2 py-1 font-mono-code text-[9px] font-semibold ${learningProof.futureFound ? 'bg-tertiary-fixed/50 text-tertiary' : 'bg-error-container text-on-error-container'}`}>
                        {learningProof.futureFound ? 'NEW MEMORY RETRIEVED' : 'FUTURE RETRIEVAL NOT CONFIRMED'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-on-surface">{learningProof.title}</p>
                    <dl className="mt-2 grid gap-2 text-xs text-on-surface-variant sm:grid-cols-2">
                      <div><dt className="font-semibold text-on-surface">Action</dt><dd>{learningProof.action}</dd></div>
                      <div><dt className="font-semibold text-on-surface">Actual outcome</dt><dd>{learningProof.outcome}</dd></div>
                      <div className="sm:col-span-2"><dt className="font-semibold text-on-surface">Lesson</dt><dd>{learningProof.lesson}</dd></div>
                      <div className="font-mono-code text-[10px]">Hindsight document: {learningProof.documentId}</div>
                    </dl>
                  </section>
                )}

                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div><h2 className="font-label-md text-label-md font-semibold text-on-surface">Current canonical state</h2><p className="mt-1 text-[10px] text-on-surface-variant">Current project records; historical outcomes do not overwrite this state.</p></div>
                    <span className="font-mono-code text-[10px] text-outline">{comparison.current_state.length}</span>
                  </div>
                  {comparison.current_state.length ? <div className="grid gap-2">{comparison.current_state.map((item) => <article key={item.source_id} className="rounded-lg bg-surface-container-low p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-on-surface">{item.title}</h3><span className="font-mono-code text-[10px] text-outline">{item.source_id}</span></div><p className="mt-1 text-xs text-on-surface-variant">{item.summary}</p></article>)}</div> : <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">No related canonical project state was found.</p>}
                </section>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div><h2 className="font-label-md text-label-md font-semibold text-on-surface">Current RAG knowledge</h2><p className="mt-1 text-[10px] text-on-surface-variant">Current standards retrieved from the separate RAG store.</p></div>
                      <span className="font-mono-code text-[10px] text-outline">{comparison.rag_memories.length}</span>
                    </div>
                    {comparison.rag_memories.length ? <div className="grid gap-2">{comparison.rag_memories.map((memory, index) => <EvidenceCard key={memory.id || `${memory.title}-${index}`} memory={memory} />)}</div> : <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">{comparison.rag_message || 'No relevant current RAG knowledge was found.'}</p>}
                  </section>
                  <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div><h2 className="font-label-md text-label-md font-semibold text-on-surface">Historical Hindsight experience</h2><p className="mt-1 text-[10px] text-on-surface-variant">Past outcomes and lessons retrieved from Hindsight.</p></div>
                      <span className="font-mono-code text-[10px] text-outline">{comparison.hindsight_memories.length}</span>
                    </div>
                    {comparison.hindsight_memories.length ? <div className="grid gap-2">{comparison.hindsight_memories.map((memory, index) => <EvidenceCard key={memory.id || `${memory.title}-${index}`} memory={memory} />)}</div> : <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">{comparison.hindsight_message || 'No relevant previous experience was found.'}</p>}
                  </section>
                </div>

                <details className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
                  <summary className="flex cursor-pointer list-none items-center gap-2 font-label-md text-label-md font-semibold text-on-surface"><GitBranch className="h-4 w-4 text-primary" /> Data lineage for this comparison <ArrowDown className="ml-auto h-4 w-4 text-outline" /></summary>
                  <ol className="mt-3 grid gap-2 text-xs text-on-surface-variant sm:grid-cols-2">
                    {['Task text received', `${comparison.current_state.length} canonical records: ${comparison.lineage.canonical_source_ids.join(', ') || 'none'}`, `${comparison.rag_memories.length} RAG records: ${comparison.lineage.rag_source_ids.join(', ') || 'none'}`, `${comparison.hindsight_memories.length} Hindsight records: ${comparison.lineage.hindsight_source_ids.join(', ') || 'none'}`, `Recommendation evidence IDs: ${comparison.lineage.recommendation_evidence_ids.join(', ') || 'none'}`, `Memory influence: ${comparison.memory_influence}`].map((step, index) => (
                      <li key={step} className="flex items-center gap-2 rounded-lg bg-surface-container-low p-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-container-high font-mono-code text-[9px]">{index + 1}</span>{step}</li>
                    ))}
                  </ol>
                </details>

                <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-label-md text-label-md font-semibold text-on-surface">Record what happened</h2>
                      <p className="mt-1 text-[11px] text-on-surface-variant">Only submit after there is an actual or explicitly synthetic outcome. It will be retained in Hindsight.</p>
                    </div>
                    <button type="button" onClick={() => setOutcomeOpen((open) => !open)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant/25 px-3 text-xs font-semibold text-primary">
                      {outcomeOpen ? <X className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}{outcomeOpen ? 'Close' : 'Add outcome'}
                    </button>
                  </div>
                  {outcomeOpen && (
                    <form onSubmit={submitOutcome} className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface">Stable task ID (optional; reuse to revise a record)
                        <input value={outcome.scenario_id} onChange={(event) => setOutcome({ ...outcome, scenario_id: event.target.value })} className="h-9 rounded-lg border border-outline-variant/30 bg-surface px-2.5 font-mono-code text-xs font-normal" placeholder="TASK-AUTH-017" />
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface">Canonical project
                        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-9 rounded-lg border border-outline-variant/30 bg-surface px-2.5 text-xs font-normal">
                          <option value="">No project linked</option>
                          {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.id}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface">Experience title
                        <input required minLength={5} value={outcome.case_title} onChange={(event) => setOutcome({ ...outcome, case_title: event.target.value })} className="h-9 rounded-lg border border-outline-variant/30 bg-surface px-2.5 text-xs font-normal" />
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface">Outcome
                        <select value={outcome.outcome_status} onChange={(event) => setOutcome({ ...outcome, outcome_status: event.target.value })} className="h-9 rounded-lg border border-outline-variant/30 bg-surface px-2.5 text-xs font-normal">
                          <option value="success">Succeeded</option><option value="partial">Partially worked / pending</option><option value="failure">Failed</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface sm:col-span-2">Recommendation being evaluated
                        <textarea required minLength={12} maxLength={1500} rows={3} value={outcome.initial_recommendation} onChange={(event) => setOutcome({ ...outcome, initial_recommendation: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-2.5 text-xs font-normal" />
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface sm:col-span-2">Action actually taken
                        <textarea required minLength={12} rows={2} value={outcome.action_taken} onChange={(event) => setOutcome({ ...outcome, action_taken: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-2.5 text-xs font-normal" />
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface sm:col-span-2">Observed outcome
                        <textarea required minLength={25} rows={2} value={outcome.outcome_detail} onChange={(event) => setOutcome({ ...outcome, outcome_detail: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-2.5 text-xs font-normal" />
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface sm:col-span-2">Reusable lesson
                        <textarea required minLength={15} rows={2} value={outcome.lesson} onChange={(event) => setOutcome({ ...outcome, lesson: event.target.value })} className="rounded-lg border border-outline-variant/30 bg-surface p-2.5 text-xs font-normal" />
                      </label>
                      <label className="grid gap-1 text-[11px] font-semibold text-on-surface sm:col-span-2">Explicit user/team preference (optional)
                        <input value={outcome.user_preference} onChange={(event) => setOutcome({ ...outcome, user_preference: event.target.value })} className="h-9 rounded-lg border border-outline-variant/30 bg-surface px-2.5 text-xs font-normal" placeholder="Only include a preference they actually stated." />
                      </label>
                      <label className="flex items-center gap-2 text-[11px] text-on-surface-variant sm:col-span-2">
                        <input type="checkbox" checked={syntheticOutcome} onChange={(event) => setSyntheticOutcome(event.target.checked)} />
                        Label this as synthetic/demo data. Uncheck only for a real user-reported outcome and provide its source reference.
                      </label>
                      {!syntheticOutcome && (
                        <label className="grid gap-1 text-[11px] font-semibold text-on-surface sm:col-span-2">Source reference (required)
                          <input required minLength={3} value={outcome.source_reference} onChange={(event) => setOutcome({ ...outcome, source_reference: event.target.value })} className="h-9 rounded-lg border border-outline-variant/30 bg-surface px-2.5 text-xs font-normal" placeholder="Ticket, incident, review, or user confirmation reference" />
                        </label>
                      )}
                      <button type="submit" disabled={savingOutcome} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary disabled:opacity-50 sm:col-span-2">
                        {savingOutcome ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Retain outcome in Hindsight
                      </button>
                    </form>
                  )}
                </section>
              </>
            )}
          </section>

          <aside className="flex min-w-0 flex-col gap-4 xl:col-span-5">
            <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-label-md text-label-md font-semibold text-on-surface">Measured retrieval checks</h2>
                <span className="font-mono-code text-[9px] text-outline">LIVE HINDSIGHT</span>
              </div>
              {evaluation ? (
                <>
                  <div className="mb-3 flex items-end gap-2"><strong className="font-headline-lg text-headline-lg text-on-surface">{evaluation.cases_with_expected_memory}/{evaluation.cases_total}</strong><span className="pb-1 text-[11px] text-on-surface-variant">queries retrieved their expected tagged memory</span></div>
                  <div className="grid gap-2">{evaluation.cases.map((item) => (
                    <div key={item.case_id} className="flex items-start gap-2 rounded-lg bg-surface-container-low p-2.5">
                      {item.matched_expected_memory ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-outline" />}
                      <div className="min-w-0"><div className="text-[11px] font-semibold text-on-surface">{item.title}</div><div className="mt-0.5 text-[10px] text-on-surface-variant">{item.retrieved_count} returned · {item.relevant_count} expected-tag matches</div></div>
                    </div>
                  ))}</div>
                </>
              ) : <p className="text-xs text-on-surface-variant">Evaluation data unavailable.</p>}
              <p className="mt-3 border-t border-outline-variant/15 pt-3 text-[10px] leading-relaxed text-outline">This is retrieval coverage on the listed cases, not an accuracy or quality-improvement percentage.</p>
            </section>

            <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-label-md text-label-md font-semibold text-on-surface">Latest Hindsight experiences</h2>
                <span className="font-mono-code text-[9px] uppercase text-outline">{overview?.documents.length ?? 0} documents</span>
              </div>
              {overview?.documents.length ? (
                <div className="grid gap-2">{overview.documents.slice(0, 5).map((item) => (
                  <article key={item.document_id} className="rounded-lg border border-outline-variant/15 p-2.5">
                    <div className="flex items-start justify-between gap-2"><div className="text-[11px] font-semibold text-on-surface">{item.title}</div>{item.outcome_status && <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${outcomeStyle(item.outcome_status)}`}>{item.outcome_status}</span>}</div>
                    <div className="mt-1 font-mono-code text-[9px] text-outline">{item.project_id || 'No project ID'} · {formatDate(item.created_at)} · {item.memory_count} facts</div>
                  </article>
                ))}</div>
              ) : <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">Hindsight contains no experiences for this synthetic organization yet.</p>}
            </section>
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
          <section className="flex min-w-0 flex-col gap-4 xl:col-span-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Projects', counts?.projects], ['Tasks', counts?.tasks], ['People', counts?.employees], ['Departments', counts?.departments],
                ['Teams', counts?.teams], ['Hindsight facts', overview?.memory_count], ['Current docs', counts?.current_reference_documents], ['Experiences', counts?.experiences],
              ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-3 shadow-xs"><div className="font-mono-code text-[9px] uppercase text-outline">{label}</div><div className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface">{loadingOverview ? '—' : value ?? 0}</div></div>)}
            </div>
            <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
              <h2 className="mb-3 font-label-md text-label-md font-semibold text-on-surface">Learning timeline from Hindsight documents</h2>
              {overview?.documents.length ? <ol className="relative ml-2 grid gap-0 border-l border-outline-variant/40 pl-5">{overview.documents.map((item) => (
                <li key={item.document_id} className="relative border-b border-outline-variant/10 py-3 last:border-0">
                  <span className="absolute -left-[25px] top-4 h-2.5 w-2.5 rounded-full border-2 border-primary bg-surface" />
                  <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-on-surface">{item.title}</h3>{item.outcome_status && <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${outcomeStyle(item.outcome_status)}`}>{item.outcome_status}</span>}</div>
                  <div className="mt-1 font-mono-code text-[9px] text-outline">{formatDate(item.created_at)} · {item.project_id || 'No project'} · {item.department || 'Department not recorded'} / {item.team || 'Team not recorded'} · {item.memory_count} facts</div>
                  <div className="mt-1 flex flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono-code text-[9px] text-outline">{tag}</span>)}</div>
                </li>
              ))}</ol> : <p className="rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">No synthetic-company timeline records are stored in Hindsight.</p>}
            </section>
          </section>
          <aside className="flex min-w-0 flex-col gap-4 xl:col-span-4">
            <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-xs">
              <h2 className="mb-3 font-label-md text-label-md font-semibold text-on-surface">Actual memory facts</h2>
              {overview?.memories.length ? <div className="grid gap-2">{overview.memories.slice(0, 8).map((memory, index) => <EvidenceCard key={memory.id || `${memory.title}-${index}`} memory={memory} />)}</div> : <p className="text-xs text-on-surface-variant">No Hindsight facts were returned for this organization.</p>}
            </section>
            <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-3 text-[10px] leading-relaxed text-on-surface-variant">
              Counts and timeline entries above come from the live Hindsight document and memory-list endpoints. No local vector-store count is substituted.
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};