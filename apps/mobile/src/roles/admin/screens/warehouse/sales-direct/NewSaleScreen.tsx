/**
 * New Sale (design M6-S02): the start of a counter sale. Picks the channel,
 * the warehouse (all-scope actors only; a Sub admin sells at its own, BR-85f),
 * shows the buyer and the cart so far. No price is shown here: the server
 * quote on Sale Summary is the only authority on money (BR-89).
 *
 * Gated on sales.sale.create (docs/rbac.json). Hiding the screen is
 * presentation only; every sales endpoint re-checks the permission.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { WarehouseOption } from '../../../api/warehouseList';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { cartLineKey, type CartLine, type SaleBuyerInput } from './mappers';
import { GRADE_KEY, SALE_CHANNEL_KEY } from './salesLabels';
import { isAllWarehouses, WarehouseChips } from './SalesParts';
import type { WarehouseScreenBaseProps } from './types';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 12, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EmptyCartIcon({ size = 56, color = adminColors.border }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="1.6" />
      <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="1.6" />
      <Path
        d="M2.5 3h3.2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6l1.8-8.2H6.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const CHANNELS: readonly ('DIRECT' | 'MARKET')[] = ['DIRECT', 'MARKET'];

// Design id: M6-S02
export interface NewSaleScreenProps extends WarehouseScreenBaseProps {
  channel: 'DIRECT' | 'MARKET';
  onChangeChannel: (channel: 'DIRECT' | 'MARKET') => void;
  /** The warehouse the sale is made from: scope.warehouseId for a Sub, the pick for an all-scope actor. */
  saleWarehouseId: string | undefined;
  warehouseOptions: readonly WarehouseOption[];
  warehousesLoading: boolean;
  warehousesError: unknown;
  onRetryWarehouses: () => void;
  onSelectWarehouse: (warehouseId: string | undefined) => void;
  buyer: SaleBuyerInput | null;
  /** A customer the caller suggested (e.g. from Customer Details); a hint until one is picked. */
  presetCustomerName?: string | undefined;
  cart: readonly CartLine[];
  onSelectCustomer: () => void;
  onSelectProducts: () => void;
}

function buyerLabel(buyer: SaleBuyerInput | null, presetCustomerName: string | undefined): string {
  if (buyer?.kind === 'CUSTOMER') {
    return t('sales.newSale.customerCode', { name: buyer.customer.name, code: buyer.customer.customerCode });
  }
  if (buyer?.kind === 'WALK_IN') return t('sales.newSale.walkInBuyer', { name: buyer.name });
  if (presetCustomerName) return t('sales.newSale.presetCustomer', { name: presetCustomerName });
  return t('sales.newSale.chooseCustomer');
}

