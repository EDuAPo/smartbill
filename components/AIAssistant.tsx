import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartBillAI } from '../services/geminiService';
import { Transaction, CategoryType } from '../types';
import { 
  Utensils, ShoppingBag, Car, Ticket, Home, Activity, GraduationCap, 
  MoreHorizontal, Camera, AudioLines, Sparkles,
  X, Plus, Mic, Edit3, Image as ImageIcon, Loader2, Send, ChevronLeft, Smile, Frown, Zap, StopCircle,
  Coins, User as UserIcon
} from 'lucide-react';

interface Props {
  user: {
    nickname: string;
    avatar?: string;
  };
  transactions: Transaction[];
  monthlyBudget: number;
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  showNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const CategoryIcons: Record<CategoryType, React.ReactNode> = {
  [CategoryType.FOOD]: <Utensils className="w-4 h-4" />,
  [CategoryType.SHOPPING]: <ShoppingBag className="w-4 h-4" />,
  [CategoryType.TRANSPORT]: <Car className="w-4 h-4" />,
  [CategoryType.ENTERTAINMENT]: <Ticket className="w-4 h-4" />,
  [CategoryType.HOUSING]: <Home className="w-4 h-4" />,
  [CategoryType.HEALTH]: <Activity className="w-4 h-4" />,
  [CategoryType.EDUCATION]: <GraduationCap className="w-4 h-4" />,
  [CategoryType.INCOME]: <Coins className="w-4 h-4" />,
  [CategoryType.OTHER]: <MoreHorizontal className="w-4 h-4" />,
};

const AIAssistant: React.FC<Props> = ({ user, transactions, monthlyBudget, onAdd, showNotify }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('财伴在看账单...');
  const [recording, setRecording] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showApiKeyGuide, setShowApiKeyGuide] = useState(false);

  const [mAmount, setMAmount] = useState('');
  const [mMerchant, setMMerchant] = useState('');
  const [mCategory, setMCategory] = useState<CategoryType>(CategoryType.OTHER);

  const STORAGE_KEY = 'smartbill_ai_messages';
  
  // 检查是否设置了 API Key
  const hasApiKey = () => {
    return !!localStorage.getItem('qwen_api_key');
  };

