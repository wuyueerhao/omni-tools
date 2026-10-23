import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon, Shield, Cloud, LogOut, Star, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { CloudSyncService } from '../../services/cloudSyncService';
import { useToast } from '../common/Toast';
import { AuthModal } from './AuthModal';
import { UserProfileModal } from '../user/UserProfileModal';
import { AdminDashboardModal } from '../admin/AdminDashboardModal';
import type { User } from '../../types/user';

interface UserMenuProps {
  onNavigateToSuperAdmin?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigateToSuperAdmin }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'sync' | 'favorites' | 'vault'>('sync');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = AuthService.subscribe((u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setIsDropdownOpen(false);
    toast('已退出当前账号，进入访客模式', 'info');
  };

  const handleManualSync = async () => {
    setIsDropdownOpen(false);
    try {
      const res = await CloudSyncService.syncNow();
      toast(`云同步成功！2FA(${res.stats.totp}) 身份(${res.stats.identities}) 密码(${res.stats.passwords})`, 'success');
    } catch (e: any) {
      toast(e.message || '同步失败', 'error');
    }
  };

  const openProfileWithTab = (tab: 'sync' | 'favorites' | 'vault') => {
    setProfileTab(tab);
    setIsProfileModalOpen(true);
    setIsDropdownOpen(false);
  };

  const isSuper = AuthService.isSuperAdmin(user);
  const isRegularAdmin = AuthService.isAdmin(user) && !isSuper;

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {!user ? (
        /* Guest Mode Trigger */
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem', gap: '6px' }}
            onClick={() => setIsAuthModalOpen(true)}
          >
            <UserIcon size={14} />
            <span>登录 / 注册</span>
          </button>
        </div>
      ) : (
        /* Logged In User Pill */
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-elevated)',
              borderColor: isSuper
                ? 'rgba(168, 85, 247, 0.5)'
                : isRegularAdmin
                ? 'rgba(99, 102, 241, 0.4)'
                : 'var(--border-color)',
            }}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <img
              src={user.avatar}
              alt={user.username}
              style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-tertiary)' }}
            />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.username}
            </span>
            {isSuper ? (
              <span
                className="badge"
                style={{
                  padding: '1px 6px',
                  fontSize: '0.625rem',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                👑 SUPER
              </span>
            ) : isRegularAdmin ? (
              <span className="badge badge-emerald" style={{ padding: '1px 5px', fontSize: '0.625rem' }}>
                ADMIN
              </span>
            ) : (
              <span className="badge badge-cyan" style={{ padding: '1px 5px', fontSize: '0.625rem' }}>
                VIP
              </span>
            )}
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 1050,
              }}
            >
              {/* User overview item */}
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '4px',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '0.6875rem', color: 'var(--accent-emerald)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                  多端云同步已开启
                </div>
              </div>

              {/* Menu items */}
              <button
                className="btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  gap: '8px',
                }}
                onClick={() => openProfileWithTab('sync')}
              >
                <Cloud size={15} color="var(--accent-primary)" />
                <span>云同步设置与备份</span>
              </button>

              <button
                className="btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  gap: '8px',
                }}
                onClick={() => openProfileWithTab('favorites')}
              >
                <Star size={15} color="#eab308" />
                <span>我的身份收藏夹</span>
              </button>

              <button
                className="btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  gap: '8px',
                }}
                onClick={() => openProfileWithTab('vault')}
              >
                <ShieldCheck size={15} color="var(--accent-cyan)" />
                <span>我的密码保险箱</span>
              </button>

              {/* 仅超级管理员可看到的专属后台入口 */}
              {isSuper && (
                <button
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    fontSize: '0.8125rem',
                    borderRadius: '4px',
                    gap: '8px',
                    color: '#a855f7',
                    background: 'rgba(168, 85, 247, 0.12)',
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onNavigateToSuperAdmin?.();
                  }}
                >
                  <Shield size={15} color="#a855f7" />
                  <span>👑 超级管理员后台</span>
                </button>
              )}

              {/* 管理员工作台 (超级管理员与普通管理员均可查看日常审计与备份) */}
              {(isSuper || isRegularAdmin) && (
                <button
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    fontSize: '0.8125rem',
                    borderRadius: '4px',
                    gap: '8px',
                    color: 'var(--accent-primary)',
                    background: 'rgba(99, 102, 241, 0.08)',
                  }}
                  onClick={() => {
                    setIsAdminModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                >
                  <Shield size={15} />
                  <span>🛡️ 管理员审计控制台</span>
                </button>
              )}

              <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

              <button
                className="btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  gap: '8px',
                }}
                onClick={handleManualSync}
              >
                <Sparkles size={15} color="var(--accent-emerald)" />
                <span>立即双向同步</span>
              </button>

              <button
                className="btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  padding: '8px 10px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  gap: '8px',
                  color: 'var(--accent-rose)',
                }}
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>退出登录</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultSubTab={profileTab}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
};
