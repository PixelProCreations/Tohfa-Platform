/**
 * Cancel Order — shows order summary and honest unavailable state.
 *
 * No admin order-cancel endpoint exists in the API.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import { t } from '../../../i18n';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getAdminOrder } from '../../../api/orders';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { formatMoney } from './mappers';
import type { OrderScreenBaseProps } from './types';

export type CancelOrderStep = 'form' | 'confirm' | 'cancelled';

export interface CancelOrderScreenProps extends OrderScreenBaseProps {
  initialStep?: CancelOrderStep | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
        <BackArrowIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

export function CancelOrderScreen({
  onBack,
  orderId,
}: CancelOrderScreenProps) {
  const orderQuery = useAdminQuery(
    adminKeys.detail('orders', orderId ?? ''),
    (signal) => getAdminOrder(orderId!, signal),
    { enabled: !!orderId },
  );

  const customerName = orderQuery.data?.buyer?.name ?? '—';
  const totalAmount = formatMoney(orderQuery.data?.totals.total);

  if (!orderId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title={t('orders.cancel.unavailable.button')} onBack={onBack} />
          <View style={styles.centerContainer}>
            <Text style={{ ...adminType.body, color: adminColors.muted }}>No order selected</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title={t('orders.cancel.unavailable.button')} onBack={onBack} />

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        {orderQuery.isLoading ? (
          <AdminLoadingState />
        ) : orderQuery.error ? (
          <AdminErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />
        ) : (
          <>
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.card}>
                <View style={styles.twoColRow}>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>Customer</Text>
                    <Text style={styles.fieldValue}>{customerName}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.fieldLabel}>Total</Text>
                    <Text style={styles.fieldValue}>{totalAmount}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.noticeCard}>
                <Text style={styles.noticeText}>{t('orders.cancel.unavailable.body')}</Text>
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <View style={styles.disabledBtn}>
                <Text style={styles.disabledBtnText}>{t('orders.cancel.unavailable.button')}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: 14,
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  subtitleRow: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
  },
  subtitleText: { ...adminType.rowMeta, color: adminColors.brandTint },
  content: { flex: 1 },
  contentContainer: { padding: adminSpacing.lg, gap: adminSpacing.md },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.xs },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between', gap: adminSpacing.md },
  col: { flex: 1 },
  fieldLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: 2 },
  fieldValue: { ...adminType.rowTitle, color: adminColors.ink },
  noticeCard: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  noticeText: {
    ...adminType.body,
    color: adminColors.info.text,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.md,
  },
  disabledBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
});
