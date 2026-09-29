import React, { useState } from 'react';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { citation: string; correction: string }) => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [citation, setCitation] = useState('Doc #ADR-042 (Phoenix Architecture Decision, p.4)');
  const [correction, setCorrection] = useState(
    'The Architecture Review Board officially approved the PostgreSQL decision on March 12, 2024, following ADR-042 review. PostgreSQL 16 was also designated for pgvector semantic retrieval extension.'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correction.trim()) return;
    onSubmit({ citation, correction });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-2xl border border-outline-variant/30 flex flex-col gap-space-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Propose Expert Correction
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Updates feed into Human-In-The-Loop verified memory lake
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm font-semibold text-on-surface">
              Associated Citation
            </label>
            <div className="relative">
              <select
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                className="w-full h-10 px-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none border border-outline-variant/20 appearance-none"
              >
                <option value="Doc #ADR-042 (Phoenix Architecture Decision, p.4)">
                  Doc #ADR-042 (Phoenix Architecture Decision, p.4)
                </option>
                <option value="ENG-STD-12 (Database Engineering Standard, Sec 3.2)">
                  ENG-STD-12 (Database Engineering Standard, Sec 3.2)
                </option>
                <option value="PRD-REV-09 (Phoenix Design Review, p.12)">
                  PRD-REV-09 (Phoenix Design Review, p.12)
                </option>
                <option value="General Knowledge Synthesis Correction">
                  General Knowledge Synthesis Correction
                </option>
              </select>
              <span className="material-symbols-outlined text-[18px] text-outline absolute right-2.5 top-2.5 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm font-semibold text-on-surface">
              Correction Note / Revision Proposal
            </label>
            <textarea
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              className="w-full p-space-sm rounded-xl bg-surface text-on-surface font-body-md text-body-md focus:outline-none resize-none shadow-inner border border-outline-variant/30 focus:border-primary transition-colors"
              placeholder="Detail the precise institutional context change..."
              rows={4}
              required
            />
          </div>

          <div className="p-space-xs rounded-xl bg-surface-container-low flex items-start gap-2 text-tertiary">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified</span>
            <span className="font-body-sm text-body-sm">
              Alex Morgan (Tech Lead) submitted updates auto-qualify for expedited merge into pgvector memory clusters.
            </span>
          </div>

          <div className="flex items-center justify-end gap-space-xs pt-space-xs border-t border-outline-variant/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm transition-all"
            >
              Submit for Ratification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
