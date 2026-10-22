# 🚀 OmniTools (极客全能离线工具箱)

> 专为个人极客、开发者及高效办公打造的 **Zero-Upload（零上传）** 全能浏览器端工具集。
> 100% 运行于本地浏览器内存，保证绝对隐私安全，已通过 Cloudflare 全球边缘网络托管加速。

🌐 **在线体验地址**: [https://omni-tools-2d8.pages.dev](https://omni-tools-2d8.pages.dev)  
📦 **GitHub 开源仓库**: [https://github.com/wuyueerhao/omni-tools](https://github.com/wuyueerhao/omni-tools)

---

## 🌟 核心工具矩阵

| 分类 | 工具名称 | 英文标识 | 核心功能与亮点 |
| :--- | :--- | :--- | :--- |
| 🔐 **安全认证** | **2FA 动态令牌** | `2fa-authenticator` | 基于 RFC 6238 标准的 TOTP 动态口令生成与校验，带环形倒计时进度，支持生成随机密钥、二维码扫描展示、本地多账号保管箱。 |
| 🔐 **安全认证** | **密码生成器** | `password-generator` | 支持随机强密码、易记口令短语 (Diceware)、纯数字 PIN 码；实时计算香农信息熵与暴力破解耗时；支持批量生成与 SHA-256 哈希速算。 |
| 👤 **身份数据** | **用户名生成** | `username-generator` | 支持赛博极客风、英文极简、国风拼音、游戏代号等多风格；支持命名格式转换 (snake_case, camelCase, PascalCase) 与批量导出。 |
| 👤 **身份数据** | **虚拟测试身份与地址** | `identity-generator` | 严格按照算法生成的测试虚拟数据：支持中国（包含 ISO 7064 身份证校验位算法、真实省市区与真实邮编）、美国（真实州县与合法 ZIP Code、虚拟 SSN 与电话），支持一键导出 JSON / CSV。 |
| 📄 **文档办公** | **PDF工具** | `pdf-toolkit` | 纯前端字节处理，无需上传云端：支持多 PDF 顺序合并、指定页码提取/拆分、批量顺时针旋转 (90°/180°/270°)、加盖防伪倾斜文本水印。 |
| 🎨 **多媒体** | **图片处理工坊** | `image-processor` | 纯 Canvas 本地运算：WebP / PNG / JPEG 格式互转、图片无损/有损智能压缩、按比例缩放/裁剪尺寸微调、复古/黑白/反色滤镜及文字水印加盖。 |
| 📄 **文档办公** | **Excel工具** | `excel-studio` | 支持 .xlsx / .xls / .csv 文件秒级解析；Excel 与 CSV / JSON 双向无缝转换、前 100 行快速表格预览、全局内容关键词过滤与数据统计。 |

---

## 🛡️ 安全与隐私架构 (Privacy First)

- **零数据上载 (Zero Upload)**: 所有加密敏感信息（2FA 密钥、密码、身份证数据）及个人私密文档（PDF、照片、Excel 财务表格）全部在浏览器前端本地（Web Crypto API, Canvas API, pdf-lib, SheetJS）处理，杜绝网络泄密风险。
- **离线即用 (Offline Ready)**: 支持纯前端单页架构，断网状态下只要页面已缓存即可正常计算与生成。
- **极速响应 (Edge Hosted)**: 构建产物直接托管于 Cloudflare Pages 全球 CDN，秒级加载，零运维成本。

---

## 🛠️ 技术栈

- **前端架构**: React 19 + TypeScript + Vite 5+
- **样式系统**: 原生 CSS Variables (符合系统 Vanilla CSS 设计规范，支持深度极客暗黑主题与清爽明亮模式、毛玻璃微动效)
- **图标体系**: Lucide React
- **核心计算引擎**:
  - 2FA TOTP: `otpauth` + `qrcode`
  - PDF 处理: `pdf-lib`
  - 表格解析: `xlsx` (SheetJS)
  - 随机与安全哈希: 原生 Web Crypto API (`crypto.getRandomValues`, `crypto.subtle`)

---

## 🚀 本地开发与构建

```bash
# 1. 克隆项目
git clone https://github.com/wuyueerhao/omni-tools.git
cd omni-tools

# 2. 安装依赖
npm install

# 3. 启动本地开发服务
npm run dev

# 4. 生产环境打包构建
npm run build
```

---

## ☁️ Cloudflare Pages 部署说明

### 方式 1: 使用 GitHub Actions 自动部署（推荐）
在 GitHub 仓库设置中添加 Secrets：
- `CLOUDFLARE_API_TOKEN`: Cloudflare API 令牌
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 账户 ID

每次向 `main` 分支提交代码，将自动触发构建并部署到生产环境。

### 方式 2: 使用 Wrangler 命令行一键直推
```bash
CLOUDFLARE_API_TOKEN="your_cf_token" CLOUDFLARE_ACCOUNT_ID="your_account_id" npx wrangler pages deploy dist --project-name=omni-tools --branch=main
```
