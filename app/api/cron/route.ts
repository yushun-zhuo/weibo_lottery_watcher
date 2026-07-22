import { NextResponse } from 'next/server';
import { runMonitor } from '@/lib/monitor';

let isRunning = false;

export async function GET() {
  return NextResponse.json({ 
    status: 'running', 
    lastRun: new Date().toLocaleString() 
  });
}

export async function POST() {
  if (isRunning) {
    return NextResponse.json({ error: 'Monitor is already running' }, { status: 400 });
  }
  
  isRunning = true;
  try {
    await runMonitor();
    return NextResponse.json({ success: true, message: 'Monitor completed' });
  } finally {
    isRunning = false;
  }
}