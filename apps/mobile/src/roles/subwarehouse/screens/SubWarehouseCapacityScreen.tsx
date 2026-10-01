import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  infoBg: '#FEF3C7',
  infoText: '#B45309',
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

function HomeTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v12M7 10l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active = false }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 9h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active = true }: { active?: boolean }) {
  const color = active ? PALETTE.primary : '#9E9690';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}


export interface SubWarehouseCapacityScreenProps {
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

export function SubWarehouseCapacityScreen({
  onBack,
  onTabChange,
}: SubWarehouseCapacityScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Warehouse Capacity</Text>
        </View>
        <View style={styles.warehousePill}>
          <LockIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Main Capacity Card */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Warehouse Capacity</Text>
            <Text style={styles.percentTextPrimary}>68%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '68%', backgroundColor: '#B45309' }]} />
          </View>
          <View style={styles.rowTwoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Occupied</Text>
              <Text style={styles.value}>68%</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Available</Text>
              <Text style={styles.value}>32%</Text>
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>Operational</Text>
          </View>
        </View>

        {/* Capacity Breakdown */}
        <Text style={styles.sectionTitle}>Capacity Breakdown</Text>
        
        <View style={styles.cardSmall}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitleSmall}>Cold Storage</Text>
            <Text style={styles.percentTextPrimary}>68%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '68%', backgroundColor: '#B45309' }]} />
          </View>
        </View>

        <View style={styles.cardSmall}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitleSmall}>Dry Storage</Text>
            <Text style={styles.percentTextPrimary}>52%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '52%', backgroundColor: '#D97706' }]} />
          </View>
        </View>

        <View style={styles.cardSmall}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitleSmall}>Material Storage</Text>
            <Text style={styles.percentTextPrimary}>41%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '41%', backgroundColor: '#D97706' }]} />
          </View>
        </View>

        {/* Location Capacity */}
        <Text style={styles.sectionTitle}>Location Capacity — Cold Storage</Text>
        
        <View style={styles.cardSmall}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitleSmall}>Section A</Text>
            <Text style={styles.percentTextPrimary}>72%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '72%', backgroundColor: '#B45309' }]} />
          </View>
        </View>

        <View style={styles.cardSmall}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitleSmall}>Section B</Text>
            <Text style={styles.percentTextPrimary}>58%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '58%', backgroundColor: '#D97706' }]} />
          </View>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <LockIcon size={16} color={PALETTE.infoText} />
          <Text style={styles.infoNoticeText}>
            View only. There is no Edit Capacity or Change Capacity Limit action anywhere on this screen — SWA cannot modify global warehouse capacity configuration.
          </Text>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
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
  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 20,
    marginBottom: 20,
  },
  cardSmall: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: PALETTE.textInk },
  cardTitleSmall: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk },
  percentTextPrimary: { fontSize: 18, fontWeight: '800', color: '#B45309' },
  
  progressBarBg: {
    height: 10,
    backgroundColor: '#F3EFE9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  rowTwoCol: { flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontSize: 13, color: PALETTE.textSecondary, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk, marginTop: 8, marginBottom: 12 },

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoNoticeText: { flex: 1, color: PALETTE.infoText, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#9E9690',
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
