import React, { useState, useEffect } from 'react';
import { CATEGORIES, TOOLS } from '../../config/tools';
import type { ToolCategory } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { LayoutGrid, Wrench, Shield } from 'lucide-react';
import { AuthService } from '../../services/authService';
import type { User } from '../../types/user';

interface SidebarProps {
  currentToolId: string | null;
  selectedCategory: ToolCategory | 'all';
  onSelectCategory: (cat: ToolCategory | 'all') => void;
  onSelectTool: (id: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentToolId,
  selectedCategory,
  onSelectCategory,
  onSelectTool,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => AuthService.getCurrentUser());

  useEffect(() => {
    const unsub = AuthService.subscribe((u) => setCurrentUser(u));
    return unsub;
  }, []);

  const isSuper = AuthService.isSuperAdmin(currentUser);

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge" onClick={() => onSelectTool(null)}>
          <div className="brand-logo-icon">
            <Wrench size={20} />
          </div>
          <div className="brand-title">
            <span>OmniTools</span>
            <span className="brand-subtitle">极客全能工具箱</span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="sidebar-nav">
        {/* Overview */}
        <div>
          <div className="nav-section-title">工具导航</div>
          <ul className="nav-list">
            <li>
              <button
                className={`nav-item-btn ${currentToolId === null && selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTool(null);
                  onSelectCategory('all');
                }}
              >
                <LayoutGrid size={18} />
                <span>全部工具 ({TOOLS.length})</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Categories */}
        <div>
          <div className="nav-section-title">功能分类</div>
          <ul className="nav-list">
            {CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <button
                  className={`nav-item-btn ${currentToolId === null && selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectTool(null);
                    onSelectCategory(cat.id);
                  }}
                >
                  <DynamicIcon name={cat.iconName} size={18} />
                  <span>{cat.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Launch Tools */}
        <div>
          <div className="nav-section-title">快捷入口</div>
          <ul className="nav-list">
            {TOOLS.map((t) => (
              <li key={t.id}>
                <button
                  className={`nav-item-btn ${currentToolId === t.id ? 'active' : ''}`}
                  onClick={() => onSelectTool(t.id)}
                >
                  <DynamicIcon name={t.iconName} size={18} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 仅超级管理员可见的专属入口 */}
        {isSuper && (
          <div style={{ marginTop: '12px' }}>
            <div className="nav-section-title" style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>👑 超管专区</span>
            </div>
            <ul className="nav-list">
              <li>
                <button
                  className={`nav-item-btn ${currentToolId === 'super-admin-panel' ? 'active' : ''}`}
                  style={{
                    background: currentToolId === 'super-admin-panel' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(168, 85, 247, 0.08)',
                    borderColor: 'rgba(168, 85, 247, 0.35)',
                    color: 'var(--text-primary)',
                  }}
                  onClick={() => onSelectTool('super-admin-panel')}
                >
                  <Shield size={18} color="#a855f7" />
                  <span style={{ fontWeight: 600 }}>超级管理员后台</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} color="var(--accent-emerald)" />
          <span>零上载 · 本地安全</span>
        </div>
        <span>v1.2.0</span>
      </div>
    </aside>
  );
};
