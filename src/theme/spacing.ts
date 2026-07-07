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
  /** Outer horizontal gutter applied by Screen — a little breathing room from the screen edges. */
  screenHorizontalGutter: 2.5,
  /** Shared phone content cap; content centers and gains side gutters beyond this width. */
  screenMaxWidth: 408,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;
