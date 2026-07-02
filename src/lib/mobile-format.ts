import { Linking, Platform, Share } from 'react-native';

import { apiBaseUrl } from '@/lib/config';

/**
 * Open an external URL safely.
 *
 * Restricts to http(s) — link targets here come from untrusted sources (AI
 * research citations, payment provider receipts) — checks the OS can handle it,
 * and never throws so callers don't need their own try/catch. Returns whether
 * the URL was opened.
 */
export async function openExternalUrl(url?: string | null) {
  if (!url || !/^https?:\/\//i.test(url)) return false;

  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export function formatCurrency(amount?: number | null, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(amount ?? 0));
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
}

export function publicWebBaseUrl() {
  const fallback = 'https://betsclaw.win';

  try {
    const url = new URL(apiBaseUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '10.0.2.2') {
      return fallback;
    }
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  } catch {
    return fallback;
  }
}

export async function copyOrShareText(text: string, title = 'BetClaw') {
  const clipboard = (globalThis as { navigator?: { clipboard?: { writeText?: (value: string) => Promise<void> } } }).navigator?.clipboard;

  if (Platform.OS === 'web' && clipboard?.writeText) {
    await clipboard.writeText(text);
    return 'copied' as const;
  }

  await Share.share({ message: text, title });
  return 'shared' as const;
}

/**
 * True when a citation/evidence URL points at a real, openable destination.
 * Filters out placeholder hosts (example.com, localhost) the research step
 * sometimes emits so the UI never links to a dead page.
 */
export function isRealUrl(url?: string | null) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.test') || host.endsWith('.invalid')) return false;
    if (/(^|\.)example\.(com|org|net)$/.test(host)) return false;
    return host.includes('.');
  } catch {
    return false;
  }
}
