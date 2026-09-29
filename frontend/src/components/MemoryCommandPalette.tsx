import React, { useEffect, useState } from 'react';
import { ArrowRight, Brain, Search } from 'lucide-react';
import { NavigationPath } from '../types';

interface MemoryCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
}

export const MemoryCommandPalette: React.FC<MemoryCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter' && query.trim()) {
        onNavigate('ask', query.trim());
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, onNavigate, query]);

  if (!isOpen) return null;

  const openMemoryLab = () => {
    onNavigate('ask', query.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-on-background/50 p-4 pt-20 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-label="Search organizational memory" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center gap-3 border-b border-outline-variant/20 px-4 py-3.5">
          <Search className="h-5 w-5 text-primary" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') openMemoryLab();
            }}
            placeholder="Describe a new task or search historical experience..."
            className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
          />
          <kbd className="rounded bg-surface-container px-1.5 py-0.5 font-mono-code text-[10px] text-outline">ESC</kbd>
        </div>
        <div className="p-3">
          <button onClick={openMemoryLab} className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-primary-fixed/30">
            <span className="flex min-w-0 items-center gap-3">
              <Brain className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0"><span className="block text-sm font-semibold text-on-surface">Investigate with the Organizational Brain</span><span className="mt-0.5 block truncate text-xs text-on-surface-variant">Compare current knowledge with past organizational outcomes before making a recommendation.</span></span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </button>
        </div>
      </section>
    </div>
  );
};