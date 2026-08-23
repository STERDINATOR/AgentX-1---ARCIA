/**
 * server/observability.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Structured logging + metrics + tracing for the ARCIA agent runtime.
 *
 * Zero new dependencies — built on Node's `async_hooks` (AsyncLocalStorage)
 * for correlation-id propagation and an in-memory metrics registry exposed
 * via a Prometheus-text-format endpoint. This is intentionally not wired
 * to Datadog/Honeycomb/OTel by default: the export layer at the bottom is
 * the single seam you'd swap if you outgrow this (see "Swapping the
 * export layer" at the bottom of this file).
 *
 * What this buys you that `console.log` doesn't:
 *   1. Every log line inside an investigation automatically carries
 *      investigationId + stepNumber + traceId, without threading them
 *      through every function signature — AsyncLocalStorage does the
 *      propagation.
 *   2. Every Gemini call, tool call, and agent step gets timed
 *      automatically via `startSpan`, with retry/fallback/degradation
 *      recorded as span attributes, not just log text — so you can
 *      answer "what fraction of investigations degrade to the
 *      heuristic fallback" from data, not by grepping logs.
 *   3. A single `/api/metrics` endpoint you can point Prometheus/Grafana
 *      at without adding either dependency to this codebase.
 *
 * Usage pattern (wrap, don't rewrite):
 *
 *   import { withInvestigationContext, startSpan, logger, metrics } from './observability';
 *
 *   await withInvestigationContext({ investigationId, stepNumber }, async () => {
 *     const span = startSpan('agent.decide');
 *     try {
 *       const decision = await decideNextAgentAction(...);
 *       span.end({ action: decision.action });
 *       return decision;
 *     } catch (err) {
 *       span.fail(err);
 *       throw err;
 *     }
 *   });
 * ─────────────────────────────────────────────────────────────────────────
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────
// 1. Correlation context — propagated implicitly across await boundaries
// ─────────────────────────────────────────────────────────────────────────

interface ObservabilityContext {
  traceId: string;
  investigationId?: string;
  stepNumber?: number;
  competitor?: string;
}

const contextStorage = new AsyncLocalStorage<ObservabilityContext>();

export function currentContext(): ObservabilityContext | undefined {
  return contextStorage.getStore();
}

/**
 * Runs `fn` with an observability context bound for its full async
 * lifetime (including everything it awaits). Nested calls merge into the
 * parent context rather than replacing it, so a tool call inside an agent
 * step inherits investigationId/stepNumber without re-specifying them.
 */
export async function withInvestigationContext<T>(
  ctx: Partial<ObservabilityContext>,
  fn: () => Promise<T>
): Promise<T> {
  const parent = contextStorage.getStore();
  const merged: ObservabilityContext = {
    traceId: parent?.traceId ?? randomUUID(),
    investigationId: ctx.investigationId ?? parent?.investigationId,
    stepNumber: ctx.stepNumber ?? parent?.stepNumber,
    competitor: ctx.competitor ?? parent?.competitor,
  };
  return contextStorage.run(merged, fn);
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Structured logger — JSON lines to stdout, one object per line, so
//    this composes with any log shipper (CloudWatch, Vector, Fluentbit)
//    without a dedicated agent. Falls back to pretty-printing in dev.
// ─────────────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';
const PRETTY = process.env.NODE_ENV !== 'production';

function emit(level: LogLevel, message: string, fields: Record<string, unknown> = {}) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) return;

  const ctx = currentContext();
  const record = {
    timestamp: new Date().toISOString(),
    level,
    message,
    traceId: ctx?.traceId,
    investigationId: ctx?.investigationId,
    stepNumber: ctx?.stepNumber,
    competitor: ctx?.competitor,
    ...fields,
  };

  if (PRETTY) {
    const tag = ctx?.investigationId ? `[${ctx.investigationId}${ctx.stepNumber != null ? `:step${ctx.stepNumber}` : ''}]` : '';
    const line = `${record.timestamp} ${level.toUpperCase().padEnd(5)} ${tag} ${message}`;
    const extra = Object.keys(fields).length ? JSON.stringify(fields) : '';
    (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line, extra);
  } else {
    process.stdout.write(JSON.stringify(record) + '\n');
  }
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => emit('debug', message, fields),
  info: (message: string, fields?: Record<string, unknown>) => emit('info', message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => emit('warn', message, fields),
  error: (message: string, fields?: Record<string, unknown>) => emit('error', message, fields),
};

// ─────────────────────────────────────────────────────────────────────────
// 3. Metrics registry — counters + histograms, in-memory, Prometheus-text
//    exposition. No dependency on prom-client; this covers the ~80% case
//    (counters and latency histograms) this project actually needs.
// ─────────────────────────────────────────────────────────────────────────

class Counter {
  private values = new Map<string, number>();
  constructor(private name: string, private help: string, private labelNames: string[] = []) {}

  inc(labels: Record<string, string> = {}, amount = 1) {
    const key = this.labelKey(labels);
    this.values.set(key, (this.values.get(key) ?? 0) + amount);
  }

