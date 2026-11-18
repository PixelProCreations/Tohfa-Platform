/**
 * Product grid for a category, a "Just arrived" listing (sort=just_arrived, BR-181)
 * or any sorted listing. Server-driven: GET /catalog/products (cursor paged,
 * strict query: categoryId, grade, warehouseId, sort, cursor, limit only).
 * Each row is one crop at one grade, so the list key is `${id}:${grade}`.
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n/customer';
import { gradeLabel, productKey, SELLABLE_GRADES, useProducts, type Product, type ProductSort, type SellableGrade } from '../api/catalog';
import { useToggleWishlist, useWishlistKeys } from '../api/wishlist';
import { CatalogNotice, ProductCard, quickAddQty, useCatalogAddToCart } from '../components/ProductCard';
import { customerColors } from '../theme';

const SORTS: readonly Exclude<ProductSort, 'just_arrived'>[] = ['PRICE_ASC', 'PRICE_DESC', 'NAME_ASC', 'NEWEST'];

export interface ProductGridScreenProps {
  categoryId?: string | undefined;
  sort?: ProductSort | undefined;
  title?: string | undefined;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

export function ProductGridScreen({ categoryId, sort: initialSort, title, onNavigate, onBack }: ProductGridScreenProps) {
  const [sort, setSort] = useState<ProductSort | undefined>(initialSort);
  const [grade, setGrade] = useState<SellableGrade | undefined>(undefined);
  const query = useProducts({ categoryId, sort, grade, limit: 20 });
  const wishlistKeys = useWishlistKeys();
  const toggleWishlist = useToggleWishlist();
  const { addItem, pendingKey, blockedKeys, notice, clearNotice } = useCatalogAddToCart();

  // BR-16 / S-48 defence in depth: a REJECT row must never render.
  const items = useMemo(
    () => (query.data?.pages.flatMap((p) => p.items) ?? []).filter((p) => (p.grade as string) !== 'REJECT'),
    [query.data],
  );

  const heading = title ?? (initialSort === 'just_arrived' ? t('catalog.grid.justArrived') : t('catalog.grid.title'));

  const renderItem = ({ item }: { item: Product }) => {
    const key = productKey(item);
    return (
      <View style={styles.cell}>
        <ProductCard
          product={item}
          variant="grid"
          wishlisted={wishlistKeys.has(key)}
          onPress={() => onNavigate?.('ProductDetail', { productId: item.id, grade: item.grade })}
          onToggleWishlist={() =>
            toggleWishlist.mutate({ productId: item.id, grade: item.grade, add: !wishlistKeys.has(key), product: item })
          }
          onAdd={() => void addItem({ productId: item.id, grade: item.grade, qtyKg: quickAddQty(item) })}
          adding={pendingKey === key}
          addDisabled={blockedKeys.has(key)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} accessibilityLabel={t('customer.common.back')} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{heading}</Text>
      </View>

      <View style={styles.chipsRow}>
        {initialSort !== 'just_arrived' &&
          SORTS.map((s) => (
            <TouchableOpacity
              key={s}
              testID={`sort-${s}`}
              style={[styles.chip, sort === s && styles.chipActive]}
              onPress={() => setSort(sort === s ? initialSort : s)}
            >
              <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>{t(`catalog.sort.${s}`)}</Text>
            </TouchableOpacity>
          ))}
        {SELLABLE_GRADES.map((g) => (
          <TouchableOpacity
            key={g}
            testID={`grade-${g}`}
            style={[styles.chip, grade === g && styles.chipActive]}
            onPress={() => setGrade(grade === g ? undefined : g)}
          >
            <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{gradeLabel(g)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator testID="loading-indicator" color={customerColors.primary} />
        </View>
      ) : query.isError ? (
        <View style={styles.center}>
          <Text style={styles.message}>{t('catalog.common.loadError')}</Text>
          <TouchableOpacity testID="retry" style={styles.retry} onPress={() => void query.refetch()}>
            <Text style={styles.retryText}>{t('catalog.common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.message}>{t('catalog.grid.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={productKey}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={styles.footer} /> : undefined}
        />
      )}
      <CatalogNotice message={notice} onDismiss={clearNotice} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  back: { paddingRight: 12 },
  backText: { fontSize: 28, color: customerColors.heading },
  title: { fontSize: 18, fontWeight: '700', color: customerColors.heading },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB' },
  chipActive: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
  chipText: { fontSize: 12, color: customerColors.heading },
  chipTextActive: { color: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 14, color: customerColors.heading, textAlign: 'center' },
  retry: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: customerColors.primary },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  cell: { flex: 1 / 2, padding: 4 },
  footer: { marginVertical: 16 },
});
