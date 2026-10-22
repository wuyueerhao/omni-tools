import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, FileSpreadsheet, FileJson, Check } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { TempMailService } from '../../services/tempMailService';

interface RealUSCityLocation {
  city: string;
  county: string;
  zip: string;
  areaCode: string;
  realStreets: string[];
}

interface USStateData {
  code: string;
  name: string;
  locations: RealUSCityLocation[];
}

const US_STATES_DATABASE: USStateData[] = [
  {
    code: 'TX',
    name: 'Texas',
    locations: [
      {
        city: 'Fort Worth',
        county: 'Tarrant County',
        zip: '76107',
        areaCode: '817',
        realStreets: ['Moore Avenue', 'Camp Bowie Boulevard', 'Montgomery Street', 'University Drive', 'Bailey Avenue'],
      },
      {
        city: 'Dallas',
        county: 'Dallas County',
        zip: '75201',
        areaCode: '214',
        realStreets: ['Elm Street', 'Commerce Street', 'Main Street', 'Pacific Avenue', 'Ross Avenue'],
      },
      {
        city: 'Austin',
        county: 'Travis County',
        zip: '78701',
        areaCode: '512',
        realStreets: ['Congress Avenue', 'Lavaca Street', 'Guadalupe Street', 'Colorado Street', 'Brazos Street'],
      },
      {
        city: 'Houston',
        county: 'Harris County',
        zip: '77002',
        areaCode: '713',
        realStreets: ['Travis Street', 'Louisiana Street', 'Capitol Street', 'Milam Street', 'Fannin Street'],
      },
    ],
  },
  {
    code: 'CA',
    name: 'California',
    locations: [
      {
        city: 'Los Angeles',
        county: 'Los Angeles County',
        zip: '90012',
        areaCode: '213',
        realStreets: ['Grand Avenue', 'Spring Street', 'Hope Street', 'Figueroa Street', 'Hill Street'],
      },
      {
        city: 'San Francisco',
        county: 'San Francisco County',
        zip: '94102',
        areaCode: '415',
        realStreets: ['Market Street', 'Mission Street', 'Geary Street', 'Van Ness Avenue', 'Sutter Street'],
      },
      {
        city: 'San Diego',
        county: 'San Diego County',
        zip: '92101',
        areaCode: '619',
        realStreets: ['Broadway', 'Ash Street', 'Front Street', 'State Street', 'Union Street'],
      },
      {
        city: 'San Jose',
        county: 'Santa Clara County',
        zip: '95113',
        areaCode: '408',
        realStreets: ['First Street', 'Market Street', 'Santa Clara Street', 'San Fernando Street'],
      },
    ],
  },
  {
    code: 'NY',
    name: 'New York',
    locations: [
      {
        city: 'New York',
        county: 'New York County (Manhattan)',
        zip: '10001',
        areaCode: '212',
        realStreets: ['7th Avenue', 'Broadway', '8th Avenue', 'W 34th Street', 'Americas Avenue'],
      },
      {
        city: 'Brooklyn',
        county: 'Kings County',
        zip: '11201',
        areaCode: '718',
        realStreets: ['Atlantic Avenue', 'Fulton Street', 'Court Street', 'Joralemon Street', 'Adams Street'],
      },
      {
        city: 'Buffalo',
        county: 'Erie County',
        zip: '14202',
        areaCode: '716',
        realStreets: ['Main Street', 'Delaware Avenue', 'Pearl Street', 'Church Street', 'Franklin Street'],
      },
    ],
  },
  {
    code: 'FL',
    name: 'Florida',
    locations: [
      {
        city: 'Miami',
        county: 'Miami-Dade County',
        zip: '33130',
        areaCode: '305',
        realStreets: ['Brickell Avenue', 'Biscayne Boulevard', 'SW 8th Street', 'S Miami Avenue', 'Flagler Street'],
      },
      {
        city: 'Orlando',
        county: 'Orange County',
        zip: '32801',
        areaCode: '407',
        realStreets: ['Orange Avenue', 'Magnolia Avenue', 'Rosalind Avenue', 'Central Boulevard', 'Church Street'],
      },
      {
        city: 'Tampa',
        county: 'Hillsborough County',
        zip: '33602',
        areaCode: '813',
        realStreets: ['Tampa Street', 'Florida Avenue', 'Franklin Street', 'Ashley Drive', 'Kennedy Boulevard'],
      },
    ],
  },
  {
    code: 'WA',
    name: 'Washington',
    locations: [
      {
        city: 'Seattle',
        county: 'King County',
        zip: '98101',
        areaCode: '206',
        realStreets: ['Pike Street', 'Pine Street', '4th Avenue', '5th Avenue', 'Stewart Street'],
      },
      {
        city: 'Bellevue',
        county: 'King County',
        zip: '98004',
        areaCode: '425',
        realStreets: ['Bellevue Way NE', 'NE 8th Street', '106th Avenue NE', 'Main Street'],
      },
    ],
  },
  {
    code: 'IL',
    name: 'Illinois',
    locations: [
      {
        city: 'Chicago',
        county: 'Cook County',
        zip: '60601',
        areaCode: '312',
        realStreets: ['Michigan Avenue', 'State Street', 'Wacker Drive', 'Dearborn Street', 'Clark Street'],
      },
    ],
  },
];

