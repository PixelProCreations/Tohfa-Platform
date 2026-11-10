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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT, type AdminTone } from '../../../theme';
import type { AttendanceStatus, StaffType } from './types';

interface IconProps {
  size?: number;
  color?: string;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Status ──────────────────────────────────────────────────────────────────

/** Theme tone of an attendance status (Present green, Absent red, On Leave amber). */
export function attendanceTone(status: AttendanceStatus): AdminTone {
  switch (status) {
    case 'Present':
      return 'success';
    case 'Absent':
      return 'danger';
    case 'On Leave':
      return 'warning';
    default:
      return 'info';
  }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

export function TruckIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

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

export function SystemRolesAccessIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8.5" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M2 20c0-3.3 2.7-6 6-6h1c3.3 0 6 2.7 6 6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="16.5" cy="7.5" r="2.8" stroke={color} strokeWidth="1.6" />
      <Path
        d="M15 14.5c2.2.3 4 2 4 5.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function AssignAccessIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M16 11l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function QuickCreateStaffIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M19 8v6M22 11h-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function QuickStaffAttendanceIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 15l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export function CalendarIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckmarkIcon({ size = 16, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function UploadPhotoIcon({ size = 18, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

/** Round avatar with the driver truck or the warehouse-staff person, tinted by attendance. */
export function StaffAvatar({ type, tone, large = false }: { type?: StaffType | undefined; tone?: AdminTone | undefined; large?: boolean }) {
  const color = tone ? adminColors[tone].text : adminColors.brand;
  const bgColor = tone !== undefined ? adminColors[tone].bg : adminColors.brandTint;
  const size = large ? 28 : 22;
  return (
    <View style={[styles.avatar, large && styles.avatarLarge, { backgroundColor: bgColor }]}>
      {type === 'driver' ? <TruckIcon size={size} color={color} /> : <PersonIcon size={size} color={color} />}
    </View>
  );
}

/** Coloured dot + status text (+ optional time lines) on the right of an attendance row. */
export function AttendanceStatusText({ status, lines = [] }: { status: AttendanceStatus; lines?: readonly (string | undefined)[] }) {
  const tone = adminColors[attendanceTone(status)];
  return (
    <View style={styles.statusCol}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: tone.text }]} />
        <Text style={[styles.statusText, { color: tone.text }]}>{status}</Text>
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
  onNext?: (() => void) | undefined;
  onPressLabel?: (() => void) | undefined;
}) {
  return (
    <View style={styles.dateNav}>
      <TouchableOpacity onPress={onPrev} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="Previous day">
        <ChevronLeftIcon />
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressLabel} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Select date">
        <Text style={styles.dateNavText}>{label}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="Next day">
        <ChevronRightIcon />
      </TouchableOpacity>
    </View>
  );
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

/**
 * Month calendar sheet (absorbed from Main's Attendance, M14-S03). Picks a day
 * of the shown month; Apply hands it back.
 */
