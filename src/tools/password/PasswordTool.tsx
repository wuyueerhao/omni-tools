import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Hash, FileDown } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type PasswordMode = 'random' | 'passphrase' | 'pin';

const WORD_LIST = [
  'ocean', 'falcon', 'galaxy', 'quantum', 'tiger', 'ember', 'shadow', 'aurora',
  'zenith', 'pulse', 'beacon', 'frost', 'matrix', 'orbital', 'cyber', 'vortex',
  'nebula', 'cosmic', 'thunder', 'phantom', 'titan', 'stellar', 'echo', 'prism',
  'iron', 'solar', 'delta', 'omega', 'swift', 'alpha', 'shield', 'crypto'
];

export const PasswordTool: React.FC = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<PasswordMode>('random');
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(true);

  // Passphrase options
  const [wordCount, setWordCount] = useState<number>(4);
  const [separator, setSeparator] = useState<string>('-');

  // Results
  const [password, setPassword] = useState<string>('');
  const [batchCount, setBatchCount] = useState<number>(5);
  const [batchList, setBatchList] = useState<string[]>([]);
  const [sha256Hash, setSha256Hash] = useState<string>('');

  const generateSinglePassword = (): string => {
    if (mode === 'pin') {
      const pinDigits = '0123456789';
      let res = '';
      const arr = new Uint8Array(length);
      crypto.getRandomValues(arr);
      for (let i = 0; i < length; i++) {
        res += pinDigits[arr[i] % pinDigits.length];
      }
      return res;
    }

    if (mode === 'passphrase') {
      const selectedWords: string[] = [];
      const arr = new Uint32Array(wordCount);
      crypto.getRandomValues(arr);
      for (let i = 0; i < wordCount; i++) {
        let w = WORD_LIST[arr[i] % WORD_LIST.length];
        if (useUpper && i % 2 === 0) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        selectedWords.push(w);
      }
      let base = selectedWords.join(separator);
      if (useNumbers) {
        const randNum = (crypto.getRandomValues(new Uint8Array(1))[0] % 90) + 10;
        base += separator + randNum;
      }
      return base;
    }

    // Default Random Mode
    let charset = '';
    if (useUpper) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (!excludeSimilar && useUpper) charset += 'IO';
    if (useLower) charset += 'abcdefghijkmnpqrstuvwxyz';
    if (!excludeSimilar && useLower) charset += 'lo';
    if (useNumbers) charset += '23456789';
    if (!excludeSimilar && useNumbers) charset += '01';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';

    let result = '';
    const randomBuffer = new Uint32Array(length);
    crypto.getRandomValues(randomBuffer);
    for (let i = 0; i < length; i++) {
      result += charset[randomBuffer[i] % charset.length];
    }
    return result;
  };

  const regenerate = () => {
    const single = generateSinglePassword();
    setPassword(single);

    const batch: string[] = [];
    for (let i = 0; i < batchCount; i++) {
      batch.push(generateSinglePassword());
    }
    setBatchList(batch);
  };

  useEffect(() => {
    regenerate();
  }, [mode, length, wordCount, separator, useUpper, useLower, useNumbers, useSymbols, excludeSimilar, batchCount]);

  // Compute SHA-256 for current password
  useEffect(() => {
    if (!password) {
      setSha256Hash('');
      return;
    }
    const enc = new TextEncoder();
    crypto.subtle.digest('SHA-256', enc.encode(password)).then((buffer) => {
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setSha256Hash(hashHex);
    });
  }, [password]);

  // Entropy evaluation
  const calcEntropy = (pwd: string): { bits: number; text: string; color: string; crackTime: string } => {
    if (!pwd) return { bits: 0, text: '无', color: 'var(--text-muted)', crackTime: '0秒' };

    let pool = 0;
    if (/[a-z]/.test(pwd)) pool += 26;
    if (/[A-Z]/.test(pwd)) pool += 26;
    if (/[0-9]/.test(pwd)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) pool += 32;

    const bits = Math.round(pwd.length * (Math.log2(pool || 1)));

    if (bits < 40) return { bits, text: '极弱 (易破解)', color: 'var(--accent-rose)', crackTime: '秒级破解' };
    if (bits < 60) return { bits, text: '中等 (一般)', color: 'var(--accent-amber)', crackTime: '几小时~数天' };
    if (bits < 80) return { bits, text: '强 (推荐)', color: 'var(--accent-cyan)', crackTime: '数百年' };
    return { bits, text: '极强 (军事级)', color: 'var(--accent-emerald)', crackTime: '数千万年' };
  };

  const entropy = calcEntropy(password);

  const copyText = (txt: string, msg = '已复制到剪贴板') => {
    navigator.clipboard.writeText(txt);
    toast(msg, 'success');
  };

  const exportBatch = () => {
    const content = batchList.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出密码列表为 TXT', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Main Password Output Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${mode === 'random' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('random')}
            >
              随机高强
            </button>
            <button
              className={`btn ${mode === 'passphrase' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('passphrase')}
            >
              易记短语 (Diceware)
            </button>
            <button
              className={`btn ${mode === 'pin' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('pin')}
            >
              纯数字 PIN
            </button>
          </div>

          <button className="btn btn-secondary" onClick={regenerate}>
            <RefreshCw size={16} /> 重新生成
          </button>
        </div>

        {/* Big Password Output Box */}
        <div
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              userSelect: 'all',
              letterSpacing: '1px',
            }}
          >
            {password}
          </span>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button className="btn btn-gradient" onClick={() => copyText(password)}>
              <Copy size={16} /> 复制
            </button>
          </div>
        </div>

        {/* Strength & Entropy Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              密码强度: <strong style={{ color: entropy.color }}>{entropy.text}</strong> ({entropy.bits} bits 熵值)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>暴力破解耗时估算: <strong>{entropy.crackTime}</strong></span>
          </div>

          <div
            style={{
              height: '6px',
              background: 'var(--bg-tertiary)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (entropy.bits / 100) * 100)}%`,
                height: '100%',
                background: entropy.color,
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Controls */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>生成规则微调</h3>

          {mode === 'random' && (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span>密码长度</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {length} 位
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '8px' }}>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                  />
                  包含大写 (A-Z)
                </label>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={useLower}
                    onChange={(e) => setUseLower(e.target.checked)}
                  />
                  包含小写 (a-z)
                </label>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                  />
                  包含数字 (0-9)
                </label>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                  />
                  特殊字符 (!@#$...)
                </label>
              </div>

              <label className="switch-label" style={{ paddingTop: '6px' }}>
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={excludeSimilar}
                  onChange={(e) => setExcludeSimilar(e.target.checked)}
                />
                排除易混淆字符 (1, l, I, 0, O)
              </label>
            </>
          )}

          {mode === 'passphrase' && (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span>词汇数量</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {wordCount} 个
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div className="input-group">
                <label className="input-label">分隔连接符</label>
                <input
                  type="text"
                  className="input-text input-mono"
                  value={separator}
                  maxLength={3}
                  onChange={(e) => setSeparator(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                  />
                  首字母大写
                </label>
                <label className="switch-label">
                  <input
                    type="checkbox"
                    className="switch-input"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                  />
                  尾部加随机数字
                </label>
              </div>
            </>
          )}

          {mode === 'pin' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                <span>PIN 位数</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {length} 位
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="slider-input"
              />
            </div>
          )}

          {/* Quick SHA256 */}
          {sha256Hash && (
            <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Hash size={13} /> SHA-256 哈希指纹
                </span>
                <button
                  type="button"
                  onClick={() => copyText(sha256Hash, '已复制 SHA-256 哈希')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  复制哈希
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  wordBreak: 'break-all',
                  background: 'var(--bg-tertiary)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {sha256Hash}
              </div>
            </div>
          )}
        </div>

        {/* Batch Generator */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>批量生成 ({batchList.length})</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={exportBatch}>
                <FileDown size={14} /> 导出 TXT
              </button>
              <select
                className="select-box"
                style={{ width: '80px', padding: '4px 8px', fontSize: '0.75rem' }}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
              >
                <option value={5}>5 条</option>
                <option value={10}>10 条</option>
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
              </select>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px' }}>
            {batchList.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{p}</span>
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 8px', flexShrink: 0 }}
                  onClick={() => copyText(p, '已复制该条密码')}
                  title="复制"
                >
                  <Copy size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
