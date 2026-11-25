/**
 * The frame every Market & Pricing view-only screen draws in: Dev's
 * mobile-ui SafeAreaView and ScreenStatusBar (kept exactly as Dev's screens
 * use them; the design had reverted them to react-native's), the design's
 * orange header banner, and a scroll body with optional pull to refresh.
 * Dev's three pricing screens had no Android BackHandler, so none is added;
 * the host's back handling is unchanged.
 */
import React from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { BackArrowIcon } from './PricingIcons';
import { styles } from './pricingStyles';

export interface PricingFrameProps {
  title: string;
  subtitle?: string | undefined;
  /** Drawn before the title (the home's price tag). */
  titleIcon?: React.ReactNode;
  onBack?: (() => void) | undefined;
  /** Header buttons on the right (filters, notifications). */
  headerRight?: React.ReactNode;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** Drawn outside the scroll body (bottom sheets). */
  overlay?: React.ReactNode;
  children: React.ReactNode;
}

export function PricingFrame({
  title,
  subtitle,
  titleIcon,
  onBack,
  headerRight,
  onRefresh,
  isRefreshing = false,
  overlay,
  children,
}: PricingFrameProps) {
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
              accessibilityLabel={t('pricingCeiling.back')}
              testID="pricingCeiling.back"
            >
              <BackArrowIcon />
            </TouchableOpacity>
          ) : null}
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerTitleRow}>
              {titleIcon}
              <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
                {title}
              </Text>
            </View>
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
