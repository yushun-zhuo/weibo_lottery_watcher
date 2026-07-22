import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/db.json', 'utf-8'));

console.log('=== 博主列表 ===');
data.monitoredBloggers.forEach(b => {
  console.log(`- ${b.bloggerName} (${b.bloggerId}) lastPostId: ${b.lastPostId}`);
});

console.log('\n=== 抽奖记录 ===');
data.lotteryPosts.forEach(p => {
  console.log(`- ${p.bloggerName}: confidence=${(p.confidence*100).toFixed(0)}%, postId=${p.postId}`);
});

console.log('\n=== 通知记录 ===');
data.notifications.forEach(n => {
  console.log(`- lotteryPostId: ${n.lotteryPostId}, sent: ${n.sent}, sentAt: ${n.sentAt}`);
});