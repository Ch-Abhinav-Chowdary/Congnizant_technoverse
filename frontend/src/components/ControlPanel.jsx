import React from 'react';

export default function ControlPanel({
  simState,
  config,
  onStart,
  onStop,
  onReset,
  onConfigChange,
  onOptimize,
  isOptimizing,
}) {
  const isRunning = simState === 'running';
  const isDone    = simState === 'done';

  const updateMachine = (id, key, value) => {
    const machines = config.machines.map(m =>
      m.id === id ? { ...m, [key]: parseFloat(value) } : m
    );
    onConfigChange({ ...config, machines });
  };

  const cardClass = "bg-glass backdrop-blur-md border border-border rounded-[20px] p-5 transition-colors duration-250 ease-out hover:border-border-bright xl:row-span-3 xl:col-start-1";
  const cardTitleClass = "text-[0.7rem] font-semibold tracking-[1px] uppercase text-muted mb-4 flex items-center gap-1.5";
  const dotCyan = "w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan";
  const dotAmber = "w-1.5 h-1.5 rounded-full bg-amber shadow-glow-amber";
  const dotPurple = "w-1.5 h-1.5 rounded-full bg-purple shadow-glow-purple";

  const btnBase = "flex items-center justify-center gap-2 w-full py-3 px-5 rounded-xl font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-250 ease-out border border-transparent mb-2.5 disabled:opacity-40 disabled:cursor-not-allowed";
  const btnPrimary = `${btnBase} bg-gradient-to-br from-cyan to-[#0099bb] text-black border-cyan shadow-glow-cyan hover:-translate-y-[1px] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]`;
  const btnDanger = `${btnBase} bg-[rgba(255,68,102,0.15)] text-red border-[rgba(255,68,102,0.4)] hover:bg-[rgba(255,68,102,0.25)] hover:shadow-glow-red`;
  const btnGhost = `${btnBase} bg-white/5 text-secondary border-border hover:bg-white/10 hover:text-primary`;
  const btnOptimize = `${btnBase} bg-gradient-to-br from-[rgba(0,255,136,0.15)] to-[rgba(0,255,136,0.05)] text-green border-green/40 mt-1.5`;

  return (
    <div className={cardClass}>
      <div className={cardTitleClass}><span className={dotCyan} />Controls</div>

      {/* Buttons */}
      <button
        id="btn-start"
        className={btnPrimary}
        onClick={onStart}
        disabled={isRunning}
      >
        ▶ {isRunning ? 'Running…' : 'Start Simulation'}
      </button>

      <button
        id="btn-stop"
        className={btnDanger}
        onClick={onStop}
        disabled={!isRunning}
      >
        ■ Stop
      </button>

      <button
        id="btn-reset"
        className={btnGhost}
        onClick={onReset}
        disabled={isRunning}
      >
        ↺ Reset
      </button>

      <button
        id="btn-optimize"
        className={btnOptimize}
        onClick={onOptimize}
        disabled={isRunning || isOptimizing || simState === 'idle'}
      >
        {isOptimizing ? '⚙ Optimizing…' : '⚡ Run Optimization'}
      </button>

      {/* Arrival Rate */}
      <div className="mt-5">
        <div className={`${cardTitleClass} !mb-3`}>
          <span className={dotAmber} />
          Simulation Config
        </div>

        <div className="flex justify-between text-[0.78rem] text-secondary mb-1.5">
          <span>Arrival Rate</span>
          <span className="text-cyan font-mono text-[0.82rem]">{config.arrivalRate} items/s</span>
        </div>
        <input
          id="slider-arrival"
          type="range"
          className="slider"
          min="0.1"
          max="2"
          step="0.1"
          value={config.arrivalRate}
          onChange={e => onConfigChange({ ...config, arrivalRate: parseFloat(e.target.value) })}
          disabled={isRunning}
        />

        <div className="flex justify-between text-[0.78rem] text-secondary mb-1.5">
          <span>Duration</span>
          <span className="text-cyan font-mono text-[0.82rem]">{config.duration}s</span>
        </div>
        <input
          id="slider-duration"
          type="range"
          className="slider"
          min="30"
          max="300"
          step="10"
          value={config.duration}
          onChange={e => onConfigChange({ ...config, duration: parseFloat(e.target.value) })}
          disabled={isRunning}
        />
      </div>

      {/* Machine configs */}
      <div className="mt-5">
        <div className={`${cardTitleClass} !mb-3`}>
          <span className={dotPurple} />
          Machine Settings
        </div>

        {config.machines.map((m, i) => (
          <div key={m.id} className="bg-black/25 border border-border rounded-xl p-3.5 mb-2.5">
            <div className="text-[0.8rem] font-semibold text-primary mb-2">{m.name}</div>
            <div className="flex justify-between items-center text-[0.75rem] text-secondary mb-1.5">
              <span>Processing Time</span>
              <span className="text-cyan font-mono text-[0.78rem]">
                {m.processingTime}s
              </span>
            </div>
            <input
              id={`slider-machine-${m.id}`}
              type="range"
              className="slider"
              min="1"
              max="20"
              step="0.5"
              value={m.processingTime}
              onChange={e => updateMachine(m.id, 'processingTime', e.target.value)}
              disabled={isRunning}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-col gap-1.5">
        <div className={cardTitleClass}><span className="w-1.5 h-1.5 rounded-full bg-muted shadow-[0_0_6px_var(--tw-colors-muted)]" />Legend</div>
        {[
          { color: 'bg-cyan',   label: 'Active / Busy' },
          { color: 'bg-red',    label: 'Bottleneck' },
          { color: 'bg-green',  label: 'Idle' },
          { color: 'bg-amber',  label: 'High Queue' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-[0.72rem] text-secondary">
            <div className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
