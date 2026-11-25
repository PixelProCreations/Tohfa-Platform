/**
 * Styles for the Tohfa Admin shell and its bottom tab bar, ported from the
 * design (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen: root,
 * bottomNav, navTabItem, navTabLabel, navTabLabelActive) with every literal
 * on a token:
 *   - navTabItem paddingVertical 2 is half the `xs` step (no 2pt token);
 *   - navTabLabel marginTop 3 has no token either; it is the `xs` step (4),
 *     one point more than the design;
 *   - navTabLabel fontSize 10 is the `caption` type style's own size, so the
 *     design's explicit fontSize override is just the caption spread.
 */
import { StyleSheet } from 'react-native';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';

export const tohfaShellStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  body: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
    ...adminShadow.sm,
  },
  navTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.xs / 2,
  },
  navTabLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  navTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
