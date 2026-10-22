import type { User, UserAccountCredentials, AuthProvider, AuditLog } from '../types/user';

const ACCOUNTS_KEY = 'omni_auth_accounts_v1';
const CURRENT_USER_KEY = 'omni_auth_current_user_v1';
const AUDIT_LOGS_KEY = 'omni_auth_audit_logs_v1';

// 默认管理员配置
const DEFAULT_ADMIN: UserAccountCredentials = {
  id: 'usr_admin_world_001',
  username: 'world',
  email: 'world@vnvnv.com',
  passwordHash: 'dl0101', // 支持直接校验 dl0101
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=world&backgroundColor=6366f1',
  provider: 'local',
  createdAt: '2026-10-22 08:00:00',
};

type AuthChangeCallback = (user: User | null) => void;

class AuthServiceClass {
  private listeners: Set<AuthChangeCallback> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([DEFAULT_ADMIN]));
        this.addAuditLog('初始化系统，创建默认管理员 (world)', 'world', 'success');
      } else {
        const accounts: UserAccountCredentials[] = JSON.parse(raw);
        // 确保 world 管理员始终存在且密码正确
        const hasWorld = accounts.some((a) => a.username.toLowerCase() === 'world');
        if (!hasWorld) {
          accounts.unshift(DEFAULT_ADMIN);
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }
    } catch (e) {
      console.warn('Failed to initialize auth storage:', e);
    }
  }

  public subscribe(cb: AuthChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const current = this.getCurrentUser();
    this.listeners.forEach((cb) => {
      try {
        cb(current);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async login(identifier: string, password: string): Promise<User> {
    this.ensureInitialized();
    const cleanId = identifier.trim().toLowerCase();
    const accounts = this.getAccounts();

    const account = accounts.find(
      (a) => a.username.toLowerCase() === cleanId || a.email.toLowerCase() === cleanId
    );

    if (!account) {
      this.addAuditLog(`登录失败：用户 [${identifier}] 不存在`, identifier, 'warning');
      throw new Error('用户名或邮箱不存在');
    }

    if (account.passwordHash !== password) {
      this.addAuditLog(`登录失败：用户 [${account.username}] 密码错误`, account.username, 'error');
      throw new Error('密码错误，请重试');
    }

    const user: User = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
      avatar: account.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${account.username}`,
      provider: account.provider,
      createdAt: account.createdAt,
      lastLoginAt: new Date().toLocaleString(),
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.addAuditLog(`用户成功登录: ${user.username} (${user.role})`, user.username, 'success');
    this.notify();
    return user;
  }

  public async register(username: string, email: string, password: string): Promise<User> {
    this.ensureInitialized();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 2) {
      throw new Error('用户名长度至少为 2 个字符');
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('请输入有效的邮箱地址');
    }
    if (!password || password.length < 4) {
      throw new Error('密码长度至少为 4 个字符');
    }

    const accounts = this.getAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === cleanUsername.toLowerCase())) {
      throw new Error('该用户名已被占用');
    }
    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      throw new Error('该邮箱已注册');
    }

    const newAccount: UserAccountCredentials = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash: password,
      role: 'user',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}&backgroundColor=10b981`,
      provider: 'local',
      createdAt: new Date().toLocaleString(),
    };

    accounts.push(newAccount);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    const user: User = {
      id: newAccount.id,
      username: newAccount.username,
      email: newAccount.email,
      role: newAccount.role,
      avatar: newAccount.avatar,
      provider: newAccount.provider,
      createdAt: newAccount.createdAt,
      lastLoginAt: new Date().toLocaleString(),
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.addAuditLog(`新用户注册并登录: ${user.username}`, user.username, 'success');
    this.notify();
    return user;
  }

  public async oauthLogin(provider: AuthProvider): Promise<User> {
    this.ensureInitialized();
    const accounts = this.getAccounts();

    // 针对 Google / Facebook / GitHub 生成真实仿真第三方授权账号
    const providerNames: Record<AuthProvider, string> = {
      google: 'Google',
      facebook: 'Facebook',
      github: 'GitHub',
      local: 'Local',
    };

    const pseudoSeed = Math.floor(Math.random() * 899 + 100);
    const oauthUsername = `${provider}_user${pseudoSeed}`;
    const oauthEmail = `${oauthUsername}@${provider === 'github' ? 'github.com' : provider === 'google' ? 'gmail.com' : 'facebook.com'}`;

    let account = accounts.find((a) => a.provider === provider);
    if (!account) {
      account = {
        id: `usr_oauth_${provider}_${Date.now()}`,
        username: oauthUsername,
        email: oauthEmail,
        passwordHash: `oauth_token_${Math.random().toString(36)}`,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${provider}&backgroundColor=f59e0b`,
        provider,
        createdAt: new Date().toLocaleString(),
      };
      accounts.push(account);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    const user: User = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
      avatar: account.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${provider}`,
      provider: account.provider,
      createdAt: account.createdAt,
      lastLoginAt: new Date().toLocaleString(),
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.addAuditLog(`通过 ${providerNames[provider]} 快速授权登录: ${user.username}`, user.username, 'success');
    this.notify();
    return user;
  }

  public logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.addAuditLog(`用户登出: ${user.username}`, user.username, 'success');
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    this.notify();
  }

  public getAccounts(): UserAccountCredentials[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [DEFAULT_ADMIN];
    } catch {
      return [DEFAULT_ADMIN];
    }
  }

  public adminResetPassword(userId: string, newPass: string) {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (target) {
      target.passwordHash = newPass;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      this.addAuditLog(`管理员重置了用户 [${target.username}] 的密码`, 'world', 'warning');
    }
  }

  public adminDeleteUser(userId: string) {
    let accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (target && target.username === 'world') {
      throw new Error('不能删除超级管理员账号 world');
    }
    accounts = accounts.filter((a) => a.id !== userId);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (target) {
      this.addAuditLog(`管理员删除了用户 [${target.username}]`, 'world', 'warning');
    }
  }

  public getAuditLogs(): AuditLog[] {
    try {
      const raw = localStorage.getItem(AUDIT_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addAuditLog(action: string, username = '访客', status: 'success' | 'warning' | 'error' = 'success') {
    try {
      const logs = this.getAuditLogs();
      logs.unshift({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        username,
        action,
        status,
      });
      // 保持最近 100 条
      if (logs.length > 100) logs.length = 100;
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }
}

export const AuthService = new AuthServiceClass();
