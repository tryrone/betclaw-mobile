import type { MinuteDrawResult } from '@/lib/api/types';

export const MINUTE_DRAW_PRESENTATION = {
  BELOW_THRESHOLD: { label: 'Below threshold', tone: 'warning' },
  RECOMMENDED: { label: 'Recommended', tone: 'success' },
  STALE: { label: 'Stale', tone: 'danger' },
  UNRATED: { label: 'Unrated', tone: 'neutral' },
} as const satisfies Record<
  MinuteDrawResult['recommendationState'],
  { label: string; tone: 'danger' | 'neutral' | 'success' | 'warning' }
>;

export function isMinuteDrawHandoffFresh(input: {
  nowMs?: number;
  quoteFetchedAt: string | Date;
  serverFresh: boolean;
  staleAfterSeconds: number;
}) {
  const quoteMs = new Date(input.quoteFetchedAt).getTime();
  const nowMs = input.nowMs ?? Date.now();
  if (!input.serverFresh || !Number.isFinite(quoteMs) || nowMs <= 0) return false;
  const ageMs = nowMs - quoteMs;
  return ageMs >= 0 && ageMs <= input.staleAfterSeconds * 1_000;
}
