/**
 * Attendance Detail: one person's attendance on one day. Read-only.
 *
 * Gate (FINAL_LIST 123): no rbac code exists for attendance; ungated
 * (SPEC_GAPS W4t-3).
 *
 * There used to be two details: this standalone file (static, a hard-coded
 * "Ramesh Kumar" record, reachable only from the dropped Staff & Attendance hub)
 * and the richer inline detail inside Today's Attendance (date / employee /
 * role / status, check-in and check-out, a check-in -> workday -> check-out
 * timeline). This file is the survivor and now renders the richer detail for
 * the record the Attendance list hands it. Main's Attendance detail view
 * (pair M14-S03) adds the "view-only" note: there is no Mark / Edit
 * Attendance, Approve Leave or manual check-in/out anywhere.
 */
// Design id: M14-S03
import React from 'react';
import { ScrollView } from 'react-native';

import { EmptyState, InfoCard, InfoNote, isAllWarehouses, SectionTitle, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { ProhibitedIcon, RingTimeline } from './StaffParts';
import { hasAttendanceAccess } from './staffAccess';
import type { AttendanceRecord, WarehouseScreenBaseProps } from './types';

const FALLBACK_ATTENDANCE_RECORD: AttendanceRecord = {
  id: '',
  name: '—',
  role: '—',
  status: 'Not Checked In',
};

export interface AttendanceDetailScreenProps extends WarehouseScreenBaseProps {
  /** The record tapped on Attendance; the default demo record when opened without one. */
  record?: AttendanceRecord | undefined;
}

export function AttendanceDetailScreen({ scope, can, onBack, record }: AttendanceDetailScreenProps) {
  if (!hasAttendanceAccess(can)) {
    return (
      <WalletScreen title="Attendance Detail" onBack={onBack}>
        <EmptyState title="Attendance not available" subtitle="Your role does not include warehouse attendance." />
      </WalletScreen>
    );
  }

  const rec = record ?? FALLBACK_ATTENDANCE_RECORD;
  const dateText = rec.dateText ?? '—';

  return (
    <WalletScreen title="Attendance Detail" onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Attendance Detail</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Date', value: dateText },
              { label: 'Employee', value: rec.name },
            ],
            [
              { label: 'Role', value: rec.role },
              { label: 'Status', value: rec.status },
            ],
          ]}
        />

        <SectionTitle>Time</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Check-in', value: rec.checkInTime ?? '--' },
              { label: 'Check-out', value: rec.checkOutTime ?? '--' },
            ],
          ]}
        />

        <SectionTitle>Timeline</SectionTitle>
        <RingTimeline
          items={[
            { id: 'in', title: 'Check-in', subtitle: rec.checkInTime },
            { id: 'day', title: 'Workday' },
            { id: 'out', title: 'Check-out', subtitle: rec.checkOutTime },
          ]}
        />

        {isAllWarehouses(scope) ? (
          <InfoNote tone="danger" icon={<ProhibitedIcon />}>
            View-only — no Mark Attendance, Edit Attendance, Approve Leave, or manual check-in/out here.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}
