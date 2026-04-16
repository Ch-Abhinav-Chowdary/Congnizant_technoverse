const { SimulationEngine } = require('./simulation/engine');
const { detectBottleneck }  = require('./simulation/bottleneck');

const eng = new SimulationEngine();
const res = eng.run();

console.log('=== SIMULATION RESULT ===');
console.log('Throughput:', res.summary.throughput, 'items/s');
console.log('Items output:', res.summary.itemsOutput);
console.log('Total items arrived:', res.summary.totalItems);
console.log('\nMachine summaries (raw):');
console.log(JSON.stringify(res.summary.machines, null, 2));

const bn = detectBottleneck(res.summary.machines);
console.log('\n=== BOTTLENECK ===');
console.log(JSON.stringify(bn, null, 2));
