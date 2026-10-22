import React, { useState, useEffect, useRef } from 'react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { Copy, Plus, Trash2, QrCode, RefreshCw, KeyRound, ShieldAlert, Cloud } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { AuthService } from '../../services/authService';
import { CloudSyncService } from '../../services/cloudSyncService';

interface SavedAccount {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  digits: number;
  period: number;
}

export const TotpTool: React.FC = () => {
  const { toast } = useToast();
  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP');
  const [label, setLabel] = useState('user@example.com');
  const [issuer, setIssuer] = useState('GitHub');
  const [digits, setDigits] = useState<number>(6);
  const [period] = useState<number>(30);
  const [token, setToken] = useState('------');
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  // Saved accounts in local storage
  const [accounts, setAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('omni_totp_accounts');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      { id: '1', issuer: 'GitHub', label: 'wuyueerhao', secret: 'JBSWY3DPEHPK3PXP', digits: 6, period: 30 },
      { id: '2', issuer: 'Cloudflare', label: 'admin@cf', secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ', digits: 6, period: 30 },
    ];
  });

  const timerRef = useRef<number | null>(null);

  const calculateTotp = () => {
    try {
      const cleanSecret = secret.trim().replace(/\s+/g, '').toUpperCase();
      if (!cleanSecret) {
        setToken('------');
        return;
      }
      const totp = new OTPAuth.TOTP({
        issuer: issuer.trim() || 'OmniTools',
        label: label.trim() || 'User',
        algorithm: 'SHA1',
        digits: digits,
        period: period,
        secret: OTPAuth.Secret.fromBase32(cleanSecret),
      });

      const currentToken = totp.generate();
      setToken(currentToken);

      const sec = period - (Math.floor(Date.now() / 1000) % period);
      setRemainingSeconds(sec);
    } catch {
      setToken('INVALID');
    }
  };

  useEffect(() => {
    calculateTotp();
    timerRef.current = window.setInterval(() => {
      calculateTotp();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secret, digits, issuer, label]);

  const copyToClipboard = (text: string, tip = '已复制动态口令') => {
    navigator.clipboard.writeText(text);
    toast(tip, 'success');
  };

  const handleGenerateRandomSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let res = '';
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      res += chars[array[i] % chars.length];
    }
    setSecret(res);
    toast('已生成新的随机 Base32 密钥', 'info');
  };

  const handleSaveAccount = () => {
    if (!secret.trim()) {
      toast('密钥不能为空', 'error');
      return;
    }
    const newAcc: SavedAccount = {
      id: Date.now().toString(),
      issuer: issuer.trim() || 'Custom',
      label: label.trim() || 'Account',
      secret: secret.trim().toUpperCase(),
      digits,
      period,
    };
    const updated = [newAcc, ...accounts];
    setAccounts(updated);
    localStorage.setItem('omni_totp_accounts', JSON.stringify(updated));
    if (AuthService.getCurrentUser()) {
      CloudSyncService.syncNow().catch(() => {});
      toast('账号已保存并自动同步至云端', 'success');
    } else {
      toast('账号已保存至本地离线存储（登录后可多端同步）', 'success');
    }
  };

  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    localStorage.setItem('omni_totp_accounts', JSON.stringify(updated));
    if (AuthService.getCurrentUser()) {
      CloudSyncService.syncNow().catch(() => {});
    }
    toast('已删除该账号', 'info');
  };

  const handleSelectAccount = (acc: SavedAccount) => {
    setIssuer(acc.issuer);
    setLabel(acc.label);
    setSecret(acc.secret);
    setDigits(acc.digits);
    toast(`已切换至 ${acc.issuer} (${acc.label})`, 'info');
  };

  const handleShowQrCode = async () => {
    try {
      const cleanSecret = secret.trim().replace(/\s+/g, '').toUpperCase();
      const totp = new OTPAuth.TOTP({
        issuer: issuer.trim() || 'OmniTools',
        label: label.trim() || 'User',
        algorithm: 'SHA1',
        digits,
        period,
        secret: OTPAuth.Secret.fromBase32(cleanSecret),
      });
      const uri = totp.toString();
      const dataUrl = await QRCode.toDataURL(uri, { width: 280, margin: 2 });
      setQrModalUrl(dataUrl);
    } catch {
      toast('生成二维码失败，请检查密钥格式', 'error');
    }
  };

  // Circular progress calculation
  const progressRatio = remainingSeconds / period;
  const strokeDashoffset = 100 - progressRatio * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Warning */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-primary)',
          fontSize: '0.8125rem',
        }}
      >
        <ShieldAlert size={18} />
        <span>
          <strong>100% 浏览器本地计算：</strong>密钥仅暂存在内存与浏览器 LocalStorage，绝无任何网络请求上载，请放心使用。
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Token Display & Interactive Generator */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--accent-primary)" />
            实时 2FA 令牌计算
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 20px',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {/* Countdown ring */}
            <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '16px' }}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" stroke="var(--border-color)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={remainingSeconds <= 5 ? 'var(--accent-rose)' : 'var(--accent-cyan)'}
                  strokeWidth="6"
                  strokeDasharray="314"
                  strokeDashoffset={(314 * strokeDashoffset) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: remainingSeconds <= 5 ? 'var(--accent-rose)' : 'var(--text-primary)',
                  }}
                >
                  {remainingSeconds}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>秒后刷新</span>
              </div>
            </div>

            {/* Token Numbers */}
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                letterSpacing: '6px',
                fontFamily: 'var(--font-mono)',
                color: token === 'INVALID' ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                cursor: 'pointer',
                userSelect: 'all',
                textShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
              }}
              onClick={() => token !== 'INVALID' && copyToClipboard(token)}
              title="点击复制"
            >
              {token}
            </div>

            <div style={{ marginTop: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {issuer} ({label})
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => copyToClipboard(token)}
                disabled={token === 'INVALID'}
              >
                <Copy size={16} />
                复制口令
              </button>
              <button className="btn btn-secondary" onClick={handleShowQrCode}>
                <QrCode size={16} />
                二维码
              </button>
            </div>
          </div>

          {/* Config Inputs */}
          <div>
            <div className="input-group">
              <label className="input-label">
                <span>Base32 密钥 (Secret Key)</span>
                <button
                  type="button"
                  onClick={handleGenerateRandomSecret}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  <RefreshCw size={12} /> 生成随机测试密钥
                </button>
              </label>
              <input
                type="text"
                className="input-text input-mono"
                placeholder="例如: JBSWY3DPEHPK3PXP"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">服务/发行方 (Issuer)</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="例如: GitHub / Google"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">账号备注 (Label)</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="例如: user@domain.com"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>口令位数:</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="digits"
                    checked={digits === 6}
                    onChange={() => setDigits(6)}
                  />
                  6 位 (标准)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="digits"
                    checked={digits === 8}
                    onChange={() => setDigits(8)}
                  />
                  8 位
                </label>
              </div>

              <button className="btn btn-secondary" onClick={handleSaveAccount}>
                <Plus size={16} />
                保存账号到列表
              </button>
            </div>
          </div>
        </div>

        {/* Saved Accounts List */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>2FA 保管箱 ({accounts.length})</h3>
            {AuthService.getCurrentUser() ? (
              <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cloud size={12} /> 云端多端已同步
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>本地离线 · 登录后支持多端同步</span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {accounts.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                暂无保存的 2FA 账号，请在左侧配置并点击「保存账号到列表」
              </div>
            ) : (
              accounts.map((acc) => {
                let currentCode = '------';
                try {
                  const t = new OTPAuth.TOTP({
                    issuer: acc.issuer,
                    label: acc.label,
                    digits: acc.digits,
                    period: acc.period,
                    secret: OTPAuth.Secret.fromBase32(acc.secret),
                  });
                  currentCode = t.generate();
                } catch {
                  currentCode = 'ERR';
                }

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {acc.issuer}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.label}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: 'var(--accent-cyan)',
                          letterSpacing: '1px',
                        }}
                      >
                        {currentCode}
                      </span>
                      <button
                        className="copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(currentCode, `已复制 ${acc.issuer} 口令`);
                        }}
                        title="复制口令"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="copy-btn"
                        style={{ color: 'var(--accent-rose)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(acc.id);
                        }}
                        title="删除账号"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalUrl && (
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
          onClick={() => setQrModalUrl(null)}
        >
          <div
            className="glass-panel"
            style={{ width: '340px', textAlign: 'center', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: '14px', fontSize: '1rem', fontWeight: 600 }}>扫描绑定 2FA</h4>
            <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', display: 'inline-block' }}>
              <img src={qrModalUrl} alt="2FA QR Code" style={{ display: 'block' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              使用 Google Authenticator 或任意 2FA App 扫码
            </p>
            <button className="btn btn-secondary" style={{ marginTop: '16px', width: '100%' }} onClick={() => setQrModalUrl(null)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
