/**
 * Sale Summary (design M6-S04): prices the cart through POST /admin/sales/quote
 * (sales.sale.create, BR-89, BR-98) and shows exactly what the server returned.
 * Nothing about money is computed here: lines, subtotal, GST and total all come
 * from the quote, and the quote's own total is what Payment echoes back as
 * `expectedTotal`. Editing a quantity or removing a line re-quotes.
 *
 * A 409 SALE_STOCK_CHANGED (stock moved since the products were listed) shows
 * through adminErrorKey with a Retry.
 */
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  buildQuoteRequest,
  cartItemRequests,
  cartLineKey,
  setCartQty,
  type CartLine,
  type SaleProductView,
  type SaleQuoteView,
} from './mappers';
import { GRADE_KEY, SALE_CHANNEL_KEY } from './salesLabels';
import { isAllWarehouses } from './SalesParts';
import type { WarehouseScreenBaseProps } from './types';
import { useQuoteSaleMutation } from './useSalesData';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Design id: M6-S04
export interface SaleSummaryScreenProps extends WarehouseScreenBaseProps {
  channel: 'DIRECT' | 'MARKET';
  saleWarehouseId: string | undefined;
  cart: readonly CartLine[];
  onChangeCart: (cart: CartLine[]) => void;
  /** Called with the server quote for the current cart. */
  onContinue: (quote: SaleQuoteView) => void;
}

/** setCartQty takes a product; a cart line carries every field it reads. */
function lineAsProduct(line: CartLine): SaleProductView {
  return {
    productId: line.productId,
    name: line.name,
    grade: line.grade,
    unitPricePaise: line.unitPricePaise,
    availableGrams: line.availableGrams,
    batchCode: null,
    storageLocation: null,
  };
}

