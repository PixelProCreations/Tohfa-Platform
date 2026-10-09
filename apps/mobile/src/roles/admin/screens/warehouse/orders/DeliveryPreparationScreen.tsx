/**
 * Delivery Preparation — final checks on a packed order before dispatch.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Prepare for Dispatch" leads to the dispatch flow: `order.dispatch`.
 *   - The delivery slot is shown read-only: `order.delivery_slot.select` is
 *     `none` for both warehouse admin roles, so there is no slot picker here.
 *   - The delivery checklist ticks have no rbac code; they are local UI state
 *     and stay ungated.
 */
// Design id: M5S13 (M5S13_DeliveryPreparation)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
  adminShadow,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import type { OrderScreenBaseProps } from './types';

// No screen-specific props yet. A type alias, because an empty interface fails
// @typescript-eslint/no-empty-object-type; widen to an interface when props arrive.
export type DeliveryPreparationScreenProps = OrderScreenBaseProps;

// Mock data until the order API is wired.
const MOCK_CONFIGURED_ADDRESS = 'Divya K., Ooty Road';
const MOCK_DELIVERY_DATE = '25 Sep 2026';
// Slot codes come from configuration/API; this is the mock order's slot.
const MOCK_DELIVERY_SLOT = 'AFTERNOON_12_4';

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
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke={adminColors.onBrand}
          strokeWidth="3"
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
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
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

export function DeliveryPreparationScreen({
  can,
  onBack,
  onNavigate,
  orderId = 'ORD-1021',
}: DeliveryPreparationScreenProps) {
  const canDispatch = can('order.dispatch');
  const [checklist, setChecklist] = useState([
    { id: '1', title: 'Items verified', checked: true },
    { id: '2', title: 'Quantity verified', checked: true },
    { id: '3', title: 'Address verified', checked: true },
    { id: '4', title: 'Ready for dispatch', checked: false },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Preparation</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.orderIdLabel}>{orderId}</Text>
            <Text style={styles.configuredAddressText}>Configured address — {MOCK_CONFIGURED_ADDRESS}</Text>
            <View style={styles.dateBlock}>
              <Text style={styles.fieldLabel}>Delivery Date</Text>
              <Text style={styles.fieldValue}>{MOCK_DELIVERY_DATE}</Text>
            </View>
          </View>

          {/* Read-only: warehouse admins cannot change the slot (see header comment). */}
          <Text style={styles.sectionTitle}>Delivery Slot</Text>
          <View style={styles.slotsRow}>
            <View style={styles.slotPill}>
              <Text style={styles.slotPillText}>{MOCK_DELIVERY_SLOT}</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <InfoCircleIcon />
            <Text style={styles.infoText}>
              Slot codes are configuration/API-driven, not hard-coded into the design.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Packing Status</Text>
          <View style={styles.packingCard}>
            <GreenCheckboxIcon />
            <Text style={styles.packingCardText}>Stock Checked</Text>
          </View>
          <View style={[styles.packingCard, styles.packingCardSpaced]}>
            <GreenCheckboxIcon />
            <Text style={styles.packingCardText}>Packed</Text>
          </View>

          <Text style={styles.sectionTitle}>Delivery Checklist</Text>
          <View style={styles.checklistCard}>
            {checklist.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.checklistItem, index < checklist.length - 1 && styles.checklistItemBorder]}
                activeOpacity={0.75}
                onPress={() => toggleCheck(item.id)}
              >
                {item.checked ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{item.title}</Text>
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
              onPress={() => onNavigate?.('M5S14', { orderId })}
            >
              <DeliveryTruckIcon />
              <Text style={styles.dispatchBtnText}>Prepare for Dispatch</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// Checkbox square: an icon size, not spacing.
const CHECKBOX_SIZE = 22;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: adminSpacing.lg, paddingTop: 14, paddingBottom: 20 },
  scrollTail: { height: adminSpacing.xl },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 20,
    paddingVertical: adminSpacing.lg,
    ...adminShadow.sm,
  },
  orderIdLabel: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.muted, marginBottom: adminSpacing.xs },
  configuredAddressText: { fontSize: 13.5, fontWeight: '700', color: adminColors.ink, lineHeight: 19 },
  dateBlock: { marginTop: adminSpacing.md },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  fieldValue: { fontSize: 14, fontWeight: '700', color: adminColors.ink },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: 14 },
  // Styled as the old "selected" pill: the one slot the order has.
  slotPill: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  slotPillText: { fontSize: 11.5, fontWeight: '700', color: adminColors.brand },
  infoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  infoText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: adminColors.info.text, lineHeight: 16 },
  packingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  packingCardSpaced: { marginTop: 10 },
  packingCardText: { fontSize: 13.5, fontWeight: '700', color: adminColors.ink },
  checklistCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 13,
  },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: adminColors.border },
  greenCheckbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: 5,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  emptyCheckbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    marginRight: adminSpacing.md,
  },
  checklistText: { fontSize: 13.5, fontWeight: '700', color: adminColors.ink },
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  dispatchBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.md,
  },
  dispatchBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
});
