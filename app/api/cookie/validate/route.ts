import { NextResponse } from 'next/server';
import { validateCookie, getCookie } from '@/lib/weibo';

export async function POST(request: Request) {
  try {
    const { cookie } = await request.json();
    
    if (!cookie) {
      return NextResponse.json({ error: 'Cookie不能为空' }, { status: 400 });
    }
    
    const result = await validateCookie(cookie);
    
    return NextResponse.json({
      valid: result.valid,
      message: result.message,
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, message: '验证失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookie = getCookie();
    const result = await validateCookie(cookie);
    
    return NextResponse.json({
      valid: result.valid,
      message: result.message,
      hasCookie: cookie.length > 0,
    });
  } catch (error) {
    return NextResponse.json({
      valid: false,
      message: '验证失败: ' + (error as Error).message,
      hasCookie: false,
    });
  }
}