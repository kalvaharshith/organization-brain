import React, { useState } from 'react';
import { NavigationPath, FeedbackTicket } from '../types';
import { INITIAL_TICKET, INITIAL_HISTORY, AVATARS } from '../data/mockData';

interface ExpertReviewProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
  onOpenCorrectionModal: () => void;
}

export const ExpertReview: React.FC<ExpertReviewProps> = ({
  onNavigate,
  onShowToast,
  onOpenCorrectionModal
}) => {
  const [ticket, setTicket] = useState<FeedbackTicket>(INITIAL_TICKET);
  const [pendingCount, setPendingCount] = useState(3);
  const [approvedMonthCount, setApprovedMonthCount] = useState(47);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Architecture' | 'SecOps'>('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCorrection, setEditedCorrection] = useState(ticket.proposedCorrection);

  const handleApprove = () => {
    setShowSuccessBanner(true);
    setPendingCount((prev) => Math.max(prev - 1, 0));
    setApprovedMonthCount((prev) => prev + 1);
    setTicket((prev) => ({ ...prev, status: 'approved' }));
    onShowToast('Embeddings updated successfully in Memory Lake!');
  };

  const handleReject = () => {
    setIsRejected(true);
    setPendingCount((prev) => Math.max(prev - 1, 0));
    onShowToast(`Correction ticket #${ticket.ticketNumber} rejected and moved to archive`);
  };

  const handleSaveEdit = () => {
    setTicket((prev) => ({ ...prev, proposedCorrection: editedCorrection }));
    setIsEditing(false);
    onShowToast('Correction revised and queued for confirmation');
  };

  const filteredHistory = INITIAL_HISTORY.filter((item) => {
    if (categoryFilter === 'All') return true;
    return item.category === categoryFilter;
  });

  return (
    <div className="py-4 sm:py-5 px-4 sm:px-6 lg:px-8 space-y-5 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      {/* Top Executive Header & Realtime KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div className="space-y-space-2xs">
          <div className="inline-flex items-center gap-space-xs px-space-xs py-0.5 rounded-full bg-surface-container-high text-primary font-mono-code text-mono-code">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            ACTIVE NEURAL CURATION LAYER
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Expert Review &amp; Learning Loop
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Help the Organizational Brain continuously learn and refine knowledge through human expert verification.
          </p>
        </div>

        {/* Live Sync Indicator */}
        <div className="flex items-center gap-space-xs self-start lg:self-auto bg-surface-container-lowest px-space-sm py-space-xs rounded-xl shadow-sm border border-outline-variant/20 text-outline font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-[16px] text-tertiary animate-spin">
            sync
          </span>
          <span>Auto-indexing enabled</span>
          <span className="mx-1">•</span>
          <span className="font-mono-code text-on-surface font-semibold">
            Queue: {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Stats Ribbon Grid (4 Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Metric 1: Pending Review */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-surface-container w-24 h-24 pointer-events-none group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[96px] opacity-40">pending_actions</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Pending Review</span>
            <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-mono-code text-[11px] font-semibold">
              Priority
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-display-hero text-display-hero text-on-surface tracking-tight">
              {pendingCount}
            </span>
            <span className="font-label-md text-label-md text-outline">corrections</span>
          </div>
          <div className="mt-space-xs flex items-center gap-1 font-body-sm text-body-sm text-error">
            <span className="material-symbols-outlined text-[16px]">priority_high</span>
            <span>1 high impact item awaiting sign-off</span>
          </div>
        </div>

        {/* Metric 2: Approved this month */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-surface-container w-24 h-24 pointer-events-none group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[96px] opacity-40">task_alt</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Approved this month</span>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-mono-code text-[11px] font-semibold">
              +18.2%
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-display-hero text-display-hero text-on-surface tracking-tight">
              {approvedMonthCount}
            </span>
            <span className="font-label-md text-label-md text-outline">updates</span>
          </div>
          <div className="mt-space-xs flex items-center gap-1 font-body-sm text-body-sm text-tertiary">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>Expanded consensus across 14 teams</span>
          </div>
        </div>

        {/* Metric 3: Knowledge Accuracy */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-surface-container w-24 h-24 pointer-events-none group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[96px] opacity-40">verified</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Knowledge Accuracy</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-mono-code text-[11px] font-semibold">
              99.0% Target
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-display-hero text-display-hero text-on-surface tracking-tight">
              98.4%
            </span>
            <span className="font-label-md text-label-md text-tertiary flex items-center">
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>+0.6%
            </span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden mt-space-xs">
            <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: '98.4%' }}></div>
          </div>
        </div>

        {/* Metric 4: Average verification time */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/15 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-surface-container w-24 h-24 pointer-events-none group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-[96px] opacity-40">schedule</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Average verification time</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono-code text-[11px] font-semibold">
              SLA: &lt; 8h
            </span>
          </div>
          <div className="mt-space-sm flex items-baseline gap-space-xs">
            <span className="font-display-hero text-display-hero text-on-surface tracking-tight">
              4.2
            </span>
            <span className="font-label-md text-label-md text-outline">hours</span>
          </div>
          <div className="mt-space-xs flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
            <span>Fastest turnaround: 11 mins</span>
          </div>
        </div>
      </div>

      {/* Middle Asymmetric Grid: Focal interactive Node & Architecture Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Primary Pending Correction Card (8 cols) */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl shadow-md p-space-lg relative overflow-hidden transition-all duration-300 border border-outline-variant/20">
          {/* Status Bar & Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-space-xs pb-space-sm">
            <div className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              <span>Needs Domain Expert Approval</span>
              <span className="text-outline">·</span>
              <span className="text-error font-medium">High Impact</span>
            </div>
            <div className="flex items-center gap-space-xs font-mono-code text-mono-code text-outline">
              <span>TICKET #{ticket.ticketNumber}</span>
              <span>•</span>
              <span>{ticket.timeAgo}</span>
            </div>
          </div>

          {/* Query Block */}
          <div className="mt-space-sm bg-surface-container-low/70 rounded-xl p-space-md border border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[16px]">help_center</span>
              Prompt / Question Ingested
            </div>
            <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {ticket.prompt}
            </p>
          </div>

          {/* Dual Comparison: Machine Answer vs Proposed Expert Truth */}
          <div className="mt-space-md grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* AI Original Output */}
            <div className="bg-surface-container-low/40 rounded-xl p-space-md flex flex-col justify-between border border-outline-variant/20">
              <div className="space-y-space-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                    AI Generated Output
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container/60 text-on-error-container font-mono-code text-[11px]">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    {ticket.aiStatus}
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant italic">
                  {ticket.aiOutput}
                </p>
              </div>
              <div className="pt-space-md mt-space-sm text-outline font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">source</span>
                {ticket.aiSource}
              </div>
            </div>

            {/* Expert Proposed Correction */}
            <div className="bg-surface-container-high/40 rounded-xl p-space-md flex flex-col justify-between shadow-sm border border-tertiary-fixed/40">
              <div className="space-y-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <img
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-outline/20"
                      src={ticket.expert.avatar}
                      alt={ticket.expert.name}
                    />
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {ticket.expert.name}
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      ({ticket.expert.role})
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-mono-code text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    {ticket.verifiedBy}
                  </span>
                </div>

                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={editedCorrection}
                      onChange={(e) => setEditedCorrection(e.target.value)}
                      className="w-full p-2 rounded-lg bg-surface text-on-surface font-body-md text-xs border border-primary outline-none"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-2 py-1 text-xs rounded bg-surface-container text-on-surface"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 text-xs rounded bg-primary text-white font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface font-medium leading-relaxed">
                    {ticket.proposedCorrection}
                  </p>
                )}
              </div>
              <div className="pt-space-md mt-space-sm text-tertiary font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">history_edu</span>
                {ticket.canonicalSource}
              </div>
            </div>
          </div>

          {/* Attached Citations & Evidence Pill Matrix */}
          <div className="mt-space-md space-y-space-xs">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
              Verified Documentation &amp; Attached Records
            </span>
            <div className="flex flex-wrap items-center gap-space-xs">
              <button
                onClick={() => onNavigate('decisions')}
                className="inline-flex items-center gap-space-xs px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface text-label-md font-label-md group border border-outline-variant/15"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">description</span>
                <span>ADR-042: Database Architecture Decision Record</span>
                <span className="font-mono-code text-[11px] text-outline group-hover:text-on-surface">
                  (Pg. 2, Sign-off section)
                </span>
                <span className="material-symbols-outlined text-[14px] text-outline">open_in_new</span>
              </button>

              <button
                onClick={() => onShowToast('Opened Engineering Meeting Minutes archive')}
                className="inline-flex items-center gap-space-xs px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface text-label-md font-label-md group border border-outline-variant/15"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">event_note</span>
                <span>Engineering Meeting Minutes</span>
                <span className="font-mono-code text-[11px] text-outline group-hover:text-on-surface">
                  (March 12, 2024)
                </span>
                <span className="material-symbols-outlined text-[14px] text-outline">open_in_new</span>
              </button>
            </div>
          </div>

          {/* Vector & RAG System Impact Banner */}
          <div className="mt-space-md p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-sm border border-outline-variant/15">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-headline-sm text-body-md font-semibold text-on-surface">
                  Knowledge Graph Impact Forecast
                </h4>
                <span className="font-mono-code text-[11px] px-2 py-0.2 rounded bg-surface-container-highest text-primary font-medium">
                  Embedding v3.2
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Approving this will update{' '}
                <strong className="text-on-surface">
                  {ticket.embeddingsCount} related RAG knowledge embeddings
                </strong>{' '}
                and auto-correct future responses for{' '}
                <strong className="text-on-surface">{ticket.engineersImpacted} engineers</strong> working on
                Project Phoenix.
              </p>
            </div>
          </div>

          {/* Decision Action Bar */}
          <div className="mt-space-lg pt-space-md flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-outline font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[18px] text-tertiary">security</span>
              Requires Peer Consensus or Tech Lead Signature
            </div>

            <div className="flex items-center gap-space-xs">
              <button
                onClick={handleReject}
                className="h-9 px-space-md rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                <span>Reject</span>
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="h-9 px-space-md rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Edit Correction</span>
              </button>

              <button
                onClick={handleApprove}
                className="h-9 px-space-lg rounded-lg bg-tertiary text-on-tertiary font-label-md text-label-md hover:bg-tertiary-container shadow-sm flex items-center gap-1.5 active:scale-95 transition-all font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Approve Correction &amp; Update Brain</span>
              </button>
            </div>
          </div>

          {/* Success Toast Banner Overlay */}
          {showSuccessBanner && (
            <div className="absolute inset-0 bg-surface/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-space-xl z-20 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-space-sm shadow-md">
                <span className="material-symbols-outlined text-[32px]">neurology</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                Embeddings Updated Successfully
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-space-2xs">
                4 vector chunks re-calculated and written to the Brain Memory Lake. Phoenix team workspace
                updated in real-time.
              </p>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="mt-space-md h-9 px-space-md rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-sm transition-all"
              >
                Review Next Pending Ticket
              </button>
            </div>
          )}

          {isRejected && (
            <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-space-xl z-20">
              <span className="material-symbols-outlined text-[32px] text-error mb-2">archive</span>
              <p className="font-headline-sm font-semibold text-on-surface">Ticket Archived</p>
              <button
                onClick={() => setIsRejected(false)}
                className="mt-3 px-3 py-1.5 text-xs rounded-lg bg-surface-container text-on-surface"
              >
                Undo
              </button>
            </div>
          )}
        </div>

        {/* Explainer Side Rail: 'How the Brain Learns' & Visual Pipeline (4 cols) */}
        <div className="lg:col-span-4 space-y-space-md">
          {/* Step Pipeline Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md font-semibold mb-space-xs">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
              <span>Closed-Loop Architecture</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">How the Brain Learns</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 mb-space-md">
              Continuous fine-tuning through validated human expertise creates unbreakable institutional truth.
            </p>

            {/* 4-step vertical sequence */}
            <div className="space-y-space-md relative">
              {/* Step 1 */}
              <div className="flex items-start gap-space-sm relative">
                <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container font-mono-code text-[12px] flex items-center justify-center shrink-0 font-bold z-10">
                  1
                </div>
                <div className="flex-1">
                  <span className="font-label-md text-label-md font-semibold text-on-surface block">
                    User flags discrepancy
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Team members flag ambiguous, outdated, or hallucinated AI outputs directly from chat.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-space-sm relative">
                <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container font-mono-code text-[12px] flex items-center justify-center shrink-0 font-bold z-10">
                  2
                </div>
                <div className="flex-1">
                  <span className="font-label-md text-label-md font-semibold text-on-surface block">
                    Domain expert verifies
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Subject matter experts cite authoritative tickets, PRDs, ADRs, or source code.
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-space-sm relative">
                <div className="w-7 h-7 rounded-full bg-surface-container-highest text-primary font-mono-code text-[12px] flex items-center justify-center shrink-0 font-bold z-10">
                  3
                </div>
                <div className="flex-1">
                  <span className="font-label-md text-label-md font-semibold text-on-surface block">
                    RAG Real-time Re-indexing
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Vector embeddings re-cluster immediately in pgvector database with boosted weights.
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-space-sm relative">
                <div className="w-7 h-7 rounded-full bg-tertiary text-on-tertiary font-mono-code text-[12px] flex items-center justify-center shrink-0 font-bold z-10">
                  4
                </div>
                <div className="flex-1">
                  <span className="font-label-md text-label-md font-semibold text-on-surface block">
                    Permanent Canonical Truth
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Synthesized response is locked with provenance badges for all future team inquiries.
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Metric Visual Sparkline */}
            <div className="mt-space-lg pt-space-md bg-surface-container-low rounded-xl p-space-sm flex items-center justify-between border border-outline-variant/15">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Memory Lake Status</span>
                <span className="font-headline-sm text-body-md font-bold text-on-surface">
                  1,482 Verified Nodes
                </span>
              </div>
              <svg className="w-20 h-10 text-primary" fill="none" viewBox="0 0 100 40">
                <path
                  d="M 0 35 Q 25 15, 50 25 T 100 5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
                <circle cx="100" cy="5" fill="currentColor" r="3.5" />
              </svg>
            </div>
          </div>

          {/* Curators of the Month Showcase */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                Top Knowledge Curators
              </span>
              <span className="font-label-sm text-label-sm text-tertiary">August 2024</span>
            </div>
            <div className="space-y-space-xs divide-y-0">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-space-xs">
                  <img
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-outline/20"
                    src={AVATARS.sarah}
                    alt="Sarah Chen"
                  />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-medium text-on-surface">
                      Sarah Chen
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Payments Architecture</span>
                  </div>
                </div>
                <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">
                  19 Verified
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-space-xs">
                  <img
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-outline/20"
                    src={AVATARS.david}
                    alt="David Kim"
                  />
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-medium text-on-surface">
                      David Kim
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">Data Infrastructure</span>
                  </div>
                </div>
                <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">
                  14 Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Approved Feedback History Table Section */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg space-y-space-md border border-outline-variant/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Recently Approved Feedback History
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Historical audit log of human-corrected organizational memories and verified citations.
            </p>
          </div>
          <div className="flex items-center gap-space-xs">
            {/* Quick Filter Pills */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
              <button
                onClick={() => setCategoryFilter('All')}
                className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                  categoryFilter === 'All'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                All (47)
              </button>
              <button
                onClick={() => setCategoryFilter('Architecture')}
                className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                  categoryFilter === 'Architecture'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                Architecture
              </button>
              <button
                onClick={() => setCategoryFilter('SecOps')}
                className={`px-space-sm py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                  categoryFilter === 'SecOps'
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                SecOps
              </button>
            </div>
          </div>
        </div>

        {/* High-Density Responsive Table View */}
        <div className="overflow-x-auto -mx-space-lg px-space-lg">
          <table className="w-full text-left min-w-[960px]">
            <thead>
              <tr className="bg-surface-container-low/60 rounded-xl">
                <th className="py-space-xs px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline rounded-l-xl">
                  Question
                </th>
                <th className="py-space-xs px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  AI Answer (Before)
                </th>
                <th className="py-space-xs px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  Expert
                </th>
                <th className="py-space-xs px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  Validated Correction (Brain State)
                </th>
                <th className="py-space-xs px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline">
                  Status
                </th>
                <th className="py-space-xs px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline rounded-r-xl">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-low/40 transition-colors group">
                  <td className="py-space-md px-space-sm align-top">
                    <span className="font-body-md text-body-md font-medium text-on-surface block max-w-xs">
                      {row.question}
                    </span>
                    <span className="font-mono-code text-[11px] text-outline">{row.ticketRef}</span>
                  </td>
                  <td className="py-space-md px-space-sm align-top">
                    <div className="p-2 rounded-lg bg-error-container/20 text-on-surface-variant font-body-sm text-body-sm max-w-xs line-through decoration-error/50">
                      {row.aiAnswerBefore}
                    </div>
                  </td>
                  <td className="py-space-md px-space-sm align-top whitespace-nowrap">
                    <div className="flex items-center gap-space-xs">
                      <div className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-sm text-[10px] font-bold">
                        {row.expertInitials}
                      </div>
                      <div>
                        <span className="font-label-md text-label-md font-medium text-on-surface block">
                          {row.expertName}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">
                          {row.expertRole}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-space-md px-space-sm align-top">
                    <div className="p-2 rounded-lg bg-tertiary-fixed/30 text-on-surface font-body-sm text-body-sm font-medium max-w-sm">
                      {row.validatedCorrection}
                    </div>
                    <span className="inline-flex items-center gap-1 font-label-sm text-[11px] text-tertiary mt-1">
                      <span className="material-symbols-outlined text-[13px]">link</span>
                      {row.sourceSyncNote}
                    </span>
                  </td>
                  <td className="py-space-md px-space-sm align-top whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-space-md px-space-sm align-top whitespace-nowrap font-mono-code text-mono-code text-on-surface-variant">
                    {row.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Status footer */}
        <div className="flex items-center justify-between pt-space-sm font-label-sm text-label-sm text-outline border-t border-outline-variant/15">
          <span>Showing {filteredHistory.length} of 47 verified memories</span>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => onShowToast('First page reached')}
              className="px-space-sm py-1 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
            >
              Previous
            </button>
            <button
              onClick={() => onShowToast('Loaded page 2 of verified memories')}
              className="px-space-sm py-1 rounded-lg bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container"
            >
              Next Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
