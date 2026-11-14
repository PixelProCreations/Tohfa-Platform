import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { customerColors, customerFonts, customerShadow } from '../theme';
import { CategoryImages, ProductImages } from '../assets/images/products';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

interface SearchProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  unit: string;
  rating: number;
  image: any;
  category: string;
}

// ── COMPREHENSIVE SEARCH CATALOG MATCHING FIGMA SPEC ────────────────────────
const ALL_SEARCH_PRODUCTS: SearchProduct[] = [
  // Tomatoes & Chillies (Exact Image 3 Spec)
  { id: 't1', name: 'Red Tomato', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.foryouTomatoes, category: 'Vegetables' },
  { id: 't2', name: 'Bangalore tomato', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, image: ProductImages.foryouTomatoes, category: 'Vegetables' },
  { id: 't3', name: 'Cherry Tomato', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, image: ProductImages.exoticCherryTomato, category: 'Vegetables' },
  { id: 't4', name: 'Yellow Cherry Tomato', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.exoticCherryTomato, category: 'Vegetables' },
  { id: 't5', name: 'Chilli', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.spiceDryRedChilli || ProductImages.exoticChilliThai, category: 'Vegetables' },

  // Fruits
  { id: 'f1', name: 'Royal Gala', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.fruitApple, category: 'Fruit' },
  { id: 'f2', name: 'Apple', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.fruitApple, category: 'Fruit' },
  { id: 'f3', name: 'Orange', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.fruitOrange, category: 'Fruit' },
  { id: 'f4', name: 'Watermelon', price: 60, originalPrice: 86, unit: 'kg', rating: 4.5, image: ProductImages.foryouWatermelon, category: 'Fruit' },
  { id: 'f5', name: 'Strawberries', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.foryouStrawberries, category: 'Fruit' },

  // Vegetables
  { id: 'v1', name: 'Potato', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.vegPotato, category: 'Vegetables' },
  { id: 'v2', name: 'Fresh Carrot', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.vegCarrot, category: 'Vegetables' },
  { id: 'v3', name: 'Green Curly Lettuce', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.foryouLettuce, category: 'Vegetables' },
  { id: 'v4', name: 'Broccoli', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.foryouBroccoli, category: 'Vegetables' },

  // Dairy & Grains
  { id: 'd1', name: 'Milk', price: 60, originalPrice: 86, unit: 'L', rating: 4.6, image: ProductImages.dairyMilk, category: 'Dairy' },
  { id: 'g1', name: 'Brown rice', price: 60, originalPrice: 86, unit: 'kg', rating: 4.6, image: ProductImages.grainBrownRice, category: 'Grains' },
];

// ── RECENT SEARCHES (EXACT FIGMA SPEC: IMAGE 2 - RIGHT) ─────────────────────
const INITIAL_RECENT_SEARCHES = [
  { id: 'r1', name: 'Royal Gala', subtitle: 'Sweet & mellow', image: ProductImages.fruitApple },
  { id: 'r2', name: 'Red Tomato', subtitle: 'Fresh', image: ProductImages.foryouTomatoes },
  { id: 'r3', name: 'Yellow Cherry Tomato', subtitle: 'Fresh', image: ProductImages.exoticCherryTomato },
];

// ── CATEGORIES FOR SEARCH TOP ROW (EXACT FIGMA SPEC: IMAGE 2 - LEFT) ────────
const SEARCH_CATEGORIES = [
  { id: 'c1', label: 'Vegetables', image: CategoryImages.vegetables },
  { id: 'c2', label: 'Fruit', image: CategoryImages.fruit },
  { id: 'c3', label: 'Dairy', image: CategoryImages.dairy },
  { id: 'c4', label: 'Grains', image: CategoryImages.grains },
  { id: 'c5', label: 'Tea', image: CategoryImages.teaCoffee },
];

