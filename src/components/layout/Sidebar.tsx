import React from 'react';
import { CATEGORIES, TOOLS } from '../../config/tools';
import type { ToolCategory } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { LayoutGrid, Wrench, Shield } from 'lucide-react';

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
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} color="var(--accent-emerald)" />
          <span>零上载 · 本地安全</span>
        </div>
        <span>v1.0.0</span>
      </div>
    </aside>
  );
};
