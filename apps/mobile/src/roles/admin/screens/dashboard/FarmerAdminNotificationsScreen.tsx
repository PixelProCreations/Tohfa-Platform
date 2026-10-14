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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { t } from '../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProduceOutlineIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="6.8" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7.2C12 5.5 13 4 14.5 4M12 7.2C12 5.5 11 4 9.5 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CalendarOutlineIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M16 2.5v4M8 2.5v4M3.5 10h17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ScalesOutlineIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v18M5 7l7-2 7 2M5 7l-3 6h6L5 7zm14 0l-3 6h6l-3-6zM3 21h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface FarmerAdminNotificationsScreenProps {
  onBack: () => void;
  onViewListing?: () => void;
  onViewAudit?: () => void;
  onViewDispute?: () => void;
}

export function FarmerAdminNotificationsScreen({
  onBack,
  onViewListing,
  onViewAudit,
  onViewDispute,
}: FarmerAdminNotificationsScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('farmerAdminNotifications.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: New produce listing requires review */}
        <View style={styles.notificationCard}>
          <View style={styles.leftAccentStripe} />
          <View style={styles.cardContent}>
            <View style={styles.headerFlexRow}>
              <View style={styles.iconBox}>
                <ProduceOutlineIcon size={22} color={adminColors.brand} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>New produce listing requires review</Text>
                <Text style={styles.cardMeta}>Tomato — Grade 1 · Farmer: Ramesh · 10 minutes ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkTouch}
              onPress={onViewListing}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>{t('farmerAdminNotifications.viewListing')} →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Farm audit support required */}
        <View style={styles.notificationCard}>
          <View style={styles.leftAccentStripe} />
          <View style={styles.cardContent}>
            <View style={styles.headerFlexRow}>
              <View style={styles.iconBox}>
                <CalendarOutlineIcon size={22} color={adminColors.brand} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>Farm audit support required</Text>
                <Text style={styles.cardMeta}>Farmer: Selvi · 04 Oct 2026</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkTouch}
              onPress={onViewAudit}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>{t('farmerAdminNotifications.viewAudit')} →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 3: Farmer dispute requires attention */}
        <View style={styles.notificationCard}>
          <View style={styles.leftAccentStripe} />
          <View style={styles.cardContent}>
            <View style={styles.headerFlexRow}>
              <View style={styles.iconBox}>
                <ScalesOutlineIcon size={22} color={adminColors.brand} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>Farmer dispute requires attention</Text>
                <Text style={styles.cardMeta}>DSP-00128 · 1 hour ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkTouch}
              onPress={onViewDispute}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>{t('farmerAdminNotifications.viewDispute')} →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  notificationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...adminShadow.sm,
  },
  leftAccentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: adminColors.brand,
  },
  cardContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    paddingLeft: adminSpacing.lg + 2,
  },
  headerFlexRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
  },
  iconBox: {
    width: 28,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  cardMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  linkTouch: {
    alignSelf: 'flex-start',
    marginTop: adminSpacing.sm,
    marginLeft: 40,
  },
  linkText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