// Chinese Mock Database
const CN_PROVINCES = [
  { province: '广东省', city: '深圳市', county: '南山区', zip: '518057', prefix: '440305', streets: ['高新南环路', '科技南路', '科苑大道', '深南大道'] },
  { province: '北京市', city: '北京市', county: '朝阳区', zip: '100020', prefix: '110105', streets: ['建国门外大街', '朝阳北路', '东三环中路', '光华路'] },
  { province: '上海市', city: '上海市', county: '浦东新区', zip: '200120', prefix: '310115', streets: ['世纪大道', '陆家嘴环路', '张江路', '张衡路'] },
  { province: '浙江省', city: '杭州市', county: '西湖区', zip: '310013', prefix: '330106', streets: ['文三西路', '天目山路', '文一西路', '教工路'] },
];

export interface DetailedIdentity {
  id: string;
  country: 'US' | 'CN';
  // 基本资料
  fullName: string;
  gender: 'Male' | 'Female' | '男' | '女';
  birthDate: string; // 1/27/1975
  title: string; // Mr. / Ms.
  hairColor: string; // Brown, Black, Blonde

  // 地址
  street: string; // 160 Moore Avenue
  county: string; // Tarrant County
  city: string; // Fort Worth
  state: string; // TX
  stateName: string; // Texas
  zipCode: string; // 76107
  phone: string; // 817-733-2396
  tempEmail: string;

  // 就业 & 信用卡
  cardType: string; // MasterCard / Visa / American Express
  cardNumber: string; // 5409...
  cvv2: string; // 881
  expireDate: string; // 09/2028
  occupation: string; // Logging Equipment Operator, Informatics Nurse Specialist
  companyName: string; // Omni Tech
  companySize: string; // 19-50 employees
  employmentStatus: string; // Part-time work / Full-time work
  monthlySalary: string; // $5,700
  ssn: string; // 858-44-6370
  idCardCn?: string; // 身份证号码
}

