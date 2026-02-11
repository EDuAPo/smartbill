
import React, { useState, useMemo } from 'react';
import { logout } from '../services/authService';
import { Transaction } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClearData: () => void;
  transactions: Transaction[];
  theme: string;
  setTheme: (t: string) => void;
  fontSize: string;
  setFontSize: (s: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  notifications: boolean;
  setNotifications: (n: boolean) => void;
  t: (key: any) => string;
}

type SettingsView = 'main' | 'account' | 'categories' | 'exchange' | 'lang' | 'fontsize' | 'theme' | 'notif';

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ 
  isOpen, onClose, onClearData, transactions,
  theme, setTheme, fontSize, setFontSize, language, setLanguage, notifications, setNotifications, t
}) => {
  const [view, setView] = useState<SettingsView>('main');
  const [confirmingAction, setConfirmingAction] = useState<'export' | 'clear' | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{"name":"User"}');
  const [userName, setUserName] = useState(user.name);

  const balance = transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
  const categoryStats = Object.entries(transactions.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {} as any)).sort((a: any, b: any) => b[1] - a[1]);

  const handleSaveName = () => {
    localStorage.setItem('user', JSON.stringify({ ...user, name: userName }));
    setView('main');
  };

  const executeExport = () => {
    const csv = [["Date","Type","Category","Desc","Amount"], ...transactions.map(t => [t.date, t.type, t.category, t.description, t.amount])].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: 'text/csv' }));
    link.download = "SmartBill_Export.csv";
    link.click();
    setConfirmingAction(null);
  };

  const renderBack = (target: SettingsView = 'main') => (
    <button onClick={() => setView(target)} className="flex items-center space-x-2 text-custom-dim mb-6 font-black uppercase text-[9px] tracking-widest">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7"/></svg>
      <span>{t('back')}</span>
    </button>
  );

  const renderContent = () => {
    switch (view) {
      case 'account':
        return (
          <div className="space-y-6 animate-in slide-in-from-right">
            {renderBack()}
            <h3 className="text-2xl font-black mb-6">{t('account_pref')}</h3>
            <div className="space-y-1">
              {[
                { label: t('language'), val: language === 'zh' ? '中文' : 'English', act: () => setView('lang') },
                { label: t('theme'), val: theme === 'dark' ? t('dark_mode') : t('light_mode'), act: () => setView('theme') },
                { label: t('font_size'), val: t(fontSize), act: () => setView('fontsize') },
                { label: t('notifications'), val: notifications ? 'ON' : 'OFF', act: () => setView('notif') },
              ].map(item => (
                <button key={item.label} onClick={item.act} className="w-full flex justify-between items-center p-4 bg-custom-elevated rounded-2xl hover:brightness-110 transition-all border border-custom-subtle mb-2">
                  <span className="font-bold text-sm">{item.label}</span>
                  <span className="text-xs font-black text-[#1DB954]">{item.val}</span>
                </button>
              ))}
            </div>
            <div className="pt-6 mt-6 border-t border-custom-subtle">
              <label className="text-[10px] font-black uppercase text-custom-dim tracking-widest px-1">{t('nickname')}</label>
              <div className="flex space-x-2 mt-2">
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="flex-1 bg-custom-elevated rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-[#1DB954] text-sm" />
                <button onClick={handleSaveName} className="bg-custom-main text-custom-main border border-custom-subtle px-4 rounded-xl font-black text-xs uppercase">{t('save')}</button>
              </div>
            </div>
          </div>
        );
      case 'lang':
        return (
          <div className="animate-in slide-in-from-right">
            {renderBack('account')}
            <h3 className="text-xl font-black mb-6">{t('language')}</h3>
            <div className="space-y-2">
              {[{id:'zh', n:'中文'}, {id:'en', n:'English'}].map(l => (
                <button key={l.id} onClick={() => setLanguage(l.id)} className={`w-full p-5 rounded-2xl border flex justify-between items-center ${language === l.id ? 'border-[#1DB954] bg-[#1DB954]/5' : 'border-custom-subtle bg-custom-elevated'}`}>
                  <span className="font-bold">{l.n}</span>
                  {language === l.id && <div className="w-2 h-2 bg-[#1DB954] rounded-full shadow-[0_0_10px_#1DB954]" />}
                </button>
              ))}
            </div>
          </div>
        );
      case 'theme':
        return (
          <div className="animate-in slide-in-from-right">
            {renderBack('account')}
            <h3 className="text-xl font-black mb-6">{t('theme')}</h3>
            <div className="grid grid-cols-2 gap-4">
              {[{id:'dark', n:t('dark_mode'), c:'bg-[#121212]'}, {id:'light', n:t('light_mode'), c:'bg-[#F8F8F8] border-gray-300'}].map(x => (
                <button key={x.id} onClick={() => setTheme(x.id)} className={`flex flex-col items-center p-6 rounded-3xl border transition-all ${theme === x.id ? 'border-[#1DB954] bg-[#1DB954]/5' : 'border-custom-subtle bg-custom-elevated'}`}>
                  <div className={`w-12 h-12 rounded-full mb-4 border ${x.c}`} />
                  <span className="font-black text-xs">{x.n}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'fontsize':
        return (
          <div className="animate-in slide-in-from-right">
            {renderBack('account')}
            <h3 className="text-xl font-black mb-6">{t('font_size')}</h3>
            <div className="space-y-2">
              {['small', 'medium', 'large'].map(s => (
                <button key={s} onClick={() => setFontSize(s)} className={`w-full p-5 rounded-2xl border flex justify-between items-center ${fontSize === s ? 'border-[#1DB954] bg-[#1DB954]/5' : 'border-custom-subtle bg-custom-elevated'}`}>
                  <span className={`font-bold ${s === 'small' ? 'text-xs' : s === 'large' ? 'text-lg' : 'text-sm'}`}>{t(s)}</span>
                  {fontSize === s && <div className="w-2 h-2 bg-[#1DB954] rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        );
      case 'notif':
        return (
          <div className="animate-in slide-in-from-right">
            {renderBack('account')}
            <h3 className="text-xl font-black mb-6">{t('notifications')}</h3>
            <div className="bg-custom-elevated p-6 rounded-2xl border border-custom-subtle flex justify-between items-center">
              <span className="font-bold">{t('notifications')}</span>
              <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full relative transition-colors ${notifications ? 'bg-[#1DB954]' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        );
      case 'categories':
        return (
          <div className="animate-in slide-in-from-right">
            {renderBack()}
            <h3 className="text-xl font-black mb-6">{t('category_mgmt')}</h3>
            <div className="space-y-2">
              {categoryStats.map(([cat, count]: any) => (
                <div key={cat} className="flex justify-between items-center bg-custom-elevated p-4 rounded-xl border border-custom-subtle">
                  <span className="font-bold">{cat}</span>
                  <span className="text-[10px] font-black text-custom-dim px-2 py-1 bg-custom-surface rounded-full">{count} Items</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6 animate-in fade-in">
            {[
              { l: t('account_pref'), i: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', a: () => setView('account') },
              { l: t('category_mgmt'), i: 'M4 6h16M4 12h16m-7 6h7', a: () => setView('categories') },
              { l: t('export'), i: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', a: () => setConfirmingAction('export') },
              { l: t('clear_data'), i: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', a: () => setConfirmingAction('clear') },
            ].map(item => (
              <button key={item.l} onClick={item.a} className="w-full flex items-center space-x-4 p-4 hover:bg-custom-surface transition-all group active:scale-[0.98]">
                <div className="w-10 h-10 rounded-xl bg-custom-elevated flex items-center justify-center border border-custom-subtle group-hover:text-[#1DB954] group-hover:border-[#1DB954]/50 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.i} /></svg>
                </div>
                <span className="font-black text-sm">{item.l}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-sm bg-custom-main z-[101] shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} border-r border-custom-subtle`}>
        <div className="p-6 pt-12 space-y-8 flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1DB954] to-black flex items-center justify-center text-xl font-black text-white shadow-premium">
              {userName[0]}
            </div>
            <div>
              <h2 className="text-xl font-black">{userName}</h2>
              <p className="text-[9px] text-[#1DB954] font-black uppercase tracking-widest">{t('pro_user')}</p>
            </div>
          </div>
          {renderContent()}
          <div className="mt-auto pt-8 border-t border-custom-subtle">
            <button onClick={logout} className="w-full bg-custom-surface py-4 rounded-full font-black text-[10px] uppercase tracking-widest border border-custom-subtle hover:brightness-110 active:scale-95 transition-all">{t('logout')}</button>
          </div>
        </div>
      </div>
      {confirmingAction && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-end justify-center px-4 pb-12">
          <div className="bg-custom-elevated w-full max-w-sm rounded-[32px] p-8 border border-custom-subtle shadow-2xl animate-in slide-in-from-bottom">
            <h4 className="text-2xl font-black text-center mb-10">{confirmingAction === 'export' ? t('export')+'?' : t('clear_data')+'?'}</h4>
            <div className="space-y-3">
              <button onClick={confirmingAction === 'export' ? executeExport : () => { onClearData(); onClose(); }} className={`w-full h-14 rounded-full font-black uppercase text-sm active:scale-95 transition-all ${confirmingAction === 'export' ? 'bg-[#1DB954] text-black' : 'bg-red-500 text-white'}`}>{t('confirm')}</button>
              <button onClick={() => setConfirmingAction(null)} className="w-full h-14 rounded-full font-black uppercase text-sm active:scale-95 transition-all">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsDrawer;
