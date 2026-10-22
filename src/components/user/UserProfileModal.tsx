import React, { useState, useEffect } from 'react';
import { X, Cloud, RefreshCw, Star, ShieldCheck, Download, Trash2, Copy, Check } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { CloudSyncService } from '../../services/cloudSyncService';
import { useToast } from '../common/Toast';
import type { User } from '../../types/user';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubTab?: 'sync' | 'favorites' | 'vault';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  defaultSubTab = 'sync',
}) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [subTab, setSubTab] = useState<'sync' | 'favorites' | 'vault'>(defaultSubTab);
  const [isSyncing, setIsSyncing] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [vault, setVault] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadLocalData = () => {
    setUser(AuthService.getCurrentUser());
    setFavorites(CloudSyncService.getFavoriteIdentities());
    setVault(CloudSyncService.getPasswordVault());
  };

  useEffect(() => {
    if (isOpen) {
      loadLocalData();
      setSubTab(defaultSubTab);
    }
  }, [isOpen, defaultSubTab]);

  if (!isOpen || !user) return null;

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

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
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
              src={user.avatar}
              alt={user.username}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                border: '2px solid var(--accent-primary)',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{user.username}</h3>
                <span className={user.role === 'admin' ? 'badge badge-emerald' : 'badge badge-cyan'}>
                  {user.role === 'admin' ? '👑 超级管理员' : 'VIP 认证会员'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  来源: {user.provider.toUpperCase()}
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
          }}
        >
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
        <div style={{ flex: 1, overflowY: 'auto' }}>
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
