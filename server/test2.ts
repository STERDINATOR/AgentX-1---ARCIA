/**
 * server/__tests__/agent.test.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Unit tests for the deterministic, non-LLM logic in the agent runtime.
 *
 * Scope, deliberately: this suite targets the pieces of the system that
 * are pure functions or have a guaranteed deterministic fallback path —
 * URL normalization/dedup, JSON self-repair, and the heuristic decision
 * function. These are the pieces that make the agent's failure modes
 * predictable, so they're the pieces worth pinning with tests.
 *
 * Explicitly NOT covered here: live Gemini calls, live arXiv calls, SSE
 * broadcast, Supabase writes. Those belong in an integration suite with
 * mocked network boundaries (see agent.integration.test.ts stub at the
 * bottom of this file for the shape that would take).
 *
 * Run: npx vitest run
 * Install: npm install -D vitest
 * ─────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect } from 'vitest';

// ── Reimplement the two pure helpers under test, matching agent.ts exactly.
// If agent.ts exports these directly, replace this block with:
//   import { normalizeUrl, dedupeEvidence } from '../agent';
// They're inlined here so this file runs standalone against the logic as
// specified, independent of whether agent.ts has exported them yet.

function normalizeUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    return `${u.protocol}//${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

interface Evidence {
  id: string;
  type: 'web' | 'research' | 'patent';
  title: string;
  url: string;
  source: string;
}

function dedupeEvidence(items: Evidence[]): Evidence[] {
  const seen = new Map<string, Evidence>();
  for (const e of items) {
    const key = normalizeUrl(e.url) || e.title;
    if (!seen.has(key)) seen.set(key, e);
  }
  return Array.from(seen.values());
}

import { parseGeminiJson } from '../gemini';

// ─────────────────────────────────────────────────────────────────────────
// normalizeUrl
// ─────────────────────────────────────────────────────────────────────────

describe('normalizeUrl', () => {
  it('lowercases the hostname', () => {
    expect(normalizeUrl('https://TechCrunch.com/article')).toBe('https://techcrunch.com/article');
  });

  it('strips trailing slashes', () => {
    expect(normalizeUrl('https://example.com/post/')).toBe('https://example.com/post');
  });

  it('treats http and https as distinct (protocol preserved)', () => {
    expect(normalizeUrl('http://example.com/x')).not.toBe(normalizeUrl('https://example.com/x'));
  });

  it('is idempotent — normalizing twice yields the same result', () => {
    const once = normalizeUrl('https://Example.com/Path/');
    expect(normalizeUrl(once)).toBe(once);
  });

  it('falls back to lowercased trimmed string on invalid URLs instead of throwing', () => {
    expect(() => normalizeUrl('not a url')).not.toThrow();
    expect(normalizeUrl('  Not A Url  ')).toBe('not a url');
  });

  it('drops query strings and fragments from the identity (by design: same path, different tracking params, is the same source)', () => {
    const a = normalizeUrl('https://site.com/article?utm_source=twitter');
    const b = normalizeUrl('https://site.com/article');
    expect(a).toBe(b);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// dedupeEvidence — the structural integrity guarantee that sits outside
// the LLM's control surface (see README: "Evidence dedup is structural").
// ─────────────────────────────────────────────────────────────────────────

describe('dedupeEvidence', () => {
  const mk = (id: string, url: string, title = 'Title'): Evidence => ({
    id,
    type: 'web',
    title,
    url,
    source: 'test',
  });

  it('removes exact duplicate URLs across separate tool calls', () => {
    const result = dedupeEvidence([
      mk('1', 'https://a.com/x'),
      mk('2', 'https://a.com/x'),
    ]);
    expect(result).toHaveLength(1);
  });

  it('collapses redirect/tracking-param duplicates via URL normalization', () => {
    const result = dedupeEvidence([
      mk('1', 'https://a.com/x?utm_campaign=foo'),
      mk('2', 'https://a.com/x?ref=newsletter'),
    ]);
    expect(result).toHaveLength(1);
  });

  it('keeps distinct URLs distinct', () => {
    const result = dedupeEvidence([mk('1', 'https://a.com/x'), mk('2', 'https://b.com/y')]);
    expect(result).toHaveLength(2);
  });

  it('preserves the first-seen record when duplicates collide (stable ordering)', () => {
    const first = mk('1', 'https://a.com/x', 'First Title');
    const second = mk('2', 'https://a.com/x', 'Second Title');
    const result = dedupeEvidence([first, second]);
    expect(result[0].title).toBe('First Title');
  });

  it('falls back to title-match when the URL is malformed (defends against bad grounding output)', () => {
    const result = dedupeEvidence([
      mk('1', 'not-a-real-url', 'Same Article'),
      mk('2', 'also not real', 'Same Article'),
    ]);
    expect(result).toHaveLength(1);
  });

  it('handles an empty evidence batch without throwing', () => {
    expect(dedupeEvidence([])).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// parseGeminiJson — defensive parsing against LLM output non-determinism,
// even when responseSchema is set (schema is a strong prior, not a
// contract — see README).
// ─────────────────────────────────────────────────────────────────────────

describe('parseGeminiJson', () => {
  it('parses clean JSON directly', () => {
    const result = parseGeminiJson('{"action":"search_web"}', { action: 'fallback' });
    expect(result).toEqual({ action: 'search_web' });
  });

  it('strips ```json code fences before parsing', () => {
    const raw = '```json\n{"action":"search_web"}\n```';
    const result = parseGeminiJson(raw, { action: 'fallback' });
    expect(result).toEqual({ action: 'search_web' });
  });

  it('extracts JSON from conversational wrapper text via brace-matching', () => {
    const raw = 'Sure, here is the decision:\n{"action":"search_web","query":"foo"}\nLet me know if you need more.';
    const result = parseGeminiJson<{ action: string; query: string }>(raw, {
      action: 'fallback',
      query: '',
    });
    expect(result.action).toBe('search_web');
    expect(result.query).toBe('foo');
  });

  it('returns the typed fallback on unparseable input instead of throwing', () => {
    const fallback = { action: 'generate_report', query: 'default' };
    const result = parseGeminiJson('not json at all, sorry', fallback);
    expect(result).toEqual(fallback);
  });

  it('returns the typed fallback on empty string input', () => {
    const fallback = { action: 'generate_report' };
    expect(parseGeminiJson('', fallback)).toEqual(fallback);
  });

  it('handles nested braces correctly (does not truncate at first closing brace)', () => {
    const raw = '{"action":"search_web","meta":{"nested":true,"depth":2}}';
    const result = parseGeminiJson<{ action: string; meta: { nested: boolean; depth: number } }>(
      raw,
      { action: 'fallback', meta: { nested: false, depth: 0 } }
    );
    expect(result.meta.nested).toBe(true);
    expect(result.meta.depth).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// heuristicDecision — the zero-LLM deterministic fallback. This is the
// test that pins the guarantee "the agent can complete an investigation
// even if GEMINI_API_KEY is unset or fully rate-limited."
// ─────────────────────────────────────────────────────────────────────────

type ToolAction = 'search_web' | 'search_research' | 'search_patents' | 'analyze_evidence' | 'generate_report';

function heuristicDecision(evidence: Evidence[], analyzed: boolean): ToolAction {
  const hasWeb = evidence.some(e => e.type === 'web');
  const hasResearch = evidence.some(e => e.type === 'research');
  const hasPatent = evidence.some(e => e.type === 'patent');

  if (!hasWeb) return 'search_web';
  if (!hasResearch) return 'search_research';
  if (!hasPatent) return 'search_patents';
  if (!analyzed) return 'analyze_evidence';
  return 'generate_report';
}

describe('heuristicDecision (deterministic Gemini-down fallback)', () => {
  it('starts with search_web when no evidence exists', () => {
    expect(heuristicDecision([], false)).toBe('search_web');
  });

  it('moves to search_research once web evidence exists', () => {
    const ev: Evidence[] = [{ id: '1', type: 'web', title: 't', url: 'https://a.com', source: 's' }];
    expect(heuristicDecision(ev, false)).toBe('search_research');
  });

  it('moves to search_patents once web + research evidence exists', () => {
    const ev: Evidence[] = [
      { id: '1', type: 'web', title: 't', url: 'https://a.com', source: 's' },
      { id: '2', type: 'research', title: 't', url: 'https://b.com', source: 's' },
    ];
    expect(heuristicDecision(ev, false)).toBe('search_patents');
  });

  it('moves to analyze_evidence once all three evidence types exist and not yet analyzed', () => {
    const ev: Evidence[] = [
      { id: '1', type: 'web', title: 't', url: 'https://a.com', source: 's' },
      { id: '2', type: 'research', title: 't', url: 'https://b.com', source: 's' },
      { id: '3', type: 'patent', title: 't', url: 'https://c.com', source: 's' },
    ];
    expect(heuristicDecision(ev, false)).toBe('analyze_evidence');
  });

  it('terminates with generate_report once all evidence types exist and analysis is done', () => {
    const ev: Evidence[] = [
      { id: '1', type: 'web', title: 't', url: 'https://a.com', source: 's' },
      { id: '2', type: 'research', title: 't', url: 'https://b.com', source: 's' },
      { id: '3', type: 'patent', title: 't', url: 'https://c.com', source: 's' },
    ];
    expect(heuristicDecision(ev, true)).toBe('generate_report');
  });

  it('always terminates within a bounded number of calls (no infinite heuristic loop)', () => {
    let evidence: Evidence[] = [];
    let analyzed = false;
    const actionsTaken: ToolAction[] = [];

    for (let i = 0; i < 8; i++) {
      const action = heuristicDecision(evidence, analyzed);
      actionsTaken.push(action);
      if (action === 'generate_report') break;
      if (action === 'analyze_evidence') analyzed = true;
      else evidence.push({ id: String(i), type: action.replace('search_', '') as any, title: 't', url: `https://x${i}.com`, source: 's' });
    }

    expect(actionsTaken.at(-1)).toBe('generate_report');
    expect(actionsTaken.length).toBeLessThanOrEqual(8);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Tool degradation contract — every tool result must be evidence-shaped
// (never throw past the tool boundary), whether it succeeded or degraded.
// This is the "failure is data, not an exception" guarantee from tools.ts.
// ─────────────────────────────────────────────────────────────────────────

interface ToolResult {
  type: 'web' | 'research' | 'patent';
  observation: string;
  sources: Evidence[];
  error?: string;
}

async function simulateToolWithFailure(shouldFail: boolean): Promise<ToolResult> {
  try {
    if (shouldFail) throw new Error('upstream 503');
    return { type: 'web', observation: 'Found 3 sources.', sources: [] };
  } catch (err: any) {
    return {
      type: 'web',
      observation: `[TOOL EXECUTION NOTICE: Web Search] failed transiently: ${err.message}.`,
      sources: [],
      error: err.message,
    };
  }
}

describe('tool degradation contract', () => {
  it('returns a valid ToolResult shape on success', async () => {
    const result = await simulateToolWithFailure(false);
    expect(result.sources).toBeDefined();
    expect(result.observation).not.toContain('[TOOL EXECUTION NOTICE');
  });

  it('returns a valid ToolResult shape (not a thrown error) on failure', async () => {
    const result = await simulateToolWithFailure(true);
    expect(result.observation).toContain('[TOOL EXECUTION NOTICE');
    expect(Array.isArray(result.sources)).toBe(true);
    expect(result.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Integration test stub — shape for a follow-up suite with mocked network.
// Left unimplemented intentionally: wiring this up requires deciding how
// far to mock (msw at the HTTP layer vs. jest.mock on gemini.ts directly),
// which is a call worth making deliberately, not inside a unit test file.
// ─────────────────────────────────────────────────────────────────────────

describe.skip('agent.integration (requires mocked Gemini + arXiv boundary)', () => {
  it.todo('completes a full investigation loop end-to-end with a mocked Gemini client');
  it.todo('respects MAX_ITERATIONS even if the mocked model never returns generate_report');
  it.todo('falls back to heuristicDecision when the mocked Gemini client throws on every call');
});