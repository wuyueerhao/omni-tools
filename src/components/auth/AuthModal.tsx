import React, { useState } from 'react';
import { X, Lock, User as UserIcon, Mail, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { SystemConfigService } from '../../services/systemConfigService';
import { useToast } from '../common/Toast';
import type { AuthProvider } from '../../types/user';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast('请输入用户名/邮箱与密码', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const user = await AuthService.login(identifier, password);
      toast(`欢迎回来，${user.username}！已解锁云同步与专属特权`, 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast(err.message || '登录失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast('请填写完整注册信息', 'info');
      return;
    }
    setIsLoading(true);
    try {
      const user = await AuthService.register(username, email, password);
      toast(`注册成功！已自动登录为 ${user.username}`, 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast(err.message || '注册失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const handleOAuthLogin = async (provider: AuthProvider) => {
    setIsLoading(true);
    try {
      const user = await AuthService.oauthLogin(provider);
      toast(`已通过 ${provider.toUpperCase()} 快捷授权登录: ${user.username}`, 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast(err.message || '快捷登录失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          padding: '28px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>OmniTools 用户中心</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                默认不登录即可使用所有工具；登录解锁云同步与特权
              </p>
            </div>
          </div>
          <button className="copy-btn" onClick={onClose} title="关闭">
            <X size={16} />
          </button>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-tertiary)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            className={`btn ${tab === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
            onClick={() => setTab('login')}
          >
            账号登录
          </button>
          <button
            type="button"
            className={`btn ${tab === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '0.875rem' }}
            onClick={() => setTab('register')}
          >
            新用户注册
          </button>
        </div>

        {/* Form Body */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={14} /> 用户名 或 邮箱
              </label>
              <input
                id="auth-login-identifier"
                type="text"
                className="input-text"
                placeholder="请输入用户名或注册邮箱"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> 密码
              </label>
              <input
                id="auth-login-password"
                type="password"
                className="input-text"
                placeholder="请输入登录密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button id="auth-login-submit" type="submit" className="btn btn-primary" style={{ marginTop: '6px' }} disabled={isLoading}>
              {isLoading ? '验证登录中...' : '立即登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserIcon size={14} /> 用户名
              </label>
              <input
                type="text"
                className="input-text"
                placeholder="2-20 个字符"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> 电子邮箱
              </label>
              <input
                type="email"
                className="input-text"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> 设置密码
              </label>
              <input
                type="password"
                className="input-text"
                placeholder="至少 4 位密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!SystemConfigService.isRegistrationAllowed() && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.75rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>系统已暂停新用户开放注册，请联系管理员</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '6px' }}
              disabled={isLoading || !SystemConfigService.isRegistrationAllowed()}
            >
              {isLoading ? '注册中...' : '注册并自动登录'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ position: 'relative', textAlign: 'center', margin: '4px 0' }}>
          <div style={{ height: '1px', background: 'var(--border-color)', width: '100%' }} />
          <span
            style={{
              position: 'relative',
              top: '-10px',
              padding: '0 12px',
              background: 'var(--bg-elevated)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            第三方快捷登录
          </span>
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {/* Google */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 10px', fontSize: '0.8125rem', gap: '6px' }}
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            title="使用 Google 账号登录"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 10px', fontSize: '0.8125rem', gap: '6px' }}
            onClick={() => handleOAuthLogin('facebook')}
            disabled={isLoading}
            title="使用 Facebook 账号登录"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>

          {/* GitHub */}
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '8px 10px', fontSize: '0.8125rem', gap: '6px' }}
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            title="使用 GitHub 账号登录"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        {/* Feature Benefits Banner */}
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> 登录后独享差异化特权：
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <span>✓ 2FA 令牌多端云同步</span>
            <span>✓ 虚拟身份一键收藏夹</span>
            <span>✓ 极客密码专属保险箱</span>
            <span>✓ 专属独立个人中心</span>
          </div>
        </div>
      </div>
    </div>
  );
};
