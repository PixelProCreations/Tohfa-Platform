import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Text, TouchableOpacity } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { useProducts, type ListProductsQuery, type Product } from '../api/catalog';
import { Card } from '@tohfa/mobile-ui';
import { colors } from '../theme';
import { neutral } from '@tohfa/design-tokens';

export function ProductGridScreen({ categoryId }: { categoryId?: string }) {
  const [query, setQuery] = useState<ListProductsQuery>(categoryId ? { categoryId } : {});

  const { data, isLoading, isError } = useProducts(query);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text>Error loading products</Text>
      </View>
    );
  }

  // BR-16 and S-48: REJECT grade products must never render.
  const validItems = data.items.filter((item: Product) => item.grade !== 'REJECT');

  return (
    <View style={styles.container}>
      {/* Filter and Sort Chips could go here */}
      <View style={styles.chipsContainer}>
        {/* Placeholder for actual chips UI */}
        <TouchableOpacity style={styles.chip} onPress={() => setQuery({ ...query, sortBy: 'PRICE_ASC' })}>
          <Text style={styles.chipText}>Price: Low to High</Text>
        </TouchableOpacity>
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
        <EmptyState title={t('catalog.grid.empty')} />
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
      <CartToast
        visible={cartCount > 0}
        itemCount={cartCount}
        totalPrice={cart?.subtotal ?? '0.00'}
        thumbnails={cartThumbnails}
        hasFab={false}
        onViewCart={() => onNavigate?.('Cart')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: neutral('neutral300'),
  },
  chipText: {
    fontSize: 12,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  card: {
    padding: 16,
    marginBottom: 8,
  },
});
