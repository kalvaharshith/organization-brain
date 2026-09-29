import React from 'react';
import { NavigationPath } from '../types';

interface HeaderProps {
  currentPath: NavigationPath;
  onNavigate: (path: NavigationPath) => void;
  collapsed: boolean;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  collapsed,
  onOpenCommandPalette
}) => {
  const getBreadcrumb = () => {
    switch (currentPath) {
      case 'brain':
        return { section: 'Current context', title: 'Organizational Brain' };
      case 'ask':
        return { section: 'Learning loop', title: 'Organizational Memory' };
      case 'knowledge':
        return { section: 'Current knowledge', title: 'Knowledge Explorer' };
      case 'projects':
        return { section: 'Workspace', title: 'Projects' };
      case 'decisions':
        return { section: 'Governance', title: 'Decisions & ADRs' };
      case 'experts':
        return { section: 'Network', title: 'Subject Matter Experts' };
      case 'feedback':
        return { section: 'Governance & Ops', title: 'Expert Review & Feedback' };
      case 'system-health':
        return { section: 'Governance & Ops', title: 'Brain System Health' };
      case 'ingest':
        return { section: 'Knowledge Ingestion', title: 'Active Pipeline' };
      case 'architecture':
        return { section: 'Engineering', title: 'System Architecture & Schemas' };
      default:
        return { section: 'Workspace', title: 'Overview' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/15 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 h-full">
        {/* Left: Breadcrumbs & Memory Lake Beacon */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 font-label-md text-xs sm:text-sm text-on-surface-variant">
            <span
              onClick={() => onNavigate('brain')}
              className="text-outline hover:text-on-surface cursor-pointer font-medium"
            >
              Organizational Brain
            </span>
            <span className="text-outline/60">/</span>
            <span className="text-outline/80 hidden sm:inline">{breadcrumb.section}</span>
            <span className="text-outline/60 hidden sm:inline">/</span>
            <span className="text-on-surface font-semibold truncate max-w-[140px] sm:max-w-none">
              {breadcrumb.title}
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-low text-[11px] font-mono-code text-tertiary border border-tertiary-fixed/30">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            <span>Current knowledge + hindsight</span>
          </div>
        </div>

        {/* Center: Omni-Search trigger */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 h-9 w-full px-3 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all text-left group border border-outline-variant/20 focus:outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-outline group-hover:text-primary transition-colors">
              search
            </span>
            <span className="text-xs text-outline flex-1 truncate">
              Search documents, ADRs, projects, experts...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface font-mono-code text-[10px] text-outline shadow-xs border border-outline-variant/30">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick actions, notifications, user avatar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('ask')}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/95 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>Ask the Brain</span>
          </button>

          <span className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-2 py-1 font-mono-code text-[9px] text-outline">SYNTHETIC DATA</span>
        </div>
      </div>
    </header>
  );
};
