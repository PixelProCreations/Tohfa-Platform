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

import { adminColors } from '../../../theme';
import { SAMPLE_DELIVERY_ORDER_ID, SAMPLE_DELIVERY_PREP } from './fixtures';
import type { OrderScreenBaseProps } from './types';

// No screen-specific props yet. A type alias, because an empty interface fails
// @typescript-eslint/no-empty-object-type; widen to an interface when props arrive.
export type DeliveryPreparationScreenProps = OrderScreenBaseProps;

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
          stroke="#FFFFFF"
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
      <Circle cx="12" cy="12" r="10" stroke="#0284C7" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DeliveryTruckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
    </Svg>
  );
}

const DELIVERY_SLOTS = ['MORNING_8_12', 'AFTERNOON_12_4', 'EVENING_4_8'] as const;

export function DeliveryPreparationScreen({
  can,
  onBack,
  onNavigate,
  orderId = SAMPLE_DELIVERY_ORDER_ID,
}: DeliveryPreparationScreenProps) {
  const canDispatch = can('order.dispatch');
  const [selectedSlot, setSelectedSlot] = useState<string>(SAMPLE_DELIVERY_PREP.deliverySlot);
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
          <Text style={styles.orderIdTop}>{orderId}</Text>

          <Text style={styles.sectionTitleFirst}>Delivery Information</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <Text style={styles.fieldValueBold}>{SAMPLE_DELIVERY_PREP.configuredAddress}</Text>
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Delivery Date</Text>
            <Text style={styles.fieldValueBold}>{SAMPLE_DELIVERY_PREP.deliveryDate}</Text>
          </View>

          <Text style={styles.sectionTitle}>Delivery Slot</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: '#FBF8F2' },
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  scrollTail: { height: 20 },
  orderIdTop: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A7150',
    paddingLeft: 34,
    marginBottom: 10,
  },
  sectionTitleFirst: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  fieldValueBold: { fontSize: 15, fontWeight: '700', color: '#1E293B', lineHeight: 20 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  slotPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  slotPillActive: {
    backgroundColor: '#FDF4EC',
    borderWidth: 1.5,
    borderColor: '#C27038',
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  slotPillTextActive: {
    color: '#8A421D',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0369A1', lineHeight: 18 },
  packingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packingCardSpaced: { marginTop: 10 },
  packingCardText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  greenCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1E824C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  checklistText: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  bottomBar: {
    backgroundColor: '#FBF8F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1ECE4',
  },
  dispatchBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dispatchBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
