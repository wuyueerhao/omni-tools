/**
 * 全站系统配置核心类型 (仅超级管理员可配置)
 */

export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string; // e.g. https://pub-xxxx.r2.dev 或自定义域名 cdn.vnvnv.com
  enabled: boolean;
}

export interface AIProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  enabled: boolean;
}

export interface SystemAIConfig {
  openai: AIProviderConfig;
  claude: AIProviderConfig;
  gemini: AIProviderConfig;
  deepseek: AIProviderConfig;
  defaultProvider: 'openai' | 'claude' | 'gemini' | 'deepseek';
}

export interface ImageStorageConfig {
  driver: 'local_browser' | 'cloudflare_r2' | 'custom_api';
  pathPrefix: string; // e.g. uploads/{year}/{month}/
  autoWebp: boolean;
  maxSizeBytes: number; // e.g. 10 * 1024 * 1024 (10MB)
  customUploadUrl?: string;
  customAuthHeader?: string;
}

export interface UserManagementPolicy {
  allowRegistration: boolean; // 是否开放新用户自助注册
  defaultRole: 'user';
  requireEmailVerification: boolean;
  maxUsers: number;
}

export interface SecurityPolicyConfig {
  maxLoginAttempts: number; // 登录失败尝试次数限制
  lockoutDurationMinutes: number; // 锁定分钟数
  sessionDurationDays: number; // 会话保留天数
  maskSecretsInUI: boolean; // 是否在界面中默认掩码脱敏
  enableAuditLog: boolean; // 是否记录审计日志
}

export interface SystemConfig {
  version: string;
  r2: CloudflareR2Config;
  ai: SystemAIConfig;
  imageStorage: ImageStorageConfig;
  userPolicy: UserManagementPolicy;
  security: SecurityPolicyConfig;
  updatedAt: string;
}
