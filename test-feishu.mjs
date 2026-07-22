import axios from 'axios';
import fs from 'fs';
import path from 'path';

const envFile = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envFile, 'utf-8');
const match = envContent.match(/FEISHU_WEBHOOK_URL=(.+)/);
const FEISHU_WEBHOOK_URL = match ? match[1] : '';

async function testFeishu() {
  console.log('=== 测试飞书通知 ===\n');
  console.log('FEISHU_WEBHOOK_URL:', FEISHU_WEBHOOK_URL ? '已配置' : '未配置');
  
  if (!FEISHU_WEBHOOK_URL) {
    console.log('请在.env.local中配置FEISHU_WEBHOOK_URL');
    return;
  }
  
  const card = {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true,
        enable_forward: true,
      },
      header: {
        title: {
          tag: 'plain_text',
          content: '🎁 发现转发抽奖',
        },
        template: 'red',
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '**博主**: 测试账号\n**置信度**: 95%',
          },
        },
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content: '**奖品**: 测试奖品',
          },
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                tag: 'plain_text',
                content: '立即参与',
              },
              url: 'https://m.weibo.cn/status/1234567890',
              type: 'primary',
            },
          ],
        },
      ],
    },
  };
  
  try {
    const response = await axios.post(FEISHU_WEBHOOK_URL, card);
    console.log('飞书通知发送成功!');
    console.log('响应:', response.data);
  } catch (error) {
    console.error('飞书通知发送失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testFeishu().catch(console.error);
