/**
 * Styles for the shared admin "More" menu, ported from the design
 * (origin/tofhafarmfin-rbac AdminMoreMenuScreen) with every literal moved
 * onto a token:
 *   - header paddingTop 6 and row paddingVertical 14 are the approved half
 *     steps `xsSm` / `mdLg` (tokens.json $spacingHalfStepNote);
 *   - the 28-wide icon column has no single spacing token, so it is xl + xs;
 *   - the row label is 14 / 700 in the design, which no admin type style has;
 *     its size comes from the platform `body` type style (14 / 20).
 */
import { StyleSheet } from 'react-native';
import { tokens } from '@tohfa/design-tokens';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

export const moreMenuStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xsSm,
    paddingBottom: adminSpacing.sm,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  menuContainer: {
    gap: adminSpacing.sm,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.mdLg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  menuIconBox: {
    width: adminSpacing.xl + adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: tokens.typeStyle.body.size,
    lineHeight: tokens.typeStyle.body.lineHeight,
    fontWeight: '700',
  },
  menuItemLabelDanger: {
    color: adminColors.danger.text,
  },
  bottomSpacer: {
    height: adminSpacing.xxxl,
  },
});
