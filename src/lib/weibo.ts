import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://m.weibo.cn';
const WEB_BASE_URL = 'https://weibo.com';
const COOKIE_FILE = path.join(process.cwd(), 'data', 'cookie.txt');

interface WeiboPost {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    screen_name: string;
  };
}

const extractXsrfToken = (cookie: string): string => {
  const match = cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : '';
};

export const getCookie = (): string => {
  if (fs.existsSync(COOKIE_FILE)) {
    return fs.readFileSync(COOKIE_FILE, 'utf-8');
  }
  return process.env.WEIBO_COOKIE || '';
};

export const validateCookie = async (cookie: string): Promise<{ valid: boolean; message: string }> => {
  if (!cookie || cookie.length < 100) {
    return { valid: false, message: 'Cookie为空或长度不足' };
  }
  
  if (!cookie.includes('_T_WM=')) {
    return { valid: false, message: '缺少必需的_T_WM字段' };
  }
  
  if (!cookie.includes('XSRF-TOKEN=')) {
    return { valid: false, message: '缺少必需的XSRF-TOKEN字段' };
  }
  
  try {
    const xsrfToken = extractXsrfToken(cookie);
    
    const response = await axios.get(`${BASE_URL}/api/container/getIndex`, {
      params: {
        type: 'uid',
        value: '123456789',
        containerid: '107603123456789',
        page: 1,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Cookie': cookie,
        'Referer': `${BASE_URL}/u/123456789`,
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken,
      },
      timeout: 10000,
    });
    
    const data = response.data;
    
    if (data && data.ok === 0) {
      const errorCode = data.data?.errno || data.errno;
      if (errorCode === 100006 || errorCode === 100008) {
        return { valid: false, message: 'Cookie已过期或无效' };
      }
    }
    
    return { valid: true, message: 'Cookie有效' };
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      if (status === 403 || status === 401) {
        return { valid: false, message: 'Cookie认证失败' };
      }
    }
    return { valid: false, message: 'Cookie验证失败: ' + (error.message || '未知错误') };
  }
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
};

export const fetchBloggerPosts = async (bloggerId: string): Promise<WeiboPost[]> => {
  const cookie = getCookie();
  
  try {
    console.log(`Fetching posts for blogger: ${bloggerId}, cookie length: ${cookie.length}`);
    
    const xsrfToken = extractXsrfToken(cookie);
    console.log('XSRF-TOKEN extracted:', xsrfToken.length > 0 ? 'YES' : 'NO');
    
    const hasTWM = cookie.includes('_T_WM=');
    console.log('_T_WM cookie present:', hasTWM);
    
    const response = await axios.get(`${BASE_URL}/api/container/getIndex`, {
      params: {
        type: 'uid',
        value: bloggerId,
        containerid: `107603${bloggerId}`,
        page: 1,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Cookie': cookie,
        'Referer': `${BASE_URL}/u/${bloggerId}`,
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken,
      },
      timeout: 15000,
    });

    console.log('Response status:', response.status);
    console.log('Response data type:', typeof response.data);
    
    if (typeof response.data === 'object') {
      console.log('Response keys:', Object.keys(response.data));
      console.log('Response data:', JSON.stringify(response.data).substring(0, 500));
    }

    if (response.data.ok === -100) {
      console.error('Authentication failed: Cookie expired or invalid');
      throw new Error('Cookie authentication failed');
    }

    const cards = response.data.data?.cards || [];
    console.log('Cards found:', cards.length);
    
    const posts: WeiboPost[] = [];

    for (const card of cards) {
      if (card.card_type === 9 && card.mblog) {
        posts.push({
          id: card.mblog.idstr || card.mblog.id?.toString() || '',
          content: card.mblog.text,
          created_at: card.mblog.created_at,
          user: {
            id: card.mblog.user.idstr || card.mblog.user.id?.toString() || '',
            screen_name: card.mblog.user.screen_name,
          },
        });
      }
    }

    console.log('Posts extracted:', posts.length);
    return posts;
  } catch (error: any) {
    console.error('Failed to fetch blogger posts:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const getPostUrl = (postId: string): string => {
  return `${BASE_URL}/status/${postId}`;
};

export const getMobilePostUrl = (postId: string): string => {
  return `${BASE_URL}/status/${postId}`;
};
