/**
 * Translucent white/black/slate overlays used on the hero banner. They are
 * alpha variants with no design-token equivalent, so they live here (one place,
 * named) instead of being inlined in each StyleSheet.
 */
export const heroOverlayColors = {
  scrim: 'rgba(15, 23, 42, 0.65)',
  controlBg: 'rgba(0, 0, 0, 0.45)',
  controlBorder: 'rgba(255, 255, 255, 0.35)',
  thumbBorder: 'rgba(255, 255, 255, 0.5)',
  subtitle: 'rgba(255, 255, 255, 0.85)',
  statBg: 'rgba(255, 255, 255, 0.15)',
  statBorder: 'rgba(255, 255, 255, 0.25)',
  statLabel: 'rgba(255, 255, 255, 0.85)',
} as const;
