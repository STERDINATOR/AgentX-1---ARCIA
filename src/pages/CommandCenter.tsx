import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  TrendingUp,
  Globe,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Search,
  Bell,
  Cpu,
  Clock
} from 'lucide-react';
import { DashboardStats, Competitor, Alert, EmergingTrendItem } from '../types';
import { api } from '../api';
import { ThreatGauge } from '../components/ThreatGauge';
import { ActivitySparkline } from '../components/ActivitySparkline';

interface CommandCenterProps {
  onNewInvestigation: () => void;
  onSelectCompetitor: (name: string) => void;
  onSelectInvestigation: (id: string) => void;
  onSelectReport: (id: string) => void;
  onViewAllAlerts: () => void;
  onViewAllTrends: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNewInvestigation,
  onSelectCompetitor,
  onSelectInvestigation,
  onSelectReport,
  onViewAllAlerts,
  onViewAllTrends,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trends, setTrends] = useState<EmergingTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, compData, alertsData, trendsData] = await Promise.all([
          api.getStats(),
          api.getCompetitors(),
          api.getAlerts(),
          api.getTrends(),
        ]);
        setStats(statsData);
        setCompetitors(compData);
        setAlerts(alertsData);
        setTrends(trendsData);
      } catch (err) {
        console.error('Failed to load CommandCenter data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMarkAlertRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.markAlertAsRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#c5a059] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-white/40 tracking-wider uppercase">Calibrating Command Center Feeds...</p>
        </div>
      </div>
    );
  }

  // 7-day multi-line mock activity data for chart
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 5 Top High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Active Investigations */}
        <div 
          onClick={onNewInvestigation}
          className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#c5a059]/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
            <span className="uppercase tracking-wider text-[10px] font-medium">Investigations</span>
            <div className="p-1 rounded bg-[#c5a059]/10 text-[#c5a059] group-hover:bg-[#c5a059]/20 transition-colors">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-light text-white font-mono">{stats?.activeInvestigations || 12}</span>
            <span className="text-[10px] text-emerald-400 font-mono">+3 active</span>
          </div>
          <p className="text-[10px] text-white/40 font-light">Autonomous fleet live</p>
        </div>

        {/* Card 2: Critical Alerts */}
        <div 
          onClick={onViewAllAlerts}
          className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#e05353]/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
            <span className="uppercase tracking-wider text-[10px] font-medium">Critical Alerts</span>
            <div className="p-1 rounded bg-[#e05353]/10 text-[#e05353] group-hover:bg-[#e05353]/20 transition-colors">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-light text-[#e05353] font-mono">{stats?.criticalAlerts || 7}</span>
            <span className="text-[10px] text-[#e05353] font-mono tracking-wider">URGENT</span>
          </div>
          <p className="text-[10px] text-white/40 font-light">Strategic evaluation queued</p>
        </div>

        {/* Card 3: Monitored Competitors */}
        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#c5a059]/40 transition-all">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
            <span className="uppercase tracking-wider text-[10px] font-medium">Monitored Targets</span>
            <div className="p-1 rounded bg-white/[0.04] text-white/70">
              <Building2 className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-light text-white font-mono">{competitors.length || 6}</span>
            <span className="text-[10px] text-white/40 font-mono">Frontier Tier</span>
          </div>
          <p className="text-[10px] text-white/40 font-light">NVIDIA, OpenAI, Google, Meta...</p>
        </div>

        {/* Card 4: Emerging Trends */}
        <div 
          onClick={onViewAllTrends}
          className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#c5a059]/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
            <span className="uppercase tracking-wider text-[10px] font-medium">Vector Trends</span>
            <div className="p-1 rounded bg-[#c5a059]/10 text-[#c5a059] group-hover:bg-[#c5a059]/20 transition-colors">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-light text-white font-mono">{trends.length || 24}</span>
            <span className="text-[10px] text-[#c5a059] font-mono">+8 inflection</span>
          </div>
          <p className="text-[10px] text-white/40 font-light">Silicon, patents & weights</p>
        </div>

        {/* Card 5: Grounded Sources Monitored */}
        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-[#c5a059]/40 transition-all">
          <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
            <span className="uppercase tracking-wider text-[10px] font-medium">Corpus Feeds</span>
            <div className="p-1 rounded bg-white/[0.04] text-white/70">
              <Globe className="w-3.5 h-3.5 text-[#c5a059]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-light text-white font-mono">6,420+</span>
            <span className="text-[10px] text-emerald-400 font-mono">Ground Truth</span>
          </div>
          <p className="text-[10px] text-white/40 font-light">arXiv, USPTO, WIPO, SEC</p>
        </div>
      </div>

      {/* Main Command Center Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Multi-Day Activity Intelligence Chart */}
          <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
                  <Activity className="w-4 h-4 text-[#c5a059]" />
                  <span>Competitive Signal Velocity (7-Day Telemetry)</span>
                </h3>
                <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5 font-medium">Aggregated multi-vector signal volume across monitored frontier labs</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-white/70 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#c5a059]"></span>
                  News
                </span>
                <span className="flex items-center gap-1.5 text-white/70 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#dfba73]"></span>
                  arXiv
                </span>
                <span className="flex items-center gap-1.5 text-white/70 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#94a3b8]"></span>
                  Patents
                </span>
                <span className="flex items-center gap-1.5 text-white/70 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  Social
                </span>
              </div>
            </div>

            {/* SVG Chart visualization */}
            <div className="h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="20" x2="700" y2="20" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="60" x2="700" y2="60" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="100" x2="700" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {/* News Line (Gold) */}
                <path
                  d="M 20,95 Q 120,80 230,65 T 450,45 T 570,30 T 680,18"
                  fill="none"
                  stroke="#c5a059"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Research Line (Amber Gold) */}
                <path
                  d="M 20,120 Q 120,105 230,110 T 450,85 T 570,70 T 680,45"
                  fill="none"
                  stroke="#dfba73"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Patents Line (Platinum) */}
                <path
                  d="M 20,135 Q 120,128 230,122 T 450,110 T 570,95 T 680,75"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                {/* Buzz Line (Emerald) */}
                <path
                  d="M 20,85 Q 120,72 230,60 T 450,48 T 570,35 T 680,15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-white/30 font-mono mt-2 px-2 uppercase">
                {days.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Top Monitored Competitors list with sparklines */}
          <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
                  <Building2 className="w-4 h-4 text-[#c5a059]" />
                  <span>Monitored Competitors & Threat Profiles</span>
                </h3>
                <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">Real-time threat scores calculated from multi-vector intelligence</p>
              </div>

              <button
                onClick={onNewInvestigation}
                className="flex items-center gap-1.5 text-xs text-[#c5a059] hover:text-white uppercase tracking-wider font-semibold transition-colors"
              >
                <span>Launch Agent</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {competitors.map((comp) => {
                const threatColor = comp.threatScore >= 80 ? 'text-[#e05353] bg-[#e05353]/10 border-[#e05353]/30' : comp.threatScore >= 60 ? 'text-[#c5a059] bg-[#c5a059]/10 border-[#c5a059]/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                return (
                  <div
                    key={comp.name}
                    onClick={() => onSelectCompetitor(comp.name)}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/40 hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-white/[0.03] border border-white/10 flex items-center justify-center font-bold text-xs text-[#c5a059] font-mono">
                          {comp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-normal text-white group-hover:text-[#c5a059] transition-colors">
                            {comp.name}
                          </h4>
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">{comp.sector}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-light font-mono border ${threatColor}`}>
                          {comp.threatScore} / 100
                        </span>
                        <div className="text-[9px] text-white/40 uppercase font-semibold tracking-wider mt-0.5">{comp.threatLevel}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-wider">
                        <span>{comp.activeInvestigations} active</span>
                        <span>•</span>
                        <span>{comp.recentAlerts} signals</span>
                      </div>
                      <ActivitySparkline data={comp.activityTrend} color="#c5a059" height={22} width={70} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Executive Intelligence Summary Banner */}
          <div className="p-5 rounded-lg bg-[#0d0d0f] border border-[#c5a059]/30 flex items-start gap-4">
            <div className="p-2 rounded bg-[#c5a059]/10 text-[#c5a059] flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white uppercase tracking-widest font-editorial">Executive Strategic Briefing</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 uppercase tracking-widest">Synthesized Ground Truth</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed font-light">
                Autonomous reconnaissance indicates rapid compounding velocity in next-generation inference architectures and test-time compute scaling. NVIDIA and OpenAI continue aggressive defensive patent filings around speculative decoding pipelines. R&D moat expansion strongly recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Threat Level Assessment Radial Gauge Card */}
          <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/90 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Sector Pressure Gauge</span>
              </h3>
              <span className="text-[10px] text-white/30 font-mono uppercase">Live Synthesis</span>
            </div>

            <ThreatGauge score={91} level="CRITICAL" confidence={91} size="lg" />

            <div className="pt-4 border-t border-white/5 text-xs text-white/50 text-left space-y-2 font-light">
              <div className="flex justify-between">
                <span>Primary Sector Vector:</span>
                <span className="font-normal text-white">AI Silicon & Accelerators</span>
              </div>
              <div className="flex justify-between">
                <span>Top Catalyst Driver:</span>
                <span className="font-normal text-[#e05353]">NVIDIA B200 / Rubin</span>
              </div>
              <div className="flex justify-between">
                <span>Intel Directive:</span>
                <span className="font-normal text-[#c5a059]">Scale Open Weight Inference</span>
              </div>
            </div>
          </div>

          {/* Critical Alerts Feed */}
          <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Critical Strategic Alerts</span>
              </h3>
              <button
                onClick={onViewAllAlerts}
                className="text-[11px] text-[#c5a059] hover:text-white uppercase tracking-wider font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => alert.investigationId && onSelectInvestigation(alert.investigationId)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer group ${
                    alert.read
                      ? 'bg-white/[0.01] border-white/5 opacity-60'
                      : 'bg-white/[0.02] border-white/5 hover:border-[#c5a059]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider bg-[#e05353]/10 text-[#e05353] border border-[#e05353]/30">
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5 text-white/30" />
                      {alert.timeAgo}
                    </span>
                  </div>

                  <h4 className="text-xs font-normal text-white group-hover:text-[#c5a059] transition-colors line-clamp-1">
                    {alert.title}
                  </h4>

                  <p className="text-[11px] text-white/40 font-light line-clamp-2 mt-1 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5 text-[10px]">
                    <span className="font-medium text-white/60">{alert.competitor}</span>
                    {!alert.read && (
                      <button
                        onClick={(e) => handleMarkAlertRead(alert.id, e)}
                        className="text-white/30 hover:text-white uppercase tracking-wider text-[9px]"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging Trends Widget */}
          <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Emerging Frontiers</span>
              </h3>
              <button
                onClick={onViewAllTrends}
                className="text-[11px] text-[#c5a059] hover:text-white uppercase tracking-wider font-semibold"
              >
                Explore
              </button>
            </div>

            <div className="space-y-3">
              {trends.slice(0, 4).map((trend) => (
                <div
                  key={trend.id}
                  className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-normal text-white">{trend.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-mono font-medium bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/20 uppercase">
                      {trend.signalStrength}% Signal
                    </span>
                  </div>

                  <p className="text-[11px] text-white/40 font-light line-clamp-2 leading-relaxed mb-2">
                    {trend.description}
                  </p>

                  {/* Signal Strength Progress Bar */}
                  <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#c5a059] to-[#dfba73] h-full rounded-full"
                      style={{ width: `${trend.signalStrength}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
