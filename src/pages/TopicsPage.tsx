import React, { useEffect, useState } from 'react';
import {
  Compass,
  Search,
  Plus,
  TrendingUp,
  FileCode,
  Shield,
  Globe,
  Sparkles,
  ArrowRight,
  Zap,
  Layers
} from 'lucide-react';
import { Topic } from '../types';
import { api } from '../api';
import { ActivitySparkline } from '../components/ActivitySparkline';

interface TopicsPageProps {
  onNewInvestigationWithTopic: (topicName: string, competitorName?: string) => void;
}

export const TopicsPage: React.FC<TopicsPageProps> = ({
  onNewInvestigationWithTopic,
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTopics();
        setTopics(data);
      } catch (err) {
        console.error('Failed to load topics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ['All', 'Hardware & Silicon', 'Frontier AI Models', 'Robotics & Embodied AI', 'Enterprise AI Systems', 'Patents & IP'];

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Intelligence Topics & Technology Domains</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track multi-vector research velocity, patent clusters, and competitive developments across AI domains.
          </p>
        </div>

        <button
          onClick={() => onNewInvestigationWithTopic('Custom Research Topic')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Custom Topic Mission</span>
        </button>
      </div>

      {/* Filter and Search Bar matching Image 6 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search technology domain or architecture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                categoryFilter === cat
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid matching Image 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTopics.map((topic) => (
          <div
            key={topic.name}
            className="p-5 rounded-3xl bg-[#090e24]/90 border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xl group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {topic.category}
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {topic.momentum}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors mb-2">
                {topic.name}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                {topic.description}
              </p>

              {/* 3 Metric Pills: Papers, Patents, News */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">arXiv Papers</span>
                  <span className="text-xs font-bold text-purple-300 font-mono mt-0.5 block">{topic.papersCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Patents</span>
                  <span className="text-xs font-bold text-amber-300 font-mono mt-0.5 block">{topic.patentsCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">News Vol</span>
                  <span className="text-xs font-bold text-blue-300 font-mono mt-0.5 block">{topic.newsCount}</span>
                </div>
              </div>

              {/* Key Competitors */}
              <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
                <span className="text-slate-400 font-medium mr-1">Key Targets:</span>
                {topic.keyCompetitors.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-200 text-[10px] font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Launch Mission CTA on Topic */}
            <button
              onClick={() => onNewInvestigationWithTopic(topic.name, topic.keyCompetitors[0])}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all group-hover:bg-blue-600 group-hover:text-white"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Reconnaissance on Topic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
