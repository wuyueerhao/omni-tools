/**
 * 临时邮箱服务接口与对接
 * 专为对接 cloudflare_temp_email (https://github.com/dreamhunter2333/cloudflare_temp_email) 设计
 * 已部署于: https://temp.vnvnv.com
 */

export interface TempMailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  content: string;
  verificationCode?: string;
}

export interface TempMailConfig {
  endpoint: string; // 自建 Cloudflare Temp Email 服务的 API 根地址 (例如 https://temp.vnvnv.com)
  authPassword?: string;
  customDomain?: string;
}

export interface AddressSession {
  address: string;
  jwt: string;
  address_id: number;
}

const DEFAULT_DOMAINS = ['vnvnv.com', 'temp.vnvnv.com'];

export class TempMailService {
  private static configKey = 'omni_temp_mail_config';
  private static currentEmailKey = 'omni_current_temp_email';
  private static sessionPrefix = 'omni_temp_mail_session_';

  static getConfig(): TempMailConfig {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      endpoint: 'https://temp.vnvnv.com',
      customDomain: DEFAULT_DOMAINS[0],
    };
  }

  static saveConfig(config: TempMailConfig) {
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }

  static getSession(address: string): AddressSession | null {
    try {
      const key = `${this.sessionPrefix}${address.toLowerCase()}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  static saveSession(session: AddressSession) {
    try {
      const key = `${this.sessionPrefix}${session.address.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch {
      // ignore
    }
  }

  /**
   * 向 Cloudflare Temp Email 后端请求生成真实临时邮箱（带 JWT 凭证）
   */
  static async createRemoteAddress(preferredPrefix?: string, domain?: string): Promise<string> {
    const config = this.getConfig();
    const useDomain = domain || config.customDomain || DEFAULT_DOMAINS[0];
    const rawName = (preferredPrefix || `user_${Math.random().toString(36).substring(2, 8)}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const cleanName = rawName.substring(0, 20) || `user${Math.floor(Math.random() * 10000)}`;

    try {
      const url = `${config.endpoint.replace(/\/$/, '')}/api/new_address`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.authPassword ? { 'x-custom-auth': config.authPassword } : {}),
        },
        body: JSON.stringify({
          name: cleanName,
          domain: useDomain,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.address && data.jwt) {
          this.saveSession({
            address: data.address,
            jwt: data.jwt,
            address_id: data.address_id || 1,
          });
          this.setCurrentEmail(data.address);
          return data.address;
        }
      }
    } catch (err) {
      console.warn('Failed to create remote address on Cloudflare:', err);
    }

    // 离线或异常时兜底
    const fallbackEmail = `${cleanName}@${useDomain}`;
    this.setCurrentEmail(fallbackEmail);
    return fallbackEmail;
  }

  static generateRandomAddress(preferredPrefix?: string, domain?: string): string {
    const config = this.getConfig();
    const useDomain = domain || config.customDomain || DEFAULT_DOMAINS[0];
    const prefix =
      preferredPrefix ||
      `user_${Math.random().toString(36).substring(2, 10)}`;
    const fullEmail = `${prefix}@${useDomain}`.toLowerCase();
    this.setCurrentEmail(fullEmail);
    return fullEmail;
  }

  static getCurrentEmail(): string {
    return localStorage.getItem(this.currentEmailKey) || this.generateRandomAddress();
  }

  static setCurrentEmail(email: string) {
    localStorage.setItem(this.currentEmailKey, email);
  }

  /**
   * 从自建 cloudflare_temp_email 后端实时拉取邮件列表（自动解析验证码）
   */
  static async fetchMessages(email: string): Promise<TempMailMessage[]> {
    const config = this.getConfig();
    const session = this.getSession(email);

    // 如果用户已配置了 cloudflare_temp_email 服务端地址
    if (config.endpoint) {
      try {
        const endpointBase = config.endpoint.replace(/\/$/, '');
        // 优先使用 /api/parsed_mails 接口（服务端自动提取 sender, subject, text, html）
        const url = `${endpointBase}/api/parsed_mails?limit=30&offset=0`;
        const headers: Record<string, string> = {};
        if (session?.jwt) {
          headers['Authorization'] = `Bearer ${session.jwt}`;
        }
        if (config.authPassword) {
          headers['x-custom-auth'] = config.authPassword;
        }

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          const results = data.results || (Array.isArray(data) ? data : []);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return results.map((m: any) => {
            const rawContent = m.html || m.text || m.raw || '';
            const plainText = m.text || rawContent.replace(/<[^>]+>/g, ' ');
            return {
              id: String(m.id || Math.random()),
              from: m.sender || m.source || '未知发件人',
              to: email,
              subject: m.subject || '（无主题）',
              date: m.created_at ? new Date(m.created_at).toLocaleString() : new Date().toLocaleTimeString(),
              content: rawContent,
              verificationCode: this.extractVerificationCode(m.subject + ' ' + plainText),
            };
          });
        }
      } catch (err) {
        console.warn('Fetch from remote temp email failed:', err);
      }
    }

    // 如果刚创建且无邮件，返回空列表
    return [];
  }

  /**
   * 自动提取 4-8 位验证码
   */
  private static extractVerificationCode(text: string): string | undefined {
    // 优先匹配包含 "验证码"、"code"、"Verification" 前缀的数字
    const contextMatch = text.match(/(?:验证码|code|pin|security code|verification code)[\s:：is为]*([0-9]{4,8})\b/i);
    if (contextMatch && contextMatch[1]) {
      return contextMatch[1];
    }
    // 次优匹配纯 4-8 位数字组合
    const generalMatch = text.match(/\b\d{4,8}\b/);
    return generalMatch ? generalMatch[0] : undefined;
  }
}
