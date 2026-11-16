/**
 * The frame of the Market & Pricing 2B screens: Dev's mobile-ui SafeAreaView
 * and ScreenStatusBar (the design imported them from react-native, which
 * reverts a Dev fix), the design's orange header banner, a scroll body with
 * optional pull to refresh, and the Android hardware back.
 *
 * Hardware back: `onHardwareBack` runs first (e.g. close the open edit
 * drawer) and returns true when it handled the press; otherwise `onBack` is
 * called. With neither, the press falls through to the host.
 */
import React, { useEffect } from 'react';
import { BackHandler, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { BackArrowIcon } from './PricingIcons';
import { frameStyles as styles } from './pricingFrameStyles';

export interface PricingScreenFrameProps {
  title: string;
  subtitle?: string | undefined;
  onBack?: (() => void) | undefined;
  onHardwareBack?: (() => boolean) | undefined;
  /** Drawn at the right of the header (the design's round filter button). */
  headerRight?: React.ReactNode;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** Drawn outside the scroll body (bottom sheets). */
  overlay?: React.ReactNode;
  /** testID prefix of the back button. */
  testIdPrefix: string;
  children: React.ReactNode;
}

export function PricingScreenFrame({
  title,
  subtitle,
  onBack,
  onHardwareBack,
  headerRight,
  onRefresh,
  isRefreshing = false,
  overlay,
  testIdPrefix,
  children,
}: PricingScreenFrameProps) {
  useEffect(() => {
    if (onBack === undefined && onHardwareBack === undefined) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onHardwareBack !== undefined && onHardwareBack()) return true;
      if (onBack === undefined) return false;
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, onHardwareBack]);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('pricingRetail.back')}
              testID={`${testIdPrefix}.back`}
            >
              <BackArrowIcon />
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
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
      {overlay}
    </SafeAreaView>
  );
}
