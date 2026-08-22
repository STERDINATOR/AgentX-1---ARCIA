import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Radio,
  FileText
} from 'lucide-react';
import { Investigation } from '../types';
import { api } from '../api';

interface InvestigationsPageProps {
  onSelectInvestigation: (id: string) => void;
  onNewInvestigation: () => void;
}

export const InvestigationsPage: React.FC<InvestigationsPageProps> = ({
  onSelectInvestigation,
  onNewInvestigation,
}) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getInvestigations();
        setInvestigations(data);
      } catch (err) {
        console.error('Failed to load investigations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = investigations.filter(inv => {
    const matchesSearch = inv.competitor.toLowerCase().includes(searchQuery.toLowerCase()) || inv.topic.toLowerCase().includes(searchQuery.toLowerCase()) || inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Autonomous Agent Investigations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active and archived multi-vector research missions orchestrated by ARCIA ReAct agents.
          </p>
        </div>

        <button
          onClick={onNewInvestigation}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search investigation by ID, target or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Running', 'Completed', 'Queued'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                statusFilter === status
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-3xl bg-[#090e24]/90 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Investigation</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">ReAct Iterations</th>
                <th className="px-6 py-4">Evidence Gathered</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((inv) => {
                const isRunning = inv.status === 'running';
                const isComplete = inv.status === 'completed';

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvestigation(inv.id)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] text-blue-400 mb-0.5">{inv.id}</div>
                      <div className="font-bold text-white group-hover:text-blue-300 transition-colors text-sm">
                        {inv.competitor}
                      </div>
                      <div className="text-slate-400 line-clamp-1 max-w-sm">{inv.topic}</div>
                    </td>

                    <td className="px-6 py-4">
                      {isRunning ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                          RUNNING
                        </span>
                      ) : isComplete ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          COMPLETED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                          {inv.status.toUpperCase()}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-slate-300">
                      Step {inv.steps.length} / 8
                    </td>

                    <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                      {inv.evidence.length} Sources
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.priority === 'Critical'
                          ? 'bg-red-500/20 text-red-300'
                          : inv.priority === 'High'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {inv.priority}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvestigation(inv.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white font-semibold text-xs transition-all"
                      >
                        {isComplete ? <span>View Report</span> : <span>Live HUD</span>}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
