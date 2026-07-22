const { detectLottery } = require('./dist/lib/lotteryDetector');

async function test() {
  const testCases = [
    {
      name: '冯伟文抽奖微博',
      content: '转发微博，7月21日抽粉丝送出1部 REDMI Note 17 Pro ~',
      expected: true,
    },
    {
      name: '标准抽奖',
      content: '转发抽奖！关注我并转发这条微博，7月20日抽1位粉丝送iPhone 15！',
      expected: true,
    },
    {
      name: '日常微博',
      content: '今天天气真好，大家出门注意防晒哦',
      expected: false,
    },
    {
      name: '福利抽奖',
      content: '福利来啦！关注+转发+点赞，抽3位送现金红包100元，明天开奖！',
      expected: true,
    },
    {
      name: '已开奖',
      content: '感谢大家的支持，上一期抽奖已经结束了，获奖名单已公布',
      expected: false,
    },
  ];

  console.log('Testing lottery detection algorithm...\n');

  for (const testCase of testCases) {
    const result = await detectLottery(testCase.content);
    const status = result.isLottery === testCase.expected ? '✓ PASS' : '✗ FAIL';
    
    console.log(`${status} ${testCase.name}`);
    console.log(`  Content: ${testCase.content}`);
    console.log(`  Result: isLottery=${result.isLottery}, confidence=${result.confidence}`);
    console.log(`  Prizes: ${result.prizes.join(', ') || 'none'}`);
    console.log(`  Deadline: ${result.deadline || 'none'}`);
    console.log(`  Conditions: ${result.conditions.join(', ') || 'none'}`);
    console.log();
  }
}

test().catch(console.error);
