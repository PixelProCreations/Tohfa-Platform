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
import Svg, { Path } from 'react-native-svg';

interface M3S14Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockSmallWhiteIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
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

export const M3S14_AdjustmentHistory: React.FC<M3S14Props> = ({ onNavigate, onBack }) => {
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
            <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
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
                onPress={() => onNavigate('M3S17')}
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
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#F0562A',
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  tabPillActive: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
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
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusTextPending: {
    color: '#B45309',
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusTextApproved: {
    color: '#166534',
  },
  badgeRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusTextRejected: {
    color: '#991B1B',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
});
