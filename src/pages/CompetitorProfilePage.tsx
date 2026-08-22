import React, { useEffect, useState } from 'react';
import {
  Building2,
  Shield,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  ArrowLeft,
  FileCode,
  Globe,
  Plus,
  Bookmark,
  Check,
  Zap,
  Activity
} from 'lucide-react';
import { Competitor, Investigation } from '../types';
import { api } from '../api';
import { ThreatGauge } from '../components/ThreatGauge';
import { ActivitySparkline } from '../components/ActivitySparkline';

interface CompetitorProfilePageProps {
  competitorName: string;
  onBack: () => void;
  onNewInvestigation: (competitorName: string) => void;
}

export const CompetitorProfilePage: React.FC<CompetitorProfilePageProps> = ({
  competitorName,
  onBack,
  onNewInvestigation,
}) => {
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'patents' | 'news' | 'products' | 'swot'>('overview');
  const [isWatchlisted, setIsWatchlisted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [compData, watchlistData] = await Promise.all([
          api.getCompetitor(competitorName),
          api.getWatchlist(),
        ]);
        setCompetitor(compData);
        setIsWatchlisted(watchlistData.includes(compData.name));
      } catch (err) {
        console.error('Failed to load competitor profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [competitorName]);

  const handleToggleWatchlist = async () => {
    if (!competitor) return;
    const res = await api.toggleWatchlist(competitor.name);
    setIsWatchlisted(res.watchlist.includes(competitor.name));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading Competitor Dossier...</p>
        </div>
      </div>
    );
  }

  if (!competitor) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
        <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Competitor Not Found</h3>
        <p className="text-xs text-slate-400 mb-4">No dossier available for "{competitorName}".</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Back to Competitors
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Back Button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Competitors Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleWatchlist}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isWatchlisted
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-blue-400 text-blue-400' : ''}`} />
            <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
          </button>

          <button
            onClick={() => onNewInvestigation(competitor.name)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Mission on {competitor.name}</span>
          </button>
        </div>
      </div>

      {/* Competitor Hero Banner matching Image 5 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1433] via-[#090e24] to-[#070b1c] border border-blue-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl flex-shrink-0">
              {competitor.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {competitor.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {competitor.sector}
                </span>
                <span className="text-xs text-slate-400 font-mono">HQ: {competitor.headquarters}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {competitor.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                <span>Market Cap: <strong className="text-white">{competitor.marketCap}</strong></span>
                <span>•</span>
                <span>Active Investigations: <strong className="text-blue-400">{competitor.activeInvestigations}</strong></span>
                <span>•</span>
                <span>Recent Alerts: <strong className="text-red-400">{competitor.recentAlerts}</strong></span>
              </div>
            </div>
          </div>

          {/* Threat Gauge */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col items-center justify-center min-w-[200px]">
            <ThreatGauge score={competitor.threatScore} level={competitor.threatLevel} confidence={93} size="md" />
          </div>
        </div>

        {/* 4 Threat Factor Metrics Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">R&D Velocity Factor</span>
            <span className="text-lg font-bold text-white font-mono">{competitor.threatFactors.rdVelocity}%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Patent Growth Rate</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{competitor.threatFactors.patentGrowth}%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Market Dominance</span>
            <span className="text-lg font-bold text-red-400 font-mono">{competitor.threatFactors.marketDominance}%</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Talent Inflow Moat</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{competitor.threatFactors.talentInflow}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview & SWOT' },
          { id: 'products', label: 'Key Products & Silicon' },
          { id: 'research', label: 'Scientific Research (arXiv)' },
          { id: 'patents', label: 'Patent Portfolio' },
          { id: 'news', label: 'Live News & Announcements' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview & SWOT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Strategic Focus Areas */}
          <div className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Core Strategic Focus Areas</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {competitor.strategicFocus.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* 4-Quadrant SWOT Analysis Matrix matching Image 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Strengths</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {competitor.swot.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Weaknesses</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {competitor.swot.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-6 rounded-3xl bg-blue-950/20 border border-blue-500/30 space-y-3">
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Opportunities</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {competitor.swot.opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Threats */}
            <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-3">
              <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Threats & Market Headwinds</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {competitor.swot.threats.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Key Products */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitor.keyProducts.map((prod, i) => (
            <div key={i} className="p-5 rounded-2xl bg-[#090e24]/90 border border-slate-800 hover:border-blue-500/40 transition-all flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">{prod.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{prod.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB CONTENT: Research & Papers */}
      {activeTab === 'research' && (
        <div className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>Published Scientific Papers & arXiv Preprints</span>
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-purple-500/20 text-purple-300 mb-1 inline-block">
                arXiv:2501.09842 [cs.DC]
              </span>
              <h4 className="text-xs font-bold text-white mb-1">
                Megatron-Scale: Ultra-Low Latency Interconnects for 100k+ GPU Clusters
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Co-authored with Stanford & Berkeley collaborators detailing NVLink 5.0 topologies and pipeline scheduling algorithms.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-purple-500/20 text-purple-300 mb-1 inline-block">
                NeurIPS 2025 Spotlight
              </span>
              <h4 className="text-xs font-bold text-white mb-1">
                FP4 Quantization Dynamics for 1T Parameter MoE Mixture-of-Experts
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Theoretical proof of precision bounds under Blackwell 2nd-gen Transformer Engines with minimal accuracy degradation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Patents */}
      {activeTab === 'patents' && (
        <div className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Registered Patents & Intellectual Property Filings</span>
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-amber-500/20 text-amber-300 mb-1 inline-block">
                US Patent 11,948,203
              </span>
              <h4 className="text-xs font-bold text-white mb-1">
                Dynamic Matrix Multiplication Acceleration via Decompression Caches
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hardware claims protecting low-precision tensor prefetching directly into L2 SRAM.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: News */}
      {activeTab === 'news' && (
        <div className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Corporate Announcements & Industry Press</span>
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono block mb-1">Reuters / TechCrunch • Recent</span>
              <h4 className="text-xs font-bold text-white mb-1">
                {competitor.name} expands hyperscaler cloud partnerships for enterprise AI agent clusters
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Multi-year multi-billion dollar commitment securing advanced packaging capacity and foundry allocations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
