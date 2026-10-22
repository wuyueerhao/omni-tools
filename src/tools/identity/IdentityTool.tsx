import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, FileSpreadsheet, FileJson, MapPin, ShieldAlert } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type CountryCode = 'CN' | 'US';

interface MockIdentity {
  id: string;
  country: CountryCode;
  fullName: string;
  gender: '男' | '女' | 'Male' | 'Female';
  age: number;
  birthDate: string;
  idNumber: string; // 身份证/SSN
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

// Data pools for CN
const CN_SURNAMES = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const CN_GIVEN_NAMES_M = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '超', '明', '浩', '辉', '刚', '平', '志强', '建华', '天宇', '子豪'];
const CN_GIVEN_NAMES_F = ['芳', '娜', '敏', '静', '丽', '秀英', '洁', '艳', '丹', '雪', '婷', '琳', '思琪', '雨桐', '欣怡', '美琪'];
const CN_CITIES = [
  { province: '北京市', city: '朝阳区', zip: '100020', prefix: '110105' },
  { province: '北京市', city: '海淀区', zip: '100080', prefix: '110108' },
  { province: '上海市', city: '浦东新区', zip: '200120', prefix: '310115' },
  { province: '上海市', city: '徐汇区', zip: '200030', prefix: '310104' },
  { province: '广东省', city: '深圳市南山区', zip: '518057', prefix: '440305' },
  { province: '广东省', city: '广州市天河区', zip: '510630', prefix: '440106' },
  { province: '浙江省', city: '杭州市西湖区', zip: '310013', prefix: '330106' },
  { province: '江苏省', city: '南京市玄武区', zip: '210008', prefix: '320102' },
  { province: '四川省', city: '成都市武侯区', zip: '610041', prefix: '510107' },
];
const CN_STREETS = ['科技大道', '创新一路', '人民路', '中山北路', '建设东街', '金科路', '文三西路', '高新南环路', '创业软件园'];

// Data pools for US
const US_FIRST_NAMES_M = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew'];
const US_FIRST_NAMES_F = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Emily'];
const US_LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'];
const US_CITIES = [
  { state: 'California', city: 'Los Angeles', zip: '90001', areaCode: '213' },
  { state: 'California', city: 'San Francisco', zip: '94102', areaCode: '415' },
  { state: 'New York', city: 'New York', zip: '10001', areaCode: '212' },
  { state: 'Texas', city: 'Austin', zip: '78701', areaCode: '512' },
  { state: 'Washington', city: 'Seattle', zip: '98101', areaCode: '206' },
  { state: 'Florida', city: 'Miami', zip: '33101', areaCode: '305' },
  { state: 'Illinois', city: 'Chicago', zip: '60601', areaCode: '312' },
];
const US_STREETS = ['Oak Street', 'Maple Avenue', 'Cedar Lane', 'Sunset Boulevard', 'Pine Street', 'Market Street', 'Broad Avenue'];

