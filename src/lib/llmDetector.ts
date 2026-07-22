import axios from 'axios';

interface LlmLotteryResult {
  isLottery: boolean;
  confidence: number;
  prizes: string[];
  deadline: string | null;
  conditions: string[];
}

const LLM_API_KEY = process.env.OPENAI_API_KEY || '';
const LLM_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

const PROMPT = `你是一个专业的微博抽奖识别助手。请分析以下微博内容，判断是否为抽奖活动，并提取关键信息。

重要原则：宁可多通知，不可漏错过！只要有任何抽奖相关的迹象，都应识别为抽奖。

请返回严格的JSON格式，不要包含任何额外文字或解释。

JSON格式要求：
{
  "isLottery": true/false,
  "confidence": 0-1之间的小数,
  "prizes": ["奖品名称1", "奖品名称2"],
  "deadline": "截止日期字符串或null",
  "conditions": ["条件1", "条件2"]
}

判断标准：
- isLottery: 只要有明确表示要抽取、赠送奖品给粉丝的意图就为true，包括"抽个粉丝送"、"送位粉丝"、"重新抽奖"等模糊表达
- confidence: 0表示完全不是抽奖，1表示非常确定是抽奖，有抽奖迹象但不明确时应给较高置信度（0.6以上）
- prizes: 提取奖品名称，如"iPhone 15"、"红包"、"真无线耳机"、"48听可乐"等，即使描述不完整也要提取
- deadline: 提取截止时间，可以是具体日期如"7月21日"，也可以是相对时间如"后天"、"一周后"、"明天"等，没有则为null
- conditions: 提取参与条件，如"转发"、"关注"、"评论"、"点赞"等

示例1（抽奖）：
输入：转发抽奖！关注我并转发这条微博，7月20日抽1位粉丝送iPhone 15！
输出：{"isLottery":true,"confidence":0.95,"prizes":["iPhone 15"],"deadline":"7月20日","conditions":["关注","转发"]}

示例2（抽奖）：
输入：转发微博，7月21日抽粉丝送出1部 REDMI Note 17 Pro ~
输出：{"isLottery":true,"confidence":0.9,"prizes":["REDMI Note 17 Pro"],"deadline":"7月21日","conditions":["转发"]}

示例3（抽奖）：
输入：红魔平板5 Pro应该是这会儿最好玩的小尺寸平板了，建议富哥们看看。所以转发我这条微博就好，后天抽个粉丝送真无线耳机哈。
输出：{"isLottery":true,"confidence":0.85,"prizes":["真无线耳机"],"deadline":"后天","conditions":["转发"]}

示例4（抽奖）：
输入：刚发就给夹了，看来也是大品牌了😭😭😭那就这条重新抽奖，转发里送位粉丝48听可乐解解暑，一周后开
输出：{"isLottery":true,"confidence":0.92,"prizes":["48听可乐"],"deadline":"一周后","conditions":["转发"]}

示例5（抽奖）：
输入：福利来啦！关注+转发+点赞，抽3位送现金红包100元，明天开奖！
输出：{"isLottery":true,"confidence":0.98,"prizes":["现金红包100元"],"deadline":"明天","conditions":["关注","转发","点赞"]}

示例6（抽奖）：
输入：抽两位幸运粉丝送签名照，三天后开奖，转发参与！
输出：{"isLottery":true,"confidence":0.9,"prizes":["签名照"],"deadline":"三天后","conditions":["转发"]}

示例7（抽奖）：
输入：关注我，转发这条微博，下周抽一位送周边大礼包！
输出：{"isLottery":true,"confidence":0.88,"prizes":["周边大礼包"],"deadline":"下周","conditions":["关注","转发"]}

示例8（非抽奖）：
输入：今天天气真好，大家出门注意防晒哦
输出：{"isLottery":false,"confidence":0.0,"prizes":[],"deadline":null,"conditions":[]}

示例9（非抽奖）：
输入：感谢大家的支持，上一期抽奖已经结束了，获奖名单已公布
输出：{"isLottery":false,"confidence":0.0,"prizes":[],"deadline":null,"conditions":[]}

示例10（抽奖）：
输入：送福利！关注并转发，抽1位粉丝送手机一台，8月15号开
输出：{"isLottery":true,"confidence":0.95,"prizes":["手机"],"deadline":"8月15号","conditions":["关注","转发"]}

现在请分析以下微博内容：
`;

export const detectLotteryWithLlm = async (content: string): Promise<LlmLotteryResult> => {
  if (!LLM_API_KEY) {
    console.warn('LLM API key not configured, falling back to rule-based detection');
    return {
      isLottery: false,
      confidence: 0,
      prizes: [],
      deadline: null,
      conditions: [],
    };
  }

  try {
    const response = await axios.post(
      `${LLM_API_BASE}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: PROMPT + content,
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      },
      {
        headers: {
          'Authorization': `Bearer ${LLM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const resultText = response.data.choices[0].message.content.trim();
    
    try {
      const jsonStart = resultText.indexOf('{');
      const jsonEnd = resultText.lastIndexOf('}') + 1;
      const jsonStr = resultText.substring(jsonStart, jsonEnd);
      const result = JSON.parse(jsonStr);
      
      return {
        isLottery: result.isLottery || false,
        confidence: result.confidence || 0,
        prizes: Array.isArray(result.prizes) ? result.prizes : [],
        deadline: result.deadline || null,
        conditions: Array.isArray(result.conditions) ? result.conditions : [],
      };
    } catch {
      console.error('Failed to parse LLM response:', resultText);
      return {
        isLottery: false,
        confidence: 0,
        prizes: [],
        deadline: null,
        conditions: [],
      };
    }
  } catch (error: any) {
    console.error('LLM API error:', error.message);
    return {
      isLottery: false,
      confidence: 0,
      prizes: [],
      deadline: null,
      conditions: [],
    };
  }
};