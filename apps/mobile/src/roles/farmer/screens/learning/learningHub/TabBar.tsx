import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { TABS, TAB_LABEL_KEY } from './constants';
import type { TabType } from './data';
import { lh } from './i18n';
import { styles } from './styles';

interface Props {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onChange }: Props): React.JSX.Element {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onChange(tab)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {lh(TAB_LABEL_KEY[tab])}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
