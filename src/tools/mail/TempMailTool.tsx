import React, { useState, useEffect } from 'react';
import { Mail, Copy, RefreshCw, Settings, Inbox, ShieldAlert, Sparkles } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { TempMailService } from '../../services/tempMailService';
import type { TempMailMessage, TempMailConfig } from '../../services/tempMailService';

interface TempMailToolProps {
  initialEmail?: string;
}

export const TempMailTool: React.FC<TempMailToolProps> = ({ initialEmail }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState<string>(() => initialEmail || TempMailService.getCurrentEmail());
  const [messages, setMessages] = useState<TempMailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<TempMailMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customPrefix, setCustomPrefix] = useState<string>('');

  // Config State
  const [config, setConfig] = useState<TempMailConfig>(() => TempMailService.getConfig());

  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
      TempMailService.setCurrentEmail(initialEmail);
    }
  }, [initialEmail]);

  const loadInbox = async (addr = email) => {
    setIsLoading(true);
    try {
      const list = await TempMailService.fetchMessages(addr);
      setMessages(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInbox(email);
  }, [email]);

  const copyToClipboard = (text: string, label = '内容') => {
    navigator.clipboard.writeText(text);
    toast(`已复制 ${label}: ${text}`, 'success');
  };

  const handleGenerateNew = () => {
    const newAddr = TempMailService.generateRandomAddress();
    setEmail(newAddr);
    toast(`已生成新临时邮箱: ${newAddr}`, 'success');
  };

  const handleCustomPrefix = () => {
    if (!customPrefix.trim()) return;
    const newAddr = TempMailService.generateRandomAddress(customPrefix.trim());
    setEmail(newAddr);
    setCustomPrefix('');
    toast(`已设置自定义邮箱: ${newAddr}`, 'success');
  };

  const handleSaveConfig = () => {
    TempMailService.saveConfig(config);
    setShowConfigModal(false);
    toast('已保存 Cloudflare Temp Email 服务配置', 'success');
    loadInbox(email);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-primary)',
          fontSize: '0.8125rem',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={18} />
          <span>
            <strong>Cloudflare Temp Email 服务：</strong>已与【虚拟身份生成】联动打通。可直接接收临时邮件与验证码，或在右上角配置自建后端。
          </span>
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          onClick={() => setShowConfigModal(true)}
        >
          <Settings size={14} /> 后端配置 (Cloudflare)
        </button>
      </div>

      {/* Main Mail Header Card */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '24px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            当前活跃临时邮箱地址 (已自动关联身份系统)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                userSelect: 'all',
              }}
            >
              {email}
            </span>
            <button className="btn btn-gradient" onClick={() => copyToClipboard(email, '邮箱地址')}>
              <Copy size={16} /> 复制邮箱
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => loadInbox(email)} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            {isLoading ? '收取中...' : '刷新收件箱'}
          </button>
          <button className="btn btn-primary" onClick={handleGenerateNew}>
            <Sparkles size={16} /> 随机换一个
          </button>
        </div>
      </div>

      {/* Custom Prefix Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.875rem',
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>自定义邮箱前缀:</span>
        <input
          type="text"
          className="input-text input-mono"
          style={{ maxWidth: '240px', padding: '6px 12px' }}
          placeholder="例如: my_order_2026"
          value={customPrefix}
          onChange={(e) => setCustomPrefix(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomPrefix()}
        />
        <button className="btn btn-secondary" onClick={handleCustomPrefix}>
          确认应用
        </button>
      </div>

      {/* Inbox & Message View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
        {/* Inbox List */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Inbox size={18} color="var(--accent-primary)" />
              收件箱 ({messages.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>自动提取验证码</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                收件箱空空如也，有新邮件时将在此显示
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMessage(m)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: selectedMessage?.id === m.id ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                    border: `1px solid ${selectedMessage?.id === m.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{m.from}</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{m.date}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {m.subject}
                  </div>
                  {m.verificationCode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-emerald">验证码: {m.verificationCode}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Content View */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {selectedMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {selectedMessage.subject}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span>发件人: <strong>{selectedMessage.from}</strong></span>
                  <span>{selectedMessage.date}</span>
                </div>
              </div>

              {selectedMessage.verificationCode && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>识别到验证码:</span>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {selectedMessage.verificationCode}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px' }}
                    onClick={() => copyToClipboard(selectedMessage.verificationCode!, '验证码')}
                  >
                    <Copy size={14} /> 复制验证码
                  </button>
                </div>
              )}

              <div
                style={{
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--bg-tertiary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  minHeight: '160px',
                }}
              >
                {selectedMessage.content}
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: '12px',
                minHeight: '260px',
              }}
            >
              <Mail size={40} />
              <span>选择左侧邮件查看详情与验证码</span>
            </div>
          )}
        </div>
      </div>

      {/* Cloudflare Backend Config Modal */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '480px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: 600 }}>
              Cloudflare Temp Email 服务配置
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              本客户端可直连由 <code>dreamhunter2333/cloudflare_temp_email</code> 部署在 Cloudflare Worker 的后端服务。
            </p>

            <div className="input-group">
              <label className="input-label">后端 API 域名 (API Endpoint)</label>
              <input
                type="text"
                className="input-text"
                placeholder="例如: https://mail.yourdomain.com"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">访问密码 (若服务端开启了访问授权)</label>
              <input
                type="password"
                className="input-text"
                placeholder="留空表示无密码"
                value={config.authPassword || ''}
                onChange={(e) => setConfig({ ...config, authPassword: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">默认邮件后缀域名 (Domain)</label>
              <input
                type="text"
                className="input-text"
                placeholder="例如: iubridge.com"
                value={config.customDomain || ''}
                onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSaveConfig}>
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
