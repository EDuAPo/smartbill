
export enum CategoryType {
  FOOD = '餐饮',
  SHOPPING = '购物',
  TRANSPORT = '交通',
  ENTERTAINMENT = '娱乐',
  HOUSING = '住房',
  HEALTH = '医疗',
  EDUCATION = '教育',
  INCOME = '收入', // 新增：收入类型
  OTHER = '其他'
}

export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  phone?: string;
  isLoggedIn: boolean;
  loginMethod: 'wechat' | 'phone';
}

export interface Transaction {
  id: string;
  amount: number;
  category: CategoryType;
  merchant: string;
  date: string;
  isAutoImported: boolean;
  needConfirmation: boolean;
  rawSource?: string;
}

export interface Budget {
  total: number;
  spent: number;
  categories: Record<CategoryType, number>;
}

export interface AIAdvice {
  level: 'info' | 'warning' | 'suggestion';
  message: string;
  action?: string;
}
