
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: TransactionType;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export enum AppTab {
  HOME = 'home',
  MUSINGS = 'musings',
  AI = 'ai',
  CALENDAR = 'calendar',
  DETAILS = 'details'
}
