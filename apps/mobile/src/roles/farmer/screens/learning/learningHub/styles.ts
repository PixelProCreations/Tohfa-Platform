import { StyleSheet } from 'react-native';
import { colors, authPalette as P, typography } from '../../../theme';
import { DIM, LETTER, LINE, OVERLAY, RAD, SHADOW, SP } from './constants';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.weatherCloudWhite,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.s16,
    paddingTop: SP.xl,
    paddingBottom: SP.s12,
    backgroundColor: P.weatherCloudWhite,
  },
  backButton: {
    width: DIM.backButton,
    height: DIM.backButton,
    borderRadius: RAD.r19,
    backgroundColor: P.weatherCloudWhite,
    borderWidth: DIM.hairline,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.s14,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset1 },
    shadowOpacity: SHADOW.opacityLight,
    shadowRadius: SHADOW.radiusSm,
    elevation: SHADOW.elev1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: LETTER.tight,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.greyMid1,
    marginTop: SP.hair,
  },

  // Scroll View
  bottomSpacer: {
    height: DIM.bottomSpacer,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SP.s16,
    paddingTop: SP.md,
    paddingBottom: SP.s30,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.tanTint1,
    borderRadius: RAD.r14,
    paddingHorizontal: SP.s14,
    height: DIM.searchHeight,
    marginBottom: SP.s14,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textDark,
    marginLeft: SP.xl,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: SP.sm,
  },

  // Segmented Tabs Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: P.tanTint1,
    borderRadius: RAD.r22,
    padding: SP.xs,
    marginBottom: SP.s18,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SP.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RAD.r19,
  },
  tabItemActive: {
    backgroundColor: P.weatherCloudWhite,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset2 },
    shadowOpacity: SHADOW.opacityTab,
    shadowRadius: SHADOW.radiusMd,
    elevation: SHADOW.elev2,
  },
  tabText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray500,
  },
  tabTextActive: {
    color: colors.textDark,
    fontWeight: '800',
  },

  // Featured Video Card
  featuredCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: RAD.r18,
    borderWidth: DIM.hairline,
    borderColor: P.tanTint2,
    overflow: 'hidden',
    marginBottom: SP.s16,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset4 },
    shadowOpacity: SHADOW.opacityCard,
    shadowRadius: SHADOW.radiusXl,
    elevation: SHADOW.elev3,
  },
  featuredThumbnail: {
    height: DIM.featuredThumbHeight,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: SP.s12,
    left: SP.s12,
    backgroundColor: OVERLAY.featuredBadge,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.sm,
    borderRadius: RAD.r6,
  },
  featuredBadgeText: {
    color: P.weatherCloudWhite,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: LETTER.badge,
  },
  featuredPlayCircle: {
    width: DIM.featuredPlay,
    height: DIM.featuredPlay,
    borderRadius: DIM.featuredPlayRadius,
    backgroundColor: P.weatherCloudWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: SP.xs,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset4 },
    shadowOpacity: SHADOW.opacityPlay,
    shadowRadius: SHADOW.radiusLg,
    elevation: SHADOW.elev6,
  },
  featuredDurationBadge: {
    position: 'absolute',
    bottom: SP.xl,
    right: SP.s12,
    backgroundColor: OVERLAY.featuredDuration,
    paddingHorizontal: SP.s7,
    paddingVertical: SP.xs,
    borderRadius: RAD.r5,
  },
  durationBadgeText: {
    color: P.weatherCloudWhite,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  featuredInfo: {
    padding: SP.s16,
  },
  featuredTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: LINE.l21,
    marginBottom: SP.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
  },
  authorText: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.greyMid1,
  },

  // Section Headers
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
    color: P.greyMid1,
    letterSpacing: LETTER.section,
    marginTop: SP.lg,
    marginBottom: SP.s12,
  },

  // Latest Videos List Items
  videoCard: {
    flexDirection: 'row',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: RAD.r16,
    borderWidth: DIM.hairline,
    borderColor: P.tanTint2,
    padding: SP.s12,
    alignItems: 'center',
    gap: SP.s12,
    marginBottom: SP.s12,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset2 },
    shadowOpacity: SHADOW.opacitySubtle,
    shadowRadius: SHADOW.radiusCard,
    elevation: SHADOW.elev1,
  },
  videoThumbnail: {
    width: DIM.videoThumbW,
    height: DIM.videoThumbH,
    borderRadius: RAD.r10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: SP.sm,
    right: SP.sm,
    backgroundColor: OVERLAY.videoDuration,
    paddingHorizontal: SP.sm,
    paddingVertical: SP.xxs,
    borderRadius: RAD.r4,
  },
  videoDurationText: {
    color: P.weatherCloudWhite,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  videoDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: LINE.l18,
    marginBottom: SP.sm,
  },
  videoSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.greyMid1,
  },

  // Empty State
  emptyStateContainer: {
    padding: SP.s30,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: SP.sm,
  },
  emptyStateSubtitle: {
    fontSize: typography.body,
    color: P.greyMid1,
    textAlign: 'center',
  },

  // Tab Content Container
  tabContentContainer: {
    paddingTop: SP.sm,
  },

  // Blog Tab
  articleCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: RAD.r16,
    borderWidth: DIM.hairline,
    borderColor: P.tanTint2,
    padding: SP.s16,
    marginBottom: SP.s14,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset2 },
    shadowOpacity: SHADOW.opacitySubtle,
    shadowRadius: SHADOW.radiusCard,
    elevation: SHADOW.elev1,
  },
  articleTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SP.lg,
  },
  articleTagPill: {
    backgroundColor: P.lightGreen,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.xs,
    borderRadius: RAD.r6,
  },
  articleTagText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  articleReadTime: {
    fontSize: typography.bodySmall,
    color: P.greyMid2,
  },
  articleTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: LINE.l20,
    marginBottom: SP.md,
  },
  articleSnippet: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: LINE.l18,
    marginBottom: SP.xl,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
  },
  articleAuthor: {
    fontSize: typography.bodySmall,
    color: P.greyMid1,
  },

  // Groups Tab
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderRadius: RAD.r16,
    borderWidth: DIM.hairline,
    borderColor: P.tanTint2,
    padding: SP.s14,
    marginBottom: SP.s12,
    gap: SP.s12,
  },
  groupIconBox: {
    width: DIM.groupIcon,
    height: DIM.groupIcon,
    borderRadius: RAD.r22,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: SP.xxs,
  },
  groupSubtitle: {
    fontSize: typography.bodySmall,
    color: P.greyMid1,
  },
  groupActionBtn: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: SP.s14,
    paddingVertical: SP.s7,
    borderRadius: RAD.r14,
  },
  groupActionBtnJoined: {
    backgroundColor: P.tanTint1,
  },
  groupActionBtnText: {
    color: P.weatherCloudWhite,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  groupActionBtnTextJoined: {
    color: colors.brandGreen,
  },

  // Trainings Tab
  trainingCard: {
    backgroundColor: P.weatherCloudWhite,
    borderRadius: RAD.r16,
    borderWidth: DIM.hairline,
    borderColor: P.tanTint2,
    padding: SP.s16,
    marginBottom: SP.s14,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: SHADOW.offset2 },
    shadowOpacity: SHADOW.opacitySubtle,
    shadowRadius: SHADOW.radiusCard,
    elevation: SHADOW.elev1,
  },
  trainingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SP.lg,
  },
  trainingModePill: {
    backgroundColor: P.twEmerald100,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.xs,
    borderRadius: RAD.r6,
  },
  trainingModeOnline: {
    backgroundColor: P.twBlue100,
  },
  trainingModeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twEmerald800,
  },
  trainingModeTextOnline: {
    color: P.twBlue800,
  },
  trainingDate: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.greenDeep1,
  },
  trainingTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: LINE.l20,
    marginBottom: SP.lg,
  },
  trainingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.md,
    marginBottom: SP.sm,
  },
  trainingDetailText: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
  },
  trainingLocationText: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    marginBottom: SP.sm,
  },
  trainingInstructorText: {
    fontSize: typography.bodySmall,
    color: P.twGray700,
    fontWeight: '500',
    marginBottom: SP.s12,
  },
  trainingRegisterBtn: {
    backgroundColor: colors.brandGreen,
    paddingVertical: SP.xl,
    borderRadius: RAD.r12,
    alignItems: 'center',
  },
  trainingRegisteredBtn: {
    backgroundColor: P.lightGreen,
  },
  trainingRegisterBtnText: {
    color: P.weatherCloudWhite,
    fontSize: typography.body,
    fontWeight: '700',
  },
  trainingRegisteredBtnText: {
    color: colors.brandGreen,
  },

  // Video Player Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: OVERLAY.scrim,
    justifyContent: 'flex-end',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP.s18,
    paddingVertical: SP.s14,
    borderBottomWidth: DIM.hairline,
    borderBottomColor: P.twGray100,
  },
  playerHeaderTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: colors.textDark,
  },
  modalCloseCircle: {
    width: DIM.closeCircle,
    height: DIM.closeCircle,
    borderRadius: RAD.r16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Blog Reader Modal
  blogReaderCard: {
    backgroundColor: P.weatherCloudWhite,
    borderTopLeftRadius: RAD.r22,
    borderTopRightRadius: RAD.r22,
    maxHeight: '90%',
    paddingBottom: SP.s24,
  },
  blogReaderScroll: {
    padding: SP.s20,
  },
  blogReaderTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: colors.textDark,
    lineHeight: LINE.l24,
    marginTop: SP.xl,
    marginBottom: SP.lg,
  },
  blogReaderMeta: {
    fontSize: typography.bodySmall,
    color: P.greyMid1,
    marginBottom: SP.s14,
  },
  blogContentDivider: {
    height: DIM.hairline,
    backgroundColor: P.twGray100,
    marginBottom: SP.s14,
  },
  blogParagraph: {
    fontSize: typography.body,
    color: P.twGray700,
    lineHeight: LINE.l22,
    marginBottom: SP.s14,
  },
});
