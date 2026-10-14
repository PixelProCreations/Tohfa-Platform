/**
 * Screen 39 — Fair Price Ceiling Dashboard
 * Super Admin can view current ceiling prices across all produce categories
 * with category tabs and price change indicators since last update.
 */
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  orangeLight: '#FFF3EF',
  red: '#D32F2F',
  green: '#2E7D32',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
};

type Category = 'All' | 'Vegetables' | 'Fruits' | 'Grains' | 'Dairy';

interface PriceItem {
  name: string;
  category: string;
  price: number;
  change?: number; // +2 means ₹2 increase, -3 means ₹3 decrease
  lastUpdate: string;
}

const MOCK_PRICES: PriceItem[] = [
  // Vegetables
  { name: 'Carrots', category: 'Vegetables', price: 42, change: 2, lastUpdate: 'Aug 12' },
  { name: 'Cabbage', category: 'Vegetables', price: 28, change: -3, lastUpdate: 'Aug 12' },
  { name: 'Beetroot', category: 'Vegetables', price: 35, change: 1, lastUpdate: 'Aug 12' },
  
  // Fruits
  { name: 'Apples', category: 'Fruits', price: 85, change: 5, lastUpdate: 'Aug 12' },
  { name: 'Oranges', category: 'Fruits', price: 60, change: -2, lastUpdate: 'Aug 12' },
  { name: 'Bananas', category: 'Fruits', price: 45, change: 0, lastUpdate: 'Aug 12' },
  
  // Grains
  { name: 'Rice', category: 'Grains', price: 52, change: 3, lastUpdate: 'Aug 12' },
  { name: 'Wheat', category: 'Grains', price: 48, change: 1, lastUpdate: 'Aug 12' },
  { name: 'Corn', category: 'Grains', price: 38, change: -1, lastUpdate: 'Aug 12' },
  
  // Dairy
  { name: 'Milk', category: 'Dairy', price: 55, change: 2, lastUpdate: 'Aug 12' },
  { name: 'Paneer', category: 'Dairy', price: 320, change: 10, lastUpdate: 'Aug 12' },
  { name: 'Yogurt', category: 'Dairy', price: 65, change: 0, lastUpdate: 'Aug 12' },
];

interface FairPriceCeilingScreenProps {
  onBack: () => void;
  onUpdatePrice: (item: PriceItem) => void;
  onBulkUpdate: () => void;
  onViewHistory: (item: PriceItem) => void;
}

