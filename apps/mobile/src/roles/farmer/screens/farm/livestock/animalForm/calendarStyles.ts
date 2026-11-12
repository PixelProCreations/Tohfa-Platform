import { StyleSheet } from 'react-native';
import { authPalette as P, colors, radius, spacing, typography } from '../../../../theme';
import { CAPS_LETTER_SPACING, HAIRLINE, PAGE_GUTTER } from './styles';

const OVERLAY_SCRIM = 'rgba(0,0,0,0.5)';
const CARD_MAX_WIDTH = 380;
const CARD_RADIUS = 24;
const HEADER_GAP = 14;
const NAV_BUTTON_SIZE = 38;
const MONTH_YEAR_GAP = 6;
const MONTH_YEAR_RADIUS = 10;
const YEAR_GRID_HEIGHT = 220;
const YEAR_CHIP_MIN_WIDTH = 62;
/** One seventh of the row: the weekday header and day cells form a 7-column grid. */
const DAY_COLUMN_WIDTH = '14.28%';
const DAY_CELL_HEIGHT = 40;
const DAY_INNER_SIZE = 36;
const TODAY_RING_WIDTH = 1.5;
const FOOTER_TOP = 18;
const APPLY_FLEX = 1.4;

export const calendarStyles = StyleSheet.create({
  calModalOverlay: {
    flex: 1,
    backgroundColor: OVERLAY_SCRIM,
    justifyContent: 'center',
    alignItems: 'center',
    padding: PAGE_GUTTER,
  },
  calModalCard: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: P.white,
    borderRadius: CARD_RADIUS,
    padding: PAGE_GUTTER,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  calHeader: {
    borderBottomWidth: HAIRLINE,
    borderColor: P.twGray100,
    paddingBottom: HEADER_GAP,
    marginBottom: HEADER_GAP,
  },
  calFieldBadge: {
    fontSize: typography.caption,
    fontWeight: '700',
    letterSpacing: CAPS_LETTER_SPACING,
    textTransform: 'uppercase',
    color: colors.brandGreen,
    marginBottom: spacing.xs,
  },
  calSelectedDateTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.nearBlack,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  calNavBtn: {
    width: NAV_BUTTON_SIZE,
    height: NAV_BUTTON_SIZE,
    borderRadius: radius.lg,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MONTH_YEAR_GAP,
    paddingHorizontal: spacing.md,
    paddingVertical: MONTH_YEAR_GAP,
    borderRadius: MONTH_YEAR_RADIUS,
    backgroundColor: P.twGray100,
  },
  calMonthYearLabel: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.deepGreen,
  },
  yearGridContainer: {
    height: YEAR_GRID_HEIGHT,
  },
  yearScrollView: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: P.twGray100,
    borderWidth: HAIRLINE,
    borderColor: P.twGray200,
    minWidth: YEAR_CHIP_MIN_WIDTH,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  yearChipText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  yearChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  calWeekdayText: {
    width: DAY_COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray400,
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: DAY_COLUMN_WIDTH,
    height: DAY_CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: DAY_COLUMN_WIDTH,
    height: DAY_CELL_HEIGHT,
  },
  calDayInner: {
    width: DAY_INNER_SIZE,
    height: DAY_INNER_SIZE,
    borderRadius: DAY_INNER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: TODAY_RING_WIDTH,
    borderColor: P.twGreen700,
  },
  calDayText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.twGreen700,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: FOOTER_TOP,
    paddingTop: HEADER_GAP,
    borderTopWidth: HAIRLINE,
    borderColor: P.twGray200,
  },
  calCancelBtn: {
    flex: 1,
    borderWidth: HAIRLINE,
    borderColor: P.twGray300,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: APPLY_FLEX,
    backgroundColor: P.deepGreen,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  calApplyBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
});
