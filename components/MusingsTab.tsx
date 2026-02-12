
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
  const [musing, setMusing] = useState<string>('');
  const [insight, setInsight] = useState<string>('');
  const [personality, setPersonality] = useState<{persona: string, description: string, color: string} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  const moodCards = [
    { title: language === 'zh' ? '深夜剁手' : 'Late Shopping', color: 'bg-[#E13300]', icon: '🌙', prompt: 'Analysis late night spending' },
    { title: language === 'zh' ? '工资日狂欢' : 'Payday Party', color: 'bg-[#1E3264]', icon: '💰', prompt: 'Analyze payday spending' },
    { title: language === 'zh' ? '省钱大作战' : 'Saving Mode', color: 'bg-[#F037A5]', icon: '🛡️', prompt: 'How to save more' },
    { title: language === 'zh' ? '外卖之魂' : 'Foodie Soul', color: 'bg-[#006450]', icon: '🍱', prompt: 'Analyze food delivery frequency' },
  ];

  return (
    <div className="space-y-6 px-4 pt-6 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">{t('discover')}</h1>
          <p className="text-[10px] text-custom-dim font-black uppercase tracking-[0.3em] mt-1">Daily AI Insights</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="w-10 h-10 bg-custom-surface rounded-full flex items-center justify-center border border-custom-subtle shadow-lg active:scale-90 transition-all">
          <svg className={`w-5 h-5 text-[#1DB954] ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </header>

      {/* Spending Personality Card - Spotify Wrapped Style */}
      {personality && (
        <div 
          className="relative rounded-3xl p-6 min-h-[180px] overflow-hidden shadow-2xl animate-in zoom-in duration-700"
          style={{ background: `linear-gradient(135deg, ${personality.color} 0%, #0a0a0a 100%)` }}
        >
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80 mb-2">{t('personality_title')}</h3>
            <div className="text-3xl font-black text-white tracking-tighter mb-3">{personality.persona}</div>
            <p className="text-sm font-bold text-white leading-tight max-w-[70%]">{personality.description}</p>
          </div>
          
          <div className="absolute top-3 right-3 animate-bounce">
             <svg className="w-16 h-16 text-white/30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM10.8 5.3h2.4v2.4h-2.4V5.3z" />
                <path d="M8.5 14.5h7a1.5 1.5 0 0 1 1.5 1.5v4a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4a1.5 1.5 0 0 1 1.5-1.5z" />
             </svg>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[40px] shadow-2xl bg-[#1a1a1a] p-10 min-h-[200px] flex flex-col justify-between border border-white/20">
        <div className="text-[10px] font-black text-custom-dim uppercase tracking-[0.4em]">Spending Podcast</div>
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-full"></div>
            <div className="h-6 bg-white/10 rounded w-4/5"></div>
          </div>
        ) : (
          <p className="text-2xl font-black italic tracking-tighter leading-tight text-white">"{musing}"</p>
        )}
        <div className="flex items-center space-x-2 text-[#1DB954] font-black text-[10px] uppercase tracking-widest">
           <div className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-ping" />
           <span>LIVE INSIGHT</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {moodCards.map((item) => (
          <button key={item.title} onClick={() => onSelectMood?.(item.prompt)} className={`${item.color} h-28 rounded-2xl p-4 relative group overflow-hidden text-left shadow-lg active:scale-95 transition-transform`}>
            <span className="text-lg font-black leading-tight text-white relative z-10">{item.title}</span>
            <div className="absolute -right-4 -bottom-2 text-6xl opacity-40 rotate-[20deg] group-hover:scale-110 transition-transform">{item.icon}</div>
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/20">
        <h3 className="text-xs font-black text-white/60 uppercase tracking-widest mb-4">{t('insights')}</h3>
        {loading ? <div className="h-20 animate-pulse bg-white/5 rounded-xl" /> : <p className="text-sm font-medium leading-relaxed text-white/90">{insight}</p>}
      </div>
    </div>
  );
};

export default MusingsTab;
