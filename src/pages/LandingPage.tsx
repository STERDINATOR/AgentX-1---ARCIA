import React from 'react';
import {
  Shield,
  Zap,
  Search,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Radio,
  FileCode,
  Globe,
  TrendingUp,
  Award
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onStartInvestigation: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onStartInvestigation,
}) => {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col relative overflow-hidden bg-cyber-grid">
      {/* Top Background Glow Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/30">
            <div className="w-full h-full bg-[#090e24] rounded-[15px] flex items-center justify-center">
              <div className="relative">
                <Shield className="w-6 h-6 text-blue-400" />
                <Zap className="w-3 h-3 text-cyan-300 absolute inset-0 m-auto" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">IntelAgent</span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">v3.7 PRO</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Autonomous AI Competitive Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onEnterApp}
            className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
          >
            <span>Live Dashboard</span>
          </button>
          <button
            onClick={onStartInvestigation}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Mission</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section matching Image 1 */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col items-center text-center">
        {/* Top Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-8 shadow-inner shadow-blue-500/20 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>AUTONOMOUS MULTI-VECTOR INTELLIGENCE AGENT ONLINE</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight max-w-5xl leading-[1.1] mb-6">
          Autonomous AI Research & <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Competitive Intelligence
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed mb-10">
          ARCIA deploys autonomous ReAct reasoning agents that scour live web news, scientific preprints on arXiv, and intellectual property patent registries to synthesize executive threat intelligence reports in real-time.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={onStartInvestigation}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-500/35 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 text-cyan-200" />
            <span>Start Intelligence Mission</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all hover:border-slate-600"
          >
            <Play className="w-4 h-4 text-blue-400 fill-blue-400" />
            <span>Open Command Center</span>
          </button>
        </div>

        {/* Live Radar Graphic Simulation Centerpiece */}
        <div className="w-full max-w-5xl relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0d1430] to-[#080d1e] border border-blue-500/30 p-8 shadow-2xl shadow-blue-500/20 mb-20">
          <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />
          
          {/* Top telemetry bar */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 relative z-10 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                SECTOR RECONNAISSANCE ACTIVE
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-slate-400">FREQ: 142.8 GHz</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 font-mono">
              <span>TARGET: GLOBAL AI SILICON & FRONTIER LABS</span>
              <span className="text-cyan-400 font-semibold">THREAT LEVEL: HIGH</span>
            </div>
          </div>

          {/* Center Radar Scanner View */}
          <div className="py-12 relative flex items-center justify-center">
            {/* Concentric Radar Rings */}
            <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-blue-500/20 flex items-center justify-center relative">
              <div className="w-52 h-52 sm:w-72 sm:h-72 rounded-full border border-blue-500/30 flex items-center justify-center">
                <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border border-cyan-500/40 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-blue-500/20 border border-blue-400/60 flex items-center justify-center">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Sweeping Beam */}
              <div className="absolute inset-0 animate-radar pointer-events-none flex items-center justify-center">
                <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-cyan-300 origin-right translate-x-[-50%] shadow-[0_0_12px_#22d3ee]"></div>
              </div>

              {/* Target Blips */}
              <div className="absolute top-16 right-20 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-red-500/40 text-[10px] font-bold text-red-300">NVIDIA B200</span>
              </div>

              <div className="absolute bottom-20 left-16 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-blue-500/40 text-[10px] font-bold text-blue-300">Google Gemini</span>
              </div>

              <div className="absolute top-24 left-24 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
                <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-purple-500/40 text-[10px] font-bold text-purple-300">OpenAI o3</span>
              </div>

              <div className="absolute bottom-16 right-28 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-amber-500/40 text-[10px] font-bold text-amber-300">Anthropic Claude</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 text-left">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Continuous Monitoring</span>
              <span className="text-lg font-bold text-white font-mono">6,420+ Sources</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Verification Accuracy</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">99.4% Grounded</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">ReAct Agent Latency</span>
              <span className="text-lg font-bold text-blue-400 font-mono">&lt; 850ms / Cycle</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Patent Registries</span>
              <span className="text-lg font-bold text-purple-400 font-mono">USPTO + WIPO</span>
            </div>
          </div>
        </div>

        {/* 4 Core Pillars Cards Grid matching Image 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left mb-20">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#090e24]/80 border border-slate-800 hover:border-blue-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Live Web Newsfeed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monitors global technology press, enterprise deals, executive statements, and product releases with real-time Google Search grounding.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#090e24]/80 border border-slate-800 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCode className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Scientific Papers (arXiv)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tracks preprints, NeurIPS/ICML publications, and algorithmic breakthroughs before commercial announcements hit mainstream media.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#090e24]/80 border border-slate-800 hover:border-amber-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Patent Moat Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Uncovers hardware architecture filings, tensor processing claims, and IP barriers across USPTO, Google Patents, and WIPO.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#090e24]/80 border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Autonomous ReAct Loop</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Iterative dynamic reasoning cycles select the optimal next tool, analyze evidence gaps, and calculate actionable threat scores.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#040711] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 IntelAgent ARCIA. Autonomous Intelligence Platform.</p>
          <div className="flex items-center gap-6">
            <button onClick={onEnterApp} className="hover:text-slate-300 transition-colors">Command Center</button>
            <button onClick={onStartInvestigation} className="hover:text-slate-300 transition-colors">New Investigation</button>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              All Systems Nominal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
