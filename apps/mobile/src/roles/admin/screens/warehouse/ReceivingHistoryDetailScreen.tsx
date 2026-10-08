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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A', // Brand Orange
  headerBg: '#F0562A',
  pageBg: '#F3EFE9', // App canvas soft cream
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  borderSubtle: '#F2ECE5',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#8C8983',
  orangeDeep: '#7A2E14',
  greenSuccess: '#16A34A',
  greenBg: '#DCFCE7',
  amberWarning: '#D97706',
  amberBg: '#FEF3C7',
  redAlert: '#E24B4A',
  redBg: '#FCEBEB',
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

function TimelineIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6h6v6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningCircleIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function QrCodeIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h3M18 14h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TruckIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface ReceivingHistoryDetailScreenProps {
  receiptId?: string;
  grnId?: string;
  shipmentId?: string;
  warehouseName?: string;
  result?: string;
  receivedBy?: string;
  date?: string;
  productName?: string;
  receivedQty?: string;
  expectedQty?: string;
  onBack?: () => void;
  onNavigateTimeline?: () => void;
  onNavigateDiscrepancy?: () => void;
  onNavigateBatch?: () => void;
  onNavigateShipment?: () => void;
}

export function ReceivingHistoryDetailScreen({
  receiptId = 'GRN-000842',
  shipmentId = 'SHP-000124',
  warehouseName = 'Coonoor',
  result = 'Partially Accepted',
  receivedBy = 'Suresh',
  date = '25 Sep 2026',
  productName = 'Tomato · Grade 2',
  receivedQty = '445 KG',
  expectedQty = '480 KG',
  onBack,
  onNavigateTimeline,
  onNavigateDiscrepancy,
  onNavigateBatch,
  onNavigateShipment,
}: ReceivingHistoryDetailScreenProps) {
  const isPartial = result.toLowerCase().includes('partial');
  const isRejected = result.toLowerCase().includes('reject');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Middle Screen in Image) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Receiving History Detail</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Receipt History Detail Card (Exact match to Middle Screen) ─── */}
        <View style={styles.detailCard}>
          <Text style={styles.cardHeading}>Receipt History Detail</Text>

          <View style={styles.infoGrid}>
            {/* Row 1 */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Receipt ID</Text>
                <Text style={styles.gridValBold}>{receiptId}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Shipment ID</Text>
                <Text style={styles.gridValBold}>{shipmentId}</Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Warehouse</Text>
                <Text style={styles.gridValBold}>{warehouseName}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Result</Text>
                <View
                  style={[
                    styles.resultPill,
                    isPartial ? styles.resultPillAmber : isRejected ? styles.resultPillRed : styles.resultPillGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultPillText,
                      isPartial ? styles.resultPillTextAmber : isRejected ? styles.resultPillTextRed : styles.resultPillTextGreen,
                    ]}
                  >
                    {result}
                  </Text>
                </View>
              </View>
            </View>

            {/* Row 3 */}
            <View style={[styles.gridRow, { marginBottom: 0 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Received By</Text>
                <Text style={styles.gridValBold}>{receivedBy}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValBold}>{date}</Text>
              </View>
            </View>
          </View>

          {/* Product & Quantity Sub-strip */}
          <View style={styles.productStrip}>
            <View>
              <Text style={styles.stripLabel}>Product Received</Text>
              <Text style={styles.stripVal}>{productName}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.stripLabel}>Accepted / Expected</Text>
              <Text style={[styles.stripVal, { color: PALETTE.primary }]}>
                {receivedQty} / {expectedQty}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 4 Action Navigation Tiles (2x2 Grid, Exact match to Middle Screen) ─── */}
        <View style={styles.tilesGrid}>
          {/* Tile 1: Timeline */}
          <TouchableOpacity
            style={styles.actionTile}
            onPress={onNavigateTimeline}
            activeOpacity={0.75}
          >
            <TimelineIcon size={24} color={PALETTE.primary} />
            <Text style={styles.tileLabel}>Timeline</Text>
          </TouchableOpacity>

          {/* Tile 2: Discrepancy */}
          <TouchableOpacity
            style={styles.actionTile}
            onPress={onNavigateDiscrepancy}
            activeOpacity={0.75}
          >
            <WarningCircleIcon size={24} color={PALETTE.primary} />
            <Text style={styles.tileLabel}>Discrepancy</Text>
          </TouchableOpacity>

          {/* Tile 3: Batch Link */}
          <TouchableOpacity
            style={styles.actionTile}
            onPress={onNavigateBatch}
            activeOpacity={0.75}
          >
            <QrCodeIcon size={24} color={PALETTE.primary} />
            <Text style={styles.tileLabel}>Batch Link</Text>
          </TouchableOpacity>

          {/* Tile 4: Shipment Link */}
          <TouchableOpacity
            style={styles.actionTile}
            onPress={onNavigateShipment}
            activeOpacity={0.75}
          >
            <TruckIcon size={24} color={PALETTE.primary} />
            <Text style={styles.tileLabel}>Shipment Link</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Return Action */}
        {onBack && (
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.returnBtnText}>← Back to Receiving History</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
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
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  detailCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    marginBottom: 14,
  },
  infoGrid: {
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  gridValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  resultPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultPillGreen: {
    backgroundColor: PALETTE.greenBg,
  },
  resultPillAmber: {
    backgroundColor: PALETTE.amberBg,
  },
  resultPillRed: {
    backgroundColor: PALETTE.redBg,
  },
  resultPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  resultPillTextGreen: {
    color: PALETTE.greenSuccess,
  },
  resultPillTextAmber: {
    color: PALETTE.amberWarning,
  },
  resultPillTextRed: {
    color: PALETTE.redAlert,
  },
  productStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.borderSubtle,
    padding: 10,
    marginTop: 14,
  },
  stripLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textMuted,
  },
  stripVal: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionTile: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 8,
  },
  returnBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.primary,
  },
});
