
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';

interface DetailsTabProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  t: (key: any) => string;
  language: string;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ transactions, onDelete, t, language }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#282828] to-custom-main">
      <div className="space-y-5 px-5 pt-10 pb-24">
        {/* Spotify "Playlist Cover" Header */}
        <div className="flex flex-col items-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative w-48 h-48 bg-gradient-to-br from-[#1DB954] to-[#121212] rounded-lg flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] group overflow-hidden">
             <svg className="w-24 h-24 text-white/90 group-hover:scale-110 transition-transform duration-500" viewBox="0 0 24 24" fill="currentColor">
                {/* 卡通机器人举铜钱吉祥物 */}
                <path d="M12 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM10.8 5.3h2.4v2.4h-2.4V5.3z" />
                <path d="M8.5 14.5h7a1.5 1.5 0 0 1 1.5 1.5v4a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4a1.5 1.5 0 0 1 1.5-1.5z" />
                <rect x="10" y="17" width="1.2" height="1.2" rx="0.2" fill="black" />
                <rect x="12.8" y="17" width="1.2" height="1.2" rx="0.2" fill="black" />
                <path d="M10.5 14.5v-1.5M13.5 14.5v-1.5" stroke="currentColor" strokeWidth="1" />
                <circle cx="10.5" cy="12.5" r="0.4" />
                <circle cx="13.5" cy="12.5" r="0.4" />
                <path d="M8 16l-2-4M16 16l2-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
             </svg>
             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-6 text-center">
            <h1 className="text-4xl font-black tracking-tighter uppercase">{t('list')}</h1>
            <div className="flex items-center justify-center space-x-2 mt-2">
               <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center text-[10px] text-black font-black">S</div>
               <p className="text-[11px] font-black text-white/80 uppercase tracking-widest">SmartBill • {transactions.length} Tracks</p>
            </div>
          </div>
        </div>

        {/* Search Bar - Spotify Style */}
        <div className="sticky top-4 z-20 mb-5">
          <div className="relative">
            <input 
              type="text"
              placeholder={language === 'zh' ? "搜索账单音轨..." : "Search bill tracks..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md rounded-md py-3 pl-12 pr-6 text-sm font-bold outline-none border border-white/5 focus:bg-white/20 transition-all placeholder-white/30"
            />
            <svg className="w-5 h-5 absolute left-4 top-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>

        {/* Transaction List - Styled like a song list */}
        <div className="space-y-1">
          {filtered.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-md hover:bg-white/10 transition-all group active:bg-white/5">
              <div className="flex items-center space-x-4">
                <span className="text-custom-dim font-black text-[10px] w-4 text-right group-hover:hidden">{index + 1}</span>
                <button className="hidden group-hover:block w-4 text-[#1DB954]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <div>
                  <div className="font-bold text-sm text-white group-hover:text-[#1DB954] transition-colors truncate max-w-[150px]">{item.description}</div>
                  <div className="text-[10px] text-custom-dim font-black uppercase tracking-widest">{item.category}</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-[10px] text-custom-dim font-black hidden xs:block">{item.date}</div>
                <div className={`font-mono text-sm font-black w-24 text-right ${item.type === 'income' ? 'text-[#1DB954]' : 'text-white'}`}>
                  {item.type === 'income' ? '+' : '-'}¥{item.amount.toLocaleString()}
                </div>
                <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/60 hover:text-red-500 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 opacity-20">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
              <p className="font-black uppercase tracking-widest text-[10px]">{language === 'zh' ? '这里空空如也' : 'No tracks found'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
