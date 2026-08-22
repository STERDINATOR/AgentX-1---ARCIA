import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { CommandCenter } from './pages/CommandCenter';
import { NewInvestigationPage } from './pages/NewInvestigationPage';
import { LiveAgentMonitor } from './components/LiveAgentMonitor';
import { IntelligenceReportPage } from './pages/IntelligenceReportPage';
import { CompetitorProfilePage } from './pages/CompetitorProfilePage';
import { CompetitorsPage } from './pages/CompetitorsPage';
import { TopicsPage } from './pages/TopicsPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TrendsPage } from './pages/TrendsPage';
import { SourcesPage } from './pages/SourcesPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('command-center');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(7);

  useEffect(() => {
    // Initial fetch of unread alerts count
    api.getAlerts().then(alerts => {
      setUnreadAlertsCount(alerts.filter(a => !a.read).length);
    }).catch(err => console.error('Alerts load error:', err));
  }, [currentTab]);

  // Handlers for switching views
  const handleOpenLanding = () => {
    setCurrentTab('landing');
  };

  const handleEnterApp = () => {
    setCurrentTab('command-center');
  };

  const handleNewInvestigation = (compName?: string) => {
    if (compName) setSelectedCompetitor(compName);
    setCurrentTab('new-investigation');
  };

  const handleInvestigationStarted = (investigationId: string) => {
    setSelectedInvestigationId(investigationId);
    setCurrentTab('live-monitor');
  };

  const handleSelectInvestigation = (id: string) => {
    setSelectedInvestigationId(id);
    setCurrentTab('live-monitor');
  };

  const handleViewReport = (reportId?: string) => {
    if (reportId) setSelectedReportId(reportId);
    setCurrentTab('report');
  };

  const handleSelectCompetitor = (name: string) => {
    setSelectedCompetitor(name);
    setCurrentTab('competitor-profile');
  };

  // Titles mapping
  const getHeaderMeta = () => {
    switch (currentTab) {
      case 'command-center':
        return { title: 'Command Center', subtitle: 'Global AI Research & Competitive Intelligence Fleet' };
      case 'investigations':
        return { title: 'Autonomous Investigations', subtitle: 'Active & Historical Multi-Vector Missions' };
      case 'new-investigation':
        return { title: 'New Intelligence Mission', subtitle: 'Configure Autonomous Research Agent Parameters' };
      case 'live-monitor':
        return { title: 'Live Agent Monitor', subtitle: 'Real-Time ReAct Reasoning & Tool Execution HUD' };
      case 'report':
        return { title: 'Intelligence Synthesis Report', subtitle: 'Grounded Threat Scores & Strategic Recommendations' };
      case 'competitors':
        return { title: 'Monitored Competitors', subtitle: 'Frontier AI Labs, Hardware Silicon & Cloud Providers' };
      case 'competitor-profile':
        return { title: `${selectedCompetitor || 'Competitor'} Dossier`, subtitle: 'Threat Breakdown, Patent Moats & Scientific Velocity' };
      case 'topics':
        return { title: 'Intelligence Topics', subtitle: 'Technology Domains & Research Acceleration Signals' };
      case 'alerts':
        return { title: 'Strategic Alerts', subtitle: 'Autonomous Threat & Competitive Velocity Feed' };
      case 'reports':
        return { title: 'Reports Archive', subtitle: 'Grounded Intelligence Reports Repository' };
      case 'trends':
        return { title: 'Emerging AI Trends', subtitle: 'Architectural Shifts & Algorithmic Momentum' };
      case 'sources':
        return { title: 'Evidence Repository', subtitle: 'Grounded Web, arXiv & Patent Sources' };
      case 'settings':
        return { title: 'System Settings', subtitle: 'Gemini Model Core, Diagnostics & Orchestrator Config' };
      default:
        return { title: 'Command Center', subtitle: 'AI Research & Competitive Intelligence' };
    }
  };

  // Full-bleed landing page view
  if (currentTab === 'landing') {
    return (
      <LandingPage
        onEnterApp={handleEnterApp}
        onStartInvestigation={() => {
          setCurrentTab('new-investigation');
        }}
      />
    );
  }

  const { title, subtitle } = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        unreadAlertsCount={unreadAlertsCount}
        onOpenLanding={handleOpenLanding}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-cyber-grid bg-[#0a0a0b]">
        <Header
          title={title}
          subtitle={subtitle}
          unreadCount={unreadAlertsCount}
          onNewInvestigation={currentTab !== 'new-investigation' ? () => handleNewInvestigation() : undefined}
          onOpenAlerts={() => setCurrentTab('alerts')}
        />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {currentTab === 'command-center' && (
            <CommandCenter
              onNewInvestigation={() => handleNewInvestigation()}
              onSelectCompetitor={handleSelectCompetitor}
              onSelectInvestigation={handleSelectInvestigation}
              onSelectReport={handleViewReport}
              onViewAllAlerts={() => setCurrentTab('alerts')}
              onViewAllTrends={() => setCurrentTab('trends')}
            />
          )}

          {currentTab === 'new-investigation' && (
            <NewInvestigationPage
              onInvestigationStarted={handleInvestigationStarted}
              onCancel={() => setCurrentTab('command-center')}
            />
          )}

          {currentTab === 'live-monitor' && selectedInvestigationId && (
            <LiveAgentMonitor
              investigationId={selectedInvestigationId}
              onViewReport={handleViewReport}
              onClose={() => setCurrentTab('command-center')}
            />
          )}

          {currentTab === 'report' && (
            <IntelligenceReportPage
              reportId={selectedReportId || undefined}
              onBack={() => setCurrentTab('command-center')}
            />
          )}

          {currentTab === 'competitors' && (
            <CompetitorsPage
              onSelectCompetitor={handleSelectCompetitor}
              onNewInvestigation={handleNewInvestigation}
            />
          )}

          {currentTab === 'competitor-profile' && selectedCompetitor && (
            <CompetitorProfilePage
              competitorName={selectedCompetitor}
              onBack={() => setCurrentTab('competitors')}
              onNewInvestigation={handleNewInvestigation}
            />
          )}

          {currentTab === 'topics' && (
            <TopicsPage
              onNewInvestigationWithTopic={(t, c) => {
                if (c) setSelectedCompetitor(c);
                setCurrentTab('new-investigation');
              }}
            />
          )}

          {currentTab === 'investigations' && (
            <InvestigationsPage
              onSelectInvestigation={handleSelectInvestigation}
              onNewInvestigation={() => handleNewInvestigation()}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsPage
              onSelectInvestigation={handleSelectInvestigation}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsPage
              onSelectReport={handleViewReport}
              onNewInvestigation={() => handleNewInvestigation()}
            />
          )}

          {currentTab === 'trends' && (
            <TrendsPage
              onNewInvestigationWithTrend={(trend) => {
                setCurrentTab('new-investigation');
              }}
            />
          )}

          {currentTab === 'sources' && (
            <SourcesPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
