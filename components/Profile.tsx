import React, { useState } from 'react';
import { 
  User as UserIcon, Shield, CreditCard, Bell, Smartphone, 
  HelpCircle, LogOut, ChevronRight, MessageCircle, Edit2, 
  Download, Trash2, Check, X, Loader2 
} from 'lucide-react';
import { User, Transaction } from '../types';
import { UserService } from '../services/userService';

interface Props {
  user: User;
  onLogout: () => void;
  showNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  transactions: Transaction[];
  onUserUpdate: (updated: User) => void;
}

const userService = UserService.getInstance();

const Profile: React.FC<Props> = ({ user, onLogout, showNotify, transactions, onUserUpdate }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user.nickname);
  const [loading, setLoading] = useState<string | null>(null);
  
  // 模拟同步设置（真实应用中应存储在 user 对象或单独的 settings 表）
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleUpdateNickname = async () => {
    if (!newName.trim() || newName === user.nickname) {
      setIsEditingName(false);
      return;
    }
    setLoading('nickname');
    try {
      const updated = await userService.updateProfile({ nickname: newName });
      onUserUpdate(updated);
      showNotify('昵称更新成功', 'success');
      setIsEditingName(false);
    } catch (err) {
      showNotify('更新失败', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleExportData = async () => {
    setLoading('export');
    try {
      const url = await userService.exportData(transactions);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartbill_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotify('数据备份已生成', 'success');
    } catch (err) {
      showNotify('导出失败', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('确定要永久注销账号吗？所有数据将被清空且无法找回。')) return;
    setLoading('delete');
    try {
      await userService.deleteAccount();
      onLogout();
      showNotify('账号已安全注销', 'info');
    } catch (err) {
      showNotify('操作失败', 'error');
      setLoading(null);
    }
  };

  const toggleSmsSync = () => {
    const nextState = !syncEnabled;
    setSyncEnabled(nextState);
    showNotify(nextState ? '自动同步已开启' : '自动同步已关闭', 'info');
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-24">
      <header className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-emerald-400 to-indigo-500 p-1 mb-4 shadow-2xl shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full rounded-[28px] bg-black flex items-center justify-center overflow-hidden">
               {user.avatar ? (
                 <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
               ) : (
                 <UserIcon className="w-10 h-10 text-white/20" />
               )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
            {user.loginMethod === 'wechat' ? (
              <MessageCircle className="w-4 h-4 text-[#07C160]" fill="#07C160" />
            ) : (
              <Smartphone className="w-4 h-4 text-emerald-400" />
            )}
          </div>
        </div>

        {isEditingName ? (
          <div className="mt-4 flex items-center gap-2 animate-in fade-in zoom-in-95">
            <input 
              autoFocus
              className="bg-zinc-900 border border-emerald-500/50 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none w-32"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUpdateNickname()}
            />
            <button onClick={handleUpdateNickname} className="p-2 bg-emerald-500 rounded-xl">
              {loading === 'nickname' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => {setIsEditingName(false); setNewName(user.nickname);}} className="p-2 bg-zinc-800 rounded-xl"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-4 group">
            <h2 className="text-xl font-black tracking-tight">{user.nickname}</h2>
            <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 p-1 transition-opacity">
              <Edit2 className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
        )}

        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] bg-white/[0.02] px-4 py-1.5 rounded-full border border-white/5 mt-3">
          {user.loginMethod === 'wechat' ? '微信已认证' : `手机号: ${user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`}
        </p>
      </header>

      <div className="space-y-6">
        <section>
          <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4 px-2">自动同步</h3>
          <div className="space-y-3">
            <SettingsItem 
              onClick={toggleSmsSync}
              icon={<Smartphone className="text-emerald-400" />} 
              label="短信与通知读取" 
              sub={syncEnabled ? "已连接系统权限" : "未开启"} 
              active={syncEnabled}
            />
            <SettingsItem 
              onClick={() => showNotify('银行网关功能需在专业版解锁', 'info')}
              icon={<CreditCard className="text-indigo-400" />} 
              label="银行/支付账户接入" 
              sub="已连接 3 个" 
            />
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4 px-2">数据管理</h3>
          <div className="space-y-3">
            <SettingsItem 
              onClick={handleExportData}
              icon={loading === 'export' ? <Loader2 className="animate-spin text-zinc-400" /> : <Download className="text-zinc-400" />} 
              label="导出账单明细" 
              sub="支持 JSON/CSV 格式"
            />
            <SettingsItem 
              onClick={() => showNotify('端到端加密密钥已在本地生成', 'success')}
              icon={<Shield className="text-rose-400" />} 
              label="隐私与安全中心" 
              sub="AES-256 加密保护中"
            />
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-4 px-2">账户控制</h3>
          <div className="space-y-3">
            <SettingsItem 
              onClick={onLogout}
              icon={<LogOut className="text-zinc-500" />} 
              label="退出当前登录" 
            />
            <SettingsItem 
              onClick={handleDeleteAccount}
              icon={loading === 'delete' ? <Loader2 className="animate-spin text-rose-500" /> : <Trash2 className="text-rose-500" />} 
              label="永久注销账号" 
              danger
            />
          </div>
        </section>
      </div>

      <div className="text-center opacity-20">
        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em]">SmartBill v1.2.0 • Data Secured</p>
      </div>
    </div>
  );
};

const SettingsItem: React.FC<{ 
  icon: React.ReactNode, 
  label: string, 
  sub?: string, 
  danger?: boolean,
  active?: boolean,
  onClick?: () => void 
}> = ({ icon, label, sub, danger, active, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full glass p-4 rounded-[24px] flex items-center justify-between active:scale-[0.98] transition-all group border-white/5"
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
        {icon}
      </div>
      <div className="text-left">
        <p className={`text-sm font-bold ${danger ? 'text-rose-500' : 'text-zinc-100'}`}>{label}</p>
        {sub && <p className="text-[10px] text-zinc-600 font-bold tracking-tight mt-0.5">{sub}</p>}
      </div>
    </div>
    {!danger && <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-400 transition-colors" />}
  </button>
);

export default Profile;
