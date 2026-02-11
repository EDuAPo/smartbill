import React, { useState, useEffect } from 'react';
import { AppTab, Transaction } from './types';
import BottomNav from './components/BottomNav';
import HomeTab from './components/HomeTab';
import DetailsTab from './components/DetailsTab';
import AITab from './components/AITab';
import CalendarTab from './components/CalendarTab';
import MusingsTab from './components/MusingsTab';
import SettingsDrawer from './components/SettingsDrawer';
import ManualEntryModal from './components/ManualEntryModal';
import LoginScreen from './components/LoginScreen';
import { translations } from './services/i18n';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 强制从登录开始
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Settings States
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  const [language, setLanguage] = useState('zh');
  const [notifications, setNotifications] = useState(false);
  const [budget, setBudget] = useState<number>(5000);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [pendingAIPrompt, setPendingAIPrompt] = useState<string | null>(null);

  // Localization helper
  const t = (key: keyof typeof translations['zh']) => {
    const lang = language as 'zh' | 'en';
    return translations[lang][key] || key;
  };

  // 初始化数据
  useEffect(() => {
    if (isLoggedIn && transactions.length === 0) {
      const mock: Transaction[] = [
        { id: '1', amount: 8500, category: 'Salary', description: 'Monthly Salary', date: '2026-02-01', type: 'income' },
        { id: '2', amount: 1500, category: 'Housing', description: 'Rent Payment', date: '2026-02-01', type: 'expense' },
        { id: '3', amount: 68.5, category: 'Food', description: 'Fried Chicken', date: '2026-02-02', type: 'expense' },
      ];
      setTransactions(mock);
    }
  }, [isLoggedIn]);

  const addTransaction = (t: Transaction) => setTransactions(prev => [t, ...prev]);
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(item => item.id !== id));
  const clearAllData = () => setTransactions([]);

  const handleLoginSuccess = (user: any) => {
    console.log('=== LOGIN SUCCESS ===');
    console.log('User:', user);
    setIsLoggedIn(true);
  };

  // 登录屏幕
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 主应用界面
  console.log('=== RENDERING MAIN APP ===');
  console.log('Active Tab:', activeTab);
  console.log('Transactions:', transactions.length);

  const renderContent = () => {
    const props = { transactions, language, t }; 
    
    switch (activeTab) {
      case AppTab.HOME:
        return (
          <HomeTab 
            {...props} 
            budget={budget} 
            setBudget={setBudget} 
            onAdd={addTransaction} 
            onOpenSettings={() => setIsDrawerOpen(true)} 
            onOpenManual={() => setIsManualModalOpen(true)} 
          />
        );
      case AppTab.AI:
        return <AITab {...props} onAdd={addTransaction} initialPrompt={pendingAIPrompt} onClearInitialPrompt={() => setPendingAIPrompt(null)} />;
      case AppTab.CALENDAR:
        return <CalendarTab {...props} />;
      case AppTab.DETAILS:
        return <DetailsTab {...props} onDelete={deleteTransaction} />;
      case AppTab.MUSINGS:
        return <MusingsTab {...props} onSelectMood={(p: string) => { setPendingAIPrompt(p); setActiveTab(AppTab.AI); }} />;
      default:
        return <div style={{ padding: '20px', color: '#fff' }}>未知页面</div>;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw',
      overflow: 'hidden', 
      position: 'fixed',
      top: 0,
      left: 0,
      background: 'linear-gradient(180deg, #222222 0%, #121212 100%)', 
      color: '#FFFFFF' 
    }}>
      <style>{`
        :root { 
          --bg-main: #121212; 
          --bg-surface: #181818; 
          --bg-elevated: #282828; 
          --text-main: #FFFFFF; 
          --text-dim: #B3B3B3;
          --spotify-green: #1DB954;
          --border-subtle: rgba(255,255,255,0.1);
        }
        .bg-custom-surface { background-color: var(--bg-surface) !important; }
        .bg-custom-elevated { background-color: var(--bg-elevated) !important; }
        .text-custom-main { color: var(--text-main) !important; }
        .text-custom-dim { color: var(--text-dim) !important; }
        .border-custom-subtle { border-color: var(--border-subtle) !important; }
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        * { box-sizing: border-box; }
      `}</style>
      
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        paddingBottom: '96px', 
        position: 'relative', 
        zIndex: 10,
        width: '100%'
      }} className="scrollbar-hide">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
      
      <SettingsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onClearData={clearAllData}
        transactions={transactions}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        language={language}
        setLanguage={setLanguage}
        notifications={notifications}
        setNotifications={setNotifications}
        t={t}
      />
      
      <ManualEntryModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        onAdd={addTransaction} 
        language={language}
        t={t}
      />
    </div>
  );
};

export default App;
