import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartBillAI } from '../services/geminiService';
import { Transaction, CategoryType } from '../types';
import { 
  Camera, Sparkles,
  X, Plus, Mic, Edit3, Image as ImageIcon, Loader2, Send, ChevronLeft, 
  User as UserIcon, TrendingUp, TrendingDown, Volume2
} from 'lucide-react';

interface Props {
  user: { nickname: string; avatar?: string; };
  transactions: Transaction[];
  monthlyBudget: number;
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  showNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function safeParseNum(n: any, fallback: number = 0): number {
  const num = parseFloat(n);
  return (isNaN(num) || !isFinite(num)) ? fallback : num;
}

interface AIMessage {
  role: 'user' | 'ai';
  text: string;
  transactions?: Array<{ amount: number; is_income: boolean; category: string; merchant: string; date: string; }>;
  vibe_check?: string;
  mood_color?: string;
}

const moodEmojis: Record<string, string> = {
  '开心': '😊', '提醒': '💡', '警告': '⚠️', '沮丧': '😔', '聊天': '😄', '等待配置': '⏳', '正常': '✨',
};

const AIAssistant: React.FC<Props> = ({ user, transactions, monthlyBudget, onAdd, showNotify }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('财伴在思考中...');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  // 语音状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [mAmount, setMAmount] = useState('');
  const [mMerchant, setMMerchant] = useState('');
  const [mCategory, setMCategory] = useState<CategoryType>(CategoryType.OTHER);
  const [mIsIncome, setMIsIncome] = useState(false);

  const STORAGE_KEY = 'smartbill_ai_messages';
  
  const greetings = [
    "嗨！我是财伴，你的智能财务管家～有啥财务问题尽管问我！",
    "哟！今儿想聊点啥？记账、查账、还是想知道自己还有多少钱可以造？",
    "Hey~ 准备好了吗？让我帮你盯着钱包！"
  ];
  
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({
            role: m.role === 'user' || m.role === 'ai' ? m.role : 'ai',
            text: typeof m.text === 'string' ? m.text : '',
            transactions: m.transactions,
            vibe_check: m.vibe_check,
            mood_color: m.mood_color
          }));
        }
      } catch (e) { console.error('Failed to parse messages:', e); }
    }
    return [{ role: 'ai', text: greetings[Math.floor(Math.random() * greetings.length)], vibe_check: '聊天' }];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const aiRef = useRef(new SmartBillAI());
  const scrollRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // 录音计时器
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => { setRecordingTime(prev => prev + 1); }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 网页版：按下开始，松开结束
  const handleMouseDown = () => { setIsMouseDown(true); startRecording(); };
  const handleMouseUp = () => { if (isMouseDown) { setIsMouseDown(false); stopRecording(); } };
  const handleMouseLeave = () => { if (isMouseDown) { setIsMouseDown(false); cancelRecording(); } };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showNotify("您的浏览器不支持语音识别", "error"); return; }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      
      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingText('');
        setShowRecordingUI(true);
      };
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) { transcript += event.results[i][0].transcript; }
        setRecordingText(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        if (event.error !== 'no-speech') { setIsRecording(false); setShowRecordingUI(false); }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) { showNotify("语音识别启动失败", "error"); }
  };

  const stopRecording = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsRecording(false);
    
    if (recordingText.trim()) {
      setInput(recordingText);
      setTimeout(() => { if (recordingText.trim()) handleSend(recordingText); }, 300);
    }
    setTimeout(() => { setShowRecordingUI(false); setRecordingText(''); }, 500);
  };

  const cancelRecording = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsRecording(false);
    setRecordingText('');
    setShowRecordingUI(false);
    showNotify("已取消录音", "info");
  };

  const mapCategory = (catStr: string): CategoryType => {
    const s = catStr || '';
    if (s.includes('收') || s.includes('入') || s.includes('工资') || s.includes('钱')) return CategoryType.INCOME;
    if (s.includes('餐') || s.includes('吃') || s.includes('饭')) return CategoryType.FOOD;
    if (s.includes('购') || s.includes('买') || s.includes('淘宝')) return CategoryType.SHOPPING;
    if (s.includes('交') || s.includes('车') || s.includes('打车')) return CategoryType.TRANSPORT;
    if (s.includes('娱') || s.includes('电影') || s.includes('游戏')) return CategoryType.ENTERTAINMENT;
    if (s.includes('住') || s.includes('房') || s.includes('租')) return CategoryType.HOUSING;
    if (s.includes('医') || s.includes('药') || s.includes('看病')) return CategoryType.HEALTH;
    if (s.includes('教') || s.includes('学费') || s.includes('培训')) return CategoryType.EDUCATION;
    return CategoryType.OTHER;
  };

  const renderMessageText = (text: string) => {
    if (!text || typeof text !== 'string') return null;
    const regex = /(¥\s?\d+(\.\d+)?|(\d+(\.\d+)?)\s?元)/g;
    return text.split(regex).map((part, index) => {
      if (!part) return null;
      if (part.match(regex)) {
        return <span key={index} className="text-lg font-black italic text-emerald-400 mx-0.5 tabular-nums">{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const processResponse = (result: any) => {
    const today = new Date().toLocaleDateString('en-CA');
    if (result && result.chat_response) {
      const { chat_response, transactions: txs, vibe_check, mood_color } = result;
      
      let addedCount = 0;
      if (txs && Array.isArray(txs)) {
        for (const tx of txs) {
          const amount = safeParseNum(tx.amount, 0);
          if (amount > 0) {
            const isIncome = tx.is_income === true;
            let category = mapCategory(tx.category);
            if (isIncome && category !== CategoryType.INCOME) category = CategoryType.INCOME;
            else if (!isIncome && category === CategoryType.INCOME) category = CategoryType.OTHER;
            
            onAdd({ amount, category, merchant: tx.merchant || '未知', date: tx.date || today, isAutoImported: false, needConfirmation: false });
            addedCount++;
          }
        }
      }
      
      if (addedCount > 0) showNotify(`已添加 ${addedCount} 笔记录`);
      setMessages(prev => [...prev, { role: 'ai', text: chat_response, transactions: txs, vibe_check, mood_color }]);
    } else {
      setMessages(prev => [...prev, { role: 'ai', text: '收到消息啦～还有什么需要我帮忙的吗？', vibe_check: '聊天' }]);
    }
  };

  const handleSend = async (text?: string) => {
    const textToSend = text || input;
    if (!textToSend.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setShowPlusMenu(false);
    setLoading(true);
    setLoadingText("思考中...");
    try {
      const result = await aiRef.current.parseTransaction(textToSend, transactions, monthlyBudget, messages);
      processResponse(result);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: '哎呀，脑子有点乱...咱们换个话题？', vibe_check: '沮丧' }]);
    } finally { setLoading(false); }
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
  
  const [scanProgress, setScanProgress] = useState(0);

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
    } catch (error) { console.error('Image capture error:', error); }
    finally { setLoading(false); }
  }, [transactions, monthlyBudget]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = safeParseNum(mAmount, 0);
    if (amount <= 0) { showNotify("请输入有效金额", "error"); return; }
    onAdd({ amount, category: mCategory, merchant: mMerchant || '手动记账', date: new Date().toLocaleDateString('en-CA'), isAutoImported: false, needConfirmation: false });
    setShowManualForm(false);
    setMAmount('');
    setMMerchant('');
    showNotify(mIsIncome ? '收入记好了！' : '支出记好了！');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black">
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" />
      <canvas ref={canvasRef} className="hidden" />

      {/* 录音弹窗 */}
      {showRecordingUI && (
        <div className="absolute inset-0 z-[700] bg-black/90 flex flex-col items-center justify-center">
          <div className="w-32 h-32 relative">
            <div className={`absolute inset-0 rounded-full border-4 border-emerald-500 ${isRecording ? 'animate-ping' : ''} opacity-20`} />
            <div className={`absolute inset-4 rounded-full border-4 border-emerald-400 ${isRecording ? 'animate-pulse' : ''}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Volume2 className={`w-12 h-12 text-emerald-400 ${isRecording ? 'animate-bounce' : ''}`} />
            </div>
          </div>
          
          <div className="mt-8 text-2xl font-black text-white">{formatTime(recordingTime)}</div>
          
          {recordingText && <div className="mt-4 px-8 text-center text-zinc-300 max-w-[80%]">{recordingText}</div>}
          
          {/* 取消按钮 */}
          <button 
            onClick={cancelRecording}
            className="absolute bottom-24 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 font-bold"
          >
            取消录音
          </button>
        </div>
      )}

      {showManualForm && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-xl px-6">
           <div className="w-full glass rounded-[40px] p-8 space-y-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-black">手动记账</h2>
                 <button onClick={() => setShowManualForm(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => setMIsIncome(false)} className={`flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${!mIsIncome ? 'bg-rose-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                  <TrendingDown className="w-4 h-4" /> 支出
                </button>
                <button onClick={() => setMIsIncome(true)} className={`flex-1 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${mIsIncome ? 'bg-emerald-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                  <TrendingUp className="w-4 h-4" /> 收入
                </button>
              </div>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                 <input type="number" placeholder={mIsIncome ? '¥ 收入金额' : '¥ 支出金额'} className="bg-transparent text-5xl font-black text-center outline-none w-full" value={mAmount} onChange={e => setMAmount(e.target.value)} />
                 <input placeholder={mIsIncome ? '什么收入？如：工资、奖金' : '买了什么？'} className="w-full bg-white/5 rounded-2xl py-4 px-5 outline-none" value={mMerchant} onChange={e => setMMerchant(e.target.value)} />
                 <button className={`w-full py-5 rounded-2xl font-black ${mIsIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                   {mIsIncome ? '确认入账' : '确认支出'}
                 </button>
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

      <header className="px-6 py-4 flex items-center gap-4 border-b border-white/[0.05] bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-zinc-400"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex-1">
          <h1 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
            财伴 AI
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </h1>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">智能财务管家</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 space-y-6 no-scrollbar pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${m.role === 'user' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`}>
              {m.role === 'user' ? <UserIcon className="w-4 h-4 text-indigo-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            </div>

            <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%] w-auto`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg transition-all duration-300 break-words overflow-hidden ${m.role === 'user' ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-none' : 'bg-zinc-900 border border-white/10 text-zinc-100 rounded-bl-none'}`}>
                {m.transactions && m.transactions.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {m.transactions.map((tx, idx) => {
                      const amount = safeParseNum(tx.amount, 0);
                      if (amount <= 0) return null;
                      return (
                        <div key={idx} className="p-3 bg-black/30 rounded-xl flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.is_income ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                            {tx.is_income ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-rose-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-zinc-400">{tx.merchant || '未知'}</div>
                            <div className={`text-lg font-black ${tx.is_income ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {tx.is_income ? '+' : '-'}¥{amount}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="flex flex-wrap items-baseline gap-y-1 break-words overflow-hidden max-w-full">{renderMessageText(m.text || '')}</p>
              </div>

              {m.role === 'ai' && m.vibe_check && (
                <div className="flex items-center gap-2 mt-1 ml-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{moodEmojis[m.vibe_check] || ''} {m.vibe_check}</span>
                </div>
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
                <span className="text-[9px] font-black uppercase text-zinc-400">手动记账</span>
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-white/10 rounded-2xl transition-all group">
                <div className="w-12 h-12 bg-indigo-500/10 group-active:scale-90 transition-transform rounded-2xl flex items-center justify-center text-indigo-500"><ImageIcon className="w-6 h-6" /></div>
                <span className="text-[9px] font-black uppercase text-zinc-400">从相册选</span>
              </button>
            </div>
          )}

          <div className="glass bg-zinc-900/90 border border-white/10 rounded-[32px] p-2 flex items-center gap-2 shadow-2xl">
            <button onClick={() => setShowPlusMenu(!showPlusMenu)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${showPlusMenu ? 'bg-zinc-800 text-white rotate-45' : 'bg-white/5 text-zinc-400'}`}>
              <Plus className="w-5 h-5" />
            </button>
            
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="问我：还能花多少？" className="flex-1 bg-transparent outline-none text-sm font-medium px-2 py-2 text-white placeholder-zinc-600 min-w-0" />
            
            {/* 网页版语音按钮：按下开始，松开结束 */}
            <button 
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              disabled={loading || isRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 relative
                ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            
            {input.trim() && (
              <button onClick={() => handleSend()} disabled={loading} className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 bg-emerald-500 text-white">
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* 语音提示 */}
          {isRecording && (
            <div className="text-center mt-2 text-xs text-zinc-500">
              松开结束录音，点击"取消录音"按钮可取消
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
