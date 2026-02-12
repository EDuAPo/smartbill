
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage } from '../types';
import { analyzeFinances, scanBillImage } from '../services/deepseekService';

interface AITabProps {
  transactions: Transaction[];
  onAdd: (t: Transaction) => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
  t: (key: any) => string;
  language: string;
}

const AITab: React.FC<AITabProps> = ({ transactions, onAdd, initialPrompt, onClearInitialPrompt, t, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const presets = [
    { key: 'preset_analyze', text: t('preset_analyze') },
    { key: 'preset_saving', text: t('preset_saving') },
    { key: 'preset_biggest', text: t('preset_biggest') },
  ];

  useEffect(() => {
    // 初始消息更加直接
    setMessages([
      { role: 'assistant', content: language === 'zh' ? "账单分析已就绪。请提出问题或上传票据。" : "Billing analysis ready. Ask or scan." }
    ]);
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendWithText(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  const handleSendWithText = async (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);
    const reply = await analyzeFinances(transactions, text);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await handleSendWithText(text);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      const base64 = imageData.split(',')[1];
      setMessages(prev => [...prev, { role: 'user', content: language === 'zh' ? '正在提取票据信息...' : 'Extracting info...', image: imageData }]);
      setIsTyping(true);
      
      try {
        const result = await scanBillImage(base64);
        if (result && result.amount) {
          onAdd({ 
            id: Date.now().toString(), 
            amount: result.amount, 
            category: result.category || 'Shopping', 
            description: result.description || '扫描账单', 
            date: result.date || new Date().toISOString().split('T')[0], 
            type: result.isExpense === false ? 'income' : 'expense' 
          });
          setMessages(prev => [...prev, { role: 'assistant', content: language === 'zh' ? `录入成功：${result.description || '扫描账单'} (¥${result.amount})` : `Logged: ${result.description || 'Scanned bill'} (¥${result.amount})` }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: language === 'zh' ? '未能识别有效账单信息，请重试。' : 'Could not extract valid bill info.' }]);
        }
      } catch (error) { 
        console.error('Scan error:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: language === 'zh' ? '识别失败，请重试。' : 'OCR failed, please retry.' }]);
      } finally { 
        setIsTyping(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.onerror = () => {
      setMessages(prev => [...prev, { role: 'assistant', content: language === 'zh' ? '图片读取失败。' : 'Image read failed.' }]);
      setIsTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] px-5 pt-6">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black shadow-lg">
           <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM10.8 5.3h2.4v2.4h-2.4V5.3z" />
              <path d="M8.5 14.5h7a1.5 1.5 0 0 1 1.5 1.5v4a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4a1.5 1.5 0 0 1 1.5-1.5z" />
              <rect x="10" y="17" width="1.2" height="1.2" rx="0.2" fill="black" />
              <rect x="12.8" y="17" width="1.2" height="1.2" rx="0.2" fill="black" />
              <path d="M10.5 14.5v-1.5M13.5 14.5v-1.5" stroke="currentColor" strokeWidth="1" />
              <circle cx="10.5" cy="12.5" r="0.4" />
              <circle cx="13.5" cy="12.5" r="0.4" />
              <path d="M8 16l-2-4M16 16l2-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
           </svg>
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase">{t('assistant')}</h2>
          <span className="text-[8px] font-black text-custom-dim uppercase tracking-[0.3em]">Direct Insights</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-[#1DB954] text-black font-bold' : 'bg-custom-elevated text-custom-main border border-custom-subtle shadow-sm'}`}>
              {m.image && <img src={m.image} className="w-full rounded-xl mb-2 max-h-40 object-cover" />}
              <p className="text-[13px] font-medium leading-normal tracking-tight whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-[8px] font-black text-[#1DB954] uppercase px-2 animate-pulse">Analyzing...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-3 mt-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handleSendWithText(preset.text)}
            className="flex-shrink-0 px-4 py-2 bg-custom-elevated border border-custom-subtle rounded-full text-[9px] font-black text-custom-dim hover:text-white transition-all shadow-sm"
          >
            {preset.text}
          </button>
        ))}
      </div>

      <div className="pb-4">
        <div className="flex items-center space-x-2 bg-custom-surface border border-custom-subtle p-1.5 rounded-full shadow-2xl">
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-custom-elevated rounded-full flex items-center justify-center text-custom-dim hover:text-[#1DB954] transition-all overflow-hidden">
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
             </svg>
          </button>
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
            placeholder={language === 'zh' ? '询问数据细节...' : 'Ask about your data...'} 
            className="flex-1 bg-transparent py-2 px-1 outline-none text-[13px] font-bold" 
          />
          <button onClick={handleSend} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center active:scale-90 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
    </div>
  );
};

export default AITab;
