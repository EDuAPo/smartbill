import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    if (!username.trim()) return;
    setIsLoading(true);
    
    // 模拟登录延迟
    setTimeout(() => {
      console.log('LoginScreen: Calling onLoginSuccess with user:', username);
      onLoginSuccess({ username, loginTime: new Date().toISOString() });
      console.log('LoginScreen: onLoginSuccess called, setIsLoading(false)');
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="h-screen w-screen bg-[#121212] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1DB954] rounded-full blur-[120px] opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#1DB954] rounded-full blur-[150px] opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo 区域 */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="/android-chrome-512x512.png" 
                alt="SmartBill Logo"
                className="w-32 h-32 rounded-3xl shadow-[0_0_60px_rgba(29,185,84,0.5)]"
              />
            </div>
          </div>
          
          <h1 className="text-5xl font-black text-white tracking-tight">
            SmartBill
          </h1>
          <p className="text-[#B3B3B3] text-sm font-medium tracking-wide">
            你的财务 AI 助手 · 让记账像听歌一样简单
          </p>
        </div>

        {/* 登录表单 */}
        <div className="bg-[#181818] rounded-3xl p-8 border border-[rgba(255,255,255,0.1)] shadow-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-[#B3B3B3] text-xs font-black uppercase tracking-widest">
              输入你的昵称
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="例如：财务大师"
              className="w-full bg-[#282828] text-white px-6 py-4 rounded-2xl border-2 border-transparent focus:border-[#1DB954] outline-none transition-all placeholder-[#535353] font-medium"
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!username.trim() || isLoading}
            className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-base py-4 rounded-full transition-all shadow-[0_8px_30px_rgba(29,185,84,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 uppercase tracking-wider"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                <span>启动中...</span>
              </div>
            ) : (
              '开始记账之旅'
            )}
          </button>
        </div>

        {/* 底部提示 */}
        <div className="text-center space-y-3">
          <p className="text-[#535353] text-xs">
            🎵 采用 Spotify 风格设计 · 极致体验
          </p>
          <div className="flex items-center justify-center space-x-4 text-[#535353] text-xs">
            <span>✨ AI 智能分析</span>
            <span>·</span>
            <span>📊 可视化图表</span>
            <span>·</span>
            <span>🌍 多语言支持</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
