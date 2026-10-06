import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 20, color = '#1E8E5A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface WarehouseCapacityScreenProps {
  onBack?: () => void;
  onViewHistory?: () => void;
}

export function WarehouseCapacityScreen({
  onBack,
  onViewHistory,
}: WarehouseCapacityScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Warehouse Capacity</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Notice Banner */}
        <View style={styles.noticeBox}>
          <ShieldCheckIcon size={20} color="#1E8E5A" />
          <Text style={styles.noticeText}>
            MWA has both View Capacity and Manage Capacity Limits — unlike SWA's view-only access.
          </Text>
        </View>

        {/* Occupancy Card */}
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Occupied</Text>
              <Text style={styles.fieldValue}>68%</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Available</Text>
              <Text style={styles.fieldValue}>32%</Text>
            </View>
          </View>
        </View>

        {/* ─── Warehouse Comparison ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Warehouse Comparison</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.comparisonRow}>
            <Text style={styles.whName}>Ooty</Text>
            <Text style={styles.whValue}>68%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.comparisonRow}>
            <Text style={styles.whName}>Coonoor</Text>
            <Text style={styles.whValue}>72%</Text>
          </View>
        </View>

        {/* Bottom Button */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={onViewHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.historyBtnText}>View Capacity History</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.noticeBgOrange,
    borderColor: PALETTE.noticeBorderOrange,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionHeaderRow: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  whName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  whValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  historyBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
