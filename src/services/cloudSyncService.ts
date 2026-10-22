import type { CloudSyncPayload } from '../types/user';
import { AuthService } from './authService';

const CLOUD_SYNC_PREFIX = 'omni_cloud_sync_data_';
const FAVORITE_IDENTITIES_KEY = 'omni_favorite_identities';
const PASSWORD_VAULT_KEY = 'omni_password_vault';

class CloudSyncServiceClass {
  private getStorageKey(userId: string): string {
    return `${CLOUD_SYNC_PREFIX}${userId}`;
  }

  /**
   * 收集当前设备的所有工具数据
   */
  public collectLocalData(): CloudSyncPayload {
    let totpAccounts = [];
    try {
      const raw = localStorage.getItem('omni_totp_accounts');
      if (raw) totpAccounts = JSON.parse(raw);
    } catch {
      // ignore
    }

    let favoriteIdentities = [];
    try {
      const raw = localStorage.getItem(FAVORITE_IDENTITIES_KEY);
      if (raw) favoriteIdentities = JSON.parse(raw);
    } catch {
      // ignore
    }

    let passwordVault = [];
    try {
      const raw = localStorage.getItem(PASSWORD_VAULT_KEY);
      if (raw) passwordVault = JSON.parse(raw);
    } catch {
      // ignore
    }

    return {
      totpAccounts,
      favoriteIdentities,
      passwordVault,
      customPreferences: {
        theme: (localStorage.getItem('omni_theme') as 'dark' | 'light') || 'dark',
      },
    };
  }

  /**
   * 将云端数据包还原到本地
   */
  public applyDataToLocal(payload: CloudSyncPayload) {
    if (payload.totpAccounts) {
      localStorage.setItem('omni_totp_accounts', JSON.stringify(payload.totpAccounts));
    }
    if (payload.favoriteIdentities) {
      localStorage.setItem(FAVORITE_IDENTITIES_KEY, JSON.stringify(payload.favoriteIdentities));
    }
    if (payload.passwordVault) {
      localStorage.setItem(PASSWORD_VAULT_KEY, JSON.stringify(payload.passwordVault));
    }
    if (payload.customPreferences?.theme) {
      localStorage.setItem('omni_theme', payload.customPreferences.theme);
      document.documentElement.setAttribute('data-theme', payload.customPreferences.theme);
    }
  }

  /**
   * 执行云端双向同步（登录用户专享）
   */
  public async syncNow(): Promise<{ syncedAt: string; stats: { totp: number; identities: number; passwords: number } }> {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('请先登录后再进行多端云同步');
    }

    const key = this.getStorageKey(user.id);
    const localData = this.collectLocalData();

    // 读取已有的云端包进行增量合并
    let cloudData: CloudSyncPayload = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) cloudData = JSON.parse(raw);
    } catch {
      // ignore
    }

    // 智能合并 2FA 令牌（去重）
    const mergedTotpMap = new Map();
    (cloudData.totpAccounts || []).forEach((t) => mergedTotpMap.set(t.id, t));
    (localData.totpAccounts || []).forEach((t) => mergedTotpMap.set(t.id, t));
    const mergedTotp = Array.from(mergedTotpMap.values());

    // 智能合并收藏身份（去重）
    const mergedIdentityMap = new Map();
    (cloudData.favoriteIdentities || []).forEach((i) => mergedIdentityMap.set(i.id, i));
    (localData.favoriteIdentities || []).forEach((i) => mergedIdentityMap.set(i.id, i));
    const mergedIdentities = Array.from(mergedIdentityMap.values());

    // 智能合并密码库
    const mergedVaultMap = new Map();
    (cloudData.passwordVault || []).forEach((p) => mergedVaultMap.set(p.id, p));
    (localData.passwordVault || []).forEach((p) => mergedVaultMap.set(p.id, p));
    const mergedVault = Array.from(mergedVaultMap.values());

    const finalPayload: CloudSyncPayload = {
      totpAccounts: mergedTotp,
      favoriteIdentities: mergedIdentities,
      passwordVault: mergedVault,
      customPreferences: localData.customPreferences,
    };

    // 保存到云端空间并同步回本地
    localStorage.setItem(key, JSON.stringify(finalPayload));
    this.applyDataToLocal(finalPayload);

    const nowStr = new Date().toLocaleString();
    user.syncedAt = nowStr;
    localStorage.setItem('omni_auth_current_user_v1', JSON.stringify(user));

    AuthService.addAuditLog(`数据云同步完成: 2FA(${mergedTotp.length}) 身份(${mergedIdentities.length}) 密码(${mergedVault.length})`, user.username, 'success');

    return {
      syncedAt: nowStr,
      stats: {
        totp: mergedTotp.length,
        identities: mergedIdentities.length,
        passwords: mergedVault.length,
      },
    };
  }

  /**
   * 登录用户专享：收藏一个生成的虚拟身份
   */
  public saveFavoriteIdentity(identity: any, note = ''): void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('收藏身份为登录用户专属特权，请先登录');
    }

    let list = this.getFavoriteIdentities();
    const item = {
      id: identity.id || `fav_${Date.now()}`,
      savedAt: new Date().toLocaleString(),
      note: note || `${identity.countryName} - ${identity.fullName}`,
      identity,
    };

    list = [item, ...list.filter((x) => x.id !== item.id)];
    localStorage.setItem(FAVORITE_IDENTITIES_KEY, JSON.stringify(list));

    // 触发静默云同步
    this.syncNow().catch(() => {});
  }

  public getFavoriteIdentities(): any[] {
    try {
      const raw = localStorage.getItem(FAVORITE_IDENTITIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public removeFavoriteIdentity(id: string): void {
    let list = this.getFavoriteIdentities();
    list = list.filter((x) => x.id !== id);
    localStorage.setItem(FAVORITE_IDENTITIES_KEY, JSON.stringify(list));
    this.syncNow().catch(() => {});
  }

  /**
   * 登录用户专享：存入密码保险箱
   */
  public savePasswordToVault(password: string, title = '未命名密码'): void {
    const user = AuthService.getCurrentUser();
    if (!user) {
      throw new Error('密码保险箱为登录用户专属功能，请先登录');
    }

    let list = this.getPasswordVault();
    const item = {
      id: `pwd_${Date.now()}`,
      title,
      password,
      createdAt: new Date().toLocaleString(),
    };
    list.unshift(item);
    localStorage.setItem(PASSWORD_VAULT_KEY, JSON.stringify(list));
    this.syncNow().catch(() => {});
  }

  public getPasswordVault(): any[] {
    try {
      const raw = localStorage.getItem(PASSWORD_VAULT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public removePasswordFromVault(id: string): void {
    let list = this.getPasswordVault();
    list = list.filter((x) => x.id !== id);
    localStorage.setItem(PASSWORD_VAULT_KEY, JSON.stringify(list));
    this.syncNow().catch(() => {});
  }

  /**
   * 导出备份文件 (.json)
   */
  public exportBackupFile(): void {
    const data = this.collectLocalData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_tools_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const CloudSyncService = new CloudSyncServiceClass();
