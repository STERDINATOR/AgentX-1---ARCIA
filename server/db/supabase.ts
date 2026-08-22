import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Investigation, AgentStep, SourceEvidence, IntelligenceReport, ThreatAlert } from '../../src/types';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      console.log('[SUPABASE] Connected to Supabase Cloud Database successfully.');
    } catch (err) {
      console.warn('[SUPABASE] Failed to initialize Supabase client:', err);
    }
  }

  return supabaseClient;
}

export const supabaseDb = {
  isConfigured(): boolean {
    return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
  },

  async saveInvestigation(inv: Investigation): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client.from('investigations').upsert({
        id: inv.id,
        competitor: inv.competitor,
        topic: inv.topic,
        objective: inv.objective,
        time_range: inv.timeRange,
        priority: inv.priority,
        status: inv.status,
        current_action: inv.currentAction || null,
        current_decision: inv.currentDecision || null,
        current_tool: inv.currentTool || null,
        report_id: inv.reportId || null,
        insights: inv.insights || [],
        created_at: inv.createdAt,
        completed_at: inv.completedAt || null,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('[SUPABASE] Error saving investigation:', error.message);
      }
    } catch (err) {
      console.warn('[SUPABASE] Unexpected error in saveInvestigation:', err);
    }
  },

  async saveAgentStep(step: AgentStep): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client.from('agent_steps').upsert({
        id: step.id,
        investigation_id: step.investigationId,
        step_number: step.stepNumber,
        action: step.action,
        tool: step.tool,
        query: step.query || null,
        decision_summary: step.decisionSummary,
        reason_for_action: step.reasonForAction || null,
        observation_summary: step.observationSummary || null,
        sources_found: step.sourcesFound || 0,
        status: step.status,
        timestamp: step.timestamp,
        metadata: {
          sources: step.sources || [],
        },
      });

      if (error) {
        console.warn('[SUPABASE] Error saving agent step:', error.message);
      }
    } catch (err) {
      console.warn('[SUPABASE] Unexpected error in saveAgentStep:', err);
    }
  },

  async saveEvidence(evidence: SourceEvidence): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client.from('source_evidence').upsert({
        id: evidence.id,
        investigation_id: evidence.investigationId,
        type: evidence.type,
        title: evidence.title,
        url: evidence.url,
        source: evidence.source,
        published_at: evidence.publishedAt || null,
        authors: evidence.authors || [],
        abstract: evidence.abstract || null,
        summary: evidence.summary,
        relevance: evidence.relevance,
        confidence: evidence.confidence,
        tags: evidence.tags || [],
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('[SUPABASE] Error saving evidence item:', error.message);
      }
    } catch (err) {
      console.warn('[SUPABASE] Unexpected error in saveEvidence:', err);
    }
  },

  async saveIntelligenceReport(report: IntelligenceReport): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client.from('intelligence_reports').upsert({
        id: report.id,
        investigation_id: report.investigationId,
        competitor: report.competitor,
        topic: report.topic,
        objective: report.objective,
        threat_score: report.threatScore,
        threat_level: report.threatLevel,
        confidence: report.confidence,
        executive_summary: report.executiveSummary,
        final_assessment: report.finalAssessment,
        investigation_period: report.investigationPeriod,
        sub_scores: report.subScores,
        key_developments: report.keyDevelopments,
        emerging_trends: report.emergingTrends,
        competitive_impact: report.competitiveImpact,
        evidence_gaps: report.evidenceGaps || [],
        recommended_actions: report.recommendedActions,
        source_stats: report.sourceStats,
        created_at: report.createdAt,
      });

      if (error) {
        console.warn('[SUPABASE] Error saving intelligence report:', error.message);
      }
    } catch (err) {
      console.warn('[SUPABASE] Unexpected error in saveIntelligenceReport:', err);
    }
  },

  async saveAlert(alert: ThreatAlert): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { error } = await client.from('threat_alerts').upsert({
        id: alert.id,
        competitor: alert.competitor,
        title: alert.title,
        description: alert.description,
        category: (alert as any).category || 'Threat',
        severity: alert.severity,
        timestamp: alert.timestamp,
        is_read: alert.read ?? false,
        source_url: alert.sourceUrl || null,
      });

      if (error) {
        console.warn('[SUPABASE] Error saving alert:', error.message);
      }
    } catch (err) {
      console.warn('[SUPABASE] Unexpected error in saveAlert:', err);
    }
  },
};
