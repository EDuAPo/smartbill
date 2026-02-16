import { User, Transaction } from '../types';

export class UserService {
  private static instance: UserService;

  public static getInstance(): UserService {
    if (!UserService.instance) UserService.instance = new UserService();
    return UserService.instance;
  }

  /**
   * 更新用户信息
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const saved = localStorage.getItem('smartbill_user');
    if (!saved) throw new Error('用户未登录');
    
    const currentUser = JSON.parse(saved);
    const updatedUser = { ...currentUser, ...updates };
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem('smartbill_user', JSON.stringify(updatedUser));
    return updatedUser;
  }

  /**
   * 导出所有账单数据
   */
  async exportData(transactions: Transaction[]): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  /**
   * 永久注销账户
   */
  async deleteAccount(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    localStorage.clear();
    return true;
  }

  /**
   * 获取安全审计日志（模拟）
   */
  async getSecurityLogs() {
    return [
      { id: 1, event: '登录成功', time: new Date().toLocaleString(), ip: '127.0.0.1' },
      { id: 2, event: '修改头像', time: '2023-10-24 14:20', ip: '127.0.0.1' }
    ];
  }
}
