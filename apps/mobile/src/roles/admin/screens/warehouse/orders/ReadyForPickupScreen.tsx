/**
 * Ready for Pickup — packed orders waiting at the counter for the customer.
 *
 * Design id: M5S09 (M5S09_ReadyForPickup).
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - Opening a card into pickup verification, and the bottom action that also
 *     starts verification: `order.pickup_otp.verify`. Without it the cards are
 *     plain, non-pressable rows and the bottom action is not rendered.
 * Both now open the pickup wizard (route 'M5S11') on its 'verify' step; the
 * old M5S10 route was folded into it.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { OrderScreenBaseProps } from './types';

export type ReadyForPickupScreenProps = OrderScreenBaseProps;

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z"
        stroke={adminColors.muted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PackageIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.buttonIcon}>
      <Path
        d="M21 8H3V4h18v4zM21 8v12H3V8"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 12h4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface ReadyOrder {
  id: string;
  customer: string;
  items: string;
  amount: string;
  time: string;
  packed: string;
}

const READY_ORDERS: ReadyOrder[] = [
  {
    id: 'ORD-1024',
    customer: 'Arun Kumar',
    items: '4 Items',
    amount: '₹850',
    time: 'Ready for 2h 15m',
    packed: 'Packed 11:15 AM',
  },
  {
    id: 'ORD-1023',
    customer: 'Priya',
    items: '5 Items',
    amount: '₹1,240',
    time: 'Ready for 3h 40m',
    packed: 'Packed 09:45 AM',
  },
];

function OrderCardBody({ order }: { order: ReadyOrder }) {
  return (
    <>
      <View style={styles.cardTopRow}>
        <Text style={styles.orderIdText}>{order.id}</Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{order.time}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{order.customer}</Text>

      <View style={styles.itemsPriceRow}>
        <Text style={styles.itemsText}>{order.items}</Text>
        <Text style={styles.amountText}>{order.amount}</Text>
      </View>

      <View style={styles.packedReadyRow}>
        <Text style={styles.packedTimeText}>{order.packed}</Text>
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>Ready</Text>
        </View>
      </View>
    </>
  );
}

export function ReadyForPickupScreen({ can, onBack, onNavigate }: ReadyForPickupScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const canVerify = can('order.pickup_otp.verify');

  const filteredOrders = READY_ORDERS.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ready for Pickup</Text>
        </View>

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>7 Orders</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.searchBox}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search order / customer"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {filteredOrders.map((order) =>
            canVerify ? (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S11', { orderId: order.id, step: 'verify' })}
              >
                <OrderCardBody order={order} />
              </TouchableOpacity>
            ) : (
              <View key={order.id} style={styles.orderCard}>
                <OrderCardBody order={order} />
              </View>
            )
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Label kept from the design; it opened pickup verification (old M5S10) with no order. */}
        {canVerify ? (
          <View style={styles.fixedBottomContainer}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S11', { step: 'verify' })}
            >
              <PackageIcon />
              <Text style={styles.primaryActionText}>New Packing</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const BACK_BUTTON_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  subtitleRow: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: adminColors.brand,
  },
  subtitleText: {
    ...adminType.rowTitle,
    // Was a translucent overlay; no translucent token, so solid onBrand.
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: 20,
  },
  searchBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: adminSpacing.lg,
    gap: 10,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    height: '100%',
  },
  orderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  timeBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  customerName: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 10,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemsText: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  packedReadyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packedTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
  },
  readyBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  readyBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  bottomSpacer: {
    height: 20,
  },
  fixedBottomContainer: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryActionButton: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    ...adminShadow.sm,
  },
  buttonIcon: {
    marginRight: adminSpacing.sm,
  },
  primaryActionText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
