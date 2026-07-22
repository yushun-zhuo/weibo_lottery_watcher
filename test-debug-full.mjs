import { storage } from './src/lib/storage';
import { fetchBloggerPosts, stripHtml } from './src/lib/weibo';
import { detectLottery } from './src/lib/lotteryDetector';

async function test() {
  console.log('=== 详细端到端测试 ===\n');
  
  const bloggerId = '1648894531';
  const bloggerName = '馮偉文';
  
  console.log(`扫描博主: ${bloggerName} (ID: ${bloggerId})`);
  console.log();
  
  const posts = await fetchBloggerPosts(bloggerId);
  console.log(`获取到 ${posts.length} 条微博\n`);
  
  for (const post of posts) {
    const cleanContent = stripHtml(post.content);
    
    console.log(`--- 微博 ID: ${post.id} ---`);
    console.log(`时间: ${post.created_at}`);
    console.log(`内容: ${cleanContent.substring(0, 100)}...`);
    
    const result = await detectLottery(cleanContent);
    console.log(`识别结果: isLottery=${result.isLottery}, confidence=${result.confidence}`);
    
    if (result.isLottery) {
      console.log(`奖品: ${result.prizes.join(', ')}`);
      console.log(`截止: ${result.deadline}`);
      console.log(`条件: ${result.conditions.join(', ')}`);
    }
    
    console.log();
  }
  
  console.log('=== 测试完成 ===');
}

test().catch(console.error);
