'use strict';

/**
 * Discrete-Event Simulation Engine
 * Models a 3-machine factory pipeline: Input → A → B → C → Output
 *
 * Each machine has:
 *   - processingTime  (seconds per item)
 *   - capacity        (max items in queue)
 *   - status          (idle | busy | failed)
 *   - queue           (items waiting)
 *   - itemsProcessed  (total done)
 *   - totalBusyTime   (seconds spent processing — for utilization %)
 */

class Machine {
  constructor({ id, name, processingTime, capacity = 50 }) {
    this.id = id;
    this.name = name;
    this.processingTime = processingTime; // seconds per item
    this.capacity = capacity;
    this.status = 'idle'; // idle | busy | failed
    this.queue = [];        // items waiting
    this.currentItem = null;
    this.itemsProcessed = 0;
    this.totalBusyTime = 0;
    this.finishTime = 0;    // simulation clock time when current item finishes
  }

  get queueLength() { return this.queue.length; }

  get utilization() {
    return this.totalBusyTime;   // raw accumulation; caller divides by elapsed
  }

  enqueue(item) {
    if (this.queue.length >= this.capacity) return false; // dropped
    this.queue.push(item);
    return true;
  }

  /** Try to start processing next item at time `now`. Returns event or null. */
  tryStart(now) {
    if (this.status === 'busy' || this.queue.length === 0) return null;
    this.currentItem = this.queue.shift();
    this.status = 'busy';
    this.finishTime = now + this.processingTime;
    return {
      type: 'MACHINE_START',
      time: now,
      machineId: this.id,
      machineName: this.name,
      itemId: this.currentItem.id,
    };
  }

  /** Finish current item at time `now`. Returns [doneEvent, item]. */
  finish(now) {
    this.itemsProcessed++;
    this.totalBusyTime += now - (this.finishTime - this.processingTime);
    const item = this.currentItem;
    this.currentItem = null;
    this.status = 'idle';
    return {
      type: 'MACHINE_DONE',
      time: now,
      machineId: this.id,
      machineName: this.name,
      itemId: item.id,
      item,
    };
  }

  snapshot() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      processingTime: this.processingTime,
      queueLength: this.queueLength,
      itemsProcessed: this.itemsProcessed,
      capacity: this.capacity,
    };
  }
}

class SimulationEngine {
  /**
   * @param {object} config
   * @param {number} config.arrivalRate  - items arriving per second
   * @param {object[]} config.machines   - [{id,name,processingTime,capacity}]
   * @param {number} config.duration     - total sim duration in seconds
   * @param {number} config.tickSize     - seconds per step (resolution)
   */
  constructor(config = {}) {
    this.arrivalRate  = config.arrivalRate  ?? 0.5;   // items/sec
    this.duration     = config.duration     ?? 120;    // seconds
    this.tickSize     = config.tickSize     ?? 1;      // seconds per tick
    this.machineConfigs = config.machines ?? [
      { id: 'A', name: 'Machine A', processingTime: 3  },
      { id: 'B', name: 'Machine B', processingTime: 8  },  // bottleneck by default
      { id: 'C', name: 'Machine C', processingTime: 2  },
    ];

    this.reset();
  }

  reset() {
    this.clock = 0;
    this.itemCounter = 0;
    this.itemsOutput = 0;
    this.nextArrivalTime = 0;
    this.events = [];           // full event log
    this.ticks = [];            // state snapshot per tick
    this.machines = this.machineConfigs.map(cfg => new Machine(cfg));
    this._running = false;
  }

  /** Run full simulation synchronously. Returns { ticks, events, summary }. */
  run() {
    this.reset();
    this._running = true;

    while (this.clock <= this.duration) {
      this._step();
      this.clock += this.tickSize;
    }

    this._running = false;
    return this._buildResult();
  }

  /** Advance simulation by one tick. */
  _step() {
    const now = this.clock;

    // 1. Arrivals
    while (this.nextArrivalTime <= now) {
      const item = { id: `item-${++this.itemCounter}`, arrivedAt: this.nextArrivalTime };
      this.machines[0].enqueue(item);
      this.events.push({ type: 'ITEM_ARRIVE', time: now, itemId: item.id });
      this.nextArrivalTime += 1 / this.arrivalRate;
    }

    // 2. Check machine completions
    for (let i = 0; i < this.machines.length; i++) {
      const machine = this.machines[i];
      if (machine.status === 'busy' && now >= machine.finishTime) {
        const doneEvent = machine.finish(now);
        this.events.push(doneEvent);

        // Pass to next machine or output
        const next = this.machines[i + 1];
        if (next) {
          next.enqueue(doneEvent.item);
        } else {
          this.itemsOutput++;
          this.events.push({ type: 'ITEM_EXIT', time: now, itemId: doneEvent.item.id });
        }
      }
    }

    // 3. Start idle machines
    for (const machine of this.machines) {
      const startEvent = machine.tryStart(now);
      if (startEvent) this.events.push(startEvent);
    }

    // 4. Snapshot this tick
    this.ticks.push({
      time: now,
      machines: this.machines.map(m => ({
        ...m.snapshot(),
        utilization: now > 0 ? ((m.totalBusyTime / now) * 100).toFixed(1) : '0.0',
      })),
      itemsInSystem: this.machines.reduce((s, m) => s + m.queueLength + (m.status === 'busy' ? 1 : 0), 0),
      itemsOutput: this.itemsOutput,
      throughput: now > 0 ? (this.itemsOutput / now).toFixed(3) : '0',
    });
  }

  _buildResult() {
    const elapsedNonZero = this.duration || 1;

    const machineSummaries = this.machines.map(m => ({
      id: m.id,
      name: m.name,
      processingTime: m.processingTime,
      itemsProcessed: m.itemsProcessed,
      finalQueueLength: m.queueLength,
      utilizationPct: ((m.totalBusyTime / elapsedNonZero) * 100).toFixed(1),
    }));

    return {
      config: {
        arrivalRate: this.arrivalRate,
        duration: this.duration,
        tickSize: this.tickSize,
      },
      summary: {
        totalItems: this.itemCounter,
        itemsOutput: this.itemsOutput,
        throughput: (this.itemsOutput / elapsedNonZero).toFixed(3),
        machines: machineSummaries,
      },
      ticks: this.ticks,
      events: this.events.slice(-200), // last 200 events
    };
  }
}

module.exports = { SimulationEngine, Machine };
