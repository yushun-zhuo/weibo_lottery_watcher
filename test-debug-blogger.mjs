import { fetchBloggerPosts, stripHtml } from './src/lib/weibo';
import { detectLottery } from './src/lib/lotteryDetector';

async function test() {
  console.log('=== 调试：检查冯伟文的微博内容 ===\n');
  
  const bloggerId = '1648894531';
  console.log(`获取博主 ${bloggerId} 的微博...`);
  
  const posts = await fetchBloggerPosts(bloggerId);
  console.log(`获取到 ${posts.length} 条微博\n`);
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const cleanContent = stripHtml(post.content);
    
    console.log(`--- 微博 ${i+1} ---`);
    console.log(`ID: ${post.id}`);
    console.log(`时间: ${post.created_at}`);
    console.log(`内容: ${cleanContent}`);
    
    const result = await detectLottery(cleanContent);
    console.log(`识别结果: isLottery=${result.isLottery}, confidence=${result.confidence}`);
    console.log();
  }
  
  console.log('=== 调试完成 ===');
}

test().catch(console.error);
