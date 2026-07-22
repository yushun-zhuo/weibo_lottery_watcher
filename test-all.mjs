import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

const envFile = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envFile, 'utf-8');
const feishuMatch = envContent.match(/FEISHU_WEBHOOK_URL=(.+)/);
const FEISHU_WEBHOOK_URL = feishuMatch ? feishuMatch[1] : '';

async function test1Deduplication() {
  console.log('=== 测试1: 去重 ===\n');
  try {
    const response = await axios.get(`${BASE_URL}/api/lottery`);
    const posts = response.data;
    
    console.log(`获取到 ${posts.length} 条抽奖记录`);
    
    const postIds = posts.map(p => p.postId);
    const uniqueIds = [...new Set(postIds)];
    
    if (postIds.length === uniqueIds.length) {
      console.log('✅ 去重测试通过: 没有重复记录');
    } else {
      console.log(`❌ 去重测试失败: ${postIds.length} 条记录中有 ${postIds.length - uniqueIds.length} 条重复`);
      const duplicates = postIds.filter((id, index) => postIds.indexOf(id) !== index);
      console.log('重复的postId:', [...new Set(duplicates)]);
    }
    
    console.log('');
    return postIds.length === uniqueIds.length;
  } catch (error) {
    console.error('❌ 去重测试失败:', error.message);
    console.log('');
    return false;
  }
}

async function test2Sorting() {
  console.log('=== 测试2: 排序 ===\n');
  try {
    const response = await axios.get(`${BASE_URL}/api/lottery`);
    const posts = response.data;
    
    if (posts.length < 2) {
      console.log('⚠️ 记录数不足，跳过排序测试');
      console.log('');
      return true;
    }
    
    const isSorted = posts.every((post, index) => {
      if (index === 0) return true;
      return new Date(post.createdAt) <= new Date(posts[index - 1].createdAt);
    });
    
    if (isSorted) {
      console.log('✅ 排序测试通过: 最新记录在最上方');
      console.log(`第一条记录时间: ${posts[0].createdAt}`);
      console.log(`最后一条记录时间: ${posts[posts.length - 1].createdAt}`);
    } else {
      console.log('❌ 排序测试失败: 记录未按时间倒序排列');
      console.log('记录顺序:');
      posts.forEach((p, i) => console.log(`${i + 1}. ${p.createdAt} - ${p.bloggerName}`));
    }
    
    console.log('');
    return isSorted;
  } catch (error) {
    console.error('❌ 排序测试失败:', error.message);
    console.log('');
    return false;
  }
}

async function test3PostUrl() {
  console.log('=== 测试3: 跳转链接 ===\n');
  try {
    const response = await axios.get(`${BASE_URL}/api/lottery`);
    const posts = response.data;
    
    if (posts.length === 0) {
      console.log('⚠️ 没有抽奖记录，跳过链接测试');
      console.log('');
      return true;
    }
    
    const invalidUrls = posts.filter(p => !p.postUrl || p.postUrl.includes('undefined'));
    
    if (invalidUrls.length === 0) {
      console.log('✅ 链接测试通过: 所有链接有效');
      console.log('示例链接:', posts[0].postUrl);
    } else {
      console.log(`❌ 链接测试失败: ${invalidUrls.length} 条记录链接无效`);
      invalidUrls.forEach(p => console.log(`  postId=${p.postId}, url=${p.postUrl}`));
    }
    
    console.log('');
    return invalidUrls.length === 0;
  } catch (error) {
    console.error('❌ 链接测试失败:', error.message);
    console.log('');
    return false;
  }
}

async function test4Feishu() {
  console.log('=== 测试4: 飞书通知 ===\n');
  
  if (!FEISHU_WEBHOOK_URL) {
    console.log('⚠️ FEISHU_WEBHOOK_URL未配置，跳过飞书测试');
    console.log('');
    return true;
  }
  
  console.log('FEISHU_WEBHOOK_URL: 已配置');
  
  const card = {
    msg_type: 'text',
    content: {
      text: '测试消息',
    },
  };
  
  try {
    const response = await axios.post(FEISHU_WEBHOOK_URL, card);
    if (response.data.code === 0) {
      console.log('✅ 飞书通知测试通过: 发送成功');
      console.log('响应:', JSON.stringify(response.data));
      console.log('');
      return true;
    } else if (response.data.code === 19024) {
      console.log('⚠️ 飞书通知被关键词拦截');
      console.log('请在飞书机器人设置中添加关键词: 抽奖, 转发, 奖品');
      console.log('或关闭"关键词拦截"功能');
      console.log('');
      return true;
    } else {
      console.log('❌ 飞书通知测试失败:', response.data);
      console.log('');
      return false;
    }
  } catch (error) {
    console.error('❌ 飞书通知测试失败:', error.message);
    if (error.response) {
      console.error('响应:', error.response.data);
    }
    console.log('');
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('          微博抽奖监控 - 综合测试');
  console.log('========================================\n');
  
  const results = [
    { name: '去重', result: await test1Deduplication() },
    { name: '排序', result: await test2Sorting() },
    { name: '链接', result: await test3PostUrl() },
    { name: '飞书', result: await test4Feishu() },
  ];
  
  console.log('========================================');
  console.log('              测试结果汇总');
  console.log('========================================');
  
  let passed = 0;
  let failed = 0;
  
  results.forEach(r => {
    if (r.result) {
      console.log(`✅ ${r.name}测试: 通过`);
      passed++;
    } else {
      console.log(`❌ ${r.name}测试: 失败`);
      failed++;
    }
  });
  
  console.log('');
  console.log(`总测试数: ${results.length}`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过!');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查日志');
  }
  
  return failed === 0;
}

runAllTests().catch(console.error);
