import React from 'react';

const EVENT_LABELS = {
  ITEM_ARRIVE:  'ARRIVE',
  MACHINE_START:'START',
  MACHINE_DONE: 'DONE',
  ITEM_EXIT:    'EXIT',
};

export default function EventLog({ events }) {
  // Show most recent first
  const displayed = [...events].reverse().slice(0, 80);

  const getEventStyle = (type) => {
    switch (type) {
      case 'ITEM_ARRIVE': return 'border-l-green text-green';
      case 'MACHINE_START': return 'border-l-cyan text-cyan';
      case 'MACHINE_DONE': return 'border-l-purple text-purple';
      case 'ITEM_EXIT': return 'border-l-amber text-amber';
      default: return 'border-l-border text-primary';
    }
  };

  const cardClass = "bg-glass backdrop-blur-md border border-border rounded-[20px] p-5 transition-colors duration-250 ease-out hover:border-border-bright xl:col-start-3 xl:row-span-3";
  const cardTitleClass = "text-[0.7rem] font-semibold tracking-[1px] uppercase text-muted mb-4 flex items-center gap-1.5";
  const dotAmber = "w-1.5 h-1.5 rounded-full bg-amber shadow-glow-amber";

  return (
    <div className={cardClass}>
      <div className={cardTitleClass}>
        <span className={dotAmber} />
        Event Log
        <span className="ml-auto text-[0.65rem] text-muted normal-case tracking-normal">
          {events.length} events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-muted text-[0.78rem] pt-8">
          <div className="text-[2rem] mb-2">📋</div>
          Events will appear here<br />during simulation
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-1">
          {displayed.map((ev, i) => {
            const eventStyle = getEventStyle(ev.type);
            return (
              <div
                key={`${ev.type}-${ev.time}-${i}`}
                className={`flex gap-2 py-2 px-2.5 bg-black/20 border-l-[2px] rounded-md text-[0.72rem] animate-slide-in ${eventStyle.split(' ')[0]}`}
              >
                <span className="font-mono text-muted shrink-0 w-9">{ev.time}s</span>
                <span className={`font-semibold shrink-0 w-[70px] ${eventStyle.split(' ')[1]}`}>
                  {EVENT_LABELS[ev.type] || ev.type}
                </span>
                <span className="text-secondary flex-1 leading-snug">
                  {ev.machineName
                    ? `${ev.machineName} • ${ev.itemId}`
                    : ev.itemId}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
