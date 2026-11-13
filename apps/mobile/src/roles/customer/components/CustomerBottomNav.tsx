import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  customerColors,
  customerType,
  customerRadius,
  customerSpacing,
  CUSTOMER_BOTTOM_NAV_HEIGHT,
} from '../theme';

export type CustomerTabName = 'Home' | 'Explore' | 'Cart' | 'Profile';

export interface CustomerBottomNavProps {
  activeTab: CustomerTabName;
  onTabPress: (tab: CustomerTabName) => void;
  cartBadgeCount?: number;
  style?: StyleProp<ViewStyle>;
}

interface TabConfig {
  name: CustomerTabName;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { name: 'Home', label: 'Home', icon: '🏠' },
  { name: 'Explore', label: 'Explore', icon: '🔍' },
  { name: 'Cart', label: 'Cart', icon: '🛒' },
  { name: 'Profile', label: 'Profile', icon: '👤' },
];

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  activeTab,
  onTabPress,
  cartBadgeCount = 0,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            activeOpacity={0.7}
            onPress={() => onTabPress(tab.name)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label} tab`}
          >
            <View style={[styles.iconPill, isActive && styles.activePill]}>
              <Text style={styles.icon}>{tab.icon}</Text>
              {tab.name === 'Cart' && cartBadgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartBadgeCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? customerColors.brand : customerColors.secondary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: CUSTOMER_BOTTOM_NAV_HEIGHT,
    backgroundColor: customerColors.white,
    borderTopWidth: 1,
    borderTopColor: customerColors.borderDecorative,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: customerSpacing[12],
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconPill: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: customerRadius.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    position: 'relative',
  },
  activePill: {
    backgroundColor: customerColors.surfaceSelected,
  },
  icon: {
    fontSize: 20,
  },
  tabLabel: {
    ...customerType.meta,
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: customerColors.status.error.text,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: customerColors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});

