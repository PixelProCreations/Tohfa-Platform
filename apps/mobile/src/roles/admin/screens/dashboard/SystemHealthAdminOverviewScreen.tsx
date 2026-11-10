/**
 * System Health & Administration Overview Screen (SA-M2-S11)
 * Administrative control panel for system metrics, admin management, and system logs.
 */
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

import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  OverviewActionCard,
  OverviewCardsGrid,
  OverviewDashboardCard,
  OverviewSectionHeader,
} from '../../components/OverviewDashboardCard';

export interface SystemHealthAdminOverviewScreenProps {
  can?: (code: string) => boolean;
  onBack: () => void;
  onNavigateSubScreen?: (subscreen: string) => void;
}

export function SystemHealthAdminOverviewScreen({
  can,
  onBack,
  onNavigateSubScreen,
}: SystemHealthAdminOverviewScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={adminColors.onBrand}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System health & Administration</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Health Cards */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="System Status"
            value="Operational"
            subtitle="All services healthy"
            icon="clipboard"
          />
          <OverviewDashboardCard
            title="Active Admins"
            value="14"
            subtitle="Across 3 tiers"
            icon="truck"
          />
          <OverviewDashboardCard
            title="API Latency"
            value="48 ms"
            subtitle="p95 average"
            icon="orders"
          />
          <OverviewDashboardCard
            title="Sync Errors"
            value="0"
            subtitle="Past 24 hours"
            icon="alert"
          />
        </OverviewCardsGrid>

        {/* Quick Access Actions */}
        <OverviewSectionHeader title="Administration Actions" />
        <OverviewCardsGrid style={styles.actionsGrid}>
          <OverviewActionCard
            title="Manage Admins"
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={adminColors.brandDeep} strokeWidth="2" strokeLinecap="round" />
                <Circle cx="9" cy="7" r="4" stroke={adminColors.brandDeep} strokeWidth="2" />
              </Svg>
            }
            onPress={() => onNavigateSubScreen?.('manage_admins')}
          />
          <OverviewActionCard
            title="Permissions Matrix"
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="3" width="18" height="18" rx="2" stroke={adminColors.brandDeep} strokeWidth="2" />
                <Path d="M3 9h18M9 21V9" stroke={adminColors.brandDeep} strokeWidth="2" />
              </Svg>
            }
            onPress={() => onNavigateSubScreen?.('permissions_matrix')}
          />
          <OverviewActionCard
            title="Audit Logs"
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={adminColors.brandDeep} strokeWidth="2" />
                <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={adminColors.brandDeep} strokeWidth="2" />
              </Svg>
            }
            onPress={() => onNavigateSubScreen?.('system_audit_logs')}
          />
          <OverviewActionCard
            title="System Settings"
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="3" stroke={adminColors.brandDeep} strokeWidth="2" />
                <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={adminColors.brandDeep} strokeWidth="2" />
              </Svg>
            }
            onPress={() => onNavigateSubScreen?.('system_config')}
          />
        </OverviewCardsGrid>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: 40,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  actionsGrid: {
    marginTop: adminSpacing.xs,
  },
});

