import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Compass,
  FileText,
  Clock,
  Globe,
  FileCode,
  Shield,
  Zap,
  CheckCircle2,
  Cpu,
  Layers,
  Radio,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { PriorityLevel } from '../types';

interface NewInvestigationPageProps {
  onInvestigationStarted: (investigationId: string) => void;
  onCancel: () => void;
}

export const NewInvestigationPage: React.FC<NewInvestigationPageProps> = ({
  onInvestigationStarted,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [competitor, setCompetitor] = useState<string>('NVIDIA');
  const [customCompetitor, setCustomCompetitor] = useState<string>('');
  const [topic, setTopic] = useState<string>('Next-Gen AI Silicon & Accelerators (Blackwell B200 / Rubin)');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [objective, setObjective] = useState<string>(
    'Investigate technical specifications, benchmark data, patent moats, and commercial delivery timelines for next-generation enterprise AI silicon.'
  );
  const [timeRange, setTimeRange] = useState<string>('Last 30 Days');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [sources, setSources] = useState<{ web: boolean; research: boolean; patents: boolean; social: boolean }>({
    web: true,
    research: true,
    patents: true,
    social: true,
  });

  const competitorPresets = [
    'NVIDIA',
    'OpenAI',
    'Google',
    'Microsoft',
    'Meta',
    'Anthropic',
    'Custom Target',
  ];

  const topicPresets = [
    'Next-Gen AI Silicon & Accelerators (Blackwell B200 / Rubin)',
    'Frontier Reasoning Models (o3, Gemini 2.0 Thinking, Claude 3.7)',
    'Embodied AI & Humanoid Robotics (Cosmos, Figure, Optimus)',
    'Enterprise Agent Workflows & Tool-Use Systems',
    'Hardware Acceleration & Low-Precision Quantization Patents',
    'Custom Research Topic',
  ];

  const activeCompetitor = competitor === 'Custom Target' ? customCompetitor : competitor;
  const activeTopic = topic === 'Custom Research Topic' ? customTopic : topic;

  const handleLaunch = async () => {
    if (!activeCompetitor.trim()) {
      setError('Please select or specify a target competitor.');
      return;
    }
    if (!activeTopic.trim()) {
      setError('Please select or specify a research topic.');
      return;
    }
    if (!objective.trim()) {
      setError('Please provide an investigation objective.');
      return;
    }

    setIsLaunching(true);
    setError(null);

    try {
      // 1. Create Investigation
      const inv = await api.createInvestigation({
        competitor: activeCompetitor,
        topic: activeTopic,
        objective,
        timeRange,
        priority,
      });

      // 2. Trigger Autonomous Execution
      await api.runInvestigation(inv.id);

      // 3. Hand off to Live Monitor
      onInvestigationStarted(inv.id);
    } catch (err: any) {
      console.error('Failed to launch investigation:', err);
      setError(err.message || 'Failed to start investigation');
      setIsLaunching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Wizard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#c5a059] uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Autonomous Intelligence Mission Dispatch</span>
          </div>
          <h2 className="text-2xl font-light text-white tracking-tight font-editorial">Configure Autonomous Research Fleet</h2>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">
            Configure target parameters, intelligence vectors, and autonomous ReAct reasoning depth.
          </p>
        </div>

        {/* Step Wizard Progress Bar */}
        <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/10 p-1 rounded">
          {[1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-all ${
                currentStep === step
                  ? 'bg-[#c5a059] text-black font-semibold shadow-sm'
                  : currentStep > step
                  ? 'text-[#c5a059] bg-[#c5a059]/10'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <span>{step}</span>
              <span className="hidden sm:inline">
                {step === 1 ? 'Target' : step === 2 ? 'Sources' : step === 3 ? 'Agent' : 'Review'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-[#e05353]/10 border border-[#e05353]/30 text-[#e05353] text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#e05353] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Multi-step Configuration Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Target & Objective */}
          {currentStep === 1 && (
            <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 space-y-6 shadow-xl">
              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Select Competitor Target
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                  {competitorPresets.map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setCompetitor(comp)}
                      className={`p-3 rounded text-xs font-light text-left transition-all border font-editorial ${
                        competitor === comp
                          ? 'bg-[#c5a059]/15 border-[#c5a059] text-white shadow-sm'
                          : 'bg-white/[0.02] border-white/5 text-white/70 hover:border-white/20'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>

                {competitor === 'Custom Target' && (
                  <input
                    type="text"
                    placeholder="Enter custom company or laboratory name (e.g. Mistral AI, Cerebras)"
                    value={customCompetitor}
                    onChange={(e) => setCustomCompetitor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded bg-white/[0.02] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059]"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Intelligence Topic
                </label>
                <div className="space-y-2 mb-3">
                  {topicPresets.map((top) => (
                    <button
                      key={top}
                      type="button"
                      onClick={() => setTopic(top)}
                      className={`w-full p-3 rounded text-xs font-light text-left transition-all border flex items-center justify-between font-editorial ${
                        topic === top
                          ? 'bg-[#c5a059]/15 border-[#c5a059] text-white shadow-sm'
                          : 'bg-white/[0.02] border-white/5 text-white/70 hover:border-white/20'
                      }`}
                    >
                      <span>{top}</span>
                      {topic === top && <CheckCircle2 className="w-4 h-4 text-[#c5a059]" />}
                    </button>
                  ))}
                </div>

                {topic === 'Custom Research Topic' && (
                  <input
                    type="text"
                    placeholder="Enter custom investigation topic (e.g. Distributed MoE Training Clusters)"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded bg-white/[0.02] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059]"
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Autonomous Mission Objective
                </label>
                <textarea
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Describe specifically what the agent should verify, uncover, and calculate threat scores for..."
                  className="w-full px-4 py-3 rounded bg-white/[0.02] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059] leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-6 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <span>Next: Scope & Sources</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Scope & Grounded Sources */}
          {currentStep === 2 && (
            <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 space-y-6 shadow-xl">
              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Investigation Time Horizon
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'Last 1 Year'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setTimeRange(range)}
                      className={`p-3 rounded text-xs font-mono uppercase tracking-wider text-center transition-all border ${
                        timeRange === range
                          ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                          : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Intelligence Vectors (Grounded Sources)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSources(s => ({ ...s, web: !s.web }))}
                    className={`p-4 rounded border transition-all cursor-pointer flex items-start gap-3 ${
                      sources.web ? 'bg-[#c5a059]/10 border-[#c5a059]/40' : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-[#c5a059] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-light text-white font-editorial">Live Web & Market Press</span>
                        <input type="checkbox" checked={sources.web} readOnly className="accent-[#c5a059]" />
                      </div>
                      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                        Continuous Google Search Grounding across tech publications, corporate press, and product releases.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSources(s => ({ ...s, research: !s.research }))}
                    className={`p-4 rounded border transition-all cursor-pointer flex items-start gap-3 ${
                      sources.research ? 'bg-[#dfba73]/10 border-[#dfba73]/40' : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-[#dfba73] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-light text-white font-editorial">arXiv & Scientific Journals</span>
                        <input type="checkbox" checked={sources.research} readOnly className="accent-[#dfba73]" />
                      </div>
                      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                        Peer-reviewed AI research, algorithmic preprints, benchmarks, and architecture evaluations.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSources(s => ({ ...s, patents: !s.patents }))}
                    className={`p-4 rounded border transition-all cursor-pointer flex items-start gap-3 ${
                      sources.patents ? 'bg-[#c5a059]/10 border-[#c5a059]/40' : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#c5a059] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-light text-white font-editorial">USPTO & Patent Claims</span>
                        <input type="checkbox" checked={sources.patents} readOnly className="accent-[#c5a059]" />
                      </div>
                      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                        Intellectual property filings, hardware claims, low-precision tensor processing patents.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setSources(s => ({ ...s, social: !s.social }))}
                    className={`p-4 rounded border transition-all cursor-pointer flex items-start gap-3 ${
                      sources.social ? 'bg-white/[0.05] border-white/30' : 'bg-white/[0.02] border-white/5 opacity-50'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-light text-white font-editorial">Enterprise Social Signals</span>
                        <input type="checkbox" checked={sources.social} readOnly className="accent-[#c5a059]" />
                      </div>
                      <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                        Executive announcements, conference talks, and developer sentiment signals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-white/[0.03] hover:bg-white/[0.06] text-white/70 text-xs font-mono uppercase tracking-wider transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-6 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <span>Next: Agent Core</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Agent Configuration */}
          {currentStep === 3 && (
            <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 space-y-6 shadow-xl">
              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  ReAct Reasoning Model Core
                </label>
                <div className="p-4 rounded bg-white/[0.02] border border-[#c5a059]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-[#c5a059]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-light text-white font-editorial">Gemini 3.7 Flash</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase font-semibold bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30">LATEST SDK</span>
                      </div>
                      <p className="text-[11px] text-white/40">High-throughput autonomous reasoning with native search tool calling.</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#c5a059] font-mono uppercase tracking-wider">Active</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Investigation Priority & Urgency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Low', 'Medium', 'High', 'Critical'] as PriorityLevel[]).map((p) => {
                    const isP = priority === p;
                    const pColor = p === 'Critical' ? 'border-[#e05353]/50 bg-[#e05353]/15 text-[#e05353]' : p === 'High' ? 'border-[#c5a059]/50 bg-[#c5a059]/15 text-[#c5a059]' : 'border-white/30 bg-white/[0.05] text-white';
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`p-3 rounded text-xs font-mono uppercase tracking-wider text-center transition-all border ${
                          isP
                            ? pColor
                            : 'bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-white/60 uppercase tracking-widest mb-2">
                  Autonomous ReAct Execution Depth
                </label>
                <div className="p-4 rounded bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Max Dynamic Agent Steps:</span>
                    <span className="font-mono text-[#c5a059]">8 Iterations</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Evidence Gap Verification:</span>
                    <span className="font-mono text-white/90">Enabled</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Real-time SSE Streaming:</span>
                    <span className="font-mono text-[#c5a059]">Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-white/[0.03] hover:bg-white/[0.06] text-white/70 text-xs font-mono uppercase tracking-wider transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex items-center gap-2 px-6 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  <span>Review & Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Initialize */}
          {currentStep === 4 && (
            <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-light text-white mb-1 font-editorial">Final Mission Parameters Review</h3>
                <p className="text-[11px] text-white/40 uppercase tracking-widest">
                  Verify the investigation scope before initializing the autonomous agent fleet.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded bg-white/[0.02] border border-white/5 flex justify-between items-center">
                  <span className="text-white/40 uppercase font-mono text-[10px]">Target Competitor:</span>
                  <span className="font-light text-white text-sm font-editorial">{activeCompetitor}</span>
                </div>
                <div className="p-3.5 rounded bg-white/[0.02] border border-white/5 flex justify-between items-center">
                  <span className="text-white/40 uppercase font-mono text-[10px]">Intelligence Topic:</span>
                  <span className="font-light text-[#c5a059] text-right max-w-xs font-editorial">{activeTopic}</span>
                </div>
                <div className="p-3.5 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-white/40 uppercase font-mono text-[10px] block mb-1">Objective:</span>
                  <p className="text-white/70 font-light leading-relaxed">{objective}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded bg-white/[0.02] border border-white/5 flex justify-between">
                    <span className="text-white/40 uppercase font-mono text-[10px]">Time Horizon:</span>
                    <span className="font-mono text-white/80">{timeRange}</span>
                  </div>
                  <div className="p-3.5 rounded bg-white/[0.02] border border-white/5 flex justify-between">
                    <span className="text-white/40 uppercase font-mono text-[10px]">Priority:</span>
                    <span className="font-mono text-[#c5a059] uppercase">{priority}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex items-center gap-2 px-4 py-2 rounded bg-white/[0.03] hover:bg-white/[0.06] text-white/70 text-xs font-mono uppercase tracking-wider transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={handleLaunch}
                  className="flex items-center gap-2 px-8 py-2.5 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider shadow-md shadow-[#c5a059]/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isLaunching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Initializing ReAct Fleet...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Deploy Intelligence Fleet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Live Mission Preview Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-2xl space-y-4 text-center">
            {/* Centerpiece */}
            <div className="relative mx-auto w-20 h-20 rounded bg-white/[0.03] border border-[#c5a059]/30 p-1 shadow-lg shadow-[#c5a059]/5 flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#c5a059]" />
            </div>

            <div>
              <h3 className="text-base font-light text-white font-editorial">ARCIA ReAct Fleet</h3>
              <p className="text-[10px] text-[#c5a059] font-mono uppercase tracking-widest mt-0.5">Autonomous Reasoner</p>
            </div>

            <div className="p-3.5 rounded bg-white/[0.02] border border-white/5 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40 uppercase font-mono text-[10px]">Target Target:</span>
                <span className="font-light text-white font-editorial">{activeCompetitor || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 uppercase font-mono text-[10px]">Reasoning Core:</span>
                <span className="font-mono text-[#c5a059]">Gemini 3.7 Flash</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 uppercase font-mono text-[10px]">Vectors:</span>
                <span className="font-mono text-white/70">Web, arXiv, Patents</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40 uppercase font-mono text-[10px]">Est. Runtime:</span>
                <span className="font-mono text-white/90">~8 - 15 Seconds</span>
              </div>
            </div>

            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-black" />
              <span>{isLaunching ? 'Deploying...' : 'Deploy Intelligence Fleet'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
