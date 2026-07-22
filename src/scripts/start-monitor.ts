import cron from 'node-cron';
import { runMonitor } from '../lib/monitor';

const interval = parseInt(process.env.MONITOR_INTERVAL || '5');

console.log(`Starting monitor with ${interval} minute interval...`);

runMonitor();

cron.schedule(`*/${interval} * * * *`, () => {
  runMonitor();
});
