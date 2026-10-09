// Design id: M11-S07D
/**
 * Voucher Detail, read-only. Serves both warehouse roles (it was
 * SubWarehouseVoucherDetailScreen and absorbs the Main stub,
 * MainWarehouseVoucherDetailScreen).
 *
 * NO rbac code covers vouchers (SPEC_GAPS, FINAL_LIST #42). Interim gate by
 * voucher type: an expense voucher needs finance.expense.log, a revenue
 * voucher finance.sales_income.view; without it the screen says so and shows
 * nothing. There is no approve/reject code, so no voucher workflow is offered.
 *
 * Main-only content ported: the printed-voucher presentation card ("TOHFA -
 * <warehouse>", voucher kind, amount) and the note that no approve/reject
 * action exists. The warehouse comes from the record or the scope, never a
 * hard-wired 'Coonoor'.
 */
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  InfoCard,
  InfoNote,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { SAMPLE_VOUCHERS } from './fixtures';
import { canSeeVoucherType, FinanceNotAvailable, PadlockIcon, rupees, scopeLabel, VoucherIcon } from './FinanceParts';
import type { VoucherRecord, WarehouseScreenBaseProps } from './types';

export interface VoucherDetailScreenProps extends WarehouseScreenBaseProps {
  voucher?: VoucherRecord | undefined;
  onViewReference?: ((referenceId: string) => void) | undefined;
}

const DEFAULT_VOUCHER: VoucherRecord = SAMPLE_VOUCHERS[1] ?? {
  id: 'VCH-000820',
  type: 'Revenue',
  title: 'Revenue Voucher',
  amount: 0,
  referenceId: '-',
  date: '-',
  status: 'Completed',
};

function PrintIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="6" y="14" width="12" height="8" rx="1" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function TimelineDot({ done }: { done: boolean }) {
  const tone = done ? adminColors.success : adminColors.warning;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={tone.text} strokeWidth="2" fill={tone.bg} />
      <Circle cx="12" cy="12" r="4" fill={tone.text} />
    </Svg>
  );
}

