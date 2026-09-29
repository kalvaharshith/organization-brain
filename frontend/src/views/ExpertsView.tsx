import React, { useState } from 'react';
import { NavigationPath, ExpertItem } from '../types';
import { INITIAL_EXPERTS, AVATARS } from '../data/mockData';

interface ExpertsViewProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
  onOpenConsultModal: (expert: ExpertItem) => void;
}

export const ExpertsView: React.FC<ExpertsViewProps> = ({
  onNavigate,
  onShowToast,
  onOpenConsultModal
}) => {
  const [experts] = useState<ExpertItem[]>(INITIAL_EXPERTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const departments = ['All', 'Payments & Platform Engineering', 'Data Platform', 'SecOps & GRC', 'Core Infrastructure'];

  const filteredExperts = experts.filter((exp) => {
    const matchesSearch =
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.specialty.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = selectedDept === 'All' ? true : exp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Top Header */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-outline-variant/15 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed/30 text-primary font-mono-code text-[11px] font-semibold mb-2">
              <span className="material-symbols-outlined text-[13px]">groups</span>
              <span>HUMAN-IN-THE-LOOP · DOMAIN AUTHORITIES</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-display">
              Subject Matter Experts & Reviewers
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Verified domain leads who ratify architectural choices and calibrate the organizational knowledge brain.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('feedback')}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 border border-outline-variant/30 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-error">rate_review</span>
              <span>Pending Review Queue</span>
            </button>
            <button
              onClick={() => onNavigate('ask', 'Who are the primary contacts for database and platform security?')}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-on-primary text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              <span>Find Expert via Brain</span>
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
              placeholder="Search experts by name, specialty, or role..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface-container-low rounded-lg border border-outline-variant/30 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-semibold text-outline uppercase tracking-wider font-mono-code mr-1 shrink-0">
              Dept:
            </span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedDept === dept
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/20'
                }`}
              >
                {dept === 'Payments & Platform Engineering' ? 'Payments' : dept === 'Core Infrastructure' ? 'Infra' : dept}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Experts Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((exp) => (
            <div
              key={exp.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={exp.avatar}
                        alt={exp.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-xs"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                          {exp.name}
                        </h3>
                        {exp.isPrimary && (
                          <span
                            title="Primary Authority"
                            className="material-symbols-outlined text-[16px] text-tertiary"
                          >
                            verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-on-surface-variant">{exp.role}</p>
                      <p className="text-[11px] text-outline mt-0.5">{exp.department}</p>
                    </div>
                  </div>

                  <span className="font-mono-code text-[11px] font-bold text-tertiary bg-tertiary-fixed/30 px-2.5 py-0.5 rounded-full border border-tertiary/20">
                    {exp.accuracy}
                  </span>
                </div>

                <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/15 flex items-center justify-around text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-outline uppercase font-mono-code">Total Reviews</span>
                    <p className="font-bold text-on-surface font-mono-code text-sm mt-0.5">{exp.contributions}</p>
                  </div>
                  <div className="h-6 w-px bg-outline-variant/20"></div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-mono-code">Consensus SLA</span>
                    <p className="font-bold text-primary font-mono-code text-sm mt-0.5">&lt; 4.2h</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider font-mono-code mb-2">
                    Verified Domains & Specialties
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.specialty.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface text-[11px] font-medium border border-outline-variant/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-outline-variant/15 flex items-center gap-2">
                <button
                  onClick={() => onOpenConsultModal(exp)}
                  className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/95 text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  <span>Consult Expert</span>
                </button>
                <button
                  onClick={() =>
                    onNavigate('ask', `What architecture decisions or specifications has ${exp.name} authored or ratified?`)
                  }
                  title="Query brain for contributions"
                  className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">neurology</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
