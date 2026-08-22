
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph-checkpoint';
import { Type } from '@google/genai';

import { store } from './store';
import {
  AgentStep,
  IntelligenceReport,
  Investigation,
  SourceEvidence,
  Alert,
  ToolAction,
} from '../src/types';
import {
  executeWebSearch,
  executeResearchSearch,
  executePatentSearch,
  executeAnalyzeEvidence,
} from './tools';
import { callGeminiSafe, parseGeminiJson } from './gemini';

// ─────────────────────────────────────────────────────────────────────────
// 1. Graph state schema
// ─────────────────────────────────────────────────────────────────────────
//
// LangGraph state is a reducer-based channel set, not a plain object mutated
// in place. Each channel declares how concurrent/sequential updates merge.
// `evidence` and `steps` are append-only logs (reducer = concat + dedupe);
// scalar fields (`status`, `currentAction`) are last-write-wins.

const InvestigationState = Annotation.Root({
  investigationId: Annotation<string>(),
  competitor: Annotation<string>(),
  topic: Annotation<string>(),
  objective: Annotation<string>(),
  priority: Annotation<string>(),
  timeRange: Annotation<string>(),

  status: Annotation<'running' | 'completed' | 'failed'>({
    reducer: (_prev, next) => next,
    default: () => 'running',
  }),

  stepNumber: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),

  evidence: Annotation<SourceEvidence[]>({
    reducer: (prev, next) => dedupeEvidence([...prev, ...next]),
    default: () => [],
  }),

  steps: Annotation<AgentStep[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),

  insights: Annotation<string[]>({
    reducer: (prev, next) => Array.from(new Set([...prev, ...next])),
    default: () => [],
  }),

  // Decision produced by the `decide` node, consumed by the router.
  pendingAction: Annotation<ToolAction | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  pendingQuery: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
  pendingDecisionSummary: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),

  compMemory: Annotation<any>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  report: Annotation<IntelligenceReport | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  error: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

type GraphState = typeof InvestigationState.State;

const MAX_ITERATIONS = 8;

function normalizeUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

function dedupeEvidence(items: SourceEvidence[]): SourceEvidence[] {
  const seen = new Map<string, SourceEvidence>();
  for (const e of items) {
    const key = normalizeUrl(e.url) || e.title;
    if (!seen.has(key)) seen.set(key, e);
  }
  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Node: decide — Gemini structured-output router, same schema/prompt
//    contract as agent.ts::decideNextAgentAction, ported node-for-node.
// ─────────────────────────────────────────────────────────────────────────

async function decideNode(state: GraphState): Promise<Partial<GraphState>> {
  const evidenceSummary = state.evidence
    .map((e, i) => `[#${i + 1}] (${e.type.toUpperCase()}) ${e.title} - Source: ${e.source} (${e.url})`)
    .join('\n');

  const stepsTaken = state.steps
    .map(s => `Step ${s.stepNumber} [${s.tool}]: Query "${s.query}" -> Result: ${s.observationSummary}`)
    .join('\n');

  const webCount = state.evidence.filter(e => e.type === 'web').length;
  const researchCount = state.evidence.filter(e => e.type === 'research').length;
  const patentCount = state.evidence.filter(e => e.type === 'patent').length;

  const memoryContext = state.compMemory?.latestReport
    ? `\nPersistent Intelligence Baseline:\n- Previous Threat Score: ${state.compMemory.latestReport.threatScore}/100\n- Comparative Goal: Formulate queries that detect what has CHANGED since this baseline.`
    : `\nNo previous baseline on file for ${state.competitor}. Establishing initial baseline.`;

  const prompt = `You are ARCIA (Autonomous Research & Competitive Intelligence Agent).

Investigation Scope:
- Target Competitor: "${state.competitor}"
- Focus Topic: "${state.topic}"
- Investigation Objective: "${state.objective}"
${memoryContext}

Current Step: ${state.stepNumber + 1} of maximum ${MAX_ITERATIONS}

Investigation History So Far:
${stepsTaken || 'No steps executed yet.'}

Evidence Collected (${state.evidence.length} total: ${webCount} web, ${researchCount} research, ${patentCount} patents):
${evidenceSummary || 'None yet.'}

Available Tools:
1. "search_web": current internet news, launches, partnerships.
2. "search_research": arXiv preprints, papers, architectures.
3. "search_patents": patent/IP filings.
4. "analyze_evidence": synthesize and check for gaps.
5. "generate_report": conclude when sufficient evidence exists (or step >= 4).

Return strictly valid JSON:
{
  "action": "search_web" | "search_research" | "search_patents" | "analyze_evidence" | "generate_report",
  "query": "specific search query or rationale",
  "decision_summary": "concise 1-sentence user-facing explanation",
  "reason_for_action": "short internal reasoning"
}`;

  try {
    const { text } = await callGeminiSafe({
      prompt,
      model: 'gemini-3.7-flash',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              enum: ['search_web', 'search_research', 'search_patents', 'analyze_evidence', 'generate_report'],
            },
            query: { type: Type.STRING },
            decision_summary: { type: Type.STRING },
            reason_for_action: { type: Type.STRING },
          },
          required: ['action', 'query', 'decision_summary', 'reason_for_action'],
        },
      },
      maxRetries: 2,
    });

    const fallback = heuristicDecision(state);
    const parsed = parseGeminiJson<{
      action: ToolAction;
      query: string;
      decision_summary: string;
      reason_for_action: string;
    }>(text, fallback);

    return {
      pendingAction: parsed.action,
      pendingQuery: parsed.query,
      pendingDecisionSummary: parsed.decision_summary,
    };
  } catch {
    const fb = heuristicDecision(state);
    return { pendingAction: fb.action, pendingQuery: fb.query, pendingDecisionSummary: fb.decision_summary };
  }
}

