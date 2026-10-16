/**
 * Attendance Detail: one staff member's attendance on one day, live.
 *
 *   GET /admin/staff-attendance?staffId&from=date&to=date   the day's row (none = not marked)
 *   GET /admin/staff-attendance/staff/{id}/{date}/history   its change history (append-only, BR-84)
 *   PUT /admin/staff-attendance/staff/{id}/{date}           mark or correct (admin.staff.attendance.mark)
 *
 * Opened with a real `{ staffId, date }` from the Attendance list; there is no
 * default record any more. Mark actions show only with
 * admin.staff.attendance.mark (SA, MAIN; TOHFA and SUB none). Check-in /
 * check-out "now" use the real clock and are offered only for today; a
 * check-out keeps the check-in it needs. The mark is an upsert, so a replay is
 * safe and the spec declares no Idempotency-Key. A deactivated member is 409.
 */
// Design id: M14-S03
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ATTENDANCE_STATUSES, type AttendanceStatusCode, type MarkAttendanceBody } from '../../../api/attendance';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { InfoCard, InfoNote, SectionTitle, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import {
  attendanceChangeTitle,
  attendanceStatusLabel,
  canMarkAttendance,
  canViewAttendance,
  checkInNowBody,
  checkOutNowBody,
  formatIsoDate,
  istToday,
  markStatusBody,
} from './mappers';
import { RingTimeline } from './StaffParts';
import type { AttendanceRecordRef, WarehouseScreenBaseProps } from './types';
import { useAttendanceChanges, useAttendanceDay, useMarkAttendanceMutation } from './useStaffData';

export interface AttendanceDetailScreenProps extends WarehouseScreenBaseProps {
  /** Whose day: required, from the Attendance list. */
  record?: AttendanceRecordRef | undefined;
}

export function AttendanceDetailScreen({ scope, can, onBack, record }: AttendanceDetailScreenProps) {
  const allowed = canViewAttendance(can) && record !== undefined;
  const [now] = useState(() => new Date());
  const staffId = record?.staffId ?? '';
  const date = record?.date ?? '';
  const day = useAttendanceDay(scope, staffId, date, allowed);
  const hasRow = day.row !== undefined && day.row !== null;
  const changes = useAttendanceChanges(scope, staffId, date, now, allowed && hasRow);
  const mark = useMarkAttendanceMutation();

  if (!canViewAttendance(can)) {
    return (
      <WalletScreen title={t('staff.attendanceDetail.title')} onBack={onBack}>
        <AdminEmptyState title={t('staff.denied.title')} subtitle={t('staff.denied.attendance')} />
      </WalletScreen>
    );
  }
  if (record === undefined) {
    return (
      <WalletScreen title={t('staff.attendanceDetail.title')} onBack={onBack}>
        <AdminEmptyState title={t('staff.attendanceDetail.missing.title')} subtitle={t('staff.attendanceDetail.missing.subtitle')} />
      </WalletScreen>
    );
  }

  const row = day.row ?? null;
  const name = row?.staffName ?? record.name ?? '';
  const designation = row?.designation ?? record.designation ?? '';
  const status: AttendanceStatusCode | null = row?.status ?? null;
  const timeOf = (iso: string | null) => (iso === null ? t('staff.common.none') : formatAdminDate(iso, now));
  const isToday = date === istToday(new Date());
  const markable = canMarkAttendance(can);
  const send = (body: MarkAttendanceBody) =>
    mark.mutate(
      { staffId, date, body },
      {
        onSuccess: () => day.refresh(),
      },
    );
  const rowRef = row === null ? null : { status: row.status, checkIn: row.checkIn, checkOut: row.checkOut };
  const checkOut = rowRef !== null && rowRef.status === 'PRESENT' && rowRef.checkOut === null ? checkOutNowBody(rowRef, new Date()) : null;

  return (
    <WalletScreen title={t('staff.attendanceDetail.title')} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {day.isLoading ? <AdminLoadingState /> : null}
        {day.error ? <AdminErrorState error={day.error} onRetry={day.refresh} /> : null}
        {!day.isLoading && !day.error ? (
          <>
            <InfoCard
              rows={[
                [
                  { label: t('staff.field.date'), value: formatIsoDate(date) },
                  { label: t('staff.field.employee'), value: name },
                ],
                [
                  { label: t('staff.field.designation'), value: designation },
                  { label: t('staff.field.status'), value: attendanceStatusLabel(status) },
                ],
              ]}
            />

            <SectionTitle>{t('staff.attendanceDetail.time')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('staff.attendance.checkIn'), value: timeOf(row?.checkIn ?? null) },
                  { label: t('staff.attendance.checkOut'), value: timeOf(row?.checkOut ?? null) },
                ],
              ]}
            />
            {row?.note ? <InfoNote>{t('staff.attendanceDetail.note', { text: row.note })}</InfoNote> : null}

            {markable ? (
              <>
                <SectionTitle>{status === null ? t('staff.attendanceDetail.mark') : t('staff.attendanceDetail.correct')}</SectionTitle>
                {mark.error ? <Text style={styles.errorText}>{t(adminErrorKey(mark.error))}</Text> : null}
                <View style={styles.actions}>
                  {ATTENDANCE_STATUSES.map((code) => (
                    <WalletButton
                      key={code}
                      flex
                      label={attendanceStatusLabel(code)}
                      variant={code === status ? 'primary' : 'outline'}
                      disabled={mark.isPending || code === status}
                      onPress={() => send(markStatusBody(code, rowRef))}
                    />
                  ))}
                </View>
                {isToday && (status === null || (status === 'PRESENT' && row?.checkIn === null)) ? (
                  <WalletButton
                    label={t('staff.attendanceDetail.checkInNow')}
                    variant="outline"
                    disabled={mark.isPending}
                    onPress={() => send(checkInNowBody(new Date()))}
                  />
                ) : null}
                {isToday && checkOut !== null ? (
                  <WalletButton
                    label={t('staff.attendanceDetail.checkOutNow')}
                    variant="outline"
                    disabled={mark.isPending}
                    onPress={() => {
                      const body = rowRef === null ? null : checkOutNowBody(rowRef, new Date());
                      if (body !== null) send(body);
                    }}
                  />
                ) : null}
              </>
            ) : (
              <InfoNote>{t('staff.attendanceDetail.viewOnly')}</InfoNote>
            )}

            {hasRow ? (
              <>
                <SectionTitle>{t('staff.attendanceDetail.history')}</SectionTitle>
                {changes.isLoading ? (
                  <AdminLoadingState />
                ) : changes.error ? (
                  <AdminErrorState error={changes.error} />
                ) : (
                  <RingTimeline items={changes.changes.map((c) => ({ id: c.id, title: attendanceChangeTitle(c), subtitle: c.whenText }))} />
                )}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginBottom: adminSpacing.sm },
});
