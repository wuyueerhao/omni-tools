import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, FileSpreadsheet, FileJson, Check } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { TempMailService } from '../../services/tempMailService';

export interface LocationDetail {
  city: string;
  county: string;
  zip: string;
  areaCode: string;
  streets: string[];
}

export interface RegionData {
  code: string;
  name: string;
  locations: LocationDetail[];
}

export interface CountryMeta {
  code: string;
  name: string;
  nameEn: string;
  flag: string;
  regionLabel: string; // 州 / 郡 / 联邦州 / 都道府县 / 地区
  regions: RegionData[];
  currencySymbol: string;
  idLabel: string; // 社会保障号 / NIN / TFN / 身份证等
}

export const COUNTRIES_DATABASE: CountryMeta[] = [
  {
    code: 'US',
    name: '美国',
    nameEn: 'United States',
    flag: '🇺🇸',
    regionLabel: '州 (State)',
    currencySymbol: '$',
    idLabel: '社会保障号 (SSN)',
    regions: [
      {
        code: 'TX',
        name: 'Texas',
        locations: [
          { city: 'Fort Worth', county: 'Tarrant County', zip: '76107', areaCode: '817', streets: ['Moore Avenue', 'Camp Bowie Boulevard', 'University Drive', 'Montgomery Street'] },
          { city: 'Dallas', county: 'Dallas County', zip: '75201', areaCode: '214', streets: ['Elm Street', 'Commerce Street', 'Main Street', 'Ross Avenue'] },
          { city: 'Austin', county: 'Travis County', zip: '78701', areaCode: '512', streets: ['Congress Avenue', 'Guadalupe Street', 'Lavaca Street', 'Colorado Street'] },
          { city: 'Houston', county: 'Harris County', zip: '77002', areaCode: '713', streets: ['Travis Street', 'Capitol Street', 'Louisiana Street', 'Milam Street'] },
        ],
      },
      {
        code: 'CA',
        name: 'California',
        locations: [
          { city: 'Los Angeles', county: 'Los Angeles County', zip: '90012', areaCode: '213', streets: ['Grand Avenue', 'Spring Street', 'Hope Street', 'Figueroa Street'] },
          { city: 'San Francisco', county: 'San Francisco County', zip: '94102', areaCode: '415', streets: ['Market Street', 'Mission Street', 'Geary Street', 'Van Ness Avenue'] },
          { city: 'San Diego', county: 'San Diego County', zip: '92101', areaCode: '619', streets: ['Broadway', 'Ash Street', 'Front Street', 'State Street'] },
          { city: 'San Jose', county: 'Santa Clara County', zip: '95113', areaCode: '408', streets: ['First Street', 'Market Street', 'Santa Clara Street'] },
        ],
      },
      {
        code: 'NY',
        name: 'New York',
        locations: [
          { city: 'New York', county: 'New York County (Manhattan)', zip: '10001', areaCode: '212', streets: ['7th Avenue', 'Broadway', '8th Avenue', 'W 34th Street'] },
          { city: 'Brooklyn', county: 'Kings County', zip: '11201', areaCode: '718', streets: ['Atlantic Avenue', 'Fulton Street', 'Court Street', 'Adams Street'] },
        ],
      },
      {
        code: 'FL',
        name: 'Florida',
        locations: [
          { city: 'Miami', county: 'Miami-Dade County', zip: '33130', areaCode: '305', streets: ['Brickell Avenue', 'Biscayne Boulevard', 'SW 8th Street', 'S Miami Avenue'] },
          { city: 'Orlando', county: 'Orange County', zip: '32801', areaCode: '407', streets: ['Orange Avenue', 'Magnolia Avenue', 'Rosalind Avenue'] },
        ],
      },
      {
        code: 'WA',
        name: 'Washington',
        locations: [
          { city: 'Seattle', county: 'King County', zip: '98101', areaCode: '206', streets: ['Pike Street', 'Pine Street', '4th Avenue', 'Stewart Street'] },
        ],
      },
      {
        code: 'IL',
        name: 'Illinois',
        locations: [
          { city: 'Chicago', county: 'Cook County', zip: '60601', areaCode: '312', streets: ['Michigan Avenue', 'State Street', 'Wacker Drive', 'Dearborn Street'] },
        ],
      },
    ],
  },
  {
    code: 'GB',
    name: '英国',
    nameEn: 'United Kingdom',
    flag: '🇬🇧',
    regionLabel: '地区/郡 (Region/County)',
    currencySymbol: '£',
    idLabel: '国民保险号 (NIN)',
    regions: [
      {
        code: 'LDN',
        name: 'Greater London',
        locations: [
          { city: 'London', county: 'Westminster', zip: 'SW1A 1AA', areaCode: '020', streets: ['Oxford Street', 'Baker Street', 'Regent Street', 'Victoria Street'] },
          { city: 'London', county: 'Camden', zip: 'NW1 2DB', areaCode: '020', streets: ['Camden High Street', 'Chalk Farm Road', 'Euston Road'] },
        ],
      },
      {
        code: 'MAN',
        name: 'Greater Manchester',
        locations: [
          { city: 'Manchester', county: 'Greater Manchester', zip: 'M1 1AE', areaCode: '0161', streets: ['Deansgate', 'Market Street', 'King Street', 'Portland Street'] },
        ],
      },
      {
        code: 'BIR',
        name: 'West Midlands',
        locations: [
          { city: 'Birmingham', county: 'West Midlands', zip: 'B1 1BB', areaCode: '0121', streets: ['New Street', 'Colmore Row', 'Broad Street'] },
        ],
      },
      {
        code: 'EDI',
        name: 'Scotland',
        locations: [
          { city: 'Edinburgh', county: 'City of Edinburgh', zip: 'EH1 1YZ', areaCode: '0131', streets: ['Princes Street', 'Royal Mile', 'George Street'] },
        ],
      },
    ],
  },
  {
    code: 'DE',
    name: '德国',
    nameEn: 'Germany',
    flag: '🇩🇪',
    regionLabel: '联邦州 (State)',
    currencySymbol: '€',
    idLabel: '德国个人税号 (Steuer-ID)',
    regions: [
      {
        code: 'BER',
        name: 'Berlin',
        locations: [
          { city: 'Berlin', county: 'Mitte', zip: '10115', areaCode: '030', streets: ['Friedrichstraße', 'Unter den Linden', 'Torstraße', 'Chausseestraße'] },
        ],
      },
      {
        code: 'BAV',
        name: 'Bavaria',
        locations: [
          { city: 'Munich', county: 'Oberbayern', zip: '80331', areaCode: '089', streets: ['Maximilianstraße', 'Leopoldstraße', 'Sendlinger Straße'] },
        ],
      },
      {
        code: 'HES',
        name: 'Hesse',
        locations: [
          { city: 'Frankfurt', county: 'Darmstadt', zip: '60311', areaCode: '069', streets: ['Zeil', 'Mainzer Landstraße', 'Kaiserstraße'] },
        ],
      },
    ],
  },
  {
    code: 'AU',
    name: '澳大利亚',
    nameEn: 'Australia',
    flag: '🇦🇺',
    regionLabel: '州/领地 (State)',
    currencySymbol: 'A$',
    idLabel: '税号 (TFN)',
    regions: [
      {
        code: 'NSW',
        name: 'New South Wales',
        locations: [
          { city: 'Sydney', county: 'City of Sydney', zip: '2000', areaCode: '02', streets: ['George Street', 'Pitt Street', 'Castlereagh Street', 'Macquarie Street'] },
        ],
      },
      {
        code: 'VIC',
        name: 'Victoria',
        locations: [
          { city: 'Melbourne', county: 'City of Melbourne', zip: '3000', areaCode: '03', streets: ['Collins Street', 'Bourke Street', 'Flinders Street', 'Swanston Street'] },
        ],
      },
      {
        code: 'QLD',
        name: 'Queensland',
        locations: [
          { city: 'Brisbane', county: 'Brisbane City', zip: '4000', areaCode: '07', streets: ['Queen Street', 'Adelaide Street', 'Ann Street'] },
        ],
      },
    ],
  },
  {
    code: 'FR',
    name: '法国',
    nameEn: 'France',
    flag: '🇫🇷',
    regionLabel: '大区 (Region)',
    currencySymbol: '€',
    idLabel: '社保号 (Numéro Sécurité Sociale)',
    regions: [
      {
        code: 'IDF',
        name: 'Île-de-France',
        locations: [
          { city: 'Paris', county: 'Paris', zip: '75001', areaCode: '01', streets: ['Rue de Rivoli', 'Boulevard Saint-Germain', 'Avenue des Champs-Élysées'] },
        ],
      },
      {
        code: 'ARA',
        name: 'Auvergne-Rhône-Alpes',
        locations: [
          { city: 'Lyon', county: 'Rhône', zip: '69001', areaCode: '04', streets: ['Rue de la République', 'Place Bellecour', 'Rue Victor Hugo'] },
        ],
      },
    ],
  },
  {
    code: 'IT',
    name: '意大利',
    nameEn: 'Italy',
    flag: '🇮🇹',
    regionLabel: '大区 (Region)',
    currencySymbol: '€',
    idLabel: '税号 (Codice Fiscale)',
    regions: [
      {
        code: 'LAZ',
        name: 'Lazio',
        locations: [
          { city: 'Rome', county: 'Roma Capitale', zip: '00187', areaCode: '06', streets: ['Via del Corso', 'Via Veneto', 'Via Nazionale'] },
        ],
      },
      {
        code: 'LOM',
        name: 'Lombardy',
        locations: [
          { city: 'Milan', county: 'Milano', zip: '20121', areaCode: '02', streets: ['Via Montenapoleone', 'Corso Buenos Aires', 'Via Dante'] },
        ],
      },
    ],
  },
  {
    code: 'ES',
    name: '西班牙',
    nameEn: 'Spain',
    flag: '🇪🇸',
    regionLabel: '自治区 (Autonomous Community)',
    currencySymbol: '€',
    idLabel: '身份号 (DNI/NIE)',
    regions: [
      {
        code: 'MAD',
        name: 'Community of Madrid',
        locations: [
          { city: 'Madrid', county: 'Madrid', zip: '28013', areaCode: '91', streets: ['Gran Vía', 'Calle de Alcalá', 'Paseo de la Castellana'] },
        ],
      },
      {
        code: 'CAT',
        name: 'Catalonia',
        locations: [
          { city: 'Barcelona', county: 'Barcelona', zip: '08002', areaCode: '93', streets: ['Passeig de Gràcia', 'La Rambla', 'Avinguda Diagonal'] },
        ],
      },
    ],
  },
  {
    code: 'JP',
    name: '日本',
    nameEn: 'Japan',
    flag: '🇯🇵',
    regionLabel: '都道府县 (Prefecture)',
    currencySymbol: '¥',
    idLabel: '个人番号 (My Number)',
    regions: [
      {
        code: 'TYO',
        name: '东京都 (Tokyo)',
        locations: [
          { city: '千代田区', county: '东京都', zip: '100-0001', areaCode: '03', streets: ['大手町1丁目', '丸之内2丁目', '霞关3丁目'] },
          { city: '中央区', county: '东京都', zip: '104-0061', areaCode: '03', streets: ['银座4丁目', '日本桥室町2丁目'] },
        ],
      },
      {
        code: 'OSA',
        name: '大阪府 (Osaka)',
        locations: [
          { city: '大阪市北区', county: '大阪府', zip: '530-0001', areaCode: '06', streets: ['梅田1丁目', '中之岛3丁目', '堂岛1丁目'] },
        ],
      },
    ],
  },
  {
    code: 'HK',
    name: '香港',
    nameEn: 'Hong Kong',
    flag: '🇭🇰',
    regionLabel: '地区 (District)',
    currencySymbol: 'HK$',
    idLabel: '香港身份证 (HKID)',
    regions: [
      {
        code: 'CW',
        name: '中西区 (Central & Western)',
        locations: [
          { city: '中环 (Central)', county: '香港岛', zip: '999077', areaCode: '852', streets: ['皇后大道中 Queen\'s Road Central', '德辅道中 Des Voeux Road', '康乐广场 Connaught Place'] },
        ],
      },
      {
        code: 'WC',
        name: '湾仔区 (Wan Chai)',
        locations: [
          { city: '铜锣湾 (Causeway Bay)', county: '香港岛', zip: '999077', areaCode: '852', streets: ['轩尼诗道 Hennessy Road', '告士打道 Gloucester Road', '波斯富街 Percival Street'] },
        ],
      },
      {
        code: 'YTM',
        name: '油尖旺区 (Yau Tsim Mong)',
        locations: [
          { city: '尖沙咀 (Tsim Sha Tsui)', county: '九龙', zip: '999077', areaCode: '852', streets: ['弥敦道 Nathan Road', '广东道 Canton Road', '梳士巴利道 Salisbury Road'] },
        ],
      },
    ],
  },
  {
    code: 'SG',
    name: '新加坡',
    nameEn: 'Singapore',
    flag: '🇸🇬',
    regionLabel: '市镇/区域 (District)',
    currencySymbol: 'S$',
    idLabel: '身份证 (NRIC/FIN)',
    regions: [
      {
        code: 'CR',
        name: 'Central Region (市中心)',
        locations: [
          { city: 'Singapore', county: 'Downtown Core', zip: '018956', areaCode: '65', streets: ['Marina Boulevard', 'Raffles Quay', 'Shenton Way', 'Collyer Quay'] },
        ],
      },
      {
        code: 'OR',
        name: 'Orchard (乌节路)',
        locations: [
          { city: 'Singapore', county: 'Orchard Planning Area', zip: '238864', areaCode: '65', streets: ['Orchard Road', 'Scotts Road', 'Paterson Road'] },
        ],
      },
      {
        code: 'JE',
        name: 'Jurong East (裕廊东)',
        locations: [
          { city: 'Singapore', county: 'West Region', zip: '609731', areaCode: '65', streets: ['Jurong Gateway Road', 'Boon Lay Way', 'Toh Guan Road'] },
        ],
      },
    ],
  },
];

