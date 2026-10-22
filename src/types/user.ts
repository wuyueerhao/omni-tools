/**
 * 用户管理与云端同步核心类型定义
 */

export type UserRole = 'admin' | 'user';
export type AuthProvider = 'local' | 'google' | 'facebook' | 'github';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  createdAt: string;
  lastLoginAt: string;
  syncedAt?: string;
}

export interface UserAccountCredentials {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // Base64 或 Hash 模拟
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  createdAt: string;
}

// 登录后专享：云端同步数据包
export interface CloudSyncPayload {
  totpAccounts?: Array<{
    id: string;
    issuer: string;
    label: string;
    secret: string;
    digits: number;
    period: number;
    createdAt?: string;
  }>;
  favoriteIdentities?: Array<{
    id: string;
    savedAt: string;
    note?: string;
    identity: any;
  }>;
  savedMailAddresses?: Array<{
    address: string;
    jwt?: string;
    label?: string;
    createdAt: string;
  }>;
  passwordVault?: Array<{
    id: string;
    title: string;
    password: string;
    createdAt: string;
  }>;
  customPreferences?: {
    theme?: 'dark' | 'light';
    defaultCountry?: string;
    defaultPasswordLength?: number;
    usernameUseSpace?: boolean;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  ip?: string;
  status: 'success' | 'warning' | 'error';
}
