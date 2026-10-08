import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  redBadgeBg: '#FEE2E2',
  redBadgeText: '#991B1B',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseOperationalIssuesScreenProps {
  onBack: () => void;
  onNavigateToReport: () => void;
  onViewIssueDetail?: () => void;
}

export function SubWarehouseOperationalIssuesScreen({
  onBack,
  onNavigateToReport,
  onViewIssueDetail,
}: SubWarehouseOperationalIssuesScreenProps) {
  const [activeTab, setActiveTab] = useState('Open');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Operational Issues</Text>
        </View>
        <View style={styles.warehousePill}>
          <LockIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={[styles.gridVal, { color: '#DC2626' }]}>3</Text>
            <Text style={styles.gridLabel}>OPEN</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={[styles.gridVal, { color: '#1E1612' }]}>2</Text>
            <Text style={styles.gridLabel}>IN PROGRESS</Text>
          </View>
          <View style={styles.gridCard}>
            <Text style={[styles.gridVal, { color: '#1E1612' }]}>8</Text>
            <Text style={styles.gridLabel}>RESOLVED</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filtersRow}>
          {['Open', 'In Progress', 'Resolved', 'All'].map((filter) => {
            const isActive = activeTab === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveTab(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Issue Card 1: ISS-0029 */}
        <TouchableOpacity style={styles.issueCard} onPress={onViewIssueDetail} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardId}>ISS-0029</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Open</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>Orders Fulfillment · ORD-1018</Text>
          <Text style={styles.cardTitle}>Quality / Quantity issue reported</Text>
          <Text style={styles.cardDate}>Today · Just now</Text>
        </TouchableOpacity>

        {/* Issue Card 2: ISS-0028 */}
        <TouchableOpacity style={styles.issueCard} onPress={onViewIssueDetail} activeOpacity={0.7}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardId}>ISS-0028</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Open</Text>
            </View>
          </View>
          <Text style={styles.cardSub}>Cold Storage · Section A</Text>
          <Text style={styles.cardTitle}>Cold storage maintenance required</Text>
          <Text style={styles.cardDate}>24 Sep · 11:20 AM</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNavigateToReport} activeOpacity={0.8}>
          <PlusIcon />
          <Text style={styles.primaryBtnText}>Report Operational Issue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 44,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  warehousePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 100 },

  grid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  gridCard: { flex: 1, backgroundColor: PALETTE.cardBg, borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, paddingVertical: 12, alignItems: 'center' },
  gridVal: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  gridLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textSecondary },

  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: PALETTE.cardBg, borderWidth: 1, borderColor: PALETTE.border },
  filterPillActive: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
  filterText: { fontSize: 13, fontWeight: '700', color: PALETTE.textSecondary },
  filterTextActive: { color: '#FFFFFF' },

  issueCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardId: { fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  badge: { backgroundColor: PALETTE.redBadgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', color: PALETTE.redBadgeText },
  cardSub: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.textInk, marginBottom: 8 },
  cardDate: { fontSize: 11, color: PALETTE.textSecondary },

  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
