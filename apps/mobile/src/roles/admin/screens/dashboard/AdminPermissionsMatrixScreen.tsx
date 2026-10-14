import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ADMIN_PALETTE,
  AdminBackChevronIcon,
  AdminRoleType,
} from './CreateAdminAccountScreen';

function CheckIcon({ color = ADMIN_PALETTE.successText, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MinusIcon({ color = ADMIN_PALETTE.textMuted, size = 14 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

interface PermissionRow {
  module: string;
  action: string;
  sa: boolean;
  ta: boolean;
  mw: boolean;
  sw: boolean;
  fa: boolean;
}

const PERMISSIONS_DATA: PermissionRow[] = [
  { module: 'User Provisioning', action: 'Create Super Admin (SA) & Tohfa Admin (TA)', sa: true, ta: false, mw: false, sw: false, fa: false },
  { module: 'User Provisioning', action: 'Create Field Admin (FA) & Sub Warehouse (SW)', sa: true, ta: true, mw: false, sw: false, fa: false },
  { module: 'Payouts & Finance', action: 'Sign-off Payouts > ₹10,000 (Tier 2 Dual Approval)', sa: true, ta: false, mw: false, sw: false, fa: false },
  { module: 'Payouts & Finance', action: 'Approve Payouts <= ₹10,000 (Single Approval)', sa: true, ta: true, mw: false, sw: false, fa: true },
  { module: 'System Config', action: 'Edit Channel Allocation % & Subscription Fees', sa: true, ta: false, mw: false, sw: false, fa: false },
  { module: 'Pricing & MSP', action: 'Configure Dynamic Fair Price Bands & Floor Caps', sa: true, ta: true, mw: false, sw: false, fa: false },
  { module: 'Farmers & KYC', action: 'Approve Farmer Bank Accounts & Land Records', sa: true, ta: true, mw: false, sw: false, fa: true },
  { module: 'Warehouse Ops', action: 'Generate QR Batch Labels & Dispatch Shipments', sa: true, ta: true, mw: true, sw: true, fa: false },
  { module: 'Warehouse Ops', action: 'Record Produce Arrival Weight & Quality Grade', sa: true, ta: true, mw: true, sw: true, fa: false },
  { module: 'Audit & Compliance', action: 'Schedule Quarterly Audits & Block Non-Compliant Farms', sa: true, ta: true, mw: false, sw: false, fa: false },
];

export interface AdminPermissionsMatrixScreenProps {
  onBack?: (() => void) | undefined;
}

export function AdminPermissionsMatrixScreen({ onBack }: AdminPermissionsMatrixScreenProps) {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | AdminRoleType>('ALL');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AdminBackChevronIcon />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>Role Permissions Matrix</Text>
        <Text style={styles.screenSubtitle}>
          Hierarchical privilege boundaries and operational capabilities across roles
        </Text>
      </View>

      {/* Role Summary Chips */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipRole}>SA</Text>
          <Text style={styles.chipDesc}>Super Admin</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipRole}>TA</Text>
          <Text style={styles.chipDesc}>Tohfa Admin</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipRole}>MW</Text>
          <Text style={styles.chipDesc}>Main Warehouse</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipRole}>SW</Text>
          <Text style={styles.chipDesc}>Sub Warehouse</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipRole}>FA</Text>
          <Text style={styles.chipDesc}>Field Admin</Text>
        </View>
      </View>

      <ScrollView
        style={styles.matrixContainer}
        contentContainerStyle={styles.matrixContent}
        showsVerticalScrollIndicator={false}
      >
        {PERMISSIONS_DATA.map((item, idx) => (
          <View key={idx} style={styles.permCard}>
            <View style={styles.permHeader}>
              <Text style={styles.moduleTag}>{item.module}</Text>
              <Text style={styles.permActionText}>{item.action}</Text>
            </View>

            <View style={styles.roleGrid}>
              <View style={[styles.roleCell, item.sa ? styles.roleCellYes : styles.roleCellNo]}>
                <Text style={styles.cellRoleName}>SA</Text>
                {item.sa ? <CheckIcon size={14} /> : <MinusIcon />}
              </View>

              <View style={[styles.roleCell, item.ta ? styles.roleCellYes : styles.roleCellNo]}>
                <Text style={styles.cellRoleName}>TA</Text>
                {item.ta ? <CheckIcon size={14} /> : <MinusIcon />}
              </View>

              <View style={[styles.roleCell, item.mw ? styles.roleCellYes : styles.roleCellNo]}>
                <Text style={styles.cellRoleName}>MW</Text>
                {item.mw ? <CheckIcon size={14} /> : <MinusIcon />}
              </View>

              <View style={[styles.roleCell, item.sw ? styles.roleCellYes : styles.roleCellNo]}>
                <Text style={styles.cellRoleName}>SW</Text>
                {item.sw ? <CheckIcon size={14} /> : <MinusIcon />}
              </View>

              <View style={[styles.roleCell, item.fa ? styles.roleCellYes : styles.roleCellNo]}>
                <Text style={styles.cellRoleName}>FA</Text>
                {item.fa ? <CheckIcon size={14} /> : <MinusIcon />}
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  titleBlock: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PALETTE.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    gap: 4,
  },
  chipRole: {
    fontSize: 11,
    fontWeight: '800',
    color: ADMIN_PALETTE.primaryOrange,
  },
  chipDesc: {
    fontSize: 11,
    color: ADMIN_PALETTE.textSecondary,
  },
  matrixContainer: {
    flex: 1,
  },
  matrixContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 40,
  },
  permCard: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  permHeader: {
    marginBottom: 10,
  },
  moduleTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  permActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    lineHeight: 18,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  roleCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  roleCellYes: {
    backgroundColor: ADMIN_PALETTE.successBg,
    borderColor: '#BBF7D0',
  },
  roleCellNo: {
    backgroundColor: ADMIN_PALETTE.pageBg,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  cellRoleName: {
    fontSize: 10,
    fontWeight: '800',
    color: ADMIN_PALETTE.textSecondary,
  },
});
