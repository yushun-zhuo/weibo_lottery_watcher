import { detectLottery } from './src/lib/lotteryDetector';

async function test() {
  console.log('=== 测试带空格的日期格式 ===\n');
  
  const testCases = [
    {
      name: '带空格日期（冯伟文实际微博）',
      content: '转发微博，7 月 21 日抽粉丝送出 1 部 REDMI Note 17 Pro ~',
      expected: true,
    },
    {
      name: '不带空格日期',
      content: '转发微博，7月21日抽粉丝送出1部 REDMI Note 17 Pro ~',
      expected: true,
    },
    {
      name: '带空格日期2',
      content: '关注+转发，8 月 15 号抽一位送红包！',
      expected: true,
    },
  ];

  for (const testCase of testCases) {
    const result = await detectLottery(testCase.content);
    const status = result.isLottery === testCase.expected ? '✓ PASS' : '✗ FAIL';
    
    console.log(`${status} ${testCase.name}`);
    console.log(`  Content: ${testCase.content}`);
    console.log(`  Result: isLottery=${result.isLottery}, confidence=${result.confidence}`);
    console.log(`  Deadline: ${result.deadline || 'none'}`);
    console.log();
  }
}

test().catch(console.error);
