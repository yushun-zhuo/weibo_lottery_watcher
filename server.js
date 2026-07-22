require('dotenv').config();
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let lastRunMinute = -1;

function getMonitorInterval() {
  const envPath = path.join(__dirname, '.env');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf-8');
  } catch (e) {
    console.error('Failed to read .env file');
  }
  
  const intervalMatch = content.match(/MONITOR_INTERVAL=(\d+)/);
  return intervalMatch ? parseInt(intervalMatch[1]) : 60;
}

app.prepare().then(() => {
  const interval = getMonitorInterval();
  console.log(`Starting monitor with ${interval} minute interval...`);

  const { runMonitor } = require('./src/lib/monitor');
  runMonitor();

  cron.schedule('* * * * *', () => {
    const currentMinute = new Date().getMinutes();
    const interval = getMonitorInterval();
    
    if (currentMinute % interval === 0 && currentMinute !== lastRunMinute) {
      lastRunMinute = currentMinute;
      console.log(`Running monitor at ${new Date().toLocaleString()} (interval: ${interval}min)`);
      runMonitor();
    }
  });

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});