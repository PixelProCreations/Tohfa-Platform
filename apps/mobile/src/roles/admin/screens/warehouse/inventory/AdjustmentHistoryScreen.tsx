// Design id: M3S14
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';

export interface AdjustmentHistoryScreenProps extends InventoryScreenBaseProps {}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockSmallWhiteIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

const ADJUSTMENTS = [
  {
    id: 'ADJ-000128',
    status: 'Pending Approval',
    statusKey: 'Pending',
    product: 'Tomato · Grade 1 · -5 KG · 16 Sep 2026, 2:30 PM',
  },
  {
    id: 'ADJ-000119',
    status: 'Approved',
    statusKey: 'Approved',
    product: 'Beans · Grade 1 · -2 KG · 15 Sep 2026, 4:10 PM',
  },
  {
    id: 'ADJ-000103',
    status: 'Rejected',
    statusKey: 'Rejected',
    product: 'Beetroot · Grade 1 · -8 KG · 10 Sep 2026, 11:05 AM',
  },
];

export function AdjustmentHistoryScreen({ scope, can, onNavigate, onBack }: AdjustmentHistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const filteredAdjustments = ADJUSTMENTS.filter((item) => {
    if (activeTab === 'All') return true;
    return item.statusKey === activeTab;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header matching Image 5 exactly */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Adjustment History</Text>
          </View>

          {/* Coonoor Warehouse Pill Badge */}
          <View style={styles.warehousePill}>
            <LockSmallWhiteIcon />
            <Text style={styles.warehousePillText}>{scope.warehouseName ?? 'All Warehouses'}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Filter Tabs matching Image 5 */}
          <View style={styles.tabsRow}>
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                  activeOpacity={0.75}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Adjustments List matching Image 5 */}
          {filteredAdjustments.map((item) => {
            const isPending = item.status === 'Pending Approval';
            const isApproved = item.status === 'Approved';
            const isRejected = item.status === 'Rejected';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => onNavigate?.('M3S17')}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardId}>{item.id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isPending && styles.badgePending,
                      isApproved && styles.badgeApproved,
                      isRejected && styles.badgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isPending && styles.statusTextPending,
                        isApproved && styles.statusTextApproved,
                        isRejected && styles.statusTextRejected,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardSubtext}>{item.product}</Text>
              </TouchableOpacity>
            );
          })}

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
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  warehousePill: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderWidth: 1,
    borderColor: adminColors.brandDeep,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    backgroundColor: adminColors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  tabPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  tabTextActive: {
    color: adminColors.onBrand,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardId: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
  },
  statusTextPending: {
    color: adminColors.warning.text,
  },
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
  },
  statusTextApproved: {
    color: adminColors.success.text,
  },
  badgeRejected: {
    backgroundColor: adminColors.danger.bg,
  },
  statusTextRejected: {
    color: adminColors.danger.text,
  },
  statusText: {
    ...adminType.caption,
  },
  cardSubtext: {
    ...adminType.body,
    color: adminColors.muted,
  },
});
