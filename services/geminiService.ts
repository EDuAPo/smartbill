import { CategoryType, Transaction } from "../types";

const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

function getQWenApiKey(): string {
  return localStorage.getItem("qwen_api_key") || "";
}

function safeNum(n: number | undefined | null, fallback: number = 0): number {
  if (typeof n !== 'number' || isNaN(n) || !isFinite(n)) {
    return fallback;
  }
  return n;
}

function isIncomeCategory(category: string): boolean {
  return category === '收入' || category === CategoryType.INCOME || category.includes('收');
}

function formatTransactionsWithSign(transactions: Transaction[], monthlyBudget: number) {
  const today = new Date().toLocaleDateString('en-CA');
  const currentMonth = today.substring(0, 7);
  const budget = safeNum(monthlyBudget, 0);
  
  const monthConfirmed = transactions.filter(t => 
    t.date && t.date.startsWith(currentMonth) && !t.needConfirmation
  );
  
  const monthExpenses = monthConfirmed.filter(t => !isIncomeCategory(t.category));
  const monthExpenseTotal = safeNum(monthExpenses.reduce((sum, t) => sum + safeNum(t.amount), 0));
  
  const monthIncome = monthConfirmed.filter(t => isIncomeCategory(t.category));
  const monthIncomeTotal = safeNum(monthIncome.reduce((sum, t) => sum + safeNum(t.amount), 0));
  
  const netAmount = monthIncomeTotal - monthExpenseTotal;
  const remaining = budget - monthExpenseTotal;
  
  const todayConfirmed = monthConfirmed.filter(t => t.date === today);
  const todayExpense = todayConfirmed.filter(t => !isIncomeCategory(t.category));
  const todayExpenseTotal = safeNum(todayExpense.reduce((sum, t) => sum + safeNum(t.amount), 0));
  const todayIncome = todayConfirmed.filter(t => isIncomeCategory(t.category));
  const todayIncomeTotal = safeNum(todayIncome.reduce((sum, t) => sum + safeNum(t.amount), 0));
  
  const recent = transactions.slice(0, 10).map(t => {
    const sign = isIncomeCategory(t.category) ? '+' : '-';
    const amount = safeNum(t.amount, 0);
    return `${t.date || '未知'} | ${t.merchant || '未知'} | ${t.category} | ${sign}¥${amount}`;
  }).join('\n');

  const categoryBreakdown = monthExpenses.reduce((acc, t) => {
    const cat = t.category;
    acc[cat] = (acc[cat] || 0) + safeNum(t.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amount]) => `${cat}: ¥${safeNum(amount, 0)}`)
    .join('\n');

  // 收入分类统计
  const incomeBreakdown = monthIncome.reduce((acc, t) => {
    const cat = t.category;
    acc[cat] = (acc[cat] || 0) + safeNum(t.amount);
    return acc;
  }, {} as Record<string, number>);
  
  const topIncome = Object.entries(incomeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, amount]) => `${cat}: +¥${safeNum(amount, 0)}`)
    .join('\n');

  return {
    today,
    currentMonth,
    monthlyBudget: budget,
    monthExpenseTotal,
    monthIncomeTotal,
    netAmount,
    remaining,
    usagePercent: budget > 0 ? Math.round((monthExpenseTotal / budget) * 100) : 0,
    todayExpenseTotal,
    todayIncomeTotal,
    recentTransactions: recent || '暂无记录',
    categoryBreakdown: topCategories || '暂无支出数据',
    incomeBreakdown: topIncome || '暂无收入数据'
  };
}

