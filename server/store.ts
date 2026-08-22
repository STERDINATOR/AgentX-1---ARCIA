import {
  Investigation,
  IntelligenceReport,
  Competitor,
  Topic,
  Alert,
  EmergingTrendItem,
  SourceEvidence,
  DashboardStats,
  InvestigationEvent,
  AgentStep
} from '../src/types';
import { supabaseDb } from './db/supabase';

export class Store {
  investigations: Map<string, Investigation> = new Map();
  reports: Map<string, IntelligenceReport> = new Map();
  competitors: Map<string, Competitor> = new Map();
  topics: Map<string, Topic> = new Map();
  alerts: Alert[] = [];
  trends: EmergingTrendItem[] = [];
  watchlist: Set<string> = new Set(['NVIDIA', 'OpenAI', 'Google', 'Anthropic']);

  // SSE active listener callbacks: investigationId -> Set<callback>
  private sseClients: Map<string, Set<(event: InvestigationEvent) => void>> = new Map();

  constructor() {
    this.seedData();
  }

  public async recordInvestigationState(inv: Investigation): Promise<void> {
    this.investigations.set(inv.id, inv);
    if (supabaseDb.isConfigured()) {
      supabaseDb.saveInvestigation(inv).catch(err => {
        console.warn('[DB] Supabase investigation save failed:', err);
      });
    }
  }

  public async recordAgentStep(step: AgentStep): Promise<void> {
    if (supabaseDb.isConfigured()) {
      supabaseDb.saveAgentStep(step).catch(err => {
        console.warn('[DB] Supabase step save failed:', err);
      });
    }
  }

  public async recordEvidence(evidence: SourceEvidence): Promise<void> {
    if (supabaseDb.isConfigured()) {
      supabaseDb.saveEvidence(evidence).catch(err => {
        console.warn('[DB] Supabase evidence save failed:', err);
      });
    }
  }

  public async recordIntelligenceReport(report: IntelligenceReport): Promise<void> {
    this.reports.set(report.id, report);
    if (supabaseDb.isConfigured()) {
      supabaseDb.saveIntelligenceReport(report).catch(err => {
        console.warn('[DB] Supabase report save failed:', err);
      });
    }
  }


  public subscribeToInvestigation(
    investigationId: string,
    callback: (event: InvestigationEvent) => void
  ): () => void {
    if (!this.sseClients.has(investigationId)) {
      this.sseClients.set(investigationId, new Set());
    }
    this.sseClients.get(investigationId)!.add(callback);

    return () => {
      const clients = this.sseClients.get(investigationId);
      if (clients) {
        clients.delete(callback);
        if (clients.size === 0) {
          this.sseClients.delete(investigationId);
        }
      }
    };
  }

  public broadcastInvestigationEvent(investigationId: string, event: InvestigationEvent) {
    const clients = this.sseClients.get(investigationId);
    if (clients) {
      clients.forEach(cb => {
        try {
          cb(event);
        } catch (e) {
          console.error('SSE Broadcast error:', e);
        }
      });
    }
  }

  public getDashboardStats(): DashboardStats {
    const activeInvestigations = Array.from(this.investigations.values()).filter(
      i => i.status === 'running' || i.status === 'queued'
    ).length;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL' && !a.read).length;
    let totalSources = 0;
    this.investigations.forEach(i => {
      totalSources += i.evidence.length;
    });

    return {
      activeInvestigations: activeInvestigations || 12,
      criticalAlerts: criticalAlerts || 7,
      monitoredCompetitors: this.competitors.size || 6,
      emergingTrendsCount: this.trends.length || 24,
      sourcesMonitored: totalSources > 0 ? totalSources : 6420,
      globalThreatScore: 91,
      globalThreatLevel: 'CRITICAL',
      globalConfidence: 91,
      recentAlertsCount: this.alerts.length,
      activityLast7Days: {
        news: [45, 52, 60, 75, 68, 85, 92],
        research: [30, 42, 38, 55, 62, 70, 78],
        patents: [20, 25, 28, 32, 40, 48, 56],
        buzz: [50, 58, 65, 72, 80, 88, 95],
      },
    };
  }

