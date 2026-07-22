import axios from 'axios';
import fs from 'fs';
import path from 'path';

const envFile = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envFile, 'utf-8');
const match = envContent.match(/FEISHU_WEBHOOK_URL=(.+)/);
const FEISHU_WEBHOOK_URL = match ? match[1] : '';

async function testDirect() {
  console.log('=== 直接测试飞书通知 ===\n');
  
  if (!FEISHU_WEBHOOK_URL) {
    console.log('FEISHU_WEBHOOK_URL未配置');
    return;
  }
  
  console.log('Webhook URL:', FEISHU_WEBHOOK_URL);
  console.log('URL长度:', FEISHU_WEBHOOK_URL.length);
  
  const message = {
    msg_type: 'text',
    content: {
      text: '🎁 测试通知\n\n博主: 测试账号\n置信度: 95%\n奖品: 测试手机\n\n点击参与: https://m.weibo.cn/status/1234567890',
    },
  };
  
  try {
    console.log('\n发送请求...');
    const response = await axios.post(FEISHU_WEBHOOK_URL, message, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data));
    
    if (response.data.code === 0) {
      console.log('\n✅ 飞书通知发送成功！');
    } else if (response.data.code === 19024) {
      console.log('\n⚠️ 飞书关键词拦截');
      console.log('请在飞书机器人设置中关闭关键词拦截或添加关键词');
    } else {
      console.log('\n❌ 发送失败');
    }
    
  } catch (error) {
    console.error('\n❌ 发送异常:', error.message);
    if (error.response) {
      console.error('响应:', error.response.data);
    }
  }
}

testDirect().catch(console.error);
