import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ProductImages } from '../assets/images/products';

export interface OrderHistoryScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchSvg = ({ color = '#9CA3AF', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={1.8} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ChevronRightSvg = ({ color = '#9CA3AF', size = 15 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Screen 69 · My Orders / Recent Orders
 * Pixel-perfect implementation from Figma.
 */
export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const group1Orders = [
    {
      id: 'ord-1',
      title: 'Royal Gala',
      orderNumber: 'ORD-20261105-0039',
      date: '06/11/2026',
      badge: 'Arrive Tomorrow',
      image: ProductImages.fruitApple,
    },
    {
      id: 'ord-2',
      title: 'Red Tomato',
      orderNumber: 'ORD-20261105-0039',
      date: '06/11/2026',
      badge: 'Arrive Tomorrow',
      image: ProductImages.foryouTomatoes,
    },
    {
      id: 'ord-3',
      title: 'Yellow Cherry Tomato',
      orderNumber: 'ORD-20261105-0039',
      date: '06/11/2026',
      badge: 'Arrive Tomorrow',
      image: ProductImages.foryouTomatoes,
    },
  ];

  const group2Orders = [
    {
      id: 'ord-4',
      title: 'Fresh Carrot',
      orderNumber: 'ORD-20261023-0856',
      actionText: 'View details',
      image: ProductImages.vegCarrot,
    },
    {
      id: 'ord-5',
      title: 'Cabbage',
      orderNumber: 'ORD-20261023-0856',
      actionText: 'View details',
      image: ProductImages.foryouLettuce,
    },
    {
      id: 'ord-6',
      title: 'Cauliflower',
      orderNumber: 'ORD-20261023-0856',
      actionText: 'View details',
      image: ProductImages.vegCauliflower,
    },
  ];

  const filteredGroup1 = group1Orders.filter(o =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroup2 = group2Orders.filter(o =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel="Back"
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── SEARCH BAR ──────────────────────────────────────────────────────── */}
        <View style={[styles.searchBox, customerShadow.subtle]}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={customerColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <SearchSvg color={customerColors.muted} size={18} />
        </View>

        {/* ── SECTION TITLE: RESENT ORDERS ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Resent Orders</Text>

        {/* ── GROUP 1: 05/11/2026 ──────────────────────────────────────────────── */}
        <Text style={styles.dateHeader}>05/11/2026</Text>
        <View style={styles.ordersList}>
          {filteredGroup1.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onNavigate?.('OrderTracking', { orderId: item.orderNumber })}
              style={styles.orderRow}
              accessibilityLabel={item.title}
            >
              <Image source={item.image} style={styles.productThumb} resizeMode="contain" />
              <View style={styles.orderInfoCol}>
                <Text style={styles.productName}>{item.title}</Text>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              </View>
              <View style={styles.orderRightCol}>
                <Text style={styles.deliveryDate}>{item.date}</Text>
                <View style={styles.arrivePill}>
                  <Text style={styles.arrivePillText}>{item.badge}</Text>
                </View>
              </View>
              <ChevronRightSvg color="#9CA3AF" size={15} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── GROUP 2: 23/10/2026 ──────────────────────────────────────────────── */}
        <Text style={[styles.dateHeader, { marginTop: customerSpacing.lg }]}>23/10/2026</Text>
        <View style={styles.ordersList}>
          {filteredGroup2.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onNavigate?.('OrderTracking', { orderId: item.orderNumber })}
              style={styles.orderRow}
              accessibilityLabel={item.title}
            >
              <Image source={item.image} style={styles.productThumb} resizeMode="contain" />
              <View style={styles.orderInfoCol}>
                <Text style={styles.productName}>{item.title}</Text>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              </View>
              <View style={styles.viewDetailsRow}>
                <Text style={styles.viewDetailsText}>{item.actionText}</Text>
                <ChevronRightSvg color={customerColors.body} size={13} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: customerRadius.pill,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
    marginTop: 20,
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 12,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginBottom: 10,
  },
  ordersList: {
    gap: 14,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  productThumb: {
    width: 36,
    height: 36,
  },
  orderInfoCol: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  orderNumber: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  orderRightCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  deliveryDate: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  arrivePill: {
    backgroundColor: '#EDF8EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: customerRadius.pill,
  },
  arrivePillText: {
    fontSize: 10,
    color: customerColors.brand,
    fontFamily: customerFonts.regular,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
});
