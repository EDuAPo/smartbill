import React, { useState, useEffect } from 'react';
import { 
  Smartphone, MessageCircle, ChevronLeft, ArrowRight, 
  Loader2, ShieldCheck, Sparkles, User as UserIcon, 
  Lock, Phone, Info, X, CheckCircle, Zap
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
      setError('手机号格式不正确');
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
        // 10秒后自动消失
        setTimeout(() => setSmsData(null), 10000);
      }
    } catch (err) {
      setError('发送失败，请检查网络');
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
      onLogin(res.user);
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  const quickFill = () => {
    if (smsData) {
      setOtp(smsData.code);
      setSmsData(null);
    }
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
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-emerald-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full" />

      {/* Improved SMS Banner Notification */}
      {smsData && (
        <div className="fixed top-6 left-4 right-4 z-[3000] animate-in slide-in-from-top-12 duration-500">
           <div className="glass bg-white/10 border-white/20 p-4 rounded-[24px] flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] border backdrop-blur-3xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0">
                    <MessageCircle className="w-6 h-6 text-black" fill="black" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">信息 • 刚刚</p>
                   <p className="text-sm font-bold text-white">验证码: <span className="text-emerald-400 tracking-[0.2em] ml-1">{smsData.code}</span></p>
                 </div>
              </div>
              <button 
                onClick={quickFill}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black px-4 py-2 rounded-full transition-all flex items-center gap-1 active:scale-90"
              >
                <Zap className="w-3 h-3 fill-current" /> 一键填入
              </button>
           </div>
        </div>
      )}

      <div className="w-full max-sm relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <div className="mb-14 text-center">
           <div className="w-20 h-20 bg-zinc-900 rounded-[38px] flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-2xl">
              <Sparkles className="w-10 h-10 text-emerald-500" />
           </div>
           <h1 className="text-4xl font-black tracking-tighter mb-2 italic text-white">SmartBill</h1>
           <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">财伴，你的AI财务搭子</p>
        </div>

        {step === 'selection' ? (
          <div className="w-full space-y-4 animate-in fade-in duration-500">
            <button onClick={handleWechatLogin} className="w-full py-5 bg-[#07C160] rounded-[28px] flex items-center justify-center gap-3 active:scale-[0.96] transition-all shadow-xl shadow-emerald-900/20">
              <MessageCircle className="w-6 h-6 text-white" fill="white" />
              <span className="font-bold text-white">微信一键登录</span>
            </button>
            <button onClick={() => setStep('phone_input')} className="w-full py-5 glass rounded-[28px] flex items-center justify-center gap-3 border-white/10 hover:bg-white/5 active:scale-[0.96] transition-all">
              <Smartphone className="w-6 h-6 text-zinc-400" />
              <span className="font-bold text-zinc-400">手机号快捷登录</span>
            </button>
            <p className="mt-20 text-[9px] text-zinc-600 text-center leading-relaxed">
              登录即同意 <span className="underline">服务协议</span> 与 <span className="underline">隐私政策</span>
            </p>
          </div>
        ) : step === 'phone_input' ? (
          <div className="w-full space-y-6 animate-in slide-in-from-right-8 duration-500">
            <button onClick={() => setStep('selection')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">返回</span>
            </button>
            <div className="space-y-4">
               <div className="glass rounded-[28px] p-5 border-white/5 flex items-center gap-4 focus-within:border-emerald-500/40 transition-all">
                  <span className="text-emerald-500 font-black text-sm pr-4 border-r border-white/10">+86</span>
                  <input 
                    autoFocus
                    type="tel" 
                    placeholder="请输入手机号" 
                    className="bg-transparent border-none outline-none flex-1 text-base font-bold tracking-widest text-white"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0,11))}
                  />
               </div>
               {error && <p className="text-[10px] text-rose-500 font-black text-center uppercase tracking-widest">{error}</p>}
               <button 
                 onClick={handleSendOTP}
                 disabled={loading || phone.length < 11}
                 className="w-full py-5 bg-white text-black rounded-[28px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '获取验证码'}
               </button>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-8 animate-in slide-in-from-right-8 duration-500">
            <button onClick={() => setStep('phone_input')} className="flex items-center gap-2 text-zinc-500 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">重输手机号</span>
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2 text-white">输入 4 位验证码</h2>
              <p className="text-zinc-500 text-xs">已发送至 +86 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
            </div>
            <div className="space-y-6">
               <div className="glass rounded-[28px] p-5 border-white/5 focus-within:border-emerald-500/40 transition-all">
                  <input 
                    autoFocus
                    type="number" 
                    placeholder="••••" 
                    className="bg-transparent border-none outline-none w-full text-4xl font-black tracking-[0.6em] text-center text-white"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,4))}
                  />
               </div>
               <div className="flex justify-between items-center px-4">
                 <button 
                   onClick={handleSendOTP}
                   disabled={countdown > 0}
                   className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 disabled:opacity-30"
                 >
                   {countdown > 0 ? `${countdown}s 后重发` : '重新获取'}
                 </button>
                 {error && <p className="text-[10px] text-rose-500 font-black uppercase">{error}</p>}
               </div>
               <button 
                 onClick={handleVerifyOTP}
                 disabled={loading || otp.length < 4}
                 className="w-full py-6 bg-emerald-500 text-white rounded-[28px] font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-20"
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '进入财伴'}
               </button>
            </div>
          </div>
        )}

        <div className="mt-20 flex items-center gap-3 px-6 py-2.5 glass rounded-full border-white/5 opacity-40">
           <ShieldCheck className="w-4 h-4 text-emerald-500" />
           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">数据通过 AES-256 安全加密</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