export function VoucherDetailScreen({ scope, can, onBack, voucher = DEFAULT_VOUCHER, onViewReference }: VoucherDetailScreenProps) {
  if (!canSeeVoucherType(can, voucher.type)) {
    return (
      <FinanceNotAvailable
        title="Voucher Detail"
        message={`Your role does not include ${voucher.type === 'Expense' ? 'the expense log' : 'sales income'}.`}
        onBack={onBack}
      />
    );
  }

  const warehouse = voucher.warehouseName ?? scopeLabel(scope);
  const amount = rupees(voucher.amount);
  const tone = voucher.status === 'Completed' ? 'success' : voucher.status === 'Pending' ? 'warning' : 'brandSoft';
  const settled = voucher.status === 'Completed';

  const handlePrint = () => Alert.alert('Print Voucher', `Sending voucher ${voucher.id} to the warehouse printer...`);
  const handleDownload = () => Alert.alert('Download', `Voucher PDF for ${voucher.id} saved to documents.`);
  const handleViewTransaction = () => {
    if (onViewReference) onViewReference(voucher.referenceId);
    else Alert.alert('Linked Transaction', `${voucher.referenceId} · ${voucher.type} · ${amount}`);
  };

  return (
    <WalletScreen title="Voucher Detail" subtitle={`${voucher.id} · ${voucher.status}`} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Voucher Summary</SectionTitle>
        <Card>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Voucher ID</Text>
              <Text style={styles.valueId}>{voucher.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.valueAmount}>{amount}</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowSpaced]}>
            <View style={styles.col}>
              <Text style={styles.label}>Type</Text>
              <Text style={styles.value}>{voucher.type} Voucher</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <StatusBadge label={voucher.status} tone={tone} />
            </View>
          </View>
        </Card>

        <SectionTitle>Transaction Details</SectionTitle>
        <InfoCard
          rows={[
            [{ label: 'Description / Title', value: voucher.title }],
            [
              { label: 'Reference ID', value: voucher.referenceId },
              { label: 'Date', value: voucher.date },
            ],
            [
              { label: 'Warehouse', value: warehouse },
              { label: 'Created By', value: voucher.createdBy ?? 'Warehouse Admin' },
            ],
            [{ label: 'Settlement / Payment', value: voucher.paymentMethod ?? '-' }],
          ]}
        />

        {/* Printed-voucher presentation (ported from the Main copy). */}
        <View style={styles.receiptCard}>
          <Text style={styles.receiptHeader}>TOHFA · {warehouse}</Text>
          <Text style={styles.receiptKind}>{voucher.type.toUpperCase()} VOUCHER</Text>
          <Text style={styles.receiptAmount}>{amount}</Text>
        </View>

        <SectionTitle>Voucher Document</SectionTitle>
        <Card>
          <View style={styles.docRow}>
            <View style={styles.docIconBox}>
              <VoucherIcon size={24} />
            </View>
            <View style={styles.col}>
              <Text style={styles.value}>Official Digital Voucher PDF</Text>
              <Text style={styles.label}>{voucher.id} · Signed & Sealed</Text>
            </View>
          </View>
        </Card>

        <SectionTitle>Verification Timeline</SectionTitle>
        <Card>
          <View style={styles.timelineRow}>
            <TimelineDot done />
            <Text style={styles.timelineText}>Voucher Generated</Text>
          </View>
          <View style={styles.timelineConnector} />
          <View style={styles.timelineRow}>
            <TimelineDot done />
            <Text style={styles.timelineText}>Recorded in Warehouse Ledger</Text>
          </View>
          <View style={styles.timelineConnector} />
          <View style={styles.timelineRow}>
            <TimelineDot done={settled} />
            <Text style={styles.timelineText}>{settled ? 'Voucher Settled & Closed' : 'Pending Verification'}</Text>
          </View>
          <View style={styles.lockNotice}>
            <PadlockIcon size={14} />
            <Text style={styles.lockNoticeText}>
              Vouchers are tamper-evident records reconciled with the central finance ledger.
            </Text>
          </View>
        </Card>

        <SectionTitle>Actions</SectionTitle>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePrint} activeOpacity={0.75} accessibilityRole="button">
            <PrintIcon />
            <Text style={styles.actionLabel}>Print</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownload} activeOpacity={0.75} accessibilityRole="button">
            <DownloadIcon />
            <Text style={styles.actionLabel}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleViewTransaction}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <EyeIcon />
            <Text style={styles.actionLabel}>Transaction</Text>
          </TouchableOpacity>
        </View>

        <InfoNote tone="warning">
          No Approve Voucher or Reject Voucher action exists: no voucher approval workflow is offered here.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  rowSpaced: { marginTop: adminSpacing.md },
  col: { flex: 1, gap: 2 },
  label: { ...adminType.rowMeta, color: adminColors.muted },
  value: { ...adminType.rowTitle, color: adminColors.ink },
  valueId: { ...adminType.rowTitle, color: adminColors.brandDeep },
  valueAmount: { ...adminType.sectionHead, color: adminColors.ink },

  receiptCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    paddingVertical: adminSpacing.lg,
    marginTop: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  receiptHeader: { ...adminType.rowTitle, color: adminColors.brandDeep },
  receiptKind: { ...adminType.caption, color: adminColors.muted, letterSpacing: 1 },
  receiptAmount: { ...adminType.kpiValue, color: adminColors.ink },

  docRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  timelineText: { ...adminType.body, color: adminColors.ink },
  timelineConnector: {
    width: 2,
    height: adminSpacing.md,
    backgroundColor: adminColors.border,
    marginLeft: 8,
  },
  lockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
    paddingTop: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  lockNoticeText: { ...adminType.rowMeta, flex: 1, color: adminColors.muted },

  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm },
  actionBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  actionLabel: { ...adminType.caption, color: adminColors.ink },
});
