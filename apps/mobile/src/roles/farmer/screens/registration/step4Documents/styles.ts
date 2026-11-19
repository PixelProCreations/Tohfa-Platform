import { StyleSheet } from 'react-native';
import { typography, authPalette as P } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitleCol: { flex: 1 },
  backButtonCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: typography.title, fontWeight: '800' },
  headerSubtitle: { fontSize: typography.bodySmall },
  skipText: { fontSize: typography.body, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressSegment: { flex: 1, height: 5, borderRadius: 3 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },

  // Card styles
  docCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  docCardActive: { borderWidth: 1.5 },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  docCardHeaderText: { flex: 1, marginRight: 8 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requiredMark: { fontWeight: '700' },
  docCardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionalBadge: {
    fontSize: typography.bodySmall,
  },
  docCardHint: {
    fontSize: typography.bodySmall,
    marginTop: 2,
  },
  subTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
  },
  subTypePillText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadPromptText: {
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  uploadFormatText: {
    fontSize: typography.bodySmall,
    textAlign: 'center',
  },
  uploadErrorText: {
    fontSize: typography.bodySmall,
    marginLeft: 2,
    marginTop: 8,
  },

  // Uploaded state
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadedCheckCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedInfo: {
    flex: 1,
  },
  uploadedBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 3,
    marginBottom: 3,
  },
  uploadedBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  uploadedFileName: {
    fontSize: typography.body,
    marginTop: 2,
  },
  savedMark: { fontWeight: '700' },
  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Uploading state
  uploadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  uploadingTitle: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
  },

  // Info banner
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.noticeBg,
    borderWidth: 1,
    borderColor: P.noticeBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
    gap: 12,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoBoxText: {
    flex: 1,
    fontSize: typography.body,
    color: P.noticeText,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },

  // Picker modal
  modalSafeRoot: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    borderRadius: 18,
    width: '90%',
    maxWidth: 400,
    maxHeight: '75%',
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  pickerTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerList: { maxHeight: 360 },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  pickerOptionText: {
    fontSize: typography.bodyLarge,
  },
});

/** Shared 8dp hit slop for the small close / remove buttons. */
export const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 } as const;
