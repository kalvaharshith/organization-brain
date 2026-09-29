import React, { useEffect, useState } from 'react';
import { NavigationPath, ProjectItem } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status})`);
  }
  return payload as T;
}

interface ProjectsViewProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
}

type ProjectHistoryValue = string | string[] | Array<Record<string, string>>;

interface ProjectHistory {
  [key: string]: ProjectHistoryValue;
}

interface LiveProject extends ProjectItem {
  history: ProjectHistory;
  tasks: string[];
  technology_stack: string[];
}

interface RagDocument {
  id: string;
  title: string;
  project_id: string | null;
  source_reference: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onNavigate, onShowToast }) => {
  const [projects, setProjects] = useState<LiveProject[]>([]);
  const [ragDocuments, setRagDocuments] = useState<RagDocument[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<LiveProject | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api<{ projects: Array<{ id: string; code: string; name: string; status: string; requirements: string; technology_stack: string[]; tasks: string[]; department_id: string; department_name: string; owner_id: string; owner_name: string; history: ProjectHistory; }> }>(`/organization/projects`),
      api<{ items: RagDocument[] }>('/documents'),
      api<{ people: Array<{ id: string; name: string }> }>('/organization/people'),
    ])
      .then(([result, documents, people]) => {
        if (!isMounted) return;
        const peopleById = new Map(people.people.map((person) => [person.id, person.name]));
        setRagDocuments(documents.items);
        const mapped = result.projects.map((project) => ({
          id: project.id,
          code: project.code,
          name: project.name,
          description: project.requirements,
          lead: project.owner_name || peopleById.get(project.owner_id) || project.owner_id,
          leadAvatar: '',
          status: project.status,
          department: project.department_name || project.department_id,
          documentsCount: project.tasks.length,
          decisionsCount: Array.isArray(project.history.related_project_ids) ? project.history.related_project_ids.length : 0,
          lastUpdated: 'Canonical database',
          history: project.history,
          tasks: project.tasks,
          technology_stack: project.technology_stack,
        }));
        setProjects(mapped);
      })
      .catch((error: unknown) => {
        if (isMounted) setLoadError(error instanceof Error ? error.message : 'Canonical projects are unavailable');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lead.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'All' ? true : p.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Top Banner */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-outline-variant/15 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed/30 text-primary font-mono-code text-[11px] font-semibold mb-2">
              <span className="material-symbols-outlined text-[13px]">folder_supervised</span>
              <span>CANONICAL PROJECT HISTORY · {projects.length} PROJECTS</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-display">
              Projects & Strategic Initiatives
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Canonical project state, active tasks, owners, and connected project histories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('ingest')}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 border border-outline-variant/30 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">cloud_upload</span>
              <span>Ingest Initiative Docs</span>
            </button>
            <button
              onClick={() => onNavigate('ask', 'Compare Phoenix Data Migration and Atlas Analytics Platform database migration histories')}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-on-primary text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">neurology</span>
              <span>Ask the Brain About Projects</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="max-w-7xl mx-auto mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name, code, description, or lead..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider font-mono-code mr-1">
              Status:
            </span>
            {['All', ...new Set(projects.map((project) => project.status))].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-secondary text-on-secondary font-semibold shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/20'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loadError && <p role="alert" className="col-span-full rounded-lg border border-error/20 bg-error-container/40 p-3 text-sm text-on-error-container">{loadError}</p>}
          {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-5 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-fixed/20 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono-code text-[11px] px-2 py-0.5 rounded-md bg-surface-container font-bold text-primary border border-outline-variant/30">
                      {project.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        project.status.includes('Active')
                          ? 'bg-tertiary-fixed/40 text-tertiary border border-tertiary/20'
                          : 'bg-secondary-fixed/40 text-secondary border border-secondary/20'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{project.name}</span>
                    <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 text-primary transition-all">
                      arrow_forward
                    </span>
                  </h3>

                  <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs">
                    <span className="text-outline text-[11px] font-medium">{project.department}</span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface text-[10px] font-semibold">
                      {project.tasks.length} tasks · {project.decisionsCount} linked projects
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-outline-variant/15">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-container-high text-[9px] font-bold text-on-surface-variant">{project.lead.slice(0, 2).toUpperCase()}</span>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-on-surface">{project.lead}</span>
                        <span className="text-[9px] text-outline">Canonical owner</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-outline font-mono-code">{project.lastUpdated}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-surface-container-low rounded-lg p-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-on-surface font-mono-code">{project.documentsCount}</div>
                      <div className="text-[10px] text-outline">Canonical tasks</div>
                    </div>
                    <div className="border-l border-outline-variant/20">
                      <div className="font-bold text-primary font-mono-code">{project.decisionsCount}</div>
                      <div className="text-[10px] text-outline">Related projects</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('ask', `Summarize all architectural decisions and risks for ${project.name}`);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary">chat_bubble</span>
                      <span>Query Brain</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary-fixed/40 hover:bg-primary-fixed/70 text-primary text-[11px] font-semibold transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </section>

      {/* Project Detail Slide-over Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-outline-variant/20 flex items-start justify-between bg-surface-container-low">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-code text-xs px-2.5 py-0.5 rounded-md bg-surface font-bold text-primary border border-outline-variant/30">
                    {selectedProject.code}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary">
                    {selectedProject.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-on-surface mt-2">{selectedProject.name}</h2>
                <p className="text-xs text-on-surface-variant mt-1">{selectedProject.description}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/15">
                <div>
                  <span className="text-[10px] text-outline uppercase font-mono-code">Engineering Lead</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-container-high text-[8px] font-bold text-on-surface-variant">{selectedProject.lead.slice(0, 2).toUpperCase()}</span>
                    <span className="font-semibold text-on-surface">{selectedProject.lead}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-mono-code">Department</span>
                  <p className="font-semibold text-on-surface mt-1">{selectedProject.department}</p>
                </div>
                <div>
                  <span className="text-[10px] text-outline uppercase font-mono-code">Data source</span>
                  <p className="font-semibold text-on-surface mt-1">{selectedProject.lastUpdated}</p>
                </div>
              </div>

              <section>
                <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px] mb-2 font-mono-code text-outline">
                  Canonical project history
                </h4>
                <dl className="grid gap-2">
                  {Object.entries(selectedProject.history).map(([field, value]) => (
                    <div key={field} className="rounded-lg bg-surface-container-low p-3">
                      <dt className="font-semibold capitalize text-on-surface">{field.replaceAll('_', ' ')}</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-on-surface-variant">{Array.isArray(value) ? value.map((entry) => typeof entry === 'string' ? entry : `${entry.id}: ${entry.title} (${entry.status})`).join(', ') : value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section>
                <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px] mb-2 font-mono-code text-outline">
                  Current RAG standards
                </h4>
                <div className="grid gap-2">
                  {ragDocuments.filter((document) => document.project_id === selectedProject.id).map((document) => (
                    <article key={document.id} className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="font-semibold text-on-surface">{document.title}</h5>
                        <span className="font-mono-code text-[10px] text-outline">{document.id}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-on-surface-variant">{document.source_reference || 'Source reference not recorded'}</p>
                    </article>
                  ))}
                  {!ragDocuments.some((document) => document.project_id === selectedProject.id) && (
                    <p className="rounded-lg bg-surface-container-low p-3 text-on-surface-variant">No current RAG document is linked to this project.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedProject(null);
                  onNavigate('ingest');
                }}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">cloud_upload</span>
                <span>Upload Specs</span>
              </button>
              <button
                onClick={() => {
                  const name = selectedProject.name;
                  setSelectedProject(null);
                  onNavigate('ask', `What are the critical dependencies, architecture, and timeline for ${name}?`);
                }}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">neurology</span>
                <span>Launch Deep RAG Inquiry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