export interface DetailedIdentity {
  id: string;
  countryCode: string;
  countryName: string;
  // 基本资料
  fullName: string;
  gender: string;
  birthDate: string;
  title: string;
  hairColor: string;

  // 地址
  street: string;
  county: string;
  city: string;
  state: string;
  stateName: string;
  zipCode: string;
  phone: string;
  tempEmail: string;

  // 就业 & 信用卡
  cardType: string;
  cardNumber: string;
  cvv2: string;
  expireDate: string;
  occupation: string;
  companyName: string;
  companySize: string;
  employmentStatus: string;
  monthlySalary: string;
  ssn: string;
}

// Luhn Card Generator
function generateLuhnCard(prefix: string, length = 16): string {
  let card = prefix;
  while (card.length < length - 1) {
    card += Math.floor(Math.random() * 10);
  }
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
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('US'); // 默认美国
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('ALL'); // 默认全选
  const [identity, setIdentity] = useState<DetailedIdentity | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentCountry = COUNTRIES_DATABASE.find((c) => c.code === selectedCountryCode) || COUNTRIES_DATABASE[0];

  // When country changes, reset region to ALL
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    setSelectedRegionCode('ALL');
  };

  const FIRST_NAMES_M = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Liam', 'Lucas', 'Noah'];
  const FIRST_NAMES_F = ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Emma', 'Olivia', 'Sophia'];
  const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Taylor', 'Anderson', 'Wilson'];
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

  const generateIdentity = (): DetailedIdentity => {
    const isMale = Math.random() > 0.5;
    let region: RegionData;
    if (selectedRegionCode !== 'ALL') {
      region = currentCountry.regions.find((r) => r.code === selectedRegionCode) || currentCountry.regions[0];
    } else {
      region = currentCountry.regions[Math.floor(Math.random() * currentCountry.regions.length)];
    }

    const loc = region.locations[Math.floor(Math.random() * region.locations.length)];
    const streetName = loc.streets[Math.floor(Math.random() * loc.streets.length)];
    const streetNum = Math.floor(Math.random() * 800) + 10;
    const street = `${streetNum} ${streetName}`;

    // Name
    let fullName = '';
    let title = isMale ? 'Mr.' : 'Ms.';

    if (currentCountry.code === 'JP') {
      const jpSurnames = ['佐藤', '铃木', '高桥', '田中', '伊藤', '渡边', '山本', '中村'];
      const jpM = ['翔太', '拓也', '健太', '大树', '莲', '悠斗'];
      const jpF = ['美咲', '葵', '阳菜', '樱', '结衣', '七海'];
      const sur = jpSurnames[Math.floor(Math.random() * jpSurnames.length)];
      const giv = isMale ? jpM[Math.floor(Math.random() * jpM.length)] : jpF[Math.floor(Math.random() * jpF.length)];
      fullName = `${sur} ${giv}`;
      title = isMale ? 'Mr.' : 'Ms.';
    } else if (currentCountry.code === 'HK') {
      const hkSurnames = ['Chan', 'Lee', 'Wong', 'Cheung', 'Lau', 'Lam', 'Ng'];
      const hkGiv = isMale ? ['Ka-Ho', 'Chun-Kit', 'Kin-Hang', 'Wing-Chun'] : ['Wing-Yan', 'Tsz-Ching', 'Ka-Yan', 'Hoi-Ting'];
      fullName = `${hkSurnames[Math.floor(Math.random() * hkSurnames.length)]} ${hkGiv[Math.floor(Math.random() * hkGiv.length)]}`;
    } else {
      const fName = isMale ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)] : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
      const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      fullName = `${fName} ${lName}`;
    }

    // Birthdate (e.g. 1/27/1975)
    const birthYear = Math.floor(Math.random() * 35) + 1968;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    const birthDate = `${birthMonth}/${birthDay}/${birthYear}`;

    // Phone format
    let phone = '';
    if (currentCountry.code === 'US') {
      phone = `${loc.areaCode}-${Math.floor(Math.random() * 800 + 200)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (currentCountry.code === 'GB') {
      phone = `${loc.areaCode} ${Math.floor(Math.random() * 800 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`;
    } else if (currentCountry.code === 'HK') {
      phone = `+852 ${Math.floor(Math.random() * 70000000 + 20000000)}`;
    } else if (currentCountry.code === 'SG') {
      phone = `+65 ${Math.floor(Math.random() * 30000000 + 60000000)}`;
    } else if (currentCountry.code === 'JP') {
      phone = `${loc.areaCode}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else {
      phone = `+${loc.areaCode} ${Math.floor(Math.random() * 80000000 + 10000000)}`;
    }

    // SSN / ID Number
    let ssn = '';
    if (currentCountry.code === 'US') {
      const s1 = Math.floor(Math.random() * 800 + 100);
      const s2 = (Math.floor(Math.random() * 90) + 10).toString().padStart(2, '0');
      const s3 = Math.floor(Math.random() * 9000 + 1000);
      ssn = `${s1}-${s2}-${s3}`;
    } else if (currentCountry.code === 'GB') {
      const chars = 'ABCEGHJKLMNOPRSTWXYZ';
      const c1 = chars[Math.floor(Math.random() * chars.length)];
      const c2 = chars[Math.floor(Math.random() * chars.length)];
      ssn = `${c1}${c2} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} A`;
    } else if (currentCountry.code === 'HK') {
      const l = 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)];
      const num = Math.floor(Math.random() * 900000 + 100000);
      const c = Math.floor(Math.random() * 10);
      ssn = `${l}${num}(${c})`;
    } else if (currentCountry.code === 'SG') {
      const num = Math.floor(Math.random() * 9000000 + 1000000);
      ssn = `S${num}A`;
    } else if (currentCountry.code === 'JP') {
      ssn = `${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    } else {
      ssn = `${Math.floor(Math.random() * 90000000 + 10000000)}`;
    }

    // Credit Card with valid Luhn
    const isMaster = Math.random() > 0.5;
    const cardType = isMaster ? 'MasterCard' : 'Visa';
    const cardPrefix = isMaster ? '54' : '45';
    const cardNumber = generateLuhnCard(cardPrefix, 16);
    const cvv2 = Math.floor(Math.random() * 900 + 100).toString();
    const expMonth = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
    const expYear = 2027 + Math.floor(Math.random() * 4);
    const expireDate = `${expMonth}/${expYear}`;

    // Salary with currency symbol
    const salaryVal = (Math.floor(Math.random() * 70) * 100 + 3500).toLocaleString();
    const monthlySalary = `${currentCountry.currencySymbol}${salaryVal}`;

    // Temp email
    const emailPrefix = `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 14)}_${Math.random().toString(36).substring(2, 6)}`;
    const tempEmail = TempMailService.generateRandomAddress(emailPrefix);
    // 后台异步向 Cloudflare 临时邮箱后端注册该地址并缓存 JWT 凭据
    TempMailService.createRemoteAddress(emailPrefix).catch(() => {});

    return {
      id: Math.random().toString(36).substring(2, 9),
      countryCode: currentCountry.code,
      countryName: currentCountry.name,
      fullName,
      gender: isMale ? 'Male' : 'Female',
      birthDate,
      title,
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
      street,
      county: loc.county,
      city: loc.city,
      state: region.code,
      stateName: region.name,
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
      monthlySalary,
      ssn,
    };
  };

  const regenerate = () => {
    setIdentity(generateIdentity());
  };

  useEffect(() => {
    regenerate();
  }, [selectedCountryCode, selectedRegionCode]);

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
国家: ${identity.countryName}
街道: ${identity.street}
区县: ${identity.county}
城市: ${identity.city}
${currentCountry.regionLabel}代码: ${identity.state}
${currentCountry.regionLabel}全称: ${identity.stateName}
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
${currentCountry.idLabel}: ${identity.ssn}
    `.trim();

    navigator.clipboard.writeText(formatted);
    toast('已复制完整身份档案', 'success');
  };

  const exportJson = () => {
    if (!identity) return;
    const blob = new Blob([JSON.stringify(identity, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identity_${identity.countryCode}_${identity.fullName.replace(/\s+/g, '_')}.json`;
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
    a.download = `identity_${identity.countryCode}_${identity.fullName.replace(/\s+/g, '_')}.csv`;
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
              fontFamily: ['卡号', '邮编', '电话', 'SSN', '生日', 'CVV2', '号码', '税号', 'NIN', 'TFN', 'DNI'].some((k) => label.includes(k))
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
                (这是一个真实的邮箱，
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
                  点击这里接收邮件
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
        {/* Dynamic Country & Region Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Country Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>国家/地区:</span>
            <select
              className="select-box"
              style={{ width: '180px', padding: '6px 10px', fontSize: '0.875rem', fontWeight: 500 }}
              value={selectedCountryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              {COUNTRIES_DATABASE.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Region Dropdown dynamically shown depending on selected country */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {currentCountry.regionLabel}:
            </span>
            <select
              className="select-box"
              style={{ width: '220px', padding: '6px 10px', fontSize: '0.8125rem' }}
              value={selectedRegionCode}
              onChange={(e) => setSelectedRegionCode(e.target.value)}
            >
              <option value="ALL">全部随机 (All {currentCountry.regionLabel.split(' ')[0]})</option>
              {currentCountry.regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={copyAll}>
            <Copy size={15} /> 复制全部
          </button>
          <button className="btn btn-secondary" onClick={exportJson}>
            <FileJson size={15} /> 导出 JSON
          </button>
          <button className="btn btn-secondary" onClick={exportCsv}>
            <FileSpreadsheet size={15} /> 导出 CSV
          </button>
          <button className="btn btn-primary" onClick={regenerate}>
            <RefreshCw size={15} /> 换一个
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
            {renderRow(`${currentCountry.regionLabel.split(' ')[0]}缩写`, identity.state, '州缩写')}
            {renderRow(`${currentCountry.regionLabel.split(' ')[0]}全称`, identity.stateName, '州全称')}
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
            {renderRow(currentCountry.idLabel, identity.ssn, currentCountry.idLabel)}
          </div>
        </div>
      )}
    </div>
  );
};
