import { StyleSheet } from 'react-native';
import { colors, authPalette as P, spacing, typography } from '../../../theme';

/**
 * Shared stylesheet for the Profile screen and its section components. Kept in one place
 * (rather than one sheet per card) because the cards deliberately share row, chip and modal
 * styles so they cannot drift apart.
 */
export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.paleSurface,
  },
  scrollContainer: {
    paddingBottom: 12,
  },

  // --- HEADER SECTION ---
  headerBanner: {
    backgroundColor: P.deepGreen,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: {
    marginTop: -2,
  },
  navTitle: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileHero: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: P.slate200,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  farmerName: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
    marginBottom: 6,
  },
  idBadgePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  idBadgeText: {
    color: P.greenPaleBg,
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  farmNameText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '500',
    marginBottom: 3,
  },
  locationText: {
    color: P.green100,
    fontSize: typography.bodySmall,
    fontWeight: '400',
  },

  // Shared row layout for an Icon placed immediately before/after a text label.
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // --- QUICK STATS ROW ---
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.body,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  auditStatValue: {
    fontSize: typography.caption,
    lineHeight: 13,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate400,
    letterSpacing: 0.5,
  },

  toastSuccess: {
    backgroundColor: colors.brandGreenLight,
    borderWidth: 1,
    borderColor: P.green200,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  toastSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toastSuccessText: {
    color: P.deepGreen,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- CARDS ---
  cardContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: P.slate100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate800,
  },
  cardSubtitle: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    marginTop: 1,
  },
  cardActionLink: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.brandGreen,
  },

  // Details row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.slate100,
  },
  detailLabel: {
    fontSize: typography.body,
    color: P.slate500,
  },
  detailValue: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
    textAlign: 'right',
  },

  // --- FMB MAP PREVIEW ---
  fmbMapContainer: {
    height: 135,
    backgroundColor: P.certCardBg,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbMapSkeleton: {
    ...StyleSheet.absoluteFill,
    height: '100%',
  },
  fmbMapEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  fmbMapEmptyText: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate500,
    textAlign: 'center',
  },
  gpsCoordinatesBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  // Re-anchors the GPS badge's look to the bottom edge for the "tap to draw" hint, so the two
  // overlays never sit on top of each other.
  fmbMapHintBadge: {
    top: undefined,
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    alignItems: 'center',
  },
  gpsCoordinatesText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  fmbMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: P.certCardBgAlt,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  fmbMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  fmbMetricValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  fmbMetricLabel: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate400,
    marginTop: 2,
  },
  fmbMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: P.slate200,
  },
  tagPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagPillText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },

  // --- CERTIFICATIONS ---
  certCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  certSubCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  certCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  greenCheckmarkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenCheckmarkText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  orangeExclamationCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: P.orange900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeExclamationText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  certTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  certStatusText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    marginTop: 2,
  },
  certRenewText: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 2,
  },
  certSkeleton: {
    borderRadius: 14,
  },
  certNoticeText: {
    fontSize: typography.body,
    color: P.slate500,
    lineHeight: 19,
  },
  warningNoticeBox: {
    backgroundColor: P.amber50,
    borderColor: P.amber200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningNoticeText: {
    fontSize: typography.caption,
    color: P.amberDeep,
    flex: 1,
    lineHeight: 16,
  },

  // --- AUDITS ---
  nextAuditBanner: {
    backgroundColor: P.paleBlueBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  auditProgressSquare: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
  },
  auditProgressFraction: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.sky600,
  },
  auditProgressDone: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.slate500,
  },
  nextAuditDetails: {
    flex: 1,
  },
  nextAuditSubLabel: {
    fontSize: typography.caption,
    color: P.slate500,
  },
  nextAuditDateText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
    marginTop: 1,
  },
  auditDueRedPill: {
    backgroundColor: P.deepOrange600,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  auditDueRedText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  auditList: {
    marginTop: 4,
  },
  auditItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.slate100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  auditItemInfo: {
    flex: 1,
  },
  auditItemDate: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
  },
  auditItemSubtext: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 2,
  },
  auditScore: {
    fontSize: typography.body,
    fontWeight: '700',
  },

  // --- FARM RATING ---
  ratingHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ratingGaugeContainer: {
    width: 86,
    height: 86,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ratingGaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingGaugeScore: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.slate800,
  },
  ratingGaugeMax: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: P.slate400,
  },
  ratingStatusDetails: {
    flex: 1,
  },
  ratingStatusTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.deepGreen,
  },
  ratingDeltaPill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingDeltaText: {
    color: colors.brandGreen,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  ratingBarsList: {
    marginTop: 6,
    gap: 10,
  },
  barItem: {
    marginBottom: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.slate600,
  },
  barScore: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: P.slate100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // --- SOIL TEST ---
  soilDateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: P.paleAmberBg2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  soilDateLabel: {
    fontSize: typography.caption,
    color: P.twAmber900,
  },
  soilDateValue: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twAmber900,
    marginTop: 1,
  },
  soilGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilGridTile: {
    width: '48%',
    backgroundColor: P.certCardBgAlt,
    borderRadius: 10,
    padding: 10,
  },
  soilTileLabel: {
    fontSize: typography.caption,
    color: P.slate500,
    marginBottom: 2,
  },
  soilTileValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 4,
  },
  soilBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  soilBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  soilAdvisoryBox: {
    backgroundColor: P.red50,
    borderColor: P.red100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soilAdvisoryText: {
    fontSize: typography.caption,
    color: P.red800,
    flex: 1,
    lineHeight: 16,
  },

  // --- MENU / ACTION LIST ---
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitleBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate800,
  },
  menuSubtitle: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 1,
  },
  menuRedBadge: {
    backgroundColor: P.twRed500,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuRedBadgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: P.slate100,
    marginLeft: 54,
  },

  // --- STANDALONE LOGOUT & FOOTER ---
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 24,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: P.twRed100,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  logoutButtonText: {
    color: P.twRed500,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  footerVersionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  footerVersionText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginBottom: 4,
    fontWeight: '500',
  },
  footerMemberText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    fontWeight: '500',
  },

  // --- MODALS ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  modalTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.slate800,
  },
  modalCloseText: {
    padding: 4,
  },
  modalBody: {
    marginVertical: 14,
  },
  inputLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.slate600,
    marginBottom: 6,
    marginTop: 8,
  },
  fieldErrorText: {
    color: P.red600,
    fontSize: typography.bodySmall,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.slate300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: typography.body,
    color: P.slate800,
    backgroundColor: P.slate50,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.slate300,
    backgroundColor: colors.white,
  },
  choiceChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  choiceChipText: {
    fontSize: typography.body,
    color: P.slate600,
    fontWeight: '500',
  },
  choiceChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  lockedSection: {
    backgroundColor: P.slate50,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  lockedSectionTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 4,
  },
  lockedSectionSubtitle: {
    fontSize: typography.caption,
    color: P.slate500,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.slate500,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: P.deepGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.white,
  },

  // Document modal items
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    backgroundColor: colors.white,
    marginBottom: 10,
    gap: 12,
  },
  docTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  docStatusGreen: {
    fontSize: typography.caption,
    color: colors.brandGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  docActionText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.sky600,
  },
  docUploadBtn: {
    backgroundColor: P.orange900,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docUploadBtnText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '700',
  },

  // Bank preview card
  bankCardPreview: {
    backgroundColor: P.successDark,
    borderRadius: 14,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  bankName: {
    color: colors.white,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  bankBranch: {
    color: P.green100,
    fontSize: typography.caption,
    marginTop: 2,
  },
  bankAccountNum: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: '700',
    letterSpacing: 2,
    marginVertical: 16,
  },
  bankFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankIfsc: {
    color: P.green100,
    fontSize: typography.caption,
  },
  bankHolder: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },

  // --- Layout helpers lifted out of inline style objects ---
  alignEnd: {
    alignItems: 'flex-end',
  },
  flex1: {
    flex: 1,
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },
  farmingTypeNote: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 2,
  },
  farmingTypeNoteEdit: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: -8,
    marginBottom: 12,
  },
  skeletonGapLg: {
    marginBottom: 12,
  },
  skeletonGapSm: {
    marginBottom: 8,
  },
  menuCardTight: {
    paddingVertical: 6,
  },
  ratingIntro: {
    fontSize: typography.body,
    color: P.slate500,
    marginBottom: 14,
  },
  fullWidth: {
    width: '100%',
  },
  noTestYetHint: {
    marginTop: 4,
  },
  lockedTitleRow: {
    marginBottom: 4,
  },
  lockedTitleNoMargin: {
    marginBottom: 0,
  },
  docInfoRow: {
    marginTop: 2,
  },
  docStatusNoMargin: {
    marginTop: 0,
  },
  docStatusWarn: {
    color: P.orange900,
    marginTop: 0,
  },
  docCardAlert: {
    borderColor: P.orange400,
    backgroundColor: P.alertBgCream,
  },
  detailRowGapMd: {
    marginTop: 16,
  },
  detailRowGapLg: {
    marginTop: 20,
  },
  greenValue: {
    color: colors.brandGreen,
  },
  iconBoxGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  iconBoxViolet: {
    backgroundColor: P.violetTint,
  },
  iconBoxBlue: {
    backgroundColor: P.blue50,
  },
  iconBoxLightBlue: {
    backgroundColor: P.lightBlue50,
  },
  iconBoxAmber: {
    backgroundColor: P.amber50,
  },
  iconBoxOrange: {
    backgroundColor: P.twOrange50,
  },
  tagPillGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  tagPillTextGreen: {
    color: colors.brandGreen,
  },
  soilBadgeGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  soilBadgeTextGreen: {
    color: colors.brandGreen,
  },
  soilBadgeAlert: {
    backgroundColor: P.red50,
  },
  soilBadgeTextAlert: {
    color: P.red800,
  },
  soilBadgeWarn: {
    backgroundColor: P.orange50,
  },
  soilBadgeTextWarn: {
    color: P.orange900,
  },
  deepGreenText: {
    color: P.deepGreen,
  },
  orangeText: {
    color: P.orange900,
  },
});
