import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const COOKIE_FILE = path.join(process.cwd(), 'data', 'cookie.txt');

export async function POST(request: Request) {
  try {
    const { cookie } = await request.json();
    
    if (!cookie) {
      return NextResponse.json({ error: 'Cookie不能为空' }, { status: 400 });
    }

    if (!fs.existsSync(path.dirname(COOKIE_FILE))) {
      fs.mkdirSync(path.dirname(COOKIE_FILE), { recursive: true });
    }

    fs.writeFileSync(COOKIE_FILE, cookie);
    
    return NextResponse.json({ message: 'Cookie更新成功', cookieLength: cookie.length });
  } catch (error) {
    return NextResponse.json({ error: '更新失败', message: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookie = fs.readFileSync(COOKIE_FILE, 'utf-8');
      return NextResponse.json({ cookie: cookie, cookieLength: cookie.length, hasCookie: true });
    }
    return NextResponse.json({ cookie: '', cookieLength: 0, hasCookie: false });
  } catch (error) {
    return NextResponse.json({ cookie: '', cookieLength: 0, hasCookie: false });
  }
}
