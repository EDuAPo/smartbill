import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { generateFunnySpendingJokes } from '../services/deepseekService';

interface SearchTabProps {
  transactions: Transaction[];
}

const SearchTab: React.FC<SearchTabProps> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  const [jokes, setJokes] = useState<Array<{title: string, content: string, emoji: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchJokes = async () => {
      setLoading(true);
      const result = await generateFunnySpendingJokes(transactions);
      setJokes(result);
      setLoading(false);
    };
    fetchJokes();
  }, [transactions]);

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(query.toLowerCase()) ||
    t.category.toLowerCase().includes(query.toLowerCase())
  );

  // 快捷筛选标签
  const quickFilters = [
    { label: '本月', filter: () => {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      return transactions.filter(t => t.date.startsWith(monthStr));
    }, color: 'from-purple-500 to-pink-500', icon: '📅' },
    { label: '大额', filter: () => transactions.filter(t => t.amount > 500).sort((a, b) => b.amount - a.amount), color: 'from-red-500 to-orange-500', icon: '💰' },
    { label: '吃喝', filter: () => transactions.filter(t => t.category === 'Food'), color: 'from-green-500 to-teal-500', icon: '🍱' },
    { label: '购物', filter: () => transactions.filter(t => t.category === 'Shopping'), color: 'from-blue-500 to-cyan-500', icon: '🛍️' },
    { label: '娱乐', filter: () => transactions.filter(t => t.category === 'Entertainment'), color: 'from-yellow-500 to-amber-500', icon: '🎮' },
    { label: '出行', filter: () => transactions.filter(t => t.category === 'Transport'), color: 'from-indigo-500 to-purple-500', icon: '🚗' },
  ];

  return (
    <div className="space-y-4 px-5 pt-6 pb-20">
      <header>
        <h1 className="text-4xl font-black tracking-tighter">发现</h1>
        <p className="text-[10px] text-[#1DB954] font-black uppercase tracking-[0.3em] mt-0.5">AI看穿你的钱包</p>
      </header>

      {/* AI段子区 */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-white/80 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
          <span>AI吐槽时间</span>
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-custom-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {jokes.map((joke, idx) => (
              <div key={idx} className="bg-gradient-to-br from-custom-surface to-custom-elevated p-4 rounded-2xl border border-custom-subtle shadow-lg hover:scale-[1.02] transition-transform">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{joke.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-white mb-1">{joke.title}</h3>
                    <p className="text-sm text-white/80 leading-relaxed">{joke.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 搜索框 */}
      <div className="sticky top-0 bg-[#121212] py-2 z-20">
        <div className="relative">
          <input 
            type="text" 
            placeholder="搜索交易记录..." 
            className="w-full bg-custom-surface text-white font-medium py-3 px-12 rounded-2xl outline-none border border-custom-subtle focus:border-[#1DB954] transition-colors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 text-custom-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      {/* 快捷筛选 */}
      <div>
        <h2 className="text-sm font-black text-white/80 mb-3">快速查看</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickFilters.map(item => (
            <button 
              key={item.label}
              onClick={() => {
                const results = item.filter();
                console.log(`${item.label}:`, results);
              }}
              className={`h-24 rounded-2xl bg-gradient-to-br ${item.color} p-4 relative overflow-hidden group cursor-pointer shadow-lg active:scale-95 transition-all`}
            >
              <span className="font-black text-lg text-white relative z-10 drop-shadow-lg">{item.label}</span>
              <div className="absolute -right-2 -bottom-2 text-5xl opacity-30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">{item.icon}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      {query && (
        <section className="mt-6">
          <h2 className="text-sm font-black text-white/80 mb-3">找到 {filtered.length} 条</h2>
          <div className="space-y-2">
            {filtered.length > 0 ? filtered.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-custom-surface hover:bg-custom-elevated rounded-xl transition-colors border border-custom-subtle">
                <div>
                  <div className="font-bold text-white">{t.description}</div>
                  <div className="text-xs text-custom-dim font-bold">{t.date} · {t.category}</div>
                </div>
                <div className={`font-black ${t.type === 'expense' ? 'text-red-400' : 'text-[#1DB954]'}`}>
                  {t.type === 'expense' ? '-' : '+'}¥{t.amount.toFixed(2)}
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-custom-dim">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">啥也没找到</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchTab;
