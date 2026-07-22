import { detectLottery } from './src/lib/lotteryDetector';

const PRE_FILTER_KEYWORDS = [
  '抽奖', '转发抽奖', '抽送', '免费送', '福利抽奖',
  '抽奖活动', '开奖', '中奖', '抽奖送', '抽一个',
  '抽两位', '抽三名', '抽1位', '抽2位', '抽3名',
  '福利', '送', '奖品', '获奖', '免费', '包邮',
  '惊喜', '幸运', '礼物', '红包', '现金',
  'iPhone', '手机', '优惠券', '周边', '签名',
  '专辑', '门票', '抽奖平台', '抽奖助手',
  '抽粉丝', '抽送', '送出', '赠送', '奖品',
];

const ACTION_KEYWORDS = ['转发', '关注', '点赞', '评论', '@好友'];

async function test() {
  const content = '转发微博，7 月 21 日抽粉丝送出 1 部 REDMI Note 17 Pro ~';
  
  console.log('=== 预过滤调试 ===\n');
  console.log('测试内容:', content);
  console.log();
  
  console.log('1. 检查动作词匹配:');
  for (const keyword of ACTION_KEYWORDS) {
    const found = content.includes(keyword);
    console.log(`   ${keyword}: ${found ? '✓' : '✗'}`);
  }
  console.log();
  
  console.log('2. 检查抽奖词匹配:');
  for (const keyword of PRE_FILTER_KEYWORDS) {
    const found = content.includes(keyword);
    if (found) {
      console.log(`   ${keyword}: ✓`);
    }
  }
  console.log();
  
  console.log('3. 完整识别结果:');
  const result = await detectLottery(content);
  console.log(`   isLottery: ${result.isLottery}`);
  console.log(`   confidence: ${result.confidence}`);
}

test().catch(console.error);
