import type { FeedMatch } from '@/lib/api/types';

export function normalizedMatchStatus(match: FeedMatch) {
  return String(match.dataSnapshot?.status ?? match.status ?? '').toUpperCase();
}

export function isFinishedMatch(match: FeedMatch) {
  return ['FT', 'AET', 'PEN', 'FINISHED'].includes(normalizedMatchStatus(match)) || match.dataSnapshot?.phase === 'finished';
}

export function isLiveMatch(match: FeedMatch) {
  const status = normalizedMatchStatus(match);
  const elapsedMinute = match.elapsedMinute ?? match.dataSnapshot?.elapsedMinute;
  return (
    !isFinishedMatch(match) &&
    (match.dataSnapshot?.phase === 'live' ||
      ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status) ||
      (typeof elapsedMinute === 'number' && Number.isFinite(elapsedMinute)))
  );
}

export function parseMatchScore(match: FeedMatch) {
  const parsed = /(\d+)\D+(\d+)/.exec(match.score ?? match.dataSnapshot?.score ?? '');
  if (!parsed) return { away: null, home: null } as const;
  return { away: Number(parsed[2]), home: Number(parsed[1]) } as const;
}

export function matchPhaseLabel(match: FeedMatch) {
  const status = normalizedMatchStatus(match);
  if (status === '1H') return 'First half';
  if (status === '2H') return 'Second half';
  if (status === 'HT') return 'Half time';
  if (status === 'ET') return 'Extra time';
  if (status === 'P' || status === 'PEN') return 'Penalties';
  if (isFinishedMatch(match)) return 'Full time';
  return 'In play';
}

export function formatMatchDate(value: string | Date, long = false) {
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: long ? 'long' : 'short',
  });
}

export function formatMatchTime(value: string | Date) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  });
}

export function matchConfidence(match: FeedMatch) {
  const value =
    match.predictionView?.confidence ??
    match.bestMarket?.confidence ??
    match.dataSnapshot?.readiness?.score ??
    match.dataReadiness?.score;
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : null;
}

export function matchSignalLabel(match: FeedMatch) {
  return (
    match.predictionView?.label ??
    match.predictionView?.marketLabel ??
    match.bestMarket?.label ??
    match.dataSnapshot?.readiness?.label ??
    'Analysis pending'
  );
}

export function matchReadinessLabel(match: FeedMatch) {
  const value =
    match.dataSnapshot?.readiness?.label ??
    match.dataSnapshot?.readiness?.status ??
    match.dataReadiness?.status;
  if (typeof value !== 'string' || value.trim().length === 0) return 'Coverage pending';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
