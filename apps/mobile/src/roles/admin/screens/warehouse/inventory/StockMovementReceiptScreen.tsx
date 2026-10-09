// Design id: M3S18
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { adminColors, adminShadow, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export type StockMovementReceiptScreenProps = InventoryScreenBaseProps;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CheckCircleGreenIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={adminColors.success.bg} stroke={adminColors.success.text} strokeWidth="1.8" />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={adminColors.success.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QrVoucherIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-3h-2v3zm4 0h2v-3h-2v3zm-4 4h2v-2h-2v2zm4 0h2v-2h-2v2zm0-4h2v-2h-2v2z" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StockMovementReceiptScreen({ scope, onBack, routeParams }: StockMovementReceiptScreenProps) {
  const handlePrint = () => {
    Alert.alert('Movement Voucher', 'Movement Voucher MOV-000248 sent to printer / share sheet.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Movement Receipt"
          onBack={onBack}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Voucher Card */}
          <View style={styles.voucherCard}>
            {/* Header row with QR */}
            <View style={styles.voucherHeaderRow}>
              <View>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>RECEIPT · COMPLETED</Text>
                </View>
                <Text style={styles.voucherIdText}>MOV-000248</Text>
                <Text style={styles.voucherDateText}>16 Sep 2026, 10:42 AM IST</Text>
              </View>
              <View style={styles.qrContainer}>
                <QrVoucherIcon />
              </View>
            </View>

            <View style={styles.voucherDashedLine} />

            {/* Key Movement Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Product</Text>
                <Text style={styles.detailValue}>Tomato (Grade 1)</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Movement Quantity</Text>
                <Text style={[styles.detailValue, { color: adminColors.brand }]}>+140 KG</Text>
              </View>
            </View>

            <View style={[styles.detailsRow, { marginTop: 12 }]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Warehouse</Text>
                <Text style={styles.detailValue}>{scope.warehouseName ?? String(routeParams?.warehouseName ?? '—')}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Cold Storage · Rack 02</Text>
              </View>
            </View>

            <View style={[styles.detailsRow, { marginTop: 12 }]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Batch Reference</Text>
                <Text style={styles.detailValue}>BAT-COO-00241</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Reference Doc</Text>
                <Text style={styles.detailValue}>GRN-00291 (Goods Receipt)</Text>
              </View>
            </View>

            <View style={styles.voucherDashedLine} />

            {/* Verification & QC Badge */}
            <View style={styles.qcVerifiedBox}>
              <CheckCircleGreenIcon />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.qcTitleText}>Verified & Posted to Ledger</Text>
                <Text style={styles.qcSubText}>Inspected by Suresh (QC-882) · QC Passed</Text>
              </View>
            </View>

            {/* Ledger balance audit */}
            <View style={styles.auditBox}>
              <Text style={styles.auditTitle}>DOUBLE-ENTRY LEDGER BALANCE</Text>
              <View style={styles.auditRow}>
                <Text style={styles.auditKey}>Opening Stock:</Text>
                <Text style={styles.auditVal}>0 KG</Text>
              </View>
              <View style={styles.auditRow}>
                <Text style={styles.auditKey}>Recorded Inward:</Text>
                <Text style={[styles.auditVal, { color: adminColors.success.text }]}>+140 KG</Text>
              </View>
              <View style={[styles.auditRow, { borderTopWidth: 1, borderTopColor: adminColors.border, paddingTop: 6, marginTop: 4 }]}>
                <Text style={[styles.auditKey, { fontWeight: '700' }]}>Closing Available Balance:</Text>
                <Text style={[styles.auditVal, { fontWeight: '800', color: adminColors.brand }]}>140 KG</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              activeOpacity={0.8}
              onPress={handlePrint}
            >
              <ShareIcon />
              <Text style={styles.primaryActionBtnText}>Share / Print Voucher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              activeOpacity={0.8}
              onPress={onBack}
            >
              <Text style={styles.secondaryActionBtnText}>Back to Movement Details</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  voucherCard: {
    backgroundColor: adminColors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    padding: 18,
    ...adminShadow.sm,
    marginBottom: 16,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: adminColors.brand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusPillText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    letterSpacing: 0.5,
  },
  voucherIdText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  voucherDateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  qrContainer: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherDashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  detailValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  qcVerifiedBox: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.success.bg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  qcTitleText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  qcSubText: {
    ...adminType.rowMeta,
    color: adminColors.success.text,
  },
  auditBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
  },
  auditTitle: {
    ...adminType.caption,
    color: adminColors.brand,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  auditKey: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  auditVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  actionsContainer: {
    gap: 10,
  },
  primaryActionBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  primaryActionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  secondaryActionBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
});
