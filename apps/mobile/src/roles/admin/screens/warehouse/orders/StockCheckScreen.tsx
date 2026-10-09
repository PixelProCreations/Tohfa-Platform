/**
 * Stock Check — compare an order's lines with warehouse stock before packing.
 *
 * The designed "Stock Shortage" screen used to be its own route (M5S06). It is
 * now the 'shortage' step of this screen; the host can still deep-link to it
 * with `initialStep: 'shortage'`.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Proceed to Packing" leads to marking the order packed: `order.mark_packed`.
 *   - "Review Shortage" (opens the shortage step), and the shortage step's
 *     "Review Order" / "Report Issue", have no code assigned yet and stay ungated.
 */
// Design id: M5S05 (Stock Check), absorbs M5S06 (Stock Shortage)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { OrderScreenBaseProps, StockCheckStep, WarehouseNavigate } from './types';

export interface StockCheckScreenProps extends OrderScreenBaseProps {
  /** Which step to open on; the host passes `params.step` (old M5S06 links use 'shortage'). */
  initialStep?: StockCheckStep | undefined;
}

/** Mock order id used until orders are wired to the API. */
const SAMPLE_ORDER_ID = 'ORD-1024';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

interface StockItem {
  name: string;
  status: 'Available' | 'Insufficient';
  ordered: string;
  available: string;
  required: string;
  shortage?: string;
}

/** Mock stock lines per sample order, as the design showed them. */
function mockStockItems(orderId: string): StockItem[] {
  if (orderId === 'INV-00251' || orderId === 'ORD-00251') {
    return [{ name: 'Tomato · Grade 1', status: 'Available', ordered: '2 KG', available: '25 KG', required: '2 KG' }];
  }
  if (orderId === 'INV-00238' || orderId === 'ORD-00238') {
    return [
      { name: 'Tomato · Grade 1', status: 'Available', ordered: '2 KG', available: '25 KG', required: '2 KG' },
      { name: 'Carrot · Grade 1', status: 'Available', ordered: '1 KG', available: '18 KG', required: '1 KG' },
      { name: 'Beans · Grade 1', status: 'Available', ordered: '2 KG', available: '12 KG', required: '2 KG' },
    ];
  }
  return [
    { name: 'Tomato · Grade 1', status: 'Available', ordered: '20 KG', available: '25 KG', required: '20 KG' },
    {
      name: 'Carrot · Grade 1',
      status: 'Insufficient',
      ordered: '10 KG',
      available: '6 KG',
      required: '10 KG',
      shortage: '4 KG',
    },
  ];
}

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

function WarningTriangleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={adminColors.warning.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 4L12 14.01l-3-3"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DocumentIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={adminColors.onBrand}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={adminColors.onBrand}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Step: check (M5S05) ─────────────────────────────────────────────────────

interface CheckStepViewProps {
  orderId: string;
  canMarkPacked: boolean;
  onBack: () => void;
  onReviewShortage: () => void;
  onNavigate?: WarehouseNavigate | undefined;
}

function CheckStepView({ orderId, canMarkPacked, onBack, onReviewShortage, onNavigate }: CheckStepViewProps) {
  const stockItems = mockStockItems(orderId);
  const hasShortage = stockItems.some((it) => it.status === 'Insufficient');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Stock Check</Text>
            <Text style={styles.headerSubtitle}>{orderId}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {stockItems.map((item) => {
            const short = item.status === 'Insufficient';
            return (
              <View key={item.name} style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={[styles.badge, short ? styles.badgeDanger : styles.badgeSuccess]}>
                    <Text style={[styles.badgeText, short ? styles.badgeTextDanger : styles.badgeTextSuccess]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.threeColRow}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Ordered</Text>
                    <Text style={styles.colValue}>{item.ordered}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>Available</Text>
                    <Text style={[styles.colValue, short && styles.dangerText]}>{item.available}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>{short ? 'Shortage' : 'Required'}</Text>
                    <Text style={[styles.colValue, short && styles.dangerText]}>
                      {short ? item.shortage : item.required}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {hasShortage ? (
            <View style={styles.statusBox}>
              <WarningTriangleIcon />
              <Text style={styles.statusText}>Stock Shortage — 1 item requires attention</Text>
            </View>
          ) : (
            <View style={[styles.statusBox, styles.statusBoxSuccess]}>
              <CheckCircleIcon />
              <Text style={[styles.statusText, styles.statusTextSuccess]}>All items in stock — ready for packing</Text>
            </View>
          )}

          <View style={styles.scrollSpacer} />
        </ScrollView>

        {hasShortage ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onReviewShortage}>
              <ArrowRightIcon />
              <Text style={styles.primaryBtnText}>Review Shortage</Text>
            </TouchableOpacity>
          </View>
        ) : canMarkPacked ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S07', { orderId })}
            >
              <ArrowRightIcon />
              <Text style={styles.primaryBtnText}>Proceed to Packing</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// ─── Step: shortage (folded M5S06) ───────────────────────────────────────────

interface ShortageStepViewProps {
  orderId: string;
  onBack: () => void;
  onNavigate?: WarehouseNavigate | undefined;
}

function ShortageStepView({ orderId, onBack, onNavigate }: ShortageStepViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stock Shortage</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.orderRefLabel}>{orderId}</Text>

          <View style={styles.shortageHeroCard}>
            <Text style={styles.shortageNumberText}>4 KG Short</Text>
            <Text style={styles.shortageCropText}>CARROT · GRADE 1</Text>
          </View>

          <View style={styles.summaryCardsRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValText}>10 KG</Text>
              <Text style={styles.summaryLblText}>ORDERED</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValText}>6 KG</Text>
              <Text style={styles.summaryLblText}>AVAILABLE</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValText, styles.dangerText]}>4 KG</Text>
              <Text style={[styles.summaryLblText, styles.dangerText]}>SHORT</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Related Stock</Text>
          <View style={styles.relatedStockCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.relatedLabel}>Available Stock</Text>
                <Text style={styles.relatedValue}>6 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.relatedLabel}>Reserved</Text>
                <Text style={styles.relatedValue}>0 KG</Text>
              </View>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <InfoCircleIcon />
            <Text style={styles.noticeText}>
              Partial fulfillment or substitution isn&apos;t defined by the source requirements, so no such action is
              offered here.
            </Text>
          </View>

          <View style={styles.scrollSpacer} />
        </ScrollView>

        <View style={[styles.bottomBar, styles.bottomBarBordered]}>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.stackedBtnGap]}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S04', { orderId })}
          >
            <DocumentIcon />
            <Text style={styles.primaryBtnText}>Review Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportIssueBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S16', { orderId })}
          >
            <Text style={styles.reportIssueBtnText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function StockCheckScreen({
  can,
  onBack,
  onNavigate,
  orderId = SAMPLE_ORDER_ID,
  initialStep = 'check',
}: StockCheckScreenProps) {
  const [step, setStep] = useState<StockCheckStep>(initialStep);
  const canMarkPacked = can('order.mark_packed');

  if (step === 'shortage') {
    return <ShortageStepView orderId={orderId} onBack={() => setStep('check')} onNavigate={onNavigate} />;
  }

  return (
    <CheckStepView
      orderId={orderId}
      canMarkPacked={canMarkPacked}
      onBack={onBack}
      onReviewShortage={() => setStep('shortage')}
      onNavigate={onNavigate}
    />
  );
}

const card = {
  backgroundColor: adminColors.card,
  borderWidth: 1,
  borderColor: adminColors.border,
  ...adminShadow.sm,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  // Was a translucent overlay; no translucent token, so solid onBrand text.
  headerSubtitle: { ...adminType.rowMeta, fontWeight: '600', color: adminColors.onBrand, marginTop: 1 },
  content: { flex: 1, paddingHorizontal: adminSpacing.lg, paddingTop: 14 },
  scrollSpacer: { height: 28 },

  // Check step
  itemCard: { ...card, borderRadius: adminRadius.lg, padding: adminSpacing.lg, marginBottom: adminSpacing.md },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  itemName: { fontSize: 14.5, fontWeight: '700', color: adminColors.ink },
  badge: { paddingHorizontal: 10, paddingVertical: adminSpacing.xs, borderRadius: adminRadius.full },
  badgeSuccess: { backgroundColor: adminColors.success.bg },
  badgeDanger: { backgroundColor: adminColors.danger.bg },
  badgeText: { ...adminType.caption },
  badgeTextSuccess: { color: adminColors.success.text },
  badgeTextDanger: { color: adminColors.danger.text },
  threeColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  colLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 2 },
  colValue: { fontSize: 15, fontWeight: '800', color: adminColors.ink },
  dangerText: { color: adminColors.danger.text },
  statusBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  statusBoxSuccess: { backgroundColor: adminColors.success.bg, borderColor: adminColors.success.border },
  statusText: { ...adminType.rowTitle, flex: 1, color: adminColors.warning.text },
  statusTextSuccess: { color: adminColors.success.text },
  bottomBar: {
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
  },
  bottomBarBordered: { paddingTop: 10, borderTopWidth: 1, borderTopColor: adminColors.border },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  primaryBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  stackedBtnGap: { marginBottom: 10 },

  // Shortage step
  orderRefLabel: {
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
    paddingLeft: 2,
  },
  shortageHeroCard: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1.2,
    borderColor: adminColors.danger.text,
    paddingVertical: adminSpacing.input,
    alignItems: 'center',
    marginBottom: 14,
    ...adminShadow.sm,
  },
  shortageNumberText: { fontSize: 22, fontWeight: '800', color: adminColors.danger.text },
  shortageCropText: {
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.danger.text,
    letterSpacing: 0.8,
    marginTop: adminSpacing.xs,
  },
  summaryCardsRow: { flexDirection: 'row', gap: 10, marginBottom: adminSpacing.lg },
  summaryCard: {
    ...card,
    flex: 1,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValText: { fontSize: 17, fontWeight: '800', color: adminColors.ink },
  summaryLblText: { ...adminType.caption, color: adminColors.muted, letterSpacing: 0.5, marginTop: 2 },
  sectionHeader: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  relatedStockCard: {
    ...card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    marginBottom: 14,
  },
  relatedLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  relatedValue: { fontSize: 14, fontWeight: '700', color: adminColors.ink },
  noticeBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  noticeText: { ...adminType.rowMeta, flex: 1, fontWeight: '500', color: adminColors.info.text },
  reportIssueBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIssueBtnText: { ...adminType.sectionHead, color: adminColors.danger.text },
});
