import React, { useEffect, useState } from 'react';
import { Search, Sun, Moon, ShieldCheck } from 'lucide-react';
import { UserMenu } from '../auth/UserMenu';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigateToSuperAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigateToSuperAdmin }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('omni_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('omni_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="header-search-btn" onClick={onOpenSearch}>
          <Search size={16} />
          <span>全局搜索工具...</span>
          <span className="kbd-shortcut">⌘ K</span>
        </button>
      </div>

      <div className="header-actions">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--accent-emerald)',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          <ShieldCheck size={14} />
          <span>纯前端 100% 离线计算</span>
        </div>

        <button className="icon-btn" onClick={toggleTheme} title="切换主题">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <a
          href="https://github.com/wuyueerhao/omni-tools"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn"
          title="GitHub 源码仓库"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>

        {/* User Management System Menu */}
        <UserMenu onNavigateToSuperAdmin={onNavigateToSuperAdmin} />
      </div>
    </header>
  );
};
