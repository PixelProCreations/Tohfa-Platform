import React, { useState, useRef } from 'react';
import {
  Alert,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

interface PreviewReportsScreenProps {
  onBack: () => void;
  onDownload?: () => void;
  reportData?: {
    reportName?: string;
    category?: string;
    period?: string;
    warehouse?: string;
    format?: string;
  };
}

interface ExpenseRow {
  id: string;
  date: string;
  category: string;
  description: string;
  warehouse: string;
  vendor: string;
  amount: string;
  paymentMethod: string;
  status: 'Paid' | 'Unpaid';
  createdBy: string;
}

const PREVIEW_ROWS: ExpenseRow[] = [
  {
    id: 'EXP-0010',
    date: '2026-10-12',
    category: 'Operational category 1 (demo)',
    description: 'Demo expense description 10',
    warehouse: 'Koonoor',
    vendor: 'Demo vendor A',
    amount: '₹880.00',
    paymentMethod: 'Cash',
    status: 'Paid',
    createdBy: 'Demo Main Warehouse Admin',
  },
  {
    id: 'EXP-0001',
    date: '2026-10-11',
    category: 'Operational category 1 (demo)',
    description: 'Demo expense description 1',
    warehouse: 'Ooty',
    vendor: 'Demo vendor B',
    amount: '₹4,500.00',
    paymentMethod: 'Cash',
    status: 'Paid',
    createdBy: 'Demo Main Warehouse Admin',
  },
  {
    id: 'EXP-0002',
    date: '2026-10-09',
    category: 'Operational category 2 (demo)',
    description: 'Demo expense description 2',
    warehouse: 'Coonoor',
    vendor: 'Demo vendor B',
    amount: '₹2,850.00',
    paymentMethod: 'UPI',
    status: 'Paid',
    createdBy: 'Demo Sub Warehouse Admin',
  },
  {
    id: 'EXP-0009',
    date: '2026-10-08',
    category: 'Operational category 3 (demo)',
    description: 'Demo expense description 9',
    warehouse: 'Coonoor',
    vendor: 'Demo vendor F',
    amount: '₹1,240.00',
    paymentMethod: 'Cash',
    status: 'Paid',
    createdBy: 'Demo Sub Warehouse Admin',
  },
  {
    id: 'EXP-0003',
    date: '2026-10-05',
    category: 'Operational category 3 (demo)',
    description: 'Demo expense description 3',
    warehouse: 'Kotagiri',
    vendor: 'Demo vendor C',
    amount: '₹3,200.00',
    paymentMethod: 'Bank Transfer',
    status: 'Unpaid',
    createdBy: 'Demo TOHFA Admin',
  },
];

export function PreviewReportsScreen({ onBack, onDownload, reportData }: PreviewReportsScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Filter pills horizontal scrolling state
  const pillsScrollRef = useRef<ScrollView>(null);
  const [pillsScrollX, setPillsScrollX] = useState(0);
  const [pillsContentWidth, setPillsContentWidth] = useState(650);
  const [pillsVisibleWidth, setPillsVisibleWidth] = useState(360);
  const [pillsTrackWidth, setPillsTrackWidth] = useState(280);

  const maxPillsScroll = Math.max(1, pillsContentWidth - pillsVisibleWidth);
  const pillsThumbWidth =
    pillsContentWidth > pillsVisibleWidth && pillsVisibleWidth > 0 && pillsTrackWidth > 0
      ? Math.max(36, (pillsVisibleWidth / pillsContentWidth) * pillsTrackWidth)
      : pillsTrackWidth * 0.45;
  const maxPillsThumbTravel = Math.max(0, pillsTrackWidth - pillsThumbWidth);
  const pillsThumbOffset =
    maxPillsScroll > 0 && maxPillsThumbTravel > 0
      ? Math.min(maxPillsThumbTravel, Math.max(0, (pillsScrollX / maxPillsScroll) * maxPillsThumbTravel))
      : 0;

  const handlePillsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPillsScrollX(e.nativeEvent.contentOffset.x);
  };

  const handlePillsScrollStep = (direction: 'left' | 'right') => {
    const step = 150;
    const targetX =
      direction === 'left'
        ? Math.max(0, pillsScrollX - step)
        : Math.min(maxPillsScroll, pillsScrollX + step);
    pillsScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const handlePillsTrackPress = (e: GestureResponderEvent) => {
    if (pillsTrackWidth <= 0 || maxPillsScroll <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, clickX / pillsTrackWidth));
    const targetX = ratio * maxPillsScroll;
    pillsScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  // Table horizontal scrolling state
  const tableScrollRef = useRef<ScrollView>(null);
  const [tableScrollX, setTableScrollX] = useState(0);
  const [tableContentWidth, setTableContentWidth] = useState(1470);
  const [tableVisibleWidth, setTableVisibleWidth] = useState(360);
  const [tableTrackWidth, setTableTrackWidth] = useState(280);

  const maxTableScroll = Math.max(1, tableContentWidth - tableVisibleWidth);
  const tableThumbWidth =
    tableContentWidth > tableVisibleWidth && tableVisibleWidth > 0 && tableTrackWidth > 0
      ? Math.max(40, (tableVisibleWidth / tableContentWidth) * tableTrackWidth)
      : 60;
  const maxTableThumbTravel = Math.max(0, tableTrackWidth - tableThumbWidth);
  const tableThumbOffset =
    maxTableScroll > 0 && maxTableThumbTravel > 0
      ? Math.min(maxTableThumbTravel, Math.max(0, (tableScrollX / maxTableScroll) * maxTableThumbTravel))
      : 0;

  const handleTableScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setTableScrollX(e.nativeEvent.contentOffset.x);
  };

  const handleTableScrollStep = (direction: 'left' | 'right') => {
    const step = 260;
    const targetX =
      direction === 'left'
        ? Math.max(0, tableScrollX - step)
        : Math.min(maxTableScroll, tableScrollX + step);
    tableScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const handleTableTrackPress = (e: GestureResponderEvent) => {
    if (tableTrackWidth <= 0 || maxTableScroll <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, clickX / tableTrackWidth));
    const targetX = ratio * maxTableScroll;
    tableScrollRef.current?.scrollTo({ x: targetX, animated: true });
  };

  const reportName = reportData?.reportName ?? 'Expenses export (again) (again)';
  const category = reportData?.category ?? 'Expenses';
  const period = reportData?.period ?? '1 Oct 2026 to 14 Oct 2026';
  const warehouseScope = reportData?.warehouse ?? 'All warehouses';
  const format = reportData?.format ?? 'XLSX';

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      Alert.alert(
        'Download Report',
        `Report "${reportName}" (${format}) has been downloaded successfully.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRowAction = (action: 'view' | 'edit' | 'delete', row: ExpenseRow) => {
    Alert.alert(
      `${action.toUpperCase()} Expense`,
      `${action === 'view' ? 'Viewing' : action === 'edit' ? 'Editing' : 'Deleting'} expense record ${row.id} (${row.amount}).`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={adminColors.onBrand}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview Reports</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Report</Text>
            <Text style={styles.summaryValue}>{reportName}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Category</Text>
            <Text style={styles.summaryValue}>{category}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Reporting period</Text>
            <Text style={styles.summaryValue}>{period}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Warehouse scope</Text>
            <Text style={styles.summaryValue}>{warehouseScope}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Format</Text>
            <Text style={styles.summaryValue}>{format}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRowColumn}>
            <Text style={styles.summaryLabel}>Columns</Text>
            <Text style={[styles.summaryValue, styles.columnsValue]}>
              Expense ID, Expense Date, Expense Category, Description, Warehouse, Vendor / Payee, Amount, Payment Method, Payment Status, Created By
            </Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Filters</Text>
            <Text style={styles.summaryValue}>None</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Rows in the preview</Text>
            <Text style={styles.summaryValue}>5 of 5</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Preview</Text>
            <Text style={styles.summaryValue}>Complete</Text>
          </View>
        </View>

        {/* Filter Pills Row */}
        <ScrollView
          ref={pillsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handlePillsScroll}
          onContentSizeChange={(w) => setPillsContentWidth(w)}
          onLayout={(e) => setPillsVisibleWidth(e.nativeEvent.layout.width)}
          style={styles.filterPillsScroll}
          contentContainerStyle={styles.filterPillsContent}
        >
          {['Date Range', 'Warehouse', 'Category', 'Payment Method', 'Payment Status'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, selectedFilter === f && styles.filterPillActive]}
              onPress={() => setSelectedFilter(selectedFilter === f ? null : f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, selectedFilter === f && styles.filterPillTextActive]}>{f}</Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M6 9l6 6 6-6" stroke={adminColors.brandDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Top Interactive Scrollbar for Filter Dropdown Buttons */}
        <View style={styles.scrollIndicatorRow}>
          <TouchableOpacity
            style={styles.scrollArrowBtn}
            onPress={() => handlePillsScrollStep('left')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Scroll filters left"
          >
            <Text style={styles.scrollIndicatorArrow}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scrollIndicatorTrack}
            onPress={handlePillsTrackPress}
            activeOpacity={0.9}
            onLayout={(e) => setPillsTrackWidth(e.nativeEvent.layout.width)}
            accessibilityLabel="Horizontal filters scrollbar track"
          >
            <View
              style={[
                styles.scrollIndicatorThumb,
                {
                  width: pillsThumbWidth,
                  transform: [{ translateX: pillsThumbOffset }],
                },
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scrollArrowBtn}
            onPress={() => handlePillsScrollStep('right')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Scroll filters right"
          >
            <Text style={styles.scrollIndicatorArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Table for All Content */}
        <View
          style={styles.tableCard}
          onLayout={(e) => setTableVisibleWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={tableScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            persistentScrollbar={false}
            scrollEventThrottle={16}
            onScroll={handleTableScroll}
            onContentSizeChange={(w) => setTableContentWidth(w)}
          >
            <View>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.cell, { width: 100 }]}><Text style={styles.headerCellText}>Expense ID</Text></View>
                <View style={[styles.cell, { width: 120 }]}><Text style={styles.headerCellText}>Expense Date ↓</Text></View>
                <View style={[styles.cell, { width: 190 }]}><Text style={styles.headerCellText}>Category</Text></View>
                <View style={[styles.cell, { width: 210 }]}><Text style={styles.headerCellText}>Description</Text></View>
                <View style={[styles.cell, { width: 110 }]}><Text style={styles.headerCellText}>Warehouse</Text></View>
                <View style={[styles.cell, { width: 130 }]}><Text style={styles.headerCellText}>Vendor / Payee</Text></View>
                <View style={[styles.cell, { width: 100 }]}><Text style={styles.headerCellText}>Amount ⇅</Text></View>
                <View style={[styles.cell, { width: 130 }]}><Text style={styles.headerCellText}>Payment Method</Text></View>
                <View style={[styles.cell, { width: 90 }]}><Text style={styles.headerCellText}>Status</Text></View>
                <View style={[styles.cell, { width: 190 }]}><Text style={styles.headerCellText}>Created By</Text></View>
                <View style={[styles.cell, { width: 100 }]}><Text style={styles.headerCellText}>Actions</Text></View>
              </View>

              {/* Table Rows */}
              {PREVIEW_ROWS.map((row, idx) => {
                const isPaid = row.status === 'Paid';
                return (
                  <View key={row.id} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}>
                    <View style={[styles.cell, { width: 100 }]}><Text style={styles.dataCellText}>{row.id}</Text></View>
                    <View style={[styles.cell, { width: 120 }]}><Text style={styles.dataCellText}>{row.date}</Text></View>
                    <View style={[styles.cell, { width: 190 }]}><Text style={styles.dataCellText} numberOfLines={1}>{row.category}</Text></View>
                    <View style={[styles.cell, { width: 210 }]}><Text style={styles.dataCellText} numberOfLines={1}>{row.description}</Text></View>
                    <View style={[styles.cell, { width: 110 }]}><Text style={styles.dataCellText}>{row.warehouse}</Text></View>
                    <View style={[styles.cell, { width: 130 }]}><Text style={styles.dataCellText}>{row.vendor}</Text></View>
                    <View style={[styles.cell, { width: 100 }]}><Text style={[styles.dataCellText, styles.amountCellText]}>{row.amount}</Text></View>
                    <View style={[styles.cell, { width: 130 }]}><Text style={styles.dataCellText}>{row.paymentMethod}</Text></View>
                    <View style={[styles.cell, { width: 90 }]}>
                      <View style={[styles.tableStatusBadge, isPaid ? styles.tableStatusPaid : styles.tableStatusUnpaid]}>
                        <Text style={[styles.tableStatusText, isPaid ? styles.tableStatusPaidText : styles.tableStatusUnpaidText]}>
                          {row.status}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.cell, { width: 190 }]}><Text style={styles.dataCellText} numberOfLines={1}>{row.createdBy}</Text></View>
                    <View style={[styles.cell, { width: 100 }, styles.actionsCell]}>
                      <TouchableOpacity onPress={() => handleRowAction('view', row)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={adminColors.brandDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke={adminColors.brandDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRowAction('edit', row)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={adminColors.brandDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={adminColors.brandDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRowAction('delete', row)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Horizontal Scrollbar Under the Table */}
        <View style={styles.tableScrollIndicatorRow}>
          <TouchableOpacity
            style={styles.scrollArrowBtn}
            onPress={() => handleTableScrollStep('left')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Scroll table left"
          >
            <Text style={styles.scrollIndicatorArrow}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scrollIndicatorTrack}
            onPress={handleTableTrackPress}
            activeOpacity={0.9}
            onLayout={(e) => setTableTrackWidth(e.nativeEvent.layout.width)}
            accessibilityLabel="Horizontal table scrollbar track"
          >
            <View
              style={[
                styles.scrollIndicatorThumb,
                {
                  width: tableThumbWidth,
                  transform: [{ translateX: tableThumbOffset }],
                },
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scrollArrowBtn}
            onPress={() => handleTableScrollStep('right')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Scroll table right"
          >
            <Text style={styles.scrollIndicatorArrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* Pagination bar */}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationText}>1–5 of 5 · <Text style={styles.paginationUnderline}>Rows per page: 5</Text></Text>
          <View style={styles.paginationArrows}>
            <Text style={styles.paginationArrowDisabled}>‹</Text>
            <Text style={styles.paginationArrowDisabled}>›</Text>
          </View>
        </View>

        {/* Total Amount Box */}
        <View style={styles.totalAmountCard}>
          <Text style={styles.totalAmountLabel}>Total Amount</Text>
          <Text style={styles.totalAmountValue}>₹11,670.00</Text>
        </View>
        <Text style={styles.totalAmountNote}>
          Totals are summed from the full result, not just the preview rows.
        </Text>

        {/* Download Report Button */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Download report"
        >
          <Text style={styles.downloadBtnText}>Download report</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryRowColumn: {
    paddingVertical: 7,
  },
  summaryLabel: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'right',
  },
  columnsValue: {
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
    color: adminColors.ink,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 2,
  },
  filterPillsScroll: {
    marginBottom: adminSpacing.sm,
  },
  filterPillsContent: {
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterPillActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  filterPillTextActive: {
    color: adminColors.brandDeep,
  },
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  scrollArrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  scrollIndicatorArrow: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  scrollIndicatorTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5DFD7',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  scrollIndicatorThumb: {
    height: '100%',
    backgroundColor: adminColors.brand,
    borderRadius: 5,
  },
  tableScrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: adminSpacing.md,
    paddingHorizontal: 2,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: adminColors.brandTint,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingVertical: 10,
  },
  headerCellText: {
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableDataRowAlt: {
    backgroundColor: '#FAF7F2',
  },
  cell: {
    paddingHorizontal: 10,
  },
  dataCellText: {
    fontSize: 12,
    color: adminColors.ink,
  },
  amountCellText: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  tableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  tableStatusPaid: {
    backgroundColor: adminColors.success.bg,
  },
  tableStatusUnpaid: {
    backgroundColor: adminColors.danger.bg,
  },
  tableStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableStatusPaidText: {
    color: adminColors.success.text,
  },
  tableStatusUnpaidText: {
    color: adminColors.danger.text,
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: adminSpacing.md,
  },
  paginationText: {
    fontSize: 12,
    color: adminColors.muted,
  },
  paginationUnderline: {
    textDecorationLine: 'underline',
  },
  paginationArrows: {
    flexDirection: 'row',
    gap: 12,
  },
  paginationArrowDisabled: {
    fontSize: 16,
    color: adminColors.border,
  },
  totalAmountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 6,
    ...adminShadow.sm,
  },
  totalAmountLabel: {
    fontSize: 14,
    color: adminColors.ink,
    fontWeight: '700',
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  totalAmountNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
  },
  downloadBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xl,
    ...adminShadow.sm,
  },
  downloadBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
