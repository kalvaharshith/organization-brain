import React, { useEffect, useState } from 'react';
import { NavigationPath, KnowledgeItem } from '../types';

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

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status})`);
  return payload as T;
}

interface KnowledgeExplorerProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
  onInspectDocument: (doc: KnowledgeItem) => void;
}

export const KnowledgeExplorer: React.FC<KnowledgeExplorerProps> = ({
  onNavigate,
  onShowToast,
  onInspectDocument
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ items: RagDocument[] }>('/documents'),
      api<{ projects: Array<{ id: string; name: string }> }>('/organization/projects'),
    ]).then(([documents, projectResult]) => {
      if (!active) return;
      const projectNames = new Map(projectResult.projects.map((project) => [project.id, project.name]));
      setItems(documents.items.map((document) => {
        const type = document.doc_type.toLowerCase().includes('policy')
          ? 'Policy'
          : document.doc_type.toLowerCase().includes('process') || document.doc_type.toLowerCase().includes('sop')
            ? 'Process & SOP'
            : 'Technical Spec';
        const sourceName = document.source_reference || document.source || 'Source not recorded';
        return {
          id: document.id,
          type,
          title: document.title,
          description: document.content,
          project: projectNames.get(document.project_id || '') || 'Organization-wide',
          authority: document.status === 'current' ? 'Current RAG reference' : 'Archived reference',
          author: { name: sourceName, role: document.department || 'Department not recorded', avatar: '' },
          updatedAt: 'Date not recorded',
          tag: document.id,
          verified: false,
          projectId: document.project_id,
          department: document.department,
          source: document.source,
          sourceReference: document.source_reference,
          status: document.status,
        };
      }));
    }).catch((error: unknown) => {
      if (active) setLoadError(error instanceof Error ? error.message : 'Current RAG documents are unavailable');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const categories = [
    { label: 'All', count: items.length },
    ...Array.from(new Set(items.map((item) => item.type))).map((type) => ({
      label: type === 'Process & SOP' ? 'Processes & SOPs' : type === 'Technical Spec' ? 'Technical Specs' : type === 'Policy' ? 'Policies' : type,
      count: items.filter((item) => item.type === type).length,
    })),
  ];

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, bookmarked: !item.bookmarked } : item))
    );
    onShowToast('Bookmark updated');
  };

  const handleShare = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onShowToast(`Copied permalink for "${title}"`);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sourceReference || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'All'
        ? true
        : activeCategory === 'Processes & SOPs'
          ? item.type === 'Process & SOP'
          : activeCategory === 'Technical Specs'
            ? item.type === 'Technical Spec'
            : activeCategory === 'Policies'
              ? item.type === 'Policy'
              : item.type === activeCategory;

    const matchesProject =
      selectedProject === 'All Projects' || item.project === selectedProject;
    const matchesDepartment = selectedDepartment === 'All Departments' || item.department === selectedDepartment;

    return matchesSearch && matchesCategory && matchesProject && matchesDepartment;
  });

  return (
    <div className="py-4 sm:py-5 px-4 sm:px-6 lg:px-8 flex flex-col gap-5 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Action & Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs text-primary">
            <span className="material-symbols-outlined text-[20px]">hub</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
              CURRENT REFERENCE KNOWLEDGE
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
            Knowledge Explorer
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Browse current organizational standards and reference documents from the separate RAG store.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-space-xs">
          <span className="rounded-lg bg-surface-container-low px-3 py-2 font-mono-code text-xs text-on-surface-variant">
            {items.length} live RAG documents
          </span>

          <button
            onClick={() => onNavigate('ingest')}
            className="flex items-center gap-space-2xs h-9 px-space-md rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-md text-label-md shadow-sm border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-[18px] text-outline">upload_file</span>
            <span>Upload Document</span>
          </button>

          <button
            onClick={() => onNavigate('ingest')}
            className="flex items-center gap-space-2xs h-9 px-space-md rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-label-md font-medium shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Knowledge</span>
          </button>
        </div>
      </div>

      {loadError && <div role="alert" className="rounded-lg border border-error/20 bg-error-container/40 p-3 text-xs text-on-error-container">{loadError}</div>}

      {/* Search & Omni Filter Command Bar */}
      <div className="flex flex-col gap-space-sm">
        <div className="relative flex items-center w-full rounded-2xl bg-surface-container-lowest p-2 shadow-sm border border-outline-variant/20">
          <span className="material-symbols-outlined text-[22px] text-outline ml-space-sm">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-space-sm py-2 font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
            placeholder="Search documents, projects, decisions, people, policies..."
            type="text"
          />
          <div className="flex items-center gap-space-2xs mr-space-sm">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-surface-container-low font-mono-code text-[11px] text-outline shadow-sm border border-outline-variant/30">
              ⌘K
            </kbd>
            <button
              onClick={() => onShowToast('Voice query listening...')}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
              title="Voice Search"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </div>
        </div>

        {/* Categories & Sub-Filters Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
          {/* Scrollable Category Pills */}
          <div className="flex items-center gap-space-2xs overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(cat.label)}
                className={`category-chip px-space-sm py-1.5 rounded-full font-label-md text-label-md shrink-0 transition-colors ${
                  activeCategory === cat.label
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {cat.label}{' '}
                <span
                  className={`ml-1 text-[11px] ${
                    activeCategory === cat.label ? 'opacity-80' : 'text-outline'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Facets Dropdowns */}
          <div className="flex items-center gap-space-2xs shrink-0 self-end lg:self-auto">
            <div className="relative inline-flex items-center">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none h-8 pl-space-sm pr-7 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/20 focus:outline-none cursor-pointer"
              >
                <option value="All Projects">All Projects</option>
                {[...new Set(items.map((item) => item.project))].map((project) => <option key={project} value={project}>{project}</option>)}
              </select>
              <span className="material-symbols-outlined text-[16px] text-outline absolute right-2 pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="relative inline-flex items-center">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="appearance-none h-8 pl-space-sm pr-7 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/20 focus:outline-none cursor-pointer"
              >
                <option value="All Departments">All Departments</option>
                {[...new Set(items.map((item) => item.department).filter((department): department is string => Boolean(department)))].map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
              <span className="material-symbols-outlined text-[16px] text-outline absolute right-2 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Cards Grid / Graph (8 cols) + Side Intelligence Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Knowledge Cards Feed or Full Graph View */}
        <div className="lg:col-span-8 flex flex-col gap-space-md">
          {viewMode === 'graph' ? (
            /* Full Interactive Graph Mode */
            <div className="rounded-2xl bg-surface-container-lowest shadow-md p-space-lg border border-outline-variant/20 flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    Organizational Knowledge Cluster Topology
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline">
                    Interactive 3D vector semantic proximity map. Click nodes to inspect associated ADRs and specs.
                  </p>
                </div>
                <button
                  onClick={() => onShowToast('Current RAG records do not expose graph relationships.')}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-md text-xs font-semibold hover:bg-surface-container"
                >
                  Return to List
                </button>
              </div>

              {/* Large Interactive SVG Graph Canvas */}
              <div className="relative h-96 w-full rounded-xl bg-surface-container-low/70 overflow-hidden flex items-center justify-center p-4 border border-outline-variant/20">
                <svg className="w-full h-full" viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg">
                  {/* Background grid */}
                  <defs>
                    <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#c2c6d6" strokeWidth="0.5" strokeOpacity="0.4" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridPattern)" />

                  {/* Edges */}
                  <line x1="350" y1="180" x2="160" y2="90" stroke="#0058be" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="350" y1="180" x2="520" y2="90" stroke="#4648d4" strokeWidth="2" />
                  <line x1="350" y1="180" x2="200" y2="280" stroke="#00855b" strokeWidth="2" />
                  <line x1="350" y1="180" x2="500" y2="280" stroke="#adc6ff" strokeWidth="2" strokeDasharray="2 2" />
                  <line x1="160" y1="90" x2="520" y2="90" stroke="#c2c6d6" strokeWidth="1" />
                  <line x1="200" y1="280" x2="500" y2="280" stroke="#c2c6d6" strokeWidth="1" />

                  {/* Central Node: Project Phoenix */}
                  <circle cx="350" cy="180" r="42" fill="#0058be" className="animate-pulse opacity-20" />
                  <circle cx="350" cy="180" r="32" fill="#0058be" className="cursor-pointer" />
                  <text x="350" y="184" fill="#ffffff" fontFamily="Inter" fontSize="11" fontWeight="bold" textAnchor="middle">
                    Phoenix
                  </text>
                  <text x="350" y="196" fill="#adc6ff" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle">
                    42 edges
                  </text>

                  {/* Node 1: ADR-042 (PostgreSQL) */}
                  <g
                    className="cursor-pointer"
                    onClick={() => onNavigate('ask', 'Why did Project Phoenix choose PostgreSQL?')}
                  >
                    <circle cx="160" cy="90" r="26" fill="#2170e4" />
                    <text x="160" y="93" fill="#ffffff" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
                      ADR-042
                    </text>
                    <text x="160" y="103" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle">
                      Postgres 15
                    </text>
                  </g>

                  {/* Node 2: Kafka Streaming Backbone */}
                  <g className="cursor-pointer" onClick={() => onShowToast('Opening Kafka Stream RFC-108')}>
                    <circle cx="520" cy="90" r="26" fill="#4648d4" />
                    <text x="520" y="93" fill="#ffffff" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
                      RFC-108
                    </text>
                    <text x="520" y="103" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle">
                      Kafka Cluster
                    </text>
                  </g>

                  {/* Node 3: Deployment SOP */}
                  <g className="cursor-pointer" onClick={() => onShowToast('Opening Deployment SOP')}>
                    <circle cx="200" cy="280" r="24" fill="#00855b" />
                    <text x="200" y="283" fill="#ffffff" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
                      SOP-014
                    </text>
                    <text x="200" y="293" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle">
                      K8s Canary
                    </text>
                  </g>

                  {/* Node 4: SOC2 Compliance */}
                  <g className="cursor-pointer" onClick={() => onShowToast('Opening SOC2 Compliance Record')}>
                    <circle cx="500" cy="280" r="24" fill="#6063ee" />
                    <text x="500" y="283" fill="#ffffff" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
                      SOC2-POL
                    </text>
                    <text x="500" y="293" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle">
                      PII Vault
                    </text>
                  </g>
                </svg>

                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/30 text-xs font-mono-code text-on-surface shadow-sm">
                  Active Vector Cluster: <span className="text-primary font-bold">payments_core_v3</span> (38,412 vectors)
                </div>
              </div>
            </div>
          ) : (
            /* List Mode Knowledge Cards Feed */
            isLoading ? <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Loading current RAG documents…</p>
            : filteredItems.length === 0 ? <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">{loadError ? 'Current RAG documents could not be loaded.' : 'No current RAG documents match these filters.'}</p>
            : filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onInspectDocument(item)}
                className="group flex flex-col rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm hover:shadow-md transition-all border border-outline-variant/15 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-mono-code text-mono-code font-semibold uppercase ${
                        item.type === 'Decision'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : item.type === 'Process & SOP'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : item.type === 'Technical Spec'
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'bg-surface-variant text-on-surface'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[14px] text-outline">folder</span>
                      {item.project}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">
                        description
                      </span>
                      {item.authority}
                    </span>
                  </div>

                  <div className="flex items-center gap-space-2xs text-outline group-hover:text-on-surface transition-colors">
                    <button
                      onClick={(e) => handleToggleBookmark(item.id, e)}
                      className="p-1 rounded-lg hover:bg-surface-container-low transition-colors"
                      title={item.bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          item.bookmarked ? 'text-primary' : ''
                        }`}
                      >
                        {item.bookmarked ? 'bookmark_added' : 'bookmark'}
                      </span>
                    </button>
                    <button
                      onClick={(e) => handleShare(item.title, e)}
                      className="p-1 rounded-lg hover:bg-surface-container-low transition-colors"
                      title="Share Entity"
                    >
                      <span className="material-symbols-outlined text-[18px]">share</span>
                    </button>
                  </div>
                </div>

                <div className="mt-space-sm">
                  <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-space-2xs">
                    {item.description}
                  </p>
                </div>

                <div className="mt-space-md pt-space-sm border-t border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-container-high text-[9px] font-bold text-on-surface-variant">{item.author.name.slice(0, 2).toUpperCase()}</span>
                    <span className="font-medium text-on-surface">{item.author.name}</span>
                    <span>·</span>
                    <span>{item.source || 'Source not recorded'}</span>
                    <span>·</span>
                    <span className="font-mono-code text-[10px] text-primary font-semibold">
                      {item.tag}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-space-xs self-end sm:self-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onInspectDocument(item)}
                      className="flex items-center gap-1 px-space-sm py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-label-md text-label-md transition-colors"
                    >
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => onNavigate('ask', `What does ${item.title} specify?`)}
                      className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      <span>Ask Brain about this</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-space-md">
          <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-space-lg">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Current RAG corpus</h2>
            <p className="mt-1 text-xs text-on-surface-variant">Reference documents are stored separately from historical Hindsight experiences.</p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container-low p-3"><dt className="font-mono-code text-[10px] uppercase text-outline">Documents</dt><dd className="mt-1 text-lg font-semibold text-on-surface">{items.length}</dd></div>
              <div className="rounded-lg bg-surface-container-low p-3"><dt className="font-mono-code text-[10px] uppercase text-outline">Projects covered</dt><dd className="mt-1 text-lg font-semibold text-on-surface">{new Set(items.map((item) => item.projectId).filter(Boolean)).size}</dd></div>
            </dl>
            <h3 className="mt-4 border-t border-outline-variant/15 pt-3 text-xs font-semibold text-on-surface">Retrieved reference sources</h3>
            <ul className="mt-2 grid gap-2">{items.slice(0, 5).map((item) => <li key={item.id} className="rounded-lg bg-surface-container-low p-2.5"><div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-on-surface">{item.title}</span><span className="shrink-0 font-mono-code text-[9px] text-outline">{item.id}</span></div><p className="mt-1 text-[10px] text-on-surface-variant">{item.project} · {item.department || 'Department not recorded'}</p></li>)}</ul>
          </section>
        </aside>

        {/* Legacy simulated panel is unreachable; live RAG metrics are rendered above. */}
        <div className="hidden" aria-hidden="true">
          {/* Knowledge Health Score Card with Visual SVG Gauge */}
          <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Knowledge Integrity
              </span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">check_circle</span>
            </div>

            <div className="flex items-center gap-space-md mt-space-md">
              {/* Inline SVG Circular Gauge Chart (94%) */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Ring */}
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  {/* Progress Arc (94%) */}
                  <path
                    className="text-tertiary transition-all duration-1000 ease-out"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="94, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">94%</span>
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Health Score
                </span>
                <span className="font-body-sm text-body-sm text-tertiary font-medium">
                  Verified Authority Status
                </span>
                <p className="font-body-sm text-body-sm text-outline mt-0.5 line-clamp-2">
                  High confidence across architecture and compliance corpuses.
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-space-xs mt-space-md pt-space-sm border-t border-surface-container">
              <div
                onClick={() => onNavigate('feedback')}
                className="flex flex-col p-space-xs rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-1 text-outline">
                  <span className="material-symbols-outlined text-[16px] text-error">help_center</span>
                  <span className="font-label-sm text-label-sm">Unresolved</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">3</span>
                <span className="font-body-sm text-[11px] text-outline">Awaiting expert review</span>
              </div>

              <div
                onClick={() => onNavigate('system-health')}
                className="flex flex-col p-space-xs rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-1 text-outline">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">
                    sync_saved_locally
                  </span>
                  <span className="font-label-sm text-label-sm">Re-indexing</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">0</span>
                <span className="font-body-sm text-[11px] text-tertiary">All vectors synchronized</span>
              </div>
            </div>
          </div>

          {/* Interactive Graph Peek Preview Card */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-space-sm">
              <div className="flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[18px] text-secondary">share</span>
                <span className="font-headline-sm text-[15px] font-semibold text-on-surface">
                  Cluster Graph View
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono-code text-[10px]">
                Real-time RAG
              </span>
            </div>

            {/* Graph Decorative Simulation Canvas */}
            <div className="relative h-44 w-full rounded-xl bg-surface-container-low overflow-hidden flex items-center justify-center border border-outline-variant/15">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line stroke="#adc6ff" strokeDasharray="3 3" strokeWidth="1.5" x1="80" x2="160" y1="40" y2="88" />
                <line stroke="#adc6ff" strokeWidth="1.5" x1="160" x2="240" y1="88" y2="50" />
                <line stroke="#adc6ff" strokeWidth="1.5" x1="160" x2="200" y1="88" y2="135" />
                <line stroke="#adc6ff" strokeWidth="1.5" x1="160" x2="100" y1="88" y2="130" />
                <line stroke="#c0c1ff" strokeWidth="1.5" x1="240" x2="290" y1="50" y2="110" />

                {/* Node 1: Central Hub */}
                <circle className="animate-pulse" cx="160" cy="88" fill="#0058be" r="14" />
                <circle cx="160" cy="88" fill="#ffffff" r="6" />

                {/* Connected Satellite Nodes */}
                <circle cx="80" cy="40" fill="#2170e4" r="9" />
                <circle cx="240" cy="50" fill="#4648d4" r="10" />
                <circle cx="200" cy="135" fill="#00855b" r="8" />
                <circle cx="100" cy="130" fill="#adc6ff" r="7" />
                <circle cx="290" cy="110" fill="#6063ee" r="6" />
              </svg>

              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-surface/90 backdrop-blur-sm shadow-sm flex items-center gap-1.5 border border-outline-variant/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                <span className="font-mono-code text-[11px] text-on-surface">
                  Central: Project Phoenix (42 edges)
                </span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-sm">
              Semantic relationships extracted automatically across ADRs, PR descriptions, and Notion specs.
            </p>

            <button
              onClick={() => setViewMode('graph')}
              className="mt-space-sm w-full py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Explore Full Graph Canvas</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Top Contributors Leaderboard */}
          <div className="flex flex-col rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <div className="flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[18px] text-primary">military_tech</span>
                <span className="font-headline-sm text-[15px] font-semibold text-on-surface">
                  Top Contributors
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-outline">Last 30 Days</span>
            </div>

            <div className="flex flex-col divide-y divide-surface-container">
              {/* Contributor 1 */}
              <div
                onClick={() => onNavigate('experts')}
                className="flex items-center justify-between py-space-sm hover:bg-surface-container-low px-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="font-mono-code text-mono-code font-bold text-outline w-4">01</span>
                  <img
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    src={undefined}
                    alt="Alex Morgan"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                      Alex Morgan
                    </span>
                    <span className="font-label-sm text-[11px] text-outline truncate">
                      Platform &amp; Infra
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono-code text-mono-code font-semibold text-primary">34 docs</span>
                  <span className="font-label-sm text-[10px] text-tertiary">99.2% accuracy</span>
                </div>
              </div>

              {/* Contributor 2 */}
              <div
                onClick={() => onNavigate('experts')}
                className="flex items-center justify-between py-space-sm hover:bg-surface-container-low px-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="font-mono-code text-mono-code font-bold text-outline w-4">02</span>
                  <img
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    src={undefined}
                    alt="Sarah Chen"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                      Sarah Chen
                    </span>
                    <span className="font-label-sm text-[11px] text-outline truncate">
                      Enterprise Arch
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono-code text-mono-code font-semibold text-primary">28 docs</span>
                  <span className="font-label-sm text-[10px] text-tertiary">98.5% accuracy</span>
                </div>
              </div>

              {/* Contributor 3 */}
              <div
                onClick={() => onNavigate('experts')}
                className="flex items-center justify-between py-space-sm hover:bg-surface-container-low px-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="font-mono-code text-mono-code font-bold text-outline w-4">03</span>
                  <img
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    src={undefined}
                    alt="Marcus Vance"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                      Marcus Vance
                    </span>
                    <span className="font-label-sm text-[11px] text-outline truncate">Site Reliability</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono-code text-mono-code font-semibold text-primary">21 docs</span>
                  <span className="font-label-sm text-[10px] text-tertiary">97.8% accuracy</span>
                </div>
              </div>

              {/* Contributor 4 */}
              <div
                onClick={() => onNavigate('experts')}
                className="flex items-center justify-between py-space-sm hover:bg-surface-container-low px-1 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="font-mono-code text-mono-code font-bold text-outline w-4">04</span>
                  <img
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    src={undefined}
                    alt="David Kim"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                      David Kim
                    </span>
                    <span className="font-label-sm text-[11px] text-outline truncate">SecOps &amp; GRC</span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono-code text-mono-code font-semibold text-primary">19 docs</span>
                  <span className="font-label-sm text-[10px] text-tertiary">99.9% accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
