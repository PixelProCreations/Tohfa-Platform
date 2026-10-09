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

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  greenBadgeText: '#0D9488',
  amberBadgeText: '#D97706',
  redBadgeText: '#DC2626',
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

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export interface ActivityDetailData {
  id?: string;
  activityId?: string;
  activityType?: string;
  dateTime?: string;
  warehouse?: string;
  performedBy?: string;
  status?: string;
  action?: string;
  reference?: string;
  notes?: string;
}

export interface SubWarehouseActivityDetailScreenProps {
  activity?: ActivityDetailData | null;
  onBack: () => void;
}

export function SubWarehouseActivityDetailScreen({
  activity,
  onBack,
}: SubWarehouseActivityDetailScreenProps) {
  const displayId = activity?.activityId || activity?.id || 'ACT-004821';
  const displayType = activity?.activityType || 'Storage';
  const displayDateTime = activity?.dateTime || 'Today, 10:42 AM';
  const displayWarehouse = activity?.warehouse || 'Coonoor';
  const displayPerformedBy = activity?.performedBy || 'Warehouse Staff';
  const displayStatus = activity?.status || 'Completed';
  const displayAction =
    activity?.action || 'Tomato moved to Cold Storage · Rack 02, Section A';
  const displayReference = activity?.reference || 'Related Batch BAT-COO-00241';
  const displayNotes =
    activity?.notes || 'Relocated to make room for incoming Section B stock.';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header matching reference design ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Detail</Text>
        </View>

        <View style={styles.warehouseBadgeRow}>
          <View style={styles.warehouseBadge}>
            <LockBadgeIcon />
            <Text style={styles.warehouseBadgeText}>Coonoor Warehouse</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ─── Summary Card ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.label}>Activity ID</Text>
              <Text style={styles.value}>{displayId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Activity Type</Text>
              <Text style={styles.value}>{displayType}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 18 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Date / Time</Text>
              <Text style={styles.value}>{displayDateTime}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Warehouse</Text>
              <Text style={styles.value}>{displayWarehouse}</Text>
            </View>
          </View>

          <View style={[styles.twoColRow, { marginTop: 18 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Performed By</Text>
              <Text style={styles.value}>{displayPerformedBy}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <Text
                style={[
                  styles.value,
                  displayStatus === 'Completed' && { color: PALETTE.greenBadgeText },
                  displayStatus === 'Pending' && { color: PALETTE.amberBadgeText },
                  displayStatus === 'Open' && { color: PALETTE.redBadgeText },
                ]}
              >
                {displayStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Action Section ─── */}
        <Text style={styles.sectionTitle}>Action</Text>
        <View style={styles.infoCard}>
          <Text style={styles.cardContentText}>{displayAction}</Text>
        </View>

        {/* ─── Reference Section ─── */}
        <Text style={styles.sectionTitle}>Reference</Text>
        <View style={styles.infoCard}>
          <Text style={styles.cardContentText}>{displayReference}</Text>
        </View>

        {/* ─── Notes Section ─── */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.infoCard}>
          <Text style={styles.cardContentText}>{displayNotes}</Text>
        </View>
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
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  warehouseBadgeRow: {
    marginTop: 8,
    marginLeft: 48,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginLeft: 2,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardContentText: {
    fontSize: 14,
    color: PALETTE.textInk,
    lineHeight: 22,
    fontWeight: '500',
  },
});
