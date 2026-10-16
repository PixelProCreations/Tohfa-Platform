/**
 * Building blocks shared by the warehouse staff & attendance screens (design
 * module M14), on the admin theme.
 *
 * The frame (orange header, scope pill / selector, KPI row, chips, search,
 * cards, footer buttons, bottom tabs) is the wallet area's WalletParts, as the
 * finance screens use it. Only what is specific to staff and attendance lives
 * here: the roster / attendance icons, the status tones, the attendance row,
 * the ring timeline and the date picker absorbed from Main's Attendance screen.
 */
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT, type AdminTone } from '../../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Icons ───────────────────────────────────────────────────────────────────

export function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 4v4M8 10v4M15 16v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function PersonIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function StaffGroupIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HistoryIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 3-6.7L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RefreshIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 16, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProhibitedIcon({ size = 18, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function SaveIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

/** Round avatar with a person, tinted by attendance tone. */
export function StaffAvatar({ tone, large = false }: { tone?: AdminTone | undefined; large?: boolean }) {
  const color = tone !== undefined ? adminColors[tone].text : adminColors.brand;
  const bgColor = tone !== undefined ? adminColors[tone].bg : adminColors.brandTint;
  const size = large ? AVATAR_ICON_LARGE : AVATAR_ICON;
  return (
    <View style={[styles.avatar, large && styles.avatarLarge, { backgroundColor: bgColor }]}>
      <PersonIcon size={size} color={color} />
    </View>
  );
}

/** Coloured dot + status text (+ optional time lines) on the right of an attendance row. */
export function AttendanceStatusText({ label, tone, lines = [] }: { label: string; tone: AdminTone; lines?: readonly (string | null | undefined)[] }) {
  const colors = adminColors[tone];
  return (
    <View style={styles.statusCol}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: colors.text }]} />
        <Text style={[styles.statusText, { color: colors.text }]}>{label}</Text>
      </View>
      {lines.filter((l): l is string => !!l).map((line) => (
        <Text key={line} style={styles.statusMeta}>
          {line}
        </Text>
      ))}
    </View>
  );
}

/** One row of a grouped list card: title / subtitle on the left, anything on the right. */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  divider = false,
  onPress,
}: {
  title: string;
  subtitle?: string | undefined;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  divider?: boolean;
  onPress?: (() => void) | undefined;
}) {
  const body = (
    <>
      {leading}
      <View style={styles.listRowText}>
        <Text style={styles.listRowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listRowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );
  if (!onPress) return <View style={[styles.listRow, divider && styles.listRowDivider]}>{body}</View>;
  return (
    <TouchableOpacity
      style={[styles.listRow, divider && styles.listRowDivider]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {body}
    </TouchableOpacity>
  );
}

/** White card holding ListRows. */
export function ListCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.listCard}>{children}</View>;
}

/** Green-ring vertical timeline (Staff Detail activity, Attendance Detail check-in / out). */
export function RingTimeline({ items }: { items: readonly { id: string; title: string; subtitle?: string | undefined }[] }) {
  return (
    <View style={styles.timeline}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.timelineRow}>
          <View style={styles.timelineNodeCol}>
            <View style={styles.timelineRing}>
              <View style={styles.timelineDot} />
            </View>
            {index < items.length - 1 ? <View style={styles.timelineLine} /> : null}
          </View>
          <View style={styles.timelineTextCol}>
            <Text style={styles.timelineTitle}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.timelineSubtitle}>{item.subtitle}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Header date row: ‹ label › (label tappable to open the date picker). */
export function DateNavigator({
  label,
  onPrev,
  onNext,
  onPressLabel,
}: {
  label: string;
  onPrev?: (() => void) | undefined;
  /** undefined disables the arrow (no day after today). */
  onNext?: (() => void) | undefined;
  onPressLabel?: (() => void) | undefined;
}) {
  return (
    <View style={styles.dateNav}>
      <TouchableOpacity onPress={onPrev} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={t('staff.date.previous')}>
        <ChevronLeftIcon />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressLabel} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('staff.date.select')}>
        <Text style={styles.dateNavText}>{label}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onNext}
        disabled={onNext === undefined}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={t('staff.date.next')}
        accessibilityState={{ disabled: onNext === undefined }}
        style={onNext === undefined ? styles.disabled : undefined}
      >
        <ChevronRightIcon />
      </TouchableOpacity>
    </View>
  );
}

const WEEKDAY_KEYS = [
  'staff.date.weekday.0',
  'staff.date.weekday.1',
  'staff.date.weekday.2',
  'staff.date.weekday.3',
  'staff.date.weekday.4',
  'staff.date.weekday.5',
  'staff.date.weekday.6',
] as const;

