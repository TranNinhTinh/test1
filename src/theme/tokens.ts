/** Mirrors Mobile theme — use with Tailwind/CSS variables for one source of truth in CSS. */

export const colors = {
  seed: '#14B8A6',
  seedDark: '#0D9488',
  seedLight: '#2DD4BF',
  brandTint: '#E6FFFA',
  surface: '#FFFBFE',
  surfaceContainerLowest: '#F7FAFA',
  surfaceContainerHighest: '#E7EEF0',
  onSurface: '#1D1B20',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
  error: '#B3261E',
  onPrimary: '#FFFFFF',
} as const

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  sheetTop: 24,
} as const

export const motion = {
  fastMs: 160,
  mediumMs: 260,
  slowMs: 380,
} as const
