/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavigationPath, KnowledgeItem, ExpertItem } from './types';
import { INITIAL_EXPERTS } from './data/mockData';

// Layout & Global Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { MemoryCommandPalette } from './components/MemoryCommandPalette';
import { CorrectionModal } from './components/CorrectionModal';
import { ConsultExpertModal } from './components/ConsultExpertModal';
import { DocumentModal } from './components/DocumentModal';

// Views
import { MemoryLab } from './views/MemoryLab';
import { KnowledgeExplorer } from './views/KnowledgeExplorer';
import { ProjectsView } from './views/ProjectsView';
import { DecisionsView } from './views/DecisionsView';
import { ExpertsView } from './views/ExpertsView';
import { ExpertReview } from './views/ExpertReview';
import { SystemHealth } from './views/SystemHealth';
import { KnowledgeIngestLive } from './views/KnowledgeIngestLive';
import { ArchitectureView } from './views/ArchitectureView';

export default function App() {
  const [currentPath, setCurrentPath] = useState<NavigationPath>('brain');
  const [queryParam, setQueryParam] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals & Overlays
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [activeConsultExpert, setActiveConsultExpert] = useState<ExpertItem | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState<KnowledgeItem | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'info' | 'error' }>({
    message: null,
    type: 'success'
  });

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleNavigate = useCallback((path: NavigationPath, param?: string) => {
    setCurrentPath(path);
    if (param !== undefined) {
      setQueryParam(param);
    }
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Global ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCorrectionSubmit = (data: { citation: string; correction: string }) => {
    showToast(`Correction ticket generated for "${data.citation}" and sent to Review Queue!`);
  };

  const handleConsultSubmit = (expertName: string, message: string) => {
    showToast(`Consultation dispatch sent to ${expertName}: "${message.slice(0, 40)}..."`);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased flex flex-col selection:bg-primary-fixed selection:text-primary">
      {/* Fixed Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main App Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Sticky Header */}
        <Header
          currentPath={currentPath}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col pb-16">
          {currentPath === 'brain' && (
            <MemoryLab onShowToast={showToast} />
          )}

          {currentPath === 'ask' && (
            <MemoryLab initialQuery={queryParam || undefined} onShowToast={showToast} />
          )}

          {currentPath === 'knowledge' && (
            <KnowledgeExplorer
              onNavigate={handleNavigate}
              onShowToast={showToast}
              onInspectDocument={(doc) => {
                setActiveDocument(doc);
                setIsDocumentModalOpen(true);
              }}
            />
          )}

          {currentPath === 'projects' && (
            <ProjectsView onNavigate={handleNavigate} onShowToast={showToast} />
          )}

          {currentPath === 'decisions' && (
            <DecisionsView
              onNavigate={handleNavigate}
              onShowToast={showToast}
              onOpenCorrectionModal={() => setIsCorrectionModalOpen(true)}
            />
          )}

          {currentPath === 'experts' && (
            <ExpertsView
              onNavigate={handleNavigate}
              onShowToast={showToast}
              onOpenConsultModal={(expert) => {
                setActiveConsultExpert(expert);
                setIsConsultModalOpen(true);
              }}
            />
          )}

          {currentPath === 'feedback' && (
            <ExpertReview
              onNavigate={handleNavigate}
              onShowToast={showToast}
              onOpenCorrectionModal={() => setIsCorrectionModalOpen(true)}
            />
          )}

          {currentPath === 'system-health' && (
            <SystemHealth onNavigate={handleNavigate} onShowToast={showToast} />
          )}

          {currentPath === 'ingest' && (
            <KnowledgeIngestLive onNavigate={handleNavigate} onShowToast={showToast} />
          )}

          {currentPath === 'architecture' && (
            <ArchitectureView onNavigate={handleNavigate} onShowToast={showToast} />
          )}
        </main>
      </div>

      {/* Global Command Palette (⌘K) */}
      <MemoryCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Propose Expert Correction Modal */}
      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        onSubmit={handleCorrectionSubmit}
      />

      {/* Consult Domain Expert Modal */}
      <ConsultExpertModal
        isOpen={isConsultModalOpen}
        onClose={() => {
          setIsConsultModalOpen(false);
          setActiveConsultExpert(null);
        }}
        expert={activeConsultExpert}
        onSubmit={handleConsultSubmit}
      />

      {/* Document Inspector Modal */}
      <DocumentModal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setActiveDocument(null);
        }}
        document={activeDocument}
        onAskBrain={(title) => {
          setIsDocumentModalOpen(false);
          handleNavigate('ask', `Explain the technical specifications, requirements, and decisions in: ${title}`);
        }}
      />

      {/* Global Toast Feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, message: null }))}
      />
    </div>
  );
}
