import React, { useState, useEffect } from 'react';
import { CATEGORIES, TOOLS } from './config/tools';
import type { ToolCategory, ToolDefinition } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToolCard } from './components/layout/ToolCard';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastProvider } from './components/common/Toast';
import { DynamicIcon } from './components/common/DynamicIcon';
import { ArrowLeft, Shield, Cpu, Zap } from 'lucide-react';

// Tool Components
import { TotpTool } from './tools/totp/TotpTool';
import { PasswordTool } from './tools/password/PasswordTool';
import { UsernameTool } from './tools/username/UsernameTool';
import { IdentityTool } from './tools/identity/IdentityTool';
import { PdfTool } from './tools/pdf/PdfTool';
import { ImageTool } from './tools/image/ImageTool';
import { ExcelTool } from './tools/excel/ExcelTool';

export const AppContent: React.FC = () => {
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeTool = TOOLS.find((t) => t.id === currentToolId);

  const filteredTools = TOOLS.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const renderActiveToolView = (tool: ToolDefinition) => {
    switch (tool.id) {
      case '2fa-authenticator':
        return <TotpTool />;
      case 'password-generator':
        return <PasswordTool />;
      case 'username-generator':
        return <UsernameTool />;
      case 'identity-generator':
        return <IdentityTool />;
      case 'pdf-toolkit':
        return <PdfTool />;
      case 'image-processor':
        return <ImageTool />;
      case 'excel-studio':
        return <ExcelTool />;
      default:
        return <div>工具建设中...</div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentToolId={currentToolId}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setCurrentToolId(null);
        }}
        onSelectTool={(id) => setCurrentToolId(id)}
      />

      <div className="app-main">
        <Header onOpenSearch={() => setIsSearchOpen(true)} />

        <main className="app-content">
          {activeTool ? (
            /* Active Tool View */
            <div className="tool-view-wrapper">
              <div className="tool-view-header">
                <div className="tool-view-title-wrap">
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px' }}
                    onClick={() => setCurrentToolId(null)}
                  >
                    <ArrowLeft size={16} /> 返回仪表盘
                  </button>

                  <div className="tool-view-icon-box">
                    <DynamicIcon name={activeTool.iconName} size={24} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {activeTool.name}
                      </h1>
                      {activeTool.badge && <span className="badge badge-primary">{activeTool.badge}</span>}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {activeTool.description}
                    </div>
                  </div>
                </div>
              </div>

              {renderActiveToolView(activeTool)}
            </div>
          ) : (
            /* Dashboard / Tools Overview */
            <>
              {/* Hero Banner */}
              <div className="hero-banner">
                <h1 className="hero-title">OmniTools 极客全能离线工具箱</h1>
                <p className="hero-desc">
                  专为个人极客、开发者及高效办公打造的开箱即用工具集。所有操作（2FA 计算、密码生成、虚拟身份测试、PDF/图片/Excel处理）均在浏览器本地内存运行，绝不上传云端，保障个人绝对隐私与毫秒级速度。
                </p>

                <div className="hero-features">
                  <div className="hero-feat-item">
                    <Shield size={16} color="var(--accent-emerald)" />
                    <span>Zero-Upload 零数据上传</span>
                  </div>
                  <div className="hero-feat-item">
                    <Cpu size={16} color="var(--accent-cyan)" />
                    <span>纯浏览器端硬件加速</span>
                  </div>
                  <div className="hero-feat-item">
                    <Zap size={16} color="var(--accent-amber)" />
                    <span>Cloudflare CDN 全球极速托管</span>
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  全部工具 ({TOOLS.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <DynamicIcon name={cat.iconName} size={15} />
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Tools Grid */}
              <div className="tools-grid">
                {filteredTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onClick={() => setCurrentToolId(tool.id)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={(id) => {
          setCurrentToolId(id);
          setIsSearchOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
