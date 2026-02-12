
import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { generateSpendingMusing, generateSpendingInsight, generateSpendingPersonality } from '../services/deepseekService';

interface MusingsTabProps {
  transactions: Transaction[];
  onSelectMood?: (prompt: string) => void;
  t: (key: any) => string;
  language: string;
}

const MusingsTab: React.FC<MusingsTabProps> = ({ transactions, onSelectMood, t, language }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [musing, setMusing] = useState<string>('');
  const [insight, setInsight] = useState<string>('');
  const [personality, setPersonality] = useState<{persona: string, description: string, color: string} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  React.useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [musingRes, insightRes, personalityRes] = await Promise.all([
      generateSpendingMusing(transactions),
      generateSpendingInsight(transactions),
      generateSpendingPersonality(transactions)
    ]);
    setMusing(musingRes);
    setInsight(insightRes);
    setPersonality(personalityRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [transactions]);

  // 计算统计数据
  const stats = React.useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const transactionCount = transactions.length;
    
    // 最常消费的分类
    const categoryCount: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    
    // 平均每笔消费
    const avgExpense = expense > 0 ? Math.round(expense / transactions.filter(t => t.type === 'expense').length) : 0;
    
    return { income, expense, balance, transactionCount, topCategory, avgExpense };
  }, [transactions]);

  const moodCards = [
    { title: language === 'zh' ? '深夜剁手' : 'Late Shopping', color: 'bg-[#E13300]', icon: '🌙', prompt: 'Analysis late night spending' },
    { title: language === 'zh' ? '工资日狂欢' : 'Payday Party', color: 'bg-[#1E3264]', icon: '💰', prompt: 'Analyze payday spending' },
    { title: language === 'zh' ? '省钱大作战' : 'Saving Mode', color: 'bg-[#F037A5]', icon: '🛡️', prompt: 'How to save more' },
    { title: language === 'zh' ? '外卖之魂' : 'Foodie Soul', color: 'bg-[#006450]', icon: '🍱', prompt: 'Analyze food delivery frequency' },
  ];

  return (
    <div ref={containerRef} className="space-y-5 px-5 pt-8 pb-20 bg-gradient-to-b from-[#1a1a1a] to-[#121212]">
      <header className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">{t('discover')}</h1>
          <p className="text-[10px] text-[#1DB954] font-black uppercase tracking-[0.3em] mt-1">AI Powered Insights</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="w-12 h-12 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 rounded-full flex items-center justify-center border border-[#1DB954]/30 shadow-lg active:scale-90 transition-all">
          <svg className={`w-6 h-6 text-[#1DB954] ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </header>

      {/* Spending Personality Card - Spotify Wrapped Style */}
      {personality && (
        <div 
          className="relative rounded-[32px] p-8 min-h-[200px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-in zoom-in duration-700 border border-white/10"
          style={{ background: `linear-gradient(135deg, ${personality.color} 0%, #0a0a0a 100%)` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative z-10">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/70 mb-3">{t('personality_title')}</h3>
            <div className="text-4xl font-black text-white tracking-tighter mb-4 leading-tight">{personality.persona}</div>
            <p className="text-base font-bold text-white/90 leading-snug max-w-[75%]">{personality.description}</p>
          </div>
          
          <div className="absolute -top-4 -right-4 opacity-20">
             <svg className="w-32 h-32 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM10.8 5.3h2.4v2.4h-2.4V5.3z" />
                <path d="M8.5 14.5h7a1.5 1.5 0 0 1 1.5 1.5v4a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4a1.5 1.5 0 0 1 1.5-1.5z" />
             </svg>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-gradient-to-br from-[#282828] to-[#181818] p-8 min-h-[180px] flex flex-col justify-between border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
            <span className="text-[11px] font-black text-[#1DB954] uppercase tracking-[0.3em]">Live Insight</span>
          </div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-7 bg-white/10 rounded-lg w-full"></div>
              <div className="h-7 bg-white/10 rounded-lg w-4/5"></div>
            </div>
          ) : (
            <p className="text-2xl font-black tracking-tight leading-snug text-white">"{musing}"</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {moodCards.map((item) => (
          <button key={item.title} onClick={() => onSelectMood?.(item.prompt)} className={`${item.color} h-32 rounded-[24px] p-5 relative group overflow-hidden text-left shadow-[0_8px_30px_rgba(0,0,0,0.4)] active:scale-95 transition-all border border-white/10 hover:border-white/20`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xl font-black leading-tight text-white relative z-10 drop-shadow-lg">{item.title}</span>
            <div className="absolute -right-3 -bottom-3 text-7xl opacity-30 rotate-[15deg] group-hover:scale-110 group-hover:rotate-[20deg] transition-all duration-300">{item.icon}</div>
          </button>
        ))}
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#1DB954]/20 to-[#1DB954]/5 p-5 rounded-[24px] border border-[#1DB954]/30 shadow-lg">
          <div className="text-[10px] font-black text-[#1DB954] uppercase tracking-wider mb-2">总结余</div>
          <div className="text-3xl font-black text-white">¥{stats.balance.toLocaleString()}</div>
          <div className="text-[9px] text-white/60 font-bold mt-1">
            {stats.income > 0 ? `收入 ¥${stats.income.toLocaleString()}` : '暂无收入'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 p-5 rounded-[24px] border border-red-500/30 shadow-lg">
          <div className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-2">总支出</div>
          <div className="text-3xl font-black text-white">¥{stats.expense.toLocaleString()}</div>
          <div className="text-[9px] text-white/60 font-bold mt-1">
            {stats.transactionCount} 笔交易
          </div>
        </div>
      </div>

      {/* 消费习惯分析 */}
      <div className="bg-custom-surface p-6 rounded-[32px] border border-custom-subtle shadow-xl">
        <h3 className="text-lg font-black mb-4 flex items-center space-x-2">
          <svg className="w-5 h-5 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4V3a1 1 0 1 0-2 0v1H9V3a1 1 0 0 0-1-1zm11 4v14H4V6h16z"/>
          </svg>
          <span>消费习惯</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-custom-elevated p-4 rounded-2xl">
            <div className="text-[10px] font-black text-custom-dim uppercase tracking-wider mb-2">最爱分类</div>
            <div className="text-2xl font-black text-[#1DB954]">
              {stats.topCategory ? stats.topCategory[0] : '-'}
            </div>
            <div className="text-[9px] text-custom-dim font-bold mt-1">
              {stats.topCategory ? `${stats.topCategory[1]} 次` : '暂无数据'}
            </div>
          </div>
          <div className="bg-custom-elevated p-4 rounded-2xl">
            <div className="text-[10px] font-black text-custom-dim uppercase tracking-wider mb-2">平均消费</div>
            <div className="text-2xl font-black text-white">
              ¥{stats.avgExpense}
            </div>
            <div className="text-[9px] text-custom-dim font-bold mt-1">
              每笔平均
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#282828] to-[#181818] p-7 rounded-[32px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-4 h-4 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h3 className="text-xs font-black text-white/80 uppercase tracking-[0.3em]">{t('insights')}</h3>
        </div>
        {loading ? <div className="h-24 animate-pulse bg-white/5 rounded-2xl" /> : <p className="text-base font-medium leading-relaxed text-white/90">{insight}</p>}
      </div>
    </div>
  );
};

export default MusingsTab;
