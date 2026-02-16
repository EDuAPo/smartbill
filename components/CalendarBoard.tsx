
import React, { useState, useMemo } from 'react';
import { Transaction, CategoryType } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onClose?: () => void;
}

const CalendarBoard: React.FC<Props> = ({ transactions, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthData = useMemo(() => {
    const data: Record<string, { income: number; expense: number }> = {};
    const days = daysInMonth(year, month);
    
    for (let i = 1; i <= days; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTxs = transactions.filter(t => t.date === dateStr && !t.needConfirmation);
      
      const income = dayTxs.filter(t => t.category === CategoryType.INCOME).reduce((s, t) => s + t.amount, 0);
      const expense = dayTxs.filter(t => t.category !== CategoryType.INCOME).reduce((s, t) => s + t.amount, 0);
      
      data[dateStr] = { income, expense };
    }
    return data;
  }, [year, month, transactions]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedDayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate && !t.needConfirmation);
  }, [selectedDate, transactions]);

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth(year, month) }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-black animate-in fade-in slide-in-from-bottom-8 duration-500">
      <header className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-emerald-500">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">{year}年 {month + 1}月</h2>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Financial Grid View</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 glass rounded-xl hover:bg-white/10"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={nextMonth} className="p-2 glass rounded-xl hover:bg-white/10"><ChevronRight className="w-5 h-5" /></button>
          {onClose && <button onClick={onClose} className="ml-2 p-2 bg-zinc-900 rounded-xl"><X className="w-5 h-5" /></button>}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar pb-32">
        {/* Calendar Grid */}
        <div className="glass rounded-[32px] p-6 border-white/5">
          <div className="grid grid-cols-7 mb-4">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-zinc-600 uppercase py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => <div key={`b-${b}`} className="aspect-square" />)}
            {days.map(d => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const data = monthData[dateStr] || { income: 0, expense: 0 };
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toLocaleDateString('en-CA') === dateStr;

              // Color logic based on activity
              let bgColor = 'bg-white/[0.03]';
              if (data.income > 0 && data.expense > 0) bgColor = 'bg-gradient-to-br from-emerald-500/20 to-rose-500/20';
              else if (data.income > 0) bgColor = data.income > 500 ? 'bg-emerald-500/40' : 'bg-emerald-500/20';
              else if (data.expense > 0) bgColor = data.expense > 200 ? 'bg-rose-500/40' : 'bg-rose-500/20';

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square rounded-xl flex items-center justify-center transition-all duration-300 ${bgColor} ${isSelected ? 'ring-2 ring-white scale-110 z-10 shadow-xl' : 'hover:scale-105'} ${isToday ? 'border border-emerald-500/50' : ''}`}
                >
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{d}</span>
                  {/* Indicators */}
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {data.income > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                    {data.expense > 0 && <div className="w-1 h-1 rounded-full bg-rose-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h3 className="text-xl font-black tracking-tight">{selectedDate.split('-')[2]}日 流水</h3>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{selectedDate}</p>
            </div>
            <div className="flex gap-4">
               {monthData[selectedDate]?.income > 0 && (
                 <div className="text-right">
                   <p className="text-[8px] text-zinc-500 font-bold uppercase">收入</p>
                   <p className="text-sm font-black text-emerald-400">¥{monthData[selectedDate].income}</p>
                 </div>
               )}
               <div className="text-right">
                 <p className="text-[8px] text-zinc-500 font-bold uppercase">支出</p>
                 <p className="text-sm font-black text-rose-400">¥{monthData[selectedDate]?.expense || 0}</p>
               </div>
            </div>
          </div>

          <div className="space-y-3">
            {selectedDayTransactions.length > 0 ? selectedDayTransactions.map(t => (
              <div key={t.id} className="glass p-4 rounded-2xl flex items-center justify-between border-white/5 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${t.category === CategoryType.INCOME ? 'bg-emerald-500/10' : 'bg-zinc-900'}`}>
                    {t.category === CategoryType.INCOME ? '💰' : t.category === CategoryType.FOOD ? '🍱' : '🛍️'}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.merchant}</p>
                    <p className="text-[9px] text-zinc-600 font-black uppercase">{t.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className={`text-base font-black ${t.category === CategoryType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                    {t.category === CategoryType.INCOME ? '+' : '-'} ¥{t.amount}
                  </p>
                </div>
              </div>
            )) : (
              <div className="glass rounded-3xl p-12 flex flex-col items-center justify-center border-dashed border-white/10">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                   <CalendarIcon className="w-6 h-6 text-zinc-700" />
                </div>
                <p className="text-zinc-600 text-xs font-bold">该日无确认记录</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CalendarBoard;
