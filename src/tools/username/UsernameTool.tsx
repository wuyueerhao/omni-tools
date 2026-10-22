import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Sparkles, FileDown, Check } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type StyleType = 'cyber' | 'english' | 'pinyin' | 'gamer';
type CaseFormat = 'PascalCase' | 'camelCase' | 'lowercase' | 'snake_case' | 'kebab-case';

// 扩充词库，确保批量生成 1000 条无重复、高质量
const ENGLISH_FIRST_NAMES = [
  'James', 'Oliver', 'William', 'Henry', 'Lucas', 'Alexander', 'Daniel', 'Matthew', 'Samuel', 'David',
  'Joseph', 'Benjamin', 'Ethan', 'Liam', 'Noah', 'Logan', 'Mason', 'Elijah', 'Jackson', 'Aiden',
  'Jacob', 'Michael', 'Carter', 'Luke', 'Jack', 'Owen', 'Gabriel', 'Julian', 'Leo', 'Anthony',
  'Lincoln', 'Joshua', 'Christopher', 'Andrew', 'Theodore', 'Caleb', 'Ryan', 'Asher', 'Nathan', 'Thomas',
  'Emma', 'Olivia', 'Sophia', 'Charlotte', 'Amelia', 'Mia', 'Harper', 'Evelyn', 'Abigail', 'Emily',
  'Ella', 'Elizabeth', 'Camila', 'Luna', 'Sofia', 'Avery', 'Mila', 'Aria', 'Scarlett', 'Penelope',
  'Grace', 'Chloe', 'Victoria', 'Riley', 'Zoey', 'Nora', 'Lily', 'Eleanor', 'Hannah', 'Lillian'
];

const ENGLISH_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper'
];

const CYBER_PREFIXES = [
  'cyber', 'quantum', 'matrix', 'zero', 'void', 'byte', 'crypto', 'shadow', 'pulse', 'pixel',
  'vortex', 'ghost', 'binary', 'hyper', 'neon', 'flux', 'sync', 'proxy', 'vector', 'cipher',
  'apex', 'orbit', 'echo', 'nexus', 'dark', 'photon', 'neural', 'prime', 'logic', 'nano',
  'core', 'stealth', 'titan', 'sonic', 'astro', 'infra', 'ultra', 'synth', 'meta', 'macro',
  'chrono', 'delta', 'omega', 'sigma', 'prism', 'radar', 'helix', 'spectre', 'volt', 'wave'
];

const CYBER_SUFFIXES = [
  'root', 'hack', 'node', 'daemon', 'core', 'blade', 'runner', 'recon', 'flux', 'syn',
  'ping', 'grid', 'drift', 'null', 'byte', 'code', 'flow', 'wire', 'craft', 'shift',
  'gate', 'storm', 'path', 'trace', 'line', 'lock', 'link', 'scan', 'drop', 'mesh',
  'loop', 'spark', 'pulse', 'bolt', 'cast', 'pack', 'unit', 'edge', 'zone', 'base',
  'mode', 'vault', 'host', 'warp', 'dash', 'bind', 'mark', 'chip', 'cell', 'link'
];

const PINYIN_FIRST = [
  'feng', 'yun', 'qing', 'mo', 'xiao', 'zi', 'tian', 'yu', 'jian', 'ling',
  'bai', 'xuan', 'chen', 'ye', 'lan', 'han', 'chu', 'lin', 'song', 'hua',
  'yan', 'ning', 'wen', 'jing', 'su', 'luo', 'gu', 'nan', 'bei', 'dong',
  'xi', 'mu', 'zhi', 'shang', 'xia', 'fei', 'yi', 'ran', 'zhao', 'tang'
];

const PINYIN_SECOND = [
  'zhou', 'han', 'ge', 'ying', 'chen', 'ran', 'xi', 'lang', 'shuang', 'yuan',
  'wu', 'yue', 'ming', 'chuan', 'feng', 'ting', 'yu', 'xuan', 'zhe', 'fan',
  'lin', 'hao', 'kai', 'rui', 'zhen', 'bo', 'tao', 'yang', 'lei', 'peng',
  'hui', 'jie', 'bin', 'kun', 'sen', 'wei', 'qiang', 'jun', 'bo', 'xin'
];

