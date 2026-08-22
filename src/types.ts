export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type InvestigationStatus = 'queued' | 'running' | 'completed' | 'failed' | 'stopped';
export type ToolAction = 'search_web' | 'search_research' | 'search_patents' | 'analyze_evidence' | 'generate_report';

export interface SourceEvidence {
  id: string;
  investigationId: string;
  type: 'web' | 'research' | 'patent';
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  authors?: string[];
  abstract?: string;
  relevance: number;
  confidence: number;
  tags?: string[];
}

export interface AgentStep {
  id: string;
  investigationId: string;
  stepNumber: number;
  action: ToolAction;
  tool: string;
  query: string;
  decisionSummary: string;
  reasonForAction: string;
  observationSummary: string;
  sourcesFound: number;
  sources?: SourceEvidence[];
  timestamp: string;
  status: 'thinking' | 'executing' | 'completed' | 'failed';
}

export interface HistoricalThreatPoint {
  investigationId: string;
  timestamp: string;
  date: string;
  topic: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  keyDriver?: string;
}

export interface ChangeDeltaItem {
  id: string;
  category: 'product' | 'research' | 'patent' | 'strategy' | 'market' | 'partnership';
  title: string;
  status: 'NEW' | 'INCREASED' | 'UNCHANGED' | 'DECREASED' | 'DISAPPEARED' | 'CONTRADICTED';
  description: string;
  significance: 'High' | 'Medium' | 'Low';
  previousBaseline?: string;
  currentEvidence?: string;
  sourceUrl?: string;
}

export interface WhatChangedAnalysis {
  hasPreviousBaseline: boolean;
  previousInvestigationId?: string;
  previousInvestigationDate?: string;
  previousThreatScore?: number;
  currentThreatScore: number;
  threatScoreDelta: number; // e.g. +15 or -4
  threatScoreSummary: string; // "Increased by +15 points from 71 to 86 due to new research signals..."
  summary: string;
  keyChanges: ChangeDeltaItem[];
  stableSignals: string[];
  newSignals: string[];
  contradictionsOrShifts: string[];
  newRecommendations: string[];
}

export interface IntelligenceReport {
  id: string;
  investigationId: string;
  competitor: string;
  topic: string;
  objective: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  confidence: number;
  executiveSummary: string;
  finalAssessment: string;
  investigationPeriod: string;
  whatChanged?: WhatChangedAnalysis;
  threatHistory?: HistoricalThreatPoint[];
  subScores: {
    researchActivity: { score: number; level: string; change: string };
    patentActivity: { score: number; level: string; change: string };
    newsActivity: { score: number; level: string; change: string };
    socialBuzz: { score: number; level: string; change: string };
    marketImpact: { score: number; level: string; change: string };
  };
  keyDevelopments: Array<{
    id: string;
    title: string;
    description: string;
    type: 'News' | 'Research' | 'Patent';
    url?: string;
    impact: 'High' | 'Medium' | 'Low';
    date?: string;
  }>;
  emergingTrends: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    growthRate?: string;
    signalStrength: number;
    direction: 'rising' | 'stable' | 'declining';
    impact?: 'High' | 'Medium' | 'Low';
    evidenceCount: number;
    whyItMatters: string;
    competitorsInvolved?: string[];
  }>;
  competitiveImpact: {
    summary: string;
    impactLevel: number;
    moatStrength: string;
    timeline: string;
  };
  evidenceGaps: string[];
  recommendedActions: Array<{
    id: string;
    title: string;
    description: string;
    priority: PriorityLevel;
    category: string;
    timeline: string;
  }>;
  sourceStats: {
    total: number;
    newsCount: number;
    researchCount: number;
    patentCount: number;
    topDomains: Array<{ domain: string; url: string }>;
  };
  createdAt: string;
}

export interface Investigation {
  id: string;
  competitor: string;
  topic: string;
  objective: string;
  timeRange: string;
  priority: PriorityLevel;
  status: InvestigationStatus;
  currentAction?: string;
  currentDecision?: string;
  currentTool?: string;
  steps: AgentStep[];
  evidence: SourceEvidence[];
  insights: string[];
  reportId?: string;
  report?: IntelligenceReport;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface Competitor {
  id: string;
  name: string;
  tagline: string;
  sector: string;
  headquarters: string;
  founded?: string;
  employees?: string;
  website?: string;
  marketCap: string;
  threatScore: number;
  threatLevel: ThreatLevel;
  threatFactors: {
    rdVelocity: number;
    patentGrowth: number;
    marketDominance: number;
    talentInflow: number;
  };
  description: string;
  activeInvestigations: number;
  recentAlerts: number;
  activityTrend: number[];
  threatHistory?: HistoricalThreatPoint[];
  lastInvestigated?: string;
  historicalInvestigationsCount?: number;
  strategicFocus: string[];
  keyProducts: Array<{
    name: string;
    category?: string;
    description: string;
    badge?: string;
    image?: string;
  }>;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  scoreFactors?: {
    marketPosition: number;
    aiInnovation: number;
    researchOutput: number;
    patentStrength: number;
    newsMomentum: number;
  };
  aiStrategyFocus?: Array<{ area: string; percentage: number }>;
  recentDevelopments?: Array<{
    title: string;
    type: string;
    time: string;
    url?: string;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
  }>;
  topRisks?: string[];
  topStrengths?: string[];
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  description: string;
  papersCount: number;
  patentsCount: number;
  newsCount: number;
  momentum: string;
  keyCompetitors: string[];
  trendScore?: number;
  tags?: string[];
  isWatchlisted?: boolean;
}

export interface Alert {
  id: string;
  investigationId?: string;
  competitor: string;
  title: string;
  description: string;
  severity: ThreatLevel;
  timeAgo: string;
  timestamp: string;
  read: boolean;
  sourceUrl?: string;
}

export type ThreatAlert = Alert;

export interface EmergingTrendItem {
  id: string;
  name: string;
  description: string;
  category?: string;
  growthRate?: string;
  signalStrength: number;
  direction: 'rising' | 'stable' | 'declining';
  impact?: 'High' | 'Medium' | 'Low';
  competitorsInvolved?: string[];
  evidenceCount: number;
  whyItMatters: string;
}

export interface DashboardStats {
  activeInvestigations: number;
  criticalAlerts: number;
  monitoredCompetitors: number;
  emergingTrendsCount: number;
  sourcesMonitored: string | number;
  globalThreatScore: number;
  globalThreatLevel: ThreatLevel;
  globalConfidence: number;
  recentAlertsCount: number;
  activityLast7Days: {
    labels?: string[];
    news?: number[];
    research?: number[];
    patents?: number[];
    buzz?: number[];
    newsMentions?: number[];
    researchPapers?: number[];
    patentsFiled?: number[];
  };
}

export interface InvestigationEvent {
  type: 'status' | 'step_start' | 'step_started' | 'step_complete' | 'step_completed' | 'evidence_added' | 'complete' | 'investigation_completed' | 'error';
  investigationId?: string;
  status?: string;
  message?: string;
  step?: AgentStep;
  evidence?: SourceEvidence;
  evidenceCount?: number;
  report?: IntelligenceReport;
  investigation?: Investigation;
  error?: string;
}
