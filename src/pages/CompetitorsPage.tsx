import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Plus,
  Bookmark,
  Shield,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Competitor } from '../types';
import { api } from '../api';
import { ActivitySparkline } from '../components/ActivitySparkline';

interface CompetitorsPageProps {
  onSelectCompetitor: (name: string) => void;
  onNewInvestigation: (competitorName?: string) => void;
}

export const CompetitorsPage: React.FC<CompetitorsPageProps> = ({
  onSelectCompetitor,
  onNewInvestigation,
}) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('All');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [compData, watchData] = await Promise.all([
          api.getCompetitors(),
          api.getWatchlist(),
        ]);
        setCompetitors(compData);
        setWatchlist(watchData);
      } catch (err) {
        console.error('Failed to load competitors:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleWatchlist = async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await api.toggleWatchlist(name);
    setWatchlist(res.watchlist);
  };

  const sectors = ['All', 'AI Silicon & Computing', 'Frontier AI Labs', 'Cloud & Hyperscale AI'];

  const filteredCompetitors = competitors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = sectorFilter === 'All' || c.sector.includes(sectorFilter) || sectorFilter.includes(c.sector);
    return matchesSearch && matchesSector;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight font-editorial">Monitored Entities & Competitor Portfolios</h2>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">
            Continuous competitive intelligence tracking across key global AI leaders and hardware architectures.
          </p>
        </div>

        <button
          onClick={() => onNewInvestigation()}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider shadow-sm shadow-[#c5a059]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-black" />
          <span>Initiate Target Mission</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search competitor by name or technology..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded bg-white/[0.02] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        {/* Sector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {sectors.map(sec => (
            <button
              key={sec}
              onClick={() => setSectorFilter(sec)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
                sectorFilter === sec
                  ? 'bg-[#c5a059]/10 border-[#c5a059] text-[#c5a059]'
                  : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompetitors.map((comp) => {
          const isWatch = watchlist.includes(comp.name);
          const threatColor = comp.threatScore >= 80 ? 'text-[#e05353] bg-[#e05353]/10 border-[#e05353]/30' : comp.threatScore >= 60 ? 'text-[#c5a059] bg-[#c5a059]/10 border-[#c5a059]/30' : 'text-white/70 bg-white/[0.04] border-white/10';

          return (
            <div
              key={comp.name}
              onClick={() => onSelectCompetitor(comp.name)}
              className="p-5 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#c5a059]/30 transition-all cursor-pointer group flex flex-col justify-between shadow-xl"
            >
              <div>
                {/* Top Strip */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-white/[0.04] border border-white/10 flex items-center justify-center font-bold text-white text-xs font-mono">
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-light text-white group-hover:text-[#c5a059] transition-colors font-editorial">
                        {comp.name}
                      </h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{comp.sector}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleToggleWatchlist(comp.name, e)}
                    className="p-1.5 rounded bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white/40 hover:text-[#c5a059] transition-colors"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isWatch ? 'fill-[#c5a059] text-[#c5a059]' : ''}`} />
                  </button>
                </div>

                <p className="text-xs text-white/50 font-light line-clamp-2 leading-relaxed mb-4">
                  {comp.description}
                </p>

                {/* Threat Score & Key Metric */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider block">Threat Index</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-sm font-mono px-1.5 py-0.5 rounded border ${threatColor}`}>
                        {comp.threatScore}
                      </span>
                      <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">{comp.threatLevel}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider block">Valuation / Cap</span>
                    <span className="text-xs font-mono font-light text-white/90 mt-0.5 block">{comp.marketCap}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Strip */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center gap-2 font-mono text-[10px]">
                  <span>{comp.activeInvestigations} missions</span>
                  <span>•</span>
                  <span className="text-[#e05353]">{comp.recentAlerts} alerts</span>
                </div>
                <ActivitySparkline data={comp.activityTrend} color="#c5a059" height={20} width={65} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
