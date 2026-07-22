import { NextResponse } from 'next/server';
import { runMonitor } from '../../../lib/monitor';

export async function POST() {
  try {
    await runMonitor();
    return NextResponse.json({ message: 'Monitor run completed' });
  } catch (error) {
    return NextResponse.json({ error: 'Monitor failed' }, { status: 500 });
  }
}
