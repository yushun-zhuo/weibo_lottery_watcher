import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const envPath = path.join(process.cwd(), '.env');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf-8');
  } catch (e) {
    console.error('Failed to read .env file');
  }
  
  const intervalMatch = content.match(/MONITOR_INTERVAL=(\d+)/);
  const monitorInterval = intervalMatch ? parseInt(intervalMatch[1]) : 60;
  
  return NextResponse.json({
    weiboCookie: process.env.WEIBO_COOKIE ? 'SET' : 'NOT SET',
    feishuWebhook: process.env.FEISHU_WEBHOOK_URL ? 'SET' : 'NOT SET',
    cookieLength: process.env.WEIBO_COOKIE?.length || 0,
    monitorInterval,
  });
}

export async function POST(request: Request) {
  const { monitorInterval } = await request.json();
  
  const envPath = path.join(process.cwd(), '.env');
  let content = fs.readFileSync(envPath, 'utf-8');
  
  if (content.includes('MONITOR_INTERVAL=')) {
    content = content.replace(/MONITOR_INTERVAL=\d+/, `MONITOR_INTERVAL=${monitorInterval}`);
  } else {
    content += `\nMONITOR_INTERVAL=${monitorInterval}`;
  }
  
  fs.writeFileSync(envPath, content);
  
  return NextResponse.json({ message: '检测周期更新成功', monitorInterval });
}