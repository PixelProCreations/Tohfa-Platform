/**
 * Payment step of a direct / market sale (design M6-S06): pick the method,
 * then POST /admin/sales with the server quote's total echoed back (BR-89).
 *
 * - Taking a payment needs both sales.sale.create and payment.record (BR-85g).
 * - Wallet is offered only to a registered customer (BR-86), against the
 *   balance the customer lookup returned; there is no default balance.
 * - Cash / card / wallet sales complete at once; a UPI sale is created pending
 *   (BR-94) and the PendingUpiPanel replaces the method picker until the
 *   cashier confirms the UPI reference or cancels the sale.
 * - The checks here (checkSalePayment) are UX only; the server re-checks all
 *   of them and its 409 / 422 render inline.
 * - One Idempotency-Key per request body (root CLAUDE.md 2.4): retrying the
 *   same body after a timeout replays the same key, so it creates one sale.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminErrorKey } from '../../../api/errors';
import { useIdempotencyKey } from '../../../api/hooks';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import {
  buildSaleCreateRequest,
  checkSalePayment,
  isPendingUpiSale,
  SALE_PAYMENT_METHODS,
  type CartLine,
  type SaleBuyerInput,
  type SaleDetailView,
  type SalePaymentInput,
  type SaleQuoteView,
} from './mappers';
import { PendingUpiPanel } from './PendingUpiPanel';
import { PAYMENT_BLOCK_KEY, PAYMENT_METHOD_KEY } from './salesLabels';
import type { SalePaymentMethod, WarehouseScreenBaseProps } from './types';
import { useCreateSaleMutation } from './useSalesData';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UpiIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18h.01M18 14h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 14h.01M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const METHOD_ICON: Record<SalePaymentMethod, (p: { size?: number; color?: string }) => React.JSX.Element> = {
  CASH: CashIcon,
  UPI: UpiIcon,
  CARD: CardIcon,
  WALLET: WalletIcon,
};

// Design id: M6-S06
export interface PaymentScreenProps extends WarehouseScreenBaseProps {
  channel: 'DIRECT' | 'MARKET';
  /** The selling warehouse (a Sub admin's own; a Main admin's pick). */
  saleWarehouseId: string | undefined;
  cart: CartLine[];
  /** The server quote from the summary step; its total is what is charged (BR-89). */
  quote: SaleQuoteView | null;
  buyer: SaleBuyerInput | null;
  onChangeBuyer: () => void;
  /** The completed (or, for UPI, confirmed / cancelled) sale. */
  onCompleted: (sale: SaleDetailView) => void;
}

