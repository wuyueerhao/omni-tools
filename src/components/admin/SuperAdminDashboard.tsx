import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cloud,
  Cpu,
  Image as ImageIcon,
  Users,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Download,
  Upload,
  Trash2,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { SystemConfigService } from '../../services/systemConfigService';
import { AuthService } from '../../services/authService';
import { useToast } from '../common/Toast';
import type { SystemConfig, CloudflareR2Config, SystemAIConfig, ImageStorageConfig, UserManagementPolicy, SecurityPolicyConfig } from '../../types/config';
import type { User, UserAccountCredentials, AuditLog, UserRole } from '../../types/user';

interface SuperAdminDashboardProps {
  onBack: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [config, setConfig] = useState<SystemConfig>(() => SystemConfigService.getConfig());
  const [activeTab, setActiveTab] = useState<'r2' | 'ai' | 'image' | 'users' | 'security'>('r2');

  // R2 state
  const [r2Form, setR2Form] = useState<CloudflareR2Config>(config.r2);
  const [showR2Secret, setShowR2Secret] = useState(false);
  const [r2Testing, setR2Testing] = useState(false);
  const [r2TestResult, setR2TestResult] = useState<{ success: boolean; message: string } | null>(null);

  // AI state
  const [aiForm, setAiForm] = useState<SystemAIConfig>(config.ai);
  const [activeAiProvider, setActiveAiProvider] = useState<'openai' | 'claude' | 'gemini' | 'deepseek'>('openai');
  const [showAiKey, setShowAiKey] = useState<Record<string, boolean>>({});
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Image storage state
  const [imageForm, setImageForm] = useState<ImageStorageConfig>(config.imageStorage);

  // User management state
  const [userPolicyForm, setUserPolicyForm] = useState<UserManagementPolicy>(config.userPolicy);
  const [accounts, setAccounts] = useState<UserAccountCredentials[]>([]);
  const [resetPassUser, setResetPassUser] = useState<UserAccountCredentials | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Security & Logs state
  const [securityForm, setSecurityForm] = useState<SecurityPolicyConfig>(config.security);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // 监听当前用户会话
  useEffect(() => {
    const unsub = AuthService.subscribe((u) => setCurrentUser(u));
    return unsub;
  }, []);

  // 监听配置变更
  useEffect(() => {
    const unsub = SystemConfigService.subscribe((newCfg) => {
      setConfig(newCfg);
      setR2Form(newCfg.r2);
      setAiForm(newCfg.ai);
      setImageForm(newCfg.imageStorage);
      setUserPolicyForm(newCfg.userPolicy);
      setSecurityForm(newCfg.security);
    });
    return unsub;
  }, []);

  // 加载用户和审计数据
  const reloadData = () => {
    setAccounts(AuthService.getAccounts());
    setAuditLogs(AuthService.getAuditLogs());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // 权限严格守卫：非超级管理员直接拦截并显示无权限页面
  const isSuper = AuthService.isSuperAdmin(currentUser);
  if (!isSuper) {
    return (
      <div className="tool-view-wrapper">
        <div
          className="glass-panel"
          style={{
            maxWidth: '560px',
            margin: '60px auto',
            padding: '36px',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            无访问权限 (403 Forbidden)
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            此页面为<b>系统设置独立管理控制中心</b>
            。当前登录账号无权限查看全站配置与敏感参数。请使用超级管理员账号登录后访问。
          </p>
          <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '8px' }}>
            <ArrowLeft size={16} /> 返回工具仪表盘
          </button>
        </div>
      </div>
    );
  }

  // --- Handlers: R2 ---
  const handleSaveR2 = () => {
    SystemConfigService.updateR2(r2Form);
    toast('Cloudflare R2 配置已成功更新并生效', 'success');
    AuthService.addAuditLog('超级管理员更新了 Cloudflare R2 配置', currentUser?.username, 'warning');
  };

  const handleTestR2 = async () => {
    setR2Testing(true);
    setR2TestResult(null);
    try {
      const res = await SystemConfigService.testR2Connection(r2Form);
      setR2TestResult(res);
      if (res.success) {
        toast(res.message, 'success');
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setR2Testing(false);
    }
  };

  // --- Handlers: AI ---
  const handleSaveAI = () => {
    SystemConfigService.updateAI(aiForm);
    toast('常用 AI 模型与 API Key 配置已更新', 'success');
    AuthService.addAuditLog('超级管理员更新了 AI 模型接口配置', currentUser?.username, 'warning');
  };

  const handleTestAI = async (provider: 'openai' | 'claude' | 'gemini' | 'deepseek') => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await SystemConfigService.testAIConnection(provider, aiForm[provider]);
      setAiTestResult(res);
      if (res.success) {
        toast(res.message, 'success');
      } else {
        toast(res.message, 'error');
      }
    } finally {
      setAiTesting(false);
    }
  };