export function NewSaleScreen({
  scope,
  can,
  onBack,
  channel,
  onChangeChannel,
  saleWarehouseId,
  warehouseOptions,
  warehousesLoading,
  warehousesError,
  onRetryWarehouses,
  onSelectWarehouse,
  buyer,
  presetCustomerName,
  cart,
  onSelectCustomer,
  onSelectProducts,
}: NewSaleScreenProps) {
  const canCreate = can('sales.sale.create');
  const allScope = isAllWarehouses(scope);
  const warehouseKnown = saleWarehouseId !== undefined;
  const totalGrams = cart.reduce((sum, l) => sum + l.qtyGrams, 0);

  const header = (
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
          {t('sales.newSale.title')}
        </Text>
      </View>
    </View>
  );

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <AdminEmptyState title={t('sales.common.noPermission')} />
      </SafeAreaView>
    );
  }

  let warehouseSection: React.ReactNode;
  if (!allScope) {
    warehouseSection = scope.warehouseName ? (
      <View style={styles.warehousePill}>
        <LockIcon size={12} color={adminColors.warning.text} />
        <Text style={styles.warehousePillText}>{scope.warehouseName}</Text>
      </View>
    ) : null;
  } else if (warehouseOptions.length === 0 && warehousesLoading) {
    warehouseSection = <AdminLoadingState />;
  } else if (warehouseOptions.length === 0 && warehousesError) {
    warehouseSection = <AdminErrorState error={warehousesError} onRetry={onRetryWarehouses} />;
  } else if (warehouseOptions.length === 0) {
    warehouseSection = <AdminEmptyState title={t('sales.newSale.noWarehouses')} />;
  } else {
    warehouseSection = (
      <>
        <WarehouseChips
          scope={scope}
          selected={saleWarehouseId}
          onSelect={onSelectWarehouse}
          allowAll={false}
          options={warehouseOptions}
        />
        {!warehouseKnown ? <Text style={styles.hintText}>{t('sales.common.selectWarehouse')}</Text> : null}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── 1. Warehouse ─── */}
        {warehouseSection !== null ? <Text style={styles.sectionHeading}>{t('sales.newSale.warehouse')}</Text> : null}
        {warehouseSection}

        {/* ─── 2. Sales Channel ─── */}
        <Text style={styles.sectionHeading}>{t('sales.newSale.channel')}</Text>
        <View style={styles.card}>
          {CHANNELS.map((ch, idx) => {
            const selected = channel === ch;
            return (
              <View key={ch}>
                {idx > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.channelRow}
                  onPress={() => {
                    if (!selected) onChangeChannel(ch);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.channelLabel}>{t(SALE_CHANNEL_KEY[ch])}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* ─── 3. Customer ─── */}
        <Text style={styles.sectionHeading}>{t('sales.newSale.customer')}</Text>
        <TouchableOpacity
          style={styles.customerSelectCard}
          onPress={onSelectCustomer}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <View style={styles.flex}>
            <Text style={styles.customerSubLabel}>{t('sales.newSale.customerLabel')}</Text>
            <Text style={[styles.customerValueText, buyer === null && styles.customerValueHint]}>
              {buyerLabel(buyer, presetCustomerName)}
            </Text>
          </View>
          <ChevronRightIcon size={20} color={adminColors.muted} />
        </TouchableOpacity>

        {/* ─── 4. Products ─── */}
        <Text style={styles.sectionHeading}>{t('sales.newSale.products')}</Text>
        {cart.length === 0 ? (
          <View style={styles.emptyProductsContainer}>
            <EmptyCartIcon size={52} color={adminColors.border} />
            <Text style={styles.emptyProductsText}>{t('sales.newSale.noProducts')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              {cart.map((line, idx) => (
                <View key={cartLineKey(line)}>
                  {idx > 0 && <View style={styles.divider} />}
                  <View style={styles.cartRow}>
                    <Text style={[styles.cartName, styles.flex]}>{line.name}</Text>
                    <Text style={styles.cartMeta}>
                      {t('sales.newSale.cartLine', { grade: t(GRADE_KEY[line.grade]), qty: formatKg(line.qtyGrams) })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.cartSummary}>
              {t('sales.newSale.cartSummary', { count: cart.length, qty: formatKg(totalGrams) })}
            </Text>
            <Text style={styles.hintText}>{t('sales.newSale.priceNote')}</Text>
          </>
        )}
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        {!warehouseKnown ? <Text style={styles.hintText}>{t('sales.newSale.pickWarehouseFirst')}</Text> : null}
        <TouchableOpacity
          style={[styles.selectProductsBtn, !warehouseKnown && styles.btnDisabled]}
          onPress={onSelectProducts}
          disabled={!warehouseKnown}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !warehouseKnown }}
        >
          <PlusIcon size={18} />
          <Text style={styles.selectProductsBtnText}>
            {cart.length === 0 ? t('sales.newSale.selectProducts') : t('sales.newSale.editProducts')}
          </Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  hintText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  warehousePillText: {
    color: adminColors.warning.text,
    ...adminType.rowTitle,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: adminColors.brand,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: adminColors.brand,
  },
  channelLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  customerSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  customerSubLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  customerValueText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  customerValueHint: {
    color: adminColors.muted,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  cartName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  cartMeta: {
    ...adminType.body,
    color: adminColors.muted,
  },
  cartSummary: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  emptyProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyProductsText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 12,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  selectProductsBtn: {
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
  selectProductsBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
});
