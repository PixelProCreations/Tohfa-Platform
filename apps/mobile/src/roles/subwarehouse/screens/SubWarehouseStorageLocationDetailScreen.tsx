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
import Svg, { Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',

  alertBg: '#FEF2F2',
  alertBorder: '#FCA5A5',
  alertText: '#DC2626',

  pillBg: '#1F2937',
  pillText: '#FFFFFF',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────
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

function LockIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 18, color = PALETTE.alertText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L1 21h22L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BoxIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseStorageLocationDetailScreenProps {
  locationId?: string;
  warehouseName?: string;
  onBack: () => void;
  onViewStock?: () => void;
  onViewActivity?: () => void;
}

export function SubWarehouseStorageLocationDetailScreen({
  locationId = 'CS-A01',
  warehouseName = 'Coonoor Warehouse',
  onBack,
  onViewStock,
  onViewActivity,
}: SubWarehouseStorageLocationDetailScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Storage Location</Text>
        </View>

        {/* Warehouse Pill Chip */}
        <View style={styles.warehousePill}>
          <LockIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>{warehouseName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Location Header Title ─── */}
        <Text style={styles.locationTitle}>Cold Storage A — CS-A01</Text>

        {/* ─── 1. Metrics Card ─── */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Status</Text>
              <Text style={styles.metricValue}>Active</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Capacity</Text>
              <Text style={styles.metricValue}>2,000 kg</Text>
            </View>
          </View>

          <View style={[styles.metricsRow, { marginTop: 16 }]}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Current Occupancy</Text>
              <Text style={styles.metricValue}>1,850 kg</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Available</Text>
              <Text style={styles.metricValue}>150 kg</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Storage Capacity Alert Box ─── */}
        <View style={styles.alertBox}>
          <View style={styles.alertIconCol}>
            <WarningTriangleIcon size={18} color={PALETTE.alertText} />
          </View>
          <Text style={styles.alertText}>
            Storage Capacity Alert — Cold Storage A is nearing its configured capacity. Current 1,850 kg of 2,000 kg. This is informational only.
          </Text>
        </View>

        {/* ─── 3. Location Usage Section ─── */}
        <Text style={styles.sectionTitle}>Location Usage</Text>
        <View style={styles.usageCard}>
          <View style={styles.usageRow}>
            <Text style={styles.cropName}>Carrot</Text>
            <Text style={styles.cropQty}>420 kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.usageRow}>
            <Text style={styles.cropName}>Cabbage</Text>
            <Text style={styles.cropQty}>320 kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.usageRow}>
            <Text style={styles.cropName}>Beans</Text>
            <Text style={styles.cropQty}>210 kg</Text>
          </View>
        </View>

        {/* ─── 4. View Stock Action Button ─── */}
        <TouchableOpacity
          style={styles.viewStockBtn}
          onPress={onViewStock}
          activeOpacity={0.8}
        >
          <BoxIcon size={20} color="#FFFFFF" />
          <Text style={styles.viewStockBtnText}>View Stock</Text>
        </TouchableOpacity>

        {/* ─── 5. Deep-links Annotation Tag ─── */}
        <View style={styles.annotationWrap}>
          <View style={styles.annotationPill}>
            <Text style={styles.annotationText}>
              Deep-links into Inventory & Stock — Module 3
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 44,
    marginTop: 6,
    gap: 6,
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  locationTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 12,
    marginTop: 4,
  },

  /* Metrics Card */
  metricsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Alert Box */
  alertBox: {
    backgroundColor: PALETTE.alertBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.alertBorder,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  alertIconCol: {
    marginTop: 2,
  },
  alertText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: PALETTE.alertText,
    fontWeight: '500',
  },

  /* Location Usage Section */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  usageCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textInk,
  },
  cropQty: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFE9',
  },

  /* View Stock Button */
  viewStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
    marginBottom: 32,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  viewStockBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Deep-links Annotation Pill */
  annotationWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  annotationPill: {
    backgroundColor: PALETTE.pillBg,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  annotationText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.pillText,
  },
});
