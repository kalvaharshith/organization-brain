import React, { useState } from 'react';
import { NavigationPath, DecisionRecord } from '../types';
import { INITIAL_DECISIONS, AVATARS } from '../data/mockData';

interface DecisionsViewProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
  onOpenCorrectionModal: () => void;
}

export const DecisionsView: React.FC<DecisionsViewProps> = ({
  onNavigate,
  onShowToast,
  onOpenCorrectionModal
}) => {
  const [decisions, setDecisions] = useState<DecisionRecord[]>(INITIAL_DECISIONS);
  const [selectedDec, setSelectedDec] = useState<DecisionRecord | null>(INITIAL_DECISIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'In Review' | 'Superseded'>('All');
  const [activeTab, setActiveTab] = useState<'rationale' | 'eval' | 'signatures'>('rationale');

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.adrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.project.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Top Banner */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-outline-variant/15 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed/40 text-secondary font-mono-code text-[11px] font-semibold mb-2">
              <span className="material-symbols-outlined text-[13px]">balance</span>
              <span>ARCHITECTURE GOVERNANCE · RATIFIED ADRS</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-display">
              Architecture Decision Records (ADRs)
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Immutable technical choices, trade-off evaluations, and consensus sign-offs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCorrectionModal}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 border border-outline-variant/30 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-error">edit_note</span>
              <span>Propose ADR Revision</span>
            </button>
            <button
              onClick={() => onNavigate('ask', 'What ADRs govern database choices in Project Phoenix?')}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-on-primary text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span>Ask Brain on ADRs</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="max-w-7xl mx-auto mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ADRs by number, title, project, or keywords..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider font-mono-code mr-1">
              Status:
            </span>
            {(['All', 'Approved', 'In Review', 'Superseded'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/20'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Split Layout: List on Left, Deep Inspector on Right */}
      <section className="px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Decision Cards */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-outline font-mono-code px-1">
              <span>{filteredDecisions.length} Decisions Found</span>
              <span>Sorted by Ratification Date</span>
            </div>

            {filteredDecisions.map((dec) => {
              const isSelected = selectedDec?.id === dec.id;
              return (
                <div
                  key={dec.id}
                  onClick={() => setSelectedDec(dec)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container-low border-primary/60 shadow-sm ring-1 ring-primary/20'
                      : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/50 hover:bg-surface-container-low/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono-code text-xs px-2 py-0.5 rounded bg-surface-container-high font-bold text-primary border border-outline-variant/30">
                      {dec.adrNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        dec.status === 'Approved'
                          ? 'bg-tertiary-fixed/40 text-tertiary border border-tertiary/20'
                          : dec.status === 'In Review'
                          ? 'bg-secondary-fixed/40 text-secondary border border-secondary/20'
                          : 'bg-error-container text-on-error-container'
                      }`}
                    >
                      {dec.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-on-surface">{dec.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
                    {dec.summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-outline-variant/15 flex items-center justify-between text-[11px] text-outline">
                    <span className="font-medium text-on-surface-variant">{dec.project}</span>
                    <span className="font-mono-code">{dec.date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Full ADR Details / Spec Viewer */}
          {selectedDec ? (
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col sticky top-24">
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs px-2.5 py-1 rounded bg-surface-container-highest font-bold text-primary border border-outline-variant/30">
                      {selectedDec.adrNumber}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary">
                      {selectedDec.status}
                    </span>
                  </div>
                  <span className="text-xs text-outline font-mono-code">{selectedDec.date}</span>
                </div>

                <h2 className="text-xl font-bold text-on-surface">{selectedDec.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
                  <span>
                    Project:{' '}
                    <strong className="text-on-surface font-semibold">{selectedDec.project}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Author: <strong className="text-on-surface font-semibold">{selectedDec.author}</strong>
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mt-5 border-b border-outline-variant/20">
                  <button
                    onClick={() => setActiveTab('rationale')}
                    className={`pb-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                      activeTab === 'rationale'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-outline hover:text-on-surface'
                    }`}
                  >
                    Decision & Rationale
                  </button>
                  <button
                    onClick={() => setActiveTab('eval')}
                    className={`pb-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                      activeTab === 'eval'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-outline hover:text-on-surface'
                    }`}
                  >
                    Trade-offs Evaluated
                  </button>
                  <button
                    onClick={() => setActiveTab('signatures')}
                    className={`pb-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                      activeTab === 'signatures'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-outline hover:text-on-surface'
                    }`}
                  >
                    Ratification & Signatures
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 text-xs space-y-4 max-h-[550px] overflow-y-auto leading-relaxed">
                {activeTab === 'rationale' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px] font-mono-code text-outline mb-1.5">
                        Context & Problem Statement
                      </h4>
                      <p className="text-on-surface bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
                        {selectedDec.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px] font-mono-code text-outline mb-1.5">
                        Formal Rationale & Architecture Impact
                      </h4>
                      <p className="text-on-surface bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
                        {selectedDec.fullRationale ||
                          'This architectural decision was ratified by the Review Board to ensure strict consistency and avoid uncoordinated database partition drift across payment nodes.'}
                      </p>
                    </div>

                    <div className="bg-primary-fixed/20 p-4 rounded-xl border border-primary-fixed/30 flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                        auto_awesome
                      </span>
                      <div>
                        <h5 className="font-bold text-primary text-xs">Hindsight RAG Grounding Guarantee</h5>
                        <p className="text-on-surface-variant text-[11px] mt-0.5">
                          This ADR is indexed as canonical knowledge in pgvector (1,536-dim embedding). Any contradictory
                          chat inference will trigger automated citation flags.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'eval' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px] font-mono-code text-outline">
                      Options Matrix Considered
                    </h4>
                    <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-3 bg-surface-container-high p-2.5 font-mono-code text-[11px] font-bold text-on-surface">
                        <div>Candidate</div>
                        <div>Evaluation</div>
                        <div>Verdict</div>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 border-t border-outline-variant/15 items-center">
                        <span className="font-semibold text-on-surface">PostgreSQL 15</span>
                        <span className="text-outline">ACID, JSONB, mature replication</span>
                        <span className="font-bold text-tertiary">Selected</span>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 border-t border-outline-variant/15 items-center bg-surface-container-low/50">
                        <span className="font-semibold text-on-surface">MongoDB Atlas</span>
                        <span className="text-outline">Lacks distributed multi-row ACID lock</span>
                        <span className="font-bold text-error">Rejected</span>
                      </div>
                      <div className="grid grid-cols-3 p-2.5 border-t border-outline-variant/15 items-center">
                        <span className="font-semibold text-on-surface">CockroachDB</span>
                        <span className="text-outline">High cost overhead for current scale</span>
                        <span className="font-bold text-secondary">Deferred</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'signatures' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-on-surface uppercase tracking-wider text-[11px] font-mono-code text-outline">
                      Ratification Committee Signatures
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={AVATARS.alex}
                            alt="Alex Morgan"
                            className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
                          />
                          <div>
                            <p className="font-bold text-on-surface">Alex Morgan</p>
                            <p className="text-[10px] text-outline">Tech Lead & Principal Architect</p>
                          </div>
                        </div>
                        <span className="font-mono-code text-[10px] text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded font-bold">
                          SIGNED · SHA256-OK
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={AVATARS.sarah}
                            alt="Sarah Chen"
                            className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
                          />
                          <div>
                            <p className="font-bold text-on-surface">Sarah Chen</p>
                            <p className="text-[10px] text-outline">Staff Enterprise Architect</p>
                          </div>
                        </div>
                        <span className="font-mono-code text-[10px] text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded font-bold">
                          SIGNED · SHA256-OK
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={AVATARS.david}
                            alt="David Kim"
                            className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
                          />
                          <div>
                            <p className="font-bold text-on-surface">David Kim</p>
                            <p className="text-[10px] text-outline">Security Council Arbiter</p>
                          </div>
                        </div>
                        <span className="font-mono-code text-[10px] text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded font-bold">
                          SIGNED · SHA256-OK
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
                <button
                  onClick={onOpenCorrectionModal}
                  className="px-3.5 py-2 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-error">edit</span>
                  <span>Propose Revision</span>
                </button>
                <button
                  onClick={() =>
                    onNavigate('ask', `Explain why ${selectedDec.adrNumber} (${selectedDec.title}) was chosen and what alternatives were rejected.`)
                  }
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">neurology</span>
                  <span>Ask Brain About This ADR</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
