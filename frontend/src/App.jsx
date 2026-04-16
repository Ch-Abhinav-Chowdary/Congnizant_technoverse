import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

import ControlPanel from './components/ControlPanel';
import MachinePipeline from './components/MachinePipeline';
import MetricsPanel from './components/MetricsPanel';
import EventLog from './components/EventLog';
import OptimizationPanel from './components/OptimizationPanel';

const WS_URL = 'ws://localhost:3000';
const API_URL  = 'http://localhost:3000';

const DEFAULT_CONFIG = {
  arrivalRate: 0.5,
  duration:    120,
  tickSize:    1,
  machines: [
    { id: 'A', name: 'Machine A', processingTime: 3,  capacity: 50 },
    { id: 'B', name: 'Machine B', processingTime: 8,  capacity: 50 },
    { id: 'C', name: 'Machine C', processingTime: 2,  capacity: 50 },
  ],
};

export default function App() {
  /* ── Connection ───────────────────────────────────────────────────── */
  const ws           = useRef(null);
  const [wsStatus, setWsStatus] = useState('disconnected'); // disconnected | connected | error

  /* ── Simulation state ─────────────────────────────────────────────── */
  const [simState, setSimState]   = useState('idle');       // idle | running | done
  const [config,   setConfig]     = useState(DEFAULT_CONFIG);
  const [machines, setMachines]   = useState([]);
  const [bottleneck, setBottleneck] = useState(null);
  const [metrics,  setMetrics]    = useState({
    throughput: '0', itemsOutput: 0, itemsInSystem: 0, simTime: 0,
    duration: DEFAULT_CONFIG.duration, itemCounter: 0, machines: [],
  });
  const [events,   setEvents]     = useState([]);
  const [simProgress, setSimProgress] = useState(0);
  const [sparkData, setSparkData] = useState([]);
  const [totalTicks, setTotalTicks] = useState(0);

  /* ── Optimization ─────────────────────────────────────────────────── */
  const [optResult, setOptResult]    = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  /* ── WebSocket setup ──────────────────────────────────────────────── */
  const connectWS = useCallback(() => {
    if (ws.current && ws.current.readyState < 2) return;

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      console.log('✅ WS connected');
      setWsStatus('connected');
    };

    socket.onclose = () => {
      console.log('❌ WS disconnected, retrying in 3s…');
      setWsStatus('disconnected');
      setTimeout(connectWS, 3000);
    };

    socket.onerror = () => setWsStatus('error');

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (err) {
        console.error('WS parse error', err);
      }
    };
  }, []);

  useEffect(() => {
    connectWS();
    return () => ws.current?.close();
  }, [connectWS]);

  /* ── Message handler ──────────────────────────────────────────────── */
  const handleMessage = (msg) => {
    switch (msg.type) {
      case 'CONNECTED':
        break;

      case 'SIM_START':
        setSimState('running');
        setEvents([]);
        setSparkData([]);
        setOptResult(null);
        setBottleneck(null);
        setTotalTicks(msg.totalTicks || 0);
        break;

      case 'SIM_TICK': {
        const { tick, bottleneck: bn } = msg;
        setMachines(tick.machines || []);
        setBottleneck(bn);
        setMetrics(prev => ({
          ...prev,
          throughput:    tick.throughput,
          itemsOutput:   tick.itemsOutput,
          itemsInSystem: tick.itemsInSystem,
          simTime:       tick.time,
          machines:      tick.machines || [],
        }));

        setSimProgress(prev => {
          const pct = totalTicks > 0
            ? (tick.time / config.duration) * 100
            : prev;
          return Math.min(pct, 100);
        });

        setSparkData(prev => {
          const next = [...prev, parseFloat(tick.throughput)];
          return next.slice(-40); // keep last 40 data points
        });
        break;
      }

      case 'SIM_DONE':
        setSimState('done');
        setSimProgress(100);
        if (msg.bottleneck) setBottleneck(msg.bottleneck);
        if (msg.summary) {
          setMetrics(prev => ({
            ...prev,
            throughput:  msg.summary.throughput,
            itemsOutput: msg.summary.itemsOutput,
            itemCounter: msg.summary.totalItems,
            machines:    msg.summary.machines.map(m => ({
              ...m,
              queueLength: m.finalQueueLength,
              utilization: m.utilizationPct,
            })),
          }));
        }
        break;

      case 'SIM_STOPPED':
        setSimState('idle');
        break;

      case 'SIM_RESET':
        setSimState('idle');
        setMachines([]);
        setMetrics({
          throughput: '0', itemsOutput: 0, itemsInSystem: 0, simTime: 0,
          duration: config.duration, itemCounter: 0, machines: [],
        });
        setEvents([]);
        setSparkData([]);
        setBottleneck(null);
        setOptResult(null);
        setSimProgress(0);
        break;

      default:
        break;
    }
  };

  /* ── Controls ─────────────────────────────────────────────────────── */
  const sendWS = (msg) => {
    if (ws.current?.readyState === 1) {
      ws.current.send(JSON.stringify(msg));
    }
  };

  const handleStart = () => {
    setMetrics(prev => ({ ...prev, duration: config.duration }));
    sendWS({ command: 'START', config });
  };

  const handleStop  = () => sendWS({ command: 'STOP' });
  const handleReset = () => sendWS({ command: 'RESET' });

  const handleConfigChange = (newCfg) => {
    setConfig(newCfg);
    setMetrics(prev => ({ ...prev, duration: newCfg.duration }));
  };

  /* ── Optimization ─────────────────────────────────────────────────── */
  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptResult(null);
    try {
      const res = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setOptResult(data);
    } catch (err) {
      console.error('Optimization failed:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  /* ── Derived ──────────────────────────────────────────────────────── */
  const wsStatusLabel = {
    connected:    'Connected',
    disconnected: 'Disconnected',
    error:        'Error',
  }[wsStatus] || wsStatus;

  const statusDotClass = simState === 'running'
    ? 'bg-cyan shadow-glow-cyan animate-pulse-dot'
    : wsStatus === 'connected' ? 'bg-green shadow-glow-green' : 'bg-muted';

  const simStatusLabel = simState === 'running'
    ? 'Simulation Running'
    : simState === 'done'
    ? 'Simulation Complete'
    : `WS: ${wsStatusLabel}`;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-8 h-16 bg-base/85 backdrop-blur-[20px] border-b border-border sticky top-0 z-[100]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan to-purple rounded-[10px] flex items-center justify-center text-lg">🏭</div>
          <div>
            <div className="text-[1.05rem] font-bold tracking-[-0.3px] bg-gradient-to-r from-cyan to-purple bg-clip-text text-transparent">Manufacturing Digital Twin</div>
            <div className="text-[0.7rem] text-muted tracking-wide uppercase">Factory Simulation & Optimization</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[0.78rem] text-secondary">
          <div className={`w-2 h-2 rounded-full transition-all duration-250 ease-out ${statusDotClass}`} />
          <span>{simStatusLabel}</span>
          {simState === 'running' && (
            <span className="font-mono text-cyan text-[0.72rem]">
              t={metrics.simTime}s
            </span>
          )}
        </div>
      </header>

      {/* Dashboard: 3-column grid */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-5 p-5 max-w-[1600px] mx-auto w-full">
        {/* Col 1 — Controls */}
        <ControlPanel
          simState={simState}
          config={config}
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
          onConfigChange={handleConfigChange}
          onOptimize={handleOptimize}
          isOptimizing={isOptimizing}
        />

        {/* Col 2 Row 1 — Pipeline */}
        <MachinePipeline
          machines={machines}
          bottleneckId={bottleneck?.id}
          isRunning={simState === 'running'}
          itemsOutput={metrics.itemsOutput}
          itemCounter={metrics.itemCounter || metrics.itemsOutput}
        />

        {/* Col 2 Row 2 — Metrics */}
        <MetricsPanel
          metrics={metrics}
          bottleneck={bottleneck}
          simProgress={simProgress}
          sparkData={sparkData}
        />

        {/* Col 2 Row 3 — Optimization Results (appears after optimize) */}
        {optResult && (
          <div className="bg-glass backdrop-blur-md border border-border rounded-[20px] p-5 transition-colors duration-250 ease-out hover:border-border-bright xl:col-start-2 xl:row-start-3">
            <OptimizationPanel result={optResult} />
          </div>
        )}

        {/* Col 3 — Event Log */}
        <EventLog events={events} />
      </main>
    </div>
  );
}
