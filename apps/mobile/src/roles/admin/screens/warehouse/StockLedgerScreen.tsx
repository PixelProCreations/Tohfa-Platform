import React, { useState } from 'react';
import {
  Alert,
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

// ─── Design Tokens (Exact match to TOHFA Admin App Design System PDF) ──────────
const PALETTE = {
  // Brand Palette
  primary: '#F0562A', // Orange: Primary actions, active states, icons
  orangeDeep: '#7A2E14', // Orange Deep: Section headings, emphasis text
  orangeTint: '#FDF3F0', // Orange Tint: Icon chips, role badges, active pills
  pageBg: '#F3EFE9', // Background: App canvas soft cream

  // Neutrals
  textInk: '#1A1A1A', // Ink: Primary text
  textSecondary: '#5F5E5A', // Muted: Secondary text
  border: '#EEDCD3', // Border: Card and input borders
  cardBg: '#FFFFFF', // Card: Card surfaces

  // Semantics
  success: '#16A34A', // Success green (#173404 / #16A34A)
  successBg: '#EAF3DE',
  danger: '#E24B4A', // Danger red (#E24B4A)
  dangerBg: '#FCEBEB',
  info: '#0C447C',
  infoBg: '#E6F1FB',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackWhiteIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadTrayIcon({ size = 18, color = PALETTE.textInk }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Data Types ───────────────────────────────────────────────────────────────

export interface StockBatchItem {
  id: string;
  name: string;
  quantityKg: number;
  batchId: string;
  zone: string;
  receivedDate: string;
}

export interface LedgerEntryItem {
  id: string;
  code: string;
  type: 'RECEIPT' | 'SALE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  quantityKg: number;
  warehouseCity: string;
  produceName: string;
  batchId: string;
}

const INITIAL_LEDGER_ENTRIES: LedgerEntryItem[] = [
  {
    id: '1',
    code: 'MV-000928',
    type: 'RECEIPT',
    quantityKg: 100,
    warehouseCity: 'Ooty',
    produceName: 'Tomato',
    batchId: 'BT-000128',
  },
  {
    id: '2',
    code: 'MV-000929',
    type: 'SALE',
    quantityKg: -20,
    warehouseCity: 'Coonoor',
    produceName: 'Tomato',
    batchId: 'BT-000091',
  },
  {
    id: '3',
    code: 'MV-000930',
    type: 'TRANSFER_IN',
    quantityKg: 50,
    warehouseCity: 'Kotagiri',
    produceName: 'Carrot',
    batchId: 'BT-000104',
  },
  {
    id: '4',
    code: 'MV-000931',
    type: 'ADJUSTMENT',
    quantityKg: -5,
    warehouseCity: 'Ooty',
    produceName: 'Potato',
    batchId: 'BT-000078',
  },
];

const MORE_LEDGER_ENTRIES: LedgerEntryItem[] = [
  {
    id: '5',
    code: 'MV-000932',
    type: 'RECEIPT',
    quantityKg: 120,
    warehouseCity: 'Gudalur Market',
    produceName: 'Cabbage',
    batchId: 'BT-000142',
  },
  {
    id: '6',
    code: 'MV-000933',
    type: 'SALE',
    quantityKg: -35,
    warehouseCity: 'Ooty',
    produceName: 'Beetroot',
    batchId: 'BT-000115',
  },
];

export interface StockLedgerScreenProps {
  onBack?: () => void;
  warehouseName?: string;
  onVerifyBatch?: (batch?: StockBatchItem) => void;
  onExportExcel?: () => void;
  onExportCsv?: () => void;
}

export function StockLedgerScreen({
  onBack,
  warehouseName = 'Ooty Warehouse',
  onVerifyBatch,
  onExportExcel,
  onExportCsv,
}: StockLedgerScreenProps) {
  const [entries, setEntries] = useState<LedgerEntryItem[]>(INITIAL_LEDGER_ENTRIES);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = () => {
    if (hasLoadedMore) {
      Alert.alert('End of Ledger', 'All recent entries for the active scope are loaded.');
      return;
    }
    setIsLoadingMore(true);
    setTimeout(() => {
      setEntries((prev) => [...prev, ...MORE_LEDGER_ENTRIES]);
      setHasLoadedMore(true);
      setIsLoadingMore(false);
    }, 400);
  };

  const handleExport = (format: 'Excel' | 'CSV') => {
    if (format === 'Excel') {
      if (onExportExcel) {
        onExportExcel();
      } else {
        Alert.alert(
          'Export Successful',
          `Stock ledger for ${warehouseName} exported as Excel (.xlsx) file.`,
          [{ text: 'OK' }]
        );
      }
    } else {
      if (onExportCsv) {
        onExportCsv();
      } else {
        Alert.alert(
          'Export Successful',
          `Stock ledger for ${warehouseName} exported as CSV (.csv) file.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Header Banner (Brand Terracotta Orange #F0562A) ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.backBtn}
              accessibilityLabel="Back"
            >
              <ArrowBackWhiteIcon size={22} />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Stock Ledger</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Append-only · server-side filtered & paginated
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Ground-Truth Notice Banner ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            The ledger can exceed 10,000 rows — filtering and pagination always happen server-side, never a full fetch filtered in the browser.
          </Text>
        </View>

        {/* ─── Ledger Rows List (Exact match to M3-07 Screenshots) ─── */}
        <View style={styles.ledgerList}>
          {entries.map((item) => {
            const isPositive = item.quantityKg > 0;
            const sign = isPositive ? '+' : '';
            const qtyText = `${sign}${item.quantityKg} KG`;

            return (
              <View key={item.id} style={styles.ledgerCard}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.ledgerCodeType}>
                    {item.code} · {item.type}
                  </Text>
                  <Text
                    style={[
                      styles.ledgerQty,
                      isPositive ? styles.qtyPositive : styles.qtyNegative,
                    ]}
                  >
                    {qtyText}
                  </Text>
                </View>

                <Text style={styles.ledgerMeta}>
                  {item.warehouseCity} · {item.produceName} · {item.batchId}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ─── Load More Button (48px tall, card style) ─── */}
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={handleLoadMore}
          activeOpacity={0.75}
        >
          <Text style={styles.loadMoreText}>
            {isLoadingMore ? 'Loading entries...' : 'Load More'}
          </Text>
        </TouchableOpacity>

        {/* ─── Export Ledger Button (48px tall, brand orange outline) ─── */}
        <TouchableOpacity
          style={[styles.exportLedgerBtn, showExportPanel && styles.exportLedgerBtnActive]}
          onPress={() => setShowExportPanel((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.exportLedgerText}>Export Ledger</Text>
        </TouchableOpacity>

        {/* ─── Expandable Ledger Export Panel (Exact match to Image 3) ─── */}
        {showExportPanel && (
          <View style={styles.exportPanelCard}>
            {/* Panel Title */}
            <View style={styles.exportPanelHeaderRow}>
              <DownloadTrayIcon size={18} color={PALETTE.textInk} />
              <Text style={styles.exportPanelTitle}>Ledger Export</Text>
            </View>

            {/* Disclaimer / Note inside export card */}
            <View style={styles.exportNoteBox}>
              <Text style={styles.exportNoteText}>
                Export applies the same server-side filters and warehouse scope currently active — never a full unfiltered ledger dump.
              </Text>
            </View>

            {/* Action Buttons: Excel & CSV */}
            <View style={styles.exportButtonsRow}>
              <TouchableOpacity
                style={styles.formatBtn}
                onPress={() => handleExport('Excel')}
                activeOpacity={0.8}
              >
                <Text style={styles.formatBtnText}>Excel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.formatBtn}
                onPress={() => handleExport('CSV')}
                activeOpacity={0.8}
              >
                <Text style={styles.formatBtnText}>CSV</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles matching Design System PDF ─────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 10,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 19, // 19px / 800 per PDF Page 2
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 4,
    marginLeft: 32,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // ─── Top Notice Box ───
  noticeBox: {
    backgroundColor: PALETTE.orangeTint,
    borderRadius: 14, // LG 14px
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.orangeDeep,
    lineHeight: 18,
  },

  // ─── Ledger Card Rows ───
  ledgerList: {
    marginBottom: 14,
  },
  ledgerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px per Design System
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ledgerCodeType: {
    fontSize: 13.5,
    fontWeight: '800', // 800 weight per Design System PDF
    color: PALETTE.textInk,
    letterSpacing: -0.1,
  },
  ledgerQty: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  qtyPositive: {
    color: PALETTE.success, // #16A34A / #173404
  },
  qtyNegative: {
    color: PALETTE.danger, // #E24B4A
  },
  ledgerMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },

  // ─── Load More Button (48px tall) ───
  loadMoreBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 48, // 48px tall mobile action per PDF Page 3
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Export Ledger Button (48px tall, Brand Orange Border) ───
  exportLedgerBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px
    borderWidth: 1.5,
    borderColor: PALETTE.primary, // Brand Orange border matching screenshot
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  exportLedgerBtnActive: {
    backgroundColor: PALETTE.orangeTint,
  },
  exportLedgerText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.orangeDeep, // Orange Deep #7A2E14
  },

  // ─── Expandable Ledger Export Panel (Image 3) ───
  exportPanelCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  exportPanelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportPanelTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  exportNoteBox: {
    backgroundColor: PALETTE.orangeTint,
    borderRadius: 10, // SM 10px
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  exportNoteText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.orangeDeep,
    lineHeight: 16,
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  formatBtn: {
    flex: 1,
    height: 44, // MD button
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12, // MD 12px
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
});
