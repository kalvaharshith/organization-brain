import React, { useState, useEffect } from 'react';
import { NavigationPath } from '../types';
import { INITIAL_KNOWLEDGE_ITEMS, INITIAL_PROJECTS, INITIAL_DECISIONS, INITIAL_EXPERTS } from '../data/mockData';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredKnowledge = INITIAL_KNOWLEDGE_ITEMS.filter((k) =>
    k.title.toLowerCase().includes(query.toLowerCase()) ||
    k.description.toLowerCase().includes(query.toLowerCase()) ||
    k.project.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = INITIAL_PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase()) ||
    p.code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDecisions = INITIAL_DECISIONS.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    d.summary.toLowerCase().includes(query.toLowerCase()) ||
    d.adrNumber.toLowerCase().includes(query.toLowerCase())
  );

  const filteredExperts = INITIAL_EXPERTS.filter((exp) =>
    exp.name.toLowerCase().includes(query.toLowerCase()) ||
    exp.role.toLowerCase().includes(query.toLowerCase()) ||
    exp.department.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-on-background/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20 bg-surface-container-lowest">
          <span className="material-symbols-outlined text-[22px] text-primary">search</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command, ask a question, or search knowledge graph..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none font-body-md text-on-surface placeholder:text-outline text-base"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[11px] text-outline">
            ESC
          </kbd>
        </div>

        {/* Quick Nav Shortcut Actions */}
        <div className="p-3 max-h-[60vh] overflow-y-auto divide-y divide-outline-variant/10">
          {/* Quick Brain Query */}
          {query.trim().length > 0 && (
            <div className="pb-2">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline px-2 block mb-1">
                AI Synthesis
              </span>
              <button
                onClick={() => {
                  onNavigate('ask', query);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-primary-fixed/30 text-left transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    auto_awesome
                  </span>
                  <span className="font-label-md text-sm text-on-surface truncate">
                    Ask the Brain: "{query}"
                  </span>
                </div>
                <span className="font-mono-code text-[11px] text-primary">Press ↵</span>
              </button>
            </div>
          )}

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div className="py-2">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline px-2 block mb-1">
                Projects
              </span>
              {filteredProjects.slice(0, 3).map((prj) => (
                <button
                  key={prj.id}
                  onClick={() => {
                    onNavigate('projects');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low text-left transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      rocket_launch
                    </span>
                    <span className="font-label-md text-sm text-on-surface truncate font-semibold">
                      {prj.name}
                    </span>
                    <span className="font-mono-code text-[10px] px-1.5 rounded bg-surface-container text-outline">
                      {prj.code}
                    </span>
                  </div>
                  <span className="font-label-sm text-xs text-outline">{prj.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Decisions */}
          {filteredDecisions.length > 0 && (
            <div className="py-2">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline px-2 block mb-1">
                Architecture Decisions (ADRs)
              </span>
              {filteredDecisions.slice(0, 3).map((dec) => (
                <button
                  key={dec.id}
                  onClick={() => {
                    onNavigate('decisions');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low text-left transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary">balance</span>
                    <span className="font-label-md text-sm text-on-surface truncate">
                      {dec.adrNumber}: {dec.title}
                    </span>
                  </div>
                  <span className="font-mono-code text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-tertiary font-semibold">
                    {dec.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Knowledge Documents */}
          {filteredKnowledge.length > 0 && (
            <div className="py-2">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline px-2 block mb-1">
                Knowledge Documents &amp; Specs
              </span>
              {filteredKnowledge.slice(0, 3).map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    onNavigate('knowledge');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low text-left transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-tertiary">
                      description
                    </span>
                    <span className="font-label-md text-sm text-on-surface truncate">
                      {k.title}
                    </span>
                  </div>
                  <span className="font-label-sm text-xs text-outline">{k.project}</span>
                </button>
              ))}
            </div>
          )}

          {/* Experts */}
          {filteredExperts.length > 0 && (
            <div className="py-2">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline px-2 block mb-1">
                Subject Matter Experts
              </span>
              {filteredExperts.slice(0, 3).map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => {
                    onNavigate('experts');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low text-left transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={exp.avatar}
                      alt={exp.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-label-md text-sm text-on-surface truncate font-semibold">
                      {exp.name}
                    </span>
                    <span className="font-label-sm text-xs text-outline truncate">
                      {exp.role}
                    </span>
                  </div>
                  <span className="font-mono-code text-[11px] text-primary">
                    {exp.contributions} docs
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-surface-container-low/60 border-t border-outline-variant/15 flex items-center justify-between text-outline font-label-sm text-xs">
          <span>Navigate with ↑ ↓ · Press Enter to execute</span>
          <span className="font-mono-code text-tertiary">Organizational Brain</span>
        </div>
      </div>
    </div>
  );
};
