import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  redBadgeBg: '#FEE2E2',
  redBadgeText: '#991B1B',
  infoBg: '#FEF3C7',
  infoText: '#B45309',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

function LockIcon({ size = 16, color = PALETTE.infoText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BoxOutlineIcon({ color = PALETTE.primary }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockOutlineIcon({ color = PALETTE.primary }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseStorageLocationDetailScreenProps {
  locationId: string;
  onBack: () => void;
  onViewStock?: () => void;
  onViewActivity?: () => void;
}

export function SubWarehouseStorageLocationDetailScreen({
  locationId,
  onBack,
  onViewStock,
  onViewActivity,
}: SubWarehouseStorageLocationDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rack 02 · Shelf 03</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Occupied</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* ─── Location Information ─── */}
        <Text style={styles.sectionTitle}>Location Information</Text>
        <View style={styles.card}>
          <View style={styles.rowTwoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Location ID</Text>
              <Text style={styles.value}>LOC-COO-A02-S03</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Storage Type</Text>
              <Text style={styles.value}>Cold Storage</Text>
            </View>
          </View>
          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Section</Text>
              <Text style={styles.value}>A</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rack</Text>
              <Text style={styles.value}>02</Text>
            </View>
          </View>
          <View style={[styles.rowTwoCol, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Shelf</Text>
              <Text style={styles.value}>03</Text>
            </View>
          </View>
        </View>

        {/* ─── Occupancy ─── */}
        <Text style={styles.sectionTitle}>Occupancy</Text>
        <View style={styles.card}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.value}>Current</Text>
            <Text style={[styles.value, { color: PALETTE.primary }]}>68%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '68%' }]} />
          </View>
          <View style={styles.rowTwoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Capacity</Text>
              <Text style={styles.value}>500 KG</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Available</Text>
              <Text style={styles.value}>160 KG</Text>
            </View>
          </View>
        </View>

        {/* ─── Stored Stock ─── */}
        <Text style={styles.sectionTitle}>Stored Stock</Text>
        <View style={styles.stockCard}>
          <View>
            <Text style={styles.value}>Tomato</Text>
            <Text style={styles.label}>Grade 1</Text>
          </View>
          <Text style={styles.value}>140 KG</Text>
        </View>
        <View style={styles.stockCard}>
          <View>
            <Text style={styles.value}>Carrot</Text>
            <Text style={styles.label}>Grade 1</Text>
          </View>
          <Text style={styles.value}>80 KG</Text>
        </View>

        {/* ─── Actions ─── */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={onViewStock} activeOpacity={0.75}>
          <BoxOutlineIcon color={PALETTE.primary} />
          <Text style={styles.actionBtnText}>View Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onViewActivity} activeOpacity={0.75}>
          <ClockOutlineIcon color={PALETTE.primary} />
          <Text style={styles.actionBtnText}>View Activity</Text>
        </TouchableOpacity>

        {/* ─── Info Notice ─── */}
        <View style={styles.infoNotice}>
          <LockIcon />
          <Text style={styles.infoNoticeText}>
            SWA views this location's stock and activity here — this is a deep-link into inventory data, not a second stock-editing system.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  headerBadge: {
    backgroundColor: PALETTE.redBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  headerBadgeText: {
    color: PALETTE.redBadgeText,
    fontWeight: '700',
    fontSize: 12,
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  rowTwoCol: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#F3EFE9',
    borderRadius: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PALETTE.primary,
    borderRadius: 6,
  },

  stockCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  actionBtnText: {
    color: PALETTE.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoNoticeText: {
    flex: 1,
    color: PALETTE.infoText,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
