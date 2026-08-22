-- ========================================================================
-- ARCIA: Autonomous Research & Competitive Intelligence Agent
-- Supabase PostgreSQL Schema Definition
-- ========================================================================

-- 1. Investigations Table
CREATE TABLE IF NOT EXISTS investigations (
  id TEXT PRIMARY KEY,
  competitor TEXT NOT NULL,
  topic TEXT NOT NULL,
  objective TEXT NOT NULL,
  time_range TEXT NOT NULL DEFAULT 'Last 30 Days',
  priority TEXT NOT NULL DEFAULT 'High',
  status TEXT NOT NULL DEFAULT 'queued',
  current_action TEXT,
  current_decision TEXT,
  current_tool TEXT,
  report_id TEXT,
  insights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Agent ReAct Execution Steps Table
CREATE TABLE IF NOT EXISTS agent_steps (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  action TEXT NOT NULL,
  tool TEXT NOT NULL,
  query TEXT,
  decision_summary TEXT NOT NULL,
  reason_for_action TEXT,
  observation_summary TEXT,
  sources_found INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'executing',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_agent_steps_investigation_id ON agent_steps(investigation_id);

-- 3. Multi-Source Grounded Evidence Table
CREATE TABLE IF NOT EXISTS source_evidence (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  step_id TEXT,
  type TEXT NOT NULL, -- 'web' | 'research' | 'patent'
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  published_at TEXT,
  authors JSONB DEFAULT '[]'::jsonb,
  abstract TEXT,
  summary TEXT NOT NULL,
  relevance INT DEFAULT 90,
  confidence INT DEFAULT 90,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_evidence_investigation_id ON source_evidence(investigation_id);
CREATE INDEX IF NOT EXISTS idx_source_evidence_type ON source_evidence(type);

-- 4. Final Intelligence Reports Table
CREATE TABLE IF NOT EXISTS intelligence_reports (
  id TEXT PRIMARY KEY,
  investigation_id TEXT NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  competitor TEXT NOT NULL,
  topic TEXT NOT NULL,
  objective TEXT NOT NULL,
  threat_score INT NOT NULL DEFAULT 50,
  threat_level TEXT NOT NULL DEFAULT 'MEDIUM',
  confidence INT NOT NULL DEFAULT 85,
  executive_summary TEXT NOT NULL,
  final_assessment TEXT NOT NULL,
  investigation_period TEXT NOT NULL DEFAULT 'Last 30 Days',
  sub_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  key_developments JSONB NOT NULL DEFAULT '[]'::jsonb,
  emerging_trends JSONB NOT NULL DEFAULT '[]'::jsonb,
  competitive_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_reports_investigation_id ON intelligence_reports(investigation_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_reports_competitor ON intelligence_reports(competitor);

-- 5. Real-Time Threat Alerts Table
CREATE TABLE IF NOT EXISTS threat_alerts (
  id TEXT PRIMARY KEY,
  competitor TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT
);

-- Enable Row Level Security (RLS) policies
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_alerts ENABLE ROW LEVEL SECURITY;

-- Allow read and write access for authenticated & anon service API roles
CREATE POLICY "Public Read Investigations" ON investigations FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Investigations" ON investigations FOR ALL USING (true);

CREATE POLICY "Public Read Steps" ON agent_steps FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Steps" ON agent_steps FOR ALL USING (true);

CREATE POLICY "Public Read Evidence" ON source_evidence FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Evidence" ON source_evidence FOR ALL USING (true);

CREATE POLICY "Public Read Reports" ON intelligence_reports FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Reports" ON intelligence_reports FOR ALL USING (true);

CREATE POLICY "Public Read Alerts" ON threat_alerts FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Alerts" ON threat_alerts FOR ALL USING (true);
