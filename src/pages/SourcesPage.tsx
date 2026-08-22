import React, { useEffect, useState } from 'react';
import {
  Globe,
  FileCode,
  Shield,
  Search,
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { SourceEvidence } from '../types';
import { api } from '../api';

export const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<SourceEvidence[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSources();
        setSources(data);
      } catch (err) {
        console.error('Failed to load sources:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = sources.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.source.toLowerCase().includes(searchQuery.toLowerCase()) || s.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || s.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <span>Grounded Multi-Vector Evidence Repository</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified web news, peer-reviewed arXiv preprints, and registered patent filings harvested by autonomous agents.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search verified evidence by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Web', 'Research', 'Patent'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                typeFilter === t
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t} Sources
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s, idx) => {
          const typeBg = s.type === 'web' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : s.type === 'research' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

          return (
            <div
              key={s.id || idx}
              className="p-5 rounded-2xl bg-[#090e24]/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeBg}`}>
                    {s.type}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>Relevance: {s.relevance}%</span>
                    <span>•</span>
                    <span className="text-emerald-400">Conf: {s.confidence}%</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                  {s.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {s.summary}
                </p>

                {s.authors && s.authors.length > 0 && (
                  <p className="text-[11px] text-slate-400 mb-2">
                    <strong className="text-slate-300">Authors:</strong> {s.authors.join(', ')}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium truncate max-w-[200px]">{s.source} • {s.publishedAt}</span>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    <span>View Grounded Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
