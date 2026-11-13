import { Platform, StyleSheet } from 'react-native';
import { authPalette as P, typography } from '../../../../theme';

// Layout values lifted verbatim from the original inline styles, named so the
// stylesheet below carries no bare magic numbers.
const SPACE = {
  hair: 1,
  xxs: 2,
  xs: 4,
  s: 6,
  sm: 8,
  m: 10,
  md: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 36,
} as const;

const RADIUS = {
  xs: 4,
  chip: 6,
  sm: 8,
  badge: 10,
  md: 12,
  lg: 14,
  xl: 18,
  round: 21,
} as const;

const SIZE = {
  dot: 8,
  removeBtn: 20,
  photo: 64,
  backBtn: 42,
  input: 48,
  select: 50,
  saveBtn: 52,
  lineHeightSmall: 16,
} as const;

const BORDER = { hairline: 1, thick: 1.5 } as const;
const LETTER_SPACING_TITLE = -0.3;
const ANDROID_TOP_PAD = 6;
const IOS_TOP_PAD = 4;
const DISABLED_OPACITY = 0.7;

// No overlay/scrim token exists in the design tokens yet.
const REMOVE_PHOTO_BG = 'rgba(0, 0, 0, 0.65)';
const MODAL_SCRIM = 'rgba(0, 0, 0, 0.45)';

const selectBox = {
  height: SIZE.select,
  borderRadius: RADIUS.md,
  borderWidth: BORDER.thick,
  backgroundColor: P.white,
  paddingHorizontal: SPACE.lg,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
} as const;

const inputFrame = {
  height: SIZE.input,
  borderRadius: RADIUS.md,
  borderWidth: BORDER.hairline,
  borderColor: P.twGray200,
  paddingHorizontal: SPACE.base,
} as const;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.xl,
    paddingTop: Platform.OS === 'android' ? ANDROID_TOP_PAD : IOS_TOP_PAD,
    paddingBottom: SPACE.m,
    backgroundColor: P.white,
  },
  backButton: {
    width: SIZE.backBtn,
    height: SIZE.backBtn,
    borderRadius: RADIUS.round,
    borderWidth: BORDER.hairline,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACE.base,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: LETTER_SPACING_TITLE,
  },
  headerSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: SPACE.hair,
  },
  cancelButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray600,
    paddingHorizontal: SPACE.xs,
    paddingVertical: SPACE.s,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.m,
    paddingBottom: SPACE.xxxl,
  },
  formGroup: {
    marginTop: SPACE.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACE.s,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: SPACE.s,
  },
  subLabel: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
    marginBottom: SPACE.s,
  },
  subLabelNoMargin: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twGray800,
    marginLeft: SPACE.s,
  },
  requiredAsterisk: {
    color: P.red700,
    fontWeight: '700',
  },
  selectBoxGreen: {
    ...selectBox,
    borderColor: P.forestGreen,
  },
  selectBoxPurple: {
    ...selectBox,
    borderColor: P.deepPurple600,
  },
  selectBoxText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray900,
  },
  helpText: {
    fontSize: typography.bodySmall,
    lineHeight: SIZE.lineHeightSmall,
    color: P.twGray400,
    marginTop: SPACE.s,
  },
  errorText: {
    fontSize: typography.bodySmall,
    lineHeight: SIZE.lineHeightSmall,
    color: P.twRed600,
    fontWeight: '600',
    marginTop: SPACE.s,
  },
  pestInfoCard: {
    backgroundColor: P.violetTint1,
    borderWidth: BORDER.hairline,
    borderColor: P.twPurple200,
    borderRadius: RADIUS.lg,
    padding: SPACE.base,
    marginTop: SPACE.md,
  },
  pestInfoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: SIZE.dot,
    height: SIZE.dot,
    borderRadius: RADIUS.xs,
    backgroundColor: P.twRed500,
    marginRight: SPACE.sm,
  },
  scientificNameText: {
    fontSize: typography.body,
    fontWeight: '700',
    fontStyle: 'italic',
    color: P.twGray900,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
    gap: SPACE.xs,
    borderWidth: BORDER.hairline,
    borderColor: P.twGray200,
  },
  seasonBadgeText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.twGray600,
  },
  pestSubNote: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: SPACE.xs,
    marginLeft: SPACE.lg,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: SPACE.md,
    marginTop: SPACE.base,
  },
  col: {
    flex: 1,
  },
  inputBox: {
    ...inputFrame,
    backgroundColor: P.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputBoxText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: SIZE.dot,
    height: SIZE.dot,
    borderRadius: RADIUS.xs,
    marginRight: SPACE.s,
  },
  severityDotHigh: { backgroundColor: P.twRed500 },
  severityDotMedium: { backgroundColor: P.twAmber600 },
  severityDotLow: { backgroundColor: P.twGreen500 },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACE.sm,
  },
  photoThumbContainer: {
    position: 'relative',
    marginRight: SPACE.md,
  },
  photoThumb: {
    width: SIZE.photo,
    height: SIZE.photo,
    borderRadius: RADIUS.md,
    backgroundColor: P.twGray100,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: SPACE.xs,
    right: SPACE.xs,
    width: SIZE.removeBtn,
    height: SIZE.removeBtn,
    borderRadius: RADIUS.badge,
    backgroundColor: REMOVE_PHOTO_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: SIZE.photo,
    height: SIZE.photo,
    borderRadius: RADIUS.md,
    borderWidth: BORDER.thick,
    borderStyle: 'dashed',
    borderColor: P.deepPurple600,
    backgroundColor: P.twPurple100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numInput: {
    ...inputFrame,
    backgroundColor: P.white,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  autoFieldBox: {
    ...inputFrame,
    backgroundColor: P.twGray50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phiInputText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    flex: 1,
  },
  autoBadge: {
    backgroundColor: P.twGray200,
    borderRadius: RADIUS.chip,
    paddingHorizontal: SPACE.s,
    paddingVertical: SPACE.xxs,
  },
  autoBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
  },
  dateBox: {
    height: SIZE.select,
    borderRadius: RADIUS.md,
    borderWidth: BORDER.hairline,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: SPACE.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACE.s,
  },
  dateText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  dateDaysBadge: {
    backgroundColor: P.twGray100,
    borderRadius: RADIUS.badge,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.xs,
  },
  dateDaysBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
  },
  saveBtn: {
    height: SIZE.saveBtn,
    borderRadius: RADIUS.lg,
    backgroundColor: P.deepPurple600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.xxl,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: DISABLED_OPACITY,
  },
  saveBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: MODAL_SCRIM,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACE.xxl,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: RADIUS.xl,
    padding: SPACE.xl,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACE.md,
    borderBottomWidth: BORDER.hairline,
    borderBottomColor: P.twGray100,
    marginBottom: SPACE.sm,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalItem: {
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.sm,
    borderBottomWidth: BORDER.hairline,
    borderBottomColor: P.twGray50,
  },
  modalItemSelected: {
    backgroundColor: P.twPurple100,
    borderRadius: RADIUS.sm,
  },
  modalItemText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray900,
  },
  modalItemTextSelected: {
    color: P.deepPurple600,
    fontWeight: '700',
  },
  modalSubItemText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: SPACE.xxs,
  },
});
