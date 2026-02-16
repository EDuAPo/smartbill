import { CategoryType, Transaction } from "../types";

// DeepSeek API配置
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = localStorage.getItem("deepseek_api_key") || "";

export class SmartBillAI {
  private formatTransactions(transactions: Transaction[]) {
    if (transactions.length === 0) return "目前还没有任何消费记录。";
    const today = new Date().toLocaleDateString('en-CA');
    
    const todayList = transactions.filter(t => t.date === today && !t.needConfirmation);
    const todayTotal = todayList.reduce((sum, t) => sum + t.amount, 0);
    
    const recent = transactions.slice(0, 10).map(t => 
      `- ${t.date} | ${t.merchant} | ${t.category} | ¥${t.amount}`
    ).join('\n');

    return `
# 当前财务概况 (日期: ${today})
- 今日已确认支出: ¥${todayTotal}
- 今日明细: ${todayList.map(t => `${t.merchant}(¥${t.amount})`).join(', ') || '无'}
- 最近10笔记录:
${recent}
`;
  }

  private getSystemInstruction(monthlyBudget: number, currentDate: string, context: string) {
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

# 交易识别逻辑
1. **意图分类**：
   - 【查询型】：用户在问自己的财务状况。直接根据上下文回复，不需要生成 transactions 数组。
   - 【记账型】：包含[具体动作] + [明确金额]。如果金额是入账性质，设为"收入"分类。
   - 【感慨型】：纯吐槽。
2. **输出结构**：必须返回严格的 JSON。如果是查询型且没有新账单，transactions 设为空数组 []。

# 输出结构 JSON
{
  "chat_response": "回复话语",
  "transactions": [ { "amount": number, "category": "餐饮/购物/交通/娱乐/住房/医疗/教育/收入/其他", "merchant": "商户名", "date": "YYYY-MM-DD" } ],
  "ai_persona": { "vibe_check": "情绪标签", "mood_color": "16进制颜色" }
}`;
  }

  private getResponseSchema() {
    return {
      type: "object",
      properties: {
        chat_response: { type: "string" },
        transactions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              amount: { type: "number" },
              category: { type: "string" },
              merchant: { type: "string" },
              date: { type: "string" }
            },
            required: ["amount", "category", "merchant", "date"]
          }
        },
        ai_persona: {
          type: "object",
          properties: {
            vibe_check: { type: "string" },
            mood_color: { type: "string" }
          },
          required: ["vibe_check", "mood_color"]
        }
      },
      required: ["chat_response", "transactions", "ai_persona"]
    };
  }

  private async callDeepSeek(prompt: string, systemInstruction: string): Promise<any> {
    const apiKey = localStorage.getItem("deepseek_api_key") || "";
    
    if (!apiKey) {
      // 如果没有API Key，提示用户设置
      return {
        chat_response: "请先在设置中配置 DeepSeek API Key",
        transactions: [],
        ai_persona: { vibe_check: "困惑", mood_color: "#ffa500" }
      };
    }

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_object"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (e: any) {
      console.error("DeepSeek API Error:", e);
      return {
        chat_response: `AI服务暂时不可用: ${e.message}`,
        transactions: [],
        ai_persona: { vibe_check: "沮丧", mood_color: "#ff6b6b" }
      };
    }
  }

  async parseTransaction(input: string, transactions: Transaction[], monthlyBudget: number = 3000): Promise<any> {
    const currentDate = new Date().toLocaleDateString('en-CA');
    const context = this.formatTransactions(transactions);
    const systemInstruction = this.getSystemInstruction(monthlyBudget, currentDate, context);
    
    return this.callDeepSeek(input, systemInstruction);
  }

  async parseMultimodal(data: string, mimeType: string, transactions: Transaction[], monthlyBudget: number = 3000): Promise<any> {
    const currentDate = new Date().toLocaleDateString('en-CA');
    const context = this.formatTransactions(transactions);
    const prompt = `分析这张图片。如果是账单，提取数据；如果是生活照，别乱记账，跟我聊聊照片。\n\n图片数据（base64）: ${data}`;
    const systemInstruction = this.getSystemInstruction(monthlyBudget, currentDate, context);
    
    return this.callDeepSeek(prompt, systemInstruction);
  }
}

// 保存 API Key 的方法
export function setDeepSeekApiKey(apiKey: string) {
  localStorage.setItem("deepseek_api_key", apiKey);
}

export function getDeepSeekApiKey(): string {
  return localStorage.getItem("deepseek_api_key") || "";
}
