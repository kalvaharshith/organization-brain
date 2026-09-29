import React, { useState } from 'react';
import { NavigationPath } from '../types';

interface BrainOverviewProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
}

export const BrainOverview: React.FC<BrainOverviewProps> = ({ onNavigate, onShowToast }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTopologyNode, setActiveTopologyNode] = useState<string | null>(null);

  const suggestions = [
    'Why did Project Phoenix choose PostgreSQL?',
    'What is the current status of Project Phoenix?',
    'Who owns the payments platform?',
    'What decisions were made this month?',
    'What are the biggest risks in Project Atlas?'
  ];

  const handleExecuteSearch = (searchQuery?: string) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q.trim()) {
      onShowToast('Please type a question or select a suggestion');
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      onNavigate('ask', q.trim());
    }, 450);
  };

  const handleChipClick = (suggestionText: string) => {
    setQuery(suggestionText);
    handleExecuteSearch(suggestionText);
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-5 pb-8 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-[30rem] h-[30rem] rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center relative z-10 max-w-7xl mx-auto">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-space-md">
            <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high text-primary font-mono-code text-mono-code shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Cognitive Subsystem · Active Knowledge Mesh</span>
            </div>

            <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight max-w-2xl">
              Your organization's intelligence, in one place.
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Ask questions, explore knowledge, understand decisions, and learn from your organization's collective expertise.
            </p>

            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              <button
                onClick={() => onNavigate('ask', 'Why did Project Phoenix choose PostgreSQL?')}
                className="flex items-center gap-space-xs h-10 px-space-lg rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-label-md text-label-md shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Ask the Brain</span>
              </button>

              <button
                onClick={() => onNavigate('ingest')}
                className="flex items-center gap-space-xs h-10 px-space-lg rounded-xl bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all duration-150 border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px] text-outline">add_circle</span>
                <span>+ Add Knowledge</span>
              </button>

              <button
                onClick={() => onNavigate('architecture')}
                className="flex items-center gap-space-xs h-10 px-space-md rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors"
                title="View Full Backend Architecture & Database Schemas"
              >
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                <span className="hidden sm:inline">Backend Architecture</span>
              </button>
            </div>
          </div>

          {/* Hero Right: Interactive Semantic Topology SVG Preview */}
          <div className="lg:col-span-5 relative w-full flex justify-center">
            <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-surface-container-lowest p-space-md shadow-md flex flex-col justify-between relative overflow-hidden border border-outline-variant/20">
              <div className="flex items-center justify-between z-10">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Semantic Topology
                </span>
                <span className="font-mono-code text-mono-code text-tertiary bg-tertiary-fixed/30 px-space-xs py-0.5 rounded">
                  Synced · 4.2ms
                </span>
              </div>

              {/* Topology SVG */}
              <svg
                className="absolute inset-0 w-full h-full"
                fill="none"
                viewBox="0 0 420 300"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Connection Lines */}
                <line
                  className="text-surface-container-high"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                  x1="210"
                  x2="90"
                  y1="150"
                  y2="70"
                />
                <line
                  className="text-surface-container-high"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  x1="210"
                  x2="330"
                  y1="150"
                  y2="70"
                />
                <line
                  className="text-surface-container-high"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  x1="210"
                  x2="90"
                  y1="150"
                  y2="230"
                />
                <line
                  className="text-surface-container-high"
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                  x1="210"
                  x2="330"
                  y1="150"
                  y2="230"
                />
                <line
                  className="text-surface-container-high/60"
                  stroke="currentColor"
                  strokeWidth="1"
                  x1="90"
                  x2="330"
                  y1="70"
                  y2="70"
                />
                <line
                  className="text-surface-container-high/60"
                  stroke="currentColor"
                  strokeWidth="1"
                  x1="90"
                  x2="330"
                  y1="230"
                  y2="230"
                />

                {/* Central Brain Node */}
                <circle
                  className="fill-primary-fixed text-primary animate-pulse opacity-20"
                  cx="210"
                  cy="150"
                  r="34"
                />
                <circle
                  className="fill-primary text-on-primary shadow-md cursor-pointer hover:scale-105 transition-transform"
                  cx="210"
                  cy="150"
                  r="24"
                  onClick={() => onNavigate('architecture')}
                />
                <text
                  className="fill-on-primary font-mono-code text-[11px] font-bold pointer-events-none"
                  textAnchor="middle"
                  x="210"
                  y="154"
                >
                  BRAIN
                </text>

                {/* Satellite Node: People */}
                <g
                  className="cursor-pointer group"
                  onClick={() => onNavigate('experts')}
                  onMouseEnter={() => setActiveTopologyNode('31 Verified Experts')}
                  onMouseLeave={() => setActiveTopologyNode(null)}
                >
                  <circle
                    className="fill-surface-container-high group-hover:fill-primary-fixed transition-colors"
                    cx="90"
                    cy="70"
                    r="19"
                  />
                  <text
                    className="fill-on-surface font-label-sm text-[10px] font-semibold"
                    textAnchor="middle"
                    x="90"
                    y="74"
                  >
                    People
                  </text>
                </g>

                {/* Satellite Node: Projects */}
                <g
                  className="cursor-pointer group"
                  onClick={() => onNavigate('projects')}
                  onMouseEnter={() => setActiveTopologyNode('18 Active Projects')}
                  onMouseLeave={() => setActiveTopologyNode(null)}
                >
                  <circle
                    className="fill-surface-container-high group-hover:fill-primary-fixed transition-colors"
                    cx="330"
                    cy="70"
                    r="19"
                  />
                  <text
                    className="fill-on-surface font-label-sm text-[10px] font-semibold"
                    textAnchor="middle"
                    x="330"
                    y="74"
                  >
                    Projects
                  </text>
                </g>

                {/* Satellite Node: Decisions */}
                <g
                  className="cursor-pointer group"
                  onClick={() => onNavigate('decisions')}
                  onMouseEnter={() => setActiveTopologyNode('64 ADR Decisions')}
                  onMouseLeave={() => setActiveTopologyNode(null)}
                >
                  <circle
                    className="fill-surface-container-high group-hover:fill-primary-fixed transition-colors"
                    cx="90"
                    cy="230"
                    r="19"
                  />
                  <text
                    className="fill-on-surface font-label-sm text-[10px] font-semibold"
                    textAnchor="middle"
                    x="90"
                    y="234"
                  >
                    Decisions
                  </text>
                </g>

                {/* Satellite Node: Docs */}
                <g
                  className="cursor-pointer group"
                  onClick={() => onNavigate('knowledge')}
                  onMouseEnter={() => setActiveTopologyNode('248 Ingested Documents')}
                  onMouseLeave={() => setActiveTopologyNode(null)}
                >
                  <circle
                    className="fill-surface-container-high group-hover:fill-primary-fixed transition-colors"
                    cx="330"
                    cy="230"
                    r="19"
                  />
                  <text
                    className="fill-on-surface font-label-sm text-[10px] font-semibold"
                    textAnchor="middle"
                    x="330"
                    y="234"
                  >
                    Docs
                  </text>
                </g>
              </svg>

              <div className="flex items-center justify-between text-outline text-label-sm font-label-sm z-10 pt-space-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span>{activeTopologyNode || '1,280 Graph Edges'}</span>
                </span>
                <span className="font-mono-code text-xs">RAG Graph v4</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Omni-Search Box & Suggestion Chips Section */}
      <section className="px-4 sm:px-6 lg:px-8 -mt-4 relative z-20 max-w-7xl mx-auto w-full">
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl p-space-md lg:p-space-lg transition-all duration-200 focus-within:shadow-2xl border border-outline-variant/20">
          <div className="flex items-center gap-space-sm bg-surface-container-low rounded-xl px-space-md py-space-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">psychology</span>
            <input
              className="w-full bg-transparent outline-none font-body-lg text-body-lg text-on-surface placeholder:text-outline"
              placeholder="What would you like to know about the organization?"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleExecuteSearch();
                }
              }}
            />
            <div className="flex items-center gap-space-xs shrink-0">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded bg-surface font-mono-code text-[11px] text-outline shadow-sm border border-outline-variant/30">
                ⌘Enter
              </kbd>
              <button
                onClick={() => handleExecuteSearch()}
                disabled={isSearching}
                className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
              >
                {isSearching ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                )}
              </button>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="mt-space-md flex flex-wrap items-center gap-space-xs">
            <span className="font-label-sm text-label-sm text-outline flex items-center gap-1 mr-space-2xs">
              <span className="material-symbols-outlined text-[14px]">lightbulb</span> Suggestions:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(s)}
                className="query-chip inline-flex items-center px-space-sm py-1 rounded-full bg-surface-container-high hover:bg-primary-fixed hover:text-on-primary-fixed font-label-sm text-label-sm text-on-surface-variant transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Overview 5 Metrics Ribbon */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-outline text-[20px]">analytics</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Knowledge Overview</h2>
          </div>
          <span className="font-mono-code text-mono-code text-outline">Refreshed 10m ago</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm">
          {/* Card 1: Documents */}
          <div
            onClick={() => onNavigate('knowledge')}
            className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-outline-variant/15 group"
          >
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-md text-label-md group-hover:text-primary transition-colors">
                Documents
              </span>
              <span className="material-symbols-outlined text-[18px]">description</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface">248</div>
            <div className="flex items-center gap-1 mt-space-2xs text-tertiary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+14 this week</span>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div
            onClick={() => onNavigate('projects')}
            className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-outline-variant/15 group"
          >
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-md text-label-md group-hover:text-secondary transition-colors">
                Active Projects
              </span>
              <span className="material-symbols-outlined text-[18px]">folder_special</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface">18</div>
            <div className="flex items-center gap-1 mt-space-2xs text-secondary font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>3 Tier-1 critical</span>
            </div>
          </div>

          {/* Card 3: Decisions */}
          <div
            onClick={() => onNavigate('decisions')}
            className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-outline-variant/15 group"
          >
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-md text-label-md group-hover:text-primary transition-colors">
                Decisions
              </span>
              <span className="material-symbols-outlined text-[18px]">balance</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface">64</div>
            <div className="flex items-center gap-1 mt-space-2xs text-tertiary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              <span>100% documented</span>
            </div>
          </div>

          {/* Card 4: Verified Experts */}
          <div
            onClick={() => onNavigate('experts')}
            className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-outline-variant/15 group"
          >
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-md text-label-md group-hover:text-on-surface transition-colors">
                Verified Experts
              </span>
              <span className="material-symbols-outlined text-[18px]">supervised_user_circle</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface">31</div>
            <div className="flex items-center gap-1 mt-space-2xs text-outline font-label-sm text-label-sm">
              <span>across 5 departments</span>
            </div>
          </div>

          {/* Card 5: Grounding Index */}
          <div
            onClick={() => onNavigate('system-health')}
            className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-outline-variant/15 group"
          >
            <div className="flex items-center justify-between text-outline mb-space-xs">
              <span className="font-label-md text-label-md group-hover:text-tertiary transition-colors">
                Grounding Index
              </span>
              <span className="material-symbols-outlined text-[18px] text-tertiary">fact_check</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-on-surface">94%</div>
            <div className="flex items-center gap-1 mt-space-2xs text-tertiary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Human-verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Recent Activity & Brain Status */}
      <section className="px-4 sm:px-6 lg:px-8 pb-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Recent Activity Audit Trail (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[20px]">history</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Recent Activity</h2>
              </div>
              <button
                onClick={() => onNavigate('system-health')}
                className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors"
              >
                View All Audit Trail
              </button>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md space-y-space-md border border-outline-variant/15">
              {/* Item 1 */}
              <div
                onClick={() => onNavigate('knowledge')}
                className="flex items-start gap-space-sm p-space-xs hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                      Phoenix Architecture v3
                    </span>
                    <span className="font-mono-code text-[11px] text-outline shrink-0">2h ago</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Document uploaded (PDF · 4.2 MB) by Sarah Chen
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-primary">
                      #project-phoenix
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed/30 font-mono-code text-[10px] text-tertiary font-semibold">
                      Indexed
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div
                onClick={() => onNavigate('decisions')}
                className="flex items-start gap-space-sm p-space-xs hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">gavel</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-secondary transition-colors truncate">
                      Database Architecture Decision
                    </span>
                    <span className="font-mono-code text-[11px] text-outline shrink-0">Yesterday</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Decision updated (Approved PostgreSQL over NoSQL cluster)
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-secondary">
                      ADR-104
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed/30 font-mono-code text-[10px] text-tertiary font-semibold">
                      Consensus Reached
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div
                onClick={() => onNavigate('feedback')}
                className="flex items-start gap-space-sm p-space-xs hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-tertiary transition-colors truncate">
                      Deployment process clarification
                    </span>
                    <span className="font-mono-code text-[11px] text-outline shrink-0">2d ago</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Expert correction approved by Alex Morgan
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface-variant">
                      DevOps
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container-high font-mono-code text-[10px] text-outline">
                      Ground Truth Updated
                    </span>
                  </div>
                </div>
              </div>

              {/* Item 4 */}
              <div
                onClick={() => onNavigate('projects')}
                className="flex items-start gap-space-sm p-space-xs hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-outline shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">sync</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface group-hover:text-on-surface transition-colors truncate">
                      Project Atlas Knowledge Base
                    </span>
                    <span className="font-mono-code text-[11px] text-outline shrink-0">3d ago</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Project knowledge updated via Jira &amp; Confluence connector
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-outline">
                      Auto-sync
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Brain Status & Quick Navigation (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-outline text-[20px]">memory</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Brain Status</h2>
              </div>
              <span className="inline-flex items-center gap-1 font-mono-code text-[11px] text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
                Operational
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-md space-y-space-sm border border-outline-variant/15">
              {/* Status 1 */}
              <div
                onClick={() => onNavigate('ingest')}
                className="flex items-center justify-between p-space-xs bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">cloud_sync</span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Knowledge Ingestion
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      Pipeline stream active
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-code text-mono-code text-tertiary font-semibold">
                    Healthy
                  </span>
                  <span className="block font-mono-code text-[10px] text-outline">99.8%</span>
                </div>
              </div>

              {/* Status 2 */}
              <div
                onClick={() => onNavigate('system-health')}
                className="flex items-center justify-between p-space-xs bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">
                    search_insights
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      RAG Retrieval (Hindsight)
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      Hybrid vector + lexical
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-code text-mono-code text-tertiary font-semibold">
                    Healthy
                  </span>
                  <span className="block font-mono-code text-[10px] text-outline">18ms latency</span>
                </div>
              </div>

              {/* Status 3 */}
              <div
                onClick={() => onNavigate('system-health')}
                className="flex items-center justify-between p-space-xs bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">bolt</span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      LLM Service (Groq API)
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      Llama-3-70b-versatile
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-code text-mono-code text-tertiary font-semibold">
                    Healthy
                  </span>
                  <span className="block font-mono-code text-[10px] text-outline">Fast inference</span>
                </div>
              </div>

              {/* Status 4 */}
              <div
                onClick={() => onNavigate('architecture')}
                className="flex items-center justify-between p-space-xs bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">database</span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      Database (Postgres runtime)
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      pgvector embedded
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-code text-mono-code text-tertiary font-semibold">
                    Healthy
                  </span>
                  <span className="block font-mono-code text-[10px] text-outline">Synchronized</span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="pt-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-space-xs">
                Quick Navigation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs">
                <button
                  onClick={() => onNavigate('projects')}
                  className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:shadow hover:bg-surface-container-low transition-all flex flex-col justify-between text-left border border-outline-variant/15"
                >
                  <span className="material-symbols-outlined text-primary text-[20px] mb-space-xs">
                    rocket_launch
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Project Phoenix
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">Tier-1 Core</span>
                </button>

                <button
                  onClick={() => onNavigate('decisions')}
                  className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:shadow hover:bg-surface-container-low transition-all flex flex-col justify-between text-left border border-outline-variant/15"
                >
                  <span className="material-symbols-outlined text-secondary text-[20px] mb-space-xs">
                    history_edu
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Decision Memory
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">64 ADR records</span>
                </button>

                <button
                  onClick={() => onNavigate('feedback')}
                  className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm hover:shadow hover:bg-surface-container-low transition-all flex flex-col justify-between text-left border border-outline-variant/15"
                >
                  <span className="material-symbols-outlined text-tertiary text-[20px] mb-space-xs">
                    pending_actions
                  </span>
                  <span className="font-label-md text-label-md font-semibold text-on-surface">
                    Expert Reviews
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">3 waiting approval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
