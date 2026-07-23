require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

let lastRunMinute = -1;

function getMonitorInterval() {
  const envPath = path.join(__dirname, '../../.env');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf-8');
  } catch (e) {
    console.error('Failed to read .env file');
  }
  
  const intervalMatch = content.match(/MONITOR_INTERVAL=(\d+)/);
  return intervalMatch ? parseInt(intervalMatch[1]) : 60;
}

function runMonitor() {
  const { runMonitor: monitorFunc } = require('../lib/monitor');
  return monitorFunc().then(() => {
    console.log(`Monitor completed at ${new Date().toLocaleString()}`);
  }).catch((error) => {
    console.error(`Monitor failed: ${error.message}`);
  });
}

const interval = getMonitorInterval();
console.log(`Starting monitor scheduler with ${interval} minute interval...`);

runMonitor();

cron.schedule('* * * * *', () => {
  const currentMinute = new Date().getMinutes();
  const interval = getMonitorInterval();
  
  if (currentMinute % interval === 0 && currentMinute !== lastRunMinute) {
    lastRunMinute = currentMinute;
    console.log(`Triggering monitor at ${new Date().toLocaleString()} (interval: ${interval}min)`);
    runMonitor();
  }
});