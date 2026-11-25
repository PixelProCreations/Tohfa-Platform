import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { BackChevronIcon } from './SalesChannelOverviewScreen';
import { useChannelOrders } from '../warehouse/sales-direct/useSalesData';
import { AdminEmptyState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { formatPaise } from '../../money/paise';

function DocInvoiceIcon({ color = adminColors.ink, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface B2BAccount {
  id: string;
  name: string;
  gstin: string;
  latestOrder: string;
  orderValue: string;
  gstStatus: string;
}

export interface SalesB2BOrdersScreenProps {
  onBack?: () => void;
  onOpenInvoice?: (acc: B2BAccount) => void;
  accounts?: B2BAccount[];
}

export function SalesB2BOrdersScreen({ onBack, onOpenInvoice, accounts }: SalesB2BOrdersScreenProps) {
  const { items, isLoading } = useChannelOrders('B2B');

  const displayAccounts: B2BAccount[] = accounts ?? items.map((r) => ({
    id: r.id,
    name: r.businessName ?? ADMIN_NO_VALUE,
    gstin: ADMIN_NO_VALUE,
    latestOrder: `${r.orderNumber} · ${formatPaise(r.totalPaise)}`,
    orderValue: formatPaise(r.totalPaise),
    gstStatus: ADMIN_NO_VALUE,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevronIcon color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>B2B Bulk Orders</Text>
          <Text style={styles.screenSubtitle}>
            {t('wiringSales.b2b.subtitle', { shown: displayAccounts.length })}
          </Text>
        </View>

        {/* List */}
        {isLoading && displayAccounts.length === 0 ? (
          <AdminLoadingState label="Loading B2B orders..." />
        ) : displayAccounts.length === 0 ? (
          <AdminEmptyState title="No B2B Orders" subtitle="No bulk B2B orders found in the system." />
        ) : (
          <FlatList
            data={displayAccounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.b2bCard}>
                {/* Badge */}
                <View style={styles.badgeWrapper}>
                  <View style={styles.b2bBadge}>
                    <Text style={styles.b2bBadgeText}>B2B</Text>
                  </View>
                </View>

                {/* Title & GSTIN */}
                <Text style={styles.companyName}>{item.name}</Text>
                <Text style={styles.gstinText}>{item.gstin}</Text>

                {/* Order Info Rows */}
                <View style={styles.infoTable}>
                  <View style={styles.tableRow}>
                    <Text style={styles.rowLabel}>Latest bulk order</Text>
                    <Text style={styles.rowValue}>{item.latestOrder}</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.rowLabel}>Order value</Text>
                    <Text style={styles.rowValueBold}>{item.orderValue}</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.rowLabel}>GST invoice</Text>
                    <Text style={styles.rowValueSuccess}>{item.gstStatus}</Text>
                  </View>
                </View>

                {/* View / Generate GST Invoice Button */}
                <TouchableOpacity
                  style={styles.invoiceBtn}
                  onPress={() => onOpenInvoice?.(item)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <DocInvoiceIcon color={adminColors.ink} size={15} />
                  <Text style={styles.invoiceBtnText}>View / Generate GST Invoice</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  titleBlock: {
    marginBottom: adminSpacing.md,
  },
  screenTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: adminSpacing.xxl * 2,
  },
  b2bCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  badgeWrapper: {
    marginBottom: adminSpacing.sm,
  },
  b2bBadge: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: 3,
    borderRadius: adminRadius.xs,
  },
  b2bBadgeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.info.text,
  },
  companyName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 3,
  },
  gstinText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  infoTable: {
    marginBottom: adminSpacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  rowValue: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.ink,
  },
  rowValueBold: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  rowValueSuccess: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.success.text,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    gap: adminSpacing.xs,
  },
  invoiceBtnText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
});