  // --- Handlers: Image Storage ---
  const handleSaveImageStorage = () => {
    SystemConfigService.updateImageStorage(imageForm);
    toast('图片保存与分发策略已更新', 'success');
    AuthService.addAuditLog('超级管理员更新了图片存储分发策略', currentUser?.username, 'warning');
  };

  // --- Handlers: User Management ---
  const handleToggleRegistration = (allowed: boolean) => {
    const updated = { ...userPolicyForm, allowRegistration: allowed };
    setUserPolicyForm(updated);
    SystemConfigService.updateUserPolicy({ allowRegistration: allowed });
    toast(`已${allowed ? '开放' : '暂停'}新用户自助注册`, 'info');
    AuthService.addAuditLog(
      `超级管理员${allowed ? '开启' : '关闭'}了新用户开放注册`,
      currentUser?.username,
      'warning'
    );
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    try {
      AuthService.adminSetUserRole(userId, newRole, currentUser!);
      toast('用户权限角色已更新', 'success');
      reloadData();
    } catch (e: any) {
      toast(e.message || '修改失败', 'error');
    }
  };

  const handleResetPassword = () => {
    if (!resetPassUser || !newPassword.trim()) return;
    try {
      AuthService.adminResetPassword(resetPassUser.id, newPassword.trim(), currentUser!);
      toast(`已重置用户 [${resetPassUser.username}] 的登录密码`, 'success');
      setResetPassUser(null);
      setNewPassword('');
      reloadData();
    } catch (e: any) {
      toast(e.message || '重置失败', 'error');
    }
  };

  const handleDeleteUser = (u: UserAccountCredentials) => {
    if (u.username.toLowerCase() === 'world') {
      toast('不能删除系统初始超级管理员账号 world', 'info');
      return;
    }
    if (window.confirm(`确定要彻底删除用户 [${u.username}] 吗？此操作不可逆。`)) {
      try {
        AuthService.adminDeleteUser(u.id, currentUser!);
        toast(`用户 [${u.username}] 已删除`, 'success');
        reloadData();
      } catch (e: any) {
        toast(e.message || '删除失败', 'error');
      }
    }
  };

  // --- Handlers: Security & Config Export ---
  const handleSaveSecurity = () => {
    SystemConfigService.updateSecurity(securityForm);
    toast('系统安全策略已保存', 'success');
    AuthService.addAuditLog('超级管理员更新了安全策略参数', currentUser?.username, 'warning');
  };

  const handleClearLogs = () => {
    if (window.confirm('确定要清空全部历史审计日志吗？')) {
      AuthService.clearAuditLogs(currentUser!);
      toast('历史审计日志已清空', 'success');
      reloadData();
    }
  };

  const handleExportBackup = (mask: boolean) => {
    SystemConfigService.exportConfig(mask);
    toast(`已导出配置文件 (${mask ? '脱敏模式' : '完整模式'})`, 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const res = SystemConfigService.importConfig(content);
        if (res.success) {
          toast(res.message, 'success');
          reloadData();
        } else {
          toast(res.message, 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="tool-view-wrapper">
      {/* Tool Header - 完全与 Excel工具 / 其它页面标准保持一致 */}
      <div className="tool-view-header">
        <div className="tool-view-title-wrap">
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={onBack}>
            <ArrowLeft size={16} /> 返回仪表盘
          </button>

          <div
            className="tool-view-icon-box"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
            }}
          >
            <Settings size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                系统设置
              </h1>
              <span
                className="badge"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.6875rem',
                }}
              >
                👑 超管专属
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              全站核心配置中心：Cloudflare R2 存储、AI 接口秘钥、图片保存位置、用户分级管理与安全设置
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            当前操作者: <b style={{ color: 'var(--text-primary)' }}>{currentUser?.username}</b>
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.6875rem' }}>
            SuperAdmin
          </span>
        </div>
      </div>