export const IdentityTool: React.FC = () => {
  const { toast } = useToast();
  const [country, setCountry] = useState<CountryCode>('CN');
  const [count, setCount] = useState<number>(5);
  const [records, setRecords] = useState<MockIdentity[]>([]);

  // Generate ISO 7064:1983.MOD 11-2 Chinese ID Card Number
  const generateCnIdCard = (areaPrefix: string, birthDateStr: string, isMale: boolean): string => {
    const seq = Math.floor(Math.random() * 49) * 2 + (isMale ? 1 : 0);
    const seqStr = seq.toString().padStart(3, '0');
    const base17 = `${areaPrefix}${birthDateStr}${seqStr}`;

    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkDigits = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(base17[i], 10) * weights[i];
    }
    const checkChar = checkDigits[sum % 11];
    return `${base17}${checkChar}`;
  };

  const generateIdentity = (c: CountryCode): MockIdentity => {
    const isMale = Math.random() > 0.5;
    const age = Math.floor(Math.random() * 40) + 20; // 20 - 59
    const year = 2026 - age;
    const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
    const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
    const birthDate = `${year}-${month}-${day}`;
    const id = Math.random().toString(36).substring(2, 9);

    if (c === 'CN') {
      const surname = CN_SURNAMES[Math.floor(Math.random() * CN_SURNAMES.length)];
      const given = isMale
        ? CN_GIVEN_NAMES_M[Math.floor(Math.random() * CN_GIVEN_NAMES_M.length)]
        : CN_GIVEN_NAMES_F[Math.floor(Math.random() * CN_GIVEN_NAMES_F.length)];
      const fullName = `${surname}${given}`;
      const loc = CN_CITIES[Math.floor(Math.random() * CN_CITIES.length)];
      const birthCompact = `${year}${month}${day}`;
      const idNumber = generateCnIdCard(loc.prefix, birthCompact, isMale);

      const phonePrefixes = ['138', '139', '150', '186', '189', '198', '177'];
      const phone = `${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}${Math.floor(Math.random() * 90000000 + 10000000)}`;
      const streetNum = Math.floor(Math.random() * 200) + 1;
      const street = CN_STREETS[Math.floor(Math.random() * CN_STREETS.length)];
      const address = `${loc.province}${loc.city}${street}${streetNum}号`;
      const email = `test_${Math.random().toString(36).substring(2, 8)}@example.com`;

      return {
        id,
        country: 'CN',
        fullName,
        gender: isMale ? '男' : '女',
        age,
        birthDate,
        idNumber,
        phone,
        email,
        address,
        city: loc.city,
        state: loc.province,
        zipCode: loc.zip,
      };
    } else {
      // US Mode
      const first = isMale
        ? US_FIRST_NAMES_M[Math.floor(Math.random() * US_FIRST_NAMES_M.length)]
        : US_FIRST_NAMES_F[Math.floor(Math.random() * US_FIRST_NAMES_F.length)];
      const last = US_LAST_NAMES[Math.floor(Math.random() * US_LAST_NAMES.length)];
      const fullName = `${first} ${last}`;
      const loc = US_CITIES[Math.floor(Math.random() * US_CITIES.length)];

      const s1 = Math.floor(Math.random() * 899 + 100);
      const s2 = Math.floor(Math.random() * 89 + 10);
      const s3 = Math.floor(Math.random() * 8999 + 1000);
      const idNumber = `${s1}-${s2}-${s3}`; // Mock SSN

      const p1 = Math.floor(Math.random() * 899 + 100);
      const p2 = Math.floor(Math.random() * 8999 + 1000);
      const phone = `+1 (${loc.areaCode}) ${p1}-${p2}`;

      const streetNum = Math.floor(Math.random() * 900) + 100;
      const street = US_STREETS[Math.floor(Math.random() * US_STREETS.length)];
      const address = `${streetNum} ${street}, Apt ${Math.floor(Math.random() * 50) + 1}`;
      const email = `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 90 + 10)}@example.com`;

      return {
        id,
        country: 'US',
        fullName,
        gender: isMale ? 'Male' : 'Female',
        age,
        birthDate,
        idNumber,
        phone,
        email,
        address,
        city: loc.city,
        state: loc.state,
        zipCode: loc.zip,
      };
    }
  };

  const regenerate = () => {
    const list: MockIdentity[] = [];
    for (let i = 0; i < count; i++) {
      list.push(generateIdentity(country));
    }
    setRecords(list);
  };

  useEffect(() => {
    regenerate();
  }, [country, count]);

  const copyVal = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast(`已复制 ${label}: ${val}`, 'success');
  };

  const exportJson = () => {
    const json = JSON.stringify(records, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock_identities_${country}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 JSON 文件', 'success');
  };

  const exportCsv = () => {
    const headers = ['Country', 'Name', 'Gender', 'Age', 'BirthDate', 'ID_Number', 'Phone', 'Email', 'Address', 'City', 'State', 'Zip'];
    const rows = records.map((r) => [
      r.country,
      `"${r.fullName}"`,
      r.gender,
      r.age,
      r.birthDate,
      `"${r.idNumber}"`,
      `"${r.phone}"`,
      r.email,
      `"${r.address}"`,
      `"${r.city}"`,
      `"${r.state}"`,
      r.zipCode,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock_identities_${country}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 CSV 文件', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--accent-amber)',
          fontSize: '0.8125rem',
        }}
      >
        <ShieldAlert size={18} />
        <span>
          <strong>测试数据免责声明：</strong>所有身份证号/SSN号、姓名与地址均为程序算法随机生成的虚拟测试数据，仅供软件开发、API自动化测试与表单验证使用，严禁用于违法违规用途。
        </span>
      </div>

      {/* Control Bar */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>目标地区:</span>
          <button
            className={`btn ${country === 'CN' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCountry('CN')}
          >
            🇨🇳 中国 (真实校验位/真实邮编)
          </button>
          <button
            className={`btn ${country === 'US' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCountry('US')}
          >
            🇺🇸 美国 (真实州县/ZIP格式/SSN)
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="select-box"
            style={{ width: '100px', padding: '6px 10px', fontSize: '0.8125rem' }}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            <option value={3}>3 条</option>
            <option value={5}>5 条</option>
            <option value={10}>10 条</option>
            <option value={20}>20 条</option>
          </select>

          <button className="btn btn-primary" onClick={regenerate}>
            <RefreshCw size={15} /> 重新生成
          </button>
          <button className="btn btn-secondary" onClick={exportJson}>
            <FileJson size={15} /> 导出 JSON
          </button>
          <button className="btn btn-secondary" onClick={exportCsv}>
            <FileSpreadsheet size={15} /> 导出 CSV
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {records.map((r, idx) => (
          <div
            key={r.id}
            className="glass-panel"
            style={{
              padding: '20px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
              <span className="badge badge-primary">#{idx + 1}</span>
            </div>

            {/* Name & Gender */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>姓名 / 性别 / 年龄</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {r.fullName}
                </span>
                <span className="badge badge-emerald">{r.gender}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{r.age} 岁</span>
                <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => copyVal(r.fullName, '姓名')}>
                  <Copy size={13} />
                </button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                出生日期: {r.birthDate}
              </div>
            </div>

            {/* ID Number */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {country === 'CN' ? '身份证号 (ISO 7064校验)' : 'SSN 虚拟号码'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  {r.idNumber}
                </span>
                <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => copyVal(r.idNumber, '证件号')}>
                  <Copy size={13} />
                </button>
              </div>
            </div>

            {/* Phone & Email */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>虚拟手机 / 邮箱</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{r.phone}</span>
                <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => copyVal(r.phone, '手机号')}>
                  <Copy size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.email}</span>
                <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => copyVal(r.email, '邮箱')}>
                  <Copy size={12} />
                </button>
              </div>
            </div>

            {/* Address */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>详细地址与邮编</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <MapPin size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                  {r.address}
                </span>
                <span className="badge badge-cyan" style={{ marginLeft: '4px' }}>ZIP: {r.zipCode}</span>
                <button className="btn-ghost" style={{ padding: '2px 4px' }} onClick={() => copyVal(`${r.address} (邮编: ${r.zipCode})`, '完整地址')}>
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
