import React from 'react';

export default function OptimizationPanel({ result }) {
  if (!result) return null;

  const { bottleneck, baseline, fixA, fixB, best, improvementPct, recommendation } = result;

  const bestResult = best === 'fixA' ? fixA : fixB;
  const otherResult = best === 'fixA' ? fixB : fixA;

  const cardTitleClass = "text-[0.7rem] font-semibold tracking-[1px] uppercase text-muted mb-4 flex items-center gap-1.5";
  const dotGreen = "w-1.5 h-1.5 rounded-full bg-green shadow-glow-green";

  return (
    <div className="mt-4">
      <div className={`${cardTitleClass} !mb-3.5`}>
        <span className={dotGreen} />
        Optimization Results
      </div>

      {/* Recommendation */}
      <div className="text-[0.82rem] font-bold text-green text-center p-2 bg-[rgba(0,255,136,0.06)] rounded-md border border-[rgba(0,255,136,0.2)] mb-3.5">
        ⚡ Best improvement: +{improvementPct}% throughput
      </div>

      <div className="text-[0.72rem] text-secondary p-2.5 bg-[rgba(0,255,136,0.04)] rounded-lg border border-[rgba(0,255,136,0.15)] mb-3.5 leading-relaxed">
        💡 {recommendation}
      </div>

      <div className="flex flex-col gap-2.5">
        {/* Baseline */}
        <div className="bg-black/25 border border-border rounded-xl p-3.5 transition-all duration-250 ease-out">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.82rem] font-semibold text-primary">📊 Baseline</span>
            <span className="font-mono text-[0.88rem] font-bold text-secondary">{baseline.throughput} /s</span>
          </div>
          <div className="text-[0.68rem] text-muted">
            {baseline.itemsOutput} items · No changes
          </div>
        </div>

        {/* Best */}
        <div className="bg-black/25 border border-green shadow-glow-green rounded-xl p-3.5 transition-all duration-250 ease-out">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.82rem] font-semibold text-primary">
              {best === 'fixA' ? '⚡ Speed +50%' : '🔀 Parallel Machine'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded-[20px] bg-[rgba(0,255,136,0.15)] text-green border border-[rgba(0,255,136,0.3)]">BEST</span>
              <span className="font-mono text-[0.88rem] font-bold text-green">{bestResult.throughput} /s</span>
            </div>
          </div>
          <div className="text-[0.68rem] text-muted">
            {bestResult.itemsOutput} items · +{improvementPct}% improvement
          </div>
        </div>

        {/* Alternative */}
        <div className="bg-black/25 border border-border rounded-xl p-3.5 transition-all duration-250 ease-out">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.82rem] font-semibold text-primary">
              {best !== 'fixA' ? '⚡ Speed +50%' : '🔀 Parallel Machine'}
            </span>
            <span className="font-mono text-[0.88rem] font-bold text-secondary">
              {otherResult.throughput} /s
            </span>
          </div>
          <div className="text-[0.68rem] text-muted">
            {otherResult.itemsOutput} items
          </div>
        </div>
      </div>

      {bottleneck && (
        <div className="mt-3.5 p-2.5 bg-[rgba(255,68,102,0.06)] rounded-lg border border-[rgba(255,68,102,0.2)] text-[0.72rem] text-secondary leading-relaxed">
          <span className="text-red font-semibold">⚠ {bottleneck.bottleneckName}</span>
          <br />{bottleneck.reason}
        </div>
      )}
    </div>
  );
}
