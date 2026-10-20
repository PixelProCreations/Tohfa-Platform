/**
 * Staff Detail: one roster member, live from GET /admin/warehouse-staff/{id}.
 *
 * Gate: `admin.staff.list_view` (SUB none). Edit and Deactivate need
 * `admin.staff.manage`; Deactivate is soft (status INACTIVE, attendance kept,
 * BR-83h) and asks for confirmation. The attendance summary is this month's
 * GET /admin/staff-attendance/summary for this member (admin.staff.attendance.view).
 *
 * Dropped because the staff record has no such fields: driver vehicle details,
 * email, the delivery summary and performance figures, "Assign Delivery", and
 * the fixed activity feed. The timeline shows only the record's own
 * createdAt / updatedAt.
 */
// Design id: M14-S02
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { adminErrorKey } from '../../../api/errors';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoCard,
  InfoNote,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  canDeactivateStaff,
  canManageStaff,
  canViewAttendance,
  istToday,
  monthOf,
  STAFF_CODES,
  staffStatusLabel,
  staffStatusTone,
} from './mappers';
import { RingTimeline, StaffAvatar } from './StaffParts';
import type { StaffMember, WarehouseScreenBaseProps } from './types';
import { useAttendanceSummary, useDeactivateStaffMutation, useStaffDetail, useStaffWarehouses } from './useStaffData';

export interface StaffDetailScreenProps extends WarehouseScreenBaseProps {
  staff?: StaffMember | undefined;
  onEditProfile?: ((staff: StaffMember) => void) | undefined;
  /** Attendance summary tap: opens Attendance History for this member. */
  onViewAttendanceHistory?: ((staff: StaffMember) => void) | undefined;
}

export function StaffDetailScreen({ scope, can, onBack, staff, onEditProfile, onViewAttendanceHistory }: StaffDetailScreenProps) {
  const allowed = can(STAFF_CODES.listView);
  const [now] = useState(() => new Date());
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const warehouses = useStaffWarehouses(scope, can);
  const detail = useStaffDetail(scope, staff?.id, warehouses.nameOf, allowed);
  const member = detail.member ?? staff;
  const attendanceAllowed = allowed && canViewAttendance(can) && member !== undefined;
  const summary = useAttendanceSummary(scope, { staffId: member?.id, month: monthOf(istToday(now)) }, attendanceAllowed);
  const deactivate = useDeactivateStaffMutation();

  if (!allowed) {
    return (
      <WalletScreen title={t('staff.detail.title')} onBack={onBack}>
        <AdminEmptyState title={t('staff.denied.title')} subtitle={t('staff.denied.roster')} />
      </WalletScreen>
    );
  }
  if (member === undefined) {
    return (
      <WalletScreen title={t('staff.detail.title')} onBack={onBack}>
        {detail.isLoading ? (
          <AdminLoadingState />
        ) : detail.error ? (
          <AdminErrorState error={detail.error} onRetry={detail.refresh} />
        ) : (
          <AdminEmptyState title={t('staff.detail.notFound.title')} subtitle={t('staff.detail.notFound.subtitle')} />
        )}
      </WalletScreen>
    );
  }

  const totals = summary.totals;
  const days = (count: number | undefined) => (count === undefined ? t('staff.kpi.unknown') : t('staff.detail.days', { count }));
  const attendanceCard = (
    <InfoCard
      rows={[
        [
          { label: t('staff.attendance.status.PRESENT'), value: days(totals?.present) },
          { label: t('staff.attendance.status.ABSENT'), value: days(totals?.absent) },
          { label: t('staff.attendance.status.LEAVE'), value: days(totals?.leave) },
        ],
      ]}
    />
  );
  const timeline = [
    { id: 'created', title: t('staff.detail.activity.created'), subtitle: member.createdAtText },
    { id: 'joined', title: t('staff.detail.activity.joined', { warehouse: member.warehouseName }), subtitle: member.joinedOnText },
    ...(member.updatedAtText === null ? [] : [{ id: 'updated', title: t('staff.detail.activity.updated'), subtitle: member.updatedAtText }]),
  ];
  const showDeactivate = canDeactivateStaff(can, member);
  const manage = canManageStaff(can);

  const footer =
    manage && (onEditProfile || showDeactivate) ? (
      <WalletFooter>
        {confirmDeactivate ? (
          <>
            <Text style={styles.confirmText}>{t('staff.detail.deactivate.confirm', { name: member.name })}</Text>
            {deactivate.error ? <Text style={styles.errorText}>{t(adminErrorKey(deactivate.error))}</Text> : null}
            <WalletButton
              label={t('staff.detail.deactivate.yes')}
              disabled={deactivate.isPending}
              onPress={() =>
                deactivate.mutate(member.id, {
                  onSuccess: () => {
                    setConfirmDeactivate(false);
                    detail.refresh();
                  },
                })
              }
            />
            <WalletButton label={t('staff.common.cancel')} variant="neutral" onPress={() => setConfirmDeactivate(false)} />
          </>
        ) : (
          <>
            {onEditProfile ? <WalletButton label={t('staff.detail.edit')} onPress={() => onEditProfile(member)} /> : null}
            {showDeactivate ? (
              <WalletButton label={t('staff.detail.deactivate')} variant="outline" onPress={() => setConfirmDeactivate(true)} />
            ) : null}
          </>
        )}
      </WalletFooter>
    ) : undefined;

  return (
    <WalletScreen title={t('staff.detail.title')} onBack={onBack} footer={footer}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <StaffAvatar large />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{member.name}</Text>
            <Text style={styles.profileMeta}>{t('staff.list.meta', { code: member.staffCode, designation: member.designation })}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge label={staffStatusLabel(member.status)} tone={staffStatusTone(member.status)} />
            </View>
          </View>
        </View>

        <SectionTitle>{t('staff.detail.basic')}</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('staff.field.name'), value: member.name },
              { label: t('staff.field.staffCode'), value: member.staffCode },
            ],
            [
              { label: t('staff.field.designation'), value: member.designation },
              { label: t('staff.field.status'), value: staffStatusLabel(member.status) },
            ],
            [
              { label: t('staff.field.warehouse'), value: member.warehouseName },
              { label: t('staff.field.joinedOn'), value: member.joinedOnText },
            ],
            [{ label: t('staff.field.phone'), value: member.phone ?? t('staff.common.none') }],
          ]}
        />
        <InfoNote>{t('staff.detail.noHrNote')}</InfoNote>

        {attendanceAllowed ? (
          <>
            <SectionTitle>{t('staff.detail.attendanceMonth')}</SectionTitle>
            {summary.error ? (
              <AdminErrorState error={summary.error} onRetry={summary.refresh} />
            ) : onViewAttendanceHistory ? (
              <TouchableOpacity
                onPress={() => onViewAttendanceHistory(member)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('staff.detail.openHistoryA11y')}
              >
                {attendanceCard}
              </TouchableOpacity>
            ) : (
              attendanceCard
            )}
          </>
        ) : null}

        <SectionTitle>{t('staff.detail.activity')}</SectionTitle>
        <RingTimeline items={timeline} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  profileInfo: { flex: 1 },
  profileName: { ...adminType.title, color: adminColors.ink },
  profileMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  badgeRow: { flexDirection: 'row', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
  confirmText: { ...adminType.body, color: adminColors.ink },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text },
});
