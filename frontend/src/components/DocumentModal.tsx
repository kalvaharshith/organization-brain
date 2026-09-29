import React from 'react';
import { KnowledgeItem } from '../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: KnowledgeItem | null;
  onAskBrain: (title: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onAskBrain
}) => {
  if (!isOpen || !doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-surface-container-lowest p-space-lg shadow-2xl border border-outline-variant/30 flex flex-col gap-space-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/20 pb-space-sm">
          <div className="flex flex-col gap-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-mono-code text-[11px] font-semibold uppercase">
                {doc.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-sm text-xs">
                {doc.project}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-xs font-semibold">
                {doc.authority}
              </span>
            </div>
            <h2 className="font-headline-sm text-lg font-bold text-on-surface mt-1">
              {doc.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low flex items-center justify-center shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Metadata info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs font-mono-code">
          <div>
            <span className="text-outline block text-[10px]">Source attribution</span>
            <span className="text-on-surface font-semibold">{doc.author.name}</span>
          </div>
          <div>
            <span className="text-outline block text-[10px]">Status</span>
            <span className="text-on-surface font-semibold">{doc.status || doc.authority}</span>
          </div>
          <div>
            <span className="text-outline block text-[10px]">Last Updated</span>
            <span className="text-on-surface">{doc.updatedAt}</span>
          </div>
          <div>
            <span className="text-outline block text-[10px]">Source type</span>
            <span className="text-primary font-semibold">{doc.source || doc.type}</span>
          </div>
        </div>

        {/* Content Abstract & Markdown Preview */}
        <div className="flex flex-col gap-space-xs">
          <span className="font-label-sm text-xs font-semibold text-outline uppercase tracking-wider">
            Current reference content
          </span>
          <p className="font-body-md text-sm text-on-surface leading-relaxed p- space-sm rounded-xl bg-surface-container-lowest border border-outline-variant/20">
            {doc.description}
          </p>
        </div>

        {/* Source lineage */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-xs font-semibold text-outline uppercase tracking-wider">Source lineage</span>
            <span className="font-mono-code text-[11px] text-primary">{doc.id}</span>
          </div>
          <p className="rounded-lg bg-surface-container-low p-3 text-xs leading-relaxed text-on-surface-variant">{doc.sourceReference || 'No additional source reference was recorded.'}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-space-xs border-t border-outline-variant/15 flex-wrap gap-2">
          <span className="font-mono-code text-xs text-outline">
            RAG document ID: {doc.id} · Current/reference knowledge
          </span>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-xs hover:bg-surface-container transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onAskBrain(`What does ${doc.title} say about implementation?`);
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Ask the Brain About This</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
