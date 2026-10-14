/**
 * Module 7 Home — Market & Pricing Menu
 * Navigation hub for Fair Price Ceilings, Market Day Schedule, and Listing Approval Queue
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
};

interface MarketPricingHomeScreenProps {
  onBack: () => void;
  onNavigateToFairPrice: () => void;
  onNavigateToMarketDay: () => void;
  onNavigateToListingApproval: () => void;
}

export function MarketPricingHomeScreen({
  onBack,
  onNavigateToFairPrice,
  onNavigateToMarketDay,
  onNavigateToListingApproval,
}: MarketPricingHomeScreenProps) {
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>Market & Pricing</Text>
        <Text style={styles.subtitle}>
          Manage fair prices, market days and listing approvals
        </Text>

        {/* Menu Options */}
        <View style={styles.menuList}>
          {/* Fair Price Ceilings */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToFairPrice}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.orangeBg }]}>
              <Icon name="credit_card" size={24} color={P.orange} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Fair Price Ceilings</Text>
              <Text style={styles.menuDescription}>View and manage crop prices</Text>
            </View>
            <Icon name="chevron_right" size={20} color={P.muted} />
          </TouchableOpacity>

          {/* Market Day Schedule */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToMarketDay}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.orangeBg }]}>
              <Icon name="calendar_month" size={24} color={P.orange} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Market Day Schedule</Text>
              <Text style={styles.menuDescription}>Configure market day dates</Text>
            </View>
            <Icon name="chevron_right" size={20} color={P.muted} />
          </TouchableOpacity>

          {/* Listing Approval Queue */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToListingApproval}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.orangeBg }]}>
              <Icon name="badge" size={24} color={P.orange} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Listing Approval Queue</Text>
              <Text style={styles.menuDescription}>Review pending listings</Text>
            </View>
            <Icon name="chevron_right" size={20} color={P.muted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 8,
    letterSpacing: -0.4,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 14,
    color: P.lightGray,
    marginBottom: 32,
    lineHeight: 20,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  menuList: {
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 4,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  menuDescription: {
    fontSize: 13,
    color: P.muted,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
