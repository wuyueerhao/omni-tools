import { Secret, TOTP } from 'otpauth';
import type { SavedTotpAccount } from '../../types/user';

export type TotpDraft = Omit<SavedTotpAccount, 'id' | 'createdAt'>;
export const emptyDraft: TotpDraft = { secret: '', issuer: '', label: '', digits: 6, period: 30 };

function normalizeSecret(secret: string) {
  return secret.replace(/\s/g, '').replace(/=+$/, '').toUpperCase();
}

export function createTotp(draft: TotpDraft) {
  if (![6, 8].includes(draft.digits) || !Number.isSafeInteger(draft.period) || draft.period < 1) {
    throw new Error('Invalid TOTP digits or period');
  }
  const key = Secret.fromBase32(normalizeSecret(draft.secret));
  if (!key.buffer.byteLength) throw new Error('Empty key');
  return new TOTP({ ...draft, secret: key, issuer: draft.issuer.trim(), label: draft.label.trim() });
}

function readTotpUri(value: string): TotpDraft {
  const url = new URL(value);
  if (url.host.toLowerCase() !== 'totp' || url.username || url.password || url.hash) {
    throw new Error('Expected a TOTP URI');
  }
  const path = decodeURIComponent(url.pathname.slice(1));
  const colon = path.indexOf(':');
  const prefix = colon < 0 ? '' : path.slice(0, colon).trim();
  const label = (colon < 0 ? path : path.slice(colon + 1)).trim();
  const params = url.searchParams;
  const issuer = params.get('issuer')?.trim() || prefix;
  const secret = normalizeSecret(params.get('secret') ?? '');
  const digits = params.get('digits') ?? '6';
  const periodText = params.get('period') ?? '30';
  const algorithm = (params.get('algorithm') ?? 'SHA1').toUpperCase();
  if (!['6', '8'].includes(digits) || !/^\d+$/.test(periodText) || !['SHA1', 'SHA256', 'SHA512'].includes(algorithm)) {
    throw new Error('Unsupported TOTP parameters');
  }
  const draft = {
    secret,
    issuer: prefix && prefix !== issuer ? '' : issuer,
    label,
    digits: Number(digits),
    period: Number(periodText),
    algorithm,
  };
  createTotp(draft); // Validate before applying any metadata.
  return draft;
}

export function identifyInput(value: string, previous: TotpDraft, accounts: SavedTotpAccount[], rawDigits: number): TotpDraft {
  const raw = { ...emptyDraft, secret: value, digits: rawDigits };
  if (/^otpauth:/i.test(value.trim())) {
    try {
      return readTotpUri(value.trim());
    } catch {
      return raw; // Keep the invalid input visible for correction.
    }
  }

  const key = normalizeSecret(value);
  if (!key) return raw;
  if (key === normalizeSecret(previous.secret)) return { ...previous, secret: value };

  const matches = accounts.filter(account => normalizeSecret(account.secret) === key);
  if (matches.length === 1) return { ...matches[0], secret: value };
  // A bare key has no provider or account name, regardless of its length.
  if (!previous.secret.trim()) return { ...raw, issuer: previous.issuer, label: previous.label };
  return raw;
}
