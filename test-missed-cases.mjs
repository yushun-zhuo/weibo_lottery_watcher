import { detectLottery } from './src/lib/lotteryDetector';

async function test() {
  console.log('=== 测试漏识别的抽奖微博 ===\n');
  
  const testCases = [
    {
      name: '冯伟文抽奖微博（漏识别1）',
      content: '红魔平板5 Pro应该是这会儿最好玩的小尺寸平板了，建议富哥们看看。所以转发我这条微博就好，后天抽个粉丝送真无线耳机哈。抽奖详情',
      expected: true,
    },
    {
      name: '东来_IdIdick抽奖微博（漏识别2）',
      content: '刚发就给夹了，看来也是大品牌了😭😭😭那就这条重新抽奖，转发里送位粉丝48听可乐解解暑，一周后开',
      expected: true,
    },
    {
      name: '标准抽奖',
      content: '转发抽奖！关注我并转发这条微博，7月20日抽1位粉丝送iPhone 15！',
      expected: true,
    },
    {
      name: '福利抽奖',
      content: '福利来啦！关注+转发+点赞，抽3位送现金红包100元，明天开奖！',
      expected: true,
    },
    {
      name: '三天后开奖',
      content: '抽两位幸运粉丝送签名照，三天后开奖，转发参与！',
      expected: true,
    },
    {
      name: '下周抽奖',
      content: '关注我，转发这条微博，下周抽一位送周边大礼包！',
      expected: true,
    },
    {
      name: '日常微博',
      content: '今天天气真好，大家出门注意防晒哦',
      expected: false,
    },
    {
      name: '已开奖',
      content: '感谢大家的支持，上一期抽奖已经结束了，获奖名单已公布',
      expected: false,
    },
    {
      name: '仅转发无抽奖',
      content: '这条微博很有意思，大家转发看看',
      expected: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = await detectLottery(testCase.content);
    const status = result.isLottery === testCase.expected ? '✓ PASS' : '✗ FAIL';
    
    if (result.isLottery === testCase.expected) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`${status} ${testCase.name}`);
    console.log(`  isLottery: ${result.isLottery} (预期: ${testCase.expected})`);
    console.log(`  confidence: ${result.confidence}`);
    console.log(`  prizes: ${result.prizes.join(', ') || 'none'}`);
    console.log(`  deadline: ${result.deadline || 'none'}`);
    console.log(`  conditions: ${result.conditions.join(', ') || 'none'}`);
    console.log();
  }

  console.log('=== 测试结果 ===');
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`成功率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    process.exit(1);
  }
}

test().catch(console.error);