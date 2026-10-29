/**
 * Order Issue — reporting an issue against an order is not available yet.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
} from '../../../theme';
import { t } from '../../../i18n';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getAdminOrder } from '../../../api/orders';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import type { OrderIssueStep, OrderScreenBaseProps } from './types';

export interface OrderIssueScreenProps extends OrderScreenBaseProps {
  initialStep?: OrderIssueStep | undefined;
  issueId?: string | undefined;
  onViewIssue?: (() => void) | undefined;
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

export function OrderIssueScreen({
  onBack,
  orderId,
}: OrderIssueScreenProps) {
  const orderQuery = useAdminQuery(
    adminKeys.detail('orders', orderId ?? ''),
    (signal) => getAdminOrder(orderId!, signal),
    { enabled: !!orderId },
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title="Order Issue" onBack={onBack} />

        {orderId ? (
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitleText}>{orderId}</Text>
          </View>
        ) : null}

        {orderQuery.isLoading ? (
          <AdminLoadingState />
        ) : orderQuery.error ? (
          <AdminErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            <View style={styles.noticeCard}>
              <Text style={styles.noticeText}>{t('orders.issue.unavailable.body')}</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
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
  contentContainer: { padding: adminSpacing.lg },
  noticeCard: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    padding: adminSpacing.lg,
  },
  noticeText: {
    ...adminType.body,
    color: adminColors.info.text,
    textAlign: 'center',
  },
});
