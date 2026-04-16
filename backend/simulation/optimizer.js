'use strict';

const { SimulationEngine } = require('./engine');
const { detectBottleneck } = require('./bottleneck');

/**
 * Rule-Based Optimization Engine
 *
 * Strategy:
 *  1. Run baseline simulation → detect bottleneck
 *  2. Try Fix A: Increase bottleneck machine speed by 50%
 *  3. Try Fix B: Add parallel machine (halve effective processing time)
 *  4. Compare results → pick best
 */

/**
 * Run baseline + two optimized scenarios and return comparison.
 *
 * @param {object} baseConfig  - same config object passed to SimulationEngine
 * @returns {{ baseline, fixA, fixB, best, improvement }}
 */
const DEFAULT_MACHINES = [
  { id: 'A', name: 'Machine A', processingTime: 3,  capacity: 50 },
  { id: 'B', name: 'Machine B', processingTime: 8,  capacity: 50 },
  { id: 'C', name: 'Machine C', processingTime: 2,  capacity: 50 },
];

function runOptimization(baseConfig) {
  // Merge with defaults so machines array is always present
  const fullConfig = {
    arrivalRate: 0.5,
    duration: 120,
    tickSize: 1,
    machines: DEFAULT_MACHINES,
    ...baseConfig,
    machines: (baseConfig.machines && baseConfig.machines.length > 0)
      ? baseConfig.machines
      : DEFAULT_MACHINES,
  };

  // ── Baseline ──────────────────────────────────────────────────────────────
  const baseEngine = new SimulationEngine(fullConfig);
  const baseResult = baseEngine.run();
  const bottleneck  = detectBottleneck(baseResult.summary.machines);

  if (!bottleneck.bottleneckId) {
    return { error: 'No bottleneck detected', baseline: baseResult };
  }

  // ── Fix A: Speed +50% on bottleneck ────────────────────────────────────────
  const configA = _cloneConfig(fullConfig);
  const machineA = configA.machines.find(m => m.id === bottleneck.bottleneckId);
  if (machineA) machineA.processingTime = +(machineA.processingTime * 0.67).toFixed(2);

  const engineA  = new SimulationEngine(configA);
  const resultA  = engineA.run();

  // ── Fix B: Parallel machine (duplicate bottleneck, half processing time) ───
  const configB = _cloneConfig(fullConfig);
  const machineB = configB.machines.find(m => m.id === bottleneck.bottleneckId);
  if (machineB) machineB.processingTime = +(machineB.processingTime * 0.5).toFixed(2);

  const engineB  = new SimulationEngine(configB);
  const resultB  = engineB.run();

  // ── Compare ────────────────────────────────────────────────────────────────
  const baseTP = parseFloat(baseResult.summary.throughput);
  const aTP    = parseFloat(resultA.summary.throughput);
  const bTP    = parseFloat(resultB.summary.throughput);

  const best   = aTP >= bTP ? 'fixA' : 'fixB';
  const bestTP = Math.max(aTP, bTP);
  const improvementPct = baseTP > 0
    ? (((bestTP - baseTP) / baseTP) * 100).toFixed(1)
    : '0';

  return {
    bottleneck,
    baseline: _summarise(baseResult, 'Baseline'),
    fixA: _summarise(resultA, 'Speed +50%', machineA?.processingTime, bottleneck.bottleneckId, configA),
    fixB: _summarise(resultB, 'Parallel Machine', machineB?.processingTime, bottleneck.bottleneckId, configB),
    best,
    improvementPct,
    recommendation: `${best === 'fixA' ? 'Increase speed of' : 'Add parallel machine for'} ${bottleneck.bottleneckName} → throughput improves by ${improvementPct}%`,
  };
}

function _summarise(result, label, newProcessingTime, machineId, cfg) {
  const machines = result.summary.machines.map(m => ({
    id: m.id,
    name: m.name,
    queueLength: m.finalQueueLength,
    utilization: m.utilizationPct + '%',
    processingTime: m.processingTime,
  }));

  return {
    label,
    throughput: result.summary.throughput,
    itemsOutput: result.summary.itemsOutput,
    machines,
    config: cfg ? { machines: cfg.machines } : undefined,
  };
}

function _cloneConfig(cfg) {
  return JSON.parse(JSON.stringify(cfg));
}

module.exports = { runOptimization };
