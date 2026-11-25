/**
 * The farmers list frame: Dev's mobile-ui SafeAreaView and ScreenStatusBar
 * (kept exactly as Dev uses them), the design's orange header banner, a
 * scroll body with pull to refresh, and the optional bottom navigation.
 * Dev's list screen had no Android BackHandler, so none is added here; the
 * host's back handling is unchanged.
 */
import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { adminColors } from '../../../theme';
import { FarmersBottomNav, FarmersListHeader, type FarmersListNavTab } from './FarmersListParts';
import { styles } from './farmersListStyles';

export interface FarmersListLayoutProps {
  title: string;
  onBack?: (() => void) | undefined;
  onFilterPress?: (() => void) | undefined;
  showBottomNav: boolean;
  onNavigateTab?: ((tab: FarmersListNavTab) => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** Drawn outside the scroll body (the filter modal). */
  overlay?: React.ReactNode;
  children: React.ReactNode;
}

export function FarmersListLayout({
  title,
  onBack,
  onFilterPress,
  showBottomNav,
  onNavigateTab,
  onRefresh,
  isRefreshing = false,
  overlay,
  children,
}: FarmersListLayoutProps) {
  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <FarmersListHeader title={title} onBack={onBack} onFilterPress={onFilterPress} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {showBottomNav ? <FarmersBottomNav onNavigateTab={onNavigateTab} /> : null}
      {overlay}
    </SafeAreaView>
  );
}
