import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Transaction, CategoryType } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, CartesianGrid, XAxis, YAxis 
} from 'recharts';
import { 
  Target, Zap, Calendar, Sliders, Coins, Sparkles 
} from 'lucide-react';

const COLORS = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];
const TICK_WIDTH = 20; // Fixed width for each tick to ensure accurate calculation

interface Props {
  transactions: Transaction[];
  monthlyBudget: number;
  setMonthlyBudget: (val: number) => void;
  showNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const Reports: React.FC<Props> = ({ transactions, monthlyBudget, setMonthlyBudget, showNotify }) => {
  const confirmedOnly = useMemo(() => transactions.filter(t => !t.needConfirmation), [transactions]);
  const rollerRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const total = confirmedOnly.reduce((sum, t) => sum + t.amount, 0);
    const avg = confirmedOnly.length > 0 ? total / 30 : 0;
    const max = confirmedOnly.length > 0 ? Math.max(...confirmedOnly.map(t => t.amount)) : 0;
    return { total, avg, max };
  }, [confirmedOnly]);

  const handleRollerScroll = () => {
    if (!rollerRef.current) return;
    const scrollLeft = rollerRef.current.scrollLeft;
    const newValue = Math.round(scrollLeft / TICK_WIDTH) * 100;
    if (newValue !== monthlyBudget && newValue <= 20000 && newValue >= 0) {
      setMonthlyBudget(newValue);
    }
  };

  useEffect(() => {
    if (rollerRef.current) {
      // Use requestAnimationFrame to ensure scroll happens after layout
      requestAnimationFrame(() => {
        if (rollerRef.current) rollerRef.current.scrollLeft = (monthlyBudget / 100) * TICK_WIDTH;
      });
    }
  }, []);

  const categoryData = useMemo(() => {
    return Object.values(CategoryType).map(cat => ({
      name: cat,
      value: confirmedOnly.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [confirmedOnly]);

  const healthScore = useMemo(() => {
    if (stats.total === 0) return 100;
    const ratio = stats.total / monthlyBudget;
    if (ratio < 0.5) return 95;
    if (ratio < 0.8) return 80;
    if (ratio < 1) return 60;
    return 35;
  }, [stats.total, monthlyBudget]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-32">
      <header className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">财务透视</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">财伴，你的AI财务搭子</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-[32px] border-white/5">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
             <Target className="w-3.5 h-3.5 text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-widest">日均限额</span>
          </div>
          <div className="text-2xl font-black tracking-tighter">¥ {(monthlyBudget / 30).toFixed(0)}</div>
        </div>
        <div className="glass p-5 rounded-[32px] border-white/5">
          <div className="flex items-center gap-2 mb-2 text-zinc-500">
             <Zap className="w-3.5 h-3.5 text-indigo-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">单笔峰值</span>
          </div>
          <div className="text-2xl font-black tracking-tighter">¥ {stats.max.toFixed(0)}</div>
        </div>
      </div>

      {/* Budget Roller */}
      <section className="glass rounded-[40px] p-8 border-white/10 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black flex items-center gap-2 text-zinc-300">
            <Sliders className="w-4 h-4 text-emerald-500" />
            额度设定
          </h3>
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">滑动调整</span>
        </div>

        <div className="text-center mb-8">
           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">本月消费额度</p>
           <div className="text-5xl font-black tracking-tighter text-white tabular-nums">
              ¥ {monthlyBudget.toLocaleString()}
           </div>
        </div>

        <div className="relative mt-8 py-4">
           {/* Center Indicator */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-emerald-500 shadow-[0_0_15px_#10b981] z-10" />
           
           <div 
             ref={rollerRef}
             onScroll={handleRollerScroll}
             className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-[50%] h-12 items-end pb-2 cursor-grab active:cursor-grabbing"
           >
              {Array.from({ length: 201 }).map((_, i) => (
                <div 
                  key={i} 
                  style={{ minWidth: `${TICK_WIDTH}px` }}
                  className={`snap-center flex flex-col items-center justify-end h-full`}
                >
                   <div className={`w-0.5 rounded-full transition-all ${i % 5 === 0 ? 'h-6 bg-zinc-500' : 'h-3 bg-zinc-800'}`} />
                </div>
              ))}
           </div>
           
           <div className="flex justify-between mt-4 px-2">
              <span className="text-[8px] font-black text-zinc-700">0</span>
              <span className="text-[8px] font-black text-zinc-700">10,000</span>
              <span className="text-[8px] font-black text-zinc-700">20,000</span>
           </div>
        </div>

        <div className="mt-8 p-4 bg-white/[0.03] rounded-3xl border border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                 <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-400 font-bold">月底预计剩余</p>
           </div>
           <span className={`text-sm font-black ${monthlyBudget - stats.total > 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              ¥ {(monthlyBudget - stats.total).toFixed(0)}
           </span>
        </div>
      </section>

      {/* Pie Chart */}
      <section className="glass rounded-[40px] p-8 border-white/10 overflow-hidden">
        <h3 className="text-sm font-black mb-8 flex items-center gap-2">
          <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
          消费成分构成
        </h3>
        <div className="h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={95}
                paddingAngle={8} dataKey="value" stroke="none"
              >
                {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
             <p className="text-[9px] text-zinc-600 uppercase font-black">已确认为</p>
             <p className="text-2xl font-black text-white">¥{stats.total.toFixed(0)}</p>
          </div>
        </div>
      </section>

      {/* AI Health Assessment */}
      <section className={`p-8 glass rounded-[40px] border-l-4 ${healthScore > 80 ? 'border-emerald-500/40 bg-emerald-500/[0.03]' : 'border-rose-500/40 bg-rose-500/[0.03]'}`}>
        <div className="flex items-center gap-3 mb-4">
           <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center">
              <Sparkles className={`w-5 h-5 ${healthScore > 80 ? 'text-emerald-500' : 'text-rose-500'}`} />
           </div>
           <div>
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI 财务评估</h3>
              <p className="text-lg font-black tracking-tight">健康指数：{healthScore}</p>
           </div>
        </div>
        <p className="text-sm text-zinc-300 font-medium leading-relaxed">
           {healthScore > 80 ? "目前的开支非常克制，简直是省钱达人！继续保持这种节奏。" : "警报！你的预算消耗过快，请务必关注餐饮和购物类目，以免月底吃土。"}
        </p>
      </section>
    </div>
  );
};

export default Reports;
