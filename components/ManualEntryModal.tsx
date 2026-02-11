
import React, { useState } from 'react';
import { Transaction } from '../types';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (t: Transaction) => void;
  // Added language and t props to match usage in App.tsx and fix TypeScript error
  language: string;
  t: (key: any) => string;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ isOpen, onClose, onAdd, language, t }) => {
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  if (!isOpen) return null;

  const handleKeyClick = (key: string) => {
    if (key === 'del') {
      setAmountStr(prev => prev.slice(0, -1));
    } else if (key === '.') {
      if (!amountStr.includes('.')) setAmountStr(prev => prev + '.');
    } else {
      if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
      if (amountStr.length > 8) return; // Limit input length
      setAmountStr(prev => prev + key);
    }
  };

  const handleSave = () => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    if (!description.trim()) return;

    onAdd({
      id: Date.now().toString(),
      amount: amount,
      description: description.trim(),
      category,
      type: transactionType,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Reset and close
    setAmountStr('');
    setDescription('');
    onClose();
  };

  const categories = [
    { name: 'Food', icon: '🍴', color: 'bg-[#FF4632]' },
    { name: 'Transport', icon: '🚗', color: 'bg-[#509BF5]' },
    { name: 'Shopping', icon: '🛍️', color: 'bg-[#F59B23]' },
    { name: 'Social', icon: '🍻', color: 'bg-[#1DB954]' },
    { name: 'Entertainment', icon: '🎮', color: 'bg-[#AF2896]' },
    { name: 'Pets', icon: '🐱', color: 'bg-[#FF6437]' },
    { name: 'Subscription', icon: '📺', color: 'bg-[#616161]' },
    { name: 'Beauty', icon: '✂️', color: 'bg-[#E91E63]' },
    { name: 'Housing', icon: '🏠', color: 'bg-[#7D4B32]' },
    { name: 'Salary', icon: '💼', color: 'bg-[#1DB954]' },
  ];

  const isValid = parseFloat(amountStr) > 0 && description.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Dynamic Background Glow based on type */}
      <div className={`absolute top-0 left-0 right-0 h-1/3 blur-[100px] pointer-events-none transition-colors duration-700 ${transactionType === 'expense' ? 'bg-red-500/10' : 'bg-[#1DB954]/20'}`} />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-12 pb-2">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors active:scale-90">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <div className="flex bg-[#282828] p-1 rounded-full border border-white/5 shadow-2xl">
          <button 
            onClick={() => setTransactionType('expense')}
            className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${transactionType === 'expense' ? 'bg-white text-black' : 'text-gray-500'}`}
          >{language === 'zh' ? '支出' : 'EXPENSE'}</button>
          <button 
            onClick={() => setTransactionType('income')}
            className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${transactionType === 'income' ? 'bg-white text-black' : 'text-gray-500'}`}
          >{language === 'zh' ? '收入' : 'INCOME'}</button>
        </div>
        <div className="w-8" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Amount Display Section */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 min-h-[160px]">
          <div className="flex items-baseline space-x-2 animate-in zoom-in duration-300">
            <span className={`text-3xl font-light transition-colors ${transactionType === 'expense' ? 'text-red-500/40' : 'text-[#1DB954]/40'}`}>¥</span>
            <span className={`text-8xl font-black tracking-tighter transition-all duration-300 ${amountStr ? 'text-white scale-110' : 'text-white/5'}`}>
              {amountStr || '0.00'}
            </span>
          </div>
          
          <div className="w-full max-w-xs mt-6 relative">
            <input 
              type="text"
              placeholder={language === 'zh' ? "这笔钱花在哪了？" : "Where did this money go?"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 py-3 text-center text-lg font-bold text-white placeholder-white/20 focus:border-[#1DB954] transition-all outline-none"
            />
            {description && (
              <div className="absolute -bottom-6 left-0 right-0 text-center animate-in fade-in slide-in-from-top-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#1DB954]">{language === 'zh' ? '备注已输入' : 'REMARK ENTERED'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Picker */}
        <div className="px-4 py-4 mt-auto">
          <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2 px-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setCategory(cat.name)}
                className={`flex-shrink-0 flex flex-col items-center space-y-2 transition-all duration-300 ${
                  category === cat.name ? 'scale-110' : 'opacity-40 grayscale-[0.5]'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center text-2xl shadow-2xl relative`}>
                  {category === cat.name && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-white animate-pulse" />
                  )}
                  {cat.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${category === cat.name ? 'text-white' : 'text-gray-500'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Integrated Keypad & CONFIRM BUTTON */}
        <div className="bg-[#121212] border-t border-white/5 p-4 pb-8">
          <div className="grid grid-cols-4 gap-2 h-[320px]">
            {/* Numeric Section (3/4 width) */}
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleKeyClick(k)}
                  className="bg-[#282828] rounded-xl flex items-center justify-center text-2xl font-black hover:bg-[#333] active:bg-[#444] transition-colors active:scale-90"
                >
                  {k === 'del' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                    </svg>
                  ) : k}
                </button>
              ))}
            </div>
            
            {/* Primary Action Section (1/4 width) */}
            <div className="col-span-1 flex flex-col">
              <button
                onClick={handleSave}
                disabled={!isValid}
                className={`flex-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 shadow-2xl ${
                  isValid 
                    ? 'bg-[#1DB954] text-black scale-100 shadow-[0_0_30px_#1DB954]/40 active:scale-95' 
                    : 'bg-[#282828] text-white/20 scale-95 cursor-not-allowed grayscale'
                }`}
              >
                <div className={`transition-transform duration-500 ${isValid ? 'scale-125' : 'scale-100'}`}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase mt-4 tracking-tighter whitespace-nowrap">
                  {isValid ? (language === 'zh' ? '完成入账' : 'CONFIRM') : (language === 'zh' ? '填写信息' : 'ENTER INFO')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualEntryModal;
