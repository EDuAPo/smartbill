
/**
 * Authentication Service
 * 预留真实 API 接入位置
 */

export const sendSMSCode = async (phone: string) => {
  console.log(`Sending code to ${phone}`);
  // 真实接入示例:
  // const response = await fetch('/api/auth/send-sms', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ phone })
  // });
  // if (!response.ok) throw new Error('Failed to send SMS');
  // return response.json();
  
  // 模拟 API 延迟
  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1200));
};

export const loginWithPhone = async (phone: string, code: string) => {
  console.log(`Logging in with ${phone} and code ${code}`);
  // 真实接入示例:
  // const response = await fetch('/api/auth/login-phone', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ phone, code })
  // });
  // if (!response.ok) throw new Error('Invalid code or phone');
  // return response.json();
  
  // 模拟成功登录
  return new Promise((resolve) => setTimeout(() => resolve({ 
    success: true, 
    token: 'mock-jwt-token-xyz',
    user: { name: '财友' + phone.slice(-4), id: 'u' + Date.now() }
  }), 1500));
};

export const loginWithWeChat = async () => {
  console.log('Initiating WeChat OAuth...');
  // 微信授权流程:
  // 1. 跳转到微信授权页
  // window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=YOUR_APPID&redirect_uri=${encodeURIComponent(window.location.href)}&response_type=code&scope=snsapi_userinfo#wechat_redirect`;
  
  // 模拟成功
  return new Promise((resolve) => setTimeout(() => resolve({ 
    success: true, 
    user: { name: '微信乐财人', id: 'wx_' + Math.random().toString(36).substr(2, 9) } 
  }), 1800));
};

export const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  window.location.reload();
};
