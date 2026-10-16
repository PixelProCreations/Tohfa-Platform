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
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── Exact Google Material Symbols ───────────────────────────────────────────

// 1. Eco Leaf Icon (Header Left) — Exact Material Symbols eco
function LeafIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M216-176q-45-45-70.5-104T120-402q0-63 24-124.5T222-642q35-35 86.5-60t122-39.5Q501-756 591.5-759t202.5 7q8 106 5 195t-16.5 160.5q-13.5 71.5-38 125T684-182q-53 53-112.5 77.5T450-80q-65 0-127-25.5T216-176Zm112-16q29 17 59.5 24.5T450-160q46 0 91-18.5t86-59.5q18-18 36.5-50.5t32-85Q709-426 716-500.5t2-177.5q-49-2-110.5-1.5T485-670q-61 9-116 29t-90 55q-45 45-62 89t-17 85q0 59 22.5 103.5T262-246q42-80 111-153.5T534-520q-72 63-125.5 142.5T328-192Zm0 0Zm0 0Z"
        fill={color}
      />
    </Svg>
  );
}

// 2. Bell Notification Icon (Header Right)
function BellIcon({ size = 19, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 3. Back Arrow Icon
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

// 4. Box / Package Icon (Approved Inputs) — Exact Material Symbols inventory_2
function PackageBoxIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M200-80q-33 0-56.5-23.5T120-160v-451q-18-11-29-28.5T80-680v-120q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v120q0 23-11 40.5T840-611v451q0 33-23.5 56.5T760-80H200Zm0-520v440h560v-440H200Zm-40-80h640v-120H160v120Zm200 280h240v-80H360v80Zm120 20Z"
        fill={color}
      />
    </Svg>
  );
}

// 5. Bug / Beetle Icon (Pest Library & Recent Activity) — Exact Material Symbols pest_control
function BugIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M480-120q-64 0-114.5-33T283-240l-95 54-40-69 103-60q-3-11-5-22.5t-4-22.5H120v-80h122q2-12 4-23.5t5-22.5l-103-60 40-69 94 55q8-14 18.5-27.5T322-612q-2-7-2-14v-14q0-24 7-46t19-41l-66-66 56-57 70 68q17-9 35.5-13.5T480-800q20 0 39 5t36 14l69-69 56 57-66 66q12 19 18.5 41t6.5 46v13.5q0 6.5-2 13.5 11 11 21.5 25t18.5 28l95-54 40 69-104 59q3 11 5.5 22.5T718-440h122v80H718q-2 12-4 23.5t-5 22.5l103 60-40 69-95-55q-32 54-82.5 87T480-120Zm-76-546q17-7 36.5-10.5T480-680q20 0 38.5 3t35.5 10q-8-23-28-38t-46-15q-26 0-47 15.5T404-666Zm76 466q73 0 116.5-61T640-400q0-70-40.5-135T480-600q-78 0-119 64.5T320-400q0 78 43.5 139T480-200Zm-40-80v-240h80v240h-80Z"
        fill={color}
      />
    </Svg>
  );
}

// 6. Open Book Icon (Application Guides) — Exact Material Symbols menu_book
function BookIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M560-564v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59ZM280-494Z"
        fill={color}
      />
    </Svg>
  );
}

// 7. Warning Triangle Icon (Pest Incidents) — Exact Material Symbols warning
function WarningTriangleIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"
        fill={color}
      />
    </Svg>
  );
}

