import { Platform, StyleSheet } from 'react-native';
import { authPalette as P, colors, radius, spacing, typography } from '../../../../theme';

// Values with an exact design-token match use `spacing` / `radius`; the rest
// are the mock's dimensions, named here once instead of repeated inline.
export const HAIRLINE = 1;
export const PAGE_GUTTER = 20;
export const FIELD_HEIGHT = 48;
const FIELD_GAP = 6;
const FIELD_PAD_H = 14;
const LABEL_GAP = 2;
const HEADER_PAD_BOTTOM = 14;
const BACK_BUTTON_SIZE = 40;
const BACK_BUTTON_GAP = 14;
export const AVATAR_SIZE = 78;
const CAMERA_BADGE_SIZE = 26;
const CAMERA_BADGE_OFFSET = -2;
const CAMERA_BADGE_BORDER = 2;
/** Room under the scroll content for the absolutely-positioned bottom bar. */
const SCROLL_BOTTOM_CLEARANCE = 100;
const SECTION_TITLE_TOP = 10;
const SEGMENT_PAD_V = 10;
const SEGMENT_RADIUS = 9;
const EXPLAINER_LINE_HEIGHT = 17;
const ERROR_LINE_HEIGHT = 18;
const BOTTOM_BAR_PAD_IOS = 28;
const SAVE_BUTTON_HEIGHT = 50;
const SAVE_BUTTON_RADIUS = 14;
const DISABLED_OPACITY = 0.6;
const TITLE_LETTER_SPACING = -0.2;
export const CAPS_LETTER_SPACING = 0.8;
const SUBTITLE_TOP = 1;
const MODAL_RADIUS = 18;
const MODAL_PAD = 20;
const MODAL_TITLE_GAP = 14;
const OPTION_RADIUS = 10;
const OVERLAY_SCRIM = 'rgba(0,0,0,0.4)';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },

  /* Edit screen: initial load / error states */
  loadingContainer: {
    padding: PAGE_GUTTER,
    gap: spacing.md,
  },
  skeletonAvatar: {
    alignSelf: 'center',
    width: AVATAR_SIZE,
  },
  loadErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: spacing.md,
    paddingBottom: HEADER_PAD_BOTTOM,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    borderWidth: HAIRLINE,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: BACK_BUTTON_GAP,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: TITLE_LETTER_SPACING,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: SUBTITLE_TOP,
  },
  cancelButtonText: {
    fontSize: typography.body,
    fontWeight: '500',
    color: P.twGray500,
    paddingHorizontal: spacing.xs,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: PAGE_GUTTER,
    paddingBottom: SCROLL_BOTTOM_CLEARANCE,
  },

  /* Avatar */
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: CAMERA_BADGE_OFFSET,
    right: CAMERA_BADGE_OFFSET,
    width: CAMERA_BADGE_SIZE,
    height: CAMERA_BADGE_SIZE,
    borderRadius: CAMERA_BADGE_SIZE / 2,
    backgroundColor: colors.brandGreen,
    borderWidth: CAMERA_BADGE_BORDER,
    borderColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: typography.body,
    color: P.twGray500,
    marginTop: spacing.sm,
  },

  /* Fields */
  formContainer: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: FIELD_GAP,
  },
  fieldLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: LABEL_GAP,
  },
  requiredAsterisk: {
    color: P.twRed500,
  },
  textInput: {
    height: FIELD_HEIGHT,
    backgroundColor: P.white,
    borderWidth: HAIRLINE,
    borderColor: P.twGray200,
    borderRadius: radius.lg,
    paddingHorizontal: FIELD_PAD_H,
    fontSize: typography.body,
    color: P.nearBlack,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  columnField: {
    flex: 1,
    gap: FIELD_GAP,
  },
  pickerInputBox: {
    height: FIELD_HEIGHT,
    backgroundColor: P.white,
    borderWidth: HAIRLINE,
    borderColor: P.twGray200,
    borderRadius: radius.lg,
    paddingHorizontal: FIELD_PAD_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValueText: {
    fontSize: typography.body,
    color: P.nearBlack,
    fontWeight: '500',
  },
  ageHelperText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.brandGreen,
    marginTop: LABEL_GAP,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: CAPS_LETTER_SPACING,
    marginTop: SECTION_TITLE_TOP,
    marginBottom: LABEL_GAP,
  },
  sourceSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  sourceSegmentBtn: {
    flex: 1,
    paddingVertical: SEGMENT_PAD_V,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SEGMENT_RADIUS,
  },
  sourceSegmentBtnActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceSegmentText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray500,
  },
  sourceSegmentTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  statusExplainerText: {
    fontSize: typography.bodySmall,
    lineHeight: EXPLAINER_LINE_HEIGHT,
    color: P.twGray500,
    marginTop: spacing.xs,
  },
  statusHighlightOrange: {
    fontWeight: '700',
    color: P.twAmber800,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: HAIRLINE,
    borderColor: P.twRed200,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    lineHeight: ERROR_LINE_HEIGHT,
  },
  fieldErrorText: {
    fontSize: typography.caption,
    color: P.twRed600,
    marginTop: spacing.xs,
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? BOTTOM_BAR_PAD_IOS : spacing.lg,
    borderTopWidth: HAIRLINE,
    borderTopColor: P.twGray100,
  },
  saveButton: {
    height: SAVE_BUTTON_HEIGHT,
    backgroundColor: colors.brandGreen,
    borderRadius: SAVE_BUTTON_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: DISABLED_OPACITY,
  },
  saveButtonText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.white,
  },
});

/**
 * Option-picker modals. The two screens were designed with different pickers
 * (Register: header row with close button, tinted selected row and check
 * mark; Edit: plain list with an underlined selected row), so each keeps its
 * own look.
 */
const modalOverlay = {
  flex: 1,
  backgroundColor: OVERLAY_SCRIM,
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing.xl,
} as const;

const modalCardBase = {
  width: '100%',
  backgroundColor: P.white,
  borderRadius: MODAL_RADIUS,
  padding: MODAL_PAD,
  shadowColor: P.black,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 10,
} as const;

const REGISTER_OPTION_PAD_V = 13;

export const registerPickerStyles = StyleSheet.create({
  modalOverlay,
  modalCard: {
    ...modalCardBase,
    shadowOpacity: 0.15,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: MODAL_TITLE_GAP,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: REGISTER_OPTION_PAD_V,
    paddingHorizontal: spacing.md,
    borderRadius: OPTION_RADIUS,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: typography.bodyLarge,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen800,
  },
});

export const editPickerStyles = StyleSheet.create({
  modalOverlay,
  modalCard: {
    ...modalCardBase,
    shadowOpacity: 0.1,
    elevation: 5,
  },
  modalTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: MODAL_TITLE_GAP,
  },
  modalOption: {
    paddingVertical: spacing.md,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: P.twGray100,
  },
  modalOptionSelected: {
    borderBottomColor: colors.brandGreen,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});

/** Shared touch-target padding for small header / close buttons. */
export const HIT_SLOP_HEADER = { top: 10, bottom: 10, left: 10, right: 10 };
export const HIT_SLOP_CLOSE = { top: 8, bottom: 8, left: 8, right: 8 };
