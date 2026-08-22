import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { Alert } from '../types';
import { api } from '../api';

interface AlertsPageProps {
  onSelectInvestigation: (id: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  onSelectInvestigation,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleMarkRead = async (id: string) => {
    await api.markAlertAsRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = async () => {
    for (const a of alerts) {
      if (!a.read) {
        await api.markAlertAsRead(a.id);
      }
    }
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const filtered = alerts.filter(a => filterSeverity === 'All' || a.severity.toLowerCase() === filterSeverity.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight flex items-center gap-2.5 font-editorial">
            <Bell className="w-5 h-5 text-[#c5a059]" />
            <span>Strategic Threat & Intelligence Alerts</span>
          </h2>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">
            Autonomous threat triggers across arXiv research, patents, and live market signals.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-white/[0.03] border border-white/10 text-white/70 hover:text-white text-xs font-mono uppercase tracking-wider transition-all self-start sm:self-auto"
        >
          <Check className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Acknowledge All</span>
        </button>
      </div>

      {/* Severity Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all border ${
              filterSeverity === sev
                ? 'bg-[#c5a059]/10 border-[#c5a059] text-[#c5a059]'
                : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'
            }`}
          >
            {sev} Severity
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const sevColor = alert.severity === 'CRITICAL' ? 'bg-[#e05353]/10 text-[#e05353] border-[#e05353]/30' : alert.severity === 'HIGH' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-white/[0.03] text-white/70 border-white/10';

          return (
            <div
              key={alert.id}
              onClick={() => alert.investigationId && onSelectInvestigation(alert.investigationId)}
              className={`p-5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 group ${
                alert.read
                  ? 'bg-white/[0.01] border-white/5 opacity-60'
                  : 'bg-[#0d0d0f] border-white/5 hover:border-[#c5a059]/30 shadow-xl'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase border ${sevColor}`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs font-light text-white px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 font-editorial">
                    {alert.competitor}
                  </span>
                  <span className="text-[11px] text-white/30 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-[#c5a059]" />
                    {alert.timeAgo}
                  </span>
                </div>

                <h3 className="text-sm font-light text-white group-hover:text-[#c5a059] transition-colors font-editorial">
                  {alert.title}
                </h3>

                <p className="text-xs text-white/50 font-light leading-relaxed max-w-4xl">
                  {alert.description}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                {!alert.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(alert.id);
                    }}
                    className="text-[10px] uppercase font-mono tracking-wider text-white/40 hover:text-white px-3 py-1.5 rounded bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
                  >
                    Dismiss
                  </button>
                )}

                {alert.investigationId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectInvestigation(alert.investigationId!);
                    }}
                    className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider text-black px-3 py-1.5 rounded bg-[#c5a059] hover:bg-[#d6b26b] transition-all"
                  >
                    <span>View Mission</span>
                    <ExternalLink className="w-3 h-3 text-black" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
