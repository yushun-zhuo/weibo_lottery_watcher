import axios from 'axios';

interface LotteryInfo {
  bloggerName: string;
  bloggerId: string;
  postUrl: string;
  content: string;
  prizes: string[];
  deadline: string | null;
  conditions: string[];
  confidence: number;
}

export const sendFeishuNotification = async (webhookUrl: string, lottery: LotteryInfo): Promise<boolean> => {
  try {
    const textMessage = {
      msg_type: 'text',
      content: {
        text: `🎁 发现转发抽奖\n\n博主: ${lottery.bloggerName}\n置信度: ${(lottery.confidence * 100).toFixed(0)}%\n奖品: ${lottery.prizes.join(', ')}\n参与条件: ${lottery.conditions.length > 0 ? lottery.conditions.join(', ') : '请查看原文'}\n截止时间: ${lottery.deadline || '请查看原文'}\n\n${lottery.content.slice(0, 200)}${lottery.content.length > 200 ? '...' : ''}\n\n点击参与: ${lottery.postUrl}`,
      },
    };

    const response = await axios.post(webhookUrl, textMessage);
    console.log('Feishu notification sent:', response.data);
    
    if (response.data.code === 19024) {
      console.warn('Feishu keyword filter blocked the message. Please configure keywords in Feishu bot settings.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send Feishu notification:', error);
    return false;
  }
};