export function SaleSummaryScreen({
  scope,
  can,
  onBack,
  channel,
  saleWarehouseId,
  cart,
  onChangeCart,
  onContinue,
}: SaleSummaryScreenProps) {
  const canCreate = can('sales.sale.create');
  const quoteMutation = useQuoteSaleMutation();
  const { mutate } = quoteMutation;

  // What the quote is for: the item requests plus channel and warehouse. A
  // quote is only usable while it still matches this key.
  const requestKey = JSON.stringify({ channel, saleWarehouseId, items: cartItemRequests(cart) });
  const [quoted, setQuoted] = useState<{ key: string; quote: SaleQuoteView } | null>(null);
  const isEmpty = cartItemRequests(cart).length === 0;

  const requestQuote = () => {
    if (!canCreate || isEmpty) return;
    const key = requestKey;
    mutate(buildQuoteRequest(channel, cart, saleWarehouseId), {
      onSuccess: (quote) => setQuoted({ key, quote }),
    });
  };

  useEffect(() => {
    requestQuote();
    // requestKey captures every input of the request.
  }, [requestKey, canCreate]);

  const current = quoted !== null && quoted.key === requestKey && !quoteMutation.isPending ? quoted.quote : null;

  // Quantity drafts, committed on end-editing so typing does not re-quote per key.
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [qtyError, setQtyError] = useState<Record<string, boolean>>({});

  const commitQty = (line: CartLine) => {
    const key = cartLineKey(line);
    const draft = qtyDraft[key];
    if (draft === undefined) return;
    const grams = parseKgToGrams(draft);
    if (grams === null || grams <= 0) {
      setQtyError((prev) => ({ ...prev, [key]: true }));
      return;
    }
    setQtyError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setQtyDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (grams !== line.qtyGrams) onChangeCart(setCartQty(cart, lineAsProduct(line), grams));
  };

  const removeLine = (line: CartLine) => {
    const key = cartLineKey(line);
    setQtyDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onChangeCart(setCartQty(cart, lineAsProduct(line), 0));
  };

  let body: React.ReactNode;
  if (!canCreate) {
    body = <AdminEmptyState title={t('sales.common.noPermission')} />;
  } else if (isEmpty) {
    body = <AdminEmptyState title={t('sales.summary.empty')} />;
  } else if (quoteMutation.isPending) {
    body = <AdminLoadingState label={t('sales.summary.quoting')} />;
  } else if (quoteMutation.error) {
    body = <AdminErrorState error={quoteMutation.error} onRetry={requestQuote} />;
  } else if (current === null) {
    body = <AdminLoadingState label={t('sales.summary.quoting')} />;
  } else {
    body = (
      <>
        {/* ─── 1. Sale Items (server lines) ─── */}
        <Text style={styles.sectionHeading}>{t('sales.summary.items')}</Text>
        <View style={styles.card}>
          {current.lines.map((qLine, idx) => {
            const key = cartLineKey(qLine);
            const cartLine = cart.find((l) => cartLineKey(l) === key);
            return (
              <View key={key}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{qLine.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {t('sales.summary.lineDetail', {
                        grade: t(GRADE_KEY[qLine.grade]),
                        qty: formatKg(qLine.qtyGrams),
                        price: formatPaise(qLine.unitPricePaise),
                      })}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatPaise(qLine.lineTotalPaise)}</Text>
                </View>
                {cartLine ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={[styles.qtyInput, qtyError[key] && styles.qtyInputError]}
                      value={qtyDraft[key] ?? gramsToKgString(cartLine.qtyGrams)}
                      onChangeText={(text) => setQtyDraft((prev) => ({ ...prev, [key]: text }))}
                      onEndEditing={() => commitQty(cartLine)}
                      onSubmitEditing={() => commitQty(cartLine)}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      accessibilityLabel={t('sales.summary.qtyLabel', { name: qLine.name })}
                    />
                    <TouchableOpacity
                      onPress={() => removeLine(cartLine)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t('sales.summary.removeLabel', { name: qLine.name })}
                    >
                      <Text style={styles.removeText}>{t('sales.summary.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {qtyError[key] ? <Text style={styles.errorText}>{t('sales.summary.qtyInvalid')}</Text> : null}
              </View>
            );
          })}
        </View>

        {/* ─── 2. Pricing (server totals) ─── */}
        <Text style={styles.sectionHeading}>{t('sales.summary.pricing')}</Text>
        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('sales.summary.subtotal')}</Text>
            <Text style={styles.breakdownValue}>{formatPaise(current.subtotalPaise)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('sales.summary.gst', { rate: current.gstRatePercent })}</Text>
            <Text style={styles.breakdownValue}>{formatPaise(current.gstPaise)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>{t('sales.summary.total')}</Text>
            <Text style={styles.totalValue}>{formatPaise(current.totalPaise)}</Text>
          </View>
        </View>

        {/* ─── 3. Sale Information ─── */}
        <Text style={styles.sectionHeading}>{t('sales.summary.saleInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.saleInfoRow}>
            {!isAllWarehouses(scope) && scope.warehouseName ? (
              <View style={styles.flex}>
                <Text style={styles.saleInfoLabel}>{t('sales.summary.warehouse')}</Text>
                <Text style={styles.saleInfoValue}>{scope.warehouseName}</Text>
              </View>
            ) : null}
            <View style={styles.flex}>
              <Text style={styles.saleInfoLabel}>{t('sales.summary.channel')}</Text>
              <Text style={styles.saleInfoValue}>{t(SALE_CHANNEL_KEY[channel])}</Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  const canContinue = current !== null && Object.keys(qtyDraft).length === 0;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('sales.common.back')}
          >
            <ArrowBackIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t('sales.summary.title')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {body}
      </ScrollView>

      {canCreate && !isEmpty ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.btnDisabled]}
            onPress={() => {
              if (current !== null) onContinue(current);
            }}
            disabled={!canContinue}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
          >
            <ArrowRightIcon size={18} />
            <Text style={styles.continueBtnText}>{t('sales.summary.continue')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 2,
  },
  itemSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
  },
  itemPrice: {
    ...adminType.title,
    color: adminColors.ink,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  qtyInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  qtyInputError: {
    borderColor: adminColors.danger.text,
  },
  errorText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    marginTop: adminSpacing.xs,
  },
  removeText: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  breakdownLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  breakdownValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  totalLabel: {
    ...adminType.title,
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  saleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleInfoLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  saleInfoValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
});