export function DatePickerModal({
  visible,
  monthLabel,
  daysInMonth,
  firstWeekday,
  selectedDay,
  onSelectDay,
  onApply,
  onClose,
}: {
  visible: boolean;
  monthLabel: string;
  daysInMonth: number;
  firstWeekday: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP} accessibilityRole="button" accessibilityLabel="Close">
              <CloseIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.calendarMonth}>{monthLabel}</Text>
          <View style={styles.calendarGrid}>
            {WEEKDAYS.map((day, index) => (
              <View key={`wd-${index}`} style={styles.calendarCell}>
                <Text style={styles.calendarWeekday}>{day}</Text>
              </View>
            ))}
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.calendarCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const active = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.calendarCell, active && styles.calendarCellActive]}
                  onPress={() => onSelectDay(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.calendarDay, active && styles.calendarDayActive]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={onApply} activeOpacity={0.85} accessibilityRole="button">
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const AVATAR = 40;
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
  calendarMonth: { ...adminType.sectionHead, color: adminColors.brandDeep, textAlign: 'center', marginVertical: adminSpacing.md },
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

export function ClockOutlineIcon({ size = 16, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface UpdateAttendanceModalProps {
  visible: boolean;
  name: string;
  initialStatus?: AttendanceStatus | string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialReason?: string;
  onClose: () => void;
  onUpdate: (data: { status: AttendanceStatus; checkIn: string; checkOut: string; reason: string }) => void;
}

export function UpdateAttendanceModal({
  visible,
  name,
  initialStatus = 'Present',
  initialCheckIn = '09:02 AM',
  initialCheckOut = '05:05 PM',
  initialReason = '',
  onClose,
  onUpdate,
}: UpdateAttendanceModalProps) {
  const [status, setStatus] = React.useState<AttendanceStatus>(initialStatus as AttendanceStatus);
  const [checkIn, setCheckIn] = React.useState(initialCheckIn);
  const [checkOut, setCheckOut] = React.useState(initialCheckOut);
  const [reason, setReason] = React.useState(initialReason);
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = React.useState(false);

  React.useEffect(() => {
    setStatus(initialStatus as AttendanceStatus);
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
    setReason(initialReason);
  }, [initialStatus, initialCheckIn, initialCheckOut, initialReason, visible]);

  if (!visible) return null;

  const statusOptions: AttendanceStatus[] = ['Present', 'Absent', 'On Leave'];
  const reasonOptions = [
    'Select reason',
    'Medical Emergency',
    'Sick Leave',
    'Vehicle Maintenance',
    'Personal Work',
    'Duty Off / Other',
  ];

  const getToneColor = (st: AttendanceStatus) => {
    switch (st) {
      case 'Present': return '#16A34A';
      case 'Absent': return '#DC2626';
      case 'On Leave': return '#D97706';
      default: return adminColors.ink;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>{name} - Update Attendance</Text>

          {/* Top 3-Column Row: Status, Check-in Time, Check-out Time */}
          <View style={modalStyles.topThreeColRow}>
            {/* Status Dropdown */}
            <View style={modalStyles.colFlex}>
              <Text style={modalStyles.label}>
                Status <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TouchableOpacity
                style={modalStyles.dropdownCompact}
                onPress={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowReasonDropdown(false);
                }}
                activeOpacity={0.8}
              >
                <View style={modalStyles.dropdownLeft}>
                  <View style={[modalStyles.dot, { backgroundColor: getToneColor(status) }]} />
                  <Text style={[modalStyles.dropdownText, { color: getToneColor(status), fontSize: 13 }]}>{status}</Text>
                </View>
                <ChevronDownIcon size={14} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            {/* Check-in Time */}
            <View style={modalStyles.colFlex}>
              <Text style={modalStyles.label}>Check-in Time</Text>
              <View style={modalStyles.timeBox}>
                <ClockOutlineIcon size={14} color={adminColors.muted} />
                <Text style={modalStyles.timeText}>{status === 'Absent' ? '--:--' : checkIn}</Text>
              </View>
            </View>

            {/* Check-out Time */}
            <View style={modalStyles.colFlex}>
              <Text style={modalStyles.label}>Check-out Time</Text>
              <View style={modalStyles.timeBox}>
                <ClockOutlineIcon size={14} color={adminColors.muted} />
                <Text style={modalStyles.timeText}>{status === 'Absent' ? '--:--' : checkOut}</Text>
              </View>
            </View>
          </View>

          {/* Dropdown Menu for Status */}
          {showStatusDropdown && (
            <View style={modalStyles.dropdownList}>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={modalStyles.dropdownItem}
                  onPress={() => {
                    setStatus(opt);
                    setShowStatusDropdown(false);
                  }}
                >
                  <View style={[modalStyles.dot, { backgroundColor: getToneColor(opt) }]} />
                  <Text style={[modalStyles.dropdownItemText, status === opt && modalStyles.dropdownItemActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Reason (Optional) */}
          <Text style={modalStyles.label}>Reason (Optional)</Text>
          <TouchableOpacity
            style={modalStyles.dropdown}
            onPress={() => {
              setShowReasonDropdown(!showReasonDropdown);
              setShowStatusDropdown(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={[modalStyles.dropdownText, !reason && { color: adminColors.muted }]}>
              {reason || 'Select reason'}
            </Text>
            <ChevronDownIcon size={16} color={adminColors.muted} />
          </TouchableOpacity>

          {showReasonDropdown && (
            <View style={modalStyles.dropdownList}>
              {reasonOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={modalStyles.dropdownItem}
                  onPress={() => {
                    setReason(opt === 'Select reason' ? '' : opt);
                    setShowReasonDropdown(false);
                  }}
                >
                  <Text style={[modalStyles.dropdownItemText, (reason === opt || (!reason && opt === 'Select reason')) && modalStyles.dropdownItemActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.updateBtn}
              onPress={() => onUpdate({ status, checkIn, checkOut, reason })}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.updateBtnText}>Update Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  title: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  topThreeColRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  colFlex: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 6,
  },
  dropdownCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 42,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 44,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownText: {
    fontSize: 13,
    color: '#111827',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 42,
  },
  timeText: {
    fontSize: 13,
    color: '#4B5563',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#111827',
  },
  dropdownItemActive: {
    fontWeight: '700',
    color: adminColors.brand,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  updateBtn: {
    flex: 1.5,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
