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
import { adminColors } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  muted: adminColors.muted,
  brandOrange: adminColors.brand,
  orangeLink: adminColors.brandDeep,
};

// ─── SVG Icons Matching Exact Mockup ─────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// Produce / Tomato Icon
function ProduceOutlineIcon({ size = 22, color = THEME.brandOrange }: { size?: number; color?: string }) {
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

// Calendar Icon
function CalendarOutlineIcon({ size = 22, color = THEME.brandOrange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M16 2.5v4M8 2.5v4M3.5 10h17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Scales of Justice Icon
function ScalesOutlineIcon({ size = 22, color = THEME.brandOrange }: { size?: number; color?: string }) {
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Notifications with Back Arrow ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
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
                <ProduceOutlineIcon size={22} color="#C85A32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>New produce listing requires review</Text>
                <Text style={styles.cardMeta}>Tomato — Grade 1 · Farmer: Ramesh · 10 minutes ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkTouch}
              onPress={onViewListing}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>View Listing →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Farm audit support required */}
        <View style={styles.notificationCard}>
          <View style={styles.leftAccentStripe} />
          <View style={styles.cardContent}>
            <View style={styles.headerFlexRow}>
              <View style={styles.iconBox}>
                <CalendarOutlineIcon size={22} color="#C85A32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Farm audit support required</Text>
                <Text style={styles.cardMeta}>Farmer: Selvi · 04 Oct 2026</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkTouch}
              onPress={onViewAudit}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>View Audit →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 3: Farmer dispute requires attention */}
        <View style={styles.notificationCard}>
          <View style={styles.leftAccentStripe} />
          <View style={styles.cardContent}>
            <View style={styles.headerFlexRow}>
              <View style={styles.iconBox}>
                <ScalesOutlineIcon size={22} color="#C85A32" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Farmer dispute requires attention</Text>
                <Text style={styles.cardMeta}>DSP-00128 · 1 hour ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.linkTouch}
              onPress={onViewDispute}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>View Dispute →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Screenshot 4 Exact UI ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: THEME.brandOrange,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    paddingLeft: 18,
  },
  headerFlexRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 28,
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
  },
  linkTouch: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 40,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.orangeLink,
  },
});
