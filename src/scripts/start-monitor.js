require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const http = require('http');

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

function triggerMonitor() {
  const options = {
    hostname: 'localhost',
    port: process.env.PORT || 3000,
    path: '/api/cron',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Monitor triggered: ${data}`);
    });
  });

  req.on('error', (e) => {
    console.error(`Error triggering monitor: ${e.message}`);
  });

  req.end();
}

const interval = getMonitorInterval();
console.log(`Starting monitor scheduler with ${interval} minute interval...`);

triggerMonitor();

cron.schedule('* * * * *', () => {
  const currentMinute = new Date().getMinutes();
  const interval = getMonitorInterval();
  
  if (currentMinute % interval === 0 && currentMinute !== lastRunMinute) {
    lastRunMinute = currentMinute;
    console.log(`Triggering monitor at ${new Date().toLocaleString()} (interval: ${interval}min)`);
    triggerMonitor();
  }
});