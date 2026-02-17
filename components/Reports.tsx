import React, { useMemo, useRef, useEffect } from 'react';
import { Transaction, CategoryType } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  Target, Zap, Sliders, Coins, Sparkles, TrendingUp, TrendingDown 
} from 'lucide-react';

const COLORS = [
  '#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'
];

const SPOTIFY_GRADIENTS = [
  'from-emerald-500 to-green-400',
  'from-indigo-500 to-purple-500', 
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
  'from-pink-500 to-rose-500',
  'from-zinc-500 to-neutral-500'
];

interface Props {
  transactions: Transaction[];
  monthlyBudget: number;
  setMonthlyBudget: (val: number) => void;
  showNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const TICK_WIDTH = 20;

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

  const remaining = monthlyBudget - stats.total;
  const progressPercent = Math.min((stats.total / monthlyBudget) * 100, 100);

  // 真实的健康评分计算
  const healthScore = useMemo(() => {
    if (confirmedOnly.length === 0) return 100;
    const ratio = stats.total / monthlyBudget;
    if (ratio < 0.5) return 95;
    if (ratio < 0.7) return 85;
    if (ratio < 0.85) return 70;
    if (ratio < 1) return 55;
    return 30;
  }, [stats.total, monthlyBudget, confirmedOnly.length]);

