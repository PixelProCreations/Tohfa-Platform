/**
 * Delivery Preparation — final checks on a packed order before dispatch.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Prepare for Dispatch" leads to the dispatch flow: `order.dispatch`.
 *   - The delivery slot is shown read-only: `order.delivery_slot.select` is
 *     `none` for both warehouse admin roles, so there is no slot picker here.
 *   - The delivery checklist ticks have no rbac code; they are local UI state
 *     and stay ungated.
 *
 * Live data: the order number, delivery date and packed state are GET
 * /admin/orders/{orderId}. AdminOrderDetail carries no delivery address (BR-99
 * allow-list), so the address shows ADMIN_NO_VALUE. The order's delivery slot
 * is sent (fulfilment.deliverySlot) but OrderDetailView does not map it yet, so
 * no slot starts selected. Nothing records a stock check, so "Stock Checked"
 * starts unticked; the delivery checklist starts unticked too (local aid only).
 */
// Design id: M5S13 (M5S13_DeliveryPreparation)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { adminColors } from '../../../theme';
import { t, type TranslationKey } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps } from './types';

export interface DeliveryPreparationScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
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

function GreenCheckboxIcon() {
  return (
    <View style={styles.greenCheckbox}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke={adminColors.onBrand}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function EmptyCheckboxIcon() {
  return <View style={styles.emptyCheckbox} />;
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.warehouse.infoIcon} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.warehouse.infoIcon} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DeliveryTruckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={adminColors.onBrand} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={adminColors.onBrand} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={adminColors.onBrand} strokeWidth="2" />
    </Svg>
  );
}

const DELIVERY_SLOTS = ['MORNING_8_12', 'AFTERNOON_12_4', 'EVENING_4_8'] as const;

export function DeliveryPreparationScreen({
  can,
  onBack,
  onNavigate,
  order,
  isLoading = false,
  error,
  onRetry,
}: DeliveryPreparationScreenProps) {
  const canDispatch = can('order.dispatch');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<{ id: string; title: TranslationKey; checked: boolean }[]>([
    { id: '1', title: 'orders.deliveryPrep.check.items', checked: false },
    { id: '2', title: 'orders.deliveryPrep.check.quantity', checked: false },
    { id: '3', title: 'orders.deliveryPrep.check.address', checked: false },
    { id: '4', title: 'orders.deliveryPrep.check.ready', checked: false },
  ]);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  if (view !== 'ready' || order === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('orders.deliveryPrep.title')}</Text>
          </View>
          {view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={error} onRetry={onRetry} />
          ) : (
            <AdminEmptyState title={t('orders.empty.notFound')} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isPacked = order.packedLabel !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orders.deliveryPrep.title')}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.orderIdTop}>{order.orderNumber}</Text>

          <Text style={styles.sectionTitleFirst}>{t('orders.deliveryPrep.info')}</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('orders.deliveryPrep.address')}</Text>
            <Text style={styles.fieldValueBold}>{ADMIN_NO_VALUE}</Text>
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t('orders.deliveryPrep.date')}</Text>
            <Text style={styles.fieldValueBold}>{order.deliveryDateLabel ?? ADMIN_NO_VALUE}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('orders.deliveryPrep.slot')}</Text>
          <View style={styles.slotsRow}>
            {DELIVERY_SLOTS.map((slot) => {
              const isSelected = slot === selectedSlot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotPill, isSelected && styles.slotPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotPillText, isSelected && styles.slotPillTextActive]}>{slot}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <InfoCircleIcon />
            <Text style={styles.infoText}>{t('orders.deliveryPrep.slotNotice')}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('orders.deliveryPrep.packingStatus')}</Text>
          <View style={styles.packingCard}>
            <EmptyCheckboxIcon />
            <Text style={styles.packingCardText}>{t('orders.deliveryPrep.stockChecked')}</Text>
          </View>
          <View style={[styles.packingCard, styles.packingCardSpaced]}>
            {isPacked ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
            <Text style={styles.packingCardText}>{t('orders.deliveryPrep.packed')}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('orders.deliveryPrep.checklist')}</Text>
          <View style={styles.checklistCard}>
            {checklist.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.checklistItem, index < checklist.length - 1 && styles.checklistItemBorder]}
                activeOpacity={0.75}
                onPress={() => toggleCheck(item.id)}
              >
                {item.checked ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{t(item.title)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.scrollTail} />
        </ScrollView>

        {canDispatch ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.dispatchBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S14', { orderId: order.id })}
            >
              <DeliveryTruckIcon />
              <Text style={styles.dispatchBtnText}>{t('orders.deliveryPrep.prepareDispatch')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.warehouse.warmCanvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: adminColors.onBrand, letterSpacing: -0.3 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  scrollTail: { height: 20 },
  orderIdTop: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.warehouse.warmSubtitle,
    paddingLeft: 34,
    marginBottom: 10,
  },
  sectionTitleFirst: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.warehouse.slateText,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.warehouse.slateText,
    marginTop: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.warehouse.slateCardBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: { fontSize: 13, color: adminColors.platform.slate500, marginBottom: 4 },
  fieldValueBold: { fontSize: 15, fontWeight: '700', color: adminColors.warehouse.slateText, lineHeight: 20 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  slotPill: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.warehouse.slateCardBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  slotPillActive: {
    backgroundColor: adminColors.warehouse.slotActiveBg,
    borderWidth: 1.5,
    borderColor: adminColors.warehouse.slotActiveBorder,
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.warehouse.slateSubtext,
  },
  slotPillTextActive: {
    color: adminColors.warehouse.slotActiveText,
  },
  infoBox: {
    backgroundColor: adminColors.platform.infoLight,
    borderWidth: 1,
    borderColor: adminColors.warehouse.infoBorder,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '600', color: adminColors.warehouse.infoText, lineHeight: 18 },
  packingCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.warehouse.slateCardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packingCardSpaced: { marginTop: 10 },
  packingCardText: { fontSize: 15, fontWeight: '700', color: adminColors.warehouse.slateText },
  checklistCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.warehouse.slateCardBorder,
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: adminColors.warehouse.slateDivider },
  greenCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: adminColors.warehouse.checkGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: adminColors.warehouse.slateBorder,
    backgroundColor: adminColors.card,
  },
  checklistText: { fontSize: 15, fontWeight: '700', color: adminColors.warehouse.slateText },
  bottomBar: {
    backgroundColor: adminColors.warehouse.warmCanvas,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.warehouse.footerBorder,
  },
  dispatchBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dispatchBtnText: { fontSize: 16, fontWeight: '700', color: adminColors.onBrand },
});