export class SmartBillAI {
  private getSystemPrompt(context: any) {
    const budget = safeNum(context.monthlyBudget, 0);
    const expense = safeNum(context.monthExpenseTotal, 0);
    const income = safeNum(context.monthIncomeTotal, 0);
    const net = safeNum(context.netAmount, 0);
    const remain = safeNum(context.remaining, 0);
    const percent = safeNum(context.usagePercent, 0);
    const todayExpense = safeNum(context.todayExpenseTotal, 0);
    const todayIncome = safeNum(context.todayIncomeTotal, 0);
    
    return `你叫"财伴"，是用户的智能财务管家。

## 核心功能
1. 智能记账：识别收入和支出
2. 预算查询：回答还能花多少
3. 财务分析：分析消费习惯

## 金额规则（必须严格遵守）
- 收入金额：正数，如：工资5000
- 支出金额：正数，如：吃饭50
- 必须用 "is_income": true 表示收入，false 表示支出

## 财务数据
今天是 ${context.today}，本月（${context.currentMonth}）：
- 月度预算：¥${budget}
- 本月支出：¥${expense}
- 本月收入：¥${income}
- 净收支：¥${net} (正数=盈利，负数=赤字)
- 剩余可用：¥${remain}
- 预算使用：${percent}%
- 今日支出：¥${todayExpense}
- 今日收入：¥${todayIncome}

支出分类：${context.categoryBreakdown}
收入分类：${context.incomeBreakdown}

## 输出格式（必须是JSON）
{
  "chat_response": "回复用户的话",
  "transactions": [] 或 [{"amount": 金额, "category": "分类", "merchant": "描述", "date": "YYYY-MM-DD", "is_income": true/false}],
  "ai_persona": {"vibe_check": "情绪标签", "mood_color": "#颜色"}
}

重要：金额必须是有效数字，不能是NaN！`;
  }

  private async callQWen(messages: any[]): Promise<any> {
    const apiKey = getQWenApiKey();
    
    if (!apiKey) {
      return {
        chat_response: `Hey~ 你还没配置千问 API Key 呢！\n\n配置步骤：\n1. 阿里云DashScope创建API Key\n2. 回来设置页粘贴\n\n搞定告诉我！💰`,
        transactions: [],
        ai_persona: { vibe_check: "等待配置", mood_color: "#3b82f6" }
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
          model: "qwen-plus",
          messages: messages,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error?.message || "API请求失败");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // 尝试解析JSON
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // 如果解析失败，返回文本
      }
      
      // 如果不是JSON格式，返回文本响应
      return {
        chat_response: content,
        transactions: [],
        ai_persona: { vibe_check: "正常", mood_color: "#10b981" }
      };
    } catch (e: any) {
      console.error("QWen API Error:", e);
      return {
        chat_response: `AI服务暂时不可用: ${e.message}`,
        transactions: [],
        ai_persona: { vibe_check: "沮丧", mood_color: "#ff6b6b" }
      };
    }
  }

  async parseTransaction(
    input: string, 
    transactions: Transaction[], 
    monthlyBudget: number = 3000, 
    chatHistory?: Array<{role: 'user' | 'ai', text: string}>
  ): Promise<any> {
    
    const context = formatTransactionsWithSign(transactions, monthlyBudget);
    const systemPrompt = this.getSystemPrompt(context);
    
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-6);
      for (const msg of recentHistory) {
        if (msg.role === 'user') {
          messages.push({ role: 'user', content: msg.text });
        } else if (msg.role === 'ai') {
          messages.push({ role: 'assistant', content: msg.text });
        }
      }
    }

    messages.push({ role: 'user', content: input });
    
    return this.callQWen(messages);
  }

  async parseMultimodal(
    data: string, 
    mimeType: string, 
    transactions: Transaction[], 
    monthlyBudget: number = 3000
  ): Promise<any> {
    const context = formatTransactionsWithSign(transactions, monthlyBudget);
    
    const systemPrompt = `你是一个智能账单识别助手。

## 金额规则
- 收入：正数 + is_income: true
- 支出：正数 + is_income: false

## 输出格式
{
  "chat_response": "简短回复",
  "transactions": [{"amount": 金额, "is_income": true/false, "category": "分类", "merchant": "描述", "date": "YYYY-MM-DD"}] 或 [],
  "ai_persona": {"vibe_check": "标签", "mood_color": "#颜色"}
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${data}` } },
          { type: "text", text: "请分析这张图片" }
        ]
      }
    ];
    
    return this.callQWen(messages);
  }
}

export function setQWenApiKey(apiKey: string) {
  localStorage.setItem("qwen_api_key", apiKey);
}

export function getQWenApiKeyStored(): string {
  return localStorage.getItem("qwen_api_key") || "";
}

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
