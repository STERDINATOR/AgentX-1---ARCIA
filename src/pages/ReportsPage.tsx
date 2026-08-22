import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  Shield,
  Calendar,
  Sparkles
} from 'lucide-react';
import { IntelligenceReport } from '../types';
import { api } from '../api';

interface ReportsPageProps {
  onSelectReport: (id: string) => void;
  onNewInvestigation: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  onSelectReport,
  onNewInvestigation,
}) => {
  const [reports, setReports] = useState<IntelligenceReport[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getReports();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = reports.filter(r =>
    r.competitor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight font-editorial">Intelligence Dossier Archive</h2>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">
            Comprehensive threat scoring, strategic moats, and grounded factual syntheses.
          </p>
        </div>

        <button
          onClick={onNewInvestigation}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider shadow-sm shadow-[#c5a059]/20 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>Synthesize New Dossier</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search dossiers by competitor, topic or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded bg-white/[0.02] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c5a059]"
        />
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map(report => (
          <div
            key={report.id}
            onClick={() => onSelectReport(report.id)}
            className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#c5a059]/40 transition-all cursor-pointer group flex flex-col justify-between shadow-xl"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[9px] font-mono font-medium text-[#c5a059] px-2 py-0.5 rounded bg-[#c5a059]/10 border border-[#c5a059]/30 uppercase">
                    {report.id}
                  </span>
                  <h3 className="text-base font-light text-white group-hover:text-[#c5a059] transition-colors mt-2 font-editorial">
                    {report.competitor} <span className="text-white/20 font-normal">/</span> {report.topic}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded text-xs font-light font-mono bg-[#e05353]/10 text-[#e05353] border border-[#e05353]/30">
                    {report.threatScore}/100
                  </span>
                  <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wider mt-1">{report.threatLevel}</div>
                </div>
              </div>

              <p className="text-xs text-white/50 font-light line-clamp-3 leading-relaxed mb-4">
                {report.executiveSummary}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">arXiv</span>
                  <span className="text-xs font-mono font-light text-[#dfba73]">{report.subScores.researchActivity.score}%</span>
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">Patents</span>
                  <span className="text-xs font-mono font-light text-[#c5a059]">{report.subScores.patentActivity.score}%</span>
                </div>
                <div className="p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[9px] text-white/30 block uppercase tracking-wider">Signals</span>
                  <span className="text-xs font-mono font-light text-white/70">{report.subScores.newsActivity.score}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
              <span className="font-mono text-[10px] text-white/30">{report.sourceStats.total} Verified Sources</span>
              <span className="text-[#c5a059] font-medium uppercase text-[10px] tracking-wider flex items-center gap-1 group-hover:text-white transition-colors">
                <span>Examine Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
