import React from 'react';
import type { ToolDefinition } from '../../types';
import { DynamicIcon } from '../common/DynamicIcon';
import { ArrowRight } from 'lucide-react';

interface ToolCardProps {
  tool: ToolDefinition;
  onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <div className="tool-card" onClick={onClick}>
      <div className="tool-card-header">
        <div className="tool-card-icon">
          <DynamicIcon name={tool.iconName} size={22} />
        </div>
        {tool.badge && <span className="badge badge-primary">{tool.badge}</span>}
      </div>

      <div className="tool-card-title">{tool.name}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
        {tool.nameEn}
      </div>
      <div className="tool-card-desc">{tool.description}</div>

      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8125rem',
          color: 'var(--accent-primary)',
          fontWeight: 600,
        }}
      >
        <span>立即启动</span>
        <ArrowRight size={14} />
      </div>
    </div>
  );
};
