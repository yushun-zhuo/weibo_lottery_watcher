const ACTION_KEYWORDS = ['转发', '关注', '点赞', '评论', '@好友'];

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

const DEADLINE_PATTERNS = [
  /(\d{1,2})月(\d{1,2})日/,
  /(\d{4})年(\d{1,2})月(\d{1,2})日/,
  /(\d{1,2})号/,
  /(\d+)天后/,
  /(\d+)小时后/,
  /(\d+)分钟后/,
];

function simpleDetect(content) {
  const text = content.toLowerCase();
  
  let lotteryScore = 0;
  const foundPrizes = [];
  const foundConditions = [];
  let deadline = null;

  console.log('=== simpleDetect 详细调试 ===');
  console.log('输入内容:', content);
  console.log('转小写后:', text);
  console.log();

  console.log('1. 动作词匹配:');
  for (const keyword of ACTION_KEYWORDS) {
    if (text.includes(keyword)) {
      foundConditions.push(keyword);
      console.log(`   ✓ ${keyword}`);
    }
  }
  console.log();

  console.log('2. 抽奖词匹配:');
  for (const keyword of PRE_FILTER_KEYWORDS) {
    if (text.includes(keyword)) {
      lotteryScore += 1;
      console.log(`   ✓ ${keyword} (score: +1)`);
      if (['红包', '现金', 'iPhone', '手机', '优惠券', '门票', '专辑'].includes(keyword)) {
        foundPrizes.push(keyword);
        console.log(`     → 识别为奖品: ${keyword}`);
      }
    }
  }
  console.log();

  console.log('3. 动作词加分:');
  if (foundConditions.length > 0) {
    const addScore = foundConditions.length * 2;
    lotteryScore += addScore;
    console.log(`   动作词数量: ${foundConditions.length}, 加分: +${addScore}`);
  }
  console.log();

  console.log('4. 截止时间匹配:');
  for (const pattern of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      deadline = match[0];
      lotteryScore += 2;
      console.log(`   ✓ 匹配到: ${deadline} (score: +2)`);
      break;
    }
  }
  console.log();

  const confidence = Math.min(lotteryScore / 15, 1);
  
  console.log('=== 最终结果 ===');
  console.log(`总得分: ${lotteryScore}`);
  console.log(`置信度: ${confidence}`);
  console.log(`得分 >= 5: ${lotteryScore >= 5}`);
  console.log(`置信度 >= 0.35: ${confidence >= 0.35}`);
  console.log(`isLottery: ${lotteryScore >= 5 && confidence >= 0.35}`);

  return {
    isLottery: lotteryScore >= 5 && confidence >= 0.35,
    confidence,
    prizes: foundPrizes.length > 0 ? foundPrizes : ['未知奖品'],
    deadline,
    conditions: foundConditions,
  };
}

const content = '转发微博，7 月 21 日抽粉丝送出 1 部 REDMI Note 17 Pro ~';
simpleDetect(content);
