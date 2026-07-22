import { NextResponse } from 'next/server';
import { storage } from '../../../lib/storage';

export async function GET() {
  const posts = storage.lotteryPosts.getAll();
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  try {
    const { postContent } = await request.json();
    
    if (!postContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { detectLottery } = await import('../../../lib/lotteryDetector');
    const result = detectLottery(postContent);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
