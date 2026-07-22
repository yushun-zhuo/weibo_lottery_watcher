import { NextResponse } from 'next/server';
import { storage } from '../../../lib/storage';

export async function GET() {
  const bloggers = storage.monitoredBloggers.getAll();
  return NextResponse.json(bloggers);
}

export async function POST(request: Request) {
  try {
    const { bloggerId, bloggerName } = await request.json();
    
    if (!bloggerId || !bloggerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const blogger = storage.monitoredBloggers.create({
      userId: 1,
      bloggerId,
      bloggerName,
      lastPostId: null,
    });
    
    return NextResponse.json(blogger, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const deleted = storage.monitoredBloggers.delete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Blogger not found' }, { status: 404 });
    }
    
    return NextResponse.json(deleted);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
