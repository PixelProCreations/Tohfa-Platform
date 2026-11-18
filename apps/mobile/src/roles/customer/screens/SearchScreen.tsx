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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { customerFonts } from '../theme';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  initialQuery?: string;
}

// ── BACK ARROW SVG ──────────────────────────────────────────────────────────
const BackArrowSvg = ({ color = '#111827', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export function SearchScreen({ onNavigate, onBack, initialQuery = '' }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery.slice(0, SEARCH_MAX_LENGTH));
  /** The last submitted query (drives results); '' shows the discovery state. */
  const [submitted, setSubmitted] = useState(normalizeSearchQuery(initialQuery));
  const debounced = useDebouncedValue(query, 250);

  const suggestions = useSearchSuggestions(submitted ? '' : debounced);
  const results = useSearchResults(submitted);
  const recent = useRecentSearches();
  const recordRecent = useRecordRecentSearch();
  const deleteRecent = useDeleteRecentSearch();
  const trending = useTrending();
  const categories = useCategories();
  const wishlistKeys = useWishlistKeys();
  const toggleWishlist = useToggleWishlist();

  useEffect(() => {
    const q = normalizeSearchQuery(initialQuery);
    if (q) {
      setQuery(q);
      setSubmitted(q);
    }
  }, [initialQuery]);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate?.('Home');
    }
  };

  const submit = (text: string = query) => {
    const q = normalizeSearchQuery(text);
    setQuery(q);
    setSubmitted(q);
    if (q) recordRecent.mutate(q);
  };

  const onChangeText = (text: string) => {
    setQuery(text.slice(0, SEARCH_MAX_LENGTH));
    if (submitted) setSubmitted('');
  };

  const items: Product[] = results.data?.pages.flatMap((p) => p.items) ?? [];
  const typing = !submitted && normalizeSearchQuery(debounced).length > 0;

  const renderCard = (item: Product) => {
    const key = productKey(item);
    const isFav = wishlistKeys.has(key);
    return (
      <View key={key} style={styles.cardCol}>
        <ProductCard
          product={item}
          variant="grid"
          wishlisted={isFav}
          onPress={() => onNavigate?.('ProductDetail', { productId: item.id, grade: item.grade })}
          onToggleWishlist={() => toggleWishlist.mutate({ productId: item.id, grade: item.grade, add: !isFav, product: item })}
        />
      </View>
    );
  };

  const trendingProducts = trending.data?.products ?? [];
  const trendingQueries = trending.data?.queries ?? [];
  const recentItems = recent.data ?? [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} style={styles.backButton} accessibilityLabel="Go back">
          <BackArrowSvg color="#111827" size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {submitted || 'Fresh Finds for You'}
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
                <Text style={styles.noResultsText}>Couldn't search right now</Text>
                <TouchableOpacity onPress={() => void results.refetch()} testID="search-retry">
                  <Text style={styles.noResultsSub}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.noResultsWrap} testID="search-no-results">
                <Text style={styles.noResultsText}>No match for "{submitted}"</Text>
                {trendingProducts.length > 0 && <Text style={styles.noResultsSub}>Try what others are buying:</Text>}
                {trendingProducts.length > 0 && <View style={styles.gridWrap}>{trendingProducts.slice(0, 4).map(renderCard)}</View>}
              </View>
            ) : (
              <View style={styles.gridWrap}>{items.map(renderCard)}</View>
            )}
            {results.hasNextPage && (
              <TouchableOpacity onPress={() => void results.fetchNextPage()} testID="search-more">
                <Text style={styles.noResultsSub}>{results.isFetchingNextPage ? 'Loading…' : 'Show more'}</Text>
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
                    <Text style={styles.recentItemSub}>{s.type === 'CATEGORY' ? 'Category' : 'Product'}</Text>
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
                  <Text style={styles.recentTitle}>Recent searches</Text>
                  <TouchableOpacity onPress={() => deleteRecent.mutate(undefined)} testID="recent-clear-all" accessibilityLabel="Clear all recent searches">
                    <Text style={styles.recentItemSub}>Clear all</Text>
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
                        accessibilityLabel={`Remove ${item.query}`}
                        testID={`recent-remove-${item.query}`}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                          <Path d="M6 6l12 12M18 6L6 18" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
                        </Svg>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {trendingQueries.length > 0 && (
              <View style={styles.recentWrap}>
                <Text style={styles.recentTitle}>Trending searches</Text>
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
                <Text style={styles.trendingTitle}>Trending Produce</Text>
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
            placeholder="Search for fresh vegetables..."
            placeholderTextColor="#9CA3AF"
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
              accessibilityLabel="Clear search"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} fill="#9CA3AF" />
                <Path d="M8 8l8 8M16 8l-8 8" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.greenCircleBtn} accessibilityLabel="Search" onPress={() => submit()} testID="search-submit">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={7} stroke="#FFFFFF" strokeWidth={2} />
            <Path d="M21 21l-4.35-4.35" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#111827',
    flex: 1,
  },
  contentWrap: {
    flex: 1,
  },

  // ── 1. ACTIVE SEARCH RESULTS ──────────────────────────────────────────────
  resultsScroll: {
    flex: 1,
  },
  resultsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  initialScrollContent: {
    paddingBottom: 110,
  },
  categoriesSection: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardCol: {
    width: (SCREEN_WIDTH - 32 - 16) / 2,
    alignItems: 'center',
  },
  productCard: {
    width: '100%',
    height: 168,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    fontSize: 11,
    color: '#F59E0B',
  },
  ratingText: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#1F2937',
  },
  heartButton: {
    padding: 2,
  },
  cardImageCenter: {
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardImage: {
    width: 104,
    height: 80,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  priceBold: {
    fontFamily: customerFonts.bold,
    fontSize: 13,
    color: '#1F2937',
    marginRight: 4,
  },
  priceStrikethrough: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  unitText: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#4B5563',
  },
  cardProductName: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
  },
  noResultsWrap: {
    paddingTop: 60,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
  },
  noResultsSub: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#9CA3AF',
  },

  // ── 2. RECENT SEARCHES ────────────────────────────────────────────────────
  recentWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  recentTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 14,
  },
  recentList: {
    gap: 12,
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  recentThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  recentThumbImage: {
    width: 36,
    height: 36,
  },
  recentTextCol: {
    flex: 1,
  },
  recentItemName: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  recentItemSub: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#9CA3AF',
  },

  // ── 3. TRENDING SECTION ───────────────────────────────────────────────────
  trendingSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  trendingTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
    paddingLeft: 4,
  },

  // ── 4. CATEGORIES ─────────────────────────────────────────────────────────
  categoryCirclesRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  categoryCircleItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryCircleOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  categoryCircleImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  categoryCircleLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },

  // ── BOTTOM BAR ────────────────────────────────────────────────────────────
  bottomBarWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputPill: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: '#1F2937',
  },
  clearBtn: {
    padding: 4,
  },
  greenCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});
