import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { PreviewReportsScreen } from './PreviewReportsScreen';

interface CreateExportReportScreenProps {
  onBack: () => void;
  onPreview?: () => void;
}

export function CreateExportReportScreen({ onBack, onPreview }: CreateExportReportScreenProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [reportName, setReportName] = useState('Expenses export');
  const [reportDescription, setReportDescription] = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('This Month');
  const [warehouse, setWarehouse] = useState('All warehouses');
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['Paid', 'Unpaid']);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([
    'Cash',
    'UPI',
    'Card',
    'Bank transfer',
    'Wallet',
  ]);
  const [party, setParty] = useState('');
  const [referenceId, setReferenceId] = useState('');

  // Checklist items
  const [columns, setColumns] = useState<Record<string, boolean>>({
    'Expense ID': true,
    'Expense Date': true,
    'Expense Category': true,
    'Description': true,
    'Warehouse': true,
    'Vendor / Payee': true,
    'Amount': true,
    'Payment Method': true,
    'Payment Status': true,
    'Created By': true,
  });

  const [groupBy, setGroupBy] = useState('No grouping');
  const [sortBy, setSortBy] = useState('Date');
  const [order, setOrder] = useState('Newest or largest first');
  const [exportFormat, setExportFormat] = useState<'XLSX' | 'CSV' | 'PDF'>('XLSX');

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const togglePaymentMethod = (pm: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  };

  const toggleColumn = (key: string) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview();
    } else {
      setShowPreview(true);
    }
  };

  if (showPreview) {
    return (
      <PreviewReportsScreen
        onBack={() => setShowPreview(false)}
        reportData={{
          reportName,
          category: 'Expenses',
          period: reportingPeriod,
          warehouse,
          format: exportFormat,
        }}
      />
    );
  }

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
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Export</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Report information */}
        <Text style={styles.sectionHeading}>Report information</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Report name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            value={reportName}
            onChangeText={setReportName}
            placeholder="Report name"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Report category 🔒</Text>
          <View style={[styles.textInput, styles.lockedInput]}>
            <Text style={styles.lockedText}>Expenses</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Report description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={reportDescription}
            onChangeText={setReportDescription}
            multiline
            numberOfLines={3}
            placeholder=""
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Reporting period</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            activeOpacity={0.7}
            onPress={() => {
              const options = ['This Month', 'Last Month', 'Last 30 Days', 'Quarter to Date', 'Financial Year'];
              const next = options[(options.indexOf(reportingPeriod) + 1) % options.length] ?? 'This Month';
              setReportingPeriod(next);
            }}
          >
            <Text style={styles.dropdownText}>{reportingPeriod}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Periods use the India business timezone, weeks start on Monday, and quarters are calendar quarters (to confirm).
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Warehouse</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            activeOpacity={0.7}
            onPress={() => {
              const options = ['All warehouses', 'Ooty Warehouse', 'Coonoor Warehouse', 'Kotagiri Warehouse', 'Gudalur Market Warehouse'];
              const next = options[(options.indexOf(warehouse) + 1) % options.length] ?? 'All warehouses';
              setWarehouse(next);
            }}
          >
            <Text style={styles.dropdownText}>{warehouse}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Date field 🔒</Text>
          <View style={[styles.textInput, styles.lockedInput]}>
            <Text style={styles.lockedText}>Transaction date</Text>
          </View>
        </View>

        {/* Transaction status */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Transaction status</Text>
          <View style={styles.pillRow}>
            {['Paid', 'Unpaid'].map((st) => {
              const active = selectedStatus.includes(st);
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => toggleStatus(st)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{st}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Payment method</Text>
          <View style={styles.pillRow}>
            {['Cash', 'UPI', 'Card', 'Bank transfer'].map((pm) => {
              const active = selectedPaymentMethods.includes(pm);
              return (
                <TouchableOpacity
                  key={pm}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => togglePaymentMethod(pm)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{pm}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.pillRow, { marginTop: adminSpacing.xs }]}>
            {['Wallet'].map((pm) => {
              const active = selectedPaymentMethods.includes(pm);
              return (
                <TouchableOpacity
                  key={pm}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => togglePaymentMethod(pm)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{pm}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Party</Text>
          <TextInput
            style={styles.textInput}
            value={party}
            onChangeText={setParty}
            placeholder=""
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Reference ID</Text>
          <TextInput
            style={styles.textInput}
            value={referenceId}
            onChangeText={setReferenceId}
            placeholder=""
          />
        </View>

        {/* Section 2: Columns */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Columns</Text>
        <View style={styles.checklistContainer}>
          {Object.keys(columns).map((colName, index) => {
            const checked = columns[colName];
            return (
              <React.Fragment key={colName}>
                {index > 0 ? <View style={styles.checkDivider} /> : null}
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => toggleColumn(colName)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 6L9 17l-5-5"
                          stroke="#FFFFFF"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                  <Text style={styles.checkLabel}>{colName}</Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Section 3: Grouping and sorting */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Grouping and sorting</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Group by</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            activeOpacity={0.7}
            onPress={() => {
              const opts = ['No grouping', 'Category', 'Warehouse', 'Vendor'];
              const next = opts[(opts.indexOf(groupBy) + 1) % opts.length] ?? 'No grouping';
              setGroupBy(next);
            }}
          >
            <Text style={styles.dropdownText}>{groupBy}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Sort by</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            activeOpacity={0.7}
            onPress={() => {
              const opts = ['Date', 'Amount', 'Vendor', 'Expense ID'];
              const next = opts[(opts.indexOf(sortBy) + 1) % opts.length] ?? 'Date';
              setSortBy(next);
            }}
          >
            <Text style={styles.dropdownText}>{sortBy}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Order</Text>
          <TouchableOpacity
            style={styles.dropdownInput}
            activeOpacity={0.7}
            onPress={() => {
              const opts = ['Newest or largest first', 'Oldest or smallest first'];
              const next = opts[(opts.indexOf(order) + 1) % opts.length] ?? 'Newest or largest first';
              setOrder(next);
            }}
          >
            <Text style={styles.dropdownText}>{order}</Text>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Grouping and sorting change the presentation, never the underlying records.
          </Text>
        </View>

        {/* Section 4: Export format */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Export format</Text>
        <View style={styles.formatRow}>
          {(['XLSX', 'CSV', 'PDF'] as const).map((fmt) => {
            const active = exportFormat === fmt;
            return (
              <TouchableOpacity
                key={fmt}
                style={[styles.formatBtn, active && styles.formatBtnActive]}
                onPress={() => setExportFormat(fmt)}
                activeOpacity={0.75}
              >
                <Text style={[styles.formatBtnText, active && styles.formatBtnTextActive]}>{fmt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preview Button */}
        <TouchableOpacity
          style={styles.previewBtn}
          onPress={handlePreview}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Preview report"
        >
          <Text style={styles.previewBtnText}>Preview</Text>
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
    paddingTop: adminSpacing.sm, // 8px compact header
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
    color: '#FFFFFF',
    fontWeight: '700',
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
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  fieldGroup: {
    marginBottom: adminSpacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: adminColors.danger.text,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: adminColors.ink,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  lockedInput: {
    backgroundColor: '#EBE6DE',
    borderColor: adminColors.border,
    justifyContent: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: adminColors.muted,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: adminColors.ink,
  },
  helperText: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    lineHeight: 16,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  pillTextActive: {
    color: adminColors.brandDeep,
  },
  checklistContainer: {
    backgroundColor: 'transparent',
    marginBottom: adminSpacing.md,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  checkboxChecked: {
    backgroundColor: adminColors.brand,
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: adminSpacing.xl,
  },
  formatBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  formatBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  formatBtnTextActive: {
    color: adminColors.onBrand,
  },
  previewBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
    ...adminShadow.sm,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
