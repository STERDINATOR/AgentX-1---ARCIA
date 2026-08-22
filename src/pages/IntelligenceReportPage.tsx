import React, { useEffect, useState } from 'react';
import {
  FileText,
  Shield,
  Download,
  Share2,
  Printer,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Globe,
  FileCode,
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';
import { IntelligenceReport } from '../types';
import { api } from '../api';
import { ThreatGauge } from '../components/ThreatGauge';

interface IntelligenceReportPageProps {
  reportId?: string;
  onBack: () => void;
}

export const IntelligenceReportPage: React.FC<IntelligenceReportPageProps> = ({
  reportId,
  onBack,
}) => {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReport() {
      try {
        if (reportId) {
          const data = await api.getReport(reportId);
          setReport(data);
        } else {
          // Fallback to first available report
          const reports = await api.getReports();
          if (reports.length > 0) {
            setReport(reports[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading Grounded Intelligence Report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Intelligence Report Not Found</h3>
        <p className="text-xs text-slate-400 mb-4">The requested intelligence synthesis could not be retrieved.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Command Center</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/[0.03] border border-white/10 text-white/70 hover:text-white text-xs font-mono uppercase tracking-wider transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `${report.id}-intelligence-report.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export Dossier (JSON)</span>
          </button>
        </div>
      </div>

      {/* Main Intelligence Report Header */}
      <div className="relative overflow-hidden rounded-lg bg-[#0d0d0f] border border-white/5 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 uppercase">
                {report.id}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium text-white/70 bg-white/[0.04] border border-white/10 uppercase">
                Target: {report.competitor}
              </span>
              <span className="text-[11px] text-white/40 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
                {report.investigationPeriod}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight leading-tight font-editorial">
              {report.competitor} <span className="text-[#c5a059]">{report.topic}</span>
            </h1>

            <p className="text-xs text-white/60 leading-relaxed font-light">
              <strong className="text-white/90 uppercase font-mono text-[10px] tracking-wider">Mission Objective:</strong> {report.objective}
            </p>
          </div>

          {/* Radial Threat Gauge Display */}
          <div className="p-4 rounded bg-white/[0.02] border border-white/5 shadow-xl flex flex-col items-center justify-center min-w-[220px]">
            <ThreatGauge score={report.threatScore} level={report.threatLevel} confidence={report.confidence} size="md" />
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="p-5 rounded bg-white/[0.02] border border-[#c5a059]/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
              <h3 className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#c5a059]">Executive Intelligence Summary</h3>
            </div>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
              {report.executiveSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Scores 5-Pillar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5">
          <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">arXiv Activity</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-light text-white font-mono">{report.subScores.researchActivity.score}%</span>
            <span className="text-[9px] font-mono text-[#dfba73] uppercase">{report.subScores.researchActivity.level}</span>
          </div>
          <p className="text-[10px] text-white/50 font-mono">{report.subScores.researchActivity.change}</p>
        </div>

        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5">
          <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">Patent Claims</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-light text-white font-mono">{report.subScores.patentActivity.score}%</span>
            <span className="text-[9px] font-mono text-[#c5a059] uppercase">{report.subScores.patentActivity.level}</span>
          </div>
          <p className="text-[10px] text-white/50 font-mono">{report.subScores.patentActivity.change}</p>
        </div>

        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5">
          <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">Market News</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-light text-white font-mono">{report.subScores.newsActivity.score}%</span>
            <span className="text-[9px] font-mono text-white/70 uppercase">{report.subScores.newsActivity.level}</span>
          </div>
          <p className="text-[10px] text-white/50 font-mono">{report.subScores.newsActivity.change}</p>
        </div>

        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5">
          <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">Social Signals</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-light text-white font-mono">{report.subScores.socialBuzz.score}%</span>
            <span className="text-[9px] font-mono text-[#c5a059] uppercase">{report.subScores.socialBuzz.level}</span>
          </div>
          <p className="text-[10px] text-white/50 font-mono">{report.subScores.socialBuzz.change}</p>
        </div>

        <div className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5">
          <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider mb-1">Threat Impact</div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-light text-white font-mono">{report.subScores.marketImpact.score}%</span>
            <span className="text-[9px] font-mono text-[#e05353] uppercase">{report.subScores.marketImpact.level}</span>
          </div>
          <p className="text-[10px] text-white/50 font-mono">{report.subScores.marketImpact.change}</p>
        </div>
      </div>

      {/* Key Developments Feed */}
      <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
              <Layers className="w-4 h-4 text-[#c5a059]" />
              <span>Key Intelligence Developments</span>
            </h3>
            <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">Verified factual events uncovered during autonomous reconnaissance</p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-white/60 font-mono">
            {report.keyDevelopments.length} Key Signals
          </span>
        </div>

        <div className="space-y-3">
          {report.keyDevelopments.map((item, idx) => {
            const typeBg = item.type === 'News' ? 'bg-white/[0.04] text-white/80 border-white/10' : item.type === 'Research' ? 'bg-[#dfba73]/10 text-[#dfba73] border-[#dfba73]/30' : 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30';
            const impactBg = item.impact === 'High' ? 'bg-[#e05353]/10 text-[#e05353] border-[#e05353]/30' : item.impact === 'Medium' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-white/[0.03] text-white/50 border-white/5';

            return (
              <div
                key={item.id || idx}
                className="p-4 rounded bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase border ${typeBg}`}>
                      {item.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-medium uppercase border ${impactBg}`}>
                      Impact: {item.impact}
                    </span>
                    <span className="text-[10px] text-white/30 font-mono">{item.date}</span>
                  </div>

                  <h4 className="text-sm font-light text-white group-hover:text-[#c5a059] transition-colors font-editorial">
                    {item.title}
                  </h4>

                  <p className="text-xs text-white/50 font-light leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-mono text-[#c5a059] hover:text-white px-3 py-1.5 rounded bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all self-start"
                  >
                    <span>Inspect Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Emerging AI Trends Section */}
      <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
              <TrendingUp className="w-4 h-4 text-[#c5a059]" />
              <span>Emerging Technological Trends & Architectural Trajectory</span>
            </h3>
            <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">Identified strategic shifts that could disrupt market dynamics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.emergingTrends.map((trend, idx) => (
            <div
              key={trend.id || idx}
              className="p-4 rounded bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-light text-white font-editorial">{trend.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30">
                      {trend.direction}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded font-mono uppercase bg-[#e05353]/10 text-[#e05353] border border-[#e05353]/30">
                      {trend.impact}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-white/50 font-light leading-relaxed mb-3">
                  {trend.description}
                </p>

                {/* Signal Strength bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-white/40 mb-1 font-mono">
                    <span>Signal Strength ({trend.evidenceCount} sources)</span>
                    <span className="text-[#c5a059]">{trend.signalStrength}%</span>
                  </div>
                  <div className="w-full bg-white/[0.05] h-1 rounded overflow-hidden">
                    <div
                      className="bg-[#c5a059] h-full rounded"
                      style={{ width: `${trend.signalStrength}%` }}
                    />
                  </div>
                </div>
              </div>

              {trend.whyItMatters && (
                <div className="pt-2.5 border-t border-white/5 text-[11px] font-light">
                  <strong className="text-white/60 font-mono text-[10px] uppercase tracking-wider">Why It Matters: </strong>
                  <span className="text-white/40">{trend.whyItMatters}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Section: Competitive Impact + Actionable Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Impact Card */}
        <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
          <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
            <ShieldAlert className="w-4 h-4 text-[#e05353]" />
            <span>Competitive Impact Assessment</span>
          </h3>

          <p className="text-xs sm:text-sm text-white/60 font-light leading-relaxed">
            {report.competitiveImpact.summary}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded bg-white/[0.02] border border-white/5">
              <span className="text-[9px] text-white/30 uppercase tracking-wider block mb-0.5">Impact Severity Level</span>
              <span className="text-lg font-light text-[#e05353] font-mono">
                {report.competitiveImpact.impactLevel} / 10
              </span>
            </div>
            <div className="p-3 rounded bg-white/[0.02] border border-white/5">
              <span className="text-[9px] text-white/30 uppercase tracking-wider block mb-0.5">Strategic Moat Strength</span>
              <span className="text-xs font-light text-white truncate block font-editorial">
                {report.competitiveImpact.moatStrength}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-white/[0.02] border border-white/5 text-xs">
            <span className="text-white/40 uppercase font-mono text-[10px] block mb-1">Advantage Timeline Horizon:</span>
            <span className="font-light text-[#c5a059]">{report.competitiveImpact.timeline}</span>
          </div>

          {/* Evidence Gaps */}
          {report.evidenceGaps && report.evidenceGaps.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block mb-2">
                Identified Evidence Gaps
              </span>
              <ul className="space-y-1.5 text-xs text-white/40 font-light">
                {report.evidenceGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-[#c5a059] flex-shrink-0 mt-0.5" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actionable Strategic Recommendations Card */}
        <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
          <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
            <Zap className="w-4 h-4 text-[#c5a059]" />
            <span>Actionable Strategic Recommendations</span>
          </h3>

          <div className="space-y-3">
            {report.recommendedActions.map((action, idx) => {
              const pColor = action.priority === 'High' ? 'bg-[#e05353]/10 text-[#e05353] border-[#e05353]/30' : action.priority === 'Medium' ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30' : 'bg-white/[0.03] text-white/70 border-white/10';
              return (
                <div
                  key={action.id || idx}
                  className="p-3.5 rounded bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border ${pColor}`}>
                        {action.priority} Priority
                      </span>
                      <span className="text-[10px] text-white/40 font-mono">{action.category}</span>
                    </div>
                    <span className="text-[10px] text-white/30 font-mono">{action.timeline}</span>
                  </div>

                  <h4 className="text-xs font-light text-white mb-1 font-editorial">
                    {action.title}
                  </h4>

                  <p className="text-xs text-white/50 font-light leading-relaxed">
                    {action.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grounded Evidence Sources Breakdown Strip */}
      <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-light text-white flex items-center gap-2 font-editorial">
              <Globe className="w-4 h-4 text-[#c5a059]" />
              <span>Grounded Evidence Verification & Sources</span>
            </h3>
            <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5">
              Multi-vector source grounding distribution supporting this report
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded bg-white/[0.02] border border-white/5 text-white/60 font-mono text-[11px]">
              Total Grounded: <strong className="text-[#c5a059]">{report.sourceStats.total} Sources</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded bg-white/[0.04] text-[#c5a059]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-light text-white font-editorial">{report.sourceStats.newsCount} Web News Sources</span>
              <p className="text-[10px] text-white/40">Reuters, Bloomberg, Verge, TechCrunch</p>
            </div>
          </div>

          <div className="p-4 rounded bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded bg-white/[0.04] text-[#dfba73]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-light text-white font-editorial">{report.sourceStats.researchCount} Research Papers</span>
              <p className="text-[10px] text-white/40">arXiv.org, NeurIPS, IEEE, Nature</p>
            </div>
          </div>

          <div className="p-4 rounded bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded bg-white/[0.04] text-[#c5a059]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-light text-white font-editorial">{report.sourceStats.patentCount} Patent Filings</span>
              <p className="text-[10px] text-white/40">USPTO, Google Patents, WIPO</p>
            </div>
          </div>
        </div>

        {/* Top Reference Domains */}
        <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-white/40 font-mono text-[10px] uppercase tracking-wider">Top Grounded Domains:</span>
          {report.sourceStats.topDomains.map((dom, i) => (
            <a
              key={i}
              href={dom.url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded bg-white/[0.02] border border-white/5 text-[#c5a059] hover:text-white font-mono text-[10px] flex items-center gap-1 transition-colors"
            >
              <span>{dom.domain}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>

      {/* Final Assessment Footer Box */}
      <div className="p-6 rounded-lg bg-[#0d0d0f] border border-white/5 shadow-xl space-y-2">
        <h4 className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#c5a059] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>Final Autonomous Intelligence Assessment</span>
        </h4>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
          {report.finalAssessment}
        </p>
      </div>
    </div>
  );
};
