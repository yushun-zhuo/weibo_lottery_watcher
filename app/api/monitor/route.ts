import { NextResponse } from 'next/server';
import { runMonitor, runFullScan } from '@/lib/monitor';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.fullScan) {
      await runFullScan();
      return NextResponse.json({ message: 'Full scan completed' });
    }
    
    await runMonitor();
    return NextResponse.json({ message: 'Monitor run completed' });
  } catch (error: any) {
    if (error.message === 'Cookie authentication failed') {
      return NextResponse.json(
        { error: 'cookie_invalid', message: '微博Cookie无效，请重新获取' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Monitor failed', message: error.message }, { status: 500 });
  }
}
