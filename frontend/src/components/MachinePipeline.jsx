import React from 'react';

const MACHINE_ICONS = { A: '⚙️', B: '🏭', C: '🔧' };

function MachineBox({ machine, isBottleneck, isRunning }) {
  const queuePct = Math.min((machine.queueLength / machine.capacity) * 100, 100);
  const isHighQueue = queuePct > 60;

  let borderColor = 'border-border';
  let shadow = '';
  let glowBg = '';
  let anim = '';
  
  if (isBottleneck) {
    borderColor = 'border-red';
    shadow = 'shadow-glow-red';
    glowBg = 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,68,102,0.12),transparent)] opacity-100';
    anim = 'animate-bottleneck-pulse';
  } else if (machine.status === 'busy') {
    borderColor = 'border-cyan';
    shadow = 'shadow-glow-cyan';
    glowBg = 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,212,255,0.08),transparent)] opacity-100';
  }

  const badge = isBottleneck ? 'bottleneck' : machine.status;
  const badgeLabel = isBottleneck ? '⚠ Bottleneck' : machine.status.toUpperCase();
  
  let badgeClass = '';
  if (badge === 'idle') badgeClass = 'bg-[rgba(100,110,200,0.15)] text-muted';
  else if (badge === 'busy') badgeClass = 'bg-[rgba(0,212,255,0.15)] text-cyan';
  else if (badge === 'bottleneck') badgeClass = 'bg-[rgba(255,68,102,0.2)] text-red';

  return (
    <div className={`w-full max-w-[155px] bg-card border-2 rounded-xl p-4 text-center transition-all duration-250 ease-out relative overflow-hidden ${borderColor} ${shadow} ${anim}`} id={`machine-${machine.id}`}>
      {/* Background glow overlay */}
      <div className={`absolute inset-0 rounded-[inherit] transition-all duration-250 ease-out ${glowBg} ${glowBg ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative z-10">
        <div className="text-[1.8rem] mb-1.5">{MACHINE_ICONS[machine.id] || '⚙️'}</div>
        <div className="text-[0.82rem] font-bold text-primary">{machine.name}</div>
        <span className={`inline-block text-[0.62rem] font-semibold tracking-[0.5px] uppercase px-2 py-0.5 rounded-[20px] mt-1.5 ${badgeClass}`}>
          {badgeLabel}
        </span>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex justify-between text-[0.68rem] text-secondary">
            <span>Queue</span>
            <span className="font-mono text-primary">{machine.queueLength || 0}</span>
          </div>
          <div className="flex justify-between text-[0.68rem] text-secondary">
            <span>Processed</span>
            <span className="font-mono text-primary">{machine.itemsProcessed || 0}</span>
          </div>
          <div className="flex justify-between text-[0.68rem] text-secondary">
            <span>Utilization</span>
            <span className="font-mono text-primary">{machine.utilization || '0.0'}%</span>
          </div>
          <div className="flex justify-between text-[0.68rem] text-secondary">
            <span>Proc. Time</span>
            <span className="font-mono text-primary">{machine.processingTime}s</span>
          </div>
        </div>

        <div className="mt-2 h-1 bg-base rounded overflow-hidden">
          <div
            className={`h-full rounded transition-[width] duration-300 ease-out bg-gradient-to-r ${isHighQueue ? 'from-amber to-red' : 'from-cyan to-purple'}`}
            style={{ width: `${queuePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function IONode({ type, label, count }) {
  const isInput = type === 'input';
  const nodeClass = isInput 
    ? 'bg-[rgba(0,255,136,0.08)] border-2 border-[rgba(0,255,136,0.3)] text-green'
    : 'bg-[rgba(168,85,247,0.08)] border-2 border-[rgba(168,85,247,0.3)] text-purple';

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className={`w-[70px] h-[70px] rounded-full flex flex-col items-center justify-center text-[0.65rem] font-semibold uppercase tracking-[0.5px] gap-1 ${nodeClass}`}>
        <span className="text-[1.2rem]">{isInput ? '📦' : '✅'}</span>
        {label}
      </div>
      <div className="text-[0.68rem] text-muted text-center">
        {count !== undefined && <span className="font-mono text-primary">{count} items</span>}
      </div>
    </div>
  );
}

function Connector({ isRunning, itemsPerSec }) {
  return (
    <div className="flex flex-col items-center justify-center flex-[0_0_48px] relative">
      <div className="h-[2px] w-full bg-gradient-to-r from-border via-cyan to-border relative overflow-visible">
        {isRunning && <div className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_10px_var(--tw-colors-cyan-DEFAULT)] absolute -top-[3px] animate-flow-item" />}
        <div className="absolute -right-1.5 -top-[5px] w-0 h-0 border-l-[8px] border-l-cyan border-y-[5px] border-y-transparent" />
      </div>
      {itemsPerSec !== undefined && (
        <div className="text-[0.6rem] text-muted mt-1">
          {itemsPerSec}/s
        </div>
      )}
    </div>
  );
}

export default function MachinePipeline({ machines, bottleneckId, isRunning, itemsOutput, itemCounter }) {
  const cardClass = "bg-glass backdrop-blur-md border border-border rounded-[20px] p-5 transition-colors duration-250 ease-out hover:border-border-bright col-start-2 row-start-1";
  const cardTitleClass = "text-[0.7rem] font-semibold tracking-[1px] uppercase text-muted mb-4 flex items-center gap-1.5";
  const dotCyan = "w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan";

  if (!machines || machines.length === 0) {
    return (
      <div className={cardClass}>
        <div className={cardTitleClass}><span className={dotCyan} />Factory Pipeline</div>
        <div className="text-center text-muted p-12 text-[0.85rem]">
          <div className="text-[3rem] mb-3">🏭</div>
          Start simulation to see live factory pipeline
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className={cardTitleClass}>
        <span className={dotCyan} />
        Factory Pipeline
        <span className="ml-auto text-[0.65rem] text-muted normal-case tracking-normal">
          Input → Machine A → Machine B → Machine C → Output
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 py-6 px-2 relative">
        <IONode type="input" label="INPUT" count={itemCounter} />
        <Connector isRunning={isRunning} />

        {machines.map((machine, i) => (
          <React.Fragment key={machine.id}>
            <div className="flex flex-col items-center gap-2 flex-1">
              <MachineBox
                machine={machine}
                isBottleneck={machine.id === bottleneckId}
                isRunning={isRunning}
              />
            </div>
            {i < machines.length - 1 && <Connector isRunning={isRunning} />}
          </React.Fragment>
        ))}

        <Connector isRunning={isRunning} />
        <IONode type="output" label="OUTPUT" count={itemsOutput} />
      </div>
    </div>
  );
}
