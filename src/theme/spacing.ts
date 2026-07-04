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
  screenGutter: 3,
  /** Outer horizontal gutter applied by Screen (12 -> 6 -> 3 -> 1.5 per design passes). */
  screenHorizontalGutter: 1.5,
  /** Shared phone content cap; widens the prior 390 cap so wide-phone gutters are roughly halved. */
  screenMaxWidth: 408,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
