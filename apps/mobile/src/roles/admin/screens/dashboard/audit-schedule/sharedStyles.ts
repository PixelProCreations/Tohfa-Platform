/** Styles every Audit Schedule view uses (design port). */
import { StyleSheet } from 'react-native';
import { adminColors, adminOverlay, adminSpacing } from '../../../theme';

export const sharedStyles = StyleSheet.create({
  rootOrange: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBackBtn: {
    padding: adminSpacing.xs,
  },
  headerFilterCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
