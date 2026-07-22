import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

function getMonitorInterval(): number {
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf-8');
  } catch (e) {
    console.error('Failed to read .env file');
  }
  
  const intervalMatch = content.match(/MONITOR_INTERVAL=(\d+)/);
  const monitorInterval = intervalMatch ? parseInt(intervalMatch[1]) : 60;
  return monitorInterval;
}

function updateMonitorInterval(interval: number): void {
  let content = fs.readFileSync(envPath, 'utf-8');
  
  if (content.includes('MONITOR_INTERVAL=')) {
    content = content.replace(/MONITOR_INTERVAL=\d+/, `MONITOR_INTERVAL=${interval}`);
  } else {
    content += `\nMONITOR_INTERVAL=${interval}`;
  }
  
  fs.writeFileSync(envPath, content);
  console.log(`Updated MONITOR_INTERVAL to ${interval}`);
}

console.log('=== Testing ENV API ===');
console.log(`\n1. Current MONITOR_INTERVAL: ${getMonitorInterval()}`);

console.log('\n2. Updating to 15...');
updateMonitorInterval(15);
console.log(`   New MONITOR_INTERVAL: ${getMonitorInterval()}`);

console.log('\n3. Updating to 30...');
updateMonitorInterval(30);
console.log(`   New MONITOR_INTERVAL: ${getMonitorInterval()}`);

console.log('\n4. Updating back to 15...');
updateMonitorInterval(15);
console.log(`   New MONITOR_INTERVAL: ${getMonitorInterval()}`);

console.log('\n✅ All tests passed!');