import React, { useState } from 'react';
import { NavigationPath, TelemetryLogEvent } from '../types';
import { INITIAL_TELEMETRY } from '../data/mockData';

interface SystemHealthProps {
  onNavigate: (path: NavigationPath, queryParam?: string) => void;
  onShowToast: (msg: string) => void;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ onNavigate, onShowToast }) => {
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEvent[]>(INITIAL_TELEMETRY);
  const [selectedLog, setSelectedLog] = useState<TelemetryLogEvent | null>(INITIAL_TELEMETRY[0]);
  const [filterMethod, setFilterMethod] = useState<'All' | 'GET' | 'POST'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSimulatePing = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const newEvent: TelemetryLogEvent = {
        id: `tel-${Date.now()}`,
        timestamp: timeStr,
        method: 'GET',
        endpoint: '/api/health',
        sourcePipeline: 'health.py → Kubernetes Liveness Probe',
        latencyMs: Math.round((Math.random() * 4 + 2) * 10) / 10,
        latencyBreakdown: 'Probe heartbeat',
        statusCode: 200,
        statusText: '200 OK',
        signal: 'All 4 Subsystems Healthy (Mesh Synced)',
        detailPayload: {
          fastapi: 'Healthy (Uvicorn worker pool)',
          hindsightRag: 'Optimal (0.96 cosine threshold)',
          groqLLM: 'Online (148 tokens/sec)',
          pgvector: 'Synced (38,419 vectors active)'
        }
      };
      setTelemetryLogs((prev) => [newEvent, ...prev]);
      setIsRefreshing(false);
      onShowToast('Health probe ping sent successfully: All subsystems operational');
    }, 400);
  };

  const filteredLogs = telemetryLogs.filter((log) => {
    if (filterMethod === 'All') return true;
    return log.method === filterMethod;
  });

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-200">
      {/* Top Banner */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-outline-variant/15 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed/30 text-tertiary font-mono-code text-[11px] font-semibold mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
              <span>MESH OPERATIONAL · 99.98% SLA</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-on-surface tracking-tight font-display">
              Brain System Health & Telemetry
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Active telemetry across FastAPI runtime, Hindsight RAG pipeline, Groq inference, and pgvector.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('architecture')}
              className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold flex items-center gap-2 border border-outline-variant/30 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
              <span>Architecture & Schemas</span>
            </button>
            <button
              onClick={handleSimulatePing}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-on-primary text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isRefreshing ? 'Pinging...' : 'Send Live Health Ping'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="px-4 sm:px-6 lg:px-8 py-5 max-w-7xl mx-auto w-full space-y-6">
        {/* 4 Core Subsystems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: FastAPI Runtime */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-code text-[11px] font-bold text-outline">BACKEND RUNTIME</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Healthy
                </span>
              </div>
              <h3 className="font-bold text-base text-on-surface">FastAPI / Uvicorn</h3>
              <p className="text-xs text-on-surface-variant mt-1">4 async worker threads handling routing & auth</p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs font-mono-code">
              <span className="text-outline">Latency P95</span>
              <span className="font-bold text-on-surface">18.4 ms</span>
            </div>
          </div>

          {/* Card 2: Hindsight RAG */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-code text-[11px] font-bold text-outline">RETRIEVAL ENGINE</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active
                </span>
              </div>
              <h3 className="font-bold text-base text-on-surface">Hindsight RAG</h3>
              <p className="text-xs text-on-surface-variant mt-1">Semantic chunking & Reciprocal Rank Fusion</p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs font-mono-code">
              <span className="text-outline">Mean Cosine Ground</span>
              <span className="font-bold text-primary">0.962</span>
            </div>
          </div>

          {/* Card 3: Groq LLM */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-code text-[11px] font-bold text-outline">INFERENCE ENGINE</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Online
                </span>
              </div>
              <h3 className="font-bold text-base text-on-surface">Groq LPU (Llama 3.3)</h3>
              <p className="text-xs text-on-surface-variant mt-1">High-throughput 70B parameter reasoning</p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs font-mono-code">
              <span className="text-outline">Output Speed</span>
              <span className="font-bold text-on-surface">142 tok/s</span>
            </div>
          </div>

          {/* Card 4: Postgres Vector */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono-code text-[11px] font-bold text-outline">STORAGE & EMBEDDINGS</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Synced
                </span>
              </div>
              <h3 className="font-bold text-base text-on-surface">PostgreSQL + pgvector</h3>
              <p className="text-xs text-on-surface-variant mt-1">HNSW cosine vector index with 1,536 dimensions</p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs font-mono-code">
              <span className="text-outline">Active Vectors</span>
              <span className="font-bold text-on-surface">38,419</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Log Feed & Trace Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Logs List */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">terminal</span>
                <h3 className="font-bold text-sm text-on-surface">Live API Telemetry Stream</h3>
              </div>

              <div className="flex items-center gap-1.5">
                {(['All', 'POST', 'GET'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilterMethod(m)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono-code transition-all cursor-pointer ${
                      filterMethod === m
                        ? 'bg-surface-container-highest text-on-surface font-bold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3 rounded-xl border font-mono-code text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-low border-primary/50 ring-1 ring-primary/20'
                        : 'bg-surface-container-low/40 border-outline-variant/15 hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.method === 'POST' ? 'bg-primary-fixed text-primary' : 'bg-secondary-fixed text-secondary'
                          }`}
                        >
                          {log.method}
                        </span>
                        <span className="font-bold text-on-surface">{log.endpoint}</span>
                      </div>
                      <span className="text-[10px] text-outline">{log.timestamp}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-outline">
                      <span className="line-clamp-1">{log.sourcePipeline}</span>
                      <span className="font-bold text-tertiary ml-2 shrink-0">{log.latencyMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trace Detail Inspector */}
          {selectedLog && (
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 shadow-xs flex flex-col sticky top-24">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/15">
                <div>
                  <span className="text-[10px] font-mono-code text-outline uppercase">TRACE INSPECTOR</span>
                  <h4 className="font-bold text-sm text-on-surface flex items-center gap-2 mt-0.5">
                    <span>{selectedLog.endpoint}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-tertiary-fixed/30 text-tertiary font-mono-code font-bold">
                      {selectedLog.statusText}
                    </span>
                  </h4>
                </div>
                <span className="font-mono-code text-xs font-bold text-primary">
                  {selectedLog.latencyMs} ms
                </span>
              </div>

              <div className="space-y-4 text-xs font-mono-code">
                <div>
                  <span className="text-[10px] text-outline uppercase block mb-1">Pipeline Route</span>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface">
                    {selectedLog.sourcePipeline}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-outline uppercase block mb-1">Latency Breakdown</span>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface">
                    {selectedLog.latencyBreakdown || 'Aggregated execution'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-outline uppercase block mb-1">Telemetry Signal</span>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface">
                    {selectedLog.signal}
                  </div>
                </div>

                {selectedLog.detailPayload && (
                  <div>
                    <span className="text-[10px] text-outline uppercase block mb-1">JSON Payload Trace</span>
                    <pre className="p-3 rounded-lg bg-surface-container-high border border-outline-variant/20 text-[11px] text-on-surface overflow-x-auto max-h-56">
                      {JSON.stringify(selectedLog.detailPayload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