/**
 * Month calendar sheet. Picks a day of the shown month; Apply hands it back.
 * Days after `maxDay` (today, in the current month) cannot be picked.
 */
export function DatePickerModal({
  visible,
  monthLabel,
  daysInMonth,
  firstWeekday,
  selectedDay,
  maxDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onApply,
  onClose,
}: {
  visible: boolean;
  monthLabel: string;
  daysInMonth: number;
  firstWeekday: number;
  selectedDay: number;
  maxDay?: number | undefined;
  onSelectDay: (day: number) => void;
  onPrevMonth?: (() => void) | undefined;
  /** undefined: no later month (the current month). */
  onNextMonth?: (() => void) | undefined;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('staff.date.select')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={t('staff.common.close')}>
              <CloseIcon />
            </TouchableOpacity>
          </View>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={onPrevMonth} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel={t('staff.date.previousMonth')}>
              <ChevronLeftIcon color={adminColors.brandDeep} />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={onNextMonth}
              disabled={onNextMonth === undefined}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={t('staff.date.nextMonth')}
              style={onNextMonth === undefined ? styles.disabled : undefined}
            >
              <ChevronRightIcon color={adminColors.brandDeep} />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarGrid}>
            {WEEKDAY_KEYS.map((key) => (
              <View key={key} style={styles.calendarCell}>
                <Text style={styles.calendarWeekday}>{t(key)}</Text>
              </View>
            ))}
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.calendarCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const active = day === selectedDay;
              const disabled = maxDay !== undefined && day > maxDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.calendarCell, active && styles.calendarCellActive, disabled && styles.disabled]}
                  onPress={() => onSelectDay(day)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled }}
                >
                  <Text style={[styles.calendarDay, active && styles.calendarDayActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={onApply} activeOpacity={0.85} accessibilityRole="button">
            <Text style={styles.applyButtonText}>{t('staff.common.apply')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const AVATAR = 40;
const AVATAR_ICON = 22;
const AVATAR_ICON_LARGE = 28;
const DISABLED_OPACITY = 0.35;
const AVATAR_LARGE = 56;
const STATUS_DOT = 8;
const RING = 16;
const RING_DOT = 6;
const CALENDAR_CELL = `${100 / 7}%` as const;
const CALENDAR_CELL_HEIGHT = 36;

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: { width: AVATAR_LARGE, height: AVATAR_LARGE },

  statusCol: { alignItems: 'flex-end' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  statusDot: { width: STATUS_DOT, height: STATUS_DOT, borderRadius: adminRadius.full },
  statusText: { ...adminType.rowTitle },
  statusMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  listCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: adminSpacing.md, gap: adminSpacing.md },
  listRowDivider: { borderBottomWidth: 1, borderBottomColor: adminColors.border },
  listRowText: { flex: 1 },
  listRowTitle: { ...adminType.rowTitle, color: adminColors.ink },
  listRowSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  timeline: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  timelineRow: { flexDirection: 'row' },
  timelineNodeCol: { alignItems: 'center', width: RING, marginRight: adminSpacing.md },
  timelineRing: {
    width: RING,
    height: RING,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: { width: RING_DOT, height: RING_DOT, borderRadius: adminRadius.full, backgroundColor: adminColors.success.text },
  timelineLine: { width: 2, flex: 1, minHeight: adminSpacing.lg, backgroundColor: adminColors.border },
  timelineTextCol: { flex: 1, paddingBottom: adminSpacing.md },
  timelineTitle: { ...adminType.rowTitle, color: adminColors.ink },
  timelineSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  dateNavText: { ...adminType.sectionHead, color: adminColors.onBrand },

  // Was a 50% translucent black scrim; no translucent token exists, so a solid
  // canvas scrim with the card raised by adminShadow.lg (as orders/CancelOrder).
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { ...adminType.title, color: adminColors.ink },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: adminSpacing.md },
  calendarMonth: { ...adminType.sectionHead, color: adminColors.brandDeep, textAlign: 'center' },
  disabled: { opacity: DISABLED_OPACITY },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: CALENDAR_CELL, height: CALENDAR_CELL_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  calendarCellActive: { backgroundColor: adminColors.brand, borderRadius: adminRadius.full },
  calendarWeekday: { ...adminType.caption, color: adminColors.muted },
  calendarDay: { ...adminType.body, color: adminColors.ink },
  calendarDayActive: { ...adminType.rowTitle, color: adminColors.onBrand },
  applyButton: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
  },
  applyButtonText: { ...adminType.sectionHead, color: adminColors.onBrand },
});
