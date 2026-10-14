import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
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
} from './CreateAdminAccountScreen';

export interface AdminActivityEntry {
  id: string;
  adminName: string;
  adminRole: string;
  actionTitle: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  category: 'AUTH' | 'KYC' | 'CONFIG' | 'PAYOUT' | 'WAREHOUSE';
  details: string;
}

const MOCK_ACTIVITY: AdminActivityEntry[] = [
  {
    id: 'log-1',
    adminName: 'Rajesh Kumar',
    adminRole: 'SA',
    actionTitle: 'Dual-Approval Signed: ₹45,200',
    timestamp: 'Today, 10:42 AM',
    ipAddress: '103.14.120.4',
    device: 'iPhone 15 Pro (Admin App)',
    category: 'PAYOUT',
    details: 'Signed off Tier-2 batch payout for 3 organic carrot farmers in Kotagiri zone.',
  },
  {
    id: 'log-2',
    adminName: 'Anitha Raghavan',
    adminRole: 'TA',
    actionTitle: 'Farmer KYC Verified & Approved',
    timestamp: 'Today, 09:15 AM',
    ipAddress: '103.14.120.18',
    device: 'Pixel 8 (Admin App)',
    category: 'KYC',
    details: 'Verified PGS-India Organic scope certificate for Ramanathan K (Farm #2041).',
  },
  {
    id: 'log-3',
    adminName: 'Rajesh Kumar',
    adminRole: 'SA',
    actionTitle: 'Channel Quota Updated',
    timestamp: 'Yesterday, 06:20 PM',
    ipAddress: '103.14.120.4',
    device: 'Web Console',
    category: 'CONFIG',
    details: 'Updated reserve buffer from 8% to 10% for weekend tourist demand surge in Ooty.',
  },
  {
    id: 'log-4',
    adminName: 'Prakash Velu',
    adminRole: 'SW',
    actionTitle: 'QR Batch Dispatch Recorded',
    timestamp: 'Yesterday, 03:30 PM',
    ipAddress: '103.14.120.91',
    device: 'Zebra TC26 Handheld',
    category: 'WAREHOUSE',
    details: 'Scanned 14 crates of Nilgiri Tea (Grade A, 280kg total) for Main Hub transport.',
  },
  {
    id: 'log-5',
    adminName: 'Suresh Mani',
    adminRole: 'TA',
    actionTitle: 'Admin Account Request Submitted',
    timestamp: 'Yesterday, 04:15 PM',
    ipAddress: '103.14.120.22',
    device: 'Galaxy S23 (Admin App)',
    category: 'AUTH',
    details: 'Requested Sub Warehouse Admin account creation for Ravi Chandran (Coonoor Hub).',
  },
];

export interface AdminActivityLogsScreenProps {
  adminId?: string | undefined;
  onBack?: (() => void) | undefined;
}

export function AdminActivityLogsScreen({ adminId, onBack }: AdminActivityLogsScreenProps) {
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const categories = ['ALL', 'PAYOUT', 'KYC', 'CONFIG', 'WAREHOUSE', 'AUTH'];

  const filteredLogs = MOCK_ACTIVITY.filter(
    (l) => selectedCat === 'ALL' || l.category === selectedCat
  );

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'PAYOUT':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'KYC':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'CONFIG':
        return { bg: '#FFF1EB', text: '#F0562A' };
      case 'WAREHOUSE':
        return { bg: '#EBF3FA', text: '#1D6399' };
      case 'AUTH':
        return { bg: '#FDEEE9', text: '#943818' };
      default:
        return { bg: '#F5F1EB', text: '#786F68' };
    }
  };

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
        <Text style={styles.screenTitle}>Admin Activity Audit</Text>
        <Text style={styles.screenSubtitle}>
          Immutable administrative activity log with IP & device authentication trail
        </Text>
      </View>

      {/* Category Pills */}
      <View style={styles.catWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => {
            const isSel = selectedCat === item;
            return (
              <TouchableOpacity
                style={[styles.catPill, isSel && styles.catPillActive]}
                onPress={() => setSelectedCat(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catPillText, isSel && styles.catPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Logs Feed */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.logListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const catMeta = getCategoryColor(item.category);

          return (
            <View style={styles.logCard}>
              <View style={styles.logCardHeader}>
                <View style={[styles.catBadge, { backgroundColor: catMeta.bg }]}>
                  <Text style={[styles.catBadgeText, { color: catMeta.text }]}>
                    {item.category}
                  </Text>
                </View>

                <Text style={styles.logTime}>{item.timestamp}</Text>
              </View>

              <Text style={styles.actionTitle}>{item.actionTitle}</Text>
              <Text style={styles.actionDetails}>{item.details}</Text>

              <View style={styles.logCardFooter}>
                <Text style={styles.actorName}>
                  By <Text style={{ fontWeight: '700', color: ADMIN_PALETTE.textPrimary }}>{item.adminName} ({item.adminRole})</Text>
                </Text>
                <Text style={styles.ipText}>{item.ipAddress}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
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
  catWrapper: {
    marginBottom: 14,
  },
  catList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  catPillActive: {
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    borderColor: ADMIN_PALETTE.primaryOrange,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_PALETTE.textSecondary,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logListContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 40,
  },
  logCard: {
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
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  catBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textMuted,
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 4,
  },
  actionDetails: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  logCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ADMIN_PALETTE.pageBg,
  },
  actorName: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
  },
  ipText: {
    fontSize: 11,
    color: ADMIN_PALETTE.textMuted,
    fontFamily: 'monospace',
  },
});