const GAMER_FIRST = [
  'Dark', 'Frost', 'Thunder', 'Apex', 'Alpha', 'Omega', 'Phantom', 'Sniper', 'Valkyrie', 'Rogue',
  'Blade', 'Viper', 'Mystic', 'Storm', 'Iron', 'Crimson', 'Shadow', 'Savage', 'Chaos', 'Silent',
  'Lethal', 'Cosmic', 'Blaze', 'Ghost', 'Venom', 'Doom', 'Titan', 'Fury', 'Inferno', 'Rapid',
  'Prime', 'Steel', 'Night', 'Wild', 'Fatal', 'Dread', 'Hawk', 'Raven', 'Wolf', 'Bear',
  'Dragon', 'Cobra', 'Fang', 'Talon', 'Strike', 'Flare', 'Turbo', 'Hyper', 'Laser', 'Rocket'
];

const GAMER_SECOND = [
  'Knight', 'Strike', 'Lord', 'Assassin', 'Hunter', 'Reaper', 'Slayer', 'Beast', 'Storm', 'Master',
  'Fury', 'Echo', 'Warrior', 'Raider', 'Soldier', 'King', 'Warden', 'Guard', 'Pilot', 'Captain',
  'Ranger', 'Crusader', 'Champion', 'Marksman', 'Ninja', 'Samurai', 'Warlord', 'Legend', 'Falcon', 'Eagle',
  'Claw', 'Buster', 'Shooter', 'Archer', 'Gunner', 'Driver', 'Breaker', 'Smasher', 'Crusher', 'Striker',
  'Fighter', 'Brawler', 'Gunman', 'Cannon', 'Bullet', 'Blade', 'Saber', 'Spear', 'Shield', 'Walker'
];

