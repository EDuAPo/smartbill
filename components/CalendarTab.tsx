
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface CalendarTabProps {
  transactions: Transaction[];
  t: (key: any) => string;
  language: string;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ transactions, t, language }) => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const monthNames = language === 'zh' 
    ? ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const stats = useMemo(() => {
    const monthStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    const monthly = transactions.filter(t => t.date.startsWith(monthStr));
    const inc = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { inc, exp };
  }, [transactions, currentYear, currentMonth]);

  const dailyTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return transactions.filter(t => t.date === selectedDate);
  }, [transactions, selectedDate]);

  return (
    <div className="space-y-6 px-5 pt-6 pb-20 min-h-screen">
      <header className="flex justify-between items-center">
        <div className="animate-in fade-in slide-in-from-left duration-500">
          <h1 className="text-4xl font-black tracking-tighter">{t('footprint')}</h1>
          <p className="text-[10px] text-custom-dim font-black uppercase tracking-[0.4em] mt-1 text-[#1DB954]">{monthNames[currentMonth]} {currentYear}</p>
        </div>
        <div className="flex space-x-2 bg-custom-elevated p-1 rounded-full">
           <button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="w-8 h-8 hover:text-[#1DB954] transition-colors flex items-center justify-center">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
           </button>
           <button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="w-8 h-8 hover:text-[#1DB954] transition-colors flex items-center justify-center">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
           </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-custom-surface to-custom-elevated p-5 rounded-3xl border border-custom-subtle shadow-xl group">
          <div className="text-[9px] text-custom-dim font-black uppercase tracking-widest mb-1 group-hover:text-[#1DB954] transition-colors">{t('income')}</div>
          <div className="text-[#1DB954] text-xl font-black">+¥{stats.inc.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-custom-surface to-custom-elevated p-5 rounded-3xl border border-custom-subtle shadow-xl group">
          <div className="text-[9px] text-custom-dim font-black uppercase tracking-widest mb-1 group-hover:text-white transition-colors">{t('expense')}</div>
          <div className="text-white text-xl font-black">-¥{stats.exp.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-custom-surface p-5 rounded-[40px] border border-custom-subtle shadow-2xl relative">
        <div className="grid grid-cols-7 mb-3">
          {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-custom-dim">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
          {days.map(d => {
            const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayActivity = transactions.filter(t => t.date === dateStr);
            const hasActivity = dayActivity.length > 0;
            const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = selectedDate === dateStr;

            return (
              <button 
                key={d} 
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 ${
                  isSelected ? 'bg-[#1DB954] text-black shadow-[0_0_15px_rgba(29,185,84,0.5)]' : 
                  hasActivity ? 'bg-custom-elevated text-white' : 'text-custom-dim hover:text-white'
                } ${isToday && !isSelected ? 'border border-[#1DB954]' : ''}`}
              >
                <span className="text-xs font-black">{d}</span>
                {hasActivity && !isSelected && (
                  <div className="absolute bottom-2 w-1 h-1 bg-[#1DB954] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Day Detail View (Spotify Style) */}
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
           <div className="relative w-full max-w-sm bg-custom-elevated rounded-[40px] border border-custom-subtle shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
              <div className="h-1.5 w-12 bg-custom-dim/30 rounded-full mx-auto mt-3 mb-6" />
              <div className="px-8 pb-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">{t('daily_details')}</h3>
                    <p className="text-[10px] font-black text-[#1DB954] uppercase tracking-widest">{selectedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-custom-dim uppercase">{t('total')}</p>
                    <p className="text-xl font-black">
                      ¥{dailyTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar">
                  {dailyTransactions.length > 0 ? dailyTransactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-custom-surface rounded-lg flex items-center justify-center text-lg shadow-inner">
                           {t.type === 'income' ? '💰' : '💸'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white group-hover:text-[#1DB954] transition-colors">{t.description}</div>
                          <div className="text-[9px] font-black text-custom-dim uppercase tracking-widest">{t.category}</div>
                        </div>
                      </div>
                      <div className={`font-black text-sm ${t.type === 'income' ? 'text-[#1DB954]' : 'text-white'}`}>
                        {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10 opacity-30 italic text-sm">No activity recorded</div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedDate(null)}
                  className="w-full mt-8 bg-white text-black h-12 rounded-full font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                >
                  {t('confirm')}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarTab;
