/**
 * 临时邮箱服务接口与对接预留
 * 专为对接 cloudflare_temp_email (https://github.com/dreamhunter2333/cloudflare_temp_email) 设计
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
  endpoint: string; // 自建 Cloudflare Temp Email 服务的 API 根地址 (例如 https://mail.yourdomain.com)
  authPassword?: string;
  customDomain?: string;
}

const DEFAULT_DOMAINS = ['iubridge.com', 'quickmail.dev', 'cfmail.link', 'tempbox.site'];

export class TempMailService {
  private static configKey = 'omni_temp_mail_config';
  private static currentEmailKey = 'omni_current_temp_email';

  static getConfig(): TempMailConfig {
    try {
      const saved = localStorage.getItem(this.configKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      endpoint: '',
      customDomain: DEFAULT_DOMAINS[0],
    };
  }

  static saveConfig(config: TempMailConfig) {
    localStorage.setItem(this.configKey, JSON.stringify(config));
  }

  static generateRandomAddress(preferredPrefix?: string, domain?: string): string {
    const config = this.getConfig();
    const useDomain = domain || config.customDomain || DEFAULT_DOMAINS[0];
    const prefix =
      preferredPrefix ||
      `user_${Math.random().toString(36).substring(2, 10)}`;
    const fullEmail = `${prefix}@${useDomain}`.toLowerCase();
    localStorage.setItem(this.currentEmailKey, fullEmail);
    return fullEmail;
  }

  static getCurrentEmail(): string {
    return localStorage.getItem(this.currentEmailKey) || this.generateRandomAddress();
  }

  static setCurrentEmail(email: string) {
    localStorage.setItem(this.currentEmailKey, email);
  }

  /**
   * 预留从自建 cloudflare_temp_email 后端拉取邮件的接口
   */
  static async fetchMessages(email: string): Promise<TempMailMessage[]> {
    const config = this.getConfig();

    // 如果用户已配置了 cloudflare_temp_email 服务端地址
    if (config.endpoint) {
      try {
        const url = `${config.endpoint.replace(/\/$/, '')}/api/mails?email=${encodeURIComponent(email)}`;
        const res = await fetch(url, {
          headers: config.authPassword ? { 'x-custom-auth': config.authPassword } : {},
        });
        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (data.results || data || []).map((m: any) => ({
            id: m.id || String(Math.random()),
            from: m.from || 'sender@service.com',
            to: email,
            subject: m.subject || '（无主题）',
            date: m.created_at || new Date().toLocaleTimeString(),
            content: m.content || m.text || '',
            verificationCode: this.extractVerificationCode(m.content || m.subject || ''),
          }));
        }
      } catch (err) {
        console.warn('Fetch from remote temp email failed:', err);
      }
    }

    // 默认或未配置时提供内置演示欢迎与测试邮件
    return [
      {
        id: '1',
        from: 'system@cloudflare-temp-email.com',
        to: email,
        subject: '欢迎使用 OmniTools 临时邮箱服务',
        date: new Date().toLocaleTimeString(),
        content: `您好，您的临时邮箱 ${email} 已就绪。后续部署 cloudflare_temp_email 服务后填入 Endpoint 即可全自动化接收验证码与邮件。`,
        verificationCode: '852963',
      },
    ];
  }

  private static extractVerificationCode(text: string): string | undefined {
    const match = text.match(/\b\d{4,8}\b/);
    return match ? match[0] : undefined;
  }
}
