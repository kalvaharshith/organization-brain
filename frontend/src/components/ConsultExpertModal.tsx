import React, { useState } from 'react';
import { ExpertItem } from '../types';
import { AVATARS } from '../data/mockData';

interface ConsultExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert?: ExpertItem | null;
  onSubmit: (expertName: string, message: string) => void;
}

export const ConsultExpertModal: React.FC<ConsultExpertModalProps> = ({
  isOpen,
  onClose,
  expert,
  onSubmit
}) => {
  const targetExpert = expert || {
    id: 'exp-2',
    name: 'Dr. Elena Rostova',
    role: 'Lead Data Architect',
    department: 'Data Platform',
    avatar: AVATARS.elena,
    contributions: 29,
    accuracy: '98.9%',
    specialty: ['pgvector', 'PostgreSQL Specialist', 'Schema Migration']
  };

  const [message, setMessage] = useState(
    'Hi Dr. Elena, could you clarify whether PostgreSQL 16 was ratified specifically for native pgvector HNSW indexing in Project Phoenix?'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSubmit(targetExpert.name, message);
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
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">forum</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                Consult Domain Expert
              </span>
              <span className="font-label-sm text-label-sm text-outline">
                Opens an authenticated inquiry thread linked to the Memory Lake
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

        {/* Selected Expert Summary Card */}
        <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20">
          <div className="flex items-center gap-space-xs min-w-0">
            <img
              src={targetExpert.avatar}
              alt={targetExpert.name}
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-primary/30"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-sm font-bold text-on-surface truncate">
                {targetExpert.name}
              </span>
              <span className="font-body-sm text-xs text-outline truncate">
                {targetExpert.role} · {targetExpert.department}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-mono-code text-[11px] font-semibold shrink-0">
            Domain Lead
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-sm text-label-sm font-semibold text-on-surface">
              Inquiry / Architectural Question
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-space-sm rounded-xl bg-surface text-on-surface font-body-md text-body-md focus:outline-none resize-none shadow-inner border border-outline-variant/30 focus:border-primary transition-colors"
              placeholder="State your question for the expert..."
              rows={4}
              required
            />
          </div>

          <div className="p-space-xs rounded-xl bg-surface-container-low flex items-center gap-2 text-outline font-label-sm text-xs">
            <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
            <span>Expert responses automatically become verified citations in the RAG Graph.</span>
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
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>Send Inquiry Thread</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
