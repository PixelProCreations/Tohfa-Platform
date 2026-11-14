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
import { ProductImages } from '../assets/images/products';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WishlistScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  unit: string;
  rating: number;
  image: any;
}

const DEFAULT_WISHLIST_ITEMS: WishlistItem[] = [
  {
    id: 'w1',
    name: 'Thyme',
    price: 60,
    originalPrice: 86,
    unit: 'bunch',
    rating: 4.6,
    image: ProductImages.herbThyme,
  },
  {
    id: 'w2',
    name: 'Natural Honey',
    price: 60,
    originalPrice: 86,
    unit: 'g',
    rating: 4.6,
    image: ProductImages.sweetHoney,
  },
  {
    id: 'w3',
    name: 'Spinach',
    price: 60,
    originalPrice: 86,
    unit: 'bunch',
    rating: 4.6,
    image: ProductImages.herbSpinach,
  },
  {
    id: 'w4',
    name: 'Brown rice',
    price: 60,
    originalPrice: 86,
    unit: 'kg',
    rating: 4.6,
    image: ProductImages.grainBrownRice,
  },
  {
    id: 'w5',
    name: 'Passion fruit',
    price: 60,
    originalPrice: 86,
    unit: 'kg',
    rating: 4.6,
    image: ProductImages.fruitPomegranate || ProductImages.fruitApple,
  },
];

export function WishlistScreen({ onNavigate, onBack }: WishlistScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<WishlistItem[]>(DEFAULT_WISHLIST_ITEMS);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate?.('Home');
    }
  };

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (EXACT FIGMA SPEC: IMAGE 5) ─────────────────────────── */}
      <View style={styles.headerRow}>
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
        {filteredItems.length === 0 ? (
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
            {filteredItems.map(item => (
              <View key={item.id} style={styles.cardCol}>
                <View style={[styles.card, customerShadow.subtle]}>
                  {/* Top Row: Star Rating on Left, Solid Red Heart on Right */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.ratingBadge}>
                      <Text style={styles.starIcon}>★ </Text>
                      <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleRemove(item.id)}
                      style={styles.heartBtn}
                      accessibilityLabel="Remove from wishlist"
                    >
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="#EF4444">
                        <Path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          fill="#EF4444"
                          stroke="#EF4444"
                          strokeWidth={1.5}
                        />
                      </Svg>
                    </TouchableOpacity>
                  </View>

                  {/* Center Graphic */}
                  <View style={styles.cardImageCenter}>
                    {item.image ? (
                      <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
                    ) : null}
                  </View>

                  {/* Pricing Row */}
                  <View style={styles.cardPriceRow}>
                    <Text style={styles.priceBold}>₹ {item.price}</Text>
                    <Text style={styles.priceStrikethrough}>₹ {item.originalPrice}</Text>
                    <Text style={styles.unitText}>{item.unit}</Text>
                  </View>
                </View>

                {/* Name Below Card */}
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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

