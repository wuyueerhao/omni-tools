import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Database, Activity, RefreshCw, KeyRound, Trash2, Download } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { CloudSyncService } from '../../services/cloudSyncService';
import { useToast } from '../common/Toast';
import type { UserAccountCredentials, AuditLog } from '../../types/user';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'stats'>('users');
  const [accounts, setAccounts] = useState<UserAccountCredentials[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [resetPassUser, setResetPassUser] = useState<UserAccountCredentials | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const loadData = () => {
    setAccounts(AuthService.getAccounts());
    setLogs(AuthService.getAuditLogs());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetPassword = () => {
    if (!resetPassUser || !newPassword.trim()) return;
    try {
      AuthService.adminResetPassword(resetPassUser.id, newPassword.trim());
      toast(`已重置用户 [${resetPassUser.username}] 的密码`, 'success');
      setResetPassUser(null);
      setNewPassword('');
      loadData();
    } catch (e: any) {
      toast(e.message || '重置失败', 'error');
    }
  };

  const handleDeleteUser = (u: UserAccountCredentials) => {
    if (u.username === 'world') {
      toast('不能删除系统管理员账号 world', 'info');
      return;
    }
    if (window.confirm(`确定要注销并删除用户 [${u.username}] 吗？`)) {
      try {
        AuthService.adminDeleteUser(u.id);
        toast(`用户 [${u.username}] 已删除`, 'success');
        loadData();
      } catch (e: any) {
        toast(e.message || '删除失败', 'error');
      }
    }
  };

  const handleExportSystemBackup = () => {
    CloudSyncService.exportBackupFile();
    toast('已导出系统备份文件', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>管理员控制中心</h3>
                <span className="badge badge-emerald" style={{ fontSize: '0.6875rem' }}>
                  {AuthService.isSuperAdmin() ? '👑 超级管理员' : '🛡️ 管理员'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                全局用户账户管理、多端云同步审计与系统运行状态监控
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="copy-btn" onClick={loadData} title="刷新数据">
              <RefreshCw size={15} />
            </button>
            <button className="copy-btn" onClick={onClose} title="关闭">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
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
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setActiveTab('users')}
          >
            <Users size={15} /> 用户账号列表 ({accounts.length})
          </button>
          <button
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setActiveTab('logs')}
          >
            <Activity size={15} /> 安全审计日志 ({logs.length})
          </button>
          <button
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
            onClick={() => setActiveTab('stats')}
          >
            <Database size={15} /> 数据与备份中心
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', borderRadius: '4px 0 0 4px' }}>用户</th>
                    <th style={{ padding: '10px 12px' }}>邮箱</th>
                    <th style={{ padding: '10px 12px' }}>角色</th>
                    <th style={{ padding: '10px 12px' }}>来源</th>
                    <th style={{ padding: '10px 12px' }}>注册时间</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', borderRadius: '0 4px 4px 0' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={u.avatar}
                          alt={u.username}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-tertiary)' }}
                        />
                        <span>{u.username}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={u.role === 'admin' ? 'badge badge-emerald' : 'badge badge-cyan'}>
                          {u.role === 'admin' ? '超级管理员' : '标准用户'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                        {u.provider}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {u.createdAt}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="copy-btn"
                            title="重置该用户密码"
                            onClick={() => {
                              setResetPassUser(u);
                              setNewPassword('');
                            }}
                          >
                            <KeyRound size={14} />
                          </button>
                          {u.username !== 'world' && (
                            <button
                              className="copy-btn"
                              style={{ color: 'var(--accent-rose)' }}
                              title="删除该用户"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Reset Password Submodal */}
              {resetPassUser && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong>重置密码：</strong>正在为用户 <code>{resetPassUser.username}</code> 设置新密码
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-text"
                      style={{ width: '180px', padding: '6px 10px', fontSize: '0.8125rem' }}
                      placeholder="输入新密码"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={handleResetPassword}>
                      确认修改
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setResetPassUser(null)}>
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>暂无审计日志</div>
              ) : (
                logs.map((l) => (
                  <div
                    key={l.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      borderLeft: `3px solid ${
                        l.status === 'success'
                          ? 'var(--accent-emerald)'
                          : l.status === 'warning'
                          ? 'var(--accent-amber)'
                          : 'var(--accent-rose)'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {l.timestamp}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>[{l.username}]</span>
                      <span style={{ color: 'var(--text-primary)' }}>{l.action}</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        textTransform: 'uppercase',
                        color:
                          l.status === 'success'
                            ? 'var(--accent-emerald)'
                            : l.status === 'warning'
                            ? 'var(--accent-amber)'
                            : 'var(--accent-rose)',
                      }}
                    >
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>总注册用户数</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {accounts.length}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>安全审计事件</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    {logs.length}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>系统环境状态</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '8px' }}>
                    Cloudflare + Pages
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>全站数据备份归档 (.json)</h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    导出包括所有 2FA 令牌、虚拟身份收藏夹与密码保险箱在内的完整数据包
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleExportSystemBackup}>
                  <Download size={16} /> 导出全量备份
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
