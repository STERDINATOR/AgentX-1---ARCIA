import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  Zap,
  RefreshCw,
  AlertTriangle,
  ArrowDownUp,
  Server,
  Timer,
  ShieldAlert,
  CircleDot,
  Radio,
  ChevronDown,
  ChevronRight,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────
// Types — mirror the shape produced by server/observability.ts
// ─────────────────────────────────────────────────────────────────────────

interface TraceSpan {
  name: string;
  traceId: string;
  investigationId?: string;
  durationMs: number;
  status: 'ok' | 'error';
  attributes: Record<string, unknown>;
  timestamp: string;
}

interface ParsedMetric {
  name: string;
  help: string;
  type: string;
  samples: { labels: string; value: number }[];
}

// ─────────────────────────────────────────────────────────────────────────
// Prometheus text format parser — small and dependency-free. Parses the
// exact output of server/observability.ts::renderMetricsText().
// ─────────────────────────────────────────────────────────────────────────

function parsePrometheusText(raw: string): ParsedMetric[] {
  const lines = raw.split('\n');
  const byName = new Map<string, ParsedMetric>();
  let currentHelp: Record<string, string> = {};
  let currentType: Record<string, string> = {};

  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith('# HELP ')) {
      const [, name, ...rest] = line.split(' ');
      currentHelp[name] = rest.join(' ');
      continue;
    }
    if (line.startsWith('# TYPE ')) {
      const [, name, type] = line.split(' ');
      currentType[name] = type;
      continue;
    }
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?([^}]*)\}?\s+([0-9.eE+-]+)\s*$/);
    if (!match) continue;
    const [, name, labels, value] = match;
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        help: currentHelp[name] ?? '',
        type: currentType[name] ?? 'untyped',
        samples: [],
      });
    }
    byName.get(name)!.samples.push({ labels, value: parseFloat(value) });
  }

  return Array.from(byName.values());
}

function sumSamples(metric?: ParsedMetric): number {
  if (!metric) return 0;
  return metric.samples.reduce((acc, s) => acc + s.value, 0);
}

function findMetric(metrics: ParsedMetric[], name: string): ParsedMetric | undefined {
  return metrics.find(m => m.name === name);
}

