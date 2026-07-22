import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST() {
  return new Promise<NextResponse>((resolve) => {
    exec('/usr/bin/pm2 restart weibo-lottery-watcher --update-env', {
      cwd: '/home/ubuntu/weibo_lottery_watcher',
      env: { ...process.env, HOME: '/home/ubuntu', PATH: `${process.env.PATH}:/usr/bin:/usr/local/bin` }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`重启失败: ${error.message}, stderr: ${stderr}`);
        resolve(NextResponse.json({ 
          success: false, 
          message: `重启失败: ${error.message}`,
          stderr: stderr
        }, { status: 500 }));
        return;
      }
      console.log(`重启成功: ${stdout}`);
      resolve(NextResponse.json({ success: true, message: '服务重启成功', output: stdout }));
    });
  });
}

export async function GET() {
  return new Promise<NextResponse>((resolve) => {
    exec('/usr/bin/pm2 status weibo-lottery-watcher', {
      cwd: '/home/ubuntu/weibo_lottery_watcher',
      env: { ...process.env, HOME: '/home/ubuntu', PATH: `${process.env.PATH}:/usr/bin:/usr/local/bin` }
    }, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ status: 'unknown', message: error.message }));
        return;
      }
      const status = stdout.includes('online') ? 'online' : 
                     stdout.includes('stopped') ? 'stopped' : 
                     stdout.includes('error') ? 'error' : 'unknown';
      resolve(NextResponse.json({ status, output: stdout }));
    });
  });
}