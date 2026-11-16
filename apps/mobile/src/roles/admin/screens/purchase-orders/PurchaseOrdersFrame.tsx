/**
 * The frame every Purchase Orders screen draws in: mobile-ui's SafeAreaView
 * and ScreenStatusBar, the design's orange header (back arrow, title, optional
 * subtitle, optional right-hand button, optional content under the title row
 * such as the history search), and Android's hardware back wired to the same
 * handler as the arrow.
 */
import React, { useEffect, useRef } from 'react';
import { BackHandler, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { BackArrowIcon } from './PurchaseOrderIcons';
import { styles } from './purchaseOrdersStyles';

/** Android hardware back: calls `handler` and consumes the press. */
export function useHardwareBack(handler: () => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      ref.current();
      return true;
    });
    return () => sub.remove();
  }, []);
}

export interface PurchaseOrdersFrameProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** The header's right-hand button (the filter); a spacer keeps the title placed when absent. */
  headerRight?: React.ReactNode;
  /** Drawn inside the header under the title row (the history search bar). */
  headerBelow?: React.ReactNode;
  children: React.ReactNode;
}

export function PurchaseOrdersFrame({ title, subtitle, onBack, headerRight, headerBelow, children }: PurchaseOrdersFrameProps) {
  useHardwareBack(onBack);
  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={[styles.headerRow, headerBelow ? styles.headerRowWithSearch : null]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('purchaseOrders.back')}
              testID="purchaseOrders.back"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
          </View>
          {headerRight ?? <View style={styles.headerRightSpacer} />}
        </View>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        {headerBelow}
      </View>
      {children}
    </SafeAreaView>
  );
}
