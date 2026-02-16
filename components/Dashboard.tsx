
import React, { useState } from 'react';
import { Transaction, User } from '../types';
import { Check, X, ArrowUpRight, ArrowDownRight, TrendingUp, BellRing, Calendar as CalendarIcon } from 'lucide-react';
import CalendarBoard from './CalendarBoard';

interface Props {
  user: User;
  transactions: Transaction[];
  monthlyBudget: number;
  onConfirm: (id: string) => void;
  onDelete: (id: string) => void;
  showNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const Dashboard: React.FC<Props> = ({ user, transactions, monthlyBudget, onConfirm, onDelete, showNotify }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const pending = transactions.filter(t => t.needConfirmation);
  const confirmed = transactions.filter(t => !t.needConfirmation);

  const totalSpent = confirmed.reduce((sum, t) => sum + t.amount, 0);
  const remaining = Math.max(0, monthlyBudget - totalSpent);
  const progress = Math.min(100, (totalSpent / monthlyBudget) * 100);

  if (showCalendar) {
    return <CalendarBoard transactions={transactions} onClose={() => setShowCalendar(false)} />;
  }

  return (
    <div className="space-y-8 pb-4 animate-in fade-in duration-500">
      <header className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">你好, {user.nickname}</h1>
          <p className="text-zinc-400 text-sm">今天又是自律的一天 ✨</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCalendar(true)} className="p-2.5 glass rounded-full hover:bg-white/10 transition-all">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
          </button>
          <button onClick={() => showNotify('目前没有新的通知', 'info')} className="p-2.5 glass rounded-full relative hover:bg-white/10 transition-all">
            <BellRing className="w-5 h-5 text-emerald-400" />
            {pending.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-black"></span>}
          </button>
        </div>
      </header>

      {/* Budget Card */}
      <div className="relative overflow-hidden p-6 glass rounded-[36px] apple-shadow bg-gradient-to-b from-white/[0.05] to-transparent">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">本月剩余预算</span>
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-full">
            {progress < 80 ? '健康' : '预警'}
          </span>
        </div>
        <div className="text-4xl font-black mb-6 tracking-tighter">
          ¥ {remaining.toLocaleString()}
          <span className="text-xl text-zinc-500 font-medium"> / {monthlyBudget}</span>
        </div>
        
        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-6">
          <div 
            className={`h-full transition-all duration-1000 rounded-full ${progress > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>本月支出</span>
            </div>
            <div className="font-bold text-xl">¥ {totalSpent.toFixed(0)}</div>
          </div>
          <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>预算进度</span>
            </div>
            <div className="font-bold text-xl">{progress.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Confirmation Queue */}
      {pending.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-5 px-2">
            <h2 className="text-lg font-bold tracking-tight">它记，你确认</h2>
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-0.5 rounded-md">{pending.length} 笔待办</span>
          </div>
          <div className="space-y-4">
            {pending.map(tx => (
              <div key={tx.id} className="glass p-4 rounded-[28px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-xl">
                    {tx.category === '餐饮' ? '☕️' : tx.category === '交通' ? '🚗' : '🛍️'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">{tx.merchant}</h3>
                    <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-tighter">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-lg">¥{tx.amount}</span>
                  <div className="flex gap-2">
                    <button onClick={() => onDelete(tx.id)} className="w-9 h-9 flex items-center justify-center bg-zinc-900 text-rose-500 rounded-full"><X className="w-4 h-4" /></button>
                    <button onClick={() => onConfirm(tx.id)} className="w-9 h-9 flex items-center justify-center bg-zinc-900 text-emerald-500 rounded-full"><Check className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-bold tracking-tight mb-5 px-2">最近记录</h2>
        <div className="space-y-5 px-1">
          {confirmed.length > 0 ? confirmed.slice(0, 5).map(tx => (
            <div key={tx.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-zinc-900 rounded-2xl flex items-center justify-center text-xl">
                  {tx.category === '餐饮' ? '☕️' : tx.category === '购物' ? '🛍️' : '🏷️'}
                </div>
                <div>
                  <h3 className="text-sm font-bold group-hover:text-emerald-400 transition-colors">{tx.merchant}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">{tx.category}</p>
                </div>
              </div>
              <span className="font-black text-base">- ¥{tx.amount}</span>
            </div>
          )) : (
            <div className="text-center py-10 text-zinc-600 text-sm italic">暂无已确认记录</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
