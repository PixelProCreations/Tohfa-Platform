import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow } from '../../theme';
import { resolveAdminRoleCategory } from './FarmerBankAccountDetailsScreen';

function BackArrowWhiteIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface PayoutDetailItem {
  id: string;
  code: string; // e.g. "PY-0002"
  amount: string; // e.g. "₹12,600.00"
  status: string;
  farmerId?: string;
  farmerName?: string;
  poNumber?: string;
  produce?: string;
  quantity?: string;
  date?: string;
}

export interface FarmerPayoutDetailScreenProps {
  payout?: PayoutDetailItem | undefined;
  farmerName?: string | undefined;
  farmerId?: string | undefined;
  role?: string | undefined;
  onBack: () => void;
  onApprove?: (() => void) | undefined;
  onReject?: (() => void) | undefined;
}

export function FarmerPayoutDetailScreen({
  payout,
  farmerName = 'Kumar',
  farmerId = 'FMR-00098',
  role,
  onBack,
  onApprove,
  onReject,
}: FarmerPayoutDetailScreenProps): React.JSX.Element {
  const roleCategory = resolveAdminRoleCategory(role);

  const isWarehouse = roleCategory === 'WAREHOUSE_ADMIN';
  const isFarmerAdmin = roleCategory === 'FARMER_ADMIN';
  const isWarehouseOrFA = isWarehouse || isFarmerAdmin;

  const payoutCode = isWarehouseOrFA ? 'PY-0002' : (payout?.code || 'PY-0002');
  const displayFarmerName = isWarehouseOrFA ? 'Kumar' : (payout?.farmerName || farmerName);
  const displayFarmerId = isWarehouseOrFA ? 'FMR-00098' : (payout?.farmerId || farmerId);
  const amount = isWarehouseOrFA ? '₹12,600.00' : (payout?.amount || '₹12,600.00');
  const poCode = isWarehouseOrFA ? 'PO-0002' : (payout?.poNumber || 'PO-0002');
  const produce = isWarehouseOrFA ? 'Beans' : (payout?.produce || 'Beans');
  const quantity = isWarehouseOrFA ? '300 kg' : (payout?.quantity || '300 kg');
  const date = isWarehouseOrFA ? '8 Oct 2026' : (payout?.date || '8 Oct 2026');
  const calcRef = isWarehouseOrFA ? 'CALC-PAY-0002' : `CALC-${payoutCode}`;

  const [currentApprovalStatus, setCurrentApprovalStatus] = useState<'Awaiting Super Admin Approval' | 'Approved' | 'Rejected' | 'Intimated'>(
    'Awaiting Super Admin Approval'
  );

  const handleApprove = () => {
    Alert.alert('Approve Payout', `Approve payout ${payoutCode} for ${amount}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        style: 'default',
        onPress: () => {
          setCurrentApprovalStatus('Approved');
          onApprove?.();
          Alert.alert('Success', `Payout ${payoutCode} has been approved.`);
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Payout', `Reject payout ${payoutCode}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          setCurrentApprovalStatus('Rejected');
          onReject?.();
          Alert.alert('Rejected', `Payout ${payoutCode} has been marked as rejected.`);
        },
      },
    ]);
  };

  const handleIntimate = () => {
    setCurrentApprovalStatus('Intimated');
    Alert.alert('Intimated', `Intimation notice dispatched for ${payoutCode}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout {payoutCode}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1 · Farmer details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>1 · Farmer details</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Farmer ID" value={displayFarmerId} />
            <DataRow label="Farmer name" value={displayFarmerName} />
            <DataRow label="Registered contact" value="Not shown here" valueStyle={styles.mutedText} />
            <DataRow label="Verified payout account" value="•••• 0123" isLast />
          </View>
        </View>

        {/* 2 · Purchase details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>2 · Purchase details</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Purchase order" value={poCode} />
            <DataRow label="Purchase date" value={date} />
            <DataRow label="Goods receipt" value="GR-0002" />
            <DataRow label="Produce" value={produce} />
            <DataRow label="Accepted quantity" value={quantity} />
            <DataRow label="Accepted grade" value="Grade 1" />
            <DataRow label="Unit price" value="₹42.00 per kg" />
            <DataRow label="Purchase value" value={amount} isLast />
          </View>
        </View>

        {/* 3 · Payout calculation */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>3 · Payout calculation</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Accepted produce value" value={amount} />
            <DataRow label="Approved adjustments" value="₹0.00" />
            <DataRow label="Net payable amount" value={amount} isBold />
            <DataRow label="Currency" value="INR" />
            <DataRow label="Calculation reference" value={calcRef} isLast />
          </View>
        </View>

        {/* 4 · Approval history */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>4 · Approval history</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Requested by" value="Demo TOHFA Admin, 9 Oct 2026, 10:00" />
            <DataRow label="Approval" value={currentApprovalStatus} isBold />
            <DataRow label="Approver" value="—" />
            <DataRow label="Rejection reason" value="—" />
            <DataRow label="Processing reference" value="—" isLast />
          </View>

          {/* Audit Note below fields */}
          <View style={styles.auditNoteBlock}>
            <Text style={styles.auditTimestamp}>9 Oct 2026, 10:00 · Demo TOHFA Admin</Text>
            <Text style={styles.auditMessage}>
              Payout requested and escalated to the Super Admin: {amount}
            </Text>
          </View>
        </View>

        {/* 5 · Payment information */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>5 · Payment information</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Payment method" value="Bank transfer (configured)" isBold />
            <DataRow label="Provider reference" value="—" />
            <DataRow label="Initiated" value="—" />
            <DataRow label="Processed" value="—" />
            <DataRow label="Failure reason" value="—" />
            <DataRow label="Reconciliation status" value="Not applicable" isLast />
          </View>
        </View>

        {/* TOHFA Admin Informational Callout (Screenshot 3) */}
        {roleCategory === 'TOHFA_ADMIN' && (
          <View style={styles.tohfaNoticeBox}>
            <Text style={styles.tohfaNoticeText}>
              This amount is above ₹10,000.00, so it needs a Super Admin who is not the requester.
            </Text>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Bottom Action Bars with RBAC */}

      {/* 1. Super Admin: Big Green Approval + Red Outline Reject (Screenshot 2) */}
      {roleCategory === 'SUPER_ADMIN' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.superAdminApproveBtn}
            onPress={handleApprove}
            activeOpacity={0.8}
          >
            <Text style={styles.superAdminApproveText}>Approval</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.superAdminRejectBtn}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <Text style={styles.superAdminRejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. TOHFA Admin: Intimate + Reject + Close (Screenshot 3) */}
      {roleCategory === 'TOHFA_ADMIN' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tripleBtn}
            onPress={handleIntimate}
            activeOpacity={0.7}
          >
            <Text style={styles.tripleBtnText}>Intimate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tripleBtn, styles.tripleBtnReject]}
            onPress={handleReject}
            activeOpacity={0.7}
          >
            <Text style={styles.tripleBtnRejectText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tripleBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.tripleBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Farmer Admin: Pure Read-Only (NO bottom buttons) (Screenshot 4) */}
      {roleCategory === 'FARMER_ADMIN' && null}

      {/* 4. Warehouse Admin (Main & Sub): Intimate + Close (Screenshot 5) */}
      {roleCategory === 'WAREHOUSE_ADMIN' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.doubleBtn}
            onPress={handleIntimate}
            activeOpacity={0.7}
          >
            <Text style={styles.doubleBtnText}>Intimate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doubleBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.doubleBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function DataRow({
  label,
  value,
  isBold = false,
  isLast = false,
  valueStyle,
}: {
  label: string;
  value: string;
  isBold?: boolean;
  isLast?: boolean;
  valueStyle?: any;
}) {
  return (
    <View style={[styles.dataRow, isLast && styles.dataRowLast]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text
        style={[
          styles.dataValue,
          isBold && styles.dataValueBold,
          valueStyle,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D9480F',
  },
  header: {
    height: 54,
    backgroundColor: '#D9480F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8C501E',
    marginBottom: 12,
  },
  fieldsContainer: {
    // container
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EB',
  },
  dataRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  dataLabel: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
    textAlign: 'right',
    flex: 1.2,
  },
  dataValueBold: {
    fontWeight: '800',
    color: '#1C1917',
  },
  mutedText: {
    color: '#A8A29E',
    fontWeight: '400',
  },
  auditNoteBlock: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F2EB',
  },
  auditTimestamp: {
    fontSize: 11,
    color: '#A8A29E',
    marginBottom: 4,
  },
  auditMessage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    lineHeight: 18,
  },
  tohfaNoticeBox: {
    backgroundColor: '#FFF4EB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0C2',
    marginBottom: 16,
  },
  tohfaNoticeText: {
    fontSize: 12.5,
    color: '#8C501E',
    fontWeight: '600',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...adminShadow.md,
  },
  superAdminApproveBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#00A86B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAdminApproveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  superAdminRejectBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.4,
    borderColor: '#E03131',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAdminRejectText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E03131',
  },
  tripleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#D9D4CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
  },
  tripleBtnReject: {
    borderColor: '#F5C2C7',
  },
  tripleBtnRejectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E03131',
  },
  doubleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#D9D4CC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1917',
  },
});
