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
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminSpacing, adminType } from '../../theme';
import type { ExpenseManagementRecord } from './ExpenseManagementScreen';

export interface ExpenseRecordDetailScreenProps {
  expense: ExpenseManagementRecord;
  onBack: () => void;
}

export function ExpenseRecordDetailScreen({ expense, onBack }: ExpenseRecordDetailScreenProps) {
  const expenseCode = expense.expenseCode || 'EXP-0001';
  const category = expense.category || 'Operational category 1 (demo)';
  const dateStr = expense.dateStr || '11 Oct 2026';
  const description = expense.description || 'Demo expense description 1';
  const warehouse = expense.warehouse || 'Ooty';
  const reference = expense.reference || 'EXPREF-100';
  const payee = expense.payee || 'Demo vendor A';
  const amountFormatted = expense.amountFormatted || '₹4,500.00';
  const paymentMethod = expense.paymentMethod || 'Cash';
  const paymentStatus = expense.paymentStatus || 'Paid on 11 Oct 2026';
  const paymentRef = expense.paymentRef || 'EPAY-100';
  const createdBy = expense.createdBy || 'Demo Main Warehouse Admin, 11 Oct 2026, 11:00';
  const docName = expense.documentName;
  const docMeta = expense.documentMeta;

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
          <Text style={styles.headerTitle}>Expense {expenseCode}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1 · Expense details */}
        <Text style={styles.sectionHeading}>1 · Expense details</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Expense ID</Text>
            <Text style={styles.fieldValue}>{expenseCode}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Category</Text>
            <Text style={styles.fieldValue}>{category}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={styles.fieldValue}>{dateStr}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.fieldValue}>{description}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Warehouse</Text>
            <Text style={styles.fieldValue}>{warehouse}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Reference</Text>
            <Text style={styles.fieldValue}>{reference}</Text>
          </View>
        </View>

        {/* 2 · Payee & Payment details */}
        <Text style={styles.sectionHeading}>2 · Payee & Payment details</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payee</Text>
            <Text style={styles.fieldValue}>{payee}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <Text style={styles.fieldValue}>{amountFormatted} (INR)</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment method</Text>
            <Text style={styles.fieldValue}>{paymentMethod}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment status</Text>
            <Text style={[styles.fieldValue, { color: adminColors.success.text }]}>{paymentStatus}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment reference</Text>
            <Text style={styles.fieldValue}>{paymentRef}</Text>
          </View>
        </View>

        {/* 3 · Audit & Status */}
        <Text style={styles.sectionHeading}>3 · Audit & Status</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Created by</Text>
            <Text style={[styles.fieldValue, { maxWidth: '65%' }]}>{createdBy}</Text>
          </View>
          <View style={styles.dashedDivider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Status</Text>
            <Text style={styles.fieldValue}>Recorded</Text>
          </View>
        </View>

        {/* 4 · Supporting documents (shown if available) */}
        {Boolean(docName) && (
          <>
            <Text style={styles.sectionHeading}>4 · Supporting documents</Text>
            <View style={styles.card}>
              <View style={styles.docRow}>
                <View style={styles.docIconContainer}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                      stroke={adminColors.brand}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                      stroke={adminColors.brand}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <View style={styles.docTextGroup}>
                  <Text style={styles.docName}>{docName}</Text>
                  {Boolean(docMeta) && <Text style={styles.docMeta}>{docMeta}</Text>}
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: adminSpacing.xxl }} />
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
    color: adminColors.onBrand,
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
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'right',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 0.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 1,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  docIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextGroup: {
    flex: 1,
  },
  docName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docMeta: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
});
