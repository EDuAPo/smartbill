
import { User } from '../types';

const SESSION_KEY = 'smartbill_session_token';
const OTP_STORAGE_KEY = 'smartbill_otp_cache';

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) AuthService.instance = new AuthService();
    return AuthService.instance;
  }

  // --- 验证码持久化逻辑 ---
  
  private saveOtp(phone: string, code: string) {
    const cache = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
    cache[phone] = {
      code,
      expiry: Date.now() + 5 * 60 * 1000 // 5分钟有效期
    };
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(cache));
  }

  private getOtp(phone: string): string | null {
    const cache = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
    const entry = cache[phone];
    if (entry && entry.expiry > Date.now()) {
      return entry.code;
    }
    return null;
  }

  // --- 微信 OAuth 2.0 逻辑 ---

  public getWechatAuthUrl(): string {
    const WECHAT_APP_ID = 'wx_sb_production_888';
    const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname);
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('wx_auth_state', state); 
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_APP_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
  }

  async exchangeCodeForUser(code: string): Promise<{ user: User; token: string; needPhoneBinding?: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    // 模拟：微信登录时总是要求绑定手机号，以便与手机号账号数据同步
    // 真正的生产环境需要后端来处理微信登录并关联手机号
    
    // 返回需要绑定手机号的标志
    return { 
      user: {} as User, 
      token: '', 
      needPhoneBinding: true 
    };
  }
  
  // 微信登录后绑定手机号并同步数据
  async bindPhoneAndLogin(phone: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const validCode = this.getOtp(phone);
    
    // 允许 8888 作为万能开发码
    if (code !== validCode && code !== '8888') {
      return { success: false, message: '验证码错误或已失效' };
    }
    
    // 检查是否已有该手机号的用户数据
    const userDataKey = `smartbill_user_${phone}`;
    const existingUserData = localStorage.getItem(userDataKey);
    
    let user: User;
    
    if (existingUserData) {
      // 恢复已有用户数据
      user = JSON.parse(existingUserData);
      user.isLoggedIn = true;
      user.loginMethod = 'wechat'; // 更新登录方式
    } else {
      // 创建新用户
      user = {
        id: 'u_' + phone,
        nickname: `财友_${phone.slice(-4)}`,
        phone,
        isLoggedIn: true,
        loginMethod: 'wechat',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`
      };
    }
    
    localStorage.setItem(SESSION_KEY, btoa(user.id));
    localStorage.setItem('smartbill_user', JSON.stringify(user));
    localStorage.setItem(userDataKey, JSON.stringify(user));
    
    // 登录成功后清除该手机号的验证码缓存
    const cache = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
    delete cache[phone];
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(cache));
    
    return { success: true, message: '绑定成功', user };
  }

  // --- 手机号验证码逻辑 (修复核心) ---

  async sendOTP(phone: string): Promise<{ success: boolean; code: string }> {
    // 模拟真实网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 生成 4 位验证码
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // 存入本地存储，防止刷新丢失
    this.saveOtp(phone, code);
    
    console.log(`%c [SMS Gateway] 目标: ${phone} | 验证码: ${code} `, 'background: #10b981; color: #fff; padding: 2px 5px; border-radius: 4px;');
    
    return { success: true, code };
  }

  async verifyAndLogin(phone: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const validCode = this.getOtp(phone);
    
    // 允许 8888 作为万能开发码
    if (code !== validCode && code !== '8888') {
      return { success: false, message: '验证码错误或已失效' };
    }

    // 检查是否已有该手机号的用户数据
    const userDataKey = `smartbill_user_${phone}`;
    const existingUserData = localStorage.getItem(userDataKey);
    
    let user: User;
    
    if (existingUserData) {
      // 恢复已有用户数据
      user = JSON.parse(existingUserData);
      user.isLoggedIn = true;
    } else {
      // 创建新用户
      user = {
        id: 'u_' + phone,
        nickname: `财友_${phone.slice(-4)}`,
        phone,
        isLoggedIn: true,
        loginMethod: 'phone',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`
      };
    }

    localStorage.setItem(SESSION_KEY, btoa(user.id));
    localStorage.setItem('smartbill_user', JSON.stringify(user));
    
    // 保存用户数据到以手机号为键的空间
    localStorage.setItem(userDataKey, JSON.stringify(user));
    
    // 登录成功后清除该手机号的验证码缓存
    const cache = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}');
    delete cache[phone];
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(cache));

    return { success: true, message: '登录成功', user };
  }

  isValidPhone(phone: string): boolean {
    return /^1[3-9]\d{9}$/.test(phone);
  }

  logout() {
    localStorage.clear();
  }
}
