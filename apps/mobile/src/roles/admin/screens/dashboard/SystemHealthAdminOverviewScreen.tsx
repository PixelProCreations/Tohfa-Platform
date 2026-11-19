/**
 * System Health & Administration Overview Screen (SA-M2-S11), ported from the
 * Super Admin design (origin/Superadmin-main
 * screens/dashboard/SystemHealthAdminOverviewScreen.tsx).
 *
 * All four KPI tiles and all four administration actions are always drawn.
 * Real data is limited to what the API exposes:
 *   System status  GET /healthz (public liveness: the process answers, which is
 *                  all it proves; it does not check Postgres or Redis)
 *   API latency    the client-measured round trip of that same probe
 * Active admins and sync errors have no endpoint, so they carry the dash.
 *
 * The action tiles open through the host's `onNavigateSubScreen`. Audit Logs
 * and System Settings are disabled (still drawn) without their rbac code.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { BackArrowIcon, ClipboardListIcon } from '../../components/AdminIcons';
import { OverviewCardsGrid, OverviewDashboardCard, OverviewSectionHeader } from '../../components/OverviewDashboardCard';
import { OverviewActionCard } from '../../components/OverviewSuperAdminCards';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { checkHealth } from '../../api/health';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

export interface SystemHealthAdminOverviewScreenProps {
  /** Permission check from /auth/me. Missing disables the gated action tiles (fail closed). */
  can?: Can | undefined;
  onBack: () => void;
  onNavigateSubScreen?: ((subscreen: string) => void) | undefined;
}

const MODULE = 'saHealth';
/** docs/rbac.json codes for the two action tiles that have one. */
const AUDIT_LOG_CODE = 'auditlog.view';
const SYSTEM_CONFIG_CODE = 'system.config.manage';
const BACK_SIZE = adminSpacing.xxl + adminSpacing.xs;
const BACK_ICON_SIZE = adminSpacing.lg + adminSpacing.xs + adminSpacing.xs;
const ACTION_ICON_SIZE = adminSpacing.lg + adminSpacing.xs;
const KPI_ICON_SIZE = adminSpacing.lg + adminSpacing.xs;

export function SystemHealthAdminOverviewScreen({ can, onBack, onNavigateSubScreen }: SystemHealthAdminOverviewScreenProps) {
  const has = (code: string): boolean => typeof can === 'function' && can(code);
  // /healthz is public and no rbac code covers system health, so the probe always runs.
  const health = useAdminQuery(adminKeys.scoped(MODULE, undefined, { resource: 'health' }), (signal) => checkHealth(signal));

  const answered = health.data !== undefined;
  const up = health.data?.ok === true;
  let statusValue = ADMIN_NO_VALUE;
  let statusSubtitle: string | undefined;
  if (answered) {
    statusValue = up ? t('saHealth.status.operational') : t('saHealth.status.degraded');
    statusSubtitle = up ? t('saHealth.status.sub.ok') : t('saHealth.status.sub.bad');
  } else if (health.isError) {
    statusValue = t('saHealth.status.unreachable');
    statusSubtitle = t('saHealth.status.sub.bad');
  }
  const latencyValue = health.data !== undefined ? t('saHealth.latency.value', { ms: String(health.data.latencyMs) }) : ADMIN_NO_VALUE;

  const nav = (id: string): (() => void) | undefined => (onNavigateSubScreen ? () => onNavigateSubScreen(id) : undefined);
  const stroke = adminColors.brandDeep;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="saHealth.back"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saHealth.back')}
        >
          <BackArrowIcon size={BACK_ICON_SIZE} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saHealth.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Health Cards */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title={t('saHealth.kpi.status')}
            value={statusValue}
            subtitle={statusSubtitle}
            icon={<ClipboardListIcon size={KPI_ICON_SIZE} color={adminColors.brandDeep} />}
          />
          <OverviewDashboardCard
            title={t('saHealth.kpi.admins')}
            value={ADMIN_NO_VALUE}
            subtitle={t('saHealth.kpi.admins.sub')}
            icon="truck"
          />
          <OverviewDashboardCard
            title={t('saHealth.kpi.latency')}
            value={latencyValue}
            subtitle={t('saHealth.kpi.latency.sub')}
            icon="orders"
          />
          <OverviewDashboardCard
            title={t('saHealth.kpi.syncErrors')}
            value={ADMIN_NO_VALUE}
            subtitle={t('saHealth.kpi.syncErrors.sub')}
            icon="alert"
          />
        </OverviewCardsGrid>

        {/* Quick Access Actions */}
        <OverviewSectionHeader title={t('saHealth.actions.heading')} actionLabel="" />
        <OverviewCardsGrid style={styles.actionsGrid}>
          <OverviewActionCard
            title={t('saHealth.actions.admins')}
            icon={
              <Svg width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} viewBox="0 0 24 24" fill="none">
                <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
                <Circle cx="9" cy="7" r="4" stroke={stroke} strokeWidth="2" />
              </Svg>
            }
            onPress={nav('manage_admins')}
          />
          <OverviewActionCard
            title={t('saHealth.actions.matrix')}
            icon={
              <Svg width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="3" width="18" height="18" rx="2" stroke={stroke} strokeWidth="2" />
                <Path d="M3 9h18M9 21V9" stroke={stroke} strokeWidth="2" />
              </Svg>
            }
            onPress={nav('permissions_matrix')}
          />
          <OverviewActionCard
            title={t('saHealth.actions.audit')}
            disabled={!has(AUDIT_LOG_CODE)}
            icon={
              <Svg width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} viewBox="0 0 24 24" fill="none">
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={stroke} strokeWidth="2" />
                <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={stroke} strokeWidth="2" />
              </Svg>
            }
            onPress={nav('system_audit_logs')}
          />
          <OverviewActionCard
            title={t('saHealth.actions.settings')}
            disabled={!has(SYSTEM_CONFIG_CODE)}
            icon={
              <Svg width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="2" />
                <Path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  stroke={stroke}
                  strokeWidth="2"
                />
              </Svg>
            }
            onPress={nav('system_config')}
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
    width: BACK_SIZE,
    height: BACK_SIZE,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl - adminSpacing.sm,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  actionsGrid: {
    marginTop: adminSpacing.xs,
  },
});
