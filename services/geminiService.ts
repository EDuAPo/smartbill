import { CategoryType, Transaction } from "../types";

// API 配置
const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

// 获取 API Key
function getQWenApiKey(): string {
  return localStorage.getItem("qwen_api_key") || "";
}

export class SmartBillAI {
  private formatTransactions(transactions: Transaction[], monthlyBudget: number) {
    const today = new Date().toLocaleDateString('en-CA');
    const currentMonth = today.substring(0, 7);
    
    const monthExpenses = transactions.filter(t => 
      t.date.startsWith(currentMonth) && 
      !t.needConfirmation && 
      t.category !== '收入'
    );
    const monthTotal = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const remaining = monthlyBudget - monthTotal;
    
    const todayList = transactions.filter(t => t.date === today && !t.needConfirmation);
    const todayTotal = todayList.reduce((sum, t) => sum + t.amount, 0);
    
    const recent = transactions.slice(0, 10).map(t => 
      `- ${t.date} | ${t.merchant} | ${t.category} | ¥${t.amount}`
    ).join('\n');

    let budgetInfo = "";
    if (transactions.length > 0) {
      budgetInfo = `
# 本月预算信息
- 月度预算: ¥${monthlyBudget}
- 本月已消费: ¥${monthTotal}
- 剩余可用: ¥${remaining}
- 预算使用进度: ${Math.round((monthTotal / monthlyBudget) * 100)}%
`;
    }

    return `
# 当前财务概况 (日期: ${today})${budgetInfo}
- 今日已确认支出: ¥${todayTotal}
- 今日明细: ${todayList.map(t => `${t.merchant}(¥${t.amount})`).join(', ') || '无'}
- 最近10笔记录:
${recent || '暂无'}
`;
  }

  private getSystemInstruction(monthlyBudget: number, currentDate: string, context: string, isImageAnalysis: boolean = false, imageUrl?: string) {
    const imageContext = isImageAnalysis && imageUrl
      ? `\n# 图片分析任务\n图片URL: ${imageUrl}\n请分析这张图片。如果图片是账单（小票、收据、发票等），请提取所有交易信息；如果不是账单（如风景照、人物照、表情包），请返回空transactions并友好地回复用户。`
      : isImageAnalysis
      ? `\n# 图片分析任务\n请分析用户提供的图片。如果图片是账单（小票、收据、发票等），请提取所有交易信息；如果不是账单，请返回空transactions并友好地回复用户。`
      : "";
      
    return `你叫"财伴"，是一个清醒、毒舌但内心温暖的财务损友。
你存在的唯一目的是帮用户看住钱包，并在他乱花钱时狠狠吐槽。

# 核心性格
- **绝对禁语**：禁止说"好的"、"已记录"、"为您服务"、"作为AI助手"。
- **说话风格**：短句为主，多用反问和生活化比喻。像个在微信上秒回的朋友。

# 账单上下文使用指南
你现在可以获取用户的历史账单数据（见下文）。
- 如果用户询问"今天花了多少"、"昨天买了什么"或"最近消费情况"，你必须查阅上下文并给出准确回复。
- 在回复具体金额时，保持毒舌。例如："你今天已经挥霍了 ¥500 了，其中那顿 ¥300 的火锅是认真的吗？"
- 如果用户问及你没看到的数据，直接告诉他你还没记呢。

${context}
${imageContext}

# 交易识别逻辑
1. **意图分类**：
   - 【查询型】：用户在问自己的财务状况。直接根据上下文回复，不需要生成 transactions 数组。
   - 【记账型】：包含[具体动作] + [明确金额]。如果金额是入账性质，设为"收入"分类。
   - 【图片分析型】：用户上传了图片。如果是账单，提取数据；如果不是账单，transactions为空数组。
   - 【感慨型】：纯吐槽。
2. **输出结构**：必须返回严格的 JSON。如果是查询型且没有新账单，transactions 设为空数组 []。

# 输出结构 JSON
{
  "chat_response": "回复话语",
  "transactions": [ { "amount": number, "category": "餐饮/购物/交通/娱乐/住房/医疗/教育/收入/其他", "merchant": "商户名", "date": "YYYY-MM-DD" } ],
  "ai_persona": { "vibe_check": "情绪标签", "mood_color": "16进制颜色" }
}`;
  }

  private async callQWen(messages: any[]): Promise<any> {
    const apiKey = getQWenApiKey();
    
    if (!apiKey) {
      return {
        chat_response: "请先在设置中配置千问 API Key",
        transactions: [],
        ai_persona: { vibe_check: "困惑", mood_color: "#ffa500" }
      };
    }

    try {
      const response = await fetch(QWEN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "qwen-vl-plus",
          messages: messages,
          response_format: {
            type: "json_object"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error?.message || "API request failed");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (e: any) {
      console.error("QWen API Error:", e);
      return {
        chat_response: `AI服务暂时不可用: ${e.message}`,
        transactions: [],
        ai_persona: { vibe_check: "沮丧", mood_color: "#ff6b6b" }
      };
    }
  }

  async parseTransaction(input: string, transactions: Transaction[], monthlyBudget: number = 3000): Promise<any> {
    const currentDate = new Date().toLocaleDateString('en-CA');
    const context = this.formatTransactions(transactions, monthlyBudget);
    const systemInstruction = this.getSystemInstruction(monthlyBudget, currentDate, context, false);
    
    const messages = [
      { role: "system", content: systemInstruction },
      { role: "user", content: input }
    ];
    
    return this.callQWen(messages);
  }

  async parseMultimodal(data: string, mimeType: string, transactions: Transaction[], monthlyBudget: number = 3000): Promise<any> {
    const currentDate = new Date().toLocaleDateString('en-CA');
    const context = this.formatTransactions(transactions, monthlyBudget);
    const systemInstruction = this.getSystemInstruction(monthlyBudget, currentDate, context, true);
    
    // 千问 VL 支持直接传入图片 base64
    const messages = [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${data}`
            }
          },
          {
            type: "text",
            text: "请分析这张图片，提取账单信息"
          }
        ]
      }
    ];
    
    return this.callQWen(messages);
  }
}

// API Key 管理方法
export function setDeepSeekApiKey(apiKey: string) {
  localStorage.setItem("deepseek_api_key", apiKey);
}

export function getDeepSeekApiKeyStored(): string {
  return localStorage.getItem("deepseek_api_key") || "";
}

export function setOpenAIApiKey(apiKey: string) {
  localStorage.setItem("openai_api_key", apiKey);
}

export function getOpenAIApiKeyStored(): string {
  return localStorage.getItem("openai_api_key") || "";
}

// 千问 API Key 方法
export function setQWenApiKey(apiKey: string) {
  localStorage.setItem("qwen_api_key", apiKey);
}

export function getQWenApiKeyStored(): string {
  return localStorage.getItem("qwen_api_key") || "";
}
