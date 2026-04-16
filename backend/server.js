'use strict';

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { SimulationEngine } = require('./simulation/engine');
const { detectBottleneck, detectBottleneckFromTick } = require('./simulation/bottleneck');
const { runOptimization } = require('./simulation/optimizer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────────────────────────────────────
// Default Factory Config
// ──────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  arrivalRate: 0.5,   // items/sec arriving at Machine A
  duration:    120,   // seconds
  tickSize:    1,
  machines: [
    { id: 'A', name: 'Machine A', processingTime: 3,  capacity: 50 },
    { id: 'B', name: 'Machine B', processingTime: 8,  capacity: 50 },  // bottleneck
    { id: 'C', name: 'Machine C', processingTime: 2,  capacity: 50 },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// Live Simulation State (streamed via WebSocket)
// ──────────────────────────────────────────────────────────────────────────────
let liveEngine    = null;
let liveConfig    = { ...DEFAULT_CONFIG };
let liveInterval  = null;
let liveTickIndex = 0;
let liveResult    = null;

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1 /* OPEN */) client.send(msg);
  });
}

function startLiveStream(config) {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = null;
  }

  liveConfig    = { ...DEFAULT_CONFIG, ...config };
  liveEngine    = new SimulationEngine(liveConfig);
  liveResult    = liveEngine.run();   // pre-compute all ticks
  liveTickIndex = 0;

  broadcast({ type: 'SIM_START', config: liveConfig, totalTicks: liveResult.ticks.length });

  // Stream pre-computed ticks at 100ms per tick (real-time-feel)
  liveInterval = setInterval(() => {
    if (liveTickIndex >= liveResult.ticks.length) {
      clearInterval(liveInterval);
      liveInterval = null;

      const bottleneck = detectBottleneck(liveResult.summary.machines);
      broadcast({ type: 'SIM_DONE', summary: liveResult.summary, bottleneck });
      return;
    }

    const tick       = liveResult.ticks[liveTickIndex++];
    const bottleneck = detectBottleneckFromTick(tick.machines);

    broadcast({ type: 'SIM_TICK', tick, bottleneck });
  }, 100);
}

function stopLiveStream() {
  if (liveInterval) {
    clearInterval(liveInterval);
    liveInterval = null;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// WebSocket: handle commands from frontend
// ──────────────────────────────────────────────────────────────────────────────
wss.on('connection', ws => {
  console.log('🔌 Client connected');

  // Send current config on connect
  ws.send(JSON.stringify({ type: 'CONNECTED', config: liveConfig }));

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      switch (msg.command) {
        case 'START':
          startLiveStream(msg.config || {});
          break;
        case 'STOP':
          stopLiveStream();
          broadcast({ type: 'SIM_STOPPED' });
          break;
        case 'RESET':
          stopLiveStream();
          liveConfig = { ...DEFAULT_CONFIG };
          broadcast({ type: 'SIM_RESET', config: liveConfig });
          break;
      }
    } catch (e) {
      console.error('WS message error:', e.message);
    }
  });

  ws.on('close', () => console.log('❌ Client disconnected'));
});

// ──────────────────────────────────────────────────────────────────────────────
// REST Endpoints
// ──────────────────────────────────────────────────────────────────────────────

/** GET /api/health */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

/** GET /api/config */
app.get('/api/config', (_req, res) => res.json(DEFAULT_CONFIG));

/**
 * POST /api/simulate
 * Body: optional config override
 * Returns: full simulation result (ticks + summary + events)
 */
app.post('/api/simulate', (req, res) => {
  try {
    const config = { ...DEFAULT_CONFIG, ...req.body };
    const engine = new SimulationEngine(config);
    const result = engine.run();
    const bottleneck = detectBottleneck(result.summary.machines);
    res.json({ ...result, bottleneck });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/optimize
 * Body: optional config override
 * Returns: baseline + fix scenarios + best recommendation
 */
app.post('/api/optimize', (req, res) => {
  try {
    const config = { ...DEFAULT_CONFIG, ...req.body };
    const result = runOptimization(config);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/bottleneck
 * Returns bottleneck from last completed simulation
 */
app.get('/api/bottleneck', (_req, res) => {
  if (!liveResult) {
    return res.status(404).json({ error: 'No simulation run yet' });
  }
  res.json(detectBottleneck(liveResult.summary.machines));
});

// ──────────────────────────────────────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏭 Digital Twin backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${PORT}`);
});