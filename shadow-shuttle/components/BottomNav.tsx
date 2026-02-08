import React from 'react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', icon: 'home', label: '首页' },
    { id: 'ai', icon: 'smart_toy', label: 'AI 助手' },
    { id: 'history', icon: 'history', label: '历史' },
    { id: 'profile', icon: 'person', label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 z-40 w-full max-w-md bg-[#101622]/95 backdrop-blur-lg border-t border-surface pb-safe">
      <div className="flex items-center justify-around h-16 pb-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;