  const greetings = ["哟，今儿又是为哪家店的营业额做贡献了？", "还没睡？看来是今天的账单太沉，压得你睡不着？"];
  
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'ai', 
    text: string, 
    vibe?: string, 
    moodColor?: string,
    data?: any[],
    isApiKeyGuide?: boolean 
  }>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [{ role: 'ai', text: greetings[Math.floor(Math.random() * greetings.length)], vibe: '待机中' }];
      }
    }
    return [{ role: 'ai', text: greetings[Math.floor(Math.random() * greetings.length)], vibe: '待机中' }];
  });

  // 判断是否需要显示 API Key 引导
  const needsApiKeyGuide = !hasApiKey() && messages.length <= 1 && messages[0]?.role === 'ai';

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const aiRef = useRef(new SmartBillAI());
  const scrollRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const mapCategory = (catStr: string): CategoryType => {
    const s = catStr || '';
    if (s.includes('收') || s.includes('入')) return CategoryType.INCOME;
    if (s.includes('餐')) return CategoryType.FOOD;
    if (s.includes('购')) return CategoryType.SHOPPING;
    if (s.includes('交')) return CategoryType.TRANSPORT;
    if (s.includes('娱')) return CategoryType.ENTERTAINMENT;
    if (s.includes('住')) return CategoryType.HOUSING;
    if (s.includes('医')) return CategoryType.HEALTH;
    if (s.includes('教')) return CategoryType.EDUCATION;
    return CategoryType.OTHER;
  };

  /**
   * 渲染消息文本，识别并高亮金额
   */
  const renderMessageText = (text: string) => {
    // 正则匹配: ¥100, ¥ 100, 100元, 100.50元 等
    const regex = /(¥\s?\d+(\.\d+)?|(\d+(\.\d+)?)\s?元)/g;
    const parts = text.split(regex);
    
    // 因为 split 配合捕获组会把匹配项也塞进数组，我们需要过滤并渲染
    // 逻辑：parts 数组中符合 regex 的项需要特殊处理
    return text.split(regex).map((part, index) => {
      if (!part) return null;
      if (part.match(regex)) {
        return (
          <span 
            key={index} 
            className="text-lg font-black italic text-emerald-400 mx-0.5 tabular-nums underline decoration-emerald-500/30 underline-offset-4"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const processResponse = (result: any) => {
    const today = new Date().toLocaleDateString('en-CA');
    if (result) {
      const { chat_response, transactions: txs, ai_persona } = result;
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: chat_response,
        vibe: ai_persona?.vibe_check,
        moodColor: ai_persona?.mood_color,
        data: txs && txs.length > 0 ? txs : undefined
      }]);
      
      if (txs && txs.length > 0) {
        txs.forEach((tx: any) => {
          onAdd({
            amount: tx.amount,
            category: mapCategory(tx.category),
            merchant: tx.merchant,
            date: tx.date || today,
            isAutoImported: false,
            needConfirmation: false,
          });
        });
        showNotify(`这笔钱我记下了。`);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setInput('');
    setShowPlusMenu(false);
    setLoading(true);
    setLoadingText("翻账本中...");
    try {
      // 传入完整对话历史以支持上下文
      const result = await aiRef.current.parseTransaction(currentInput, transactions, monthlyBudget, messages);
      processResponse(result);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: '断网了。估计是你的账单太惊人，把基站吓坏了。' }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const result = await aiRef.current.parseMultimodal(base64Audio, 'audio/webm', transactions, monthlyBudget);
            processResponse(result);
          } catch (err) { showNotify("听不太清", "error"); }
          finally { setLoading(false); }
        };
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) { showNotify("权限拒绝", "error"); }
  };

  const stopVoice = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const startCamera = async () => {
    setShowPlusMenu(false);
    setIsLiveCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      let p = 0;
      scanTimerRef.current = setInterval(() => {
        p += 2; setScanProgress(p);
        if (p >= 100) { clearInterval(scanTimerRef.current); autoCapture(); }
      }, 50);
    } catch (err) { setIsLiveCameraOpen(false); }
  };

  const autoCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsLiveCameraOpen(false);
    setLoading(true);
    try {
      const res = await aiRef.current.parseMultimodal(data, 'image/jpeg', transactions, monthlyBudget);
      processResponse(res);
    } finally { setLoading(false); }
  }, [showNotify, transactions, monthlyBudget]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black">
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Manual Entry */}
      {showManualForm && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-xl px-6">
           <div className="w-full glass rounded-[40px] p-8 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black">手动录入</h2>
                 <button onClick={() => setShowManualForm(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={(e) => {
                 e.preventDefault();
                 onAdd({ amount: parseFloat(mAmount), category: mCategory, merchant: mMerchant, date: new Date().toLocaleDateString('en-CA'), isAutoImported: false, needConfirmation: false });
                 setShowManualForm(false);
              }} className="space-y-6">
                 <input type="number" placeholder="¥ 0.00" className="bg-transparent text-5xl font-black text-center outline-none w-full" value={mAmount} onChange={e => setMAmount(e.target.value)} />
                 <input placeholder="买了什么？" className="w-full bg-white/5 rounded-2xl py-4 px-5 outline-none" value={mMerchant} onChange={e => setMMerchant(e.target.value)} />
                 <button className="w-full py-5 bg-emerald-500 rounded-2xl font-black">确认入账</button>
              </form>
           </div>
        </div>
      )}

      {isLiveCameraOpen && (
        <div className="absolute inset-0 z-[600] bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] aspect-[3/4] border-2 border-emerald-500/30 rounded-[40px]" />
          </div>
          <button onClick={() => setIsLiveCameraOpen(false)} className="absolute top-8 right-6 w-12 h-12 glass rounded-full flex items-center justify-center"><X className="w-6 h-6" /></button>
        </div>
      )}

      {recording && (
        <div className="absolute inset-0 z-[700] bg-black/90 flex flex-col items-center justify-center">
          <AudioLines className="w-16 h-16 text-emerald-500 animate-pulse mb-8" />
          <button onClick={stopVoice} className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center"><StopCircle className="w-10 h-10" /></button>
        </div>
      )}

      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.05] bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-zinc-400"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex-1">
          <h1 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
            财伴 AI 助手
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </h1>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">你的财务吐槽大师</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-8 no-scrollbar pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${m.role === 'user' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
              {m.role === 'user' ? <UserIcon className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            </div>

            {/* Bubble Container */}
            <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
              <div 
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg transition-all duration-300 ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-none' 
                    : 'bg-zinc-900 border border-white/10 text-zinc-100 rounded-bl-none'
                }`}
                style={m.role === 'ai' && m.moodColor ? { borderLeftColor: m.moodColor, borderLeftWidth: '3px' } : {}}
              >
                {/* 使用 renderMessageText 渲染，支持金额高亮 */}
                <p className="flex flex-wrap items-baseline gap-y-1">
                  {renderMessageText(m.text)}
                </p>
                
                {m.data && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-white/10 w-full">
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">自动识别结果</div>
                    {m.data.map((tx, idx) => (
                      <div key={idx} className="bg-black/50 p-2.5 rounded-xl flex justify-between items-center text-xs border border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center">
                            {CategoryIcons[mapCategory(tx.category)]}
                          </div>
                          <span className="font-bold truncate max-w-[80px]">{tx.merchant}</span>
                        </div>
                        <span className="text-emerald-400 font-black tabular-nums">¥{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status/Vibe Indicator */}
              {m.role === 'ai' && m.vibe && (
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1 ml-1">
                  {m.vibe}
                </span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            </div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest animate-pulse">{loadingText}</p>
          </div>
        )}
      </div>

      {/* Chat Bar */}
      <div className="px-4 py-4 z-40 bg-gradient-to-t from-black via-black to-transparent">
        <div className="relative">
          {showPlusMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-4 glass rounded-[32px] p-3 flex gap-3 animate-in slide-in-from-bottom-4 duration-300">
              <button onClick={startCamera} className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-white/10 rounded-2xl transition-all group">
                <div className="w-12 h-12 bg-emerald-500/10 group-active:scale-90 transition-transform rounded-2xl flex items-center justify-center text-emerald-500"><Camera className="w-6 h-6" /></div>
                <span className="text-[9px] font-black uppercase text-zinc-400">智能相机</span>
              </button>
              <button onClick={() => setShowManualForm(true)} className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-white/10 rounded-2xl transition-all group">
                <div className="w-12 h-12 bg-amber-500/10 group-active:scale-90 transition-transform rounded-2xl flex items-center justify-center text-amber-500"><Edit3 className="w-6 h-6" /></div>
                <span className="text-[9px] font-black uppercase text-zinc-400">手动速记</span>
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-white/10 rounded-2xl transition-all group">
                <div className="w-12 h-12 bg-indigo-500/10 group-active:scale-90 transition-transform rounded-2xl flex items-center justify-center text-indigo-500"><ImageIcon className="w-6 h-6" /></div>
                <span className="text-[9px] font-black uppercase text-zinc-400">从相册选</span>
              </button>
            </div>
          )}

          <div className="glass bg-zinc-900/90 border border-white/10 rounded-[32px] p-2 flex items-center gap-2 shadow-2xl">
            <button 
              onClick={() => setShowPlusMenu(!showPlusMenu)} 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showPlusMenu ? 'bg-zinc-800 text-white rotate-45' : 'bg-white/5 text-zinc-400'}`}
            >
              <Plus className="w-6 h-6" />
            </button>
            
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSend()} 
              placeholder="问问今天花了多少..." 
              className="flex-1 bg-transparent outline-none text-sm font-medium px-2 py-2 text-white placeholder-zinc-600" 
            />
            
            <button 
              onClick={input.trim() ? handleSend : startVoice} 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                input.trim() 
                  ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {input.trim() ? <Send className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;