export function FairPriceCeilingScreen({
  onBack,
  onUpdatePrice,
  onBulkUpdate,
  onViewHistory,
}: FairPriceCeilingScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollBarWidth, setScrollBarWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [currentScrollX, setCurrentScrollX] = useState(0);

  const categories: Category[] = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy'];

  const filteredPrices =
    selectedCategory === 'All'
      ? MOCK_PRICES
      : MOCK_PRICES.filter((p) => p.category === selectedCategory);

  // Pan responder for draggable scroll bar
  const startScrollX = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startScrollX.current = currentScrollX;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (scrollViewRef.current && scrollBarWidth > 0 && contentWidth > scrollViewWidth) {
          // Calculate the scroll position based on gesture
          const maxScrollDistance = contentWidth - scrollViewWidth;
          const scrollRatio = gestureState.dx / scrollBarWidth;
          const deltaScroll = scrollRatio * maxScrollDistance;
          const newScrollX = Math.max(0, Math.min(maxScrollDistance, startScrollX.current + deltaScroll));
          scrollViewRef.current.scrollTo({ x: newScrollX, animated: false });
          setCurrentScrollX(newScrollX);
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Fixed Header Content */}
      <View style={styles.fixedHeader}>
        {/* Title */}
        <Text style={styles.title}>Fair Price Ceilings</Text>
        <Text style={styles.subtitle}>Current ceiling prices across all produce categories</Text>

        {/* Category Tabs with Scroll Indicator */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
            style={styles.tabsScroll}
            onContentSizeChange={(width) => setContentWidth(width)}
            onLayout={(e) => setScrollViewWidth(e.nativeEvent.layout.width)}
            onScroll={(e) => setCurrentScrollX(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.tab, isActive && styles.tabActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          {/* Scroll Indicator Bar */}
          <View style={styles.scrollIndicatorWrapper}>
            <Text style={styles.scrollArrow}>‹</Text>
            <View
              style={styles.scrollBarContainer}
              onLayout={(e) => setScrollBarWidth(e.nativeEvent.layout.width)}
            >
              <View style={styles.scrollBarTrack}>
                <View style={styles.scrollBar} {...panResponder.panHandlers} />
              </View>
            </View>
            <Text style={styles.scrollArrow}>›</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Price List */}
        <View style={styles.priceList}>
          {filteredPrices.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.priceCard}
              onPress={() => onUpdatePrice(item)}
              activeOpacity={0.7}
            >
              <View style={styles.priceCardLeft}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {item.change !== 0 ? (
                  <Text
                    style={[
                      styles.changeText,
                      item.change && item.change > 0 ? styles.changeGreen : styles.changeRed,
                    ]}
                  >
                    {item.change && item.change > 0 ? '↑' : '↓'} ₹{Math.abs(item.change || 0)}{' '}
                    since last update ({item.lastUpdate})
                  </Text>
                ) : (
                  <Text style={styles.noChangeText}>No change since last update</Text>
                )}
              </View>
              <View style={styles.priceCardRight}>
                <Text style={styles.priceAmount}>₹{item.price}</Text>
                <Text style={styles.priceUnit}>per kg</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => onUpdatePrice(MOCK_PRICES[0]!)}
          activeOpacity={0.8}
        >
          <Icon name="edit" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Update a Price</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onBulkUpdate} activeOpacity={0.8}>
          <Icon name="description" size={16} color={P.darkBrown} />
          <Text style={styles.secondaryBtnText}>Bulk Update Prices</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onViewHistory(MOCK_PRICES[0]!)}
          activeOpacity={0.8}
        >
          <Icon name="trending_up" size={16} color={P.darkBrown} />
          <Text style={styles.secondaryBtnText}>View Price History</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedHeader: {
    backgroundColor: P.pageBg,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 4,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: P.lightGray,
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  tabsWrapper: {
    marginBottom: 4,
  },
  tabsScroll: {
    marginBottom: 8,
    marginHorizontal: -20,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  scrollIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 10,
    marginTop: 2,
  },
  scrollArrow: {
    fontSize: 16,
    color: '#8B8480',
    fontWeight: '400',
    lineHeight: 20,
  },
  scrollBarContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
  },
  scrollBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: '#D1CCC7',
    borderRadius: 1.5,
    overflow: 'visible',
  },
  scrollBar: {
    width: '100%',
    height: 3,
    backgroundColor: '#8B8480',
    borderRadius: 1.5,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    borderWidth: 1,
    borderColor: P.border,
  },
  tabActive: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.body,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  priceList: {
    gap: 12,
    marginBottom: 20,
  },
  priceCard: {
    flexDirection: 'row',
    backgroundColor: P.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: P.border,
  },
  priceCardLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  itemCategory: {
    fontSize: 12,
    color: P.lightGray,
    marginBottom: 6,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  changeGreen: {
    color: P.green,
  },
  changeRed: {
    color: P.red,
  },
  noChangeText: {
    fontSize: 11,
    color: P.lightGray,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: 'rgb(26, 26, 26)',
    lineHeight: 32,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceUnit: {
    fontSize: 11,
    color: P.lightGray,
    marginTop: -2,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
    lineHeight: 18,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: P.border,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.darkBrown,
    fontFamily: 'Manrope, system-ui, sans-serif',
    lineHeight: 18,
  },
});