// Deterministic fallback — mirrors agent.ts::getDynamicHeuristicDecision.
// Guarantees the graph can still terminate correctly with zero LLM calls.
function heuristicDecision(state: GraphState) {
  const hasWeb = state.evidence.some(e => e.type === 'web');
  const hasResearch = state.evidence.some(e => e.type === 'research');
  const hasPatent = state.evidence.some(e => e.type === 'patent');
  const hasAnalyzed = state.steps.some(s => s.action === 'analyze_evidence');

  if (!hasWeb) {
    return { action: 'search_web' as ToolAction, query: `${state.competitor} ${state.topic} announcements`, decision_summary: 'Gathering current market signals.' };
  }
  if (!hasResearch) {
    return { action: 'search_research' as ToolAction, query: `${state.competitor} ${state.topic} preprint`, decision_summary: 'Gathering technical research evidence.' };
  }
  if (!hasPatent) {
    return { action: 'search_patents' as ToolAction, query: `${state.competitor} ${state.topic} patent`, decision_summary: 'Gathering IP evidence.' };
  }
  if (!hasAnalyzed) {
    return { action: 'analyze_evidence' as ToolAction, query: `Synthesize ${state.competitor} evidence`, decision_summary: 'Reassessing collected evidence.' };
  }
  return { action: 'generate_report' as ToolAction, query: 'Synthesize final report', decision_summary: 'Evidence sufficient.' };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Tool nodes — each wraps the existing tools.ts function, persists +
//    broadcasts a step exactly like agent.ts, and never throws: a tool
//    failure becomes a [TOOL NOTICE] observation, same as the hand-rolled
//    loop, so failure remains data the next `decide` pass can reason over.
// ─────────────────────────────────────────────────────────────────────────

function toolDisplayName(action: ToolAction): string {
  return {
    search_web: 'Web Search',
    search_research: 'Research Search',
    search_patents: 'Patent Search',
    analyze_evidence: 'Analyze Evidence',
    generate_report: 'Generate Report',
  }[action] ?? action;
}

async function makeStep(state: GraphState, status: AgentStep['status']): Promise<AgentStep> {
  const stepNumber = state.stepNumber + 1;
  return {
    id: `step-${state.investigationId}-${stepNumber}-${Date.now()}`,
    investigationId: state.investigationId,
    stepNumber,
    action: state.pendingAction as ToolAction,
    tool: toolDisplayName(state.pendingAction as ToolAction),
    query: state.pendingQuery,
    decisionSummary: state.pendingDecisionSummary,
    reasonForAction: state.pendingDecisionSummary,
    observationSummary: 'Executing tool...',
    sourcesFound: 0,
    timestamp: new Date().toISOString(),
    status,
  };
}

async function persistAndBroadcast(state: GraphState, step: AgentStep) {
  await store.recordAgentStep(step);
  store.broadcastInvestigationEvent(state.investigationId, {
    type: 'step_complete',
    step,
    investigationId: state.investigationId,
  });
}

async function searchWebNode(state: GraphState): Promise<Partial<GraphState>> {
  const step = await makeStep(state, 'executing');
  try {
    const result = await executeWebSearch(state.investigationId, state.pendingQuery, state.competitor);
    step.observationSummary = result.observation;
    step.sourcesFound = result.sources.length;
    step.sources = result.sources;
    step.status = 'completed';
    for (const s of result.sources) await store.recordEvidence(s);
    await persistAndBroadcast(state, step);
    return { steps: [step], evidence: result.sources, stepNumber: step.stepNumber };
  } catch (err: any) {
    step.status = 'completed';
    step.observationSummary = `[TOOL EXECUTION NOTICE: Web Search] "${state.pendingQuery}" failed transiently: ${err?.message ?? 'timeout'}.`;
    await persistAndBroadcast(state, step);
    return { steps: [step], stepNumber: step.stepNumber };
  }
}

async function searchResearchNode(state: GraphState): Promise<Partial<GraphState>> {
  const step = await makeStep(state, 'executing');
  try {
    const result = await executeResearchSearch(state.investigationId, state.pendingQuery, state.competitor);
    step.observationSummary = result.observation;
    step.sourcesFound = result.sources.length;
    step.sources = result.sources;
    step.status = 'completed';
    for (const s of result.sources) await store.recordEvidence(s);
    await persistAndBroadcast(state, step);
    return { steps: [step], evidence: result.sources, stepNumber: step.stepNumber };
  } catch (err: any) {
    step.status = 'completed';
    step.observationSummary = `[TOOL EXECUTION NOTICE: Research Search] "${state.pendingQuery}" failed transiently: ${err?.message ?? 'timeout'}.`;
    await persistAndBroadcast(state, step);
    return { steps: [step], stepNumber: step.stepNumber };
  }
}

async function searchPatentsNode(state: GraphState): Promise<Partial<GraphState>> {
  const step = await makeStep(state, 'executing');
  try {
    const result = await executePatentSearch(state.investigationId, state.pendingQuery, state.competitor);
    step.observationSummary = result.observation;
    step.sourcesFound = result.sources.length;
    step.sources = result.sources;
    step.status = 'completed';
    for (const s of result.sources) await store.recordEvidence(s);
    await persistAndBroadcast(state, step);
    return { steps: [step], evidence: result.sources, stepNumber: step.stepNumber };
  } catch (err: any) {
    step.status = 'completed';
    step.observationSummary = `[TOOL EXECUTION NOTICE: Patent Search] "${state.pendingQuery}" failed transiently: ${err?.message ?? 'timeout'}.`;
    await persistAndBroadcast(state, step);
    return { steps: [step], stepNumber: step.stepNumber };
  }
}

async function analyzeEvidenceNode(state: GraphState): Promise<Partial<GraphState>> {
  const step = await makeStep(state, 'executing');
  try {
    const result = await executeAnalyzeEvidence(
      state.investigationId,
      state.competitor,
      state.topic,
      state.objective,
      state.evidence
    );
    step.observationSummary = result.observation;
    step.sourcesFound = state.evidence.length;
    step.status = 'completed';
    await persistAndBroadcast(state, step);
    return { steps: [step], insights: result.important_findings, stepNumber: step.stepNumber };
  } catch (err: any) {
    step.status = 'completed';
    step.observationSummary = `[TOOL EXECUTION NOTICE: Analyze Evidence] failed transiently: ${err?.message ?? 'timeout'}.`;
    await persistAndBroadcast(state, step);
    return { steps: [step], stepNumber: step.stepNumber };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Node: generateReport — same structured schema/prompt contract as
//    agent.ts::generateFinalIntelligenceReport, condensed here; wire the
//    full schema back in from agent.ts verbatim for production use.
// ─────────────────────────────────────────────────────────────────────────

async function generateReportNode(state: GraphState): Promise<Partial<GraphState>> {
  const reportId = `RPT-${Math.floor(10000 + Math.random() * 90000)}`;
  const evidenceSummary = state.evidence
    .map((e, i) => `[#${i + 1}] ${e.type.toUpperCase()} | ${e.title} | ${e.source} (${e.url})`)
    .join('\n');

  const prompt = `You are ARCIA. Generate a structured Intelligence Report for competitor "${state.competitor}" on topic "${state.topic}", objective "${state.objective}", based strictly on this evidence:\n${evidenceSummary}\n\nReturn JSON with threatScore (0-100 int), threatLevel (LOW|MEDIUM|HIGH|CRITICAL), confidence (0-100), executiveSummary, keyDevelopments[], emergingTrends[], recommendedActions[].`;

  try {
    const { text } = await callGeminiSafe({
      prompt,
      model: 'gemini-3.7-flash',
      config: { responseMimeType: 'application/json' },
      maxRetries: 2,
    });

    const parsed = parseGeminiJson<any>(text, null);
    if (!parsed?.executiveSummary) throw new Error('Invalid report JSON');

    const report: IntelligenceReport = {
      id: reportId,
      investigationId: state.investigationId,
      competitor: state.competitor,
      topic: state.topic,
      objective: state.objective,
      threatScore: parsed.threatScore ?? 75,
      threatLevel: parsed.threatLevel ?? 'MEDIUM',
      confidence: parsed.confidence ?? 85,
      executiveSummary: parsed.executiveSummary,
      finalAssessment: parsed.finalAssessment ?? parsed.executiveSummary,
      investigationPeriod: state.timeRange,
      keyDevelopments: parsed.keyDevelopments ?? [],
      emergingTrends: parsed.emergingTrends ?? [],
      recommendedActions: parsed.recommendedActions ?? [],
      evidenceGaps: parsed.evidenceGaps ?? [],
      sourceStats: {
        total: state.evidence.length,
        newsCount: state.evidence.filter(e => e.type === 'web').length,
        researchCount: state.evidence.filter(e => e.type === 'research').length,
        patentCount: state.evidence.filter(e => e.type === 'patent').length,
        topDomains: [],
      },
      createdAt: new Date().toISOString(),
    } as IntelligenceReport;

    await store.recordIntelligenceReport(report);

    if (report.threatScore >= 75) {
      const alert: Alert = {
        id: `alt-${Date.now()}`,
        investigationId: state.investigationId,
        competitor: state.competitor,
        title: `High Threat Signal: ${state.competitor} in ${state.topic}`,
        description: report.executiveSummary.slice(0, 150),
        severity: report.threatLevel,
        timeAgo: 'Just now',
        timestamp: new Date().toISOString(),
        read: false,
      };
      store.alerts.unshift(alert);
    }

    store.broadcastInvestigationEvent(state.investigationId, {
      type: 'complete',
      report,
      investigationId: state.investigationId,
    });

    return { report, status: 'completed' };
  } catch (error: any) {
    store.broadcastInvestigationEvent(state.investigationId, {
      type: 'error',
      error: error.message,
      investigationId: state.investigationId,
    });
    return { status: 'failed', error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Router — the conditional edge out of `decide`. This is the LangGraph
//    equivalent of the `if (decision.action === ...)` chain in agent.ts,
//    plus the MAX_ITERATIONS circuit breaker enforced host-side, not by
//    the model. Guarantees the graph can never loop forever regardless of
//    what Gemini returns.
// ─────────────────────────────────────────────────────────────────────────

function routeAfterDecide(state: GraphState): string {
  if (state.stepNumber >= MAX_ITERATIONS) return 'generate_report';

  switch (state.pendingAction) {
    case 'search_web':
      return 'search_web';
    case 'search_research':
      return 'search_research';
    case 'search_patents':
      return 'search_patents';
    case 'analyze_evidence':
      return 'analyze_evidence';
    case 'generate_report':
      return 'generate_report';
    default:
      return 'generate_report'; // fail-closed: unknown action -> terminate safely
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Graph assembly
// ─────────────────────────────────────────────────────────────────────────
//
//                         ┌──────────┐
//              ┌──────────│  decide  │◀─────────────────────────┐
//              │          └──────────┘                          │
//   ┌──────────┼──────────┬──────────────┬───────────┐          │
//   ▼          ▼          ▼              ▼           ▼          │
// web       research   patents      analyze     generate ──▶ END │
//   │          │          │              │        report        │
//   └──────────┴──────────┴──────────────┴──────────────────────┘
//   (every tool node loops back to `decide` for the next reasoning pass)

const checkpointer = new MemorySaver();

export function buildInvestigationGraph() {
  const graph = new StateGraph(InvestigationState)
    .addNode('decide', decideNode)
    .addNode('search_web', searchWebNode)
    .addNode('search_research', searchResearchNode)
    .addNode('search_patents', searchPatentsNode)
    .addNode('analyze_evidence', analyzeEvidenceNode)
    .addNode('generate_report', generateReportNode)

    .addEdge(START, 'decide')
    .addConditionalEdges('decide', routeAfterDecide, {
      search_web: 'search_web',
      search_research: 'search_research',
      search_patents: 'search_patents',
      analyze_evidence: 'analyze_evidence',
      generate_report: 'generate_report',
    })
    .addEdge('search_web', 'decide')
    .addEdge('search_research', 'decide')
    .addEdge('search_patents', 'decide')
    .addEdge('analyze_evidence', 'decide')
    .addEdge('generate_report', END);

  return graph.compile({ checkpointer });
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Public entrypoint — same signature as agent.ts::runAutonomousInvestigation
//    so server.ts can swap orchestrators with a one-line import change.
// ─────────────────────────────────────────────────────────────────────────

export async function runAutonomousInvestigationLangGraph(
  investigationId: string
): Promise<Investigation> {
  const inv = store.investigations.get(investigationId);
  if (!inv) throw new Error(`Investigation ${investigationId} not found.`);

  inv.status = 'running';
  store.broadcastInvestigationEvent(investigationId, {
    type: 'status',
    status: 'running',
    investigationId,
  });

  const compMemory = store.getCompetitorIntelligenceMemory(inv.competitor);
  const app = buildInvestigationGraph();

  // `thread_id` is what makes MemorySaver checkpointing per-investigation:
  // crash mid-run, call invoke() again with the same thread_id, and
  // LangGraph resumes from the last completed node instead of step 0.
  const config = { configurable: { thread_id: investigationId }, recursionLimit: 40 };

  const finalState = await app.invoke(
    {
      investigationId,
      competitor: inv.competitor,
      topic: inv.topic,
      objective: inv.objective,
      priority: inv.priority,
      timeRange: inv.timeRange,
      compMemory,
    },
    config
  );

  inv.status = finalState.status === 'completed' ? 'completed' : 'failed';
  inv.evidence = finalState.evidence;
  inv.steps = finalState.steps;
  inv.insights = finalState.insights;
  inv.report = finalState.report ?? undefined;
  inv.reportId = finalState.report?.id;
  inv.completedAt = new Date().toISOString();
  inv.error = finalState.error ?? undefined;

  await store.recordInvestigationState(inv);
  return inv;
}