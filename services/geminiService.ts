// Gemini 服务已禁用，项目使用 DeepSeek API
import { Transaction } from "../types";

const API_ERROR_MESSAGE = "AI 功能需要配置 Gemini API 密钥。请在环境变量中设置 API_KEY。";

export const analyzeFinances = async (transactions: Transaction[], userQuery: string) => {
  return API_ERROR_MESSAGE;
};

export const generateSpendingPersonality = async (transactions: Transaction[]) => {
  return { persona: "理财新手", description: "AI 功能未配置", color: "#1DB954" };
};

export const generateSpendingMusing = async (transactions: Transaction[]) => {
  return "AI 功能未配置";
};

export const generateSpendingInsight = async (transactions: Transaction[]) => {
  return "AI 功能未配置";
};

export const scanBillImage = async (base64Data: string) => {
  return null;
};
