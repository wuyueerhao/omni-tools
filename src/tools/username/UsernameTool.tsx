import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Sparkles, FileDown, Check } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type StyleType = 'cyber' | 'english' | 'pinyin' | 'gamer';
type CaseFormat = 'snake_case' | 'kebab-case' | 'camelCase' | 'PascalCase' | 'lowercase';

const CYBER_PREFIXES = ['cyber', 'quantum', 'matrix', 'zero', 'void', 'byte', 'crypto', 'shadow', 'pulse', 'pixel', 'vortex', 'ghost', 'binary', 'hyper'];
const CYBER_SUFFIXES = ['root', 'hack', 'node', 'daemon', 'core', 'blade', 'runner', 'recon', 'flux', 'syn', 'ping', 'grid', 'drift', 'null'];

const ENGLISH_ADJECTIVES = ['silent', 'swift', 'stellar', 'cosmic', 'crimson', 'golden', 'velvet', 'lunar', 'solar', 'mystic', 'iron', 'noble', 'wild', 'serene'];
const ENGLISH_NOUNS = ['falcon', 'wolf', 'tiger', 'ember', 'beacon', 'echo', 'aurora', 'tempest', 'zenith', 'phoenix', 'atlas', 'hunter', 'wanderer', 'sage'];

const PINYIN_FIRST = ['feng', 'yun', 'qing', 'mo', 'xiao', 'zi', 'tian', 'yu', 'jian', 'ling', 'bai', 'xuan', 'chen', 'ye'];
const PINYIN_SECOND = ['zhou', 'han', 'ge', 'ying', 'chen', 'ran', 'xi', 'lang', 'shuang', 'yuan', 'wu', 'yue', 'ming', 'chuan'];

const GAMER_FIRST = ['Dark', 'Frost', 'Thunder', 'Apex', 'Alpha', 'Omega', 'Phantom', 'Sniper', 'Valkyrie', 'Rogue', 'Blade', 'Viper'];
const GAMER_SECOND = ['Knight', 'Strike', 'Lord', 'Assassin', 'Hunter', 'Reaper', 'Slayer', 'Beast', 'Storm', 'Master', 'Fury', 'Echo'];

export const UsernameTool: React.FC = () => {
  const { toast } = useToast();
  const [style, setStyle] = useState<StyleType>('cyber');
  const [format, setFormat] = useState<CaseFormat>('snake_case');
  const [appendNumber, setAppendNumber] = useState<boolean>(true);
  const [count, setCount] = useState<number>(20);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateOne = (): string => {
    let p1 = '';
    let p2 = '';

    if (style === 'cyber') {
      p1 = CYBER_PREFIXES[Math.floor(Math.random() * CYBER_PREFIXES.length)];
      p2 = CYBER_SUFFIXES[Math.floor(Math.random() * CYBER_SUFFIXES.length)];
    } else if (style === 'english') {
      p1 = ENGLISH_ADJECTIVES[Math.floor(Math.random() * ENGLISH_ADJECTIVES.length)];
      p2 = ENGLISH_NOUNS[Math.floor(Math.random() * ENGLISH_NOUNS.length)];
    } else if (style === 'pinyin') {
      p1 = PINYIN_FIRST[Math.floor(Math.random() * PINYIN_FIRST.length)];
      p2 = PINYIN_SECOND[Math.floor(Math.random() * PINYIN_SECOND.length)];
    } else {
      p1 = GAMER_FIRST[Math.floor(Math.random() * GAMER_FIRST.length)];
      p2 = GAMER_SECOND[Math.floor(Math.random() * GAMER_SECOND.length)];
    }

    let combined = '';
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    switch (format) {
      case 'snake_case':
        combined = `${p1.toLowerCase()}_${p2.toLowerCase()}`;
        break;
      case 'kebab-case':
        combined = `${p1.toLowerCase()}-${p2.toLowerCase()}`;
        break;
      case 'camelCase':
        combined = `${p1.toLowerCase()}${cap(p2)}`;
        break;
      case 'PascalCase':
        combined = `${cap(p1)}${cap(p2)}`;
        break;
      case 'lowercase':
        combined = `${p1.toLowerCase()}${p2.toLowerCase()}`;
        break;
    }

    if (appendNumber) {
      const mode = Math.random();
      if (mode > 0.6) {
        combined += Math.floor(Math.random() * 90 + 10);
      } else if (mode > 0.3) {
        combined += Math.floor(Math.random() * 900 + 100);
      } else {
        combined += '01';
      }
    }

    return combined;
  };

  const generateBatch = () => {
    const list: string[] = [];
    const set = new Set<string>();
    let attempts = 0;
    while (list.length < count && attempts < count * 5) {
      attempts++;
      const name = generateOne();
      if (!set.has(name)) {
        set.add(name);
        list.push(name);
      }
    }
    setUsernames(list);
  };

  useEffect(() => {
    generateBatch();
  }, [style, format, appendNumber, count]);

  const copyUsername = (name: string, index: number) => {
    navigator.clipboard.writeText(name);
    setCopiedIndex(index);
    toast(`已复制: ${name}`, 'success');
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const exportAll = () => {
    const text = usernames.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usernames_${style}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出全部用户名列表', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Configuration Header */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              多风格极客用户名生成器
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              适用于社交账号、GitHub、游戏昵称、极客代号生成
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={exportAll}>
              <FileDown size={16} /> 导出列表
            </button>
            <button className="btn btn-primary" onClick={generateBatch}>
              <RefreshCw size={16} /> 换一批
            </button>
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="input-label" style={{ marginBottom: '8px' }}>风格倾向</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { id: 'cyber', label: '赛博 / 极客风' },
              { id: 'english', label: '英文 / 极简名' },
              { id: 'pinyin', label: '国风 / 拼音流' },
              { id: 'gamer', label: '游戏 / 战斗代号' },
            ].map((s) => (
              <button
                key={s.id}
                className={`btn ${style === s.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStyle(s.id as StyleType)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format & Suffix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">命名格式 (Case Format)</label>
            <select
              className="select-box"
              value={format}
              onChange={(e) => setFormat(e.target.value as CaseFormat)}
            >
              <option value="snake_case">snake_case (下划线: neo_matrix)</option>
              <option value="kebab-case">kebab-case (横线: neo-matrix)</option>
              <option value="camelCase">camelCase (小驼峰: neoMatrix)</option>
              <option value="PascalCase">PascalCase (大驼峰: NeoMatrix)</option>
              <option value="lowercase">lowercase (紧凑小写: neomatrix)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '20px' }}>
            <label className="switch-label">
              <input
                type="checkbox"
                className="switch-input"
                checked={appendNumber}
                onChange={(e) => setAppendNumber(e.target.checked)}
              />
              尾部加随机数字
            </label>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">生成数量: {count} 个</label>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>
      </div>

      {/* Usernames Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '12px',
        }}
      >
        {usernames.map((name, idx) => (
          <div
            key={idx}
            onClick={() => copyUsername(name, idx)}
            style={{
              padding: '14px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              {name}
            </span>

            <span style={{ color: copiedIndex === idx ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