// ─────────────────────────────────────────────────────────────────────────
// Small presentational primitives, matching the CommandCenter card style
// ─────────────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: string;
}> = ({ label, value, sublabel, icon, accent = '#c5a059' }) => (
  <div
    className="p-4 rounded-lg bg-[#0d0d0f] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden"
    style={{ borderColor: undefined }}
  >
    <div className="flex items-center justify-between text-[11px] text-white/50 mb-2">
      <span className="uppercase tracking-wider text-[10px] font-medium">{label}</span>
      <div className="p-1 rounded" style={{ backgroundColor: `${accent}1a`, color: accent }}>
        {icon}
      </div>
    </div>
    <div className="flex items-baseline gap-2 mb-1">
      <span className="text-2xl font-light text-white font-mono">{value}</span>
    </div>
    {sublabel && <p className="text-[10px] text-white/40 font-light">{sublabel}</p>}
  </div>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({
  title,
  subtitle,
  right,
}) => (
  <div className="flex items-center justify-between mb-3">
    <div>
      <h3 className="text-xs uppercase tracking-wider text-white/70 font-medium">{title}</h3>
      {subtitle && <p className="text-[10px] text-white/35 mt-0.5">{subtitle}</p>}
    </div>
    {right}
  </div>
);

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000;

export const ObservabilityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ParsedMetric[]>([]);
  const [spans, setSpans] = useState<TraceSpan[]>([]);
  const [expandedSpan, setExpandedSpan] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'error'>('all');
  const [connected, setConnected] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, tracesRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/traces'),
      ]);
      if (!metricsRes.ok || !tracesRes.ok) throw new Error('non-200 response');

      const metricsText = await metricsRes.text();
      const tracesJson = (await tracesRes.json()) as TraceSpan[];

      setMetrics(parsePrometheusText(metricsText));
      setSpans(tracesJson);
      setConnected(true);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Observability fetch failed:', err);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, autoRefresh]);

  // ── Derived stats ──────────────────────────────────────────────────────

  const investigationsStarted = sumSamples(findMetric(metrics, 'arcia_investigations_started_total'));
  const geminiCalls = findMetric(metrics, 'arcia_gemini_calls_total');
  const geminiErrors = geminiCalls?.samples.filter(s => s.labels.includes('outcome="error"')).reduce((a, s) => a + s.value, 0) ?? 0;
  const geminiTotal = sumSamples(geminiCalls);
  const geminiErrorRate = geminiTotal > 0 ? ((geminiErrors / geminiTotal) * 100).toFixed(1) : '0.0';

  const modelFallbacks = sumSamples(findMetric(metrics, 'arcia_gemini_model_fallback_total'));
  const toolShed = sumSamples(findMetric(metrics, 'arcia_gemini_tool_shed_total'));
  const heuristicDecisions = sumSamples(findMetric(metrics, 'arcia_heuristic_decisions_total'));
  const toolDegradations = sumSamples(findMetric(metrics, 'arcia_tool_degradations_total'));
  const supabaseFailures = sumSamples(findMetric(metrics, 'arcia_supabase_write_failures_total'));

  const filteredSpans = spans.filter(s => statusFilter === 'all' || s.status === statusFilter);
  const errorSpanCount = spans.filter(s => s.status === 'error').length;
  const avgSpanDuration = spans.length
    ? Math.round(spans.reduce((a, s) => a + s.durationMs, 0) / spans.length)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-light text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#c5a059]" />
            Observability
          </h1>
          <p className="text-[11px] text-white/40 mt-0.5">
            Live metrics and trace spans from the agent runtime
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
            <CircleDot
              className={`w-3 h-3 ${connected ? 'text-emerald-400' : 'text-[#e05353]'}`}
              fill="currentColor"
            />
            <span className={connected ? 'text-emerald-400' : 'text-[#e05353]'}>
              {connected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          {lastFetched && (
            <span className="text-[10px] text-white/30 font-mono">
              updated {relativeTime(lastFetched.toISOString())}
            </span>
          )}
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`p-1.5 rounded border transition-colors ${
              autoRefresh
                ? 'border-[#c5a059]/40 text-[#c5a059] bg-[#c5a059]/10'
                : 'border-white/10 text-white/40'
            }`}
            title={autoRefresh ? 'Auto-refresh on (5s)' : 'Auto-refresh off'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top-line stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Investigations Started"
          value={investigationsStarted}
          sublabel="Since process start"
          icon={<Radio className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Gemini Error Rate"
          value={`${geminiErrorRate}%`}
          sublabel={`${geminiErrors}/${geminiTotal} calls failed`}
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          accent={parseFloat(geminiErrorRate) > 10 ? '#e05353' : '#c5a059'}
        />
        <StatCard
          label="Model Fallbacks"
          value={modelFallbacks}
          sublabel="Primary → flash-lite"
          icon={<ArrowDownUp className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Heuristic Decisions"
          value={heuristicDecisions}
          sublabel="Zero-LLM fallback used"
          icon={<Zap className="w-3.5 h-3.5" />}
          accent={heuristicDecisions > 0 ? '#e0a353' : '#c5a059'}
        />
        <StatCard
          label="Tool Degradations"
          value={toolDegradations}
          sublabel={`${supabaseFailures} DB write failures`}
          icon={<ShieldAlert className="w-3.5 h-3.5" />}
        />
      </div>

      {/* Span latency + tool shed summary row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <StatCard
          label="Avg Span Duration"
          value={`${avgSpanDuration}ms`}
          sublabel={`${spans.length} spans in buffer`}
          icon={<Timer className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Grounding Tool Shed"
          value={toolShed}
          sublabel="429 on search grounding → dropped"
          icon={<Server className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Errored Spans"
          value={errorSpanCount}
          sublabel={`of ${spans.length} total`}
          icon={<XCircle className="w-3.5 h-3.5" />}
          accent={errorSpanCount > 0 ? '#e05353' : '#c5a059'}
        />
      </div>

      {/* Trace span list */}
      <div className="rounded-lg bg-[#0d0d0f] border border-white/5 p-4">
        <SectionHeader
          title="Recent Trace Spans"
          subtitle="Newest first · from the in-memory ring buffer"
          right={
            <div className="flex gap-1">
              {(['all', 'ok', 'error'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-colors ${
                    statusFilter === f
                      ? 'bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30'
                      : 'text-white/40 border border-white/5 hover:border-white/15'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />

        <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
          {filteredSpans.length === 0 && (
            <p className="text-[11px] text-white/30 py-8 text-center">
              No spans yet — run an investigation to populate this view.
            </p>
          )}
          {filteredSpans.map((span, i) => {
            const key = `${span.traceId}-${span.name}-${i}`;
            const isOpen = expandedSpan === key;
            return (
              <div
                key={key}
                className="rounded border border-white/5 hover:border-white/10 transition-colors overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSpan(isOpen ? null : key)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left"
                >
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-white/30 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-white/30 shrink-0" />
                  )}
                  {span.status === 'ok' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#e05353] shrink-0" />
                  )}
                  <span className="font-mono text-[11px] text-white/80 truncate flex-1">
                    {span.name}
                  </span>
                  {span.investigationId && (
                    <span className="text-[10px] text-white/30 font-mono hidden sm:inline">
                      {span.investigationId}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-mono tabular-nums ${
                      span.durationMs > 5000 ? 'text-[#e0a353]' : 'text-white/40'
                    }`}
                  >
                    {span.durationMs}ms
                  </span>
                  <span className="text-[10px] text-white/25 w-14 text-right shrink-0">
                    {relativeTime(span.timestamp)}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-9 pb-3 pt-1 border-t border-white/5 bg-white/[0.02]">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
                      <div className="text-white/30">trace ID</div>
                      <div className="text-white/60 font-mono truncate">{span.traceId}</div>
                      {Object.entries(span.attributes).map(([k, v]) => (
                        <React.Fragment key={k}>
                          <div className="text-white/30">{k}</div>
                          <div className="text-white/60 font-mono truncate">{String(v)}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw metric families (collapsed-by-default power-user view) */}
      <div className="rounded-lg bg-[#0d0d0f] border border-white/5 p-4">
        <SectionHeader title="Metric Families" subtitle="Raw counters/histograms from /api/metrics" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {metrics.map(m => (
            <div key={m.name} className="rounded border border-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-white/70 truncate">{m.name}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/30 shrink-0 ml-2">
                  {m.type}
                </span>
              </div>
              <p className="text-[10px] text-white/35 mt-0.5">{m.help}</p>
              <p className="text-[10px] text-[#c5a059] font-mono mt-1">
                total: {sumSamples(m).toLocaleString()}
              </p>
            </div>
          ))}
          {metrics.length === 0 && (
            <p className="text-[11px] text-white/30 py-6 text-center sm:col-span-2">
              No metrics reported yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObservabilityDashboard;