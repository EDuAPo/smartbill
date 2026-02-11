
import React from 'react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  t: (key: any) => string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, t }) => {
  const navItems = [
    { id: AppTab.HOME, label: t('home'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: AppTab.MUSINGS, label: t('discover'), icon: 'M4 6h16M4 12h16m-7 6h7' },
    { id: AppTab.AI, label: t('assistant'), icon: '', isAI: true },
    { id: AppTab.CALENDAR, label: t('footprint'), icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: AppTab.DETAILS, label: t('list'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50">
      <nav className="backdrop-blur-3xl border-t border-custom-subtle flex justify-around items-center h-20 px-4" style={{ backgroundColor: 'rgba(18, 18, 18, 0.95)' }}>
        {navItems.map((item) => {
          if (item.isAI) {
            return (
              <div key="ai-btn" className="relative -top-6 flex flex-col items-center">
                <div className={`absolute w-16 h-16 rounded-full blur-2xl transition-opacity duration-700 ${activeTab === AppTab.AI ? 'bg-[#1DB954] opacity-30' : 'bg-custom-dim opacity-10'}`} />
                <button onClick={() => setActiveTab(AppTab.AI)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-premium active:scale-90 relative z-10 ${activeTab === AppTab.AI ? 'bg-white text-[#1DB954]' : 'bg-[#1DB954] text-black'}`}>
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                    {/* 机器人举铜钱卡通造型 */}
                    {/* 铜钱：外圆内方 */}
                    <path d="M12 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5zM10.8 5.3h2.4v2.4h-2.4V5.3z" />
                    {/* 机器人头部 */}
                    <path d="M8.5 14.5h7a1.5 1.5 0 0 1 1.5 1.5v4a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-4a1.5 1.5 0 0 1 1.5-1.5z" />
                    {/* 眼睛 */}
                    <rect x="10" y="17" width="1.2" height="1.2" rx="0.2" fill={activeTab === AppTab.AI ? "#1DB954" : "white"} />
                    <rect x="12.8" y="17" width="1.2" height="1.2" rx="0.2" fill={activeTab === AppTab.AI ? "#1DB954" : "white"} />
                    {/* 天线 */}
                    <path d="M10.5 14.5v-1.5M13.5 14.5v-1.5" stroke="currentColor" strokeWidth="1" />
                    <circle cx="10.5" cy="12.5" r="0.4" />
                    <circle cx="13.5" cy="12.5" r="0.4" />
                    {/* 手臂举起效果 */}
                    <path d="M8 16l-2-4M16 16l2-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
                <span className={`text-[8px] font-black mt-2 transition-colors duration-300 tracking-widest uppercase ${activeTab === AppTab.AI ? 'text-[#1DB954]' : 'text-custom-dim'}`}>{item.label}</span>
              </div>
            );
          }
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center space-y-1.5 transition-all active:scale-90 ${activeTab === item.id ? 'text-[#1DB954]' : 'text-custom-dim'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
