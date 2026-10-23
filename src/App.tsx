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
import { TempMailTool } from './tools/mail/TempMailTool';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { AuthService } from './services/authService';

const SESSION_TOOL_KEY = 'omni_session_active_tool_v1';
const SESSION_CATEGORY_KEY = 'omni_session_category_v1';
const SESSION_HARD_RESET_KEY = 'omni_session_hard_reset_v1';
const SESSION_LINKED_EMAIL_KEY = 'omni_session_linked_email_v1';

// 计算初始化菜单位置：刷新时保留上次位置；重新打开或强制刷新时回到默认控制台
const getInitialNavState = (): {
  toolId: string | null;
  category: ToolCategory | 'all';
  linkedEmail?: string;
} => {
  try {
    // 1. 检查是否有强制刷新重置标记 (由 Cmd+Shift+R / Ctrl+Shift+R / Shift+F5 / Shift+点击刷新 触发)
    if (sessionStorage.getItem(SESSION_HARD_RESET_KEY) === 'true') {
      sessionStorage.removeItem(SESSION_HARD_RESET_KEY);
      sessionStorage.removeItem(SESSION_TOOL_KEY);
      sessionStorage.removeItem(SESSION_CATEGORY_KEY);
      sessionStorage.removeItem(SESSION_LINKED_EMAIL_KEY);
      return { toolId: null, category: 'all' };
    }

    // 2. 读取当前页面 Session 中记录的工具与分类
    // 重新打开（新标签页、关闭后重新打开）时，sessionStorage 为空，自然回到默认首页控制台；
    // 正常刷新时，sessionStorage 会保留上一次使用的菜单工具，自动恢复至该工具。
    const savedTool = sessionStorage.getItem(SESSION_TOOL_KEY);
    const savedCategory = sessionStorage.getItem(SESSION_CATEGORY_KEY) as (ToolCategory | 'all') | null;
    const savedEmail = sessionStorage.getItem(SESSION_LINKED_EMAIL_KEY) || undefined;

    let validToolId: string | null = null;
    if (savedTool === 'super-admin-panel') {
      validToolId = AuthService.isSuperAdmin() ? 'super-admin-panel' : null;
    } else if (savedTool && TOOLS.some((t) => t.id === savedTool)) {
      validToolId = savedTool;
    }

    const validCategory: ToolCategory | 'all' =
      savedCategory && (savedCategory === 'all' || CATEGORIES.some((c) => c.id === savedCategory))
        ? savedCategory
        : 'all';

    return {
      toolId: validToolId,
      category: validCategory,
      linkedEmail: savedEmail,
    };
  } catch {
    return { toolId: null, category: 'all' };
  }
};

export const AppContent: React.FC = () => {
  const [initialNav] = useState(() => getInitialNavState());
  const [currentToolId, setCurrentToolId] = useState<string | null>(initialNav.toolId);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>(initialNav.category);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState<string | undefined>(initialNav.linkedEmail);

  // 监听键盘强制刷新快捷键 (Ctrl+F5, Shift+F5, Ctrl+Shift+R, Cmd+Shift+R)
  // 以及监听 Shift 键状态（应对 Shift + 点击浏览器刷新按钮）
  useEffect(() => {
    let isShiftHeld = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftHeld = true;
      }

      // 全局搜索快捷键: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }

      // 检测强制刷新按键组合
      const isR = e.key === 'r' || e.key === 'R';
      const isF5 = e.key === 'F5' || e.keyCode === 116;
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && isR) ||
        (e.shiftKey && isF5) ||
        (e.ctrlKey && isF5)
      ) {
        try {
          sessionStorage.setItem(SESSION_HARD_RESET_KEY, 'true');
          sessionStorage.removeItem(SESSION_TOOL_KEY);
          sessionStorage.removeItem(SESSION_CATEGORY_KEY);
          sessionStorage.removeItem(SESSION_LINKED_EMAIL_KEY);
        } catch {}
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftHeld = false;
      }
    };

    const handleBeforeUnload = () => {
      if (isShiftHeld) {
        try {
          sessionStorage.setItem(SESSION_HARD_RESET_KEY, 'true');
          sessionStorage.removeItem(SESSION_TOOL_KEY);
          sessionStorage.removeItem(SESSION_CATEGORY_KEY);
          sessionStorage.removeItem(SESSION_LINKED_EMAIL_KEY);
        } catch {}
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSelectTool = (id: string | null) => {
    setCurrentToolId(id);
    try {
      if (id) {
        sessionStorage.setItem(SESSION_TOOL_KEY, id);
      } else {
        sessionStorage.removeItem(SESSION_TOOL_KEY);
        sessionStorage.removeItem(SESSION_LINKED_EMAIL_KEY);
      }
    } catch {}
  };

  const handleSelectCategory = (cat: ToolCategory | 'all') => {
    setSelectedCategory(cat);
    handleSelectTool(null);
    try {
      sessionStorage.setItem(SESSION_CATEGORY_KEY, cat);
    } catch {}
  };

  const activeTool = TOOLS.find((t) => t.id === currentToolId);

  const filteredTools = TOOLS.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  const handleNavigateToMail = (email: string) => {
    setLinkedEmail(email);
    handleSelectTool('temp-mail');
    try {
      if (email) {
        sessionStorage.setItem(SESSION_LINKED_EMAIL_KEY, email);
      }
    } catch {}
  };

  const renderActiveToolView = (tool: ToolDefinition) => {
    switch (tool.id) {
      case '2fa-authenticator':
        return <TotpTool />;
      case 'password-generator':
        return <PasswordTool />;
      case 'username-generator':
        return <UsernameTool />;
      case 'identity-generator':
        return <IdentityTool onNavigateToTempMail={handleNavigateToMail} />;
      case 'temp-mail':
        return <TempMailTool initialEmail={linkedEmail} />;
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
        onSelectCategory={handleSelectCategory}
        onSelectTool={handleSelectTool}
      />

      <div className="app-main">
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onNavigateToSuperAdmin={() => handleSelectTool('super-admin-panel')}
        />

        <main className="app-content">
          {currentToolId === 'super-admin-panel' ? (
            <SuperAdminDashboard onBack={() => handleSelectTool(null)} />
          ) : activeTool ? (
            /* Active Tool View */
            <div className="tool-view-wrapper">
              <div className="tool-view-header">
                <div className="tool-view-title-wrap">
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px' }}
                    onClick={() => handleSelectTool(null)}
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
                  onClick={() => handleSelectCategory('all')}
                >
                  全部工具 ({TOOLS.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSelectCategory(cat.id)}
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
                    onClick={() => handleSelectTool(tool.id)}
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
          handleSelectTool(id);
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
