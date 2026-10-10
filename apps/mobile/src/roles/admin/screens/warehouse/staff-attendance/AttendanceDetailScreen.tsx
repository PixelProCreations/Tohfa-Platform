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

import { InfoCard, InfoNote, SectionTitle, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { ATTENDANCE_DATE_TEXT, DEFAULT_ATTENDANCE_RECORD } from './fixtures';
import { ProhibitedIcon, RingTimeline } from './StaffParts';
import type { AttendanceRecord, WarehouseScreenBaseProps } from './types';

export interface AttendanceDetailScreenProps extends WarehouseScreenBaseProps {
  /** The record tapped on Attendance; the default demo record when opened without one. */
  record?: AttendanceRecord | undefined;
}

export function AttendanceDetailScreen({ onBack, record }: AttendanceDetailScreenProps) {
  const rec = record ?? DEFAULT_ATTENDANCE_RECORD;
  const dateText = rec.dateText ?? ATTENDANCE_DATE_TEXT;

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

        <InfoNote tone="danger" icon={<ProhibitedIcon />}>
          View-only — no Mark Attendance, Edit Attendance, Approve Leave, or manual check-in/out here.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}
