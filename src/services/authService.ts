import type { User, UserAccountCredentials, AuthProvider, AuditLog, UserRole } from '../types/user';
import { SystemConfigService } from './systemConfigService';

const ACCOUNTS_KEY = 'omni_auth_accounts_v1';
const CURRENT_USER_KEY = 'omni_auth_current_user_v1';
const AUDIT_LOGS_KEY = 'omni_auth_audit_logs_v1';

// 默认超级管理员配置 (初始密码为用户指定的 dl0101)
const DEFAULT_SUPER_ADMIN: UserAccountCredentials = {
  id: 'usr_admin_world_001',
  username: 'world',
  email: 'world@vnvnv.com',
  passwordHash: 'dl0101',
  role: 'super_admin', // 超级管理员
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
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([DEFAULT_SUPER_ADMIN]));
        this.addAuditLog('初始化系统，创建默认超级管理员 (world)', 'world', 'success');
      } else {
        const accounts: UserAccountCredentials[] = JSON.parse(raw);
        // 确保 world 超级管理员始终存在且角色升级为 super_admin
        const worldIndex = accounts.findIndex((a) => a.username.toLowerCase() === 'world');
        if (worldIndex === -1) {
          accounts.unshift(DEFAULT_SUPER_ADMIN);
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        } else if (accounts[worldIndex].role !== 'super_admin') {
          accounts[worldIndex].role = 'super_admin';
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }

      // 如果当前登录的用户是 world，确保会话角色同步升级为 super_admin
      const currentRaw = localStorage.getItem(CURRENT_USER_KEY);
      if (currentRaw) {
        const currentUser: User = JSON.parse(currentRaw);
        if (currentUser.username.toLowerCase() === 'world' && currentUser.role !== 'super_admin') {
          currentUser.role = 'super_admin';
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
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
      if (!raw) return null;
      const user: User = JSON.parse(raw);
      if (user.username.toLowerCase() === 'world' && user.role !== 'super_admin') {
        user.role = 'super_admin';
      }
      return user;
    } catch {
      return null;
    }
  }

  public isSuperAdmin(user?: User | null): boolean {
    const target = user !== undefined ? user : this.getCurrentUser();
    return Boolean(target && (target.role === 'super_admin' || target.username.toLowerCase() === 'world'));
  }

  public isAdmin(user?: User | null): boolean {
    const target = user !== undefined ? user : this.getCurrentUser();
    return Boolean(
      target &&
        (target.role === 'super_admin' || target.role === 'admin' || target.username.toLowerCase() === 'world')
    );
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

    const effectiveRole: UserRole = account.username.toLowerCase() === 'world' ? 'super_admin' : account.role;

    const user: User = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: effectiveRole,
      avatar: account.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${account.username}`,
      provider: account.provider,
      createdAt: account.createdAt,
      lastLoginAt: new Date().toLocaleString(),
      socialBindings: account.socialBindings,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    this.addAuditLog(`用户成功登录: ${user.username} (${user.role})`, user.username, 'success');
    this.notify();
    return user;
  }

  public async register(username: string, email: string, password: string): Promise<User> {
    this.ensureInitialized();

    // 检查超级管理员系统策略：是否开放自助注册
    if (!SystemConfigService.isRegistrationAllowed()) {
      throw new Error('系统当前已暂停新用户开放注册，请联系超级管理员');
    }

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
      return raw ? JSON.parse(raw) : [DEFAULT_SUPER_ADMIN];
    } catch {
      return [DEFAULT_SUPER_ADMIN];
    }
  }

  /**
   * 普通用户/管理员修改自身基本信息 (用户名、邮箱、头像)
   */
  public async updateUserProfile(
    userId: string,
    data: { username?: string; email?: string; avatar?: string }
  ): Promise<User> {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (!target) throw new Error('用户不存在');

    if (data.username && data.username.trim() !== target.username) {
      const newName = data.username.trim();
      if (newName.length < 2) throw new Error('用户名长度至少为 2 个字符');
      if (accounts.some((a) => a.id !== userId && a.username.toLowerCase() === newName.toLowerCase())) {
        throw new Error('该用户名已被占用');
      }
      target.username = newName;
    }

    if (data.email && data.email.trim() !== target.email) {
      const newEmail = data.email.trim().toLowerCase();
      if (!newEmail.includes('@')) throw new Error('请输入有效的邮箱地址');
      if (accounts.some((a) => a.id !== userId && a.email.toLowerCase() === newEmail)) {
        throw new Error('该邮箱已注册');
      }
      target.email = newEmail;
    }

    if (data.avatar) {
      target.avatar = data.avatar;
    }

    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    const currentUser = this.getCurrentUser();
    let updatedUser: User;
    if (currentUser && currentUser.id === userId) {
      updatedUser = {
        ...currentUser,
        username: target.username,
        email: target.email,
        avatar: target.avatar,
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      this.notify();
    } else {
      updatedUser = {
        id: target.id,
        username: target.username,
        email: target.email,
        role: target.role,
        avatar: target.avatar,
        provider: target.provider,
        createdAt: target.createdAt,
        lastLoginAt: new Date().toLocaleString(),
        socialBindings: target.socialBindings,
      };
    }

    this.addAuditLog(`用户修改了个人资料: ${target.username}`, target.username, 'success');
    return updatedUser;
  }

  /**
   * 用户修改自身密码
   */
  public async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (!target) throw new Error('用户不存在');

    if (target.passwordHash !== oldPass) {
      throw new Error('原密码不正确，请重新输入');
    }
    if (!newPass || newPass.length < 4) {
      throw new Error('新密码长度至少需要 4 位字符');
    }
    if (newPass === oldPass) {
      throw new Error('新密码不能与原密码相同');
    }

    target.passwordHash = newPass;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    this.addAuditLog(`用户 [${target.username}] 修改了自己的密码`, target.username, 'warning');
  }

  /**
   * 绑定或解绑社媒账号 (Google / Facebook / GitHub)
   */
  public async toggleSocialBinding(
    userId: string,
    provider: 'google' | 'facebook' | 'github'
  ): Promise<User> {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (!target) throw new Error('用户不存在');

    if (!target.socialBindings) {
      target.socialBindings = {};
    }

    const isCurrentlyBound = Boolean(target.socialBindings[provider]);
    if (isCurrentlyBound) {
      delete target.socialBindings[provider];
      this.addAuditLog(`用户解绑了 ${provider.toUpperCase()} 社媒账号`, target.username, 'warning');
    } else {
      target.socialBindings[provider] = `${target.username}_${provider}@${provider === 'github' ? 'github.com' : provider === 'google' ? 'gmail.com' : 'facebook.com'}`;
      this.addAuditLog(`用户成功绑定了 ${provider.toUpperCase()} 账号`, target.username, 'success');
    }

    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    const currentUser = this.getCurrentUser();
    let updatedUser: User;
    if (currentUser && currentUser.id === userId) {
      updatedUser = {
        ...currentUser,
        socialBindings: { ...target.socialBindings },
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      this.notify();
    } else {
      updatedUser = {
        id: target.id,
        username: target.username,
        email: target.email,
        role: target.role,
        avatar: target.avatar,
        provider: target.provider,
        createdAt: target.createdAt,
        lastLoginAt: new Date().toLocaleString(),
        socialBindings: target.socialBindings,
      };
    }

    return updatedUser;
  }

  /**
   * 仅超级管理员可调整用户权限 (升级管理员 / 设为超级管理员 / 降为普通用户)
   */
  public adminSetUserRole(userId: string, newRole: UserRole, operator?: User) {
    if (operator && !this.isSuperAdmin(operator)) {
      throw new Error('权限不足：仅系统超级管理员 (Super Admin) 可变更用户角色');
    }

    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (!target) throw new Error('用户不存在');

    if (target.username.toLowerCase() === 'world' && newRole !== 'super_admin') {
      throw new Error('不能撤销初始超级管理员 world 的超管权限');
    }

    const oldRole = target.role;
    target.role = newRole;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    // 如果修改的是当前登录用户，同步更新当前会话
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      current.role = newRole;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));
    }

    this.addAuditLog(
      `超级管理员变更了用户 [${target.username}] 的角色: ${oldRole} -> ${newRole}`,
      operator?.username || 'world',
      'warning'
    );
    this.notify();
  }

  public adminResetPassword(userId: string, newPass: string, operator?: User) {
    const accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (target) {
      target.passwordHash = newPass;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      this.addAuditLog(
        `管理员重置了用户 [${target.username}] 的密码`,
        operator?.username || 'world',
        'warning'
      );
    }
  }

  public adminDeleteUser(userId: string, operator?: User) {
    let accounts = this.getAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (target && target.username.toLowerCase() === 'world') {
      throw new Error('不能删除超级管理员账号 world');
    }
    accounts = accounts.filter((a) => a.id !== userId);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (target) {
      this.addAuditLog(
        `管理员删除了用户 [${target.username}]`,
        operator?.username || 'world',
        'warning'
      );
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

  public clearAuditLogs(operator?: User) {
    if (operator && !this.isSuperAdmin(operator)) {
      throw new Error('仅超级管理员可清空系统审计日志');
    }
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify([]));
    this.addAuditLog('超级管理员清空了历史审计日志', operator?.username || 'world', 'warning');
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
      if (logs.length > 150) logs.length = 150;
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }
}

export const AuthService = new AuthServiceClass();