export function PaymentScreen({
  can,
  onBack,
  channel,
  saleWarehouseId,
  cart,
  quote,
  buyer,
  onChangeBuyer,
  onCompleted,
}: PaymentScreenProps): React.JSX.Element {
  const [pickedMethod, setPickedMethod] = useState<SalePaymentMethod>('CASH');
  const [cashText, setCashText] = useState('');
  const [cardRef, setCardRef] = useState('');
  // A UPI sale the server created pending; it is confirmed or cancelled in place.
  const [pendingSale, setPendingSale] = useState<SaleDetailView | null>(null);
  const idem = useIdempotencyKey();
  const createSale = useCreateSaleMutation();

  const allowed = can('sales.sale.create') && can('payment.record');
  // Wallet only for a registered customer (BR-86).
  const methods = SALE_PAYMENT_METHODS.filter((m) => m !== 'WALLET' || buyer?.kind === 'CUSTOMER');
  const method: SalePaymentMethod = methods.includes(pickedMethod) ? pickedMethod : 'CASH';

  const payment: SalePaymentInput =
    method === 'CASH'
      ? { method, receivedInput: cashText }
      : method === 'CARD'
        ? { method, cardRef }
        : { method };
  const check = buyer ? checkSalePayment({ cart, quote, buyer, payment }) : null;
  const body = buyer
    ? buildSaleCreateRequest({ channel, warehouseId: saleWarehouseId, cart, quote, buyer, payment })
    : null;
  const canSubmit = body !== null && !createSale.isPending;

  const handleSelectMethod = (next: SalePaymentMethod) => {
    setPickedMethod(next);
    createSale.reset();
  };

  const handleSubmit = () => {
    if (body === null || createSale.isPending) return;
    createSale.mutate(
      { body, idempotencyKey: idem.keyFor(body) },
      {
        onSuccess: (sale) => {
          idem.reset();
          if (isPendingUpiSale(sale)) setPendingSale(sale);
          else onCompleted(sale);
        },
      },
    );
  };

  // With a pending UPI sale on screen, going back must not lead to the summary
  // (continuing from there would create a second sale): it hands the pending
  // sale on, and the confirmation step points to its detail.
  const handleBack = () => {
    if (pendingSale) onCompleted(pendingSale);
    else onBack();
  };

  const header = (
    <View style={styles.headerBanner}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('sales.common.back')}
        >
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('sales.payment.title')}
        </Text>
      </View>
    </View>
  );

  if (!allowed) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <View style={styles.scrollContent}>
          <Text style={styles.note}>{t('sales.common.noPermission')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (pendingSale) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <PendingUpiPanel
            sale={pendingSale}
            can={can}
            onUpdated={(s) => (s.status === 'PICKED_UP' || s.status === 'CANCELLED' ? onCompleted(s) : setPendingSale(s))}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!buyer) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <View style={styles.scrollContent}>
          <Text style={styles.note}>{t('sales.payment.noBuyer')}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={onChangeBuyer} accessibilityRole="button" activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>{t('sales.payment.chooseBuyer')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const blockKey = check?.block ? PAYMENT_BLOCK_KEY[check.block] : null;
  const submitLabel = createSale.isPending
    ? t('sales.payment.submitting')
    : method === 'UPI'
      ? t('sales.payment.submitUpi')
      : t('sales.payment.submit');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount due: the server quote's total, never recomputed here (BR-89). */}
        {quote ? (
          <View style={styles.amountDueCard}>
            <Text style={styles.amountDueValue}>{formatPaise(quote.totalPaise)}</Text>
            <Text style={styles.amountDueLabel}>{t('sales.payment.amountDue')}</Text>
            <Text style={styles.amountDueMeta}>
              {t('sales.payment.gstIncluded', {
                subtotal: formatPaise(quote.subtotalPaise),
                gst: formatPaise(quote.gstPaise),
              })}
            </Text>
          </View>
        ) : null}

        {/* Buyer */}
        <View style={styles.buyerCard}>
          <View style={styles.flex}>
            <Text style={styles.detailLabel}>{t('sales.payment.buyer')}</Text>
            <Text style={styles.detailValue}>
              {buyer.kind === 'CUSTOMER'
                ? buyer.customer.name
                : t('sales.payment.walkInBuyer', { name: buyer.name.trim() })}
            </Text>
            {buyer.kind === 'CUSTOMER' ? <Text style={styles.detailMeta}>{buyer.customer.customerCode}</Text> : null}
          </View>
          <TouchableOpacity onPress={onChangeBuyer} accessibilityRole="button" activeOpacity={0.7}>
            <Text style={styles.linkText}>{t('sales.payment.changeBuyer')}</Text>
          </TouchableOpacity>
        </View>

        {/* Method picker */}
        <Text style={styles.sectionHeading}>{t('sales.payment.method')}</Text>
        <View style={styles.paymentMethodsRow}>
          {methods.map((m) => {
            const selected = m === method;
            const Icon = METHOD_ICON[m];
            return (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, selected && styles.methodBtnSelected]}
                onPress={() => handleSelectMethod(m)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Icon size={22} color={selected ? adminColors.onBrand : adminColors.muted} />
                <Text style={[styles.methodBtnText, selected && styles.methodBtnTextSelected]}>
                  {t(PAYMENT_METHOD_KEY[m])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {method === 'CASH' ? (
          <View>
            <Text style={styles.sectionHeading}>{t('sales.payment.cashReceived')}</Text>
            <TextInput
              style={styles.input}
              value={cashText}
              onChangeText={setCashText}
              keyboardType="decimal-pad"
              placeholder={t('sales.payment.cashPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              editable={!createSale.isPending}
              accessibilityLabel={t('sales.payment.cashReceived')}
            />
            {check && check.block === null ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>{t('sales.payment.change')}</Text>
                <Text style={[styles.detailValue, styles.successText]}>{formatPaise(check.changePaise)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {method === 'CARD' ? (
          <View>
            <Text style={styles.sectionHeading}>{t('sales.payment.cardRef')}</Text>
            <TextInput
              style={styles.input}
              value={cardRef}
              onChangeText={setCardRef}
              placeholder={t('sales.payment.cardRefPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={120}
              editable={!createSale.isPending}
              accessibilityLabel={t('sales.payment.cardRef')}
            />
          </View>
        ) : null}

        {method === 'UPI' ? (
          <View style={styles.detailCard}>
            <Text style={styles.body}>{t('sales.payment.upiNote')}</Text>
          </View>
        ) : null}

        {method === 'WALLET' && buyer.kind === 'CUSTOMER' ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>{t('sales.payment.walletBalance')}</Text>
            <Text style={styles.detailValue}>{formatPaise(buyer.customer.walletBalancePaise)}</Text>
            {check && check.shortfallPaise > 0 ? (
              <>
                <Text style={[styles.detailLabel, styles.spaced]}>{t('sales.payment.walletShortfall')}</Text>
                <Text style={[styles.detailValue, styles.dangerText]}>{formatPaise(check.shortfallPaise)}</Text>
              </>
            ) : null}
          </View>
        ) : null}

        {blockKey ? <Text style={styles.blockText}>{t(blockKey)}</Text> : null}

        {createSale.error ? (
          <View style={styles.errorCard} accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{t(adminErrorKey(createSale.error))}</Text>
            <Text style={styles.detailMeta}>{t('sales.payment.errorHint')}</Text>
            <TouchableOpacity onPress={onBack} accessibilityRole="button" activeOpacity={0.7}>
              <Text style={[styles.linkText, styles.spaced]}>{t('sales.payment.backToSummary')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit, busy: createSale.isPending }}
          activeOpacity={0.85}
        >
          {createSale.isPending ? <ActivityIndicator color={adminColors.onBrand} /> : null}
          <Text style={styles.confirmBtnText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  flex: {
    flex: 1,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backBtn: {
    padding: adminSpacing.xs,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  note: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
  },
  amountDueCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  amountDueValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 6,
  },
  amountDueLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  amountDueMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.md,
  },
  linkText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  methodBtnSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  methodBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  methodBtnTextSelected: {
    color: adminColors.onBrand,
  },
  input: {
    ...adminType.title,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 0,
    height: 52,
    marginBottom: 14,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: 14,
  },
  detailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  detailValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  detailMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  body: {
    ...adminType.body,
    color: adminColors.ink,
  },
  spaced: {
    marginTop: adminSpacing.md,
  },
  successText: {
    color: adminColors.success.text,
  },
  dangerText: {
    color: adminColors.danger.text,
  },
  blockText: {
    ...adminType.body,
    color: adminColors.warning.text,
    marginBottom: adminSpacing.md,
  },
  errorCard: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  errorText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  bottomBar: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    paddingBottom: adminSpacing.input,
    backgroundColor: adminColors.canvas,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    gap: adminSpacing.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
