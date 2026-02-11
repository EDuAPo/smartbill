import { Transaction } from "../types";

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = "https://api.deepseek.com/v1/chat/completions";

const callDeepSeek = async (messages: Array<{ role: string; content: string }>) => {
  if (!API_KEY) {
    return "AI 功能需要配置 DeepSeek API 密钥。";
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "无法获取回复。";
  } catch (error) {
    console.error("DeepSeek API 错误:", error);
    return "连接异常。";
  }
};

export const analyzeFinances = async (transactions: Transaction[], userQuery: string) => {
  const context = `你是 SmartBill 的 AI 财务管家。
你的回答风格必须遵循：
1. 极其简洁：严禁废话，不使用"亲爱的"、"很高兴为您服务"等客套话。
2. 事实驱动：直接基于提供的账单数据进行分析。
3. 专业建议：如果用户询问建议，直接给出操作步骤（如：减少餐饮支出、设置预算）。
4. 不重复用户问题：直接给出答案。

当前账单数据（JSON 格式）: ${JSON.stringify(transactions)}。`;

  return callDeepSeek([
    { role: "system", content: context },
    { role: "user", content: userQuery }
  ]);
};

export const generateSpendingPersonality = async (transactions: Transaction[]) => {
  if (!API_KEY) {
    return { persona: "理财新手", description: "AI 功能未配置", color: "#1DB954" };
  }

  const prompt = `分析以下交易记录，生成一个简短的"消费人格" JSON 对象：${JSON.stringify(transactions)}。
要求：
- persona: 2-4个字的硬核标签。
- description: 15字以内的犀利描述，直击要害。
- color: 一个适合该人格的 Spotify 风格高饱和度颜色代码。

只返回 JSON，不要其他内容。`;

  try {
    const result = await callDeepSeek([
      { role: "user", content: prompt }
    ]);
    return JSON.parse(result);
  } catch (error) {
    return { persona: "理财新手", description: "数据量不足，暂无定论。", color: "#1DB954" };
  }
};

export const generateSpendingMusing = async (transactions: Transaction[]) => {
  if (!API_KEY) {
    return "AI 功能未配置";
  }

  const prompt = `基于账单 ${JSON.stringify(transactions)}，给出一句极其简短（15字内）的消费评价。
不要有任何感情色彩，直接指出数据中的最显著特征。`;

  return callDeepSeek([
    { role: "user", content: prompt }
  ]);
};

export const generateSpendingInsight = async (transactions: Transaction[]) => {
  if (!API_KEY) {
    return "AI 功能未配置";
  }

  const prompt = `基于 ${JSON.stringify(transactions)}，直接给出本月开销最需要优化的一个点，不准超过20字。`;

  return callDeepSeek([
    { role: "user", content: prompt }
  ]);
};

export const scanBillImage = async (base64Data: string) => {
  if (!API_KEY) {
    return null;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: `识别此图片中的账单。严格返回 JSON。
category 必须是以下之一: Food, Transport, Shopping, Utilities, Salary, Housing, Entertainment, Pets, Social, Subscription, Beauty。
isExpense 为 true (支出) 或 false (收入)。
格式: {"amount": 数字, "category": "类别", "description": "描述", "date": "YYYY-MM-DD", "isExpense": true/false}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (error) {
    console.error("扫描错误:", error);
    return null;
  }
};
