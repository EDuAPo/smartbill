
import React, { useState } from 'react';
import { Transaction } from '../types';

interface SearchTabProps {
  transactions: Transaction[];
}

const SearchTab: React.FC<SearchTabProps> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  
  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(query.toLowerCase()) ||
    t.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Search</h1>
      <div className="sticky top-0 bg-[#121212] py-2 z-20">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="w-full bg-white text-black font-medium py-3 px-12 rounded-lg outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <svg className="w-6 h-6 absolute left-3 top-3 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {['This Month', 'Last Year', 'Food', 'Fun', 'Bills', 'Travel'].map(tag => (
          <div key={tag} className="h-28 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-4 relative overflow-hidden group cursor-pointer">
            <span className="font-black text-xl">{tag}</span>
            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/20 rounded-lg rotate-[25deg] group-hover:scale-110 transition-transform flex items-center justify-center text-3xl">
              📦
            </div>
          </div>
        ))}
      </div>

      {query && (
        <section className="mt-8">
          <h2 className="text-lg font-bold mb-4">Results</h2>
          <div className="space-y-4">
            {filtered.map(t => (
              <div key={t.id} className="flex justify-between items-center p-2 hover:bg-white/5 rounded">
                <div>
                  <div className="font-bold">{t.description}</div>
                  <div className="text-xs text-gray-500">{t.category}</div>
                </div>
                <div className={`font-mono font-bold ${t.type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                  {t.type === 'expense' ? '-' : '+'}${t.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchTab;