      {/* Tab Navigation Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '6px',
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'r2' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', fontSize: '0.875rem', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('r2')}
        >
          <Cloud size={16} />
          <span>Cloudflare R2 存储</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', fontSize: '0.875rem', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('ai')}
        >
          <Cpu size={16} />
          <span>AI 大模型 API Key</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'image' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', fontSize: '0.875rem', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('image')}
        >
          <ImageIcon size={16} />
          <span>图片保存位置与分发</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', fontSize: '0.875rem', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>用户管理与注册权限</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '8px 16px', fontSize: '0.875rem', gap: '8px', whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={16} />
          <span>安全策略与审计</span>
        </button>
      </div>

      {/* Security notice regarding Git */}
      <div
        style={{
          marginBottom: '20px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
        }}
      >
        <CheckCircle2 size={16} color="var(--accent-emerald)" />
        <span>
          <b>隐私与安全隔离承诺</b>：本页面所配置的账号密码、R2 秘钥与 AI API Key
          仅保存在管理员本机的受保护客户端存储中，<b>绝不提交至公共 Git 仓库</b>。
        </span>
      </div>

      {/* Tab 1: Cloudflare R2 */}
      {activeTab === 'r2' && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={20} color="var(--accent-cyan)" /> Cloudflare R2 对象存储配置
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                配置 Cloudflare R2 S3 兼容凭证，供全站图片、身份资产与数据备份上传
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={r2Form.enabled}
                onChange={(e) => setR2Form({ ...r2Form, enabled: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>启用 R2 存储驱动</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            <div className="input-group">
              <label className="input-label">Cloudflare Account ID (账户 ID)</label>
              <input
                type="text"
                className="input-text"
                placeholder="例如: 143267335d07d63cf5e63a7e45931fca"
                value={r2Form.accountId}
                onChange={(e) => setR2Form({ ...r2Form, accountId: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bucket Name (存储桶名称)</label>
              <input
                type="text"
                className="input-text"
                placeholder="例如: omni-tools-storage"
                value={r2Form.bucketName}
                onChange={(e) => setR2Form({ ...r2Form, bucketName: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">R2 Access Key ID</label>
              <input
                type="text"
                className="input-text"
                placeholder="从 Cloudflare R2 API Tokens 页面获取"
                value={r2Form.accessKeyId}
                onChange={(e) => setR2Form({ ...r2Form, accessKeyId: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>R2 Secret Access Key</span>
                <button
                  type="button"
                  className="copy-btn"
                  style={{ border: 'none', background: 'transparent' }}
                  onClick={() => setShowR2Secret(!showR2Secret)}
                >
                  {showR2Secret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </label>
              <input
                type={showR2Secret ? 'text' : 'password'}
                className="input-text"
                placeholder="密文保存，不在 Git 中留下痕迹"
                value={r2Form.secretAccessKey}
                onChange={(e) => setR2Form({ ...r2Form, secretAccessKey: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '14px' }}>
            <label className="input-label">公开访问域名 / 自定义 CDN 域名 (Public Custom Domain)</label>
            <input
              type="text"
              className="input-text"
              placeholder="例如: https://pub-xxxx.r2.dev 或 https://cdn.vnvnv.com"
              value={r2Form.publicDomain}
              onChange={(e) => setR2Form({ ...r2Form, publicDomain: e.target.value })}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              用于生成可直接公开预览或下载的图片/资源直链
            </span>
          </div>

          {r2TestResult && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: r2TestResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${r2TestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: r2TestResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {r2TestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{r2TestResult.message}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={handleSaveR2} style={{ padding: '8px 20px' }}>
              <Save size={16} /> 保存 R2 配置
            </button>
            <button className="btn btn-secondary" onClick={handleTestR2} disabled={r2Testing} style={{ padding: '8px 20px' }}>
              {r2Testing ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              <span>{r2Testing ? '测试中...' : '测试 R2 连通性'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: AI Providers */}
      {activeTab === 'ai' && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={20} color="var(--accent-primary)" /> 常用 AI 大模型与 API Key
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                配置 OpenAI、Claude、Gemini、DeepSeek 核心模型凭证与代理端点
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>全局默认主模型：</span>
              <select
                className="input-select"
                style={{ width: 'auto', padding: '6px 14px' }}
                value={aiForm.defaultProvider}
                onChange={(e) => setAiForm({ ...aiForm, defaultProvider: e.target.value as any })}
              >
                <option value="openai">OpenAI</option>
                <option value="claude">Anthropic Claude</option>
                <option value="gemini">Google Gemini</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
          </div>

          {/* AI Sub-tab navigation */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'openai', name: 'OpenAI (GPT-4o)', color: '#10a37f' },
              { id: 'claude', name: 'Anthropic Claude', color: '#d97706' },
              { id: 'gemini', name: 'Google Gemini', color: '#4285F4' },
              { id: 'deepseek', name: 'DeepSeek', color: '#4f46e5' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn ${activeAiProvider === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 16px', fontSize: '0.8125rem', gap: '8px' }}
                onClick={() => {
                  setActiveAiProvider(p.id as any);
                  setAiTestResult(null);
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                <span>{p.name}</span>
                {aiForm[p.id as keyof SystemAIConfig] && (aiForm[p.id as keyof SystemAIConfig] as any).enabled && (
                  <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                    已启用
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Current AI Form */}
          {(() => {
            const currentAi = aiForm[activeAiProvider];
            const isKeyVisible = showAiKey[activeAiProvider] || false;

            return (
              <div
                style={{
                  padding: '24px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {activeAiProvider.toUpperCase()} 专属配置参数
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={currentAi.enabled}
                      onChange={(e) =>
                        setAiForm({
                          ...aiForm,
                          [activeAiProvider]: { ...currentAi, enabled: e.target.checked },
                        })
                      }
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>启用此模型通道</span>
                  </label>
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>API Key (接口密钥)</span>
                    <button
                      type="button"
                      className="copy-btn"
                      style={{ border: 'none', background: 'transparent' }}
                      onClick={() =>
                        setShowAiKey({ ...showAiKey, [activeAiProvider]: !isKeyVisible })
                      }
                    >
                      {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </label>
                  <input
                    type={isKeyVisible ? 'text' : 'password'}
                    className="input-text"
                    style={{ fontFamily: 'var(--font-mono)' }}
                    placeholder={`输入 ${activeAiProvider.toUpperCase()} API Key (如 sk-...)`}
                    value={currentAi.apiKey}
                    onChange={(e) =>
                      setAiForm({
                        ...aiForm,
                        [activeAiProvider]: { ...currentAi, apiKey: e.target.value },
                      })
                    }
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">Base URL (API 端点 / 代理地址)</label>
                    <input
                      type="text"
                      className="input-text"
                      value={currentAi.baseUrl}
                      onChange={(e) =>
                        setAiForm({
                          ...aiForm,
                          [activeAiProvider]: { ...currentAi, baseUrl: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label">默认调用模型 (Model Name)</label>
                    <input
                      type="text"
                      className="input-text"
                      value={currentAi.model}
                      onChange={(e) =>
                        setAiForm({
                          ...aiForm,
                          [activeAiProvider]: { ...currentAi, model: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {aiTestResult && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: aiTestResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${aiTestResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: aiTestResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {aiTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{aiTestResult.message}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button className="btn btn-primary" onClick={handleSaveAI} style={{ padding: '8px 20px' }}>
                    <Save size={16} /> 保存当前 AI 设置
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleTestAI(activeAiProvider)}
                    disabled={aiTesting}
                    style={{ padding: '8px 20px' }}
                  >
                    {aiTesting ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
                    <span>{aiTesting ? '测试中...' : `测试 ${activeAiProvider.toUpperCase()} 连通性`}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 3: Image Storage */}
      {activeTab === 'image' && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="var(--accent-emerald)" /> 图片保存位置与分发策略
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              设定全站图片处理工坊导出的保存目标：浏览器本地沙箱、Cloudflare R2 对象存储或自建图床
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">主存储驱动 (Storage Driver)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {[
                {
                  id: 'local_browser',
                  title: '浏览器本地存储',
                  desc: '零成本免配置，通过 IndexedDB / 本地沙箱持久化，保证绝对私密',
                },
                {
                  id: 'cloudflare_r2',
                  title: 'Cloudflare R2 对象存储',
                  desc: '全球高速 CDN 直链分发，持久无限制存储（需在 R2 选项卡配好凭证）',
                },
                {
                  id: 'custom_api',
                  title: '自定义图床 API / Webhook',
                  desc: '对接已有自建图床服务（如 EasyImage, Lsky, Chevereto 等）',
                },
              ].map((driver) => (
                <div
                  key={driver.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${imageForm.driver === driver.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: imageForm.driver === driver.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setImageForm({ ...imageForm, driver: driver.id as any })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{driver.title}</span>
                    <input
                      type="radio"
                      checked={imageForm.driver === driver.id}
                      onChange={() => setImageForm({ ...imageForm, driver: driver.id as any })}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {driver.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginTop: '18px' }}>
            <div className="input-group">
              <label className="input-label">存储路径前缀规则</label>
              <input
                type="text"
                className="input-text"
                placeholder="例如: uploads/{year}/{month}/"
                value={imageForm.pathPrefix}
                onChange={(e) => setImageForm({ ...imageForm, pathPrefix: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                支持通配符: &#123;year&#125;, &#123;month&#125;, &#123;day&#125;
              </span>
            </div>

            <div className="input-group">
              <label className="input-label">允许单张最大体积限制 (MB)</label>
              <input
                type="number"
                className="input-text"
                min="1"
                max="100"
                value={Math.round(imageForm.maxSizeBytes / (1024 * 1024))}
                onChange={(e) =>
                  setImageForm({ ...imageForm, maxSizeBytes: (parseInt(e.target.value, 10) || 10) * 1024 * 1024 })
                }
              />
            </div>
          </div>

          {imageForm.driver === 'custom_api' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginTop: '12px' }}>
              <div className="input-group">
                <label className="input-label">图床上传 API URL (POST)</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="https://img.example.com/api/v1/upload"
                  value={imageForm.customUploadUrl || ''}
                  onChange={(e) => setImageForm({ ...imageForm, customUploadUrl: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">认证 Authorization Header (可选)</label>
                <input
                  type="password"
                  className="input-text"
                  placeholder="Bearer token..."
                  value={imageForm.customAuthHeader || ''}
                  onChange={(e) => setImageForm({ ...imageForm, customAuthHeader: e.target.value })}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={imageForm.autoWebp}
                onChange={(e) => setImageForm({ ...imageForm, autoWebp: e.target.checked })}
              />
              <span style={{ fontSize: '0.875rem' }}>图片上传前自动转为现代化高压缩 WebP 格式</span>
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleSaveImageStorage} style={{ marginTop: '24px', padding: '8px 20px' }}>
            <Save size={16} /> 保存图片存储策略
          </button>
        </div>
      )}

      {/* Tab 4: Users Management & Registration Control */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          {/* Registration Control Banner */}
          <div
            style={{
              padding: '18px 22px',
              borderRadius: 'var(--radius-md)',
              background: userPolicyForm.allowRegistration ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${userPolicyForm.allowRegistration ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '26px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9375rem' }}>
                <Users size={18} />
                <span>开放用户注册总开关</span>
                {userPolicyForm.allowRegistration ? (
                  <span className="badge badge-emerald">已开放自主注册</span>
                ) : (
                  <span className="badge badge-rose">已暂停新注册</span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                {userPolicyForm.allowRegistration
                  ? '允许访客在登录弹窗自主注册新账号，注册后自动具备多端云同步特权。'
                  : '已限制新用户自主注册。未注册访客仅可使用工具，不能创建新账号。'}
              </p>
            </div>

            <button
              className={`btn ${userPolicyForm.allowRegistration ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
              onClick={() => handleToggleRegistration(!userPolicyForm.allowRegistration)}
            >
              {userPolicyForm.allowRegistration ? '点击关闭注册' : '点击开启注册'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>全站用户列表与分级权限管理 ({accounts.length} 人)</h3>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={reloadData}>
              <RefreshCw size={14} /> 刷新用户列表
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 10px' }}>用户</th>
                  <th style={{ padding: '12px 10px' }}>邮箱</th>
                  <th style={{ padding: '12px 10px' }}>当前角色与权限</th>
                  <th style={{ padding: '12px 10px' }}>注册方式</th>
                  <th style={{ padding: '12px 10px' }}>注册时间</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((u) => {
                  const isWorld = u.username.toLowerCase() === 'world';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                            alt={u.username}
                            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</div>
                            {isWorld && (
                              <span style={{ fontSize: '0.625rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                初始超级管理员
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{u.email}</td>

                      <td style={{ padding: '12px 10px' }}>
                        {isWorld ? (
                          <span className="badge badge-primary" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            👑 超级管理员 (锁定)
                          </span>
                        ) : (
                          <select
                            className="input-select"
                            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          >
                            <option value="user">普通用户 (VIP)</option>
                            <option value="admin">管理员 (Admin)</option>
                            <option value="super_admin">超级管理员 (SuperAdmin)</option>
                          </select>
                        )}
                      </td>

                      <td style={{ padding: '12px 10px' }}>
                        <span className="badge badge-secondary" style={{ textTransform: 'uppercase' }}>
                          {u.provider}
                        </span>
                      </td>

                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{u.createdAt}</td>

                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            className="copy-btn"
                            title="重置用户密码"
                            onClick={() => {
                              setResetPassUser(u);
                              setNewPassword('');
                            }}
                          >
                            <KeyRound size={14} />
                          </button>

                          {!isWorld && (
                            <button
                              className="copy-btn"
                              title="删除用户"
                              style={{ color: 'var(--accent-rose)' }}
                              onClick={() => handleDeleteUser(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Reset password inline modal */}
          {resetPassUser && (
            <div
              style={{
                marginTop: '18px',
                padding: '18px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <KeyRound size={20} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  重置用户 [{resetPassUser.username}] 的登录密码：
                </span>
                <input
                  type="text"
                  className="input-text"
                  placeholder="输入新密码 (至少 4 位)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleResetPassword} style={{ alignSelf: 'flex-end' }}>
                确认重置
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setResetPassUser(null)}
                style={{ alignSelf: 'flex-end' }}
              >
                取消
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Security & Audit */}
      {activeTab === 'security' && (
        <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} color="var(--accent-rose)" /> 安全策略与审计日志
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              防暴力破解防护、审计追踪记录与配置安全备份导出
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <div className="input-group">
              <label className="input-label">登录失败锁定上限 (次)</label>
              <input
                type="number"
                className="input-text"
                min="3"
                max="20"
                value={securityForm.maxLoginAttempts}
                onChange={(e) =>
                  setSecurityForm({ ...securityForm, maxLoginAttempts: parseInt(e.target.value, 10) || 5 })
                }
              />
            </div>

            <div className="input-group">
              <label className="input-label">锁定限制时长 (分钟)</label>
              <input
                type="number"
                className="input-text"
                min="5"
                max="1440"
                value={securityForm.lockoutDurationMinutes}
                onChange={(e) =>
                  setSecurityForm({ ...securityForm, lockoutDurationMinutes: parseInt(e.target.value, 10) || 15 })
                }
              />
            </div>

            <div className="input-group">
              <label className="input-label">会话有效保留期 (天)</label>
              <input
                type="number"
                className="input-text"
                min="1"
                max="90"
                value={securityForm.sessionDurationDays}
                onChange={(e) =>
                  setSecurityForm({ ...securityForm, sessionDurationDays: parseInt(e.target.value, 10) || 30 })
                }
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveSecurity} style={{ marginTop: '10px', padding: '8px 20px' }}>
            <Save size={16} /> 保存安全策略
          </button>

          {/* Backup & Restore */}
          <div
            style={{
              marginTop: '28px',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>系统配置备份与迁移</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => handleExportBackup(true)}>
                <Download size={14} /> 导出脱敏配置文件 (安全无秘钥)
              </button>
              <button className="btn btn-secondary" onClick={() => handleExportBackup(false)}>
                <Download size={14} /> 导出完整配置文件 (含秘钥备份)
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> 导入恢复配置文件
                <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Audit Logs */}
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>全站操作审计日志 (最近 {auditLogs.length} 条)</h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                onClick={handleClearLogs}
              >
                <Trash2 size={14} /> 清空审计日志
              </button>
            </div>

            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              {auditLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>暂无审计日志</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>@{log.username}</span>
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>{log.action}</span>
                    <span
                      style={{
                        color:
                          log.status === 'success'
                            ? 'var(--accent-emerald)'
                            : log.status === 'warning'
                            ? '#f59e0b'
                            : 'var(--accent-rose)',
                      }}
                    >
                      ● {log.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
