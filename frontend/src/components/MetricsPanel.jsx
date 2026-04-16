import React from 'react';

function MetricCard({ icon, value, label, color, barPct, unit = '' }) {
  let afterBorder = '';
  let valueColor = '';
  let barColor = '';
  
  if (color === 'cyan') {
    afterBorder = 'after:bg-cyan';
    valueColor = 'text-cyan';
    barColor = 'bg-cyan';
  } else if (color === 'green') {
    afterBorder = 'after:bg-green';
    valueColor = 'text-green';
    barColor = 'bg-green';
  } else if (color === 'amber') {
    afterBorder = 'after:bg-amber';
    valueColor = 'text-amber';
    barColor = 'bg-amber';
  } else if (color === 'red') {
    afterBorder = 'after:bg-red';
    valueColor = 'text-red';
    barColor = 'bg-red';
  }

  return (
    <div className={`bg-black/25 border border-border rounded-xl p-4 text-center transition-all duration-250 ease-out relative overflow-hidden after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-b-xl ${afterBorder}`}>
      <div className="text-[1.4rem] mb-1.5">{icon}</div>
      <div className={`text-[1.8rem] font-extrabold font-mono leading-none mb-1 ${valueColor}`}>
        {value}<span className="text-[0.65em] opacity-70">{unit}</span>
      </div>
      <div className="text-[0.68rem] text-muted uppercase tracking-[0.5px]">{label}</div>
      {barPct !== undefined && (
        <div className="mt-2.5 h-[3px] bg-base rounded-[3px] overflow-hidden">
          <div className={`h-full rounded-[3px] transition-[width] duration-400 ease-out ${barColor}`} style={{ width: `${Math.min(barPct, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

export default function MetricsPanel({ metrics, bottleneck, simProgress, sparkData }) {
  const {
    throughput    = '0',
    itemsOutput   = 0,
    itemsInSystem = 0,
    simTime       = 0,
    duration      = 120,
  } = metrics;

  const cardClass = "bg-glass backdrop-blur-md border border-border rounded-[20px] p-5 transition-colors duration-250 ease-out hover:border-border-bright col-start-2 row-start-2";
  const cardTitleClass = "text-[0.7rem] font-semibold tracking-[1px] uppercase text-muted mb-4 flex items-center gap-1.5";
  const dotCyan = "w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan";
  const dotPurple = "w-1.5 h-1.5 rounded-full bg-purple shadow-glow-purple";
  const dotGreen = "w-1.5 h-1.5 rounded-full bg-green shadow-glow-green";

  return (
    <div className={cardClass}>
      <div className={cardTitleClass}>
        <span className={dotCyan} />
        Live Metrics
        <span className="ml-auto font-mono text-[0.7rem] text-cyan normal-case tracking-normal">
          t = {simTime}s
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] bg-card rounded-[3px] overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-cyan to-purple rounded-[3px] transition-[width] duration-100 ease-linear" style={{ width: `${simProgress}%` }} />
      </div>

      {/* Bottleneck banner */}
      {bottleneck && bottleneck.id && (
        <div className="flex items-start gap-3 py-3 px-4 bg-[rgba(255,68,102,0.08)] border border-[rgba(255,68,102,0.3)] rounded-xl mb-3.5 animate-slide-in">
          <span className="text-[1.2rem] shrink-0">⚠️</span>
          <div>
            <div className="text-[0.8rem] font-bold text-red mb-1">Bottleneck Detected: {bottleneck.name}</div>
            <div className="text-[0.72rem] text-secondary leading-snug">
              Queue: {bottleneck.queueLength} items · Utilization: {bottleneck.utilization}
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[0.85rem]">
        <MetricCard
          icon="⚡"
          value={parseFloat(throughput).toFixed(3)}
          unit=" /s"
          label="Throughput"
          color="cyan"
          barPct={parseFloat(throughput) * 100}
        />
        <MetricCard
          icon="✅"
          value={itemsOutput}
          label="Items Output"
          color="green"
          barPct={(itemsOutput / Math.max(metrics.itemCounter || 1, 1)) * 100}
        />
        <MetricCard
          icon="📦"
          value={itemsInSystem}
          label="In System"
          color="amber"
          barPct={(itemsInSystem / 50) * 100}
        />
        <MetricCard
          icon="⏱"
          value={`${simTime}s`}
          label="Sim Time"
          color="red"
          barPct={(simTime / (duration || 120)) * 100}
        />
      </div>

      {/* Per-machine stats */}
      {metrics.machines && metrics.machines.length > 0 && (
        <div className="mt-4">
          <div className={`${cardTitleClass} !mb-2.5`}>
            <span className={dotPurple} />
            Machine Stats
          </div>
          <div className="flex gap-[0.65rem]">
            {metrics.machines.map(m => (
              <div
                key={m.id}
                className="flex-1 bg-black/25 rounded-[10px] p-3 border border-border text-center"
              >
                <div className="text-[0.75rem] font-bold text-primary mb-1.5">{m.name}</div>
                <div className="text-[1.2rem] font-extrabold font-mono text-cyan">
                  {m.utilization || '0.0'}%
                </div>
                <div className="text-[0.62rem] text-muted">Utilization</div>
                <div className="h-[3px] bg-base rounded-[3px] mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-[3px] transition-[width] duration-300 ease-out ${parseFloat(m.utilization) > 80 ? 'bg-red' : 'bg-gradient-to-r from-cyan to-purple'}`} style={{ width: `${Math.min(parseFloat(m.utilization) || 0, 100)}%` }} />
                </div>
                <div className="text-[0.62rem] text-muted mt-1.5">
                  Q: {m.queueLength || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spark chart */}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-4">
          <div className={`${cardTitleClass} !mb-2`}>
            <span className={dotGreen} />
            Throughput Trend
          </div>
          <div className="col-start-2 row-start-3 flex items-end gap-[2px] h-[60px] px-1">
            {sparkData.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-gradient-to-b from-cyan to-purple opacity-70 transition-[height] duration-300 ease-out min-h-[2px]"
                style={{ height: `${Math.max((v / Math.max(...sparkData, 0.001)) * 100, 2)}%` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