  // 基于真实数据的 AI 评估
  const aiAssessment = useMemo(() => {
    if (confirmedOnly.length === 0) {
      return {
        score: 100,
        title: '记账新手',
        message: '还没有任何消费记录，开始记账吧，让 AI 帮你分析财务状况！',
        tips: ['点击底部 + 按钮添加第一笔消费', '支持语音、拍照识别账单']
      };
    }

    const ratio = stats.total / monthlyBudget;
    const topCategory = categoryData[0];
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysPassed = new Date().getDate();
    const expectedSpent = (monthlyBudget / daysInMonth) * daysPassed;
    const dailyAvg = stats.total / daysPassed;
    
    const tips: string[] = [];
    let title = '';
    let message = '';

    // 基于实际情况生成建议
    if (ratio < 0.5) {
      title = '省钱达人';
      message = `本月已消费 ¥${stats.total.toFixed(0)}，只用了 ${(ratio * 100).toFixed(0)}% 的预算`;
      if (topCategory) {
        tips.push(`主要支出是${topCategory.name}，共 ¥${topCategory.value.toFixed(0)}`);
      }
      tips.push('继续保持！可以适当享受一下');
    } else if (ratio < 0.75) {
      title = '消费理性';
      message = `本月已消费 ¥${stats.total.toFixed(0)}，预算使用 ${(ratio * 100).toFixed(0)}%`;
      if (topCategory) {
        tips.push(`${topCategory.name}占比最高，达 ¥${topCategory.value.toFixed(0)}`);
      }
      tips.push('日均消费 ¥' + dailyAvg.toFixed(0) + '，注意保持');
    } else if (ratio < 0.9) {
      title = '预算预警';
      message = `本月已消费 ¥${stats.total.toFixed(0)}，预算剩余不多`;
      tips.push('⚠️ 本月剩余预算仅 ¥' + Math.max(0, remaining).toFixed(0));
      tips.push('日均 ¥' + dailyAvg.toFixed(0) + '，建议控制消费');
      if (topCategory) {
        tips.push('减少' + topCategory.name + '类开支可有效节流');
      }
    } else if (ratio < 1) {
      title = '预算紧张';
      message = `本月已消费 ¥${stats.total.toFixed(0)}，即将超支！`;
      tips.push('🚨 剩余预算仅 ¥' + Math.max(0, remaining).toFixed(0));
      tips.push('建议立即调整消费习惯');
      if (topCategory) {
        tips.push(topCategory.name + '支出过高，需重点关注');
      }
    } else {
      title = '预算超支';
      message = `本月已消费 ¥${stats.total.toFixed(0)}，超出预算 ¥${Math.abs(remaining).toFixed(0)}`;
      tips.push('❌ 已超支 ¥' + Math.abs(remaining).toFixed(0));
      tips.push('建议设置下月预算时降低 20%');
      if (topCategory) {
        tips.push(topCategory.name + '是最大支出项');
      }
    }

    // 添加趋势对比
    if (expectedSpent > 0) {
      const trend = (stats.total - expectedSpent) / expectedSpent;
      if (trend > 0.2) {
        tips.push('📈 消费速度高于预期');
      } else if (trend < -0.2) {
        tips.push('📉 消费控制良好');
      }
    }

    return { score: healthScore, title, message, tips };
  }, [confirmedOnly, stats, monthlyBudget, remaining, categoryData, healthScore]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="px-1 py-2">
        <h1 className="text-2xl font-black tracking-tighter text-white">财务透视</h1>
        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mt-0.5">AI 财务搭子</p>
      </header>

      {/* Stats Cards - 紧凑的两列 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 rounded-2xl border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
             <Target className="w-3 h-3 text-emerald-500" />
             <span className="text-[8px] font-black uppercase tracking-wider">日均限额</span>
          </div>
          <div className="text-xl font-black tracking-tighter text-white">¥ {(monthlyBudget / 30).toFixed(0)}</div>
        </div>
        <div className="glass p-4 rounded-2xl border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
          <div className="flex items-center gap-1.5 mb-1.5 text-zinc-500">
             <Zap className="w-3 h-3 text-indigo-400" />
             <span className="text-[8px] font-black uppercase tracking-wider">单笔峰值</span>
          </div>
          <div className="text-xl font-black tracking-tighter text-white">¥ {stats.max.toFixed(0)}</div>
        </div>
      </div>

      {/* Budget Card - Spotify 风格 */}
      <section className="glass rounded-3xl p-4 border-white/10 overflow-hidden relative">
        {/* 背景渐变装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent" />
        
        <div className="relative">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black flex items-center gap-2 text-zinc-300">
              <Sliders className="w-3.5 h-3.5 text-emerald-500" />
              额度设定
            </h3>
            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">滑动调整</span>
          </div>

          {/* 预算进度条 */}
          <div className="mb-4">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">本月预算</span>
              <span className="text-2xl font-black tracking-tighter text-white">¥{monthlyBudget.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${remaining > 0 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-rose-500 to-red-400'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-zinc-400">已消费 ¥{stats.total.toFixed(0)}</span>
              <span className={`text-[9px] font-bold ${remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {remaining > 0 ? `剩余 ¥${remaining.toFixed(0)}` : `超支 ¥${Math.abs(remaining).toFixed(0)}`}
              </span>
            </div>
          </div>

          {/* 滚轮选择器 - 更紧凑 */}
          <div className="relative py-2 -mx-4 px-4">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-emerald-500 shadow-[0_0_10px_#10b981] z-10" />
             <div 
               ref={rollerRef}
               onScroll={handleRollerScroll}
               className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory px-[50%] h-10 items-end cursor-grab active:cursor-grabbing"
             >
                {Array.from({ length: 201 }).map((_, i) => (
                  <div 
                    key={i} 
                    style={{ minWidth: `${TICK_WIDTH}px` }}
                    className="snap-center flex flex-col items-center justify-end h-full"
                  >
                     <div className={`w-0.5 rounded-full transition-all ${i % 5 === 0 ? 'h-5 bg-zinc-500' : 'h-2.5 bg-zinc-800'}`} />
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* 分类饼图 - Spotify 风格 */}
      <section className="glass rounded-3xl p-4 border-white/10 overflow-hidden">
        <h3 className="text-xs font-black mb-3 flex items-center gap-2">
          <span className="w-1 h-3.5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
          消费构成
        </h3>
        
        <div className="flex gap-4">
          {/* 饼图 */}
          <div className="h-32 w-32 relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={60}
                  paddingAngle={4} dataKey="value" stroke="none"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={`url(#gradient${index})`} />
                  ))}
                  <defs>
                    {categoryData.map((_, index) => (
                      <linearGradient key={index} id={`gradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={COLORS[index % COLORS.length]} />
                        <stop offset="100%" stopColor={COLORS[(index + 1) % COLORS.length]} />
                      </linearGradient>
                    ))}
                  </defs>
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
               <p className="text-[8px] text-zinc-500 font-black uppercase">总计</p>
               <p className="text-lg font-black text-white">¥{stats.total.toFixed(0)}</p>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-32 no-scrollbar">
            {categoryData.slice(0, 5).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${SPOTIFY_GRADIENTS[idx % SPOTIFY_GRADIENTS.length]}`} />
                  <span className="text-[10px] font-medium text-zinc-400">{cat.name}</span>
                </div>
                <span className="text-[10px] font-bold text-white">¥{cat.value.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI 健康评估 - Spotify 风格卡片 */}
      <section className={`p-4 rounded-3xl border-l-4 ${
        healthScore > 80 
          ? 'border-emerald-500 bg-gradient-to-r from-emerald-500/10 to-transparent' 
          : healthScore > 60
          ? 'border-amber-500 bg-gradient-to-r from-amber-500/10 to-transparent'
          : 'border-rose-500 bg-gradient-to-r from-rose-500/10 to-transparent'
      }`}>
        <div className="flex items-center gap-3 mb-2">
           <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
             healthScore > 80 ? 'bg-emerald-500/20' : healthScore > 60 ? 'bg-amber-500/20' : 'bg-rose-500/20'
           }`}>
              {healthScore > 80 ? (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
           </div>
           <div>
              <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">AI 财务评估</h3>
              <p className="text-sm font-black tracking-tight">
                健康指数 <span className={healthScore > 80 ? 'text-emerald-400' : 'text-rose-400'}>{healthScore}</span>
              </p>
           </div>
        </div>
        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
           {healthScore > 80 
             ? "目前的开支非常克制，简直是省钱达人！继续保持这种节奏。" 
             : "警报！你的预算消耗过快，请务必关注消费类目，以免月底吃土。"}
        </p>
      </section>
    </div>
  );
};

export default Reports;
