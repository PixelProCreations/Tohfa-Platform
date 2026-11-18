import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { customerFonts } from '../theme';
import { useToggleWishlist, useWishlist, type WishlistItem } from '../api/wishlist';
import { CatalogNotice, ProductCard, quickAddQty, useCatalogAddToCart } from '../components/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WishlistScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

/**
 * Wishlist (Figma 46:36507). Server-driven: GET /wishlist (crop + grade rows,
 * newest first). Remove is optimistic (DELETE /wishlist/{productId}?grade=);
 * an item that is no longer sellable (`product: null`) is greyed and remove-only.
 * "+" moves the item to the server cart (POST /cart/items) and off the wishlist.
 */
export function WishlistScreen({ onNavigate, onBack }: WishlistScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const wishlist = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const { addItem, pendingKey, blockedKeys, notice, clearNotice } = useCatalogAddToCart();
  const items: WishlistItem[] = wishlist.data?.items ?? [];

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

  const handleRemove = (item: WishlistItem) => {
    toggleWishlist.mutate({ productId: item.productId, grade: item.grade, add: false });
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    if (!item.product) return;
    const ok = await addItem({ productId: item.productId, grade: item.grade, qtyKg: quickAddQty(item.product) });
    if (ok) handleRemove(item);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (EXACT FIGMA SPEC: IMAGE 5) ─────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          style={styles.backButtonCircle}
          accessibilityLabel="Back"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="#1F2937"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist</Text>
      </View>

      {/* ── SEARCH BAR WITH BLUE HANDLE (EXACT FIGMA SPEC: IMAGE 5) ────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchPill}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.searchIconBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={7} stroke="#6B7280" strokeWidth={2} />
              <Path d="M21 21l-4.35-4.35" stroke="#6B7280" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>
        <View style={styles.blueHandle} />
      </View>

      {/* ── PRODUCT GRID (EXACT FIGMA SPEC: 350 x 299.88 HUG - IMAGE 5) ────── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {wishlist.isLoading ? (
          <ActivityIndicator testID="wishlist-loading" style={{ marginTop: 32 }} />
        ) : wishlist.isError ? (
          <View style={styles.emptyContainer} testID="wishlist-error">
            <Text style={styles.emptyTitle}>Couldn't load your wishlist</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => void wishlist.refetch()} style={styles.browseButton}>
              <Text style={styles.browseButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Save your favorite fresh organic harvests to find them easily anytime.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onNavigate?.('Home')}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>Explore Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {filteredItems.map(item => {
              const key = `${item.productId}:${item.grade}`;
              const sellable = item.available && item.product !== null;
              return (
                <View key={key} style={styles.cardCol} testID={`wishlist-item-${key}`}>
                  <ProductCard
                    product={sellable ? item.product : null}
                    name={item.name}
                    variant="compact"
                    wishlisted
                    onPress={sellable ? () => onNavigate?.('ProductDetail', { productId: item.productId, grade: item.grade }) : undefined}
                    onToggleWishlist={() => handleRemove(item)}
                    onAdd={sellable ? () => void handleMoveToCart(item) : undefined}
                    adding={pendingKey === key}
                    addDisabled={blockedKeys.has(key)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <CatalogNotice message={notice} onDismiss={clearNotice} />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  backButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 24,
    color: '#1F2937',
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchPill: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: customerFonts.regular,
    fontSize: 14,
    color: '#1F2937',
  },
  searchIconBtn: {
    padding: 4,
  },
  blueHandle: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#60A5FA',
    marginTop: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 18,
  },
  cardCol: {
    width: (SCREEN_WIDTH - 32 - 16) / 3,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: 146,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
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
    gap: 2,
  },
  starIcon: {
    fontSize: 10,
    color: '#F59E0B',
  },
  ratingText: {
    fontFamily: customerFonts.bold,
    fontSize: 10,
    color: '#1F2937',
  },
  heartBtn: {
    padding: 2,
  },
  cardImageCenter: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '90%',
    height: 60,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  priceBold: {
    fontFamily: customerFonts.bold,
    fontSize: 11,
    color: '#1F2937',
    marginRight: 2,
  },
  priceStrikethrough: {
    fontFamily: customerFonts.regular,
    fontSize: 9,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  unitText: {
    fontFamily: customerFonts.regular,
    fontSize: 10,
    color: '#4B5563',
  },
  productName: {
    fontFamily: customerFonts.regular,
    fontSize: 11,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
  },
  browseButtonText: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});

