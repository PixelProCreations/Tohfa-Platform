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
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FFF7F1',
  noticeBorderOrange: '#FCDCCB',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  borderRow:          '#F3EFE9',
  cardBg:             '#FFFFFF',

  // Semantic Badges matching Left Design
  shortageBg:         '#FEF3E2', // Warning BG (soft amber/peach)
  shortageText:       '#854F0B', // Warning dark gold/brown
  excessBg:           '#E6F1FB', // Info BG (soft blue)
  excessText:         '#0C447C', // Info blue
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

function ArrowForwardIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface QuantityVerificationItem {
  product: string;
  expected: string;
  received: string;
  status: 'Shortage' | 'Excess' | 'Match';
}

export interface QuantityVerificationScreenProps {
  shipmentId?: string;
  items?: QuantityVerificationItem[];
  onBack?: () => void;
  onContinueToQualityCheck?: () => void;
}

export function QuantityVerificationScreen({
  shipmentId = 'SHP-000124',
  items,
  onBack,
  onContinueToQualityCheck,
}: QuantityVerificationScreenProps) {
  const tableItems: QuantityVerificationItem[] = items || [
    {
      product: 'Tomato',
      expected: '500 KG',
      received: '480 KG',
      status: 'Shortage',
    },
    {
      product: 'Potato',
      expected: '300 KG',
      received: '310 KG',
      status: 'Excess',
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Quantity Verification</Text>
        </View>
        <Text style={styles.headerSubtitle}>{shipmentId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Verification Table Card ─── */}
        <View style={styles.tableCard}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCol, { flex: 1.25 }]}>PRODUCT</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>EXPECTED</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>RECEIVED</Text>
            <Text style={[styles.headerCol, { flex: 0.9, textAlign: 'right' }]}>STATUS</Text>
          </View>

          {/* Data Rows */}
          {tableItems.map((item, idx) => {
            const isShortage = item.status === 'Shortage';
            return (
              <View
                key={item.product}
                style={[
                  styles.tableDataRow,
                  idx > 0 && styles.rowDivider,
                ]}
              >
                <Text style={[styles.cellText, { flex: 1.25, fontWeight: '700' }]}>
                  {item.product}
                </Text>
                <Text style={[styles.cellText, { flex: 1, fontWeight: '700' }]}>
                  {item.expected}
                </Text>
                <Text style={[styles.cellText, { flex: 1, fontWeight: '700' }]}>
                  {item.received}
                </Text>
                <View style={{ flex: 0.9, alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isShortage
                          ? PALETTE.shortageBg
                          : PALETTE.excessBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: isShortage
                            ? PALETTE.shortageText
                            : PALETTE.excessText,
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── Formula / Notice Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Difference is always calculated as Received - Expected — the user never types the difference directly.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onContinueToQualityCheck}
          activeOpacity={0.8}
        >
          <ArrowForwardIcon size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Continue to Quality Check</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
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
    marginLeft: 32,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  tableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerCol: {
    fontSize: 9.5,
    fontWeight: '800',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderRow,
  },
  cellText: {
    fontSize: 13.5,
    color: PALETTE.textInk,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.orangeDeep,
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
  },
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
