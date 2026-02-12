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

export const generateFunnySpendingJokes = async (transactions: Transaction[]) => {
  if (!API_KEY) {
    return [
      { title: "钱包守护神", content: "你的钱包比你还懂节制", emoji: "🛡️" },
      { title: "隐形富豪", content: "账户余额和心情成反比", emoji: "💸" }
    ];
  }

  const prompt = `基于交易数据 ${JSON.stringify(transactions.slice(-20))}，生成3条幽默消费段子。
每条必须：
- title: 4-6字的梗标题
- content: 12-18字的犀利吐槽，要有网络梗和年轻人的语言风格
- emoji: 一个合适的emoji

只返回JSON数组，格式: [{"title":"","content":"","emoji":""}]`;

  try {
    const result = await callDeepSeek([{ role: "user", content: prompt }]);
    return JSON.parse(result);
  } catch {
    return [
      { title: "月光战士", content: "工资到账三秒，钱包开始冬眠", emoji: "🌙" },
      { title: "外卖续命", content: "外卖小哥比亲妈还熟", emoji: "🍱" }
    ];
  }
};

export const scanBillImage = async (base64Data: string) => {
  if (!API_KEY) {
    console.error("DeepSeek API 密钥未配置");
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
                text: `识别此图片中的账单信息。必须严格返回纯 JSON 格式，不要有任何其他文字。
category 必须是以下之一: Food, Transport, Shopping, Utilities, Salary, Housing, Entertainment, Pets, Social, Subscription, Beauty。
isExpense 为 true (支出) 或 false (收入)。
返回格式: {"amount": 数字, "category": "类别", "description": "描述", "date": "YYYY-MM-DD", "isExpense": true/false}

示例: {"amount": 45.5, "category": "Food", "description": "午餐", "date": "2026-02-12", "isExpense": true}`
              }
            ]
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API 错误 ${response.status}:`, errorText);
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "{}";
    console.log("API 返回内容:", content);
    
    // 尝试提取 JSON（可能被包裹在其他文本中）
    let jsonStr = content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const result = JSON.parse(jsonStr);
    console.log("解析结果:", result);
    
    // 验证必需字段
    if (!result.amount || !result.category || !result.description) {
      console.error("返回数据缺少必需字段:", result);
      return null;
    }
    
    return result;
  } catch (error) {
    console.error("扫描错误:", error);
    return null;
  }
};