export interface InputsPestHomeScreenProps {
  onBack: () => void;
  onNavigateApprovedInputs: () => void;
  onNavigatePestLibrary: () => void;
  onNavigateApplicationGuides?: (() => void) | undefined;
  onNavigatePestIncidents?: (() => void) | undefined;
  onViewRecentIncident?: (() => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
}

export function InputsPestHomeScreen({
  onBack,
  onNavigateApprovedInputs,
  onNavigatePestLibrary,
  onNavigateApplicationGuides,
  onNavigatePestIncidents,
  onViewRecentIncident,
  onOpenNotifications,
}: InputsPestHomeScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel={t('inputsPestHome.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <LeafIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('inputsPestHome.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel={t('inputsPestHome.notificationsLabel')}
          >
            <BellIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: 34 }]}>
          {t('inputsPestHome.subtitle')}
        </Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 Metric KPI Grid ─── */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={onNavigateApprovedInputs}
              activeOpacity={0.8}
              accessibilityLabel={t('inputsPestHome.kpi.approvedInputs')}
            >
              <Text style={styles.kpiLabel}>{t('inputsPestHome.kpi.approvedInputs')}</Text>
              <Text style={styles.kpiValueDark}>48</Text>
            </TouchableOpacity>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{t('inputsPestHome.kpi.inputCategories')}</Text>
              <Text style={styles.kpiValueDark}>8</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={onNavigatePestLibrary}
              activeOpacity={0.8}
              accessibilityLabel={t('inputsPestHome.kpi.pestLibrary')}
            >
              <Text style={styles.kpiLabel}>{t('inputsPestHome.kpi.pestLibrary')}</Text>
              <Text style={styles.kpiValueDark}>32</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiCard}
              onPress={onNavigatePestIncidents}
              activeOpacity={0.8}
              accessibilityLabel={t('inputsPestHome.kpi.pestIncidents')}
            >
              <Text style={styles.kpiLabel}>{t('inputsPestHome.kpi.pestIncidents')}</Text>
              <Text style={[styles.kpiValueDark, { color: adminColors.warning.text }]}>12</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Section: Quick Actions ─── */}
        <Text style={styles.sectionHeading}>{t('inputsPestHome.section.quickActions')}</Text>

        <View style={styles.quickGrid}>
          {/* Row 1: Approved Inputs & Pest Library */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateApprovedInputs}
              activeOpacity={0.8}
            >
              <PackageBoxIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('inputsPestHome.quickAction.approvedInputs')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigatePestLibrary}
              activeOpacity={0.8}
            >
              <BugIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('inputsPestHome.quickAction.pestLibrary')}</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Full-width Pest Incidents */}
          <TouchableOpacity
            style={styles.quickCardFull}
            onPress={onNavigatePestIncidents ?? onNavigatePestLibrary}
            activeOpacity={0.8}
          >
            <WarningTriangleIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickCardLabel}>{t('inputsPestHome.quickAction.pestIncidents')}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Section: Recent Farmer Pest Activity ─── */}
        <Text style={styles.sectionHeading}>{t('inputsPestHome.section.recentActivity')}</Text>

        <TouchableOpacity
          style={styles.recentIncidentCard}
          onPress={onViewRecentIncident ?? onNavigatePestLibrary}
          activeOpacity={0.85}
        >
          {/* Left Orange Stripe Indicator */}
          <View style={styles.recentAccentBar} />

          <View style={styles.recentContent}>
            <View style={styles.recentTitleRow}>
              <BugIcon size={20} color={adminColors.brand} />
              <Text style={styles.recentOrderTitle}>Pest Incident #PEST-00421</Text>
            </View>

            <Text style={styles.recentSubline}>
              Farmer: Ramesh Kumar · Crop: Carrot · Pest: Aphid · Severity: Medium · Status: Ongoing
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 6,
    fontWeight: '500',
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // 2x2 Metric KPI Grid
  kpiGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.2,
    marginBottom: adminSpacing.xs,
  },
  kpiValueDark: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.5,
  },

  // Section Heading
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },

  // Quick Actions 2x2 Grid
  quickGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
  quickCardFull: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },

  // Recent Farmer Pest Activity Card
  recentIncidentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  recentAccentBar: {
    width: 4,
    backgroundColor: adminColors.brand,
  },
  recentContent: {
    flex: 1,
    padding: adminSpacing.md,
  },
  recentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: 6,
  },
  recentOrderTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  recentSubline: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 17,
  },
});
