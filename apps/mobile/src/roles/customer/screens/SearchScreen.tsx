/**
 * Search (Figma 46:36173 / 46:36183 / 46:36212). Server-driven:
 *  - typing: debounced GET /catalog/search/suggestions (PRODUCT -> detail, CATEGORY -> grid);
 *  - submit: GET /catalog/search (cursor paged) + POST /catalog/search/recent (fire-and-forget);
 *  - empty query: own recent searches (GET/DELETE), categories, trending queries + products.
 * Product cards are the shared ProductCard (key `${id}:${grade}`).
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { customerFonts, customerColors } from '../theme';
import { productKey, useCategories, type Product } from '../api/catalog';
import {
  SEARCH_MAX_LENGTH,
  normalizeSearchQuery,
  useDeleteRecentSearch,
  useRecentSearches,
  useRecordRecentSearch,
  useSearchResults,
  useSearchSuggestions,
  useTrending,
} from '../api/search';
import { useToggleWishlist, useWishlistKeys } from '../api/wishlist';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ProductCard } from '../components/ProductCard';
import { t } from '../../../i18n/customer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  initialQuery?: string;
}

// ── BACK ARROW SVG ──────────────────────────────────────────────────────────
const BackArrowSvg = ({ color = customerColors.neutral.neutral950, size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Trending derived from catalog home featured
  const { data: homeData, isLoading: isHomeLoading } = useCatalogHome();
  const { data: searchResults, isLoading: isSearchLoading } = useSearch(debouncedQuery);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCH_KEY).then((val: string | null) => {
      if (val) setRecentSearches(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim().length > 0) {
        saveRecentSearch(query.trim());
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const saveRecentSearch = async (term: string) => {
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(newRecent));
  };

  const renderContent = () => {
    if (debouncedQuery.length > 0) {
      if (isSearchLoading) return <ActivityIndicator style={styles.center} testID="loading-indicator" />;
      if (!searchResults || searchResults.items.length === 0) return <Text style={styles.center}>No results found</Text>;
      
      const validItems = searchResults.items.filter((item: Product) => item.grade !== 'REJECT');
      
      return (
        <FlatList
          data={validItems}
          keyExtractor={(item: Product) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ fontSize: 14 }}>{item.pricePerKg}</Text>
            </Card>
          )}
        />
      );
    }

    return (
      <View style={styles.list}>
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Recent Searches</Text>
            {recentSearches.map(term => (
              <Text key={term} style={styles.recentItem} onPress={() => setQuery(term)}>{term}</Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Trending Searches (Derived)</Text>
          {isHomeLoading ? (
            <ActivityIndicator />
          ) : (
            homeData?.featured?.slice(0, 5).map((prod: Product) => (
              <Text key={prod.id} style={styles.recentItem} onPress={() => setQuery(prod.name)}>{prod.name}</Text>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      *<StatusBar barStyle="dark-content" />

      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} style={styles.backButton} accessibilityLabel={t('customer.search.back')}>
          <BackArrowSvg color={customerColors.neutral.neutral950} size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {submitted || t('customer.catalog.search.defaultTitle')}
        </Text>
      </View>

      <View style={styles.contentWrap}>
        {submitted ? (
          /* ── 1. SUBMITTED SEARCH RESULTS ───────────────────────────────── */
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsScrollContent}
            showsVerticalScrollIndicator={false}
            onScrollEndDrag={() => {
              if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
            }}
          >
            {results.isLoading ? (
              <ActivityIndicator testID="search-loading" style={{ marginTop: 32 }} />
            ) : results.isError ? (
              <View style={styles.noResultsWrap}>
                <Text style={styles.noResultsText}>{t('customer.search.error')}</Text>
                <TouchableOpacity onPress={() => void results.refetch()} testID="search-retry">
                  <Text style={styles.noResultsSub}>{t('customer.search.tapRetry')}</Text>
                </TouchableOpacity>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.noResultsWrap} testID="search-no-results">
                <Text style={styles.noResultsText}>{t('customer.search.noMatch', { query: submitted })}</Text>
                {trendingProducts.length > 0 && <Text style={styles.noResultsSub}>{t('customer.search.tryTrending')}</Text>}
                {trendingProducts.length > 0 && <View style={styles.gridWrap}>{trendingProducts.slice(0, 4).map(renderCard)}</View>}
              </View>
            ) : (
              <View style={styles.gridWrap}>{items.map(renderCard)}</View>
            )}
            {results.hasNextPage && (
              <TouchableOpacity onPress={() => void results.fetchNextPage()} testID="search-more">
                <Text style={styles.noResultsSub}>{results.isFetchingNextPage ? t('customer.common.loading') : t('customer.search.showMore')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : typing ? (
          /* ── 2. TYPE-AHEAD SUGGESTIONS (errors are silent) ─────────────── */
          <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.initialScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.recentList}>
              {(suggestions.data ?? []).map((s) => (
                <TouchableOpacity
                  key={`${s.type}:${s.id}`}
                  testID={`suggestion-${s.id}`}
                  activeOpacity={0.7}
                  style={styles.recentItemRow}
                  onPress={() => {
                    recordRecent.mutate(s.name);
                    if (s.type === 'CATEGORY') onNavigate?.('ProductGrid', { categoryId: s.id, title: s.name });
                    else onNavigate?.('ProductDetail', { productId: s.id });
                  }}
                >
                  <View style={styles.recentTextCol}>
                    <Text style={styles.recentItemName}>{s.name}</Text>
                    <Text style={styles.recentItemSub}>{s.type === 'CATEGORY' ? t('customer.search.typeCategory') : t('customer.search.typeProduct')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {suggestions.isFetching && <ActivityIndicator testID="suggest-loading" />}
            </View>
          </ScrollView>
        ) : (
          /* ── 3. DISCOVERY: categories, recent, trending ────────────────── */
          <ScrollView style={styles.resultsScroll} contentContainerStyle={styles.initialScrollContent} showsVerticalScrollIndicator={false}>
            {(categories.data ?? []).length > 0 && (
              <View style={styles.categoriesSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryCirclesRow}>
                  {(categories.data ?? []).map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.75}
                      onPress={() => onNavigate?.('ProductGrid', { categoryId: cat.id, title: cat.name })}
                      style={styles.categoryCircleItem}
                    >
                      <View style={styles.categoryCircleOuter}>
                        {cat.imageUrl ? <Image source={{ uri: cat.imageUrl }} style={styles.categoryCircleImg} resizeMode="cover" /> : null}
                      </View>
                      <Text style={styles.categoryCircleLabel} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {recentItems.length > 0 && (
              <View style={styles.recentWrap} testID="recent-searches">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.recentTitle}>{t('customer.search.recent')}</Text>
                  <TouchableOpacity onPress={() => deleteRecent.mutate(undefined)} testID="recent-clear-all" accessibilityLabel={t('customer.search.clearAllA11y')}>
                    <Text style={styles.recentItemSub}>{t('customer.search.clearAll')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentList}>
                  {recentItems.map((item) => (
                    <TouchableOpacity key={item.query} activeOpacity={0.7} onPress={() => submit(item.query)} style={styles.recentItemRow}>
                      <View style={styles.recentTextCol}>
                        <Text style={styles.recentItemName}>{item.query}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteRecent.mutate(item.query)}
                        accessibilityLabel={t('customer.search.removeA11y', { query: item.query })}
                        testID={`recent-remove-${item.query}`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M6 6l12 12M18 6L6 18" stroke={customerColors.neutral.neutral500} strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {trendingQueries.length > 0 && (
              <View style={styles.recentWrap}>
                <Text style={styles.recentTitle}>{t('customer.search.trending')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryCirclesRow}>
                  {trendingQueries.map((q) => (
                    <TouchableOpacity key={q.query} onPress={() => submit(q.query)} style={styles.recentItemRow} testID={`trending-q-${q.query}`}>
                      <Text style={styles.recentItemName}>{q.query}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {trendingProducts.length > 0 && (
              <View style={styles.trendingSection}>
                <Text style={styles.trendingTitle}>{t('customer.search.trendingProduce')}</Text>
                <View style={styles.gridWrap}>{trendingProducts.map(renderCard)}</View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View style={[styles.bottomBarWrap, { bottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.searchInputPill}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('customer.search.placeholder')}
            placeholderTextColor={customerColors.neutral.neutral500}
            value={query}
            onChangeText={onChangeText}
            onSubmitEditing={() => submit()}
            maxLength={SEARCH_MAX_LENGTH}
            returnKeyType="search"
            testID="search-input"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSubmitted('');
              }}
              style={styles.clearBtn}
              accessibilityLabel={t('customer.search.clearA11y')}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} fill={customerColors.neutral.neutral500} />
                <Path d="M8 8l8 8M16 8l-8 8" stroke={customerColors.white} strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.greenCircleBtn} accessibilityLabel={t('customer.search.submitA11y')} onPress={() => submit()} testID="search-submit">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={7} stroke={customerColors.white} strokeWidth={2} />
            <Path d="M21 21l-4.35-4.35" stroke={customerColors.white} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  center: {
    marginTop: 20,
    alignSelf: 'center',
  },
  searchBar: {
    padding: 16,
    backgroundColor: neutral('neutral300'),
  },
  input: {
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  list: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  recentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: neutral('neutral300'),
  },
});
