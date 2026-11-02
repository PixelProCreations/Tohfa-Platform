// Design id: M14-05 (monthly totals sheet)
/**
 * One staff member's Present / Absent / Leave totals for one month, opened from
 * a By Staff row of Attendance History. Backed by
 * GET /admin/staff-attendance/summary?month&staffId (the host fetches it); the
 * counts are the server's exact ones (BR-84h). Read-only: daily records stay
 * in Attendance History, so none are repeated here.
 */
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { InfoNote, KpiRow, WalletButton } from '../wallet-cashtopup/WalletParts';

export interface AttendanceMonthSheetProps {
  visible: boolean;
  /** "Sep 2026 — Arun Kumar". */
  title: string;
  /** Undefined until the summary has loaded. */
  totals: { present: number; absent: number; leave: number } | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onClose: () => void;
}

export function AttendanceMonthSheet({ visible, title, totals, isLoading, error, onRetry, onClose }: AttendanceMonthSheetProps) {
  const failed = error !== null && error !== undefined;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {isLoading ? <AdminLoadingState /> : null}
          {!isLoading && failed ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
          {!isLoading && !failed && totals !== undefined ? (
            <KpiRow
              items={[
                { value: String(totals.present), label: t('staff.kpi.present'), tone: 'success' },
                { value: String(totals.absent), label: t('staff.kpi.absent'), tone: 'danger' },
                { value: String(totals.leave), label: t('staff.kpi.leave'), tone: 'warning' },
              ]}
            />
          ) : null}
          <InfoNote>{t('staff.history.monthSheet.note')}</InfoNote>
          <WalletButton label={t('staff.common.close')} variant="neutral" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // No translucent scrim token exists, so (as DatePickerModal) a solid canvas
  // backdrop with the sheet raised by adminShadow.lg.
  backdrop: { flex: 1, backgroundColor: adminColors.canvas, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  title: { ...adminType.sectionHead, color: adminColors.brandDeep },
});
