import { storage } from './storage';
import { fetchBloggerPosts, getPostUrl, stripHtml, getCookie, validateCookie } from './weibo';
import { detectLottery } from './lotteryDetector';
import { sendFeishuNotification } from './feishu';
import fs from 'fs';
import path from 'path';

const getFeishuWebhook = (): string => {
  if (process.env.FEISHU_WEBHOOK_URL) {
    return process.env.FEISHU_WEBHOOK_URL;
  }
  
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/FEISHU_WEBHOOK_URL=(.+)/);
      if (match) return match[1];
    }
  }
  return '';
};

let lastCookieErrorNotification = 0;
const NOTIFICATION_INTERVAL = 3600000;

const sendCookieErrorNotification = async (message: string): Promise<void> => {
  const now = Date.now();
  if (now - lastCookieErrorNotification < NOTIFICATION_INTERVAL) {
    console.log('Cookie error notification skipped (too soon)');
    return;
  }
  
  const feishuWebhook = getFeishuWebhook();
  if (!feishuWebhook) {
    console.log('FEISHU_WEBHOOK_URL not set, skipping notification');
    return;
  }
  
  try {
    await sendFeishuNotification(feishuWebhook, {
      bloggerName: '系统通知',
      bloggerId: 'system',
      postUrl: '',
      content: `微博Cookie失效，监控已暂停！\n\n错误信息: ${message}\n\n请访问 http://<服务器IP>:3000 更新Cookie。`,
      prizes: [],
      deadline: null,
      conditions: [],
      confidence: 1,
    });
    lastCookieErrorNotification = now;
    console.log('Cookie error notification sent');
  } catch (error) {
    console.error('Failed to send cookie error notification:', error);
  }
};

export const runFullScan = async (): Promise<void> => {
  console.log('Starting full scan...');
  
  const bloggers = storage.monitoredBloggers.getAll();
  if (bloggers.length === 0) {
    console.log('No bloggers to monitor');
    return;
  }

  for (const blogger of bloggers) {
    storage.monitoredBloggers.updateByBloggerId(blogger.bloggerId, { lastPostId: null });
    console.log(`Reset lastPostId for ${blogger.bloggerName}`);
  }

  await runMonitor();
  
  console.log('Full scan completed');
};

export const runMonitor = async (): Promise<void> => {
  console.log('Starting monitor run...');
  const feishuWebhook = getFeishuWebhook();
  console.log('FEISHU_WEBHOOK_URL loaded:', feishuWebhook.length > 0 ? 'SET' : 'NOT SET');
  
  const cookie = getCookie();
  const cookieValidation = await validateCookie(cookie);
  console.log('Cookie validation:', cookieValidation);
  
  if (!cookieValidation.valid) {
    console.error(`Cookie invalid: ${cookieValidation.message}`);
    await sendCookieErrorNotification(cookieValidation.message);
    return;
  }
  
  const bloggers = storage.monitoredBloggers.getAll();
  if (bloggers.length === 0) {
    console.log('No bloggers to monitor');
    return;
  }

  for (const blogger of bloggers) {
    console.log(`Checking posts for ${blogger.bloggerName} (${blogger.bloggerId})`);
    
    const posts = await fetchBloggerPosts(blogger.bloggerId);
    console.log(`Fetched ${posts.length} posts`);
    
    for (const post of posts) {
      if (!post.id) continue;
      
      if (blogger.lastPostId && post.id <= blogger.lastPostId) {
        continue;
      }

      const existingPost = storage.lotteryPosts.getByPostId(post.id);
      if (existingPost) {
        continue;
      }

      const cleanContent = stripHtml(post.content);
      const lotteryResult = await detectLottery(cleanContent);
      console.log(`Post ${post.id}: isLottery=${lotteryResult.isLottery}, confidence=${lotteryResult.confidence}`);
      
      if (lotteryResult.isLottery) {
        console.log(`Found lottery post: ${post.id}`);
        
        const savedPost = storage.lotteryPosts.create({
          bloggerId: post.user.id,
          bloggerName: post.user.screen_name,
          postId: post.id,
          postContent: cleanContent,
          postUrl: getPostUrl(post.id),
          prizes: lotteryResult.prizes,
          deadline: lotteryResult.deadline,
          confidence: lotteryResult.confidence,
        });
        
        if (savedPost && feishuWebhook) {
          const success = await sendFeishuNotification(feishuWebhook, {
            bloggerName: post.user.screen_name,
            bloggerId: post.user.id,
            postUrl: getPostUrl(post.id),
            content: cleanContent,
            prizes: lotteryResult.prizes,
            deadline: lotteryResult.deadline,
            conditions: lotteryResult.conditions,
            confidence: lotteryResult.confidence,
          });
          
          if (success) {
            console.log('Notification sent successfully');
            storage.notifications.create({
              lotteryPostId: savedPost.id,
              sent: true,
              sentAt: new Date().toISOString(),
            });
          }
        }
      }
      
      if (!blogger.lastPostId || post.id > blogger.lastPostId) {
        storage.monitoredBloggers.updateByBloggerId(blogger.bloggerId, { lastPostId: post.id });
      }
    }
  }
  
  console.log('Monitor run completed');
};
