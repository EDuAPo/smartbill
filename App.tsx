
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  PieChart, 
  Plus, 
  MessageCircle, 
  Settings, 
  CheckCircle2, 
  X,
  Edit3,
  Camera,
  Sparkles,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Loader2
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import AIAssistant from './components/AIAssistant';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { Transaction, CategoryType, User } from './types';
import { SmartBillAI } from './services/geminiService';

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrollTop = useRef(0);
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartbill_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Dock visibility state
  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isDockHovered, setIsDockHovered] = useState(false);

  // Handle scroll to show/hide dock - works globally on window scroll
  useEffect(() => {
    let ticking = false;
    
    const handleWindowScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Skip if hovering on dock
          if (isDockHovered) {
            ticking = false;
            return;
          }
          
          const currentScrollTop = window.scrollY;
          const scrollDiff = lastScrollTop.current - currentScrollTop;
          
          // Scroll down - hide dock
          if (scrollDiff < -5) {
            setIsDockVisible(false);
          }
          // Scroll up - show dock
          else if (scrollDiff > 5) {
            setIsDockVisible(true);
          }
          
          lastScrollTop.current = currentScrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [isDockHovered]);

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('smartbill_budget');
    return saved ? parseInt(saved) : 3000;
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Manual Form States
  const [mAmount, setMAmount] = useState('');
  const [mMerchant, setMMerchant] = useState('');
  const [mCategory, setMCategory] = useState<CategoryType>(CategoryType.OTHER);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<any>(null);
  const aiRef = useRef(new SmartBillAI());

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('smartbill_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('smartbill_budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  // 保存交易记录到本地存储
  useEffect(() => {
    localStorage.setItem('smartbill_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('smartbill_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smartbill_user');
  };

  const showNotify = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [newTx, ...prev]);
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    
    setIsLiveCameraOpen(false);
    setScanProgress(0);
    setIsProcessing(true);
    
    try {
      // Fix: Added transactions as the 3rd argument to match the parseMultimodal signature
      const res = await aiRef.current.parseMultimodal(data, 'image/jpeg', transactions, monthlyBudget);
      if (res?.transactions) {
        res.transactions.forEach((tx: any) => addTransaction({
          amount: tx.amount,
          merchant: tx.merchant,
          category: tx.category as CategoryType,
          date: tx.date || new Date().toLocaleDateString('en-CA'),
          isAutoImported: false,
          needConfirmation: false
        }));
        showNotify(`成功识别 ${res.transactions.length} 笔账单`);
      } else {
        showNotify("未能识别账单信息", "error");
      }
    } catch (e) { 
      showNotify("识别失败", "error"); 
    } finally { 
      setIsProcessing(false); 
    }
  }, [monthlyBudget, transactions]);

  const handleImageImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFabOpen(false);
    setIsProcessing(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        // Fix: Added transactions as the 3rd argument to match the parseMultimodal signature
        const res = await aiRef.current.parseMultimodal(base64, file.type, transactions, monthlyBudget);
        if (res?.transactions) {
          res.transactions.forEach((tx: any) => addTransaction({
            amount: tx.amount,
            merchant: tx.merchant,
            category: tx.category as CategoryType,
            date: tx.date || new Date().toLocaleDateString('en-CA'),
            isAutoImported: false,
            needConfirmation: false
          }));
          showNotify(`成功识别 ${res.transactions.length} 笔账单`);
        } else {
          showNotify("未能识别账单信息", "error");
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showNotify("处理失败", "error");
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    setIsFabOpen(false);
    setIsLiveCameraOpen(true);
    setScanProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Start auto-scan timer
      let p = 0;
      scanTimerRef.current = setInterval(() => {
        p += 2.5; // Fills in about 2 seconds
        setScanProgress(p);
        if (p >= 100) {
          clearInterval(scanTimerRef.current);
          capturePhoto();
        }
      }, 50);

    } catch (err) {
      setIsLiveCameraOpen(false);
      showNotify("相机权限被拒绝", "error");
    }
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div ref={containerRef} className="flex flex-col h-screen max-w-md mx-auto bg-black text-white relative overflow-hidden shadow-2xl">
      {/* Hidden Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageImport} />
      <canvas ref={canvasRef} className="hidden" />

      {notification && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[3000] w-full px-4 pointer-events-none flex justify-center">
          <div className={`px-4 py-2 rounded-full glass flex items-center gap-2 border shadow-lg animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'}`}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Manual Quick Record Modal */}
      {showManualForm && (
        <div className="absolute inset-0 z-[1500] bg-black/90 backdrop-blur-xl flex items-end justify-center animate-in fade-in duration-300">
           <div className="w-full max-w-md h-[70%] bg-[#0a0a0a] rounded-t-[32px] p-4 flex flex-col animate-in slide-in-from-bottom-8 duration-500 border-t border-white/10">
              <div className="flex justify-between items-center mb-3">
                 <h2 className="text-lg font-black tracking-tight">记一笔</h2>
                 <button onClick={() => setShowManualForm(false)} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                {/* 金额输入 - 更紧凑 */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-transparent rounded-2xl p-4 border border-emerald-500/20">
                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">金额</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-black text-emerald-400">¥</span>
                    <input 
                      autoFocus
                      type="number" 
                      placeholder="0.00" 
                      className="bg-transparent text-4xl font-black text-center outline-none text-emerald-400 tabular-nums w-full" 
                      value={mAmount} 
                      onChange={e => setMAmount(e.target.value)} 
                    />
                  </div>
                </div>

                {/* 商户输入 - 更紧凑 */}
                <div className="glass bg-white/5 rounded-xl p-3 flex items-center gap-2 border border-white/10">
                  <Edit3 className="w-4 h-4 text-zinc-500" />
                  <input 
                    placeholder="买了什么？" 
                    className="flex-1 bg-transparent outline-none text-sm font-bold text-white placeholder-zinc-600"
                    value={mMerchant}
                    onChange={e => setMMerchant(e.target.value)}
                  />
                </div>

                {/* 分类选择 - 3列更紧凑 */}
                <div>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">选择分类</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(CategoryType).map((cat, idx) => {
                      const gradients = [
                        'from-orange-500 to-rose-500',
                        'from-purple-500 to-pink-500',
                        'from-blue-500 to-cyan-500',
                        'from-violet-500 to-purple-500',
                        'from-emerald-500 to-teal-500',
                        'from-red-500 to-orange-500',
                        'from-indigo-500 to-blue-500',
                        'from-yellow-500 to-green-500',
                        'from-zinc-500 to-neutral-500',
                      ];
                      const icons = ['🍜', '🛍️', '🚗', '🎬', '🏠', '💊', '📚', '💰', '📦'];
                      return (
                        <button 
                          key={cat}
                          onClick={() => setMCategory(cat)}
                          className={`py-2 px-1 rounded-xl text-center transition-all duration-200 border-2 ${
                            mCategory === cat 
                              ? 'border-white shadow-lg' 
                              : 'border-transparent opacity-60 hover:opacity-100'
                          } bg-gradient-to-br ${gradients[idx]} relative overflow-hidden`}
                        >
                          <span className="text-lg">{icons[idx]}</span>
                          <span className="text-[8px] font-bold text-white block truncate">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 确认按钮 - 固定在底部 */}
              <div className="pt-2 mt-auto">
                <button 
                  disabled={!mAmount}
                  onClick={() => {
                    addTransaction({ 
                      amount: parseFloat(mAmount), 
                      category: mCategory, 
                      merchant: mMerchant || '未标注', 
                      date: new Date().toLocaleDateString('en-CA'), 
                      isAutoImported: false, 
                      needConfirmation: false 
                    });
                    setShowManualForm(false);
                    setMAmount('');
                    setMMerchant('');
                    setMCategory(CategoryType.OTHER);
                    showNotify("账单已成功入账");
                  }}
                  className="w-full py-4 bg-emerald-500 disabled:bg-emerald-500/30 disabled:grayscale rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40"
                >
                  <Check className="w-5 h-5" />
                  确认入账
                </button>
              </div>
           </div>
        </div>
      )}

      {/* FAB Overlay Menu */}
      {isFabOpen && (
        <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsFabOpen(false)}>
           <div className="absolute bottom-32 left-0 right-0 px-8 flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
              <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
                <MenuOption 
                  onClick={() => { setIsFabOpen(false); setShowManualForm(true); }}
                  icon={<Edit3 className="w-6 h-6" />}
                  label="记一笔"
                  color="bg-amber-500"
                  delay="0ms"
                />
                <MenuOption 
                  onClick={startCamera}
                  icon={<Camera className="w-6 h-6" />}
                  label="智能扫描"
                  color="bg-indigo-500"
                  delay="100ms"
                />
                <MenuOption 
                  onClick={() => fileInputRef.current?.click()}
                  icon={<ImageIcon className="w-6 h-6" />}
                  label="相册导入"
                  color="bg-emerald-500"
                  delay="200ms"
                />
              </div>
              <button onClick={() => setIsFabOpen(false)} className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                <X className="w-8 h-8 text-zinc-400" />
              </button>
           </div>
        </div>
      )}

      {isLiveCameraOpen && (
        <div className="absolute inset-0 z-[2000] bg-black flex flex-col animate-in fade-in duration-300">
          <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
          
          {/* Scanning Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <div className="relative w-[80%] aspect-[3/4] border-2 border-emerald-500/50 rounded-[40px] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Laser Scanning Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-scan-y" />
                
                {/* Scan Corners Decor */}
                <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />
             </div>

             <div className="mt-12 flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                   <svg className="w-16 h-16 -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * scanProgress) / 100} strokeLinecap="round" className="transition-all duration-100" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-emerald-500" />
                   </div>
                </div>
                <p className="text-white font-black text-sm uppercase tracking-[0.2em] bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30">
                   {scanProgress < 100 ? "正在扫描账单..." : "识别中..."}
                </p>
             </div>
          </div>

          <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-16">
            <button onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); if (scanTimerRef.current) clearInterval(scanTimerRef.current); setIsLiveCameraOpen(false); }} className="w-14 h-14 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
            <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1 group active:scale-95 transition-all">
               <div className="w-full h-full border-4 border-black rounded-full group-hover:scale-90 transition-all"/>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-all"><ImageIcon className="w-6 h-6" /></button>
          </div>

          <style>{`
            @keyframes scan-y {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .animate-scan-y {
              animation: scan-y 2s infinite ease-in-out;
            }
          `}</style>
        </div>
      )}

      <main 
        ref={mainContentRef}
        className="flex-1 overflow-y-auto pb-32 px-4 pt-8 no-scrollbar"
      >
        <Routes>
          <Route path="/" element={<Dashboard user={user} transactions={transactions} monthlyBudget={monthlyBudget} onConfirm={(id) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, needConfirmation: false } : t))} onDelete={(id) => setTransactions(prev => prev.filter(t => t.id !== id))} showNotify={showNotify} />} />
          <Route path="/reports" element={<Reports transactions={transactions} monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget} showNotify={showNotify} />} />
          <Route path="/ai" element={<AIAssistant transactions={transactions} monthlyBudget={monthlyBudget} onAdd={addTransaction} showNotify={showNotify} />} />
          <Route path="/profile" element={<Profile user={user} transactions={transactions} onLogout={handleLogout} onUserUpdate={setUser} showNotify={showNotify} />} />
        </Routes>
      </main>

      {/* Main Dock */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none z-30 transition-all duration-300 ${isDockVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`} 
      />
      <nav 
        onMouseEnter={() => setIsDockHovered(true)}
        onMouseLeave={() => setIsDockHovered(false)}
        className={`absolute left-6 right-6 glass border border-white/10 h-20 px-4 flex items-center justify-between z-40 rounded-[32px] pointer-events-auto transition-all duration-300 ${isDockVisible ? 'bottom-4 opacity-100' : '-bottom-24 opacity-0'}`}
      >
        <div className="flex flex-1 items-center justify-around pr-4">
          <NavLink to="/" icon={<Home />} label="首页" />
          <NavLink to="/reports" icon={<PieChart />} label="统计" />
        </div>
        
        <button 
          onClick={() => setIsFabOpen(true)}
          className="w-14 h-14 bg-emerald-500 rounded-[22px] flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition-all"
        >
          <Plus className="w-8 h-8 text-white" />
        </button>

        <div className="flex flex-1 items-center justify-around pl-4">
          <NavLink to="/ai" icon={<MessageCircle />} label="助手" />
          <NavLink to="/profile" icon={<Settings />} label="设置" />
        </div>
      </nav>

      {isProcessing && (
        <div className="absolute inset-0 z-[2500] glass flex flex-col items-center justify-center animate-in fade-in backdrop-blur-3xl">
          <div className="relative w-24 h-24 mb-8">
             <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
             <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
             </div>
          </div>
          <p className="text-xl font-black text-white tracking-widest mb-2">深度扫描中</p>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-[0.3em] animate-pulse">AI 正在精准分析账单数据...</p>
        </div>
      )}
    </div>
  );
};

const MenuOption: React.FC<any> = ({ icon, label, onClick, color, delay }) => (
  <button 
    onClick={onClick} 
    style={{ animationDelay: delay }}
    className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-8 duration-500 fill-mode-both"
  >
    <div className={`w-16 h-16 ${color} rounded-[24px] flex items-center justify-center text-white shadow-xl active:scale-90 transition-all`}>
      {icon}
    </div>
    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</span>
  </button>
);

const NavLink: React.FC<any> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${isActive ? 'text-emerald-400 scale-105' : 'text-zinc-500 hover:text-white'}`}
    >
      <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-500/5' : ''}`}>
        <span className="w-5 h-5 block">{icon}</span>
      </div>
      <span className="text-[9px] font-bold tracking-tight">{label}</span>
    </Link>
  );
};

const App: React.FC = () => <Router><AppContent /></Router>;
export default App;
