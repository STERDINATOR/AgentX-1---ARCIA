import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { store } from './server/store';
import { runAutonomousInvestigation } from './server/agent';
import { Investigation } from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      agentStatus: 'online',
      model: 'gemini-3.7-flash',
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Command Center Dashboard Stats
  app.get('/api/stats', (req, res) => {
    res.json(store.getDashboardStats());
  });

  // 3. Investigations API
  app.get('/api/investigations', (req, res) => {
    const list = Array.from(store.investigations.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(list);
  });

  app.get('/api/investigations/:id', (req, res) => {
    const inv = store.investigations.get(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }
    res.json(inv);
  });

  app.post('/api/investigations', async (req, res) => {
    const { competitor, topic, objective, timeRange, priority, autoRun } = req.body;
    if (!competitor || !topic || !objective) {
      return res.status(400).json({ error: 'competitor, topic, and objective are required.' });
    }

    const id = `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newInv: Investigation = {
      id,
      competitor: competitor.trim(),
      topic: topic.trim(),
      objective: objective.trim(),
      timeRange: timeRange || 'Last 30 Days',
      priority: priority || 'High',
      status: 'queued',
      currentAction: 'Queued',
      currentDecision: 'Investigation scheduled. Ready to initialize autonomous agent.',
      steps: [],
      evidence: [],
      insights: [],
      createdAt: new Date().toISOString(),
    };

    store.investigations.set(id, newInv);
    await store.recordInvestigationState(newInv);

    if (autoRun) {
      runAutonomousInvestigation(id).catch(err => {
        console.error(`Autonomous investigation ${id} failed:`, err);
      });
    }

    res.status(201).json(newInv);
  });

  app.post('/api/investigations/:id/run', async (req, res) => {
    const inv = store.investigations.get(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    // Run autonomously in background
    runAutonomousInvestigation(inv.id).catch(err => {
      console.error(`Autonomous investigation ${inv.id} failed:`, err);
    });

    res.json({ message: 'Investigation started', status: 'running', id: inv.id });
  });

  app.post('/api/investigations/:id/stop', (req, res) => {
    const inv = store.investigations.get(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }
    inv.status = 'stopped';
    inv.currentAction = 'Stopped by user';
    store.broadcastInvestigationEvent(inv.id, {
      type: 'status',
      status: 'stopped',
      investigation: inv,
    });
    res.json({ message: 'Investigation stopped', id: inv.id });
  });

  // Real-Time Server-Sent Events (SSE) Stream for Live Agent Monitor
  app.get('/api/investigations/:id/events', (req, res) => {
    const { id } = req.params;
    const inv = store.investigations.get(id);

    if (!inv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'initial', investigation: inv })}\n\n`);

    const unsubscribe = store.subscribeToInvestigation(id, event => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (err) {
        console.error('SSE write error:', err);
      }
    });

    // 15-second heartbeat ping to keep connection alive through cloud proxies
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (e) {
        clearInterval(heartbeatInterval);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
      res.end();
    });
  });

  // 4. Reports API
  app.get('/api/reports', (req, res) => {
    const list = Array.from(store.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(list);
  });

  app.get('/api/reports/:id', (req, res) => {
    const report = store.reports.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  });

  // 5. Competitors API
  app.get('/api/competitors', (req, res) => {
    const list = Array.from(store.competitors.values());
    res.json(list);
  });

  app.get('/api/competitors/:name', (req, res) => {
    const nameParam = decodeURIComponent(req.params.name).toLowerCase();
    const competitor = Array.from(store.competitors.values()).find(
      c => c.name.toLowerCase().includes(nameParam) || nameParam.includes(c.name.toLowerCase())
    );
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }
    res.json(competitor);
  });

  // 6. Topics API
  app.get('/api/topics', (req, res) => {
    const list = Array.from(store.topics.values());
    res.json(list);
  });

  // 7. Alerts API
  app.get('/api/alerts', (req, res) => {
    res.json(store.alerts);
  });

  app.post('/api/alerts/:id/read', (req, res) => {
    const alert = store.alerts.find(a => a.id === req.params.id);
    if (alert) {
      alert.read = true;
    }
    res.json({ success: true, alert });
  });

  // 8. Trends API
  app.get('/api/trends', (req, res) => {
    res.json(store.trends);
  });

  // 9. Sources API (Evidence)
  app.get('/api/sources', (req, res) => {
    const allEvidence: any[] = [];
    store.investigations.forEach(inv => {
      inv.evidence.forEach(e => allEvidence.push(e));
    });
    res.json(allEvidence);
  });

  // 10. Watchlist API
  app.get('/api/watchlist', (req, res) => {
    res.json(Array.from(store.watchlist));
  });

  app.post('/api/watchlist/toggle', (req, res) => {
    const { name } = req.body;
    if (store.watchlist.has(name)) {
      store.watchlist.delete(name);
    } else {
      store.watchlist.add(name);
    }
    res.json({ watchlist: Array.from(store.watchlist) });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARCIA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
