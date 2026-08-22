import {
  Investigation,
  IntelligenceReport,
  Competitor,
  Topic,
  Alert,
  EmergingTrendItem,
  SourceEvidence,
  DashboardStats
} from './types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  // Investigations
  async getInvestigations(): Promise<Investigation[]> {
    const res = await fetch(`${API_BASE}/investigations`);
    return res.json();
  },

  async getInvestigation(id: string): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`);
    if (!res.ok) throw new Error('Investigation not found');
    return res.json();
  },

  async createInvestigation(data: {
    competitor: string;
    topic: string;
    objective: string;
    timeRange?: string;
    priority?: string;
  }): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create investigation');
    return res.json();
  },

  async runInvestigation(id: string): Promise<{ message: string; status: string; id: string }> {
    const res = await fetch(`${API_BASE}/investigations/${id}/run`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to start investigation');
    return res.json();
  },

  async stopInvestigation(id: string): Promise<{ message: string; id: string }> {
    const res = await fetch(`${API_BASE}/investigations/${id}/stop`, {
      method: 'POST',
    });
    return res.json();
  },

  // Reports
  async getReports(): Promise<IntelligenceReport[]> {
    const res = await fetch(`${API_BASE}/reports`);
    return res.json();
  },

  async getReport(id: string): Promise<IntelligenceReport> {
    const res = await fetch(`${API_BASE}/reports/${id}`);
    if (!res.ok) throw new Error('Report not found');
    return res.json();
  },

  // Competitors
  async getCompetitors(): Promise<Competitor[]> {
    const res = await fetch(`${API_BASE}/competitors`);
    return res.json();
  },

  async getCompetitor(name: string): Promise<Competitor> {
    const res = await fetch(`${API_BASE}/competitors/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Competitor not found');
    return res.json();
  },

  // Topics
  async getTopics(): Promise<Topic[]> {
    const res = await fetch(`${API_BASE}/topics`);
    return res.json();
  },

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async markAlertAsRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/alerts/${id}/read`, { method: 'POST' });
  },

  // Trends
  async getTrends(): Promise<EmergingTrendItem[]> {
    const res = await fetch(`${API_BASE}/trends`);
    return res.json();
  },

  // Sources
  async getSources(): Promise<SourceEvidence[]> {
    const res = await fetch(`${API_BASE}/sources`);
    return res.json();
  },

  // Watchlist
  async getWatchlist(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/watchlist`);
    return res.json();
  },

  async toggleWatchlist(name: string): Promise<{ watchlist: string[] }> {
    const res = await fetch(`${API_BASE}/watchlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
};
