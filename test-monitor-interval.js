const fs = require('fs');
const path = require('path');

function updateMonitorInterval(interval) {
  const envPath = path.join(__dirname, '.env');
  let content = fs.readFileSync(envPath, 'utf-8');
  
  if (content.includes('MONITOR_INTERVAL=')) {
    content = content.replace(/MONITOR_INTERVAL=\d+/, `MONITOR_INTERVAL=${interval}`);
  } else {
    content += `\nMONITOR_INTERVAL=${interval}`;
  }
  
  fs.writeFileSync(envPath, content);
  console.log(`Updated MONITOR_INTERVAL to ${interval}`);
}

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

function simulateCron() {
  console.log('\n=== Simulating cron every minute ===');
  
  let minute = 0;
  const maxMinutes = 60;
  
  const interval = setInterval(() => {
    const currentInterval = getMonitorInterval();
    
    if (minute % currentInterval === 0) {
      console.log(`[Minute ${minute}] Running monitor (interval: ${currentInterval}min)`);
    } else {
      console.log(`[Minute ${minute}] Skip (interval: ${currentInterval}min)`);
    }
    
    if (minute === 10) {
      console.log('\n*** Changing interval to 15 minutes ***');
      updateMonitorInterval(15);
    }
    
    if (minute === 25) {
      console.log('\n*** Changing interval to 5 minutes ***');
      updateMonitorInterval(5);
    }
    
    minute++;
    
    if (minute >= maxMinutes) {
      clearInterval(interval);
      console.log('\n✅ Test completed!');
    }
  }, 200);
}

console.log('=== Testing dynamic monitor interval ===');
console.log(`Initial MONITOR_INTERVAL: ${getMonitorInterval()}`);

updateMonitorInterval(10);
console.log(`Set MONITOR_INTERVAL to 10`);

simulateCron();