// Luhn Algorithm generator for valid test card numbers
function generateLuhnCardNumber(prefix: string, length: number): string {
  let card = prefix;
  while (card.length < length - 1) {
    card += Math.floor(Math.random() * 10);
  }
  // calculate checksum
  let sum = 0;
  let doubleUp = true;
  for (let i = card.length - 1; i >= 0; i--) {
    let digit = parseInt(card[i], 10);
    if (doubleUp) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleUp = !doubleUp;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return card + checkDigit;
}

interface IdentityToolProps {
  onNavigateToTempMail?: (email: string) => void;
}

export const IdentityTool: React.FC<IdentityToolProps> = ({ onNavigateToTempMail }) => {
  const { toast } = useToast();
  const [targetCountry, setTargetCountry] = useState<'US' | 'CN'>('US'); // 默认美国
  const [selectedStateCode, setSelectedStateCode] = useState<string>('ALL'); // 默认全美
  const [identity, setIdentity] = useState<DetailedIdentity | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const FIRST_NAMES_M = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel'];
  const FIRST_NAMES_F = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa'];
  const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Moore', 'Wilson'];
  const HAIR_COLORS = ['Brown', 'Black', 'Blonde', 'Auburn', 'Chestnut', 'Gray'];
  const OCCUPATIONS = [
    'Logging Equipment Operator, Informatics Nurse Specialist',
    'Senior Software Engineer & Cloud Architect',
    'Data Scientist, Financial Risk Analyst',
    'Biomedical Engineer, Clinical Research Associate',
    'Operations Manager, Supply Chain Consultant',
    'Digital Marketing Strategist, SEO Lead',
    'Product Designer & UX Researcher',
  ];
  const COMPANIES = ['Omni Tech', 'Apex Solutions', 'Nexus Systems', 'Summit Dynamics', 'Vanguard Innovations', 'Horizon Global'];
  const COMPANY_SIZES = ['1-10 employees', '19-50 employees', '51-200 employees', '201-500 employees', '500+ employees'];
  const EMPLOYMENT_STATUSES = ['Full-time work', 'Part-time work', 'Contract', 'Self-employed'];

  const generateSingleIdentity = (): DetailedIdentity => {
    if (targetCountry === 'US') {
      let stateData: USStateData;
      if (selectedStateCode !== 'ALL') {
        stateData = US_STATES_DATABASE.find((s) => s.code === selectedStateCode) || US_STATES_DATABASE[0];
      } else {
        stateData = US_STATES_DATABASE[Math.floor(Math.random() * US_STATES_DATABASE.length)];
      }

      const loc = stateData.locations[Math.floor(Math.random() * stateData.locations.length)];
      const isMale = Math.random() > 0.5;
      const firstName = isMale
        ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)]
        : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const fullName = `${firstName} ${lastName}`;

      // Birthdate: e.g. 1/27/1975
      const birthYear = Math.floor(Math.random() * 35) + 1968;
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthDate = `${birthMonth}/${birthDay}/${birthYear}`;

      // Real street address
      const streetNum = Math.floor(Math.random() * 800) + 10;
      const streetName = loc.realStreets[Math.floor(Math.random() * loc.realStreets.length)];
      const street = `${streetNum} ${streetName}`;

      // Phone: Real Area Code format: e.g. 817-733-2396
      const p1 = Math.floor(Math.random() * 800 + 200);
      const p2 = Math.floor(Math.random() * 9000 + 1000);
      const phone = `${loc.areaCode}-${p1}-${p2}`;

      // SSN: e.g. 858-44-6370
      const s1 = Math.floor(Math.random() * 800 + 100);
      const s2 = (Math.floor(Math.random() * 90) + 10).toString().padStart(2, '0');
      const s3 = Math.floor(Math.random() * 9000 + 1000);
      const ssn = `${s1}-${s2}-${s3}`;

      // Credit card: Visa (4) or MasterCard (51-55)
      const isMaster = Math.random() > 0.5;
      const cardType = isMaster ? 'MasterCard' : 'Visa';
      const cardPrefix = isMaster ? '54' : '45';
      const cardNumber = generateLuhnCardNumber(cardPrefix, 16);
      const cvv2 = Math.floor(Math.random() * 900 + 100).toString();

      // Expiry: e.g. 09/2028
      const expMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
      const expYear = 2027 + Math.floor(Math.random() * 4);
      const expireDate = `${expMonth}/${expYear}`;

      // Salary
      const salary = `$${(Math.floor(Math.random() * 80) * 100 + 3500).toLocaleString()}`;

      // Temp email address (linked to TempMailService)
      const emailPrefix = `${firstName.toLowerCase()}${lastName.toLowerCase().substring(0, 3)}_${Math.random().toString(36).substring(2, 6)}`;
      const tempEmail = TempMailService.generateRandomAddress(emailPrefix);

      return {
        id: Math.random().toString(36).substring(2, 9),
        country: 'US',
        fullName,
        gender: isMale ? 'Male' : 'Female',
        birthDate,
        title: isMale ? 'Mr.' : 'Ms.',
        hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
        street,
        county: loc.county,
        city: loc.city,
        state: stateData.code,
        stateName: stateData.name,
        zipCode: loc.zip,
        phone,
        tempEmail,
        cardType,
        cardNumber,
        cvv2,
        expireDate,
        occupation: OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)],
        companyName: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
        companySize: COMPANY_SIZES[Math.floor(Math.random() * COMPANY_SIZES.length)],
        employmentStatus: EMPLOYMENT_STATUSES[Math.floor(Math.random() * EMPLOYMENT_STATUSES.length)],
        monthlySalary: salary,
        ssn,
      };
    } else {
      // CN Mode
      const loc = CN_PROVINCES[Math.floor(Math.random() * CN_PROVINCES.length)];
      const isMale = Math.random() > 0.5;
      const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
      const givenM = ['伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '明', '浩'];
      const givenF = ['芳', '娜', '敏', '静', '丽', '洁', '艳', '丹', '雪', '婷'];
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const given = isMale
        ? givenM[Math.floor(Math.random() * givenM.length)]
        : givenF[Math.floor(Math.random() * givenF.length)];
      const fullName = surname + given;

      const birthYear = Math.floor(Math.random() * 30) + 1975;
      const birthMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
      const birthDay = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
      const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

      // ISO 7064 ID Card
      const seq = Math.floor(Math.random() * 49) * 2 + (isMale ? 1 : 0);
      const seqStr = seq.toString().padStart(3, '0');
      const base17 = `${loc.prefix}${birthYear}${birthMonth}${birthDay}${seqStr}`;
      const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const checkDigits = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
      let sum = 0;
      for (let i = 0; i < 17; i++) sum += parseInt(base17[i], 10) * weights[i];
      const idCardCn = `${base17}${checkDigits[sum % 11]}`;

      const street = `${loc.streets[Math.floor(Math.random() * loc.streets.length)]}${Math.floor(Math.random() * 300) + 1}号`;
      const phone = `138${Math.floor(Math.random() * 90000000 + 10000000)}`;
      const tempEmail = TempMailService.generateRandomAddress(`cn_${Math.random().toString(36).substring(2, 8)}`);

      return {
        id: Math.random().toString(36).substring(2, 9),
        country: 'CN',
        fullName,
        gender: isMale ? '男' : '女',
        birthDate,
        title: isMale ? '先生' : '女士',
        hairColor: '黑色',
        street,
        county: loc.county,
        city: loc.city,
        state: loc.province,
        stateName: loc.province,
        zipCode: loc.zip,
        phone,
        tempEmail,
        cardType: '银联 UnionPay',
        cardNumber: generateLuhnCardNumber('6222', 19),
        cvv2: Math.floor(Math.random() * 900 + 100).toString(),
        expireDate: '12/2028',
        occupation: '高级软件工程师',
        companyName: '极客创新科技有限公司',
        companySize: '51-200 人',
        employmentStatus: '全职工作',
        monthlySalary: '¥28,500',
        ssn: '无',
        idCardCn,
      };
    }
  };

  const regenerate = () => {
    const data = generateSingleIdentity();
    setIdentity(data);
  };

  useEffect(() => {
    regenerate();
  }, [targetCountry, selectedStateCode]);

  const copyField = (val: string, keyName: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(keyName);
    toast(`已复制 ${keyName}: ${val}`, 'success');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const copyAll = () => {
    if (!identity) return;
    const formatted = `
【基本资料】
全名: ${identity.fullName}
性别: ${identity.gender}
生日: ${identity.birthDate}
Title: ${identity.title}
头发颜色: ${identity.hairColor}

【地址信息】
街道: ${identity.street}
区县: ${identity.county}
城市: ${identity.city}
州代码: ${identity.state}
州全称: ${identity.stateName}
邮编: ${identity.zipCode}
电话号码: ${identity.phone}
临时邮箱: ${identity.tempEmail}

【就业 & 信用卡】
信用卡类型: ${identity.cardType}
信用卡号: ${identity.cardNumber}
CVV2: ${identity.cvv2}
过期时间: ${identity.expireDate}
职业: ${identity.occupation}
公司名称: ${identity.companyName}
公司规模: ${identity.companySize}
就业状态: ${identity.employmentStatus}
月薪: ${identity.monthlySalary}
社会保障号 (SSN): ${identity.ssn}
${identity.idCardCn ? `身份证号: ${identity.idCardCn}` : ''}
    `.trim();

    navigator.clipboard.writeText(formatted);
    toast('已复制完整身份档案到剪贴板', 'success');
  };

  const exportJson = () => {
    if (!identity) return;
    const blob = new Blob([JSON.stringify(identity, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity_${identity.fullName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出身份 JSON', 'success');
  };

  const exportCsv = () => {
    if (!identity) return;
    const headers = Object.keys(identity).join(',');
    const values = Object.values(identity)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
    const blob = new Blob(['\uFEFF' + headers + '\n' + values], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity_${identity.fullName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 CSV 表格', 'success');
  };

  const renderRow = (label: string, value: string, keyName: string, isLinkToMail = false) => {
    const isCopied = copiedKey === keyName;
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 60px',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '0.875rem',
        }}
      >
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: ['卡号', '邮编', '电话', 'SSN', '生日', 'CVV2'].some((k) => label.includes(k))
                ? 'var(--font-mono)'
                : 'inherit',
              wordBreak: 'break-word',
            }}
          >
            {value}
          </span>
          {isLinkToMail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                (已就绪，
                <button
                  type="button"
                  onClick={() => onNavigateToTempMail?.(value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  点击联动接收邮件
                </button>
                )
              </span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            className="btn-ghost"
            style={{ padding: '4px 8px', borderRadius: '4px', color: isCopied ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
            onClick={() => copyField(value, label)}
            title="点击复制"
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Filter and Actions Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Country & State Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>地区:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`btn ${targetCountry === 'US' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                onClick={() => setTargetCountry('US')}
              >
                🇺🇸 美国 (默认)
              </button>
              <button
                className={`btn ${targetCountry === 'CN' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                onClick={() => setTargetCountry('CN')}
              >
                🇨🇳 中国
              </button>
            </div>
          </div>

          {targetCountry === 'US' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>选择州 (State):</span>
              <select
                className="select-box"
                style={{ width: '180px', padding: '6px 10px', fontSize: '0.8125rem' }}
                value={selectedStateCode}
                onChange={(e) => setSelectedStateCode(e.target.value)}
              >
                <option value="ALL">全美随机 (All States)</option>
                <option value="TX">德克萨斯州 Texas (TX)</option>
                <option value="CA">加利福尼亚州 California (CA)</option>
                <option value="NY">纽约州 New York (NY)</option>
                <option value="FL">佛罗里达州 Florida (FL)</option>
                <option value="WA">华盛顿州 Washington (WA)</option>
                <option value="IL">伊利诺伊州 Illinois (IL)</option>
              </select>
            </div>
          )}
        </div>

        {/* Global Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={copyAll}>
            <Copy size={15} /> 复制全部档案
          </button>
          <button className="btn btn-secondary" onClick={exportJson}>
            <FileJson size={15} /> 导出 JSON
          </button>
          <button className="btn btn-secondary" onClick={exportCsv}>
            <FileSpreadsheet size={15} /> 导出 CSV
          </button>
          <button className="btn btn-primary" onClick={regenerate}>
            <RefreshCw size={15} /> 随机换一个
          </button>
        </div>
      </div>

      {identity && (
        <div
          className="glass-panel"
          style={{
            padding: 0,
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
          }}
        >
          {/* Section 1: 基本资料 */}
          <div>
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(99, 102, 241, 0.08)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
              }}
            >
              基本资料
            </div>
            {renderRow('全名', identity.fullName, '全名')}
            {renderRow('性别', identity.gender, '性别')}
            {renderRow('生日', identity.birthDate, '生日')}
            {renderRow('Title', identity.title, 'Title')}
            {renderRow('头发颜色', identity.hairColor, '头发颜色')}
          </div>

          {/* Section 2: 地址 */}
          <div>
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(6, 182, 212, 0.08)',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
              }}
            >
              地址
            </div>
            {renderRow('街道', identity.street, '街道')}
            {renderRow('区县', identity.county, '区县')}
            {renderRow('城市', identity.city, '城市')}
            {renderRow('州', identity.state, '州')}
            {renderRow('州全称', identity.stateName, '州全称')}
            {renderRow('邮编', identity.zipCode, '邮编')}
            {renderRow('电话号码', identity.phone, '电话号码')}
            {renderRow('临时邮箱', identity.tempEmail, '临时邮箱', true)}
          </div>

          {/* Section 3: 就业 & 信用卡 */}
          <div>
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderTop: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--accent-emerald)',
              }}
            >
              就业 & 信用卡
            </div>
            {renderRow('信用卡类型', identity.cardType, '信用卡类型')}
            {renderRow('信用卡号', identity.cardNumber, '信用卡号')}
            {renderRow('CVV2', identity.cvv2, 'CVV2')}
            {renderRow('过期时间', identity.expireDate, '过期时间')}
            {renderRow('职业', identity.occupation, '职业')}
            {renderRow('公司名称', identity.companyName, '公司名称')}
            {renderRow('公司规模', identity.companySize, '公司规模')}
            {renderRow('就业状态', identity.employmentStatus, '就业状态')}
            {renderRow('月薪', identity.monthlySalary, '月薪')}
            {renderRow('社会保障号', identity.ssn, '社会保障号')}
            {identity.idCardCn && renderRow('身份证号 (ISO 7064)', identity.idCardCn, '身份证号')}
          </div>
        </div>
      )}
    </div>
  );
};
