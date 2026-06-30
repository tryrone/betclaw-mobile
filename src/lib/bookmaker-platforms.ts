export const DEFAULT_BOOKMAKER_PLATFORM = 'SPORTYBET' as const;

export const BOOKMAKER_PLATFORM_OPTIONS = [
  { id: 'SPORTYBET', label: 'SportyBet' },
  { id: 'BET9JA', label: 'Bet9ja' },
  { id: 'FOOTBALL_COM', label: 'Football.com' },
  { id: 'STAKE', label: 'Stake' },
  { id: 'RAINBET', label: 'Rainbet' },
  { id: '1XBET', label: '1xBet' },
] as const;

export type SupportedPlatform = (typeof BOOKMAKER_PLATFORM_OPTIONS)[number]['id'];

export function getPlatformLabel(platform?: string | null) {
  return BOOKMAKER_PLATFORM_OPTIONS.find((option) => option.id === platform)?.label ?? 'SportyBet';
}
