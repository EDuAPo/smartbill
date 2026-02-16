import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartBillAI } from '../services/geminiService';
import { Transaction, CategoryType } from '../types';
import { 
  Utensils, ShoppingBag, Car, Ticket, Home, Activity, GraduationCap, 
  MoreHorizontal, Camera, AudioLines, Sparkles,
  X, Plus, Mic, Edit3, Image as ImageIcon, Loader2, Send, ChevronLeft, 
  Coins, User as UserIcon
} from 'lucide-react';

interface Props {
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

const AIAssistant: React.FC<Props> = ({ transactions, monthlyBudget, onAdd, showNotify }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('正在思考...');
  const [recording, setRecording] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const [mAmount, setMAmount] = useState('');
  const [mMerchant, setMMerchant] = useState('');
  const [mCategory, setMCategory] = useState<CategoryType>(CategoryType.OTHER);

  const greetings = ["有什么需要我帮忙的？", "记账、查账、问预算，我都在行"];
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'ai', 
    text: string, 
    vibe?: string, 
    moodColor?: string,
    data?: any[] 
  }>>([
    { role: 'ai', text: greetings[Math.floor(Math.random() * greetings.length)], vibe: '随时待命' }
  ]);

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

  const renderMessageText = (text: string) => {
    const regex = /(¥\s?\d+(\.\d+)?|(\d+(\.\d+)?)\s?元)/g;
    return text.split(regex).map((part, index) => {
      if (!part) return null;
      if (part.match(regex)) {
        return (
          <span 
            key={index} 
            className="text-base font-bold text-emerald-400 mx-0.5"
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
        showNotify(`已添加 ${txs.length} 笔记录`);
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
    setLoadingText("处理中...");
    try {
      const result = await aiRef.current.parseTransaction(currentInput, transactions, monthlyBudget);
      processResponse(result);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: '抱歉，我遇到了一些问题' }]);
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
          } catch (err) { showNotify("识别失败", "error"); }
          finally { setLoading(false); }
        };
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setRecording(true);
    } catch (err) { showNotify("无法访问麦克风", "error"); }
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
  }, [transactions, monthlyBudget]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black">
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Manual Entry Modal */}
      {showManualForm && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/90 backdrop-blur-xl">
           <div className="w-full max-w-sm mx-4 glass rounded-3xl p-6 space-y-5 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h2 className="text-lg font-bold">手动记账</h2>
                 <button onClick={() => setShowManualForm(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                   <X className="w-4 h-4" />
                 </button>
              </div>
              <form onSubmit={(e) => {
                 e.preventDefault();
                 if (mAmount) {
                   onAdd({ 
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
                 }
              }} className="space-y-4">
                 <input 
                   type="number" 
                   placeholder="0.00" 
                   className="w-full bg-transparent text-4xl font-bold text-center outline-none text-emerald-400" 
                   value={mAmount} 
                   onChange={e => setMAmount(e.target.value)} 
                 />
                 <input 
                   placeholder="备注（可选）" 
                   className="w-full bg-white/5 rounded-xl py-3 px-4 outline-none text-sm"
                   value={mMerchant}
                   onChange={e => setMMerchant(e.target.value)}
                 />
                 <div className="grid grid-cols-3 gap-2">
                   {Object.values(CategoryType).slice(0, 6).map(cat => (
                     <button 
                       key={cat}
                       type="button"
                       onClick={() => setMCategory(cat)}
                       className={`py-2 rounded-lg text-xs font-medium transition-all ${mCategory === cat ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-400'}`}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>
                 <button type="submit" className="w-full py-3 bg-emerald-500 rounded-xl font-bold">确认</button>
              </form>
           </div>
        </div>
      )}

      {isLiveCameraOpen && (
        <div className="absolute inset-0 z-[600] bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[75%] aspect-[3/4] border-2 border-emerald-500/50 rounded-3xl" />
          </div>
          <button onClick={() => setIsLiveCameraOpen(false)} className="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {recording && (
        <div className="absolute inset-0 z-[700] bg-black/95 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Mic className="w-10 h-10 text-rose-500" />
          </div>
          <p className="text-white font-medium mb-6">正在录音...</p>
          <button onClick={stopVoice} className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center">
            <X className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 bg-black/95 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">财伴 AI</h1>
            <p className="text-[9px] text-zinc-500">智能记账助手</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
              {m.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-sm' 
                    : 'bg-zinc-900 text-zinc-100 rounded-tl-sm border border-white/5'
                }`}
              >
                <p className="leading-relaxed">{renderMessageText(m.text)}</p>
                
                {m.data && m.data.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                    {m.data.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-black/30 p-2 rounded-lg">
                        <span className="text-zinc-300">{tx.merchant}</span>
                        <span className="text-emerald-400 font-bold">¥{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-zinc-900 px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/5">
              <p className="text-xs text-zinc-400 animate-pulse">{loadingText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="px-3 pb-4 pt-2 bg-black">
        <div className="relative">
          {/* Plus Menu */}
          {showPlusMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-3 flex justify-center gap-4 animate-in slide-in-from-bottom-2">
              <button onClick={startCamera} className="w-14 h-14 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-zinc-700 transition-colors">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="text-[8px] text-zinc-400">拍照</span>
              </button>
              <button onClick={() => { setShowManualForm(true); setShowPlusMenu(false); }} className="w-14 h-14 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-zinc-700 transition-colors">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span className="text-[8px] text-zinc-400">手动</span>
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="w-14 h-14 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-zinc-700 transition-colors">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <span className="text-[8px] text-zinc-400">相册</span>
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-2xl p-1.5">
            <button 
              onClick={() => setShowPlusMenu(!showPlusMenu)} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showPlusMenu ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              <Plus className="w-5 h-5" />
            </button>
            
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSend()} 
              placeholder="输入记账信息..." 
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-zinc-600 py-2" 
            />
            
            <button 
              onClick={input.trim() ? handleSend : startVoice} 
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                input.trim() 
                  ? 'bg-emerald-500 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {input.trim() ? <Send className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
