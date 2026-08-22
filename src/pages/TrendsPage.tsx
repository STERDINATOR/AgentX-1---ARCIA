import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Search,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  ChevronRight,
  FileCode
} from 'lucide-react';
import { EmergingTrendItem } from '../types';
import { api } from '../api';

interface TrendsPageProps {
  onNewInvestigationWithTrend: (trendName: string) => void;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({
  onNewInvestigationWithTrend,
}) => {
  const [trends, setTrends] = useState<EmergingTrendItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [impactFilter, setImpactFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTrends();
        setTrends(data);
      } catch (err) {
        console.error('Failed to load trends:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = trends.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesImpact = impactFilter === 'All' || t.impact === impactFilter;
    return matchesSearch && matchesImpact;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <span>Emerging AI Trends & Technology Trajectory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic breakthroughs, silicon architectures, and strategic shifts surfaced by autonomous recon.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search emerging trend..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'High', 'Medium', 'Low'].map(imp => (
            <button
              key={imp}
              onClick={() => setImpactFilter(imp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                impactFilter === imp
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {imp} Impact
            </button>
          ))}
        </div>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(trend => (
          <div
            key={trend.id}
            className="p-6 rounded-3xl bg-[#090e24]/90 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between shadow-xl group"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  {trend.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {trend.direction}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                    {trend.impact} Impact
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {trend.description}
              </p>

              {/* Signal strength bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Reconnaissance Signal Strength</span>
                  <span className="font-mono text-purple-300 font-bold">{trend.signalStrength}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 h-full rounded-full"
                    style={{ width: `${trend.signalStrength}%` }}
                  />
                </div>
              </div>

              {trend.whyItMatters && (
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs mb-4">
                  <strong className="text-slate-400 block mb-1">Why It Matters:</strong>
                  <p className="text-slate-200 leading-relaxed">{trend.whyItMatters}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">{trend.evidenceCount} Grounded Evidence Points</span>
              <button
                onClick={() => onNewInvestigationWithTrend(trend.name)}
                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
              >
                <span>Launch Deep Dive</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