export function SearchScreen({ onNavigate, onBack }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate?.('Home');
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Filter products by typed search query
  const searchResults = query.trim().length > 0
    ? ALL_SEARCH_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <View style={styles.contentWrap}>
        {query.trim().length > 0 ? (
          /* ── 1. ACTIVE SEARCH RESULTS (EXACT FIGMA SPEC: IMAGE 3) ────────── */
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header: Title of Search Query in Editorial Font */}
            <Text style={styles.resultsTitle}>{query}</Text>

            {searchResults.length === 0 ? (
              <View style={styles.noResultsWrap}>
                <Text style={styles.noResultsText}>No products found for "{query}"</Text>
                <Text style={styles.noResultsSub}>Try searching for tomato, apple, potato, milk or rice</Text>
              </View>
            ) : (
              <View style={styles.gridWrap}>
                {searchResults.map(item => {
                  const isFav = favorites.includes(item.id);
                  return (
                    <View key={item.id} style={styles.cardCol}>
                      <View style={[styles.productCard, customerShadow.subtle]}>
                        {/* Top: Star Rating on Left, Heart on Right */}
                        <View style={styles.cardHeaderRow}>
                          <View style={styles.ratingBadge}>
                            <Text style={styles.starIcon}>★ </Text>
                            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleFavorite(item.id)}
                            style={styles.heartButton}
                          >
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                fill={isFav ? '#EF4444' : 'none'}
                                stroke={isFav ? '#EF4444' : '#9CA3AF'}
                                strokeWidth={1.5}
                              />
                            </Svg>
                          </TouchableOpacity>
                        </View>

                        {/* Center Product Image */}
                        <View style={styles.cardImageCenter}>
                          {item.image ? (
                            <Image
                              source={item.image}
                              style={styles.productCardImage}
                              resizeMode="contain"
                            />
                          ) : null}
                        </View>

                        {/* Bottom Price Row */}
                        <View style={styles.cardPriceRow}>
                          <Text style={styles.priceBold}>₹ {item.price}</Text>
                          <Text style={styles.priceStrikethrough}>₹ {item.originalPrice}</Text>
                          <Text style={styles.unitText}>{item.unit}</Text>
                        </View>
                      </View>

                      {/* Product Name placed outside below card */}
                      <Text style={styles.cardProductName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        ) : isFocused ? (
          /* ── 2. RECENT SEARCHES STATE (EXACT FIGMA SPEC: IMAGE 2 - RIGHT) ─── */
          <View style={styles.recentWrap}>
            <Text style={styles.recentTitle}>Recent search</Text>
            <View style={styles.recentList}>
              {INITIAL_RECENT_SEARCHES.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => setQuery(item.name)}
                  style={styles.recentItemRow}
                >
                  <View style={styles.recentThumbWrap}>
                    <Image source={item.image} style={styles.recentThumbImage} resizeMode="contain" />
                  </View>
                  <View style={styles.recentTextCol}>
                    <Text style={styles.recentItemName}>{item.name}</Text>
                    <Text style={styles.recentItemSub}>{item.subtitle}</Text>
                  </View>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M7 17L17 7M17 7H7M17 7V17"
                      stroke="#9CA3AF"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* ── 3. INITIAL SEARCH STATE (EXACT FIGMA SPEC: IMAGE 2 - LEFT) ───── */
          <View style={styles.initialWrap}>
            <Text style={styles.freshFindsTitle}>Fresh Finds for You</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryCirclesRow}
            >
              {SEARCH_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.75}
                  onPress={() => setQuery(cat.label)}
                  style={styles.categoryCircleItem}
                >
                  <View style={styles.categoryCircleOuter}>
                    <Image source={cat.image} style={styles.categoryCircleImg} resizeMode="cover" />
                  </View>
                  <Text style={styles.categoryCircleLabel}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── FLOATING BOTTOM SEARCH BAR (EXACT FIGMA SPEC: IMAGES 2 & 3) ──────── */}
      <View style={styles.bottomBarWrap}>
        <View style={styles.searchInputPill}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for fresh vegetables..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} fill="#9CA3AF" />
                <Path d="M8 8l8 8M16 8l-8 8" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          )}
        </View>

        {/* Right Green Circular Action Button */}
        {query.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBack}
            style={styles.greenCircleBtn}
            accessibilityLabel="Close Search"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke="#FFFFFF"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFocused(true)}
            style={styles.greenCircleBtn}
            accessibilityLabel="Search"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={11} cy={11} r={7} stroke="#FFFFFF" strokeWidth={2} />
              <Path d="M21 21l-4.35-4.35" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingTop: 24,
    paddingBottom: 110,
  },
  resultsTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 26,
    color: '#1F2937',
    marginBottom: 20,
    paddingLeft: 4,
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
    paddingTop: 24,
  },
  recentTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 20,
  },
  recentList: {
    gap: 16,
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

  // ── 3. INITIAL SEARCH (FRESH FINDS FOR YOU) ───────────────────────────────
  initialWrap: {
    paddingTop: 24,
  },
  freshFindsTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 24,
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
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
    bottom: 24,
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
