import type { PublishedPrediction } from '@/lib/api/types';

export function clampPercent(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, normalized));
}

export function formatPercent(value?: number | null, fractionDigits = 0) {
  const normalized = clampPercent(value);
  return normalized == null ? '—' : `${normalized.toFixed(fractionDigits)}%`;
}

export function formatSignedPercent(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const normalized = value <= 1 && value >= -1 ? value * 100 : value;
  return `${normalized >= 0 ? '+' : ''}${normalized.toFixed(1)}%`;
}

export function formatRelativeTime(value?: string | Date | null, now = Date.now()) {
  if (!value) return 'Freshness unavailable';
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Freshness unavailable';
  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${Math.floor(minutes / 60)}h ago`;
}

export function isDecisionEligiblePrediction(prediction: PublishedPrediction) {
  return !prediction.staleFlag && prediction.decisionMode !== 'SHADOW';
}

export function selectVerifiedEdges(predictions?: PublishedPrediction[]) {
  return predictions?.filter(isDecisionEligiblePrediction) ?? [];
}

export function selectSettledPredictions(predictions?: PublishedPrediction[], limit = 3) {
  return selectVerifiedEdges(predictions)
    .filter((prediction) => prediction.result === 'WON' || prediction.result === 'LOST')
    .slice(0, limit);
}