  private labelKey(labels: Record<string, string>): string {
    return this.labelNames.map(n => `${n}="${labels[n] ?? ''}"`).join(',');
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const [labelKey, value] of this.values.entries()) {
      lines.push(`${this.name}{${labelKey}} ${value}`);
    }
    return lines.join('\n');
  }
}

class Histogram {
  // Fixed-bucket histogram — bucket boundaries chosen for LLM-call and
  // agent-step latencies (ms): sub-second, few-second, tens-of-seconds.
  private static BUCKETS = [100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000, Infinity];
  private buckets = new Map<string, number[]>(); // labelKey -> array parallel to BUCKETS, cumulative counts
  private sums = new Map<string, number>();
  private counts = new Map<string, number>();

  constructor(private name: string, private help: string, private labelNames: string[] = []) {}

  observe(valueMs: number, labels: Record<string, string> = {}) {
    const key = this.labelKey(labels);
    if (!this.buckets.has(key)) this.buckets.set(key, new Array(Histogram.BUCKETS.length).fill(0));
    const arr = this.buckets.get(key)!;
    for (let i = 0; i < Histogram.BUCKETS.length; i++) {
      if (valueMs <= Histogram.BUCKETS[i]) arr[i] += 1;
    }
    this.sums.set(key, (this.sums.get(key) ?? 0) + valueMs);
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1);
  }

  private labelKey(labels: Record<string, string>): string {
    return this.labelNames.map(n => `${n}="${labels[n] ?? ''}"`).join(',');
  }

  toPrometheus(): string {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [labelKey, arr] of this.buckets.entries()) {
      Histogram.BUCKETS.forEach((le, i) => {
        const bucketLabel = le === Infinity ? '+Inf' : String(le);
        lines.push(`${this.name}_bucket{${labelKey}${labelKey ? ',' : ''}le="${bucketLabel}"} ${arr[i]}`);
      });
      lines.push(`${this.name}_sum{${labelKey}} ${this.sums.get(labelKey) ?? 0}`);
      lines.push(`${this.name}_count{${labelKey}} ${this.counts.get(labelKey) ?? 0}`);
    }
    return lines.join('\n');
  }
}

const registry: Array<Counter | Histogram> = [];

function counter(name: string, help: string, labelNames: string[] = []): Counter {
  const c = new Counter(name, help, labelNames);
  registry.push(c);
  return c;
}
function histogram(name: string, help: string, labelNames: string[] = []): Histogram {
  const h = new Histogram(name, help, labelNames);
  registry.push(h);
  return h;
}

export const metrics = {
  // Agent loop
  investigationsStarted: counter('arcia_investigations_started_total', 'Investigations started'),
  investigationsCompleted: counter('arcia_investigations_completed_total', 'Investigations completed', ['status']),
  agentSteps: counter('arcia_agent_steps_total', 'Agent steps executed', ['action']),
  agentStepDuration: histogram('arcia_agent_step_duration_ms', 'Agent step duration', ['action']),

  // Gemini call layer — the metrics that make callGeminiSafe's resilience
  // strategies observable instead of just log-text.
  geminiCalls: counter('arcia_gemini_calls_total', 'Gemini API calls', ['model', 'outcome']),
  geminiRetries: counter('arcia_gemini_retries_total', 'Gemini call retries', ['reason']),
  geminiModelFallback: counter('arcia_gemini_model_fallback_total', 'Fallback from primary to secondary model'),
  geminiToolShed: counter('arcia_gemini_tool_shed_total', 'Grounding tool dropped after 429 on tool'),
  geminiCallDuration: histogram('arcia_gemini_call_duration_ms', 'Gemini call duration', ['model']),
  geminiJsonParseFallback: counter('arcia_gemini_json_parse_fallback_total', 'parseGeminiJson fell back to typed default'),

  // Tool layer
  toolCalls: counter('arcia_tool_calls_total', 'Tool invocations', ['tool', 'outcome']),
  toolDegradations: counter('arcia_tool_degradations_total', 'Tool calls that degraded to a [TOOL NOTICE] fallback', ['tool']),

  // Heuristic fallback usage — the number that answers "how often is
  // Gemini unavailable enough that we ran on the deterministic path."
  heuristicDecisions: counter('arcia_heuristic_decisions_total', 'Decisions made via deterministic fallback, not Gemini'),

  // Persistence layer
  supabaseWriteFailures: counter('arcia_supabase_write_failures_total', 'Best-effort Supabase writes that failed', ['table']),

  // SSE transport
  sseConnections: counter('arcia_sse_connections_total', 'SSE connections opened'),
  sseActiveGauge: counter('arcia_sse_active', 'Currently active SSE connections (inc/dec as a pseudo-gauge)'),
};

