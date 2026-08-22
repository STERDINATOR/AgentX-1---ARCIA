# ARCIA
### Autonomous Research & Competitive Intelligence Agent

[![Runtime](https://img.shields.io/badge/orchestrator-hand--rolled_ReAct-black)]()
[![LLM](https://img.shields.io/badge/model-Gemini_3.7--flash-blue)]()
[![Transport](https://img.shields.io/badge/realtime-SSE_pub--sub-green)]()
[![Persistence](https://img.shields.io/badge/store-cache--aside_/_Postgres-orange)]()

A bounded ReAct agent that plans → acts → observes across three independent
evidence domains (web / academic / patent), self-terminates on evidence
sufficiency, and diffs every new finding against a persistent per-competitor
memory to produce **delta-aware** intelligence — not just search results.

```
REASON → ACT → OBSERVE → REASON → ... → TERMINATE(≤8 steps) → REPORT + Δ
```

---

## Why no agent framework

There's no LangGraph / LangChain / AutoGen here — the orchestrator is ~150
lines in `agent.ts`: a `while` loop, a discriminated-union tool dispatch, and
a hard iteration ceiling. That's a deliberate call, not an oversight:

- **Termination is owned by the host, never the model.** `MAX_ITERATIONS = 8`
  is enforced outside the LLM's control surface. A graph framework would give
  you the same guarantee behind an abstraction; here it's one visible `while`
  condition — auditable in a 10-second read.
- **Failure is data, not an exception.** Every tool returns a valid
  evidence-shaped payload whether it succeeded or degraded — the agent
  reasons over its own tool failures on the next turn instead of the
  orchestrator special-casing them.
- Fewer moving parts between "why did the agent do that" and the answer.

If this were multi-agent (parallel sub-investigations, shared scratchpads,
human-in-the-loop interrupts), LangGraph would earn its keep. At single-agent,
bounded, four-tool scale, the framework tax isn't worth paying.

---

## Core engineering patterns (actually implemented)

| Pattern | Where | What it buys |
|---|---|---|
| **Bounded ReAct loop** | `agent.ts::runAutonomousInvestigation` | Guaranteed termination independent of model behavior |
| **Structured decision output** | `Type.OBJECT` schema on every Gemini call | No regex-scraping intent from free text |
| **Deterministic heuristic fallback** | `getDynamicHeuristicDecision()` | Agent completes an investigation with zero LLM calls if Gemini is fully down |
| **Model fallback chain** | `gemini.ts::callGeminiSafe` | `gemini-3.7-flash → gemini-3.1-flash-lite` on exhausted retries |
| **Tool-shedding on 429** | `callGeminiSafe` | Search-grounding quota exhaustion drops the tool, not the request |
| **Exponential backoff + jitter** | `callGeminiSafe` | `min(2500, 500·1.5^n + rand(0,200))` — avoids thundering herd on retry |
| **URL-normalized evidence dedup** | `agent.ts::normalizeUrl` | Structural, not model-dependent, integrity |
| **Cache-aside persistence** | `store.ts → db/supabase.ts` | In-memory Map is source of truth; Postgres writes are async, fire-and-forget, never block the request path |
| **SSE pub-sub w/ heartbeat** | `server.ts` `/events` | Live agent monitor reflects orchestrator state 1:1, no polling |
| **Longitudinal delta memory** | `getCompetitorIntelligenceMemory()` + `whatChanged` schema | Every report answers "what changed since last time," not just "what's true now" |

---

## System architecture

```
┌────────────────────────────────────────────────────────────────┐
│                Browser — React 19 + Vite                        │
│  api.ts ──fetch(JSON)──▶ Express REST                           │
│         ──EventSource──▶ /api/investigations/:id/events (SSE)   │
└──────────────────────────┬───────────────────────────────────────┘
┌──────────────────────────▼───────────────────────────────────────┐
│                  server.ts (Express, single process)              │
│  REST endpoints + SSE fan-out (15s heartbeat) + Vite/static SPA   │
└──────────────────────────┬───────────────────────────────────────┘
                            │ fire-and-forget async
┌──────────────────────────▼───────────────────────────────────────┐
│              agent.ts — bounded ReAct orchestrator                 │
│  while step < 8 && status==='running':                            │
│    decideNextAgentAction() → dispatch tool → dedupe → persist     │
│    → broadcast SSE event                                          │
│  on generate_report: synthesize report + delta vs. memory         │
└───────┬─────────────────────┬─────────────────────┬───────────────┘
┌───────▼────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│   tools.ts      │  │    gemini.ts       │  │    store.ts        │
│ web/research/   │  │ callGeminiSafe():  │  │ In-memory Maps      │
│ patent search,  │  │ retry+backoff,     │  │ (source of truth)   │
│ evidence eval   │  │ model fallback,    │  │ + async write-thru  │
│ (arXiv + Gemini │  │ tool-shedding,     │  │   to Supabase       │
│  grounding)     │  │ JSON self-repair   │  └──────────┬───────────┘
└─────────────────┘  └────────────────────┘             │
                                              ┌───────────▼──────────┐
                                              │ db/supabase.ts        │
                                              │ Postgres (optional)   │
                                              └────────────────────────┘
```

---

## The agent loop

`runAutonomousInvestigation()` is the entire orchestration kernel:

```ts
const MAX_ITERATIONS = 8;
while (currentStepNumber < MAX_ITERATIONS && inv.status === 'running') {
  const decision = await decideNextAgentAction(inv, step, MAX_ITERATIONS, compMemory);
  // dispatch to search_web | search_research | search_patents |
  //                analyze_evidence | generate_report
  // merge + dedupe evidence by normalized URL
  // persist step, broadcast SSE event
  await sleep(800); // pacing to avoid upstream rate limits
}
```

- **Termination is guaranteed by the host**, not the model. If the agent
  never emits `generate_report`, the loop force-generates one after step 8.
- **Evidence dedup is structural**: every batch is merged via URL
  normalization (protocol + lowercased host + trimmed path), with a
  title-match fallback for redirect/tracking-URL duplicates — outside the
  LLM's control surface entirely.
- **Tool failures are non-fatal.** Each tool call has its own `try/catch`
  inside the loop; a failure produces a synthetic `[TOOL NOTICE]`
  observation and the loop continues — the agent reasons over its own
  failures on the next turn instead of crashing the investigation.
- **State is broadcast at every transition** (`status → step_start →
  step_complete → complete/error`), not polled — the Live Agent Monitor
  reflects orchestrator state 1:1 over SSE.

### Decision schema

```ts
{
  action: 'search_web' | 'search_research' | 'search_patents'
        | 'analyze_evidence' | 'generate_report',
  query: string,
  decision_summary: string,   // user-facing
  reason_for_action: string   // internal, not surfaced
}
```

Enforced via Gemini's `responseSchema`, backed by a **pure deterministic
fallback** (`getDynamicHeuristicDecision`) that inspects evidence composition
(has web? has research? has patent? analyzed yet?) and picks the next action
with zero LLM involvement — the agent can complete an investigation even with
`GEMINI_API_KEY` unset or fully rate-limited.

---

## Tool layer

| Tool | Grounding source | Retry policy | Total-failure fallback |
|---|---|---|---|
| `executeWebSearch` | Gemini `googleSearch` grounding, parses `groundingMetadata.groundingChunks` | 2 attempts, 600ms×n backoff | Synthesized evidence record, `[TOOL NOTICE]`-prefixed |
| `executeResearchSearch` | **Dual-sourced**: live `export.arxiv.org` Atom feed (5s timeout) + Gemini grounding, merged/deduped by URL | arXiv leg best-effort single-shot; Gemini leg gets 2 retries | Same notice pattern |
| `executePatentSearch` | Gemini grounding scoped via `site:patents.google.com` rewriting | 2 attempts, 600ms×n backoff | Same notice pattern |
| `executeAnalyzeEvidence` | Gemini structured JSON (`evidence_sufficient`, `missing_information`, `confidence`) | Inherits `callGeminiSafe` retry | Heuristic: `sufficient = evidence.length >= 3` |

**Load-bearing principle:** every tool returns a valid evidence-shaped
payload whether it succeeded or degraded. The orchestrator never has to
distinguish "tool succeeded" from "tool degraded gracefully" — failure is
data the agent can reason over, not an exception it has to special-case.

---

## LLM call layer — `callGeminiSafe()`

Single hardened chokepoint every prompt routes through, stacking three
orthogonal strategies:

```
for model in [primary, 'gemini-3.1-flash-lite']:     # model fallback
  for attempt in 0..maxRetries:                        # retry
    if grounding && attempt === 0: attach googleSearch tool
    if grounding && attempt  >  0: drop the tool         # tool-shedding
    generateContent(...)
    on 429/503: backoff = min(2500, 500·1.5^attempt + jitter)
    on other error: break → try next model immediately
```

- **Tool-shedding, not just retrying.** A 429 on the search-grounding tool
  is a separate quota bucket from base generation — retrying identically
  just burns another attempt against the same exhausted bucket. Dropping
  `config.tools` on retry trades grounded citations for availability.
- **`parseGeminiJson` treats schema-constrained output as a strong prior,
  not a contract**: strips ` ```json ` fences, brace/bracket-matches to
  excise the JSON payload from any wrapper text, then falls back to a
  caller-supplied typed default if parsing still fails.

---

## Persistence model — cache-aside, never blocking

The in-memory `Store` (a singleton of `Map`s) is the **authoritative**
runtime state. Every `store.record*()` call fires a Supabase write
asynchronously and swallows failures with `.catch(console.warn)`:

```ts
public async recordInvestigationState(inv: Investigation): Promise<void> {
  this.investigations.set(inv.id, inv);           // authoritative, sync
  if (supabaseDb.isConfigured()) {
    supabaseDb.saveInvestigation(inv).catch(err => // best-effort, async
      console.warn('[DB] Supabase investigation save failed:', err));
  }
}
```

The app never blocks or fails on DB unavailability — at the cost of state
not surviving a process restart unless a hydration path is added on boot
(see Known Limitations).

---

## Delta / longitudinal memory engine

Every investigation loads prior completed reports for that competitor
(`getCompetitorIntelligenceMemory`) and injects them into **both** the
decision prompt and the report-generation prompt, with an explicit mandate
to classify every finding against the baseline:

```
NEW · INCREASED · UNCHANGED · DECREASED · DISAPPEARED · CONTRADICTED
```

Threat score delta is computed as `current − previous`, not restated. This
turns single-shot intelligence into a genuine time series — the entire
reason to run this agent on a recurring schedule rather than once.

---

## Real-time transport — SSE

```
GET /api/investigations/:id/events
  → text/event-stream, no-cache, keep-alive, X-Accel-Buffering: no
  → initial snapshot event, then pub-sub fan-out per investigation ID
  → 15s heartbeat comment (': keepalive') to survive cloud proxy idle-timeouts
  → unsubscribe + res.end() on client disconnect
```

Chosen over WebSockets because the data flow is strictly server→client,
one-directional, and Express + `res.write` needs zero extra dependencies.

---

## Resilience posture, end to end

```
Tool failure     → structured [TOOL NOTICE] observation, loop continues
Gemini 429/503   → tool-shed → backoff+jitter → model fallback
JSON malformed   → fence-strip → brace-match extraction → typed fallback
DB unavailable   → warn + swallow, never blocks the request
Agent stalls     → hard-stop at step 8, force-generates report anyway
```

Nothing in this system can hang the request/response cycle on an upstream
being flaky. Every dependency has a bounded retry and a typed degrade path.

---

## Data model

```
investigations      — id, competitor, topic, objective, status, timestamps
agent_steps          — investigation_id, step_number, action, tool, query,
                        decision_summary, observation_summary, sources_found
source_evidence      — investigation_id, type(web|research|patent), url,
                        source, relevance, confidence, tags
intelligence_reports — threat_score, threat_level, confidence, sub_scores,
                        key_developments, emerging_trends, what_changed,
                        competitive_impact, evidence_gaps, recommendations
threat_alerts        — competitor, title, severity, timestamp
```

Full DDL in `supabase/schema.sql`.

---

## API surface

```
GET    /api/health
GET    /api/stats
GET    /api/investigations            POST /api/investigations
GET    /api/investigations/:id
POST   /api/investigations/:id/run    POST /api/investigations/:id/stop
GET    /api/investigations/:id/events              (SSE)
GET    /api/reports                   GET  /api/reports/:id
GET    /api/competitors               GET  /api/competitors/:name
GET    /api/topics   GET /api/alerts  POST /api/alerts/:id/read
GET    /api/trends   GET /api/sources
GET    /api/watchlist  POST /api/watchlist/toggle
```

---

## Known limitations

- No state hydration on process restart — in-memory store is cold-started
  even with Supabase configured; would need a boot-time `SELECT *` pass.
- arXiv Atom feed is parsed with hand-rolled regex, not an XML parser —
  fine for a single trusted, stable feed; fragile if the upstream format
  shifts or more unstructured feeds are added.
- Single-process orchestration — concurrent investigations share one Node
  event loop; horizontal scaling would need the loop extracted into a
  worker/queue (e.g. BullMQ) with the SSE layer fanned out via Redis pub-sub.

---

## Stack

**Client:** React 19 · TypeScript · Vite 6 · SSE (`EventSource`)
**Server:** Express · Node · SSE pub-sub
**Agent runtime:** custom (no framework) · `@google/genai`
**Grounding:** Gemini Google Search grounding + live arXiv Atom API
**Persistence:** In-memory (authoritative) + Supabase/Postgres (write-behind)

---

## Quickstart

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY required; SUPABASE_* optional
npm run dev
```

## Environment variables

```env
GEMINI_API_KEY=your_gemini_api_key       # required
APP_URL=http://localhost:3000            # self-referential links
SUPABASE_URL=your_supabase_url           # optional — enables persistence
SUPABASE_ANON_KEY=your_supabase_key      # optional
```


## License

Educational / research / hackathon use.
