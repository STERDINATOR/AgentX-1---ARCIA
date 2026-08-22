import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Globe,
  FileCode,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Square,
  Search,
  Database,
  Radio,
  Download,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Investigation, AgentStep, SourceEvidence } from '../types';
import { api } from '../api';

interface LiveAgentMonitorProps {
  investigationId: string;
  onViewReport: (reportId?: string) => void;
  onClose?: () => void;
}

export const LiveAgentMonitor: React.FC<LiveAgentMonitorProps> = ({
  investigationId,
  onViewReport,
  onClose,
}) => {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'telemetry'>('timeline');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let pollInterval: any = null;

    // 1. Fetch initial state
    api.getInvestigation(investigationId).then(data => {
      setInvestigation(data);
    }).catch(err => console.error('Failed to load investigation:', err));

    // 2. Open Server-Sent Events (SSE) stream for live updates
    const eventSource = new EventSource(`/api/investigations/${investigationId}/events`);

    eventSource.onopen = () => {
      setIsLiveConnected(true);
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.investigation) {
          setInvestigation(payload.investigation);
        } else if (payload.type === 'step_complete' || payload.type === 'step_start') {
          setInvestigation(prev => {
            if (!prev) return prev;
            const existingStepIdx = prev.steps.findIndex(s => s.id === payload.step.id);
            const updatedSteps = [...prev.steps];
            if (existingStepIdx >= 0) {
              updatedSteps[existingStepIdx] = payload.step;
            } else {
              updatedSteps.push(payload.step);
            }
            return {
              ...prev,
              status: payload.investigation?.status || prev.status,
              currentAction: payload.step.tool,
              currentDecision: payload.step.decisionSummary,
              steps: updatedSteps,
              evidence: payload.investigation?.evidence || prev.evidence
            };
          });
        } else if (payload.type === 'complete') {
          setInvestigation(payload.investigation);
        }
      } catch (err) {
        console.error('SSE Message parsing error:', err);
      }
    };

    eventSource.onerror = () => {
      setIsLiveConnected(false);
      // Start fallback polling if SSE is interrupted
      if (!pollInterval) {
        pollInterval = setInterval(() => {
          api.getInvestigation(investigationId).then(data => {
            setInvestigation(data);
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'stopped') {
              clearInterval(pollInterval);
            }
          }).catch(() => {});
        }, 2000);
      }
    };

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      eventSource.close();
    };
  }, [investigationId]);

  // Auto-scroll timeline to bottom as steps progress
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [investigation?.steps?.length, investigation?.currentDecision]);

  const handleStop = async () => {
    if (investigation) {
      await api.stopInvestigation(investigation.id);
      const updated = await api.getInvestigation(investigation.id);
      setInvestigation(updated);
    }
  };

  const handleDownloadInvestigation = () => {
    if (!investigation) return;
    setIsExporting(true);
    try {
      const fullAuditState = {
        auditMetadata: {
          exportedAt: new Date().toISOString(),
          formatVersion: "1.0.0-audit",
          orchestrator: "ARCIA Autonomous Multi-Vector Engine",
          targetCompetitor: investigation.competitor,
          topic: investigation.topic,
          priority: investigation.priority,
          timeRange: investigation.timeRange,
          lifecycleStatus: investigation.status,
          totalReActSteps: investigation.steps.length,
          totalCollectedSources: investigation.evidence.length,
          hasSynthesisReport: Boolean(investigation.report || investigation.reportId),
        },
        investigationState: {
          id: investigation.id,
          competitor: investigation.competitor,
          topic: investigation.topic,
          objective: investigation.objective,
          timeRange: investigation.timeRange,
          priority: investigation.priority,
          status: investigation.status,
          startedAt: investigation.startedAt,
          completedAt: investigation.completedAt,
          currentAction: investigation.currentAction,
          currentDecision: investigation.currentDecision,
          progress: investigation.progress,
          insights: investigation.insights,
          reportId: investigation.reportId,
          report: investigation.report,
        },
        reactExecutionTrace: investigation.steps.map(step => ({
          stepNumber: step.stepNumber,
          stepId: step.id,
          timestamp: step.timestamp,
          durationMs: step.durationMs,
          status: step.status,
          thought: step.thought,
          decisionSummary: step.decisionSummary,
          action: step.action,
          tool: step.tool,
          query: step.query,
          observationSummary: step.observationSummary,
          sourcesFoundCount: step.sourcesFound,
          toolResults: step.sources || [],
        })),
        groundedSourcesAndEvidence: investigation.evidence.map(ev => ({
          id: ev.id,
          investigationId: ev.investigationId,
          type: ev.type,
          title: ev.title,
          url: ev.url,
          source: ev.source,
          publishedAt: ev.publishedAt,
          authors: ev.authors || [],
          abstract: ev.abstract || null,
          summary: ev.summary,
          relevanceScore: ev.relevance,
          confidenceScore: ev.confidence,
          tags: ev.tags || [],
        })),
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullAuditState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const safeCompetitor = investigation.competitor.toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadAnchor.setAttribute("download", `investigation-${investigation.id}-${safeCompetitor}-audit.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export investigation audit state:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getToolIcon = (tool: string) => {
    const t = tool.toLowerCase();
    if (t.includes('web')) return Globe;
    if (t.includes('research')) return FileCode;
    if (t.includes('patent')) return ShieldAlert;
    if (t.includes('analyze')) return Cpu;
    return Sparkles;
  };

  if (!investigation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Connecting to Autonomous Agent Core...</p>
        </div>
      </div>
    );
  }

  const isCompleted = investigation.status === 'completed';
  const isRunning = investigation.status === 'running' || investigation.status === 'queued';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Status & Agent Control Banner */}
      <div className="relative overflow-hidden rounded-lg bg-[#0d0d0f] border border-white/10 p-6 shadow-xl">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-10 bg-dot-pattern pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {isRunning ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-semibold tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-ping"></span>
                  <span>Autonomous Fleet Active</span>
                </div>
              ) : isCompleted ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-widest uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mission Concluded</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/[0.04] border border-white/10 text-white/70 text-[10px] font-semibold tracking-widest uppercase">
                  <AlertCircle className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>{investigation.status.toUpperCase()}</span>
                </div>
              )}

              <span className="text-[10px] font-mono text-white/30">ID: {investigation.id}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.02] text-white/50 border border-white/5 uppercase tracking-wider">Priority: {investigation.priority}</span>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-light text-white tracking-tight flex items-center gap-2 font-editorial">
                <span>{investigation.competitor}</span>
                <span className="text-white/20 font-normal">/</span>
                <span className="text-[#c5a059] italic">{investigation.topic}</span>
              </h2>
              <p className="text-xs text-white/50 font-light mt-1 max-w-3xl leading-relaxed">
                <strong className="text-white/30 uppercase text-[10px] tracking-widest mr-1">Objective:</strong> {investigation.objective}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {/* Download Investigation Audit Button */}
            <button
              onClick={handleDownloadInvestigation}
              disabled={isExporting}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-mono uppercase tracking-wider transition-all border ${
                exportSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10 hover:border-white/20'
              }`}
              title="Export complete investigation state, ReAct steps, and evidence records as JSON for external audit"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>State Exported</span>
                </>
              ) : isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Download Investigation</span>
                </>
              )}
            </button>

            {isRunning && (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-3.5 py-2 rounded bg-white/[0.02] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 text-xs font-mono tracking-wider uppercase transition-all"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Halt Sequence</span>
              </button>
            )}

            {(isCompleted || investigation.reportId) && (
              <button
                onClick={() => onViewReport(investigation.reportId)}
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider shadow-md shadow-[#c5a059]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Examine Synthesis Report</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            )}
          </div>
        </div>

        {/* Live ReAct Reasoning Progress Strip */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-[#c5a059] block mb-0.5 font-bold">Active Directive</span>
            <p className="text-white/90 font-medium truncate" title={investigation.currentDecision}>
              {investigation.currentDecision || 'Synthesizing next strategy...'}
            </p>
          </div>

          <div className="p-3 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-0.5 font-medium">Invoked Vector</span>
            <p className="text-[#c5a059] font-medium flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-[#c5a059]" />
              {investigation.currentAction || 'Autonomous Engine'}
            </p>
          </div>

          <div className="p-3 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-0.5 font-medium">Iteration Sequence</span>
            <p className="text-white font-mono">
              Step <span className="text-[#c5a059] font-bold">{investigation.steps.length}</span> / 8
            </p>
          </div>

          <div className="p-3 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase tracking-widest text-white/30 block mb-0.5 font-medium">Evidence Grounded</span>
            <p className="text-white/80 font-mono flex items-center gap-1.5">
              <Database className="w-3 h-3 text-[#c5a059]" />
              {investigation.evidence.length} Primary Records
            </p>
          </div>
        </div>
      </div>

      {/* Main HUD Body: Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Autonomous ReAct Decision Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#c5a059]" />
              <span>Autonomous Reasoning & Execution Timeline</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1 text-[11px] rounded uppercase tracking-wider font-semibold transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-[#c5a059] text-black shadow-sm'
                    : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/5'
                }`}
              >
                Steps ({investigation.steps.length})
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1 text-[11px] rounded uppercase tracking-wider font-semibold transition-all ${
                  activeTab === 'telemetry'
                    ? 'bg-[#c5a059] text-black shadow-sm'
                    : 'bg-white/[0.03] text-white/50 hover:text-white border border-white/5'
                }`}
              >
                Telemetry Logs
              </button>
            </div>
          </div>

          {activeTab === 'timeline' && (
            <div
              ref={scrollRef}
              className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pb-4 scroll-smooth"
            >
              {investigation.steps.map((step, idx) => {
                const ToolIcon = getToolIcon(step.tool);
                const isStepExecuting = step.status === 'executing';

                return (
                  <div
                    key={step.id || idx}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      isStepExecuting
                        ? 'bg-white/[0.04] border-[#c5a059]/50 shadow-md shadow-[#c5a059]/10'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] font-bold text-[11px] flex items-center justify-center font-mono">
                          #{step.stepNumber}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.03] text-white/80 text-[11px] font-medium border border-white/5 uppercase tracking-wider">
                          <ToolIcon className="w-3 h-3 text-[#c5a059]" />
                          <span>Tool: {step.tool}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        {isStepExecuting ? (
                          <span className="flex items-center gap-1 text-[#c5a059] font-semibold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-ping"></span>
                            Executing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        <span className="font-mono text-white/30">{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Agent Decision Summary (The ReAct 'Thought' concise summary) */}
                    <div className="mb-2 p-2.5 rounded bg-white/[0.01] border border-white/5">
                      <div className="text-[9px] uppercase font-bold tracking-widest text-[#c5a059] mb-0.5">Agent Rationale</div>
                      <p className="text-xs text-white/80 font-normal leading-relaxed">
                        "{step.decisionSummary}"
                      </p>
                    </div>

                    {/* Targeted Query */}
                    {step.query && (
                      <div className="mb-2 text-xs flex items-center gap-2 text-white/40">
                        <Search className="w-3 h-3 text-[#c5a059]" />
                        <span className="font-mono text-white/70 truncate">"{step.query}"</span>
                      </div>
                    )}

                    {/* Observation Result */}
                    <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#c5a059] flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-white/70">
                        <strong className="text-[#c5a059] font-medium uppercase text-[10px] tracking-wider mr-1">Observation: </strong>
                        {step.observationSummary}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Live Streaming Active Step Placeholder when running */}
              {isRunning && investigation.steps[investigation.steps.length - 1]?.status !== 'executing' && (
                <div className="p-4 rounded-lg bg-white/[0.02] border border-[#c5a059]/30 border-dashed animate-pulse flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xs text-[#c5a059] font-medium tracking-wide">
                    Agent synthesizing tactical hypothesis based on accumulated research corpus...
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-xs text-white/60 font-mono">Real-Time Autonomous Agent Event Log & Trace Stream</span>
                <button
                  onClick={handleDownloadInvestigation}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#c5a059]/10 hover:bg-[#c5a059]/20 border border-[#c5a059]/30 text-[#c5a059] text-[10px] font-mono uppercase tracking-wider transition-all"
                >
                  <Download className="w-3 h-3 text-[#c5a059]" />
                  <span>Download Audit JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-[#060608] border border-white/5 font-mono text-xs text-white/60 max-h-[540px] overflow-y-auto space-y-2">
                <p className="text-[#c5a059]">[INIT] Autonomous Agent runtime active. Bound model: gemini-3.7-flash.</p>
                <p className="text-white/30">[CONFIG] Objective: "{investigation.objective}"</p>
                {investigation.steps.map((s, i) => (
                  <div key={i} className="space-y-1 py-1.5 border-b border-white/[0.03]">
                    <p className="text-white/90">
                      [{s.timestamp.slice(11, 19)}] STEP_{s.stepNumber} DECISION: {s.decisionSummary}
                    </p>
                    <p className="text-[#c5a059]">
                      &gt; INVOKE_TOOL: {s.action} | Query: "{s.query}"
                    </p>
                    <p className="text-white/50">
                      &lt; OBSERVATION: {s.observationSummary} ({s.sourcesFound} sources grounded)
                    </p>
                  </div>
                ))}
                {isCompleted && (
                  <p className="text-emerald-400 font-medium pt-1">[COMPLETE] Final intelligence dossier synthesized. Ready for review & external audit.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Real-time Discovered Evidence Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#c5a059]" />
              <span>Grounded Evidence ({investigation.evidence.length})</span>
            </h3>
            <span className="text-[10px] uppercase tracking-widest text-white/30">Live Stream</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {investigation.evidence.length === 0 ? (
              <div className="p-8 rounded-lg bg-white/[0.02] border border-white/5 text-center">
                <Globe className="w-8 h-8 text-white/20 mx-auto mb-2 animate-bounce" />
                <p className="text-xs text-white/40 font-light">Awaiting first tool execution to gather verified sources...</p>
              </div>
            ) : (
              investigation.evidence.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider ${
                      ev.type === 'web'
                        ? 'bg-white/[0.04] text-white/80 border border-white/10'
                        : ev.type === 'research'
                        ? 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}>
                      {ev.type}
                    </span>

                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{ev.confidence || 95}% Conf</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-medium text-white/90 group-hover:text-[#c5a059] transition-colors line-clamp-2 mb-1">
                    {ev.title}
                  </h4>

                  <p className="text-[11px] text-white/40 font-light line-clamp-2 leading-relaxed mb-2">
                    {ev.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-white/40">
                    <span className="truncate max-w-[150px] text-white/60">{ev.source}</span>
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#c5a059] hover:text-white font-medium"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