export function renderMetricsText(): string {
  return registry.map(m => m.toPrometheus()).join('\n\n') + '\n';
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Tracing — lightweight spans, no OTel SDK. Each span records duration
//    and terminal status; nested spans inherit traceId from context.
// ─────────────────────────────────────────────────────────────────────────

interface Span {
  end(attributes?: Record<string, unknown>): void;
  fail(error: unknown, attributes?: Record<string, unknown>): void;
}

const recentSpans: Array<{
  name: string;
  traceId: string;
  investigationId?: string;
  durationMs: number;
  status: 'ok' | 'error';
  attributes: Record<string, unknown>;
  timestamp: string;
}> = [];
const MAX_RECENT_SPANS = 500; // ring buffer for a lightweight /api/traces debug view

export function startSpan(name: string): Span {
  const start = performance.now();
  const ctx = currentContext();

  const finalize = (status: 'ok' | 'error', attributes: Record<string, unknown>) => {
    const durationMs = performance.now() - start;
    recentSpans.push({
      name,
      traceId: ctx?.traceId ?? 'no-trace',
      investigationId: ctx?.investigationId,
      durationMs: Math.round(durationMs),
      status,
      attributes,
      timestamp: new Date().toISOString(),
    });
    if (recentSpans.length > MAX_RECENT_SPANS) recentSpans.shift();

    logger[status === 'error' ? 'warn' : 'debug'](`span:${name}`, {
      durationMs: Math.round(durationMs),
      status,
      ...attributes,
    });
  };

  return {
    end: (attributes = {}) => finalize('ok', attributes),
    fail: (error: unknown, attributes = {}) =>
      finalize('error', { ...attributes, error: error instanceof Error ? error.message : String(error) }),
  };
}

/** Convenience wrapper: times an async function as a span, auto fail()s on throw. */
export async function traced<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const span = startSpan(name);
  try {
    const result = await fn();
    span.end();
    return result;
  } catch (err) {
    span.fail(err);
    throw err;
  }
}

export function getRecentSpans() {
  return [...recentSpans].reverse();
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Example wiring — how this attaches to the existing call sites.
//    (Reference only; apply these as small diffs to gemini.ts / tools.ts /
//    agent.ts rather than importing this comment block.)
// ─────────────────────────────────────────────────────────────────────────
//
// In gemini.ts::callGeminiSafe, around the generateContent call:
//
//   const span = startSpan('gemini.call');
//   const t0 = performance.now();
//   try {
//     const response = await ai.models.generateContent(...);
//     metrics.geminiCalls.inc({ model, outcome: 'success' });
//     metrics.geminiCallDuration.observe(performance.now() - t0, { model });
//     span.end({ model, grounded });
//     return response;
//   } catch (err) {
//     metrics.geminiCalls.inc({ model, outcome: 'error' });
//     if (isRateLimitError(err)) metrics.geminiRetries.inc({ reason: '429' });
//     span.fail(err, { model });
//     throw err;
//   }
//
// On model fallback: metrics.geminiModelFallback.inc()
// On tool-shedding after grounding 429: metrics.geminiToolShed.inc()
// In parseGeminiJson's catch branch: metrics.geminiJsonParseFallback.inc()
//
// In tools.ts, each executeXSearch's catch branch:
//
//   metrics.toolCalls.inc({ tool: 'web_search', outcome: 'degraded' });
//   metrics.toolDegradations.inc({ tool: 'web_search' });
//
// In agent.ts::runAutonomousInvestigation, wrap the whole loop body:
//
//   await withInvestigationContext({ investigationId, competitor }, async () => {
//     metrics.investigationsStarted.inc();
//     while (...) {
//       await withInvestigationContext({ stepNumber: currentStepNumber }, async () => {
//         await traced(`agent.step.${decision.action}`, async () => { ... });
//         metrics.agentSteps.inc({ action: decision.action });
//       });
//     }
//     metrics.investigationsCompleted.inc({ status: inv.status });
//   });
//
// In getDynamicHeuristicDecision's call site: metrics.heuristicDecisions.inc()
//
// ─────────────────────────────────────────────────────────────────────────
// 6. Express wiring — mount these two routes in server.ts
// ─────────────────────────────────────────────────────────────────────────
//
//   import { renderMetricsText, getRecentSpans } from './observability';
//
//   app.get('/api/metrics', (_req, res) => {
//     res.set('Content-Type', 'text/plain; version=0.0.4');
//     res.send(renderMetricsText());
//   });
//
//   app.get('/api/traces', (_req, res) => {
//     res.json(getRecentSpans());
//   });
//
// ─────────────────────────────────────────────────────────────────────────
// Swapping the export layer
// ─────────────────────────────────────────────────────────────────────────
// Everything above writes to: stdout (logs), an in-memory Map (metrics),
// and an in-memory ring buffer (spans). This is the correct amount of
// infrastructure for a single-process deployment. If this needs to scale
// horizontally or feed a real APM:
//   - Logs: pipe stdout through Vector/Fluentbit — no code change needed,
//     JSON lines are already the wire format.
//   - Metrics: replace the Counter/Histogram classes' internals with
//     prom-client, keep the `metrics.*` call sites identical.
//   - Traces: replace `startSpan`/`traced` internals with an OTel SDK
//     span, keep the call sites identical — this is the one seam
//     deliberately designed to be swappable without touching agent.ts,
//     tools.ts, or gemini.ts.
// ─────────────────────────────────────────────────────────────────────────