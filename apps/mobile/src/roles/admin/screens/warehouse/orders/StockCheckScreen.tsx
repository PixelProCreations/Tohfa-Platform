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
 *
 * Live data: the order (number, lines, ordered quantities) is GET
 * /admin/orders/{orderId}. Warehouse availability per line has no agreed
 * source: no endpoint answers "how much of this order line can this warehouse
 * fill", and choosing between batch shelf stock, allocation availability and
 * the order's own reservation is an owner decision. Until one exists the
 * Available / Shortage / Reserved figures show ADMIN_NO_VALUE and the line
 * badge and summary box show it on the neutral tone: the screen never decides
 * "Insufficient" or "All items in stock" by itself.
 */
// Design id: M5S05 (Stock Check), absorbs M5S06 (Stock Shortage)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type {
  OrderDetailView,
  OrderLineView,
  OrderScreenBaseProps,
  OrdersLiveStateProps,
  StockCheckStep,
  WarehouseNavigate,
} from './types';

export interface StockCheckScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** Which step to open on; the host passes `params.step` (old M5S06 links use 'shortage'). */
  initialStep?: StockCheckStep | undefined;
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

/** One order line as the check step draws it. */
interface StockLine {
  key: string;
  name: string;
  ordered: string;
  /** Warehouse availability; null while no API supplies it (see the header). */
  available: string | null;
  /** The shortfall; null unless an availability figure says there is one. */
  shortage: string | null;
}

function toStockLine(line: OrderLineView): StockLine {
  const ordered = line.qtyGrams === null ? ADMIN_NO_VALUE : formatKg(line.qtyGrams);
  return {
    key: line.key,
    name: t('orders.stockCheck.itemName', { name: line.name, grade: line.gradeLabel }),
    ordered,
    available: null,
    shortage: null,
  };
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
  order: OrderDetailView;
  canMarkPacked: boolean;
  onBack: () => void;
  onReviewShortage: () => void;
  onNavigate?: WarehouseNavigate | undefined;
}

function CheckStepView({ order, canMarkPacked, onBack, onReviewShortage, onNavigate }: CheckStepViewProps) {
  const stockItems = order.lines.map(toStockLine);
  const shortageCount = stockItems.filter((it) => it.shortage !== null).length;
  const hasShortage = shortageCount > 0;
  const availabilityKnown = stockItems.length > 0 && stockItems.every((it) => it.available !== null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t('orders.stockCheck.title')}</Text>
            <Text style={styles.headerSubtitle}>{order.orderNumber}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {stockItems.length === 0 ? <AdminEmptyState title={t('orders.empty.lines')} /> : null}
          {stockItems.map((item) => {
            const short = item.shortage !== null;
            const known = item.available !== null;
            return (
              <View key={item.key} style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View
                    style={[styles.badge, !known ? styles.badgeNeutral : short ? styles.badgeDanger : styles.badgeSuccess]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        !known ? styles.badgeTextNeutral : short ? styles.badgeTextDanger : styles.badgeTextSuccess,
                      ]}
                    >
                      {!known
                        ? ADMIN_NO_VALUE
                        : short
                          ? t('orders.stockCheck.status.insufficient')
                          : t('orders.stockCheck.status.available')}
                    </Text>
                  </View>
                </View>

                <View style={styles.threeColRow}>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>{t('orders.stockCheck.col.ordered')}</Text>
                    <Text style={styles.colValue}>{item.ordered}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>{t('orders.stockCheck.col.available')}</Text>
                    <Text style={[styles.colValue, short && styles.dangerText]}>{item.available ?? ADMIN_NO_VALUE}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.colLabel}>
                      {short ? t('orders.stockCheck.col.shortage') : t('orders.stockCheck.col.required')}
                    </Text>
                    <Text style={[styles.colValue, short && styles.dangerText]}>
                      {short ? item.shortage : item.ordered}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {hasShortage ? (
            <View style={styles.statusBox}>
              <WarningTriangleIcon />
              <Text style={styles.statusText}>{t('orders.stockCheck.shortageBanner', { count: shortageCount })}</Text>
            </View>
          ) : availabilityKnown ? (
            <View style={[styles.statusBox, styles.statusBoxSuccess]}>
              <CheckCircleIcon />
              <Text style={[styles.statusText, styles.statusTextSuccess]}>{t('orders.stockCheck.allInStock')}</Text>
            </View>
          ) : (
            <View style={[styles.statusBox, styles.statusBoxNeutral]}>
              <Text style={[styles.statusText, styles.statusTextNeutral]}>{ADMIN_NO_VALUE}</Text>
            </View>
          )}

          <View style={styles.scrollSpacer} />
        </ScrollView>

        {hasShortage ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onReviewShortage}>
              <ArrowRightIcon />
              <Text style={styles.primaryBtnText}>{t('orders.stockCheck.reviewShortage')}</Text>
            </TouchableOpacity>
          </View>
        ) : canMarkPacked ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S07', { orderId: order.id })}
            >
              <ArrowRightIcon />
              <Text style={styles.primaryBtnText}>{t('orders.stockCheck.proceedToPacking')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// ─── Step: shortage (folded M5S06) ───────────────────────────────────────────

interface ShortageStepViewProps {
  order: OrderDetailView;
  onBack: () => void;
  onNavigate?: WarehouseNavigate | undefined;
}

/**
 * Which line is short, and by how much, needs the availability figure the check
 * step lacks (see the header), so every figure here is ADMIN_NO_VALUE.
 */
function ShortageStepView({ order, onBack, onNavigate }: ShortageStepViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orders.stockCheck.shortage.title')}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.orderRefLabel}>{order.orderNumber}</Text>

          <View style={styles.shortageHeroCard}>
            <Text style={styles.shortageNumberText}>{t('orders.stockCheck.shortage.short', { qty: ADMIN_NO_VALUE })}</Text>
            <Text style={styles.shortageCropText}>{ADMIN_NO_VALUE}</Text>
          </View>

          <View style={styles.summaryCardsRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValText}>{ADMIN_NO_VALUE}</Text>
              <Text style={styles.summaryLblText}>{t('orders.stockCheck.shortage.ordered')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValText}>{ADMIN_NO_VALUE}</Text>
              <Text style={styles.summaryLblText}>{t('orders.stockCheck.shortage.available')}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValText, styles.dangerText]}>{ADMIN_NO_VALUE}</Text>
              <Text style={[styles.summaryLblText, styles.dangerText]}>{t('orders.stockCheck.shortage.shortLabel')}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('orders.stockCheck.shortage.relatedStock')}</Text>
          <View style={styles.relatedStockCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.relatedLabel}>{t('orders.stockCheck.shortage.availableStock')}</Text>
                <Text style={styles.relatedValue}>{ADMIN_NO_VALUE}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.relatedLabel}>{t('orders.stockCheck.shortage.reserved')}</Text>
                <Text style={styles.relatedValue}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <InfoCircleIcon />
            <Text style={styles.noticeText}>{t('orders.stockCheck.shortage.notice')}</Text>
          </View>

          <View style={styles.scrollSpacer} />
        </ScrollView>

        <View style={[styles.bottomBar, styles.bottomBarBordered]}>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.stackedBtnGap]}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S04', { orderId: order.id })}
          >
            <DocumentIcon />
            <Text style={styles.primaryBtnText}>{t('orders.stockCheck.shortage.reviewOrder')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportIssueBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S16', { orderId: order.id })}
          >
            <Text style={styles.reportIssueBtnText}>{t('orders.stockCheck.shortage.reportIssue')}</Text>
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
  order,
  initialStep = 'check',
  isLoading = false,
  error,
  onRetry,
}: StockCheckScreenProps) {
  const [step, setStep] = useState<StockCheckStep>(initialStep);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  if (view !== 'ready' || order === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('orders.stockCheck.title')}</Text>
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

  const canMarkPacked = can('order.mark_packed');

  if (step === 'shortage') {
    return <ShortageStepView order={order} onBack={() => setStep('check')} onNavigate={onNavigate} />;
  }

  return (
    <CheckStepView
      order={order}
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
  itemName: { ...adminType.sectionHead, color: adminColors.ink },
  badge: { paddingHorizontal: 10, paddingVertical: adminSpacing.xs, borderRadius: adminRadius.full },
  badgeSuccess: { backgroundColor: adminColors.success.bg },
  badgeDanger: { backgroundColor: adminColors.danger.bg },
  badgeNeutral: { backgroundColor: adminColors.brandSoft.bg },
  badgeText: { ...adminType.caption },
  badgeTextSuccess: { color: adminColors.success.text },
  badgeTextDanger: { color: adminColors.danger.text },
  badgeTextNeutral: { color: adminColors.brandSoft.text },
  threeColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  colLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 2 },
  colValue: { ...adminType.sectionHead, color: adminColors.ink },
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
  statusBoxNeutral: { backgroundColor: adminColors.brandSoft.bg },
  statusTextNeutral: { color: adminColors.brandSoft.text },
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
  shortageNumberText: { ...adminType.title, color: adminColors.danger.text },
  shortageCropText: {
    ...adminType.caption,
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
  summaryValText: { ...adminType.title, color: adminColors.ink },
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
  relatedValue: { ...adminType.sectionHead, color: adminColors.ink },
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
