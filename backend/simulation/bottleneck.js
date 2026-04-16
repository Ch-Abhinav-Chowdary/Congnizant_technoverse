'use strict';

/**
 * Bottleneck Detection
 *
 * A "bottleneck" is the machine that is constraining overall throughput.
 * Detection criteria (weighted scoring):
 *   1. Highest queue length relative to capacity
 *   2. Highest utilization %
 *   3. Longest processing time
 */

/**
 * Detect bottleneck from an array of machine summaries (from engine result).
 *
 * @param {Array} machines  - machineSummaries from SimulationEngine result
 * @returns {{ bottleneckId, bottleneckName, reason, scores, recommendation }}
 */
function detectBottleneck(machines) {
  if (!machines || machines.length === 0) {
    return { bottleneckId: null, reason: 'No machines', scores: [] };
  }

  const scores = machines.map(m => {
    const utilScore    = parseFloat(m.utilizationPct || 0);
    const queueScore   = (m.finalQueueLength || 0) * 10;   // weight queue heavily
    const timeScore    = (m.processingTime || 0) * 5;
    const total        = utilScore + queueScore + timeScore;
    return { id: m.id, name: m.name, utilScore, queueScore, timeScore, total };
  });

  scores.sort((a, b) => b.total - a.total);
  const top = scores[0];

  // Human-readable reason
  let reason = '';
  if (top.queueScore >= top.utilScore * 2) {
    reason = `${top.name} has the longest queue (${Math.round(top.queueScore / 10)} items), causing upstream congestion.`;
  } else if (top.utilScore >= 80) {
    reason = `${top.name} is running at ${top.utilScore.toFixed(1)}% utilization — fully saturated.`;
  } else {
    reason = `${top.name} has the highest combined load (queue + utilization + processing time).`;
  }

  return {
    bottleneckId: top.id,
    bottleneckName: top.name,
    reason,
    scores,
    recommendation: `Focus optimization on ${top.name}: increase processing speed or add a parallel machine.`,
  };
}

/**
 * Detect bottleneck from a live tick snapshot (real-time use).
 * @param {Array} machineTick  - machines array from a tick snapshot
 */
function detectBottleneckFromTick(machineTick) {
  if (!machineTick || machineTick.length === 0) return null;

  let maxScore = -1;
  let bottleneck = null;

  for (const m of machineTick) {
    const score = (m.queueLength * 10) + parseFloat(m.utilization || 0);
    if (score > maxScore) {
      maxScore = score;
      bottleneck = m;
    }
  }

  return bottleneck
    ? { id: bottleneck.id, name: bottleneck.name, queueLength: bottleneck.queueLength, utilization: bottleneck.utilization }
    : null;
}

module.exports = { detectBottleneck, detectBottleneckFromTick };
