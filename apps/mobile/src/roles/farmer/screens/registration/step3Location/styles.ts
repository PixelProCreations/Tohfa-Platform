import { StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  typography,
  weights,
  radius,
  MIN_TOUCH_TARGET,
} from '../../../theme';
import { authPalette as P } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTextCol: {
    flex: 1,
  },
  searchSpinner: {
    marginRight: 6,
  },
  suggestionsScroll: {
    maxHeight: 220,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  actionPillActive: {
    backgroundColor: colors.brandGreen,
    borderWidth: 0,
  },
  actionPillTextActive: {
    color: colors.white,
  },
  editBtnTextDisabled: {
    opacity: 0.5,
  },
  requiredAsterisk: {
    color: colors.requiredRed,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
  },
  skipText: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  // Prev/next parcel arrows in the bottom card's `farmCardHeader` row. One touch-target step
  // shorter than MIN_TOUCH_TARGET, same rationale the old chip strip's pills had: the arrow's
  // `hitSlop` (spacing.xs every side) makes up the difference without bloating the row. Disabled
  // at the first/last parcel via `locationSliderArrowBtnDisabled` below rather than hidden, so the
  // row's width doesn't shift when the farmer reaches either end.
  locationSliderArrowBtn: {
    width: MIN_TOUCH_TARGET - spacing.sm,
    height: MIN_TOUCH_TARGET - spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSliderArrowBtnDisabled: {
    opacity: 0.35,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    width: '100%',
    height: MIN_TOUCH_TARGET,
    borderWidth: 1.5,
    borderRadius: radius.card,
    paddingHorizontal: spacing.compact,
    fontSize: typography.body,
  },
  inputError: {
    borderColor: colors.requiredRed,
    borderWidth: 1.5,
  },
  fieldErrorText: {
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
    marginTop: spacing.xs,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.card,
  },
  emptyStateText: {
    fontSize: typography.body,
    textAlign: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 21,
    paddingHorizontal: 14,
    height: 42,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    color: P.nearBlack,
    marginLeft: 8,
    paddingVertical: 0,
  },
  searchCancelBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchCancelText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.white,
  },
  suggestionsList: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: P.black,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  suggestionPinWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionTextWrapper: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: typography.bodySmall,
    color: P.muted,
  },
  topMapControls: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  coordsBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 12,
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  coordsText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  // Left-anchored column: coords badge on top, zoom stepper below it. Kept separate from
  // `rightControls` (the action-pill column) so the two never compete for the same corner.
  leftMapControls: {
    gap: 8,
    alignItems: 'flex-start',
  },
  zoomControl: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoomButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    marginHorizontal: 8,
    backgroundColor: colors.borderDivider,
  },
  rightControls: {
    gap: 8,
    alignItems: 'flex-end',
  },
  editingBadge: {
    backgroundColor: P.amber600,
    paddingHorizontal: 12,
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  editingText: {
    color: P.black,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  actionPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    borderRadius: 18,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionPillText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  // The bottom card is kept compact (tighter padding/margins, 44dp buttons) so it covers as little
  // of the map as possible without dropping any of what it shows. Every size here comes from the
  // design tokens; none of it may go below MIN_TOUCH_TARGET where something is tappable.
  farmCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  // `gap` gives the prev/next arrows (only present with 2+ locations) breathing room against
  // `farmTitleRow` and the status badge -- both of those size themselves (`flex: 1` / intrinsic),
  // so without it the arrows would sit flush against the icon and the badge.
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  farmTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // The tappable name + pencil that reopens the location-details popup. It takes the row's spare
  // width (what `farmName` itself used to do with `flex: 1`) so the status badge stays right-aligned.
  farmNameButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  farmNameTextCol: {
    flexShrink: 1,
  },
  // Wraps the positioning/error dot with the name so the dot sits inline with the text rather than
  // above it -- `farmNameTextCol` also stacks `farmAreaText` underneath, so this can't just be
  // `farmNameButton`'s own row.
  farmNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  farmName: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.nearBlack,
  },
  farmAreaText: {
    fontSize: typography.caption,
    fontWeight: weights.semibold,
    color: P.grey600,
  },
  farmIconWrapper: {
    backgroundColor: colors.brandGreenLight,
    padding: spacing.sm,
    borderRadius: 10,
  },
  badgeLive: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeLiveText: {
    color: colors.brandGreen,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  badgeEditing: {
    backgroundColor: P.orange50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeEditingText: {
    color: P.orange900,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  badgeManual: {
    backgroundColor: P.blue50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeManualText: {
    color: P.blue700,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  badgeNone: {
    backgroundColor: P.grey100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
  },
  badgeNoneText: {
    color: P.grey600,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.caption,
    color: P.grey600,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.nearBlack,
  },
  statSub: {
    fontSize: typography.caption,
    color: P.grey600,
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: radius.lg,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.brandGreen,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  // Edit/Done and Delete side by side; with only Edit/Done present it takes the full width, as
  // before Delete existed.
  boundaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  boundaryActionBtn: {
    flex: 1,
  },
  // Destructive twin of `editBtn`: same outline treatment, in the shared error red.
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: colors.requiredRed,
    borderRadius: radius.lg,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.requiredRed,
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  manualToggle: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  manualToggleText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.brandGreen,
  },
  // Three rows' worth (input height plus the gap between rows) before the list scrolls, so a long
  // typed outline never pushes the card up over the whole map.
  manualPointsList: {
    maxHeight: (MIN_TOUCH_TARGET + spacing.sm) * 3,
    marginTop: spacing.sm,
  },
  manualPointBlock: {
    marginBottom: spacing.sm,
  },
  manualPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualPointIndex: {
    minWidth: spacing.lg,
    textAlign: 'center',
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: P.grey600,
  },
  manualPointRemoveBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualAddPointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: MIN_TOUCH_TARGET,
  },
  manualAddPointText: {
    fontSize: typography.body,
    fontWeight: weights.semibold,
    color: colors.brandGreen,
  },
  manualHintText: {
    fontSize: typography.bodySmall,
    color: P.grey600,
  },
  // The only affordance for the bottom-card swipe gesture -- styled like `statSub`'s small
  // secondary text, just centred under the card instead of under a stat column.
  swipeHintText: {
    fontSize: typography.caption,
    color: P.grey600,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  doneBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: radius.lg,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
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
  // Location-details popup. The card follows `farmCard` (white, rounded, same shadow) so the popup
  // reads as part of this screen rather than a system dialog.
  modalSafeRoot: { flex: 1 },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalScrim: {
    ...StyleSheet.absoluteFill,
    // `black` is the token reserved for scrims; dimmed with opacity rather than an rgba literal.
    backgroundColor: P.black,
    opacity: 0.5,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  detailsTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
  },
  detailsSubtitle: {
    fontSize: typography.bodySmall,
    marginTop: spacing.xs,
  },
  detailsFieldLabel: {
    marginTop: spacing.lg,
  },
  detailsActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  detailsActionBtn: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
