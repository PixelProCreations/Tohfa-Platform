/**
 * Select Products (design M6-S03): the sellable stock of the sale's warehouse
 * and channel, from GET /admin/sales/products (sales.sale.create, BR-95),
 * searched with `q` and paged with the cursor.
 *
 * Quantities are typed in kg and held as integer grams (parseKgToGrams); the
 * cart is a local copy until Continue hands it back to the flow. The unit
 * price shown is the list price; the money that counts is the server quote on
 * the next screen (BR-89). Stock is clamped client-side only to stop an obvious
 * mistake; the server re-checks it on quote and create.
 */
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState, AdminStateButton } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { cartLineKey, setCartQty, type CartLine, type SaleProductView } from './mappers';
import { GRADE_KEY } from './salesLabels';
import { isAllWarehouses } from './SalesParts';
import type { WarehouseScreenBaseProps } from './types';
import { useSaleProducts } from './useSalesData';

const SEARCH_DEBOUNCE_MS = 300;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
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

function InfoCircleIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Design id: M6-S03
export interface SelectProductsScreenProps extends WarehouseScreenBaseProps {
  channel: 'DIRECT' | 'MARKET';
  /** The sale's warehouse; a Sub admin may leave it undefined (the server uses its own). */
  saleWarehouseId: string | undefined;
  cart: readonly CartLine[];
  onContinue: (cart: CartLine[]) => void;
}

type QtyError = { kind: 'invalid' } | { kind: 'overStock'; availableGrams: number };

export function SelectProductsScreen({
  scope,
  can,
  onBack,
  channel,
  saleWarehouseId,
  cart: initialCart,
  onContinue,
}: SelectProductsScreenProps) {
  const canCreate = can('sales.sale.create');
  const warehouseKnown = saleWarehouseId !== undefined || !isAllWarehouses(scope);
  const enabled = canCreate && warehouseKnown;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const products = useSaleProducts(channel, saleWarehouseId, debouncedSearch, { enabled });

  const [cart, setCart] = useState<CartLine[]>(() => [...initialCart]);
  const [qtyText, setQtyText] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialCart.map((l) => [cartLineKey(l), gramsToKgString(l.qtyGrams)])),
  );
  const [qtyErrors, setQtyErrors] = useState<Record<string, QtyError>>({});
  const hasErrors = Object.keys(qtyErrors).length > 0;

  const onChangeQty = (product: SaleProductView, text: string) => {
    const key = cartLineKey(product);
    setQtyText((prev) => ({ ...prev, [key]: text }));
    const trimmed = text.trim();
    const grams = trimmed === '' ? 0 : parseKgToGrams(trimmed);
    let error: QtyError | null = null;
    if (grams === null || grams < 0) error = { kind: 'invalid' };
    else if (grams > product.availableGrams) error = { kind: 'overStock', availableGrams: product.availableGrams };
    setQtyErrors((prev) => {
      const next = { ...prev };
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });
    // A wrong entry leaves the product out of the cart until it is corrected.
    setCart((prev) => setCartQty(prev, product, error || grams === null ? 0 : grams));
  };

  const selectedCount = cart.length;
  const canContinue = selectedCount > 0 && !hasErrors;

  const view = queryViewState({ isLoading: products.isLoading, error: products.error, itemCount: products.items.length });
  const searching = debouncedSearch.trim() !== '';

  const productCards = products.items.map((product) => {
        const key = cartLineKey(product);
        const error = qtyErrors[key];
        const inCart = cart.some((l) => cartLineKey(l) === key);
        return (
          <View key={key} style={[styles.productCard, inCart && styles.productCardSelected]}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productGradePrice}>
              {t('sales.products.gradePrice', {
                grade: t(GRADE_KEY[product.grade]),
                price: formatPaise(product.unitPricePaise),
              })}
            </Text>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>{t('sales.products.available')}</Text>
                <Text style={styles.gridValue}>{formatKg(product.availableGrams)}</Text>
              </View>
              {product.batchCode !== null ? (
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>{t('sales.products.batch')}</Text>
                  <Text style={styles.gridValue}>{product.batchCode}</Text>
                </View>
              ) : null}
            </View>
            {product.storageLocation !== null ? (
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>{t('sales.products.location')}</Text>
                  <Text style={styles.gridValue}>{product.storageLocation}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.qtyLabel}>{t('sales.products.quantity')}</Text>
            <TextInput
              style={[styles.qtyInput, error && styles.qtyInputError]}
              value={qtyText[key] ?? ''}
              onChangeText={(text) => onChangeQty(product, text)}
              placeholder={t('sales.products.qtyPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              keyboardType="decimal-pad"
              accessibilityLabel={t('sales.products.qtyLabel', { name: product.name })}
            />
            {error ? (
              <Text style={styles.errorText}>
                {error.kind === 'invalid'
                  ? t('sales.products.qtyInvalid')
                  : t('sales.products.qtyOverStock', { qty: formatKg(error.availableGrams) })}
              </Text>
            ) : null}
          </View>
        );
  });

  let body: React.ReactNode;
  if (!canCreate) {
    body = <AdminEmptyState title={t('sales.common.noPermission')} />;
  } else if (!warehouseKnown) {
    body = <AdminEmptyState title={t('sales.common.selectWarehouse')} />;
  } else if (view === 'loading') {
    body = <AdminLoadingState />;
  } else if (view === 'error') {
    body = <AdminErrorState error={products.error} onRetry={products.refresh} />;
  } else if (view === 'empty') {
    body = <AdminEmptyState title={searching ? t('sales.products.emptySearch') : t('sales.products.empty')} />;
  } else {
    body = (
      <>
        <View style={styles.traceabilityBanner}>
          <InfoCircleIcon size={16} />
          <Text style={styles.traceabilityText}>{t('sales.products.traceabilityNote')}</Text>
        </View>
        {productCards}
        {products.hasMore ? (
          <AdminStateButton label={t('sales.common.loadMore')} onPress={products.loadMore} variant="secondary" />
        ) : null}
      </>
    );
  }

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
            {t('sales.products.title')}
          </Text>
        </View>
      </View>

      {enabled ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('sales.products.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              accessibilityLabel={t('sales.products.searchLabel')}
            />
          </View>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {body}
      </ScrollView>

      {enabled ? (
        <View style={styles.bottomBar}>
          {selectedCount > 0 ? (
            <Text style={styles.selectedText}>{t('sales.products.selectedCount', { count: selectedCount })}</Text>
          ) : null}
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.btnDisabled]}
            onPress={() => onContinue(cart)}
            disabled={!canContinue}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
          >
            <ArrowRightIcon size={18} />
            <Text style={styles.continueBtnText}>{t('sales.products.continue')}</Text>
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
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  traceabilityBanner: {
    backgroundColor: adminColors.info.bg,
    borderColor: adminColors.info.border,
    borderWidth: 1,
    borderRadius: adminRadius.sm,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traceabilityText: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.info.text,
  },
  productCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  productCardSelected: {
    borderColor: adminColors.brand,
  },
  productName: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 3,
  },
  productGradePrice: {
    ...adminType.body,
    color: adminColors.muted,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  gridValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  qtyLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  qtyInput: {
    ...adminType.body,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  qtyInputError: {
    borderColor: adminColors.danger.text,
  },
  errorText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    marginTop: adminSpacing.xs,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  selectedText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 50,
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
