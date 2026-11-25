/** Category browse (GET /catalog/categories). Tap -> ProductGrid for that category. */
import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { t } from '../../../i18n/customer';
import { useCategories, type Category } from '../api/catalog';
import { customerColors } from '../theme';

export interface CategoriesScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

export function CategoriesScreen({ onNavigate, onBack }: CategoriesScreenProps = {}) {
  const { data, isLoading, isError, refetch } = useCategories();

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      testID={`category-${item.id}`}
      onPress={() => onNavigate?.('ProductGrid', { categoryId: item.id, title: item.name })}
    >
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.placeholder]} />}
      <Text style={styles.name} numberOfLines={1}>
        {item.name}
      </Text>
      {typeof item.productCount === 'number' && <Text style={styles.count}>{t('catalog.categories.count', { count: item.productCount })}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} accessibilityLabel={t('customer.common.back')} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t('catalog.categories.title')}</Text>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator testID="loading-indicator" color={customerColors.primary} />
        </View>
      ) : isError || !data ? (
        <View style={styles.center}>
          <Text style={styles.message}>{t('catalog.common.loadError')}</Text>
          <TouchableOpacity testID="retry" style={styles.retry} onPress={() => void refetch()}>
            <Text style={styles.retryText}>{t('catalog.common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.message}>{t('catalog.categories.empty')}</Text>
        </View>
      ) : (
        <FlatList data={data} keyExtractor={(item) => item.id} numColumns={2} contentContainerStyle={styles.list} renderItem={renderItem} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  back: { paddingRight: 12 },
  backText: { fontSize: 28, color: customerColors.heading },
  title: { fontSize: 18, fontWeight: '700', color: customerColors.heading },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { fontSize: 14, color: customerColors.heading, textAlign: 'center' },
  retry: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: customerColors.primary },
  retryText: { color: customerColors.white, fontWeight: '600' },
  list: { padding: 12 },
  card: { flex: 1, margin: 4, padding: 12, alignItems: 'center', borderRadius: 12, backgroundColor: customerColors.palette.green.ivoryTint },
  image: { width: 72, height: 72, borderRadius: 36 },
  placeholder: { backgroundColor: customerColors.neutral.neutral300 },
  name: { marginTop: 8, fontSize: 14, fontWeight: '600', color: customerColors.heading },
  count: { fontSize: 12, color: customerColors.neutral.neutral600 },
});
