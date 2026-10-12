/**
 * Order Status History — the read-only timeline of an order's status events.
 *
 * Tapping an event expands its detail in place (event, date, time, performed
 * by, reference). That detail used to be a separate route (M5S15B Event
 * Detail); folding it in removes a navigation hop for four fields.
 *
 * Gates: none. Read-only; the server scopes which orders the viewer can see.
 *
 * Live data (API integration plan, phase 5): the timeline is the order
 * detail's `timeline` (GET /admin/orders/{orderId}), oldest first, status
 * changes only. The API sends no actor and no note (free text can name a
 * farmer, BR-99), so "Performed By" is not shown.
 */
// Design id: M5S15 (M5S15_OrderStatusHistory), absorbs M5S15B (M5S15B_EventDetail)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps, OrderTimelineEntry } from './types';

export interface OrderStatusHistoryScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function TimelineNode() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={adminColors.success.text} strokeWidth="2" fill={adminColors.card} />
      <Circle cx="12" cy="12" r="4.5" fill={adminColors.success.text} />
    </Svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
        stroke={adminColors.muted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Event detail (folded M5S15B) ────────────────────────────────────────────

function EventDetailCard({ event, orderNumber }: { event: OrderTimelineEntry; orderNumber: string }) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.twoColRow}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Event</Text>
          <Text style={styles.fieldValue}>{event.label}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Date</Text>
          <Text style={styles.fieldValue}>{event.dayLabel}</Text>
        </View>
      </View>

      <View style={[styles.twoColRow, styles.detailRowGap]}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Time</Text>
          <Text style={styles.fieldValue}>{event.atLabel}</Text>
        </View>
      </View>

      <View style={styles.detailRowGap}>
        <Text style={styles.fieldLabel}>Reference</Text>
        <Text style={styles.fieldValue}>{orderNumber}</Text>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function OrderStatusHistoryScreen({
  order,
  onBack,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: OrderStatusHistoryScreenProps) {
  // One event open at a time keeps the timeline scannable.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });
  const events = order?.timeline ?? [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <SafeAreaView style={styles.topSafeArea} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Status History</Text>
        </View>

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : order === undefined ? (
          <AdminEmptyState title={t('orders.empty.notFound')} />
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
              ) : undefined
            }
          >
            <Text style={styles.orderRefLabel}>{order.orderNumber}</Text>

            {events.length === 0 ? <AdminEmptyState title={t('orders.empty.timeline')} /> : null}
            <View style={styles.timelineContainer}>
              {events.map((event, index) => {
                const isLast = index === events.length - 1;
                const isOpen = expandedId === event.key;
                return (
                  <View key={event.key} style={styles.stepRow}>
                    <View style={styles.indicatorCol}>
                      <TimelineNode />
                      {!isLast && <View style={styles.verticalLine} />}
                    </View>

                    <View style={styles.textCol}>
                      <TouchableOpacity
                        style={styles.stepHeader}
                        activeOpacity={0.7}
                        onPress={() => setExpandedId(isOpen ? null : event.key)}
                      >
                        <View style={styles.stepTextWrap}>
                          <Text style={styles.stepTitle}>{event.label} ✓</Text>
                          <Text style={styles.stepTime}>{event.atLabel}</Text>
                        </View>
                        <ChevronIcon open={isOpen} />
                      </TouchableOpacity>
                      {isOpen ? <EventDetailCard event={event} orderNumber={order.orderNumber} /> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  topSafeArea: { flex: 0, backgroundColor: adminColors.brand },
  safeArea: { flex: 1, backgroundColor: adminColors.canvas },
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
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xxxl },
  orderRefLabel: {
    ...adminType.rowTitle,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
    paddingLeft: adminSpacing.xs,
  },
  timelineContainer: { marginBottom: 20 },
  stepRow: { flexDirection: 'row', minHeight: 52 },
  indicatorCol: { width: 28, alignItems: 'center' },
  verticalLine: { width: 1.5, flex: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.xs },
  textCol: { flex: 1, paddingLeft: adminSpacing.md, paddingBottom: adminSpacing.lg },
  stepHeader: { flexDirection: 'row', alignItems: 'center' },
  stepTextWrap: { flex: 1 },
  stepTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: 2 },
  stepTime: { ...adminType.rowMeta, color: adminColors.muted },
  // Folded M5S15B event detail card
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
    ...adminShadow.sm,
  },
  detailRowGap: { marginTop: adminSpacing.lg },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink },
});
