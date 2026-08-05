export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const layout = {
  /** Top gutter applied by Screen. */
  screenGutter: 8,
  /** ScoreSync-inspired edge gutter: airy, but still useful on compact phones. */
  screenHorizontalGutter: 16,
  /** Shared phone content cap; content centers and gains side gutters beyond this width. */
  screenMaxWidth: 520,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;
