import { StyleSheet } from 'react-native';
import { authPalette as P, typography } from '../../../../theme';

const HEADER_TOP_GAP = 6;
const HEADER_BOTTOM_GAP = 10;
const TITLE_LETTER_SPACING = 0.8;

/** Section-header styles shared by every body section of the crop detail screen. */
export const sectionStyles = StyleSheet.create({
  sectionHeader: {
    marginBottom: HEADER_BOTTOM_GAP,
    marginTop: HEADER_TOP_GAP,
  },
  sectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: TITLE_LETTER_SPACING,
  },
});

