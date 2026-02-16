import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, MessageCircle, ChevronLeft, ArrowRight, 
  Loader2, ShieldCheck, Sparkles, User as UserIcon, 
  Lock, Phone, Info, X, CheckCircle, Zap, Check
} from 'lucide-react';
import { User } from '../types';
import { AuthService } from '../services/authService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const authService = AuthService.getInstance();

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'selection' | 'phone_input' | 'otp_verify' | 'oauth_callback'>('selection');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [smsData, setSmsData] = useState<{code: string} | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // 检查是否已登录
  useEffect(() => {
    const savedUser = localStorage.getItem('smartbill_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.isLoggedIn) {
          onLogin(user);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) handleOAuthCallback(code);
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // 输入框自动聚焦
  useEffect(() => {
    if (step === 'phone_input' && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current?.focus(), 300);
    }
    if (step === 'otp_verify' && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 300);
    }
  }, [step]);

  const handleWechatLogin = () => {
    window.location.href = authService.getWechatAuthUrl();
  };

  const handleOAuthCallback = async (code: string) => {
    setStep('oauth_callback');
    setLoading(true);
    try {
      const { user } = await authService.exchangeCodeForUser(code);
      window.history.replaceState({}, document.title, window.location.pathname);
      onLogin(user);
    } catch (e) {
      setError('微信认证失败');
      setStep('selection');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!authService.isValidPhone(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.sendOTP(phone);
      if (res.success) {
        setStep('otp_verify');
        setCountdown(60);
        setSmsData({ code: res.code });
        setTimeout(() => setSmsData(null), 15000);
      }
    } catch (err) {
      setError('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) return;
    setLoading(true);
    setError('');
    const res = await authService.verifyAndLogin(phone, otp);
    if (res.success && res.user) {
      if (rememberMe) {
        localStorage.setItem('smartbill_remember', 'true');
      }
      onLogin(res.user);
    } else {
      setError(res.message || '验证码错误');
      setLoading(false);
    }
  };

  const handlePhoneKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phone.length >= 11) {
      handleSendOTP();
    }
  };

  const handleOtpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.length >= 4) {
      handleVerifyOTP();
    }
  };

  const quickFill = () => {
    if (smsData) {
      setOtp(smsData.code);
      setSmsData(null);
      // 自动提交
      setTimeout(() => handleVerifyOTP(), 300);
    }
  };

  // 测试模式提示
  const showTestHint = () => {
    setError('演示模式：验证码填写 8888 即可登录');
    setTimeout(() => setError(''), 3000);
  };

  if (step === 'oauth_callback') {
    return (
      <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-white font-bold">微信安全验证中...</h2>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-emerald-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full" />

      {/* SMS Banner Notification */}
      {smsData && (
        <div className="fixed top-6 left-4 right-4 z-[3000] animate-in slide-in-from-top-12 duration-500">
           <div className="glass bg-white/10 border-white/20 p-4 rounded-[24px] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border backdrop-blur-3xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">验证码</p>
                   <p className="text-sm font-bold text-white">{smsData.code}</p>
                 </div>
              </div>
              <button 
                onClick={quickFill}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold px-3 py-2 rounded-full transition-all flex items-center gap-1 active:scale-90"
              >
                一键填入
              </button>
           </div>
        </div>
      )}

      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-10 text-center">
           <div className="w-18 h-18 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[32px] flex items-center justify-center mb-5 mx-auto shadow-2xl shadow-emerald-500/30">
              <Sparkles className="w-9 h-9 text-white" />
           </div>
           <h1 className="text-3xl font-black tracking-tight mb-2 italic text-white">SmartBill</h1>
           <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">AI 财务记账助手</p>
        </div>

        {step === 'selection' ? (
          <div className="w-full space-y-4 animate-in fade-in duration-500">
            {/* 微信登录 */}
            <button 
              onClick={handleWechatLogin} 
              className="w-full py-4.5 bg-[#07C160] hover:bg-[#06ad56] rounded-[24px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/20"
            >
              <MessageCircle className="w-5 h-5 text-white" fill="white" />
              <span className="font-bold text-white">微信一键登录</span>
            </button>
            
            {/* 分割线 */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] text-zinc-600 font-bold uppercase">或</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* 手机号登录 */}
            <button 
              onClick={() => setStep('phone_input')} 
              className="w-full py-4.5 glass rounded-[24px] flex items-center justify-center gap-3 border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all"
            >
              <Smartphone className="w-5 h-5 text-zinc-400" />
              <span className="font-bold text-zinc-300">手机号登录</span>
            </button>

            {/* 测试模式提示 */}
            <button 
              onClick={showTestHint}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 underline"
            >
              演示模式说明
            </button>
            
            {error && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-[11px] text-amber-500">{error}</p>
              </div>
            )}

            <p className="mt-8 text-[8px] text-zinc-700 text-center leading-relaxed">
              登录即同意 <span className="text-zinc-500 underline">服务协议</span> 与 <span className="text-zinc-500 underline">隐私政策</span>
            </p>
          </div>
        ) : step === 'phone_input' ? (
          <div className="w-full space-y-5 animate-in slide-in-from-right-8 duration-500">
            <button 
              onClick={() => { setStep('selection'); setError(''); }} 
              className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">返回</span>
            </button>

            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-white mb-1">手机号登录</h2>
              <p className="text-zinc-500 text-xs">未注册的手机号将自动创建账号</p>
            </div>

            <div className="space-y-4">
               <div className="glass rounded-[20px] p-4 border border-white/5 flex items-center gap-3 focus-within:border-emerald-500/50 transition-all">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-zinc-500 text-xs font-bold uppercase block mb-0.5">手机号</span>
                    <input 
                      ref={phoneInputRef}
                      type="tel" 
                      placeholder="请输入 11 位手机号" 
                      className="bg-transparent border-none outline-none w-full text-base font-bold tracking-wide text-white placeholder-zinc-700"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0,11))}
                      onKeyPress={handlePhoneKeyPress}
                    />
                  </div>
                  {phone.length === 11 && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
               </div>

               {error && (
                 <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2">
                   <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                   <p className="text-[11px] text-rose-500">{error}</p>
                 </div>
               )}

               <button 
                 onClick={handleSendOTP}
                 disabled={loading || phone.length < 11}
                 className="w-full py-4 bg-white text-black rounded-[20px] font-bold active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '获取验证码'}
               </button>
            </div>

            <p className="text-center text-[10px] text-zinc-600">
              测试模式：验证码填写 <span className="text-emerald-500 font-bold">8888</span>
            </p>
          </div>
        ) : (
          <div className="w-full space-y-6 animate-in slide-in-from-right-8 duration-500">
            <button 
              onClick={() => { setStep('phone_input'); setOtp(''); setError(''); }} 
              className="flex items-center gap-2 text-zinc-500 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">更换手机号</span>
            </button>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">输入验证码</h2>
              <p className="text-zinc-500 text-xs">已发送至 {phone.slice(0,3)}****{phone.slice(-4)}</p>
            </div>

            <div className="space-y-4">
               <div className="glass rounded-[20px] p-4 border border-white/5 focus-within:border-emerald-500/50 transition-all">
                  <input 
                    ref={otpInputRef}
                    type="number" 
                    placeholder="请输入 4 位验证码" 
                    className="bg-transparent border-none outline-none w-full text-3xl font-bold tracking-[0.5em] text-center text-white placeholder-zinc-700"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,4))}
                    onKeyPress={handleOtpKeyPress}
                  />
               </div>

               <div className="flex justify-between items-center px-1">
                 <button 
                   onClick={handleSendOTP}
                   disabled={countdown > 0}
                   className="text-[11px] font-bold text-zinc-500 hover:text-emerald-500 disabled:opacity-30 transition-colors"
                 >
                   {countdown > 0 ? `${countdown}秒后可重发` : '重新获取验证码'}
                 </button>
               </div>

               {error && (
                 <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2">
                   <X className="w-4 h-4 text-rose-500 flex-shrink-0" />
                   <p className="text-[11px] text-rose-500">{error}</p>
                 </div>
               )}

               <button 
                 onClick={handleVerifyOTP}
                 disabled={loading || otp.length < 4}
                 className="w-full py-4.5 bg-emerald-500 text-white rounded-[20px] font-bold active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-30 flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>
                     <span>进入财伴</span>
                     <ArrowRight className="w-4 h-4" />
                   </>
                 )}
               </button>
            </div>

            {/* 记住我选项 */}
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <div 
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}
              >
                {rememberMe && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-xs text-zinc-500">30 天内免登录</span>
            </label>
          </div>
        )}

        <div className="mt-12 flex items-center gap-2 px-4 py-2 glass rounded-full border-white/5">
           <ShieldCheck className="w-4 h-4 text-emerald-500" />
           <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500">AES-256 加密保护</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
