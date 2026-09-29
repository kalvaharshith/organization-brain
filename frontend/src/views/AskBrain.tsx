import React, { useState, useEffect } from 'react';
import { NavigationPath, KnowledgeItem } from '../types';
import { AVATARS, INITIAL_DECISIONS, INITIAL_EXPERTS } from '../data/mockData';

interface AskBrainProps {
  initialQuery?: string;
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
  onOpenCorrectionModal: () => void;
  onOpenConsultExpertModal: () => void;
  onInspectDocument: (doc: KnowledgeItem) => void;
}

export const AskBrain: React.FC<AskBrainProps> = ({
  initialQuery = 'Why did Project Phoenix choose PostgreSQL?',
  onNavigate,
  onShowToast,
  onOpenCorrectionModal,
  onOpenConsultExpertModal,
  onInspectDocument
}) => {
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [followUpText, setFollowUpText] = useState('');
  const [mode, setMode] = useState<'strict' | 'exploratory' | 'graph'>('strict');
  const [rightTab, setRightTab] = useState<'context' | 'trace'>('context');
  const [activeCitationDrawer, setActiveCitationDrawer] = useState<number | null>(1);
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Dynamic conversation thread
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      query: string;
      answer: string;
      citations: number[];
      corroboration: string;
      timestamp: string;
    }>
  >([
    {
      id: 'msg-1',
      query: initialQuery,
      answer:
        "Project Phoenix selected PostgreSQL primarily because the core ledger services demanded absolute ACID guarantees and relational integrity across multi-currency settlement rows [1], which earlier NoSQL prototypes could not provide without complex distributed locking [2]. Furthermore, PostgreSQL's mature native JSONB storage enabled dynamic schema evolution for unpredictable payment gateway payloads without compromising relational foreign keys to audited accounts [3], meeting the Q3 Architecture Board compliance requirement.",
      citations: [1, 2, 3],
      corroboration: '98.8%',
      timestamp: 'Today, 10:42 AM'
    }
  ]);

  useEffect(() => {
    if (initialQuery && initialQuery !== messages[0].query) {
      setCurrentQuery(initialQuery);
      handleNewQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleNewQuery = (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSynthesizing(true);

    setTimeout(() => {
      let customAnswer = '';
      const lower = queryText.toLowerCase();

      if (lower.includes('status') || lower.includes('current')) {
        customAnswer =
          'Project Phoenix is currently in Phase 3 (Beta Live) with 14 microservice pods active across US-East and US-West [1]. Core payment ingestion latency averages 18ms with 99.99% availability over the last 30 days [2]. All data partitions are synchronized with Patroni replication [3].';
      } else if (lower.includes('owner') || lower.includes('who owns') || lower.includes('payments platform')) {
        customAnswer =
          'The payments platform is owned by the Payments & Platform Engineering guild, led by Alex Morgan (Tech Lead) with Dr. Elena Rostova as Principal Data Architect [1]. Architecture revisions require consensus approval from the Arbiter Panel [2].';
      } else if (lower.includes('risk') || lower.includes('atlas')) {
        customAnswer =
          'The biggest risks in Project Atlas were identified in the Q1 Retrospective as distributed cache invalidation storms during peak loads above 50k req/s [1]. The team resolved this by transitioning to dual-keyed cache leases and adaptive backoff throttling [2].';
      } else if (lower.includes('decision') || lower.includes('month')) {
        customAnswer =
          '6 architecture decisions were ratified this month, notably ADR-104 (Database Architecture failover standard with Patroni synchronous replication) and ADR-049 (Asymmetric token authentication for intra-cluster service routing) [1].';
      } else {
        customAnswer = `Based on institutional knowledge across Project Phoenix and related ADRs, the query "${queryText}" aligns with ratified architectural patterns [1]. Evidence extracted from 4 corroborated graph nodes shows strong consensus among the architecture arbiter panel [2] with automated schema validation verified [3].`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          query: queryText,
          answer: customAnswer,
          citations: [1, 2, 3],
          corroboration: '98.4%',
          timestamp: 'Just now'
        }
      ]);
      setIsSynthesizing(false);
      setFollowUpText('');
      onShowToast(`Synthesized answer from 3 grounded sources`);
    }, 700);
  };

  const handleCitationClick = (citationNumber: number) => {
    setActiveCitationDrawer((prev) => (prev === citationNumber ? null : citationNumber));
    const cardEl = document.getElementById(`citation-card-${citationNumber}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      cardEl.classList.add('ring-2', 'ring-primary');
      setTimeout(() => {
        cardEl.classList.remove('ring-2', 'ring-primary');
      }, 1500);
    }
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    onShowToast('Citation permalink copied: #phoenix-adr042-pg');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="py-4 sm:py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* LEFT / MAIN WORKSPACE (8 of 12 cols ~= 66%) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg min-w-0">
          {/* Top Intelligence Command Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-surface-container-lowest shadow-xs border border-outline-variant/15">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
                  Ask the Brain
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline font-mono-code text-[11px]">
                  #Q-8824
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-tertiary font-mono-code text-mono-code">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container"></span>
                  </span>
                  <span>Brain Online · 3 Sources Grounded</span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono-code text-[11px] text-outline">
                <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                <span>Hindsight RAG + Groq Ultra-fast Inference</span>
                <span className="text-outline-variant">/</span>
                <span className="text-tertiary font-medium">98.8% Corroborated</span>
              </div>
            </div>

            {/* Mode Segment Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-surface-container-low shrink-0 self-start sm:self-auto border border-outline-variant/20">
              <button
                onClick={() => {
                  setMode('strict');
                  onShowToast('Switched to Strict Evidence Grounded Mode');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  mode === 'strict'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span className="whitespace-nowrap">Strict Evidence</span>
              </button>
              <button
                onClick={() => {
                  setMode('exploratory');
                  onShowToast('Switched to Exploratory Mode (Broader Synthesis)');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  mode === 'exploratory'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">explore</span>
                <span className="whitespace-nowrap">Exploratory</span>
              </button>
              <button
                onClick={() => {
                  setMode('graph');
                  setRightTab('trace');
                  onShowToast('Inspecting Neural Reasoning Graph');
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                  mode === 'graph'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span className="whitespace-nowrap">Inspect Graph</span>
              </button>
            </div>
          </div>

          {/* Dialogue Thread */}
          <div className="flex flex-col gap-space-lg">
            {messages.map((item) => (
              <div key={item.id} className="flex flex-col gap-space-md">
                {/* User Message Row */}
                <div className="flex items-start gap-space-md justify-end pl-6">
                  <div className="flex flex-col items-end gap-1.5 max-w-xl">
                    <div className="flex items-center gap-2 font-label-sm text-label-sm text-outline">
                      <span className="font-semibold text-on-surface">Alex Morgan</span>
                      <span>·</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <div className="p-space-md rounded-2xl rounded-tr-none bg-primary text-on-primary shadow-sm">
                      <p className="font-body-md text-body-md leading-relaxed">{item.query}</p>
                    </div>
                    <span className="font-mono-code text-[11px] text-outline">
                      Target: Project Phoenix ADRs · Vector namespace /eng/payments
                    </span>
                  </div>
                  <img
                    alt="Alex Morgan"
                    className="w-9 h-9 rounded-full object-cover shrink-0 mt-2 shadow-sm ring-1 ring-outline/20"
                    src={AVATARS.alex}
                  />
                </div>

                {/* AI Grounded Synthesis Card */}
                <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-md border border-outline-variant/20">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary-container"></div>
                  <div className="p-space-lg flex flex-col gap-space-md">
                    {/* Grounding Badge & Confidence Metrics */}
                    <div className="flex flex-wrap items-center justify-between gap-space-xs pb-space-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-tertiary font-label-md text-label-md border border-tertiary-fixed/30">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">
                            verified_user
                          </span>
                          <span className="font-semibold">Grounded Answer</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-mono-code text-mono-code border border-outline-variant/20">
                          <span className="text-primary font-bold">{item.corroboration}</span>
                          <span>Confidence</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-outline font-label-sm text-label-sm">
                          <span>3 Verified Sources</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 font-mono-code text-[11px] text-outline">
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        <span>Latency: 280ms via Groq LLaMA 3.3</span>
                      </div>
                    </div>

                    {/* Synthesized Response with Interactive Citations */}
                    <div className="prose max-w-none text-on-surface">
                      <p className="font-body-lg text-body-lg leading-relaxed">
                        Project Phoenix selected PostgreSQL primarily because the system required strong
                        transactional consistency{' '}
                        <button
                          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-mono-code text-mono-code font-bold transition-all shadow-xs"
                          onClick={() => handleCitationClick(1)}
                          title="Click to view ADR-042 citation excerpt"
                        >
                          [1]
                        </button>
                        , relational integrity{' '}
                        <button
                          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-mono-code text-mono-code font-bold transition-all shadow-xs"
                          onClick={() => handleCitationClick(2)}
                          title="Click to view ENG-STD-12 standard"
                        >
                          [2]
                        </button>
                        , and complex relationships between payment and ledger entities{' '}
                        <button
                          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-mono-code text-mono-code font-bold transition-all shadow-xs"
                          onClick={() => handleCitationClick(3)}
                          title="Click to inspect PRD-REV-09 spec"
                        >
                          [3]
                        </button>
                        . Additionally, PostgreSQL's mature JSONB support allowed flexible schema evolution for
                        dynamic audit logs without sacrificing ACID guarantees{' '}
                        <button
                          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-mono-code text-mono-code font-bold transition-all shadow-xs"
                          onClick={() => handleCitationClick(1)}
                        >
                          [1]
                        </button>
                        .
                      </p>
                    </div>

                    {/* Interactive Citation Excerpt Drawer (When Citation 1, 2, or 3 clicked) */}
                    {activeCitationDrawer && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-2.5 transition-all animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-primary text-white font-mono-code text-xs font-semibold">
                              {activeCitationDrawer}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                              {activeCitationDrawer === 1
                                ? 'Verified Evidence Excerpt · ADR-042 (Page 4, Section 4.2)'
                                : activeCitationDrawer === 2
                                ? 'Verified Standard Excerpt · ENG-STD-12 (Section 3.2)'
                                : 'Verified Design Spec Excerpt · PRD-REV-09 (Page 12)'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-mono-code font-medium">
                              0.94 Cosine Match
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onNavigate('knowledge')}
                              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>View in Knowledge Lake</span>
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </button>
                            <button
                              onClick={() => setActiveCitationDrawer(null)}
                              className="text-outline hover:text-on-surface"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-surface border border-primary/20 text-xs text-on-surface leading-relaxed font-mono-code">
                          {activeCitationDrawer === 1 && (
                            <p>
                              "Excerpt: <span className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">Section 4.2</span> — Distributed transactional integrity across ledger nodes requires <span className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">strict ACID semantics</span> provided natively by <span className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold">PostgreSQL 15</span>. Evaluated alternatives (MongoDB 6.0, DynamoDB) lacked multi-statement atomic isolation necessary to guarantee zero-drift double entry accounting."
                            </p>
                          )}
                          {activeCitationDrawer === 2 && (
                            <p>
                              "ENG-STD-12 Baseline Requirement: Core financial services must retain immutable append-only transaction journals with relational foreign key enforcement to audited chart of accounts."
                            </p>
                          )}
                          {activeCitationDrawer === 3 && (
                            <p>
                              "PRD-REV-09 Stakeholder Sign-off: Flexible webhook payloads from multi-acquirer gateways (Stripe, Adyen) must be stored in queryable JSONB columns with GIN indexing for sub-10ms ledger reconciliation."
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-outline">
                          <span>Ratified by: <strong>Architecture Review Board</strong> (5 signatures)</span>
                          <span>Timestamp: <strong>2024-03-12 16:30 UTC</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Reasoning Path Graph Chips */}
                    <div className="flex flex-col gap-2 p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/15">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                          Evidence paths evaluated:
                        </span>
                        <span className="font-mono-code text-[11px] text-tertiary">
                          4 of 4 Nodes Corroborated
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/20">
                          <span className="material-symbols-outlined text-[15px] text-primary">
                            folder_supervised
                          </span>
                          Project Phoenix
                        </span>
                        <span className="text-outline-variant">→</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/20">
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            balance
                          </span>
                          Architecture Decision #14 (ADR-042)
                        </span>
                        <span className="text-outline-variant">→</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/20">
                          <span className="material-symbols-outlined text-[15px] text-tertiary">
                            rule
                          </span>
                          Database Engineering Standards (ENG-STD-12)
                        </span>
                        <span className="text-outline-variant">→</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm border border-outline-variant/20">
                          <span className="material-symbols-outlined text-[15px] text-outline">
                            rate_review
                          </span>
                          Design Review Q1 (PRD-REV-09)
                        </span>
                      </div>
                    </div>

                    {/* Sources Used List (Interactive Cards) */}
                    <div className="flex flex-col gap-space-xs pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                          Citations &amp; Grounding Evidence (3)
                        </span>
                        <span className="font-mono-code text-[11px] text-outline">
                          Vector Cosine &gt; 0.91
                        </span>
                      </div>

                      {/* Source 1 */}
                      <div
                        id="citation-card-1"
                        onClick={() => handleCitationClick(1)}
                        className="group flex items-start justify-between gap-space-sm p-space-sm rounded-xl bg-surface hover:bg-surface-container-low transition-all cursor-pointer shadow-sm border border-outline-variant/20"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-primary-container text-on-primary-container flex items-center justify-center font-mono-code text-[11px] font-bold shrink-0 mt-0.5">
                            1
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                                Phoenix Architecture Decision (Doc #ADR-042)
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-container text-primary font-mono-code text-[10px]">
                                p. 4
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-outline truncate">
                              Updated 2 days ago · Ratified by Architecture Review Board
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-outline group-hover:text-primary">
                          <span className="font-label-sm text-label-sm hidden sm:inline">View Excerpt</span>
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </div>
                      </div>

                      {/* Source 2 */}
                      <div
                        id="citation-card-2"
                        onClick={() => handleCitationClick(2)}
                        className="group flex items-start justify-between gap-space-sm p-space-sm rounded-xl bg-surface hover:bg-surface-container-low transition-all cursor-pointer shadow-sm border border-outline-variant/20"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-secondary-container text-on-secondary-container flex items-center justify-center font-mono-code text-[11px] font-bold shrink-0 mt-0.5">
                            2
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                                Database Engineering Standard (ENG-STD-12)
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-tertiary-fixed text-on-tertiary-fixed font-mono-code text-[10px]">
                                Sec 3.2
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-tertiary font-label-sm text-[10px] font-medium">
                                Verified Standard
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-outline truncate">
                              Updated 1 week ago · Engineering Operations Baseline
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-outline group-hover:text-primary">
                          <span className="font-label-sm text-label-sm hidden sm:inline">View Standard</span>
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </div>
                      </div>

                      {/* Source 3 */}
                      <div
                        id="citation-card-3"
                        onClick={() => handleCitationClick(3)}
                        className="group flex items-start justify-between gap-space-sm p-space-sm rounded-xl bg-surface hover:bg-surface-container-low transition-all cursor-pointer shadow-sm border border-outline-variant/20"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-mono-code text-[11px] font-bold shrink-0 mt-0.5">
                            3
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                                Phoenix Design Review (PRD-REV-09)
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-container text-primary font-mono-code text-[10px]">
                                p. 12
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-outline truncate">
                              Updated 3 weeks ago · Stakeholder Sign-off Document
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-outline group-hover:text-primary">
                          <span className="font-label-sm text-label-sm hidden sm:inline">Inspect</span>
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </div>
                      </div>
                    </div>

                    {/* Transparency & Governance Feedback Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pt-space-xs bg-surface-container-low/60 -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl border-t border-outline-variant/15">
                      <div className="flex items-center gap-2 text-tertiary font-label-sm text-label-sm">
                        <span className="material-symbols-outlined text-[16px] text-tertiary-container">
                          check_circle
                        </span>
                        <span>Based on 3 organizational sources · Last updated 2 days ago · Expert verified</span>
                      </div>

                      {/* Interactive Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setIsHelpful(true);
                            onShowToast('Feedback logged: Marked as Helpful & Accurate');
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-label-md text-label-md transition-all shadow-xs border border-outline-variant/20 ${
                            isHelpful === true
                              ? 'bg-primary-fixed text-primary font-semibold'
                              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                          }`}
                          title="Mark as helpful"
                        >
                          <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                          <span className="hidden sm:inline">Helpful</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsHelpful(false);
                            onShowToast('Feedback logged: Flagged for synthesis review');
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-label-md text-label-md transition-all shadow-xs border border-outline-variant/20 ${
                            isHelpful === false
                              ? 'bg-error-container text-on-error-container font-semibold'
                              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                          }`}
                          title="Mark as unhelpful"
                        >
                          <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                        </button>

                        {/* Propose Expert Correction Modal Trigger */}
                        <button
                          onClick={onOpenCorrectionModal}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container shadow-sm hover:opacity-95 font-label-md text-label-md font-semibold transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">rate_review</span>
                          <span>Propose Expert Correction</span>
                        </button>

                        <button
                          onClick={handleCopyLink}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs font-label-md text-label-md transition-all border border-outline-variant/20"
                          title="Copy citation link"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isCopied ? 'check' : 'share'}
                          </span>
                          <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Copy Citation Link'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isSynthesizing && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-low border border-primary/20 animate-pulse">
                <span className="material-symbols-outlined text-primary text-[24px] animate-spin">
                  neurology
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-sm font-semibold text-primary">
                    Hindsight RAG Reasoning &amp; Retrieval in Progress...
                  </span>
                  <span className="font-mono-code text-xs text-outline">
                    Traversing 38,412 vectors in Postgres pgvector cluster
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Follow-up Prompt Engine Input Dock */}
          <div className="flex flex-col gap-2 p-space-md rounded-2xl bg-surface-container-lowest shadow-md border border-outline-variant/25 sticky bottom-4 z-20">
            {/* Active Filter Pills Bar */}
            <div className="flex items-center gap-space-xs flex-wrap">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Target: Project Phoenix</span>
                <button
                  onClick={() => onShowToast('Scope filter cleared')}
                  className="hover:text-error ml-1"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                <span>Strict Evidence Active</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/40 text-on-tertiary-fixed-variant font-mono-code text-[10px]">
                <span>ADR Corpus #042 Linked</span>
              </div>
            </div>

            {/* Textarea Input Area */}
            <div className="relative w-full">
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleNewQuery(followUpText);
                  }
                }}
                className="w-full p-space-sm rounded-xl bg-surface text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none resize-none shadow-inner border border-outline-variant/30 focus:border-primary transition-colors"
                placeholder="Ask follow-up question about Project Phoenix or search other decisions..."
                rows={2}
              />
            </div>

            {/* Controls Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-space-xs pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onShowToast('Document attachment picker opened for RAG analysis')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors"
                  title="Attach document for RAG analysis"
                >
                  <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  <span className="hidden sm:inline">Attach Doc</span>
                </button>
                <button
                  onClick={() => onNavigate('projects')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                  <span>Filter Scope</span>
                </button>
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant cursor-pointer select-none">
                  <input defaultChecked className="w-3.5 h-3.5 rounded accent-primary" type="checkbox" />
                  <span className="font-label-sm text-label-sm font-medium">Strict Verification</span>
                </label>
              </div>

              <div className="flex items-center gap-space-xs">
                <span className="hidden md:inline font-mono-code text-[11px] text-outline">
                  Press ↵ to send · Shift+↵ for new line
                </span>
                <button
                  onClick={() => handleNewQuery(followUpText)}
                  disabled={!followUpText.trim() || isSynthesizing}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span className="font-semibold">Query Brain</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTEXT & SOURCE PANEL (4 of 12 cols ~= 34%) */}
        <div className="xl:col-span-4 flex flex-col gap-space-md min-w-0">
          {/* Panel Header Card with Subtabs */}
          <div className="flex flex-col gap-3 p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-headline-sm font-semibold text-on-surface truncate">
                    Knowledge Context
                  </span>
                  <span className="font-label-sm text-label-sm text-outline truncate">
                    Auto-updated from live reasoning
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline text-[18px] animate-pulse">
                sync
              </span>
            </div>

            {/* Context vs Reasoning Trace Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-container-low text-xs font-semibold">
              <button
                onClick={() => setRightTab('context')}
                className={`py-1.5 rounded-lg transition-all ${
                  rightTab === 'context'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Context &amp; Graph
              </button>
              <button
                onClick={() => setRightTab('trace')}
                className={`py-1.5 rounded-lg transition-all ${
                  rightTab === 'trace'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Reasoning Trace
              </button>
            </div>
          </div>

          {rightTab === 'context' ? (
            <>
              {/* SECTION 1: RELATED PROJECT */}
              <div className="flex flex-col gap-space-xs p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/15">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                    Related Project
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-mono-code text-[10px]">
                    ID: PRJ-PHX
                  </span>
                </div>
                <div className="flex flex-col gap-space-sm pt-space-xs">
                  <div className="flex items-start gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Project Phoenix
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Core Payments &amp; Settlement Redesign
                      </span>
                    </div>
                  </div>

                  {/* Project Metadata Rows */}
                  <div className="grid grid-cols-2 gap-space-xs pt-1">
                    <div className="p-space-xs rounded-xl bg-surface-container-low flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline">Lead</span>
                      <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                        Alex Morgan
                      </span>
                    </div>
                    <div className="p-space-xs rounded-xl bg-surface-container-low flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline">Status</span>
                      <span className="font-label-md text-label-md font-semibold text-tertiary flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                        Active · M3
                      </span>
                    </div>
                  </div>
                  <div className="p-space-xs rounded-xl bg-surface-container-low flex flex-col">
                    <span className="font-label-sm text-label-sm text-outline">Department</span>
                    <span className="font-label-md text-label-md font-medium text-on-surface">
                      Payments &amp; Platform Engineering
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: RELATED DECISIONS */}
              <div className="flex flex-col gap-space-xs p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/15">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                    Related Decisions
                  </span>
                  <span className="font-mono-code text-[11px] text-outline">2 Recorded</span>
                </div>
                <div className="flex flex-col gap-2 pt-space-xs">
                  {/* Decision 1 */}
                  <div
                    onClick={() => onNavigate('decisions')}
                    className="p-space-sm rounded-xl bg-surface hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col gap-1 shadow-sm border border-outline-variant/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        Database Architecture (PostgreSQL)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-tertiary font-label-sm text-label-sm font-semibold shrink-0">
                        Approved
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline line-clamp-2">
                      Standardized on PostgreSQL 15 over distributed NoSQL for strong transactional guarantees
                      in ledger reconciliation.
                    </p>
                    <div className="flex items-center gap-3 pt-1 font-mono-code text-[11px] text-outline">
                      <span>ADR-042</span>
                      <span>·</span>
                      <span>Approved by Arbiter Panel</span>
                    </div>
                  </div>

                  {/* Decision 2 */}
                  <div
                    onClick={() => onNavigate('decisions')}
                    className="p-space-sm rounded-xl bg-surface hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col gap-1 shadow-sm border border-outline-variant/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        Authentication &amp; Token Strategy
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm font-semibold shrink-0">
                        In Review
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline line-clamp-2">
                      Evaluating asymmetric EdDSA vs ephemeral JWT for intra-cluster service authentication.
                    </p>
                    <div className="flex items-center gap-3 pt-1 font-mono-code text-[11px] text-outline">
                      <span>ADR-049</span>
                      <span>·</span>
                      <span>3 Open RFC Comments</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ORGANIZATIONAL EXPERTS */}
              <div className="flex flex-col gap-space-xs p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/15">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                    Organizational Experts
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-outline">verified</span>
                </div>
                <div className="flex flex-col gap-space-sm pt-space-xs">
                  {/* Expert 1 */}
                  <div className="flex items-center justify-between gap-space-xs p-space-xs rounded-xl bg-surface-container-low">
                    <div className="flex items-center gap-space-xs min-w-0">
                      <img
                        className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm"
                        src={AVATARS.alex}
                        alt="Alex Morgan"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                          Alex Morgan
                        </span>
                        <span className="font-body-sm text-body-sm text-outline truncate">
                          Senior Backend · 24 contributions
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-mono-code text-[10px] shrink-0">
                      Primary
                    </span>
                  </div>

                  {/* Expert 2 */}
                  <div className="flex items-center justify-between gap-space-xs p-space-xs rounded-xl bg-surface-container-low">
                    <div className="flex items-center gap-space-xs min-w-0">
                      <img
                        className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm"
                        src={AVATARS.elena}
                        alt="Dr. Elena Rostova"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                          Dr. Elena Rostova
                        </span>
                        <span className="font-body-sm text-body-sm text-outline truncate">
                          Lead Data Architect · Postgres Specialist
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-mono-code text-[10px] shrink-0">
                      Domain Lead
                    </span>
                  </div>

                  {/* Consult Expert Action Button */}
                  <button
                    onClick={onOpenConsultExpertModal}
                    className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold transition-colors mt-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                    <span>Consult Expert (Ask Thread)</span>
                  </button>
                </div>
              </div>

              {/* SECTION 4: KNOWLEDGE GRAPH MINI-VIEW */}
              <div className="flex flex-col gap-space-xs p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                      Knowledge Graph Mini-View
                    </span>
                  </div>
                  <span className="font-mono-code text-[10px] text-tertiary">Realtime Synced</span>
                </div>

                {/* Inline Visual Topology Diagram (Inline SVG) */}
                <div className="relative w-full h-44 rounded-xl bg-surface-container-low overflow-hidden flex items-center justify-center p-2 border border-outline-variant/15">
                  <svg
                    className="w-full h-full text-outline-variant"
                    fill="none"
                    viewBox="0 0 320 150"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Connection Lines */}
                    <path
                      className="animate-pulse"
                      d="M 70 75 L 160 35"
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    ></path>
                    <path d="M 70 75 L 160 115" stroke="currentColor" strokeWidth="1.5"></path>
                    <path d="M 160 35 L 250 75" stroke="currentColor" strokeWidth="2"></path>
                    <path
                      d="M 160 115 L 250 75"
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    ></path>

                    {/* Edge Labels */}
                    <text fill="#727785" fontFamily="JetBrains Mono" fontSize="8" x="100" y="50">
                      governs
                    </text>
                    <text fill="#727785" fontFamily="JetBrains Mono" fontSize="8" x="105" y="105">
                      employs
                    </text>
                    <text fill="#727785" fontFamily="JetBrains Mono" fontSize="8" x="210" y="50">
                      author
                    </text>

                    {/* Node 1: Phoenix */}
                    <g
                      className="cursor-pointer"
                      transform="translate(45, 60)"
                      onClick={() => onNavigate('projects')}
                    >
                      <rect fill="#d8e2ff" height="30" rx="8" width="50"></rect>
                      <text
                        fill="#001a42"
                        fontFamily="Inter"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                        x="25"
                        y="18"
                      >
                        Phoenix
                      </text>
                    </g>

                    {/* Node 2: Database ADR */}
                    <g
                      className="cursor-pointer"
                      transform="translate(130, 20)"
                      onClick={() => onNavigate('decisions')}
                    >
                      <rect fill="#e1e0ff" height="30" rx="8" width="60"></rect>
                      <text
                        fill="#07006c"
                        fontFamily="Inter"
                        fontSize="8.5"
                        fontWeight="600"
                        textAnchor="middle"
                        x="30"
                        y="18"
                      >
                        ADR-042
                      </text>
                    </g>

                    {/* Node 3: PostgreSQL Standard */}
                    <g
                      className="cursor-pointer"
                      transform="translate(125, 100)"
                      onClick={() => onShowToast('Grounded Standard: PostgreSQL 15 ACID Baseline')}
                    >
                      <rect fill="#6ffbbe" height="30" rx="8" width="70"></rect>
                      <text
                        fill="#002113"
                        fontFamily="Inter"
                        fontSize="8.5"
                        fontWeight="600"
                        textAnchor="middle"
                        x="35"
                        y="18"
                      >
                        PostgreSQL
                      </text>
                    </g>

                    {/* Node 4: Payments Team */}
                    <g
                      className="cursor-pointer"
                      transform="translate(225, 60)"
                      onClick={() => onNavigate('experts')}
                    >
                      <rect fill="#eaedff" height="30" rx="8" width="65"></rect>
                      <text
                        fill="#131b2e"
                        fontFamily="Inter"
                        fontSize="8.5"
                        fontWeight="600"
                        textAnchor="middle"
                        x="32"
                        y="18"
                      >
                        Payments
                      </text>
                    </g>
                  </svg>

                  {/* Interactive Node Helper Chip */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-surface/90 backdrop-blur font-mono-code text-[9px] text-on-surface-variant shadow-sm border border-outline-variant/30">
                    Interactive Topology (4 Nodes)
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-body-sm text-body-sm text-outline">
                    Phoenix ↔ Database ADR ↔ PostgreSQL ↔ Payments
                  </span>
                  <button
                    onClick={() => onNavigate('knowledge')}
                    className="font-label-sm text-label-sm text-primary hover:underline font-semibold"
                  >
                    Expand Graph
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Reasoning Trace Tab Content */
            <div className="flex flex-col gap-space-sm p-space-md rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/15">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Execution Chain &amp; Graph Hops
              </span>
              <div className="space-y-3 font-mono-code text-xs">
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15">
                  <span className="text-tertiary font-bold block mb-1">
                    1. Query Vectorization (Hindsight Multilingual-v2)
                  </span>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    Normalized 768-dim embedding generated in 18ms. Matched anchor "PRJ-PHX" at cosine distance 0.942.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15">
                  <span className="text-primary font-bold block mb-1">
                    2. Multi-hop Graph Traversal (PostgreSQL pgvector)
                  </span>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    HNSW index traversal explored 12 connected nodes. Filtered to 3 verified documents: ADR-042, ENG-STD-12, PRD-REV-09.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/15">
                  <span className="text-secondary font-bold block mb-1">
                    3. Groq LPU Hardware Inference (LLaMA-3.3-70B)
                  </span>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    Streaming speed: 142 tokens/sec. Factuality verification corroborated 4 of 4 assertions against institutional ground truth.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('system-health')}
                className="w-full mt-2 py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>View Live Telemetry Logs</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
