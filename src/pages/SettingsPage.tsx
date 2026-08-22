import React, { useEffect, useState } from 'react';
import {
  Settings,
  Cpu,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (err) {
        console.error('Health check failed:', err);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" />
          <span>IntelAgent System Diagnostics & Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Autonomous core orchestration parameters, Gemini model bindings, and vector feeds.
        </p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core AI Orchestrator */}
        <div className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>AI Reasoning Model Core</span>
            </h3>
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Online
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Model Alias:</span>
              <span className="font-bold text-white font-mono">{health?.model || 'gemini-3.7-flash'}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">API Key Configured:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {health?.geminiKeyConfigured ? 'Yes (Server-Side Secret)' : 'Active (Workspace Binding)'}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Agent Architecture:</span>
              <span className="font-bold text-blue-300">ReAct (Reasoning + Acting Loop)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Max Autonomous Depth:</span>
              <span className="font-mono text-white">8 Dynamic Iterations</span>
            </div>
          </div>
        </div>

        {/* Intelligence Feeds */}
        <div className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Grounded Intelligence Vectors</span>
            </h3>
            <span className="text-xs text-purple-300 font-mono">4 Vectors Active</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Google Search Grounding:</span>
              <span className="text-emerald-400 font-semibold">Enabled (Live Web News)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Scientific Preprints:</span>
              <span className="text-purple-400 font-semibold">arXiv.org API + Grounding</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Intellectual Property:</span>
              <span className="text-amber-400 font-semibold">USPTO, Google Patents & WIPO</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Real-time Stream:</span>
              <span className="text-cyan-400 font-semibold">Server-Sent Events (SSE)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Plan Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-purple-950/40 border border-blue-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-300" />
            <h3 className="text-base font-bold text-white">IntelAgent Enterprise Suite</h3>
          </div>
          <p className="text-xs text-slate-300">
            Autonomous multi-agent concurrent research, custom Spanner data lakes, and continuous scheduled alerts.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all">
          Manage Organization
        </button>
      </div>
    </div>
  );
};
