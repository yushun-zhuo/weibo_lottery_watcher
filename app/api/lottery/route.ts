import { NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function GET() {
  let posts = storage.lotteryPosts.getAll();
  
  posts = posts.filter(post => post.postId && post.postId !== 'undefined');
  
  const seen = new Set<string>();
  posts = posts.filter(post => {
    const key = post.postId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  try {
    const { postContent } = await request.json();
    
    if (!postContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { detectLottery } = await import('@/lib/lotteryDetector');
    const result = detectLottery(postContent);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
