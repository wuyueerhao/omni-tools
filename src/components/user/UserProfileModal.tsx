import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Lock,
  Cloud,
  RefreshCw,
  Star,
  ShieldCheck,
  Download,
  Trash2,
  Copy,
  Check,
  Save,
  Link2,
  Unlink,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { CloudSyncService } from '../../services/cloudSyncService';
import { useToast } from '../common/Toast';
import type { User } from '../../types/user';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubTab?: 'profile' | 'sync' | 'favorites' | 'vault';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  defaultSubTab = 'profile',
}) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [subTab, setSubTab] = useState<'profile' | 'sync' | 'favorites' | 'vault'>(defaultSubTab);

  // Edit Profile Form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync & Storage State
  const [isSyncing, setIsSyncing] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [vault, setVault] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLocalData = () => {
    const cur = AuthService.getCurrentUser();
    setUser(cur);
    if (cur) {
      setUsername(cur.username);
      setEmail(cur.email);
      setAvatar(cur.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cur.username}`);
    }
    setFavorites(CloudSyncService.getFavoriteIdentities());
    setVault(CloudSyncService.getPasswordVault());
  };

  useEffect(() => {
    if (isOpen) {
      loadLocalData();
      setSubTab(defaultSubTab);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, defaultSubTab]);

  if (!isOpen || !user) return null;

  // 保存个人资料
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      toast('用户名和邮箱不能为空', 'info');
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await AuthService.updateUserProfile(user.id, {
        username: username.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      });
      setUser(updated);
      toast('个人资料修改成功！', 'success');
    } catch (err: any) {
      toast(err.message || '修改失败', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast('请输入当前原密码', 'info');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      toast('新密码长度至少需要 4 位字符', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('两次输入的新密码不一致', 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      await AuthService.changePassword(user.id, oldPassword, newPassword);
      toast('密码修改成功，请妥善保管新密码！', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err.message || '密码修改失败', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // 绑定 / 解绑社媒账号
  const handleToggleSocial = async (provider: 'google' | 'facebook' | 'github') => {
    try {
      const isBound = Boolean(user.socialBindings?.[provider]);
      if (isBound) {
        if (!window.confirm(`确定要解除与 ${provider.toUpperCase()} 账号的关联吗？`)) {
          return;
        }
      }
      const updated = await AuthService.toggleSocialBinding(user.id, provider);
      setUser(updated);
      toast(
        isBound ? `已解除 ${provider.toUpperCase()} 关联` : `成功授权绑定 ${provider.toUpperCase()} 账号！`,
        'success'
      );
    } catch (err: any) {
      toast(err.message || '操作失败', 'error');
    }
  };

  // 随机更换头像种子
  const handleRandomizeAvatar = () => {
    const seeds = ['neo', 'cyber', 'alex', 'luna', 'pixel', 'robot', 'matrix', 'phoenix', 'atlas', 'blaze'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 100);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=6366f1`);
  };

  // 云同步
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await CloudSyncService.syncNow();
      toast(`云同步成功！2FA(${res.stats.totp}) 身份(${res.stats.identities}) 密码(${res.stats.passwords})`, 'success');
      loadLocalData();
    } catch (err: any) {
      toast(err.message || '云同步失败', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveFavorite = (id: string) => {
    CloudSyncService.removeFavoriteIdentity(id);
    setFavorites(CloudSyncService.getFavoriteIdentities());
    toast('已从收藏夹移除该身份', 'success');
  };

  const handleRemoveVault = (id: string) => {
    CloudSyncService.removePasswordFromVault(id);
    setVault(CloudSyncService.getPasswordVault());
    toast('已从保险箱移除该密码', 'success');
  };

  const copyText = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    toast('已复制到剪贴板', 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isSuper = AuthService.isSuperAdmin(user);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={user.avatar || avatar}
              alt={user.username}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: isSuper ? '2px solid #a855f7' : '2px solid var(--accent-primary)',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.username}</h3>
                {isSuper ? (
                  <span
                    className="badge"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      color: '#fff',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                    }}
                  >
                    👑 超级管理员
                  </span>
                ) : user.role === 'admin' ? (
                  <span className="badge badge-emerald" style={{ fontSize: '0.6875rem' }}>
                    🛡️ 管理员
                  </span>
                ) : (
                  <span className="badge badge-cyan" style={{ fontSize: '0.6875rem' }}>
                    💎 VIP 认证用户
                  </span>
                )}
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  注册渠道: {user.provider.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user.email} · 注册于 {user.createdAt}
              </p>
            </div>
          </div>
          <button className="copy-btn" onClick={onClose} title="关闭">
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
            marginBottom: '16px',
            overflowX: 'auto',
          }}
        >
          <button
            className={`btn ${subTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setSubTab('profile')}
          >
            <UserIcon size={15} /> 个人中心 / 账号设置
          </button>
          <button
            className={`btn ${subTab === 'sync' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setSubTab('sync')}
          >
            <Cloud size={15} /> 多端数据云同步
          </button>
          <button
            className={`btn ${subTab === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setSubTab('favorites')}
          >
            <Star size={15} /> 虚拟身份收藏夹 ({favorites.length})
          </button>
          <button
            className={`btn ${subTab === 'vault' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setSubTab('vault')}
          >
            <ShieldCheck size={15} /> 密码保险箱 ({vault.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* Tab 1: Profile Center */}
          {subTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Section 1: Basic Profile Info */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserIcon size={16} color="var(--accent-primary)" /> 基本信息修改
                </h4>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">用户名</label>
                      <input
                        type="text"
                        className="input-text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="请输入用户名"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">电子邮箱</label>
                      <input
                        type="email"
                        className="input-text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入注册邮箱"
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>头像图片地址 (支持 DiceBear 矢量机器人或自定义 URL)</span>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '2px 8px', color: 'var(--accent-primary)' }}
                        onClick={handleRandomizeAvatar}
                      >
                        <Sparkles size={12} /> 随机换个形象
                      </button>
                    </label>
                    <input
                      type="text"
                      className="input-text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSavingProfile} style={{ padding: '6px 18px', fontSize: '0.8125rem' }}>
                      <Save size={14} /> {isSavingProfile ? '保存中...' : '保存个人资料'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Section 2: Change Password */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={16} color="var(--accent-cyan)" /> 修改登录密码
                </h4>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">原密码</label>
                      <input
                        type="password"
                        className="input-text"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="当前登录密码"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">新密码</label>
                      <input
                        type="password"
                        className="input-text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="至少 4 位新密码"
                      />
                    </div>

                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">确认新密码</label>
                      <input
                        type="password"
                        className="input-text"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入新密码"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSavingPassword || !newPassword || !oldPassword}
                      style={{ padding: '6px 18px', fontSize: '0.8125rem' }}
                    >
                      <Lock size={14} /> {isSavingPassword ? '修改中...' : '确认更新密码'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Section 3: Social Account Bindings */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link2 size={16} color="var(--accent-emerald)" /> 绑定第三方社交账号
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    绑定后可直接使用对应平台一键授权快捷免密登录
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {/* Google */}
                  {(() => {
                    const isBound = Boolean(user.socialBindings?.google);
                    return (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)',
                          border: `1px solid ${isBound ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z" />
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.15z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Google 账号</div>
                            <div style={{ fontSize: '0.6875rem', color: isBound ? 'var(--accent-emerald)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {isBound ? user.socialBindings?.google : '尚未绑定'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`btn ${isBound ? 'btn-ghost' : 'btn-secondary'}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            color: isBound ? 'var(--accent-rose)' : 'var(--text-primary)',
                          }}
                          onClick={() => handleToggleSocial('google')}
                        >
                          {isBound ? <Unlink size={12} /> : <Link2 size={12} />}
                          <span>{isBound ? '解除绑定' : '立即绑定'}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Facebook */}
                  {(() => {
                    const isBound = Boolean(user.socialBindings?.facebook);
                    return (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)',
                          border: `1px solid ${isBound ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Facebook</div>
                            <div style={{ fontSize: '0.6875rem', color: isBound ? 'var(--accent-emerald)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {isBound ? user.socialBindings?.facebook : '尚未绑定'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`btn ${isBound ? 'btn-ghost' : 'btn-secondary'}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            color: isBound ? 'var(--accent-rose)' : 'var(--text-primary)',
                          }}
                          onClick={() => handleToggleSocial('facebook')}
                        >
                          {isBound ? <Unlink size={12} /> : <Link2 size={12} />}
                          <span>{isBound ? '解除绑定' : '立即绑定'}</span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* GitHub */}
                  {(() => {
                    const isBound = Boolean(user.socialBindings?.github);
                    return (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-elevated)',
                          border: `1px solid ${isBound ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>GitHub</div>
                            <div style={{ fontSize: '0.6875rem', color: isBound ? 'var(--accent-emerald)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {isBound ? user.socialBindings?.github : '尚未绑定'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`btn ${isBound ? 'btn-ghost' : 'btn-secondary'}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            color: isBound ? 'var(--accent-rose)' : 'var(--text-primary)',
                          }}
                          onClick={() => handleToggleSocial('github')}
                        >
                          {isBound ? <Unlink size={12} /> : <Link2 size={12} />}
                          <span>{isBound ? '解除绑定' : '立即绑定'}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Cloud Sync */}
          {subTab === 'sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cloud size={18} /> 专属云同步通道就绪
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    登录状态下，您的 2FA 动态令牌、收藏身份、密码库与个性化设置将加密同步至个人云存储。
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    上次同步时间: {user.syncedAt || '尚未同步'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" onClick={handleSyncNow} disabled={isSyncing}>
                    <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
                    {isSyncing ? '正在同步...' : '立即双向同步'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => CloudSyncService.exportBackupFile()}>
                    <Download size={15} /> 导出本地备份
                  </button>
                </div>
              </div>

              {/* Status matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2FA 动态令牌备份</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    已接入云端加密
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>收藏身份归档库</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {favorites.length} 个
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '14px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>密码保险箱条目</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {vault.length} 条
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Favorites */}
          {subTab === 'favorites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {favorites.length === 0 ? (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  暂未收藏任何虚拟身份。在【虚拟身份生成】页面点击卡片右上角「⭐ 收藏该身份」即可沉淀到此处。
                </div>
              ) : (
                favorites.map((fav) => {
                  const idn = fav.identity;
                  return (
                    <div
                      key={fav.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-emerald">{idn.countryName}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{idn.fullName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({idn.gender})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className={`copy-btn ${copiedId === fav.id ? 'copied' : ''}`}
                            onClick={() =>
                              copyText(
                                `${idn.fullName}\n${idn.street}, ${idn.city}, ${idn.state} ${idn.zipCode}\nPhone: ${idn.phone}\nEmail: ${idn.tempEmail}\nCard: ${idn.cardNumber}`,
                                fav.id
                              )
                            }
                            title="复制完整身份信息"
                          >
                            {copiedId === fav.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                          <button
                            className="copy-btn"
                            style={{ color: 'var(--accent-rose)' }}
                            onClick={() => handleRemoveFavorite(fav.id)}
                            title="从收藏中移除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                        <div><strong>地址:</strong> {idn.street}, {idn.city}, {idn.state} {idn.zipCode}</div>
                        <div><strong>电话:</strong> {idn.phone}</div>
                        <div><strong>邮箱:</strong> {idn.tempEmail}</div>
                        <div><strong>卡号:</strong> {idn.cardNumber} (CVV: {idn.cvv2})</div>
                      </div>

                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                        收藏于 {fav.savedAt}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 4: Password Vault */}
          {subTab === 'vault' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {vault.length === 0 ? (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  密码保险箱为空。在【密码生成器】生成的密码可随时一键存入保险箱并多端漫游。
                </div>
              ) : (
                vault.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--accent-primary)', marginTop: '2px' }}>
                        {item.password}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        保存于 {item.createdAt}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className={`copy-btn ${copiedId === item.id ? 'copied' : ''}`}
                        onClick={() => copyText(item.password, item.id)}
                        title="复制密码"
                      >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        className="copy-btn"
                        style={{ color: 'var(--accent-rose)' }}
                        onClick={() => handleRemoveVault(item.id)}
                        title="删除该密码"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