export const UsernameTool: React.FC = () => {
  const { toast } = useToast();
  const [style, setStyle] = useState<StyleType>('english');
  const [format, setFormat] = useState<CaseFormat>('PascalCase');
  const [useSpace, setUseSpace] = useState<boolean>(true); // 默认有空格，便于区分 first name 和 last name
  const [appendNumber, setAppendNumber] = useState<boolean>(false);
  const [count, setCount] = useState<number>(20); // 最大支持 1000 条
  const [usernames, setUsernames] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateOne = (): string => {
    let p1 = '';
    let p2 = '';

    if (style === 'english') {
      p1 = ENGLISH_FIRST_NAMES[Math.floor(Math.random() * ENGLISH_FIRST_NAMES.length)];
      p2 = ENGLISH_LAST_NAMES[Math.floor(Math.random() * ENGLISH_LAST_NAMES.length)];
    } else if (style === 'cyber') {
      p1 = CYBER_PREFIXES[Math.floor(Math.random() * CYBER_PREFIXES.length)];
      p2 = CYBER_SUFFIXES[Math.floor(Math.random() * CYBER_SUFFIXES.length)];
    } else if (style === 'pinyin') {
      p1 = PINYIN_FIRST[Math.floor(Math.random() * PINYIN_FIRST.length)];
      p2 = PINYIN_SECOND[Math.floor(Math.random() * PINYIN_SECOND.length)];
    } else {
      p1 = GAMER_FIRST[Math.floor(Math.random() * GAMER_FIRST.length)];
      p2 = GAMER_SECOND[Math.floor(Math.random() * GAMER_SECOND.length)];
    }

    let combined = '';
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const sep = useSpace ? ' ' : '';

    switch (format) {
      case 'PascalCase':
        // 大驼峰：有空格时为 "Neo Matrix"，无空格时为 "NeoMatrix"
        combined = `${cap(p1)}${sep}${cap(p2)}`;
        break;
      case 'camelCase':
        // 小驼峰：有空格时为 "neo Matrix"，无空格时为 "neoMatrix"
        combined = `${p1.toLowerCase()}${sep}${cap(p2)}`;
        break;
      case 'lowercase':
        // 紧凑小写：有空格时为 "neo matrix"，无空格时为 "neomatrix"
        combined = `${p1.toLowerCase()}${sep}${p2.toLowerCase()}`;
        break;
      case 'snake_case':
        combined = `${p1.toLowerCase()}_${p2.toLowerCase()}`;
        break;
      case 'kebab-case':
        combined = `${p1.toLowerCase()}-${p2.toLowerCase()}`;
        break;
    }

    if (appendNumber) {
      const mode = Math.random();
      const num = mode > 0.6
        ? Math.floor(Math.random() * 90 + 10)
        : mode > 0.3
        ? Math.floor(Math.random() * 900 + 100)
        : '88';
      combined += useSpace ? ` ${num}` : `${num}`;
    }

    return combined;
  };

  const generateBatch = () => {
    const list: string[] = [];
    const set = new Set<string>();
    let attempts = 0;
    const maxAttempts = Math.max(count * 6, 2000);
    while (list.length < count && attempts < maxAttempts) {
      attempts++;
      const name = generateOne();
      if (!set.has(name)) {
        set.add(name);
        list.push(name);
      }
    }
    // 如果极端情况下不重复集合略不足，直接补足
    while (list.length < count) {
      list.push(generateOne());
    }
    setUsernames(list);
  };

  useEffect(() => {
    generateBatch();
  }, [style, format, useSpace, appendNumber, count]);

  const copyUsername = (name: string, index: number) => {
    navigator.clipboard.writeText(name);
    setCopiedIndex(index);
    toast(`已复制: ${name}`, 'success');
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    if (usernames.length === 0) return;
    navigator.clipboard.writeText(usernames.join('\n'));
    toast(`已复制全部 ${usernames.length} 条用户名`, 'success');
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
    toast(`已导出 ${usernames.length} 条用户名列表`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Configuration Header */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
              用户名生成器
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              适用于社交账号、真实姓名/注册身份、游戏昵称、极客代号批量生成（最大支持 1000 条）
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={copyAll} title="复制全部生成的用户名">
              <Copy size={15} /> 复制全部
            </button>
            <button className="btn btn-secondary" onClick={exportAll} title="导出 TXT 文件">
              <FileDown size={15} /> 导出列表
            </button>
            <button className="btn btn-primary" onClick={generateBatch}>
              <RefreshCw size={15} /> 换一批
            </button>
          </div>
        </div>

        {/* Style Selection */}
        <div>
          <label className="input-label" style={{ marginBottom: '8px' }}>风格倾向</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { id: 'english', label: '英文 / 真实名 (First+Last)' },
              { id: 'cyber', label: '赛博 / 极客风' },
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

        {/* Format, Spacing & Suffix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">命名格式 (Case Format)</label>
            <select
              className="select-box"
              value={format}
              onChange={(e) => setFormat(e.target.value as CaseFormat)}
            >
              <option value="PascalCase">PascalCase (大驼峰: {useSpace ? 'Neo Matrix' : 'NeoMatrix'})</option>
              <option value="camelCase">camelCase (小驼峰: {useSpace ? 'neo Matrix' : 'neoMatrix'})</option>
              <option value="lowercase">lowercase ({useSpace ? '空格小写' : '紧凑小写'}: {useSpace ? 'neo matrix' : 'neomatrix'})</option>
              <option value="snake_case">snake_case (下划线: neo_matrix)</option>
              <option value="kebab-case">kebab-case (连字符: neo-matrix)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '22px', flexWrap: 'wrap' }}>
            <label className="switch-label" title="默认开启，词间保留空格以清晰区分 First Name 和 Last Name">
              <input
                type="checkbox"
                className="switch-input"
                checked={useSpace}
                onChange={(e) => setUseSpace(e.target.checked)}
              />
              <strong>默认有空格</strong> (区分 First/Last Name)
            </label>

            <label className="switch-label">
              <input
                type="checkbox"
                className="switch-input"
                checked={appendNumber}
                onChange={(e) => setAppendNumber(e.target.checked)}
              />
              尾部加数字
            </label>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label">生成数量: <strong>{count}</strong> 条</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[20, 50, 100, 500, 1000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.6875rem',
                      borderRadius: '4px',
                      background: count === num ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: count === num ? '#fff' : 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setCount(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="slider-input"
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="1"
                max="1000"
                value={count}
                onChange={(e) => {
                  const val = Math.min(1000, Math.max(1, Number(e.target.value) || 1));
                  setCount(val);
                }}
                className="input-text input-mono"
                style={{ width: '65px', padding: '4px 6px', fontSize: '0.8125rem', textAlign: 'center' }}
                title="最大支持 1000 条"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Usernames Grid with Modern Copy Button */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px',
          maxHeight: '620px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {usernames.map((name, idx) => (
          <div
            key={idx}
            onClick={() => copyUsername(name, idx)}
            style={{
              padding: '10px 14px',
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
              e.currentTarget.style.transform = 'translateY(-1px)';
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
                wordBreak: 'break-all',
              }}
            >
              {name}
            </span>

            <button
              className={`copy-btn ${copiedIndex === idx ? 'copied' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                copyUsername(name, idx);
              }}
              title="复制"
            >
              {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
