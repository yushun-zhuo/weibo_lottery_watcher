import { storage } from './src/lib/storage';
import { runMonitor, runFullScan } from './src/lib/monitor';

async function test() {
  console.log('=== 端到端测试：验证重新扫描功能 ===\n');
  
  console.log('1. 检查当前监控列表');
  const bloggers = storage.monitoredBloggers.getAll();
  console.log(`   当前监控博主数量: ${bloggers.length}`);
  bloggers.forEach(b => console.log(`   - ${b.bloggerName} (ID: ${b.bloggerId}), lastPostId: ${b.lastPostId || 'null'}`));
  console.log();

  console.log('2. 模拟之前检测过但没识别出抽奖微博的情况');
  console.log('   (假设 lastPostId 已被更新，导致历史抽奖微博被跳过)');
  console.log();

  console.log('3. 运行重新扫描（重置 lastPostId 并重新检测）');
  await runFullScan();
  console.log();

  console.log('4. 检查扫描结果');
  const lotteryPosts = storage.lotteryPosts.getAll();
  console.log(`   识别到的抽奖微博数量: ${lotteryPosts.length}`);
  lotteryPosts.forEach(p => {
    console.log(`   - 博主: ${p.bloggerName}`);
    console.log(`     内容: ${p.postContent.substring(0, 50)}...`);
    console.log(`     奖品: ${p.prizes.join(', ') || '未知'}`);
    console.log(`     截止: ${p.deadline || '无'}`);
    console.log(`     置信度: ${(p.confidence * 100).toFixed(0)}%`);
    console.log();
  });

  console.log('=== 测试完成 ===');
}

test().catch(console.error);
