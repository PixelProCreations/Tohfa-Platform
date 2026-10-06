import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FDF3F0', // Brand Orange Tint (NO yellow)
  noticeBorderOrange: '#F7CFC4',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  cardBg:             '#FFFFFF',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TransferArrowsIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayCircleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Polygon points="10,8 16.5,12 10,16" fill={color} />
    </Svg>
  );
}

export interface TransferReceivingScreenProps {
  onBack?: () => void;
  onStartTransferInspection?: (transferId: string) => void;
}

export function TransferReceivingScreen({
  onBack,
  onStartTransferInspection,
}: TransferReceivingScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Image 3) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Transfer Receiving</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Coonoor ← Kotagiri, and other inter-warehouse arrivals
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 KPI Summary Grid (2×2) ─── */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>IN TRANSIT</Text>
              <Text style={styles.kpiValue}>2</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ARRIVED</Text>
              <Text style={styles.kpiValue}>1</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>RECEIVING PENDING</Text>
              <Text style={styles.kpiValue}>1</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>QTY MISMATCH</Text>
              <Text style={styles.kpiValue}>1</Text>
            </View>
          </View>
        </View>

        {/* ─── Section: Incoming Transfer List ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Incoming Transfer List</Text>
        </View>

        {/* Transfer Item Card */}
        <TouchableOpacity
          style={styles.transferCard}
          onPress={() => onStartTransferInspection && onStartTransferInspection('TRF-00284')}
          activeOpacity={0.8}
        >
          <View style={styles.iconBox}>
            <TransferArrowsIcon size={18} color={PALETTE.primary} />
          </View>
          <View style={styles.transferContent}>
            <Text style={styles.trfTitle}>TRF-00284</Text>
            <Text style={styles.trfSub}>Kotagiri · 200 KG</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Arrived</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button (Image 3) ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onStartTransferInspection && onStartTransferInspection('TRF-00284')}
          activeOpacity={0.8}
        >
          <PlayCircleIcon size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  kpiGrid: {
    gap: 12,
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  sectionHeaderRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  transferCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.noticeBgOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferContent: {
    flex: 1,
  },
  trfTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  trfSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 100,
    backgroundColor: PALETTE.noticeBgOrange,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
