import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import Svg, { Path } from 'react-native-svg';

type TabName = 'Home' | 'Receiving' | 'Inventory' | 'More';

interface SWABottomNavProps {
  activeTab: TabName;
  onTabChange?: ((tab: TabName) => void) | undefined;
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 7v7.5M8.5 11.5L12 15l3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 18h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 18.5 4h-13z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M3 9.5h18" stroke={color} strokeWidth="1.8" />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* 9-dot grid rendered via Path */}
      <Path
        d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        fill={color}
      />
    </Svg>
  );
}

export function SWABottomNav({ activeTab, onTabChange }: SWABottomNavProps) {
  const tabs: { name: TabName; label: string; renderIcon: (active: boolean) => React.ReactNode }[] = [
    { name: 'Home', label: 'Home', renderIcon: (active) => <HomeTabIcon active={active} /> },
    { name: 'Receiving', label: 'Receiving', renderIcon: (active) => <ReceivingTabIcon active={active} /> },
    { name: 'Inventory', label: 'Inventory', renderIcon: (active) => <InventoryTabIcon active={active} /> },
    { name: 'More', label: 'More', renderIcon: (active) => <MoreTabIcon active={active} /> },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabChange?.(tab.name)}
            activeOpacity={0.7}
          >
            {tab.renderIcon(isActive)}
            <Text
              style={[
                styles.label,
                { color: isActive ? adminColors.brand : adminColors.muted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    ...adminType.caption,
    marginTop: 4,
  },
});

