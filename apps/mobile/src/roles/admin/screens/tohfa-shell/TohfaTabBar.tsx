/**
 * The Tohfa Admin bottom tab bar, ported from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "BOTTOM NAVIGATION BAR"):
 * a row of icon + caption buttons, the active one in `brand` with a bold
 * label, the rest in `muted`. Which tabs it draws comes from
 * visibleTohfaTabs(): Home · Work Queue · Inventory · Finance · More.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t, type TranslationKey } from '../../i18n';
import { adminColors } from '../../theme';
import { TOHFA_TAB_ICONS } from './tohfaTabBarIcons';
import { tohfaShellStyles as styles } from './tohfaShellStyles';
import { visibleTohfaTabs, type TohfaShellTab } from './tohfaShellRoutes';

const TAB_LABEL_KEYS: Record<TohfaShellTab, TranslationKey> = {
  Home: 'tohfaShell.tab.home',
  WorkQueue: 'tohfaShell.tab.workQueue',
  Inventory: 'tohfaShell.tab.inventory',
  Finance: 'tohfaShell.tab.finance',
  More: 'tohfaShell.tab.more',
};

export interface TohfaTabBarProps {
  activeTab: TohfaShellTab;
  onSelect: (tab: TohfaShellTab) => void;
  /** Defaults to the design's tabs minus TOHFA_HIDDEN_TABS. */
  tabs?: readonly TohfaShellTab[] | undefined;
}

export function TohfaTabBar({ activeTab, onSelect, tabs = visibleTohfaTabs() }: TohfaTabBarProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const active = tab === activeTab;
        const Icon = TOHFA_TAB_ICONS[tab];
        const label = t(TAB_LABEL_KEYS[tab]);
        return (
          <TouchableOpacity
            key={tab}
            testID={`tohfaShell.tab.${tab}`}
            style={styles.navTabItem}
            onPress={() => onSelect(tab)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
          >
            <Icon color={active ? adminColors.brand : adminColors.muted} />
            <Text style={[styles.navTabLabel, active && styles.navTabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
