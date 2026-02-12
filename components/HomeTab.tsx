
import React, { useRef, useState, useEffect } from 'react';
import { Transaction } from '../types';
import { scanBillImage } from '../services/deepseekService';

interface HomeTabProps {
  transactions: Transaction[];
  budget: number;
  setBudget: (val: number) => void;
  onAdd: (t: Transaction) => void;
  onOpenSettings: () => void;
  onOpenManual: () => void;
  t: (key: any) => string;
}

const HomeTab: React.FC<HomeTabProps> = ({ transactions, budget, setBudget, onAdd, onOpenSettings, onOpenManual, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'success' | 'error' | null>(null);

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  // Simple Trend logic: compare current month with prev (mocked since we only have mock data usually)
  const lastMonthExpense = 2000; // Placeholder
  const trendPercent = Math.round(((expense - lastMonthExpense) / lastMonthExpense) * 100);
  
  const handleScanClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setScanStatus(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
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
          setScanStatus('success');
          setTimeout(() => setScanStatus(null), 3000);
        } else {
          setScanStatus('error');
          setTimeout(() => setScanStatus(null), 3000);
        }
      } catch (error) { 
        console.error(error);
        setScanStatus('error');
        setTimeout(() => setScanStatus(null), 3000);
      } 
      finally { 
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // 刻度尺配置
  const minBudget = 0, maxBudget = 20000, step = 100, tickWidth = 15;
  const ticks = Array.from({ length: (maxBudget - minBudget) / step + 1 }, (_, i) => minBudget + i * step);

  const onScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const index = Math.round(scrollLeft / tickWidth);
    const newValue = ticks[Math.max(0, Math.min(index, ticks.length - 1))];
    if (newValue !== budget) {
      setBudget(newValue);
      if (window.navigator.vibrate) window.navigator.vibrate(2);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = ticks.indexOf(budget) * tickWidth;
    }
  }, []);

  const categories = ['Food', 'Shopping', 'Social', 'Pets', 'Entertainment'];
  const chartData = categories.map(cat => {
    const amount = transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0);
    const maxVal = Math.max(...categories.map(c => transactions.filter(t => t.type === 'expense' && t.category === c).reduce((s, t) => s + t.amount, 0)), 1);
    return { label: cat, amount, val: (amount / maxVal) * 100 };
  });

  return (
    <div className="space-y-8 px-5 pt-4 pb-10">
      {isScanning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex flex-col items-center justify-center">
          <div className="w-20 h-20 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#1DB954] font-black uppercase tracking-widest text-xs">AI 分析中...</p>
        </div>
      )}

      {scanStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-[slideDown_0.3s_ease-out]">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 ${
            scanStatus === 'success' 
              ? 'bg-[#1DB954] text-black' 
              : 'bg-red-500 text-white'
          }`}>
            {scanStatus === 'success' ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-black text-sm">账单已添加</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-black text-sm">识别失败，请重试</span>
              </>
            )}
          </div>
        </div>
      )}

      <header className="grid grid-cols-3 items-center py-4">
        <div className="flex justify-start">
          <button onClick={onOpenSettings} className="w-10 h-10 bg-custom-surface rounded-full flex items-center justify-center border border-custom-subtle active:scale-90">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </button>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={onOpenManual}
            className="bg-[#1DB954] text-black px-6 h-9 rounded-full font-black text-[11px] uppercase tracking-wider shadow-[0_4px_15px_rgba(29,185,84,0.4)] active:scale-95 transition-all"
          >
            {t('manual_entry')}
          </button>
        </div>

        <div className="flex justify-end">
          <button onClick={handleScanClick} className="w-10 h-10 bg-custom-surface rounded-full flex items-center justify-center border border-custom-subtle active:scale-90 overflow-hidden">
             <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
             </svg>
          </button>
        </div>
      </header>

      <div className="space-y-1">
        <div className="flex items-center space-x-2">
           <span className="text-[10px] font-black text-custom-dim uppercase tracking-widest">{t('balance')}</span>
           <div className={`px-2 py-0.5 rounded-full text-[8px] font-black flex items-center space-x-1 ${trendPercent > 0 ? 'bg-red-500/20 text-red-500' : 'bg-[#1DB954]/20 text-[#1DB954]'}`}>
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                <path d={trendPercent > 0 ? "M2.25 18L9 11.25l4.306 4.307a11.25 11.25 0 0010.444-1.254V21H2.25v-3z" : "M2.25 6L9 12.75l4.306-4.307a11.25 11.25 0 0010.444 1.254V3H2.25v3z"} />
              </svg>
              <span>{Math.abs(trendPercent)}% {trendPercent > 0 ? t('trend_up') : t('trend_down')}</span>
           </div>
        </div>
        <div className="text-5xl font-black tracking-tighter">¥{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-custom-surface p-6 rounded-3xl border border-custom-subtle shadow-lg">
           <div className="text-[9px] text-custom-dim font-black mb-1 uppercase tracking-widest">{t('income')}</div>
           <div className="text-[#1DB954] text-xl font-black">+¥{income.toLocaleString()}</div>
        </div>
        <div className="bg-custom-surface p-6 rounded-3xl border border-custom-subtle shadow-lg">
           <div className="text-[9px] text-custom-dim font-black mb-1 uppercase tracking-widest">{t('expense')}</div>
           <div className="text-custom-main text-xl font-black">-¥{expense.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center text-[10px] font-black text-custom-dim uppercase tracking-widest">
           <span>{t('budget')}</span>
           <span className="text-[#1DB954] text-base font-black">¥{budget.toLocaleString()}</span>
        </div>
        
        <div className="relative h-24 bg-custom-surface rounded-[24px] border border-custom-subtle overflow-hidden flex items-center group">
           <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] z-30 pointer-events-none flex flex-col items-center">
              <div className="w-3 h-3 bg-[#1DB954] rounded-full blur-[2px] opacity-50 absolute -top-1" />
              <div className="w-[2px] h-full bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.8)]" />
              <div className="w-3 h-3 bg-[#1DB954] rounded-full blur-[2px] opacity-50 absolute -bottom-1" />
           </div>

           <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-custom-surface to-transparent z-20 pointer-events-none" />
           <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-custom-surface to-transparent z-20 pointer-events-none" />

           <div 
             ref={scrollRef} 
             onScroll={onScroll} 
             className="flex items-center h-full overflow-x-auto no-scrollbar snap-x snap-mandatory px-[50%]"
             style={{ scrollBehavior: 'smooth' }}
           >
             {ticks.map((tick) => (
               <div key={tick} className="flex-shrink-0 flex flex-col items-center justify-center snap-center w-[15px]">
                 <div className={`w-[1px] rounded-full transition-all duration-300 ${
                    tick % 1000 === 0 ? 'h-10 bg-white' : 
                    tick % 500 === 0 ? 'h-6 bg-custom-dim/60' : 
                    'h-3 bg-custom-dim/30'
                 }`} />
                 {tick % 1000 === 0 && (
                   <span className="absolute mt-14 text-[8px] font-black text-custom-dim whitespace-nowrap">
                     {tick / 1000}k
                   </span>
                 )}
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-custom-surface rounded-[40px] p-8 border border-custom-subtle shadow-lg relative overflow-visible">
        <h2 className="text-lg font-black mb-12">{t('spending_distribution')}</h2>
        
        <div className="flex justify-between items-end h-40 px-2 relative">
           {chartData.map((bar, i) => (
             <div 
               key={i} 
               className="flex flex-col items-center group w-12 relative"
               onMouseEnter={() => setHoveredBar(i)}
               onMouseLeave={() => setHoveredBar(null)}
               onTouchStart={() => setHoveredBar(i)}
             >
               <div className={`absolute -top-12 left-1/2 -translate-x-1/2 transition-all duration-300 pointer-events-none z-30 ${hoveredBar === i ? 'opacity-100 -translate-y-2' : 'opacity-0 translate-y-2'}`}>
                  <div className="bg-custom-elevated border border-custom-subtle text-[#1DB954] text-[10px] font-black px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
                    ¥{bar.amount.toLocaleString()}
                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-custom-elevated border-b border-r border-custom-subtle rotate-45" />
                  </div>
               </div>

               <div className="relative w-5 bg-custom-elevated rounded-full h-32 mb-4 overflow-hidden shadow-inner">
                  <div 
                    className={`absolute bottom-0 w-full rounded-full bg-[#1DB954] transition-all duration-500 ${hoveredBar === i ? 'brightness-125 scale-x-110' : 'opacity-80'}`} 
                    style={{ height: `${Math.max(bar.val, bar.amount > 0 ? 5 : 0)}%` }} 
                  />
               </div>
               <span className={`text-[9px] font-black transition-colors ${hoveredBar === i ? 'text-[#1DB954]' : 'text-custom-dim'} uppercase tracking-tighter`}>
                 {bar.label}
               </span>
             </div>
           ))}
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default HomeTab;
