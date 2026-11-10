/**
 * The farmers list's building blocks, as in the team design: the orange
 * header banner, the four KPI cards, the Farmers | Applications toggle, the
 * search box, the bottom navigation and the Load more link. No data and no
 * decisions here; see ./farmersListLogic.ts.
 */
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { FARMERS_KPI_CARDS, kpiValueText, type FarmersMainTab, type KpiCardSpec } from './farmersListLogic';
import {
  AlertIcon,
  BackArrowIcon,
  ClipboardIcon,
  FilterSlidersIcon,
  NavAuditsIcon,
  NavHomeIcon,
  NavMoreIcon,
  NavProduceIcon,
  SearchIcon,
  UsersIcon,
} from './FarmersListIcons';
import { styles } from './farmersListStyles';

// ─── Header ──────────────────────────────────────────────────────────────────

export interface FarmersListHeaderProps {
  title: string;
  onBack?: (() => void) | undefined;
  /** The filter button shows only when there is something to filter. */
  onFilterPress?: (() => void) | undefined;
}

export function FarmersListHeader({ title, onBack, onFilterPress }: FarmersListHeaderProps) {
  return (
    <View style={styles.headerBanner}>
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmersList.header.back')}
            testID="farmersList.back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
        ) : null}

        <View style={styles.headerTitleBox}>
          <UsersIcon size={24} color={adminColors.onBrand} />
          <View style={styles.headerTitleTextCol}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{t('farmersList.header.subtitle')}</Text>
          </View>
        </View>

        {onFilterPress ? (
          <TouchableOpacity
            style={styles.headerFilterBtn}
            onPress={onFilterPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('farmersList.header.filter')}
            testID="farmersList.filterButton"
          >
            <FilterSlidersIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── KPI row ─────────────────────────────────────────────────────────────────

function kpiIcon(icon: KpiCardSpec['icon']): React.ReactNode {
  if (icon === 'clipboard') return <ClipboardIcon size={18} color={adminColors.dashboard.overviewIcon} />;
  if (icon === 'alert') return <AlertIcon size={18} color={adminColors.dashboard.overviewIcon} />;
  return <UsersIcon size={18} color={adminColors.dashboard.overviewIcon} />;
}

export interface FarmersKpiRowProps {
  /** The Pending application card opens the Applications tab; undefined when the caller may not see it. */
  onPendingPress?: (() => void) | undefined;
}

/** The design's four cards. There is no count endpoint, so every value is the placeholder. */
export function FarmersKpiRow({ onPendingPress }: FarmersKpiRowProps) {
  return (
    <OverviewCardsGrid style={styles.kpiGrid}>
      {FARMERS_KPI_CARDS.map((card) => (
        <OverviewDashboardCard
          key={card.id}
          value={kpiValueText()}
          title={t(card.titleKey)}
          icon={kpiIcon(card.icon)}
          tone={card.tone}
          titlePosition="top"
          onPress={card.id === 'pending' ? onPendingPress : undefined}
        />
      ))}
    </OverviewCardsGrid>
  );
}

// ─── Farmers | Applications toggle ───────────────────────────────────────────

export interface FarmersTabToggleProps {
  active: FarmersMainTab;
  onChange: (tab: FarmersMainTab) => void;
}

const TABS: readonly { id: FarmersMainTab; labelKey: 'farmersList.tabs.farmers' | 'farmersList.tabs.applications' }[] = [
  { id: 'farmers', labelKey: 'farmersList.tabs.farmers' },
  { id: 'applications', labelKey: 'farmersList.tabs.applications' },
];

export function FarmersTabToggle({ active, onChange }: FarmersTabToggleProps) {
  return (
    <View style={styles.tabToggleContainer}>
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabToggleButton, selected && styles.tabToggleButtonActive]}
            onPress={() => onChange(tab.id)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            testID={`farmersList.tab.${tab.id}`}
          >
            <Text style={[styles.tabToggleText, selected && styles.tabToggleTextActive]}>{t(tab.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface FarmersSearchBarProps {
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  maxLength?: number | undefined;
}

export function FarmersSearchBar({ value, placeholder, onChangeText, maxLength }: FarmersSearchBarProps) {
  return (
    <View style={styles.searchBarRow}>
      <View style={styles.searchInputBox}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={adminColors.placeholder}
          value={value}
          onChangeText={onChangeText}
          maxLength={maxLength}
          autoCorrect={false}
          returnKeyType="search"
          testID="farmersList.search"
        />
      </View>
    </View>
  );
}

// ─── Load more ───────────────────────────────────────────────────────────────

export function LoadMoreLink({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.loadMore} onPress={onPress} accessibilityRole="button" testID="farmersList.loadMore">
      <Text style={styles.loadMoreText}>{t('farmersList.loadMore')}</Text>
    </TouchableOpacity>
  );
}

// ─── Bottom navigation ───────────────────────────────────────────────────────

/** The design's tabs (Home/Farmers/Produce/Audits/More) plus Dev's names, which the existing hosts still handle. */
export type FarmersListNavTab = 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More' | 'Dashboard' | 'Sales' | 'Reports' | 'Profile';

const NAV_ITEMS: readonly {
  tab: FarmersListNavTab;
  labelKey: 'farmersList.nav.home' | 'farmersList.nav.farmers' | 'farmersList.nav.produce' | 'farmersList.nav.audits' | 'farmersList.nav.more';
}[] = [
  { tab: 'Home', labelKey: 'farmersList.nav.home' },
  { tab: 'Farmers', labelKey: 'farmersList.nav.farmers' },
  { tab: 'Produce', labelKey: 'farmersList.nav.produce' },
  { tab: 'Audits', labelKey: 'farmersList.nav.audits' },
  { tab: 'More', labelKey: 'farmersList.nav.more' },
];

function navIcon(tab: FarmersListNavTab, color: string): React.ReactNode {
  if (tab === 'Farmers') return <UsersIcon size={20} color={color} />;
  if (tab === 'Produce') return <NavProduceIcon color={color} />;
  if (tab === 'Audits') return <NavAuditsIcon color={color} />;
  if (tab === 'More') return <NavMoreIcon color={color} />;
  return <NavHomeIcon color={color} />;
}

export function FarmersBottomNav({ onNavigateTab }: { onNavigateTab?: ((tab: FarmersListNavTab) => void) | undefined }) {
  return (
    <View style={styles.bottomNavContainer}>
      {NAV_ITEMS.map((item) => {
        const active = item.tab === 'Farmers';
        return (
          <TouchableOpacity
            key={item.tab}
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.(item.tab)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`farmersList.nav.${item.tab}`}
          >
            {navIcon(item.tab, active ? adminColors.brand : adminColors.muted)}
            <Text style={[styles.navTabLabel, active && styles.navTabLabelActive]}>{t(item.labelKey)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
