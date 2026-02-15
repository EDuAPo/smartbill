
import React from 'react';
import { Transaction } from '../types';

interface ProfileTabProps {
  transactions: Transaction[];
}

const ProfileTab: React.FC<ProfileTabProps> = ({ transactions }) => {
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
          <img 
            src="/android-chrome-192x192.png" 
            alt="User Avatar" 
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">John Doe</h1>
          <p className="text-xs text-gray-400">Premium User • Finance Enthusiast</p>
        </div>
      </header>

      <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
        {['Playlists', 'Artists', 'Albums', 'Podcasts'].map(chip => (
          <button key={chip} className="px-4 py-1.5 bg-[#282828] rounded-full text-sm font-medium whitespace-nowrap border border-white/10 hover:border-white transition-colors">
            {chip}
          </button>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Your spending categories</h2>
        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat} className="flex items-center space-x-4 p-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors">
              <div className="w-14 h-14 bg-gray-800 rounded flex items-center justify-center text-2xl shadow-lg">
                📁
              </div>
              <div className="flex-1">
                <div className="font-bold">{cat}</div>
                <div className="text-xs text-gray-400">Category • {transactions.filter(t => t.category === cat).length} Transactions</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Account Settings</h2>
        <div className="space-y-4 text-sm font-medium">
          <div className="flex items-center space-x-4 text-gray-300 hover:text-white cursor-pointer">
            <span>Security & Privacy</span>
          </div>
          <div className="flex items-center space-x-4 text-gray-300 hover:text-white cursor-pointer">
            <span>Data Export (CSV)</span>
          </div>
          <div className="flex items-center space-x-4 text-gray-300 hover:text-white cursor-pointer">
            <span>About SmartBill</span>
          </div>
          <div className="pt-4 text-red-500 font-bold cursor-pointer">
            Log out
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfileTab;