  private seedData() {
    // 1. Competitors
    const nvidia: Competitor = {
      id: 'comp-nvidia',
      name: 'NVIDIA',
      tagline: 'Leading AI silicon architecture, CUDA ecosystem, and Blackwell / Rubin computing.',
      sector: 'AI Silicon & Computing',
      headquarters: 'Santa Clara, CA',
      marketCap: '$3.42T',
      threatScore: 94,
      threatLevel: 'CRITICAL',
      threatFactors: {
        rdVelocity: 96,
        patentGrowth: 88,
        marketDominance: 98,
        talentInflow: 92,
      },
      description: 'Global market leader in discrete GPU architectures, NVLink interconnect fabrics, and accelerated AI software platforms (CUDA, TensorRT, NIMs).',
      activeInvestigations: 4,
      recentAlerts: 3,
      activityTrend: [65, 72, 80, 85, 91, 94],
      strategicFocus: [
        'Blackwell B200 / B100 4nm GPU Architecture',
        'Next-gen Vera Rubin 3nm AI Platform (2026)',
        'NVLink 5.0 1.8TB/s High-Bandwidth Interconnects',
        'Physical AI & Humanoid Robotics (Project GR00T & Cosmos)',
        'Enterprise NIMs Microservices Deployment',
      ],
      keyProducts: [
        { name: 'Blackwell B200 GPU', description: '208B transistors, 20 PFLOPS FP4 inference powerhouse.' },
        { name: 'Vera Rubin Platform', description: 'Next-gen architecture targeting HBM4 with 3nm packaging.' },
        { name: 'CUDA-X Software Stack', description: 'Industry-standard accelerated computing libraries.' },
        { name: 'Cosmos Physical AI Model', description: 'World foundation models for robotics and autonomous driving.' },
      ],
      swot: {
        strengths: [
          'Full-stack hardware-software lock-in via CUDA and NVLink fabric',
          'Monopoly-tier hyperscale cloud data center market share (>85%)',
          'Accelerated 1-year product cadence (Blackwell -> Rubin)',
        ],
        weaknesses: [
          'High revenue concentration on top hyper-scaler CapEx cycles',
          'Supply chain bottlenecks on TSMC CoWoS advanced packaging',
        ],
        opportunities: [
          'Enterprise sovereign AI infrastructure worldwide',
          'Physical AI, humanoid robotics, and autonomous vehicle compute',
        ],
        threats: [
          'Custom hyperscaler ASICs (Google TPU, AWS Trainium, MS Maia)',
          'Export controls and geopolitical supply friction',
        ],
      },
    };

    const google: Competitor = {
      id: 'comp-google',
      name: 'Google',
      tagline: 'Leading AI research, Gemini multimodal frontier systems, and TPU infrastructure.',
      sector: 'Frontier AI Labs & Cloud',
      headquarters: 'Mountain View, CA',
      marketCap: '$2.15T',
      threatScore: 89,
      threatLevel: 'HIGH',
      threatFactors: {
        rdVelocity: 94,
        patentGrowth: 90,
        marketDominance: 88,
        talentInflow: 91,
      },
      description: 'Pioneers of the Transformer architecture, DeepMind frontier research, Gemini multimodal native reasoning, and custom TPU v5e/v6e silicon.',
      activeInvestigations: 3,
      recentAlerts: 2,
      activityTrend: [60, 68, 74, 82, 85, 89],
      strategicFocus: [
        'Gemini 2.0 / 3.0 Multimodal Native Reasoning Models',
        'TPU v6e (Trillium) Cloud Silicon Deployment',
        'Autonomous Agent Workflows & Workspace Integrations',
        'DeepMind AlphaFold, AlphaGeometry, and Science AI',
      ],
      keyProducts: [
        { name: 'Gemini 2.0 / 3.0', description: 'Native multimodal frontier reasoning models with real-time tools.' },
        { name: 'Google Cloud TPU v6e', description: '4.7x compute performance per chip with optical circuit switching.' },
        { name: 'AlphaFold 3', description: 'Biomolecular structure prediction engine.' },
      ],
      swot: {
        strengths: [
          'Unrivaled research depth across DeepMind and Google Research',
          'In-house TPU silicon reducing external GPU dependence',
          'Billion-user product distribution (Search, Android, Workspace)',
        ],
        weaknesses: [
          'Internal innovator dilemma and coordination overhead across units',
        ],
        opportunities: [
          'Autonomous agent integrations across Google Workspace suite',
          'Breakthrough scientific discovery monetization in healthcare and biotech',
        ],
        threats: [
          'Search revenue cannibalization from direct conversational engines',
        ],
      },
    };

    const openai: Competitor = {
      id: 'comp-openai',
      name: 'OpenAI',
      tagline: 'Frontier reasoning architectures, ChatGPT platform, and autonomous agent orchestration.',
      sector: 'Frontier AI Labs',
      headquarters: 'San Francisco, CA',
      marketCap: '$157B (Valuation)',
      threatScore: 92,
      threatLevel: 'CRITICAL',
      threatFactors: {
        rdVelocity: 97,
        patentGrowth: 78,
        marketDominance: 95,
        talentInflow: 96,
      },
      description: 'Frontier AI research laboratory behind GPT-4o, OpenAI o1/o3 reasoning models, Operator autonomous computer agents, and the ChatGPT consumer platform.',
      activeInvestigations: 3,
      recentAlerts: 2,
      activityTrend: [70, 78, 84, 89, 90, 92],
      strategicFocus: [
        'o1 / o3 Extended Test-Time Reasoning Architectures',
        'Operator Autonomous GUI & Computer-Use Agents',
        'Stargate Supercomputer Infrastructure with Microsoft & Oracle',
        'Enterprise Custom Fine-Tuning & Model Distillation',
      ],
      keyProducts: [
        { name: 'OpenAI o3', description: 'Frontier reasoning model with state-of-the-art competitive coding scores.' },
        { name: 'ChatGPT Enterprise', description: 'Enterprise workspace deployment with custom GPT agents.' },
        { name: 'Operator', description: 'Autonomous agent that directly controls browser and desktop GUIs.' },
      ],
      swot: {
        strengths: [
          'Leading brand recognition and massive consumer subscription base',
          'Benchmark-leading test-time compute reasoning breakthroughs',
        ],
        weaknesses: [
          'High compute training and inference burn rate',
        ],
        opportunities: [
          'Autonomous computer-use agent displacement of traditional enterprise software',
        ],
        threats: [
          'Open-source weights and competitive parity from deep-pocketed labs',
        ],
      },
    };

    const microsoft: Competitor = {
      id: 'comp-microsoft',
      name: 'Microsoft',
      tagline: 'Enterprise Copilot ecosystem, Azure hyperscale AI cloud, and Maia silicon.',
      sector: 'Cloud & Enterprise AI',
      headquarters: 'Redmond, WA',
      marketCap: '$3.18T',
      threatScore: 86,
      threatLevel: 'HIGH',
      threatFactors: {
        rdVelocity: 85,
        patentGrowth: 92,
        marketDominance: 90,
        talentInflow: 84,
      },
      description: 'Leading enterprise cloud platform with Azure AI, Microsoft 365 Copilot, custom Maia 100 / Cobalt 100 silicon, and exclusive OpenAI commercial cloud rights.',
      activeInvestigations: 2,
      recentAlerts: 1,
      activityTrend: [62, 69, 75, 80, 82, 86],
      strategicFocus: [
        'Azure AI Cloud Datacenter Expansion',
        'Microsoft Copilot Studio & Multi-Agent Workflows',
        'In-House Maia 100 Silicon Deployment',
        'Phi-3 / Phi-4 Small Language Model (SLM) Edge Architectures',
      ],
      keyProducts: [
        { name: 'Azure AI Studio', description: 'Full enterprise lifecycle management for frontier models.' },
        { name: 'Microsoft 365 Copilot', description: 'Native generative assistant inside Office applications.' },
        { name: 'Phi-4 SLM', description: 'High-density 14B model excelling at mathematics and synthetic reasoning.' },
      ],
      swot: {
        strengths: [
          'Entrenched enterprise sales channels across Fortune 500',
          'Massive cloud footprint and strategic OpenAI exclusive alliance',
        ],
        weaknesses: [
          'Dependence on external model providers for top-tier frontier intelligence',
        ],
        opportunities: [
          'Full-scale automation of enterprise business workflows and Copilot agents',
        ],
        threats: [
          'OpenAI building independent cloud relationships with Oracle and SoftBank',
        ],
      },
    };

    const meta: Competitor = {
      id: 'comp-meta',
      name: 'Meta',
      tagline: 'Open-weight foundation models (Llama), MTIA silicon, and social AI experiences.',
      sector: 'Open AI & Social Platforms',
      headquarters: 'Menlo Park, CA',
      marketCap: '$1.48T',
      threatScore: 84,
      threatLevel: 'HIGH',
      threatFactors: {
        rdVelocity: 91,
        patentGrowth: 86,
        marketDominance: 82,
        talentInflow: 88,
      },
      description: 'Dominant open-source AI ecosystem driver with Llama 3 / 4 foundation models, FAIR research laboratory, and in-house MTIA inference silicon.',
      activeInvestigations: 2,
      recentAlerts: 1,
      activityTrend: [55, 63, 70, 76, 80, 84],
      strategicFocus: [
        'Llama 4 Multi-Modal Reasoning Open-Weight Release',
        'Meta Training & Inference Accelerator (MTIA v2)',
        'PyTorch 2.x & Open Ecosystem Standardization',
        'Meta AI Assistant across WhatsApp, Instagram & Ray-Ban Smart Glasses',
      ],
      keyProducts: [
        { name: 'Llama 3.3 / Llama 4', description: 'Open-weights frontier model driving global developer adoption.' },
        { name: 'MTIA v2 Silicon', description: 'Custom ASIC for ranking, recommendation, and generative inference.' },
        { name: 'Ray-Ban Meta Smart Glasses', description: 'Multimodal AI wearable with real-time vision.' },
      ],
      swot: {
        strengths: [
          'Open-source ecosystem goodwill establishing PyTorch and Llama standards',
          'Enormous cash flow and self-funded GPU compute clusters (>600k GPUs)',
        ],
        weaknesses: [
          'Commoditizing software layer without direct enterprise cloud sales arm',
        ],
        opportunities: [
          'AI-powered multimodal spatial computing and consumer smart glasses',
        ],
        threats: [
          'Potential regulatory hurdles on open-weight foundation models',
        ],
      },
    };

    const anthropic: Competitor = {
      id: 'comp-anthropic',
      name: 'Anthropic',
      tagline: 'Claude 3.7 Sonnet reasoning models, Constitutional AI, and Computer Use.',
      sector: 'Frontier AI Labs',
      headquarters: 'San Francisco, CA',
      marketCap: '$60B (Valuation)',
      threatScore: 88,
      threatLevel: 'HIGH',
      threatFactors: {
        rdVelocity: 95,
        patentGrowth: 75,
        marketDominance: 84,
        talentInflow: 94,
      },
      description: 'AI safety and frontier intelligence research company behind Claude 3.5/3.7 Sonnet, hybrid reasoning modes, and API computer use capabilities.',
      activeInvestigations: 2,
      recentAlerts: 2,
      activityTrend: [64, 71, 78, 82, 85, 88],
      strategicFocus: [
        'Claude 3.7 Sonnet with Hybrid Reasoning & Thinking Tokens',
        'API Computer Use & GUI Navigation for Developer Workflows',
        'Constitutional AI & Mechanistic Interpretability Research',
        'Amazon AWS & Google Cloud Strategic Cloud Partnerships',
      ],
      keyProducts: [
        { name: 'Claude 3.7 Sonnet', description: 'Leading hybrid model combining instantaneous response with deep thinking.' },
        { name: 'Computer Use API', description: 'Direct mouse, keyboard, and screen interaction capabilities for agents.' },
        { name: 'Claude Code CLI', description: 'Agentic coding tool operating directly in terminal environments.' },
      ],
      swot: {
        strengths: [
          'Industry-leading coding, analysis, and reasoning benchmarks',
          'Strong enterprise trust and safety alignment positioning',
        ],
        weaknesses: [
          'Reliance on cloud partners (AWS/GCP) for distribution and compute infrastructure',
        ],
        opportunities: [
          'Replacing software engineering tooling with automated agentic coding systems',
        ],
        threats: [
          'Aggressive pricing pressure from open-weights and rival frontier labs',
        ],
      },
    };

    [nvidia, google, openai, microsoft, meta, anthropic].forEach(c => this.competitors.set(c.name, c));

    // 2. Topics
    const topicsList: Topic[] = [
      {
        id: 'top-silicon',
        name: 'Next-Gen AI Silicon & Accelerators (Blackwell B200 / Rubin)',
        category: 'Hardware & Silicon',
        description: 'Advanced 4nm/3nm packaging, high-bandwidth memory (HBM3e/HBM4), optical interconnects, and custom hyperscaler ASIC architectures.',
        papersCount: 142,
        patentsCount: 68,
        newsCount: 310,
        momentum: '+34% YoY',
        keyCompetitors: ['NVIDIA', 'Google', 'Microsoft', 'Meta'],
      },
      {
        id: 'top-reasoning',
        name: 'Frontier Reasoning & Test-Time Compute (o3, Gemini 2.0 Thinking, Claude 3.7)',
        category: 'Frontier AI Models',
        description: 'Extended chain-of-thought search algorithms, Monte Carlo tree exploration, and reinforcement learning over mathematical/coding verification.',
        papersCount: 285,
        patentsCount: 42,
        newsCount: 450,
        momentum: '+58% YoY',
        keyCompetitors: ['OpenAI', 'Google', 'Anthropic', 'Meta'],
      },
      {
        id: 'top-robotics',
        name: 'Embodied AI & Humanoid Robotics (Cosmos, Figure, Optimus)',
        category: 'Robotics & Embodied AI',
        description: 'Physical foundation models, vision-language-action (VLA) architectures, and real-time sensorimotor neural control in physical environments.',
        papersCount: 194,
        patentsCount: 89,
        newsCount: 275,
        momentum: '+46% YoY',
        keyCompetitors: ['NVIDIA', 'Google', 'Tesla', 'Figure AI'],
      },
      {
        id: 'top-agents',
        name: 'Autonomous Agent Workflows & Computer-Use Systems',
        category: 'Enterprise AI Systems',
        description: 'ReAct agent loops, multi-agent orchestration frameworks, and GUI automation systems executing complex multi-step enterprise workflows.',
        papersCount: 220,
        patentsCount: 54,
        newsCount: 390,
        momentum: '+62% YoY',
        keyCompetitors: ['Anthropic', 'OpenAI', 'Google', 'Microsoft'],
      },
      {
        id: 'top-patents',
        name: 'Hardware Acceleration & Low-Precision Quantization Patents',
        category: 'Patents & IP',
        description: 'FP4/FP8 microscaling formats, unified memory caches, speculative decoding patents, and tensor pipeline scheduling intellectual property.',
        papersCount: 98,
        patentsCount: 112,
        newsCount: 160,
        momentum: '+28% YoY',
        keyCompetitors: ['NVIDIA', 'Google', 'Meta', 'Intel'],
      },
    ];

    topicsList.forEach(t => this.topics.set(t.name, t));

    // 3. Alerts
    this.alerts = [
      {
        id: 'alt-1',
        competitor: 'NVIDIA',
        title: 'Critical Threat Alert: NVIDIA Accelerates Vera Rubin Architecture to 2026',
        description: 'Supply chain disclosures confirm NVIDIA pulled forward 3nm Rubin platform delivery with HBM4 memory, increasing defensive hardware moat.',
        severity: 'CRITICAL',
        timeAgo: '12m ago',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        read: false,
        investigationId: 'INV-2026-8942',
      },
      {
        id: 'alt-2',
        competitor: 'OpenAI',
        title: 'New Research Preprint: High-Yield Test-Time Reasoning Verification',
        description: 'OpenAI researchers published algorithmic paper on verifiable reward models scaling test-time compute across competitive mathematics.',
        severity: 'HIGH',
        timeAgo: '45m ago',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        read: false,
      },
      {
        id: 'alt-3',
        competitor: 'Google',
        title: 'Patent Filing: Optical Circuit Switching in Distributed Tensor Processors',
        description: 'Google Patent publication confirms OCS hardware routing reducing all-to-all communication latency in next-gen TPU clusters.',
        severity: 'HIGH',
        timeAgo: '2h ago',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        read: false,
      },
      {
        id: 'alt-4',
        competitor: 'Anthropic',
        title: 'Major Release: Claude 3.7 Sonnet Hybrid Reasoning Engine',
        description: 'Anthropic deployed dual-mode thinking model establishing new benchmarks in front-end web engineering and security auditing.',
        severity: 'CRITICAL',
        timeAgo: '4h ago',
        timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
        read: true,
      },
      {
        id: 'alt-5',
        competitor: 'Meta',
        title: 'Open Source Strategy: Llama 4 Infrastructure Ramping Up',
        description: 'Meta announced dedicated 100k+ GPU cluster allocated for multimodal open-weights training, targeting mid-2026 release.',
        severity: 'MEDIUM',
        timeAgo: '8h ago',
        timestamp: new Date(Date.now() - 480 * 60000).toISOString(),
        read: true,
      },
      {
        id: 'alt-6',
        competitor: 'Microsoft',
        title: 'Enterprise Update: Copilot Studio Multi-Agent Orchestration Rollout',
        description: 'Microsoft launched autonomous agent deployment inside Teams and Outlook with native enterprise data governance.',
        severity: 'MEDIUM',
        timeAgo: '1d ago',
        timestamp: new Date(Date.now() - 1440 * 60000).toISOString(),
        read: true,
      },
      {
        id: 'alt-7',
        competitor: 'NVIDIA',
        title: 'Patent Grant: Low-Latency AI Inference Acceleration on Unified Memory',
        description: 'USPTO registered patent protecting SRAM compression techniques in Blackwell second-generation Transformer Engine.',
        severity: 'HIGH',
        timeAgo: '1d ago',
        timestamp: new Date(Date.now() - 1500 * 60000).toISOString(),
        read: true,
      },
    ];

    // 4. Emerging Trends
    this.trends = [
      {
        id: 'tr-1',
        name: 'Extended Test-Time Compute (Thinking Tokens)',
        description: 'Shift from pre-training parameter scaling to dynamic reasoning tokens and Monte Carlo verification during inference.',
        signalStrength: 96,
        direction: 'rising',
        impact: 'High',
        evidenceCount: 28,
        whyItMatters: 'Enables smaller models to match 10x larger legacy architectures in complex problem solving.',
      },
      {
        id: 'tr-2',
        name: 'Hardware-Software Co-Design for FP4 Quantization',
        description: 'Native 4-bit floating point hardware arithmetic engines with microscaling formats to double inference throughput.',
        signalStrength: 94,
        direction: 'rising',
        impact: 'High',
        evidenceCount: 22,
        whyItMatters: 'Dramatically cuts per-token inference costs and memory bandwidth saturation.',
      },
      {
        id: 'tr-3',
        name: 'Autonomous Computer-Use & GUI Navigation Agents',
        description: 'Models trained on pixel-level computer screen comprehension and keyboard/mouse tool execution.',
        signalStrength: 91,
        direction: 'rising',
        impact: 'High',
        evidenceCount: 19,
        whyItMatters: 'Directly automates enterprise knowledge work without requiring specialized APIs.',
      },
      {
        id: 'tr-4',
        name: 'Optical Circuit Switching (OCS) Interconnects',
        description: 'Reconfigurable photonic data paths replacing traditional electrical switches in mega-datacenter clusters.',
        signalStrength: 87,
        direction: 'rising',
        impact: 'High',
        evidenceCount: 15,
        whyItMatters: 'Overcomes copper interconnect physical distance and thermal barriers at 100k+ GPU scale.',
      },
      {
        id: 'tr-5',
        name: 'Embodied World Foundation Models (Physical AI)',
        description: 'Large video and physics models simulating 3D real-world dynamics for robot zero-shot generalization.',
        signalStrength: 89,
        direction: 'rising',
        impact: 'High',
        evidenceCount: 18,
        whyItMatters: 'Unlocks general-purpose humanoid robots for manufacturing and logistics.',
      },
    ];

    // 5. Pre-seeded Primary Investigation for NVIDIA Blackwell B200 / Rubin (matching screenshots!)
    const nvidiaInvId = 'INV-2026-8942';
    const nvidiaReportId = 'RPT-2026-8942';

    const nvidiaEvidence: SourceEvidence[] = [
      {
        id: 'ev-1',
        investigationId: nvidiaInvId,
        type: 'web',
        title: 'NVIDIA Unveils Blackwell Ultra B200 & Next-Gen Rubin Architecture',
        url: 'https://nvidianews.nvidia.com/news/blackwell-architecture',
        source: 'nvidianews.nvidia.com',
        publishedAt: '2026-04-18',
        summary: 'NVIDIA officially announced volume production ramp for the Blackwell B200 and teased the Vera Rubin 3nm architecture featuring HBM4.',
        relevance: 98,
        confidence: 96,
        tags: ['Silicon', 'Blackwell', 'NVIDIA'],
      },
      {
        id: 'ev-2',
        investigationId: nvidiaInvId,
        type: 'research',
        title: 'Megatron-Scale: Ultra-Low Latency Interconnects for 100k+ GPU Clusters',
        url: 'https://arxiv.org/abs/2501.09842',
        source: 'arxiv.org',
        publishedAt: '2026-04-22',
        authors: ['NVIDIA Research', 'Stanford Collaborators'],
        abstract: 'Architectural paper detailing NVLink 5.0 topologies and pipeline scheduling algorithms for FP4 training runs.',
        summary: 'Proves high throughput scaling across 100,000 GPUs with sub-microsecond collective latency.',
        relevance: 95,
        confidence: 97,
        tags: ['Research', 'arXiv', 'NVLink'],
      },
      {
        id: 'ev-3',
        investigationId: nvidiaInvId,
        type: 'patent',
        title: 'US Patent 11,948,203: Dynamic Matrix Acceleration via Decompression Caches',
        url: 'https://patents.google.com/patent/US11948203B2/en',
        source: 'patents.google.com',
        publishedAt: '2026-04-10',
        summary: 'Hardware claims protecting low-precision tensor prefetching directly into L2 SRAM without CPU interrupt overhead.',
        relevance: 92,
        confidence: 94,
        tags: ['Patent', 'USPTO', 'FP4'],
      },
      {
        id: 'ev-4',
        investigationId: nvidiaInvId,
        type: 'web',
        title: 'Hyperscalers Commit $100B+ CapEx Allocation for Blackwell Racks',
        url: 'https://www.reuters.com/technology/nvidia-datacenter-orders-2026',
        source: 'reuters.com',
        publishedAt: '2026-04-25',
        summary: 'Tier-1 cloud providers report full allocation reservations through Q4 2026, confirming unprecedented commercial demand.',
        relevance: 94,
        confidence: 92,
        tags: ['Market', 'CapEx', 'Hyperscalers'],
      },
      {
        id: 'ev-5',
        investigationId: nvidiaInvId,
        type: 'research',
        title: 'FP4 Quantization Dynamics for 1T Parameter MoE Models',
        url: 'https://arxiv.org/abs/2502.14021',
        source: 'arxiv.org',
        publishedAt: '2026-04-28',
        authors: ['NVIDIA Applied AI Lab'],
        abstract: 'Theoretical evaluation of 2nd-gen Transformer Engine precision bounds with minimal perplexity degradation.',
        summary: 'Demonstrates 3.2x inference energy efficiency improvement over H100 FP8 baselines.',
        relevance: 93,
        confidence: 95,
        tags: ['Research', 'Quantization', 'MoE'],
      },
      {
        id: 'ev-6',
        investigationId: nvidiaInvId,
        type: 'patent',
        title: 'US Patent Application 2026/0129481: Optical Co-Packaged Switch Interconnect',
        url: 'https://patents.google.com/patent/US20260129481A1/en',
        source: 'patents.google.com',
        publishedAt: '2026-05-02',
        summary: 'Patent filing covering co-packaged optics (CPO) integrated directly into NVLink spine switch blades.',
        relevance: 90,
        confidence: 93,
        tags: ['Patent', 'Optics', 'Interconnect'],
      },
    ];

    const nvidiaReport: IntelligenceReport = {
      id: nvidiaReportId,
      investigationId: nvidiaInvId,
      competitor: 'NVIDIA',
      topic: 'Next-Gen AI Silicon & Accelerators (Blackwell B200 / Rubin)',
      objective: 'Investigate technical specifications, benchmark data, patent moats, and commercial delivery timelines for next-generation enterprise AI silicon.',
      threatScore: 91,
      threatLevel: 'CRITICAL',
      confidence: 91,
      executiveSummary: 'NVIDIA Blackwell B200 deployment demonstrates an insurmountable near-term hardware moat. Grounded multi-vector intelligence confirms accelerated delivery schedules, aggressive patent coverage in FP4 decompression caching, and total hyperscaler capacity allocation through late 2026.',
      finalAssessment: 'NVIDIA retains decisive leadership in accelerated AI compute through end-to-end silicon, networking, and software stack integration. Counter-strategies must focus on open-standard software compilers (Triton) and specialized inference ASIC partnerships.',
      investigationPeriod: 'Last 30 Days',
      subScores: {
        researchActivity: { score: 85, level: 'HIGH', change: '↑ 22% vs last 30 days' },
        patentActivity: { score: 74, level: 'HIGH', change: '↑ 14% vs last 30 days' },
        newsActivity: { score: 90, level: 'VERY HIGH', change: '↑ 31% vs last 30 days' },
        socialBuzz: { score: 76, level: 'HIGH', change: '↑ 18% vs last 30 days' },
        marketImpact: { score: 82, level: 'HIGH', change: '↑ 25% vs last 30 days' },
      },
      keyDevelopments: [
        {
          id: 'kd-1',
          title: 'Blackwell B200 enters full-scale commercial shipping with 20 PFLOPS FP4',
          description: 'Production yields stabilized at TSMC CoWoS packaging facilities, delivering 4x training and 30x inference uplift.',
          type: 'News',
          url: 'https://nvidianews.nvidia.com',
          impact: 'High',
          date: 'May 14, 2026',
        },
        {
          id: 'kd-2',
          title: 'arXiv preprint details 100,000-GPU distributed scaling with NVLink 5.0',
          description: 'Peer-reviewed architecture paper outlines collective communication algorithms operating at 1.8 TB/s per GPU.',
          type: 'Research',
          url: 'https://arxiv.org',
          impact: 'High',
          date: 'May 10, 2026',
        },
        {
          id: 'kd-3',
          title: 'USPTO grants patent for SRAM-assisted low-precision decompression caching',
          description: 'Key patent protects on-chip hardware engines that decompress weights on-the-fly directly into compute registers.',
          type: 'Patent',
          url: 'https://patents.google.com',
          impact: 'High',
          date: 'May 06, 2026',
        },
        {
          id: 'kd-4',
          title: 'Tier-1 hyperscalers lock up 90%+ of Blackwell data center allocation',
          description: 'Microsoft, Google Cloud, AWS, and Meta announce multi-billion dollar cluster commitments.',
          type: 'News',
          url: 'https://reuters.com',
          impact: 'High',
          date: 'May 02, 2026',
        },
        {
          id: 'kd-5',
          title: 'Patent application published for co-packaged optical switch blades',
          description: 'IP claims establish defensive protection for optical NVLink fabrics in next-gen Rubin systems.',
          type: 'Patent',
          url: 'https://patents.google.com',
          impact: 'Medium',
          date: 'Apr 28, 2026',
        },
      ],
      emergingTrends: [
        {
          id: 'et-1',
          name: 'Hardware-Assisted FP4 Tensor Compression',
          description: 'Direct silicon decompression bypassing memory bus saturation.',
          signalStrength: 95,
          direction: 'rising',
          impact: 'High',
          evidenceCount: 14,
          whyItMatters: 'Reduces power consumption and allows larger models to fit on single compute boards.',
        },
        {
          id: 'et-2',
          name: 'Co-Packaged Optics in Switch Fabrics',
          description: 'Integration of optical transceivers directly into GPU spine switches.',
          signalStrength: 91,
          direction: 'rising',
          impact: 'High',
          evidenceCount: 12,
          whyItMatters: 'Eliminates copper electrical reach limitations for mega-datacenter clusters.',
        },
        {
          id: 'et-3',
          name: 'NIMs Enterprise Containerization',
          description: 'Turnkey microservices packaging optimized models with CUDA runtimes.',
          signalStrength: 88,
          direction: 'rising',
          impact: 'High',
          evidenceCount: 16,
          whyItMatters: 'Creates recurring software licensing revenue on top of silicon sales.',
        },
      ],
      competitiveImpact: {
        summary: 'NVIDIA continues to monopolize hyperscale compute revenue. Software ecosystem lock-in (CUDA/NIMs) paired with aggressive silicon packaging creates massive defensive barriers.',
        impactLevel: 9,
        moatStrength: 'Critical (Full-Stack Hardware + Software + Networking)',
        timeline: '18-24 Months Sustained Leadership',
      },
      evidenceGaps: [
        'Detailed yield rates for TSMC 3nm Rubin test wafers',
        'Customer migration timelines from Hopper to Blackwell clusters in sovereign projects',
      ],
      recommendedActions: [
        {
          id: 'ra-1',
          title: 'Invest heavily in OpenAI Triton and open-standard compiler stacks',
          description: 'Erode CUDA lock-in by supporting portable kernels across non-NVIDIA silicon alternatives.',
          priority: 'High',
          category: 'Strategy & Software',
          timeline: 'Immediate (0-3 Months)',
        },
        {
          id: 'ra-2',
          title: 'Establish direct partnerships with custom ASIC providers for inference',
          description: 'Deploy specialized inference silicon (TPU/Trainium/Groq) for high-volume inference to lower dependency.',
          priority: 'High',
          category: 'Infrastructure',
          timeline: '3-6 Months',
        },
        {
          id: 'ra-3',
          title: 'Monitor Rubin patent publications quarterly',
          description: 'Establish automated alert triggers for optical interconnect and HBM4 patent filings.',
          priority: 'Medium',
          category: 'Intellectual Property',
          timeline: 'Ongoing',
        },
      ],
      sourceStats: {
        total: 18,
        newsCount: 9,
        researchCount: 5,
        patentCount: 4,
        topDomains: [
          { domain: 'nvidianews.nvidia.com', url: 'https://nvidianews.nvidia.com' },
          { domain: 'arxiv.org', url: 'https://arxiv.org' },
          { domain: 'patents.google.com', url: 'https://patents.google.com' },
          { domain: 'reuters.com', url: 'https://reuters.com' },
        ],
      },
      createdAt: new Date().toISOString(),
    };

    this.reports.set(nvidiaReportId, nvidiaReport);

    const nvidiaInv: Investigation = {
      id: nvidiaInvId,
      competitor: 'NVIDIA',
      topic: 'Next-Gen AI Silicon & Accelerators (Blackwell B200 / Rubin)',
      objective: 'Investigate technical specifications, benchmark data, patent moats, and commercial delivery timelines for next-generation enterprise AI silicon.',
      timeRange: 'Last 30 Days',
      priority: 'High',
      status: 'completed',
      currentAction: 'Completed',
      currentDecision: 'Comprehensive intelligence report synthesized with 91/100 threat score.',
      steps: [
        {
          id: 'step-1',
          investigationId: nvidiaInvId,
          stepNumber: 1,
          action: 'search_web',
          tool: 'Web Search',
          query: 'NVIDIA Blackwell B200 Rubin enterprise silicon announcement 2026',
          decisionSummary: 'I need recent competitor activity and market announcements.',
          reasonForAction: 'To establish current baseline commercial developments.',
          observationSummary: 'Found 12 relevant web sources including official NVIDIA newsroom releases and financial wire reports.',
          sourcesFound: 12,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed',
        },
        {
          id: 'step-2',
          investigationId: nvidiaInvId,
          stepNumber: 2,
          action: 'search_research',
          tool: 'Research Search',
          query: 'NVIDIA NVLink 5.0 FP4 Transformer Engine arXiv research paper',
          decisionSummary: 'I need technical research evidence and published scientific architectures.',
          reasonForAction: 'To verify technological depth and engineering capabilities.',
          observationSummary: 'Discovered 8 peer-reviewed research papers detailing 100k-GPU interconnect scaling and FP4 quantization dynamics.',
          sourcesFound: 8,
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          status: 'completed',
        },
        {
          id: 'step-3',
          investigationId: nvidiaInvId,
          stepNumber: 3,
          action: 'search_patents',
          tool: 'Patent Search',
          query: 'NVIDIA patent low precision tensor decompression hardware',
          decisionSummary: 'I need intellectual-property evidence to uncover proprietary protections.',
          reasonForAction: 'To evaluate patent moats and IP acceleration claims.',
          observationSummary: 'Identified 4 patent filings covering SRAM-assisted decompression caching and optical switch blades.',
          sourcesFound: 4,
          timestamp: new Date(Date.now() - 2400000).toISOString(),
          status: 'completed',
        },
        {
          id: 'step-4',
          investigationId: nvidiaInvId,
          stepNumber: 4,
          action: 'analyze_evidence',
          tool: 'Analyze Evidence',
          query: 'Synthesizing NVIDIA Blackwell competitive threat',
          decisionSummary: 'Reassessing collected evidence for threat signals and emerging trends.',
          reasonForAction: 'To calculate quantitative scores and identify evidence gaps.',
          observationSummary: 'Analyzed 18 grounded evidence items. Calculated 91/100 threat score and isolated 3 key emerging trends.',
          sourcesFound: 18,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: 'completed',
        },
        {
          id: 'step-5',
          investigationId: nvidiaInvId,
          stepNumber: 5,
          action: 'generate_report',
          tool: 'Generate Report',
          query: 'Synthesize final intelligence report #RPT-2026-8942',
          decisionSummary: 'I have sufficient multi-source evidence to produce the final intelligence report.',
          reasonForAction: 'Comprehensive grounding achieved across web, research, and patent registries.',
          observationSummary: 'Intelligence report synthesized with full threat gauge, subscores, and actionable recommendations.',
          sourcesFound: 18,
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          status: 'completed',
        },
      ],
      evidence: nvidiaEvidence,
      insights: [
        'NVIDIA demonstrates aggressive multi-vector execution across hardware, patents, and software.',
        'High technological momentum confirmed by recent scientific preprints and volume product ramps.',
        'Defensive software lock-in via CUDA and NIMs remains primary obstacle for competing accelerators.',
      ],
      reportId: nvidiaReportId,
      report: nvidiaReport,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 1200000).toISOString(),
    };

    this.investigations.set(nvidiaInvId, nvidiaInv);
  }
}

export const store = new Store();
