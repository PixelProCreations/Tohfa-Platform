/**
 * Attendance Correction: correct one staff member's mark for one day, then
 * review and confirm. Live against
 *   GET /admin/staff-attendance?staffId&from=date&to=date   the day's current mark
 *   PUT /admin/staff-attendance/staff/{id}/{date}           the correction (admin.staff.attendance.mark)
 *
 * The write is an upsert keyed by (staff, day); the server keeps the change
 * history (BR-84) and declares no Idempotency-Key. Remarks are stored as the
 * record's note; times are sent only for a Present day. The staff record has
 * no shift and the API no reason category, so those show the module's dash.
 */
// Design id: SA-M14-S02 Attendance Correction
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ATTENDANCE_STATUSES, type AttendanceStatusCode } from '../../../api/attendance';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { CalendarIcon, HeaderIconButton, StatusBadge, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { buildCorrectionBody, CORRECTION_NOTE_MAX, isoToIstHhMm, type CorrectionForm } from './accessMappers';
import {
  attendanceStatusLabel,
  attendanceStatusTone,
  calendarMonthOf,
  canMarkAttendance,
  clampToToday,
  dayOf,
  formatIsoDate,
  isAfterDate,
  istToday,
  shiftIsoDate,
  STAFF_NONE_KEY,
  staffStatusLabel,
  withDay,
} from './mappers';
import { ChevronDownIcon, CloseIcon, DatePickerModal, PersonIcon } from './StaffParts';
import type { AttendanceRecordRef, StaffMember, WarehouseScreenBaseProps } from './types';
import { useAttendanceDay, useMarkAttendanceMutation } from './useStaffData';

export interface AttendanceCorrectionScreenProps extends WarehouseScreenBaseProps {
  /** Whose day (from Attendance Detail). */
  record?: AttendanceRecordRef | undefined;
  /** Whose attendance (from Staff Detail); the day is picked here, today by default. */
  staff?: StaffMember | undefined;
  onSuccess?: (() => void) | undefined;
}

function PencilIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.muted} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarCheckIcon() {
  const c = adminColors.success.text;
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 15l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AttendanceCorrectionScreen({ scope, can, onBack, record, staff, onSuccess }: AttendanceCorrectionScreenProps) {
  const allowed = canMarkAttendance(can);
  const [now] = useState(() => new Date());
  const today = istToday(now);
  const staffId = record?.staffId ?? staff?.id;
  const [date, setDate] = useState(() => record?.date ?? today);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(date);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<CorrectionForm>({ status: null, checkIn: '', checkOut: '', remarks: '' });

  const day = useAttendanceDay(scope, staffId ?? '', date, allowed && staffId !== undefined);
  const mark = useMarkAttendanceMutation();
  const row = day.row ?? null;

  // Prefill the times from the day's current mark when the day changes.
  useEffect(() => {
    setForm((prev) => ({ ...prev, checkIn: isoToIstHhMm(row?.checkIn ?? null), checkOut: isoToIstHhMm(row?.checkOut ?? null) }));
  }, [row?.checkIn, row?.checkOut]);

  const title = t('staffAccess.correction.title');
  if (!allowed) {
    return (
      <WalletScreen title={title} onBack={onBack}>
        <AdminEmptyState title={t('staff.denied.title')} subtitle={t('staffAccess.denied.correction')} />
      </WalletScreen>
    );
  }
  if (staffId === undefined) {
    return (
      <WalletScreen title={title} onBack={onBack}>
        <AdminEmptyState title={t('staff.attendanceDetail.missing.title')} subtitle={t('staff.attendanceDetail.missing.subtitle')} />
      </WalletScreen>
    );
  }

  const dash = t(STAFF_NONE_KEY);
  const name = row?.staffName ?? record?.name ?? staff?.name ?? dash;
  const staffCode = row?.staffCode ?? staff?.staffCode ?? dash;
  const staffStatus = staff === undefined ? dash : staffStatusLabel(staff.status);
  const currentStatus: AttendanceStatusCode | null = row?.status ?? null;
  const present = form.status === 'PRESENT';
  const set = (patch: Partial<CorrectionForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const cal = calendarMonthOf(pickerDate);
  const pickerIsCurrentMonth = pickerDate.slice(0, 7) === today.slice(0, 7);

  const openReview = () => {
    const result = buildCorrectionBody(date, form);
    if (!result.ok) {
      setFormError(t(result.errorKey));
      return;
    }
    setFormError(null);
    setShowReview(true);
  };

  const confirm = () => {
    const result = buildCorrectionBody(date, form);
    if (!result.ok) return;
    mark.mutate(
      { staffId, date, body: result.body },
      {
        onSuccess: () => {
          setShowReview(false);
          day.refresh();
          Alert.alert(
            t('staffAccess.correction.doneTitle'),
            t('staffAccess.correction.doneMessage', { name, date: formatIsoDate(date), status: attendanceStatusLabel(form.status) }),
            [{ text: t('staffAccess.common.ok'), onPress: () => (onSuccess ?? onBack)() }],
          );
        },
      },
    );
  };

  const statusPill = (status: AttendanceStatusCode | null) => (
    <StatusBadge label={attendanceStatusLabel(status)} tone={status === null ? 'info' : attendanceStatusTone(status)} />
  );

  const label = (text: string, required: boolean) => (
    <Text style={styles.inputLabel}>
      {text}
      {required ? <Text style={styles.asterisk}>{t('staffAccess.common.required')}</Text> : null}
    </Text>
  );

  const reviewRow = (key: string, labelText: string, value: React.ReactNode, last = false) => (
    <View key={key} style={[styles.tableRow, last && styles.tableRowLast]}>
      <Text style={styles.tableLabel}>{labelText}</Text>
      {typeof value === 'string' ? <Text style={styles.tableValue}>{value}</Text> : value}
    </View>
  );

  return (
    <WalletScreen
      title={title}
      onBack={onBack}
      headerRight={
        <HeaderIconButton onPress={openReview} accessibilityLabel={t('staffAccess.correction.review')}>
          <PencilIcon />
        </HeaderIconButton>
      }
    >
      <ScrollView contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.staffCard}>
          <View style={styles.avatarCircle}>
            <PersonIcon size={24} color={adminColors.brandDeep} />
          </View>
          <View style={styles.staffMeta}>
            <Text style={styles.staffName}>{name}</Text>
            <Text style={styles.staffSub}>{t('staffAccess.correction.staffMeta', { code: staffCode, status: staffStatus })}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('staffAccess.correction.record')}</Text>
        <View style={styles.card}>
          {day.isLoading ? <AdminLoadingState /> : null}
          {day.error ? <AdminErrorState error={day.error} onRetry={day.refresh} /> : null}
          <Text style={styles.metaLabel}>{t('staffAccess.correction.date')}</Text>
          <Text style={styles.metaValue}>{formatIsoDate(date)}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('staffAccess.correction.shift')}</Text>
              <Text style={styles.metaValue}>{dash}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>{t('staffAccess.correction.currentStatus')}</Text>
              {statusPill(currentStatus)}
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('staffAccess.correction.details')}</Text>
        <View style={styles.card}>
          {label(t('staffAccess.correction.selectDate'), true)}
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => {
              setPickerDate(date);
              setPickerOpen(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.inputText}>{formatIsoDate(date)}</Text>
            <CalendarIcon />
          </TouchableOpacity>

          {label(t('staffAccess.correction.updatedStatus'), true)}
          <TouchableOpacity style={styles.inputRow} onPress={() => setShowStatusPicker(true)} activeOpacity={0.8} accessibilityRole="button">
            <Text style={form.status === null ? styles.inputMuted : styles.inputText}>
              {form.status === null ? dash : attendanceStatusLabel(form.status)}
            </Text>
            <ChevronDownIcon size={14} color={adminColors.ink} />
          </TouchableOpacity>

          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              {label(t('staffAccess.correction.checkIn'), present)}
              <View style={[styles.inputRow, styles.timeBox, !present && styles.disabledBox]}>
                <ClockIcon />
                <TextInput
                  style={styles.timeInput}
                  value={present ? form.checkIn : ''}
                  onChangeText={(v) => set({ checkIn: v })}
                  editable={present}
                  placeholder={present ? t('staffAccess.correction.timePlaceholder') : dash}
                  placeholderTextColor={adminColors.placeholder}
                  accessibilityLabel={t('staffAccess.correction.checkIn')}
                />
              </View>
            </View>
            <View style={styles.timeCol}>
              {label(t('staffAccess.correction.checkOut'), false)}
              <View style={[styles.inputRow, styles.timeBox, !present && styles.disabledBox]}>
                <ClockIcon />
                <TextInput
                  style={styles.timeInput}
                  value={present ? form.checkOut : ''}
                  onChangeText={(v) => set({ checkOut: v })}
                  editable={present}
                  placeholder={present ? t('staffAccess.correction.timePlaceholder') : dash}
                  placeholderTextColor={adminColors.placeholder}
                  accessibilityLabel={t('staffAccess.correction.checkOut')}
                />
              </View>
            </View>
          </View>

          {label(t('staffAccess.correction.reasonCategory'), false)}
          <View style={[styles.inputRow, styles.disabledBox]}>
            <Text style={styles.inputMuted}>{dash}</Text>
            <ChevronDownIcon size={14} color={adminColors.muted} />
          </View>

          {label(t('staffAccess.correction.remarks'), true)}
          <TextInput
            style={styles.remarksInput}
            value={form.remarks}
            onChangeText={(v) => set({ remarks: v })}
            placeholder={t('staffAccess.correction.remarksPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            multiline
            maxLength={CORRECTION_NOTE_MAX}
            accessibilityLabel={t('staffAccess.correction.remarks')}
          />
          {formError !== null ? <Text style={styles.errorText}>{formError}</Text> : null}
        </View>

        <View style={styles.actionRow}>
          <WalletButton flex label={t('staff.common.cancel')} variant="neutral" onPress={onBack} />
          <WalletButton flex label={t('staffAccess.correction.review')} onPress={openReview} />
        </View>
      </ScrollView>

      <DatePickerModal
        visible={pickerOpen}
        monthLabel={cal.label}
        daysInMonth={cal.daysInMonth}
        firstWeekday={cal.firstWeekday}
        selectedDay={dayOf(pickerDate)}
        maxDay={pickerIsCurrentMonth ? dayOf(today) : undefined}
        onSelectDay={(d) => setPickerDate(withDay(pickerDate, d))}
        onPrevMonth={() => setPickerDate(withDay(shiftIsoDate(withDay(pickerDate, 1), -1), dayOf(pickerDate)))}
        onNextMonth={
          pickerIsCurrentMonth
            ? undefined
            : () => setPickerDate(clampToToday(withDay(shiftIsoDate(withDay(pickerDate, cal.daysInMonth), 1), dayOf(pickerDate)), today))
        }
        onApply={() => {
          if (!isAfterDate(pickerDate, today)) setDate(pickerDate);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <Modal visible={showStatusPicker} transparent animationType="fade" onRequestClose={() => setShowStatusPicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowStatusPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>{t('staffAccess.correction.selectStatus')}</Text>
            {ATTENDANCE_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pickerOption, form.status === s && styles.pickerOptionActive]}
                onPress={() => {
                  set({ status: s });
                  setShowStatusPicker(false);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.pickerOptionText, form.status === s && styles.pickerOptionTextActive]}>{attendanceStatusLabel(s)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showReview} transparent animationType="fade" onRequestClose={() => setShowReview(false)}>
        <View style={styles.overlay}>
          <View style={styles.reviewCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowReview(false)} accessibilityRole="button" accessibilityLabel={t('staff.common.close')}>
              <CloseIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
            <View style={styles.modalIconWrap}>
              <CalendarCheckIcon />
            </View>
            <Text style={styles.reviewTitle}>{t('staffAccess.correction.review')}</Text>
            <Text style={styles.reviewSub}>{t('staffAccess.correction.reviewSubtitle')}</Text>
            <View style={styles.reviewTable}>
              {reviewRow('name', t('staffAccess.correction.staffName'), name)}
              {reviewRow('code', t('staffAccess.correction.staffId'), staffCode)}
              {reviewRow('date', t('staffAccess.correction.date'), formatIsoDate(date))}
              {reviewRow('shift', t('staffAccess.correction.shift'), dash)}
              {reviewRow('current', t('staffAccess.correction.currentStatus'), statusPill(currentStatus))}
              {reviewRow('updated', t('staffAccess.correction.updatedStatus'), statusPill(form.status))}
              {reviewRow('reason', t('staffAccess.correction.reasonCategory'), dash, true)}
            </View>
            {mark.error ? <Text style={styles.errorText}>{t(adminErrorKey(mark.error))}</Text> : null}
            <View style={styles.actionRow}>
              <WalletButton flex label={t('staffAccess.correction.editDetails')} variant="neutral" onPress={() => setShowReview(false)} />
              <WalletButton flex label={t('staffAccess.correction.confirm')} disabled={mark.isPending} onPress={confirm} />
            </View>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

const AVATAR = 48;
const INPUT_HEIGHT = 44;
const REMARKS_HEIGHT = 84;
const MODAL_ICON = 56;

const styles = StyleSheet.create({
  contentPad: { padding: adminSpacing.lg, paddingBottom: adminSpacing.section },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffMeta: { flex: 1 },
  staffName: { ...adminType.sectionHead, color: adminColors.ink },
  staffSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  metaRow: { flexDirection: 'row', marginTop: adminSpacing.md, gap: adminSpacing.md },
  metaCol: { flex: 1, gap: adminSpacing.xs },
  metaLabel: { ...adminType.rowMeta, color: adminColors.muted },
  metaValue: { ...adminType.rowTitle, color: adminColors.ink },
  inputLabel: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.sm, marginBottom: adminSpacing.xsSm },
  asterisk: { color: adminColors.danger.text },
  inputRow: {
    height: INPUT_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
  },
  inputText: { ...adminType.body, color: adminColors.ink },
  inputMuted: { ...adminType.body, color: adminColors.muted },
  disabledBox: { backgroundColor: adminColors.canvas },
  timeRow: { flexDirection: 'row', gap: adminSpacing.lg },
  timeCol: { flex: 1 },
  timeBox: { justifyContent: 'flex-start', gap: adminSpacing.sm },
  timeInput: { flex: 1, ...adminType.body, color: adminColors.ink, padding: 0 },
  remarksInput: {
    minHeight: REMARKS_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    textAlignVertical: 'top',
    ...adminType.body,
    color: adminColors.ink,
  },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.sm },
  actionRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.sm },
  overlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.input,
  },
  pickerModal: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  pickerTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  pickerOption: { paddingVertical: adminSpacing.md, paddingHorizontal: adminSpacing.md, borderRadius: adminRadius.sm },
  pickerOptionActive: { backgroundColor: adminColors.brandTint },
  pickerOptionText: { ...adminType.body, color: adminColors.ink },
  pickerOptionTextActive: { color: adminColors.brand },
  reviewCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.input,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  closeBtn: { position: 'absolute', top: adminSpacing.lg, right: adminSpacing.lg, padding: adminSpacing.xs, zIndex: 1 },
  modalIconWrap: {
    width: MODAL_ICON,
    height: MODAL_ICON,
    borderRadius: MODAL_ICON / 2,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  reviewTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  reviewSub: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xs, marginBottom: adminSpacing.lg },
  reviewTable: {
    width: '100%',
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableLabel: { ...adminType.rowMeta, color: adminColors.muted },
  tableValue: { ...adminType.rowTitle, color: adminColors.ink, flexShrink: 1, textAlign: 'right' },
});
