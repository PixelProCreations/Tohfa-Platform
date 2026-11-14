import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import { useCart } from '../api/cart';
import { customerFonts, customerShadow } from '../theme';
import { neutral } from '@tohfa/design-tokens';
import Svg, { Path, Circle } from 'react-native-svg';
import flyingDeliveryBag from '../assets/images/flying_delivery_bag.png';

export const CartScreen = ({
  onNavigate,
  onBack,
}: {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onBack?: (() => void) | undefined;
}) => {
  const { data: cart } = useCart();
  const [timeLeft, setTimeLeft] = useState<string>('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate?.('Home');
    }
  };

  useEffect(() => {
    const lockExpiresAt = cart?.lockExpiresAt;
    if (!lockExpiresAt) {
      setTimeLeft('');
      return;
    }
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(lockExpiresAt).getTime();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cart?.lockExpiresAt]);

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (EXACT FIGMA SPEC: IMAGE 1) ─────────────────────────── */}
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
        <Text style={styles.headerTitle}>My cart</Text>
        {timeLeft ? <Text style={styles.timerText}>Reserved for: {timeLeft}</Text> : null}
      </View>

      {!hasItems ? (
        /* ── EMPTY CART STATE (EXACT FIGMA SPEC: 390 x 243 HUG - IMAGE 1) ──── */
        <View style={styles.emptyWrap}>
          <View style={styles.emptyCard}>
            <Image
              source={flyingDeliveryBag}
              style={styles.emptyBagImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Your previously bought items will show here
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onNavigate?.('Home')}
              style={styles.startShoppingBtn}
            >
              <Text style={styles.startShoppingBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── ACTIVE CART ITEMS LIST ─────────────────────────────────────────── */
        <View style={{ flex: 1 }}>
          <FlatList
            data={cart.items}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.itemRow, customerShadow.subtle]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>{item.qtyKg} kg</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.lineTotal}</Text>
              </View>
            )}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalText}>₹{cart.subtotal}</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutBtn} 
              onPress={() => onNavigate?.('Checkout')}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── FLOATING GREEN CART BUTTON (BOTTOM RIGHT - IMAGE 1) ───────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onNavigate?.('Home')}
        style={styles.floatingCartBtn}
        accessibilityLabel="Cart button"
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx={10} cy={20} r={1.5} fill="#FFFFFF" />
          <Circle cx={18} cy={20} r={1.5} fill="#FFFFFF" />
        </Svg>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  floatingCartBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2D6A4F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#2D6A4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  timerText: {
    fontSize: 13,
    color: '#D97706',
    marginLeft: 'auto',
    fontFamily: customerFonts.regular,
  },

  // ── EMPTY CART (390 x 243 HUG - IMAGE 4) ──────────────────────────────────
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyBagImage: {
    width: 140,
    height: 130,
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  startShoppingBtn: {
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startShoppingBtnText: {
    fontFamily: customerFonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  emptyText: {
    fontSize: 18,
    color: neutral('neutral500'),
  },

  // ── ACTIVE ITEMS ──────────────────────────────────────────────────────────
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemRow: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontFamily: customerFonts.bold,
    color: '#1F2937',
  },
  itemQty: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: customerFonts.regular,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: customerFonts.bold,
    color: '#1F2937',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: customerFonts.regular,
    color: '#6B7280',
  },
  totalText: {
    fontSize: 18,
    fontFamily: customerFonts.bold,
    color: '#1F2937',
  },
  checkoutBtn: {
    backgroundColor: '#2D6A4F',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: customerFonts.bold,
  },
});
