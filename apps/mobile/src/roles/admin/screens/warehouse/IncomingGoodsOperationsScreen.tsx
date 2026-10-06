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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A',
  headerBg:      '#F0562A',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14',
  primarySoft:   '#FDF3F0',
  pageBg:        '#F3EFE9',

  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  border:        '#EEDCD3',
  borderRow:     '#F2ECE5',
  cardBg:        '#FFFFFF',

  redAlert:      '#E24B4A',
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

function TruckIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface IncomingGoodsOperationsScreenProps {
  onBack?: () => void;
  onSelectShipment?: (id: string) => void;
  onNavigateReceiving?: () => void;
}

export function IncomingGoodsOperationsScreen({
  onBack,
  onSelectShipment,
  onNavigateReceiving,
}: IncomingGoodsOperationsScreenProps) {
  const SUMMARY_ROWS = [
    { label: 'Expected Shipments', value: '24', isAlert: false },
    { label: 'Arrived', value: '19', isAlert: false },
    { label: 'Receiving Complete', value: '14', isAlert: false },
    { label: 'Discrepancies', value: '2', isAlert: true },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Screenshot 2) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Incoming Goods</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Summary Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Incoming Goods Summary</Text>
        </View>

        <View style={styles.summaryCard}>
          {SUMMARY_ROWS.map((row, index) => {
            const isLast = index === SUMMARY_ROWS.length - 1;
            return (
              <TouchableOpacity
                key={row.label}
                style={[styles.tableRow, !isLast && styles.tableRowBorder]}
                onPress={onNavigateReceiving}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={[
                      styles.rowValue,
                      row.isAlert && { color: PALETTE.redAlert },
                    ]}
                  >
                    {row.value}
                  </Text>
                  <Text style={{ fontSize: 13, color: PALETTE.textSecondary }}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Discrepancy Detail Card ─── */}
        <TouchableOpacity
          style={styles.discrepancyCard}
          onPress={() => onSelectShipment?.('GR-04512')}
          activeOpacity={0.7}
        >
          <View style={styles.iconSquare}>
            <TruckIcon size={18} color={PALETTE.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>GR-04512 · Kotagiri</Text>
            <Text style={styles.cardSub}>Discrepancy: qty mismatch · Tap to inspect</Text>
          </View>
          <Text style={styles.timeText}>09:45 AM</Text>
        </TouchableOpacity>

        {/* Action Button to Receiving Hub */}
        {onNavigateReceiving && (
          <TouchableOpacity
            style={styles.bottomActionBtn}
            onPress={onNavigateReceiving}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomActionText}>View All Incoming Shipments in Receiving →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderRow,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  discrepancyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C8983',
    marginLeft: 8,
  },
  bottomActionBtn: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
});
