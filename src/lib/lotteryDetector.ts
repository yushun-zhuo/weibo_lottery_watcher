import { detectLotteryWithLlm } from './llmDetector';

interface LotteryResult {
  isLottery: boolean;
  confidence: number;
  prizes: string[];
  deadline: string | null;
  conditions: string[];
}

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

const NEGATIVE_KEYWORDS = [
  '已开奖', '开奖结果', '中奖名单', '谢谢参与',
  '活动结束', '获奖名单', '公布结果', '公布获奖',
];

const DEADLINE_PATTERNS = [
  /(\d{1,2})\s*月\s*(\d{1,2})\s*日/,
  /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/,
  /(\d{1,2})\s*号/,
  /(\d+)\s*天后/,
  /(\d+)\s*小时后/,
  /(\d+)\s*分钟后/,
  /(\d+)\s*周后/,
  /(\d+)\s*天后/,
  /(\d+)\s*天开/,
  /(\d+)\s*号开/,
  /(\d+)\s*号开奖/,
  /(\d+)\s*号抽/,
  /(\d+)\s*月(\d+)\s*号/,
  /(\d+)\s*月(\d+)\s*日/,
  /(\d+)\s*月(\d+)\s*号开/,
  /(\d+)\s*月(\d+)\s*日开/,
];

const RELATIVE_DEADLINE_KEYWORDS = [
  '后天', '明天', '本周', '下周', '下月',
  '一周后', '两周后', '一个月后', '3天后',
  '3天后开', '明天开', '后天开', '周一开',
  '周二开', '周三开', '周四开', '周五开',
  '周六开', '周日开', '下周开', '下周开奖',
];

const preFilter = (content: string): boolean => {
  const text = content.toLowerCase();
  
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (text.includes(keyword)) {
      return false;
    }
  }

  let hasAction = false;
  for (const keyword of ACTION_KEYWORDS) {
    if (text.includes(keyword)) {
      hasAction = true;
      break;
    }
  }

  let hasLotteryWord = false;
  for (const keyword of PRE_FILTER_KEYWORDS) {
    if (text.includes(keyword)) {
      hasLotteryWord = true;
      break;
    }
  }

  let hasRelativeDeadline = false;
  for (const keyword of RELATIVE_DEADLINE_KEYWORDS) {
    if (text.includes(keyword)) {
      hasRelativeDeadline = true;
      break;
    }
  }

  if (hasAction || hasLotteryWord || hasRelativeDeadline) {
    return true;
  }

  return false;
};

const simpleDetect = (content: string): LotteryResult => {
  const text = content.toLowerCase();
  
  let lotteryScore = 0;
  const foundPrizes: string[] = [];
  const foundConditions: string[] = [];
  let deadline: string | null = null;

  for (const keyword of ACTION_KEYWORDS) {
    if (text.includes(keyword)) {
      foundConditions.push(keyword);
    }
  }

  for (const keyword of PRE_FILTER_KEYWORDS) {
    if (text.includes(keyword)) {
      lotteryScore += 1;
      if (['红包', '现金', 'iPhone', '手机', '优惠券', '门票', '专辑'].includes(keyword)) {
        foundPrizes.push(keyword);
      }
    }
  }

  if (foundConditions.length > 0) {
    lotteryScore += foundConditions.length * 2;
  }

  for (const pattern of DEADLINE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      deadline = match[0];
      lotteryScore += 2;
      break;
    }
  }

  if (!deadline) {
    for (const keyword of RELATIVE_DEADLINE_KEYWORDS) {
      if (text.includes(keyword)) {
        deadline = keyword;
        lotteryScore += 2;
        break;
      }
    }
  }

  const confidence = Math.min(lotteryScore / 15, 1);
  
  if (lotteryScore >= 3 && confidence >= 0.2) {
    return {
      isLottery: true,
      confidence,
      prizes: foundPrizes.length > 0 ? foundPrizes : ['未知奖品'],
      deadline,
      conditions: foundConditions,
    };
  }

  return {
    isLottery: false,
    confidence: 0,
    prizes: [],
    deadline: null,
    conditions: [],
  };
};

export const detectLottery = async (content: string): Promise<LotteryResult> => {
  const hasLlmKey = !!process.env.OPENAI_API_KEY;

  if (!preFilter(content)) {
    return {
      isLottery: false,
      confidence: 0,
      prizes: [],
      deadline: null,
      conditions: [],
    };
  }

  if (hasLlmKey) {
    const llmResult = await detectLotteryWithLlm(content);
    return llmResult;
  }

  return simpleDetect(content);
};