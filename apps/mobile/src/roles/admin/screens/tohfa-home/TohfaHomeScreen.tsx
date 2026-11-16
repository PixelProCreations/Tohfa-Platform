/**
 * The Tohfa Admin Home tab, standalone.
 *
 * Ported from the design (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen,
 * `activeTab === 'Home'`): brand header with bell and profile, the greeting
 * card, the KPI grid (shared OverviewDashboardCard), "Needs your attention",
 * the search bar with its filter button and date-range chip (and its modal),
 * quick actions, Operations / Sales & Finance / Warehouse summaries and
 * Recent activity, in the design's order and styles.
 *
 * Data (owner decision 2026-11-11): there is no Home summary endpoint yet, so
 * every figure is '—' and every list is an empty state; the design's figures,
 * names and dates were fixtures. The only real values are the user's name
 * (the `user` prop, from /auth/me) and today's date (the clock).
 *
 * Controls (owner decision 2026-11-11: every design control is present and
 * looks identical, wired or not). Navigation belongs to the host: each tap
 * target is a callback prop. A control is drawn when `can` grants its
 * docs/rbac.json code, or always when it has none; with no callback yet it
 * shows the "Not available yet" note instead of doing anything (see
 * tohfaHomeLogic.ts). Search text and the date range are local state only:
 * no Home search or summary endpoint exists, so figures stay '—'.
 * Data-driven, not dropped: the bell's unread dot shows only for a real
 * `unreadCount` above zero, and the design's fixture attention cards (with
 * their "View Audit" / "Review Exception" buttons) are an empty state.
 * Add Warehouse is left out of the quick actions by owner decision (BR-23b).
 */
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../components';
import { KpiClipboardIcon, KpiUsersIcon, QuickActionIcon } from './tohfaHomeIcons';
import {
  TOHFA_DEFAULT_DATE_RANGE,
  TOHFA_FINANCE_GATE,
  TOHFA_HEADER_GATES,
  TOHFA_HOME_COLLAPSED_COUNT,
  TOHFA_HOME_DASH,
  TOHFA_KPI_CARDS,
  TOHFA_OPS_GATE,
  TOHFA_REFRESH_GATE,
  TOHFA_SALES_GATE,
  TOHFA_SEARCH_FILTER_GATE,
  gatedHandler,
  tohfaDateRangeLabel,
  tohfaDateStamp,
  tohfaGreeting,
  tohfaHeaderDate,
  tohfaKpiViews,
  visibleTohfaActions,
  type TohfaDateRange,
  type TohfaHomeCallbacks,
  type TohfaKpiView,
} from './tohfaHomeLogic';
import {
  TohfaDateRangeModal,
  TohfaEmptyCard,
  TohfaGreetingCard,
  TohfaHomeHeader,
  TohfaSearchBar,
  TohfaSectionHeader,
  TohfaSummaryCard,
} from './tohfaHomeParts';
import { tohfaHomeStyles as styles } from './tohfaHomeStyles';

/**
 * Only the name is read from the user. Structural on purpose: /auth/me's
 * `UserMe` (roles/farmer/api/auth.ts) satisfies it, and importing that type
 * here would add a cross-role import (src/tests/cross_role_import_guard).
 */
export interface TohfaHomeUser {
  fullName?: string | undefined;
}

export interface TohfaHomeScreenProps extends TohfaHomeCallbacks {
  /** Permission check from /auth/me. Missing denies every gated control (fail closed). */
  can?: Can | undefined;
  /** The signed-in user (/auth/me). No user means the greeting carries no name. */
  user?: TohfaHomeUser | null | undefined;
  /** Unread notification count. No source yet, so the bell's dot stays hidden until one is passed. */
  unreadCount?: number | undefined;
  /** The clock, for tests. Defaults to now. */
  now?: Date | undefined;
}

/** Pressing a design control whose destination is not wired yet: a note, never a fake success. */
function showNotAvailable(): void {
  Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));
}

function kpiIcon(view: TohfaKpiView): React.ReactNode {
  if (view.icon === 'clipboard') return <KpiClipboardIcon />;
  if (view.icon === 'users') return <KpiUsersIcon />;
  return view.icon;
}

export function TohfaHomeScreen(props: TohfaHomeScreenProps) {
  const { can, user, unreadCount, now: nowProp } = props;
  const [showAllMetrics, setShowAllMetrics] = useState(false);
  const [showAllActions, setShowAllActions] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<TohfaDateRange>(TOHFA_DEFAULT_DATE_RANGE);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const now = nowProp ?? new Date();
  const dash = TOHFA_HOME_DASH;
  const press = (gate: Parameters<typeof gatedHandler>[0]) => gatedHandler(gate, can, props, showNotAvailable);

  const kpis = tohfaKpiViews(can, props, showAllMetrics, showNotAvailable);
  const actions = visibleTohfaActions(can, props, showNotAvailable);
  const shownActions = showAllActions ? actions : actions.slice(0, TOHFA_HOME_COLLAPSED_COUNT);
  const onOpenSales = press(TOHFA_SALES_GATE);
  const onOpenFinance = press(TOHFA_FINANCE_GATE);
  const onOpenOps = press(TOHFA_OPS_GATE);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TohfaHomeHeader
          dateText={tohfaHeaderDate(now)}
          unreadCount={unreadCount}
          onOpenNotifications={press(TOHFA_HEADER_GATES.notifications)}
          onOpenProfile={press(TOHFA_HEADER_GATES.profile)}
        />

        <TohfaGreetingCard
          greeting={tohfaGreeting(user?.fullName)}
          dateStamp={tohfaDateStamp(now)}
          onRefresh={press(TOHFA_REFRESH_GATE)}
        />

        <TohfaSearchBar
          query={searchQuery}
          onChangeQuery={setSearchQuery}
          onOpenFilter={press(TOHFA_SEARCH_FILTER_GATE)}
          rangeLabel={tohfaDateRangeLabel(dateRange)}
          onOpenRange={() => setShowDateRangeModal(true)}
        />

        <View style={styles.sectionContainer}>
          <OverviewCardsGrid>
            {kpis.map((item) => (
              <OverviewDashboardCard
                key={item.id}
                title={item.title}
                value={item.value}
                subtitle={item.subtitle}
                icon={kpiIcon(item)}
                tone={item.tone}
                titlePosition="bottom"
                onPress={item.onPress}
              />
            ))}
          </OverviewCardsGrid>
          {TOHFA_KPI_CARDS.length > TOHFA_HOME_COLLAPSED_COUNT ? (
            <TouchableOpacity
              testID="home.kpi.toggle"
              style={styles.toggleMetricsButton}
              onPress={() => setShowAllMetrics((prev) => !prev)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.toggleMetricsText}>
                {showAllMetrics ? t('tohfaHome.kpi.showFewer') : t('tohfaHome.kpi.showMore')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sectionContainer}>
          <TohfaSectionHeader title={t('tohfaHome.attention.title')} />
          <TohfaEmptyCard text={t('tohfaHome.attention.empty')} />
        </View>

        {actions.length > 0 ? (
          <View style={styles.sectionContainer}>
            <TohfaSectionHeader title={t('tohfaHome.actions.title')} />
            <View style={styles.quickActionsGrid}>
              {shownActions.map((qa) => (
                <TouchableOpacity
                  key={qa.id}
                  testID={`home.action.${qa.id}`}
                  style={styles.quickActionTile}
                  onPress={qa.onPress}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={qa.label}
                >
                  <View style={styles.quickActionIconBox}>
                    <QuickActionIcon name={qa.icon} />
                  </View>
                  <Text style={styles.quickActionTileLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {actions.length > TOHFA_HOME_COLLAPSED_COUNT ? (
              <TouchableOpacity
                testID="home.actions.toggle"
                style={styles.toggleActionsButton}
                onPress={() => setShowAllActions((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.toggleActionsText}>
                  {showAllActions ? t('tohfaHome.actions.showFewer') : t('tohfaHome.actions.showMore')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={styles.sectionContainer}>
          <TohfaSectionHeader
            title={t('tohfaHome.ops.title')}
            onOpen={onOpenOps}
            openTestID="home.ops.open"
            openA11y={t('tohfaHome.ops.openA11y')}
          />
          <TohfaSummaryCard
            testID="home.ops.card"
            accessibilityLabel={t('tohfaHome.ops.cardA11y')}
            onPress={onOpenOps}
            rows={[
              { label: t('tohfaHome.ops.farmers'), value: dash },
              { label: t('tohfaHome.ops.produce'), value: dash },
              { label: t('tohfaHome.ops.audits'), value: dash },
              { label: t('tohfaHome.ops.purchases'), value: dash },
              { label: t('tohfaHome.ops.warehouse'), value: dash },
            ]}
          />
        </View>

        <View style={styles.sectionContainer}>
          <TohfaSectionHeader
            title={t('tohfaHome.sales.title')}
            onOpen={onOpenSales}
            openTestID="home.sales.open"
            openA11y={t('tohfaHome.sales.openA11y')}
          />
          <TohfaSummaryCard
            testID="home.sales.card"
            accessibilityLabel={t('tohfaHome.sales.openA11y')}
            onPress={onOpenSales}
            rows={[
              { label: t('tohfaHome.sales.orderValue'), value: dash, big: true },
              { label: t('tohfaHome.sales.online'), value: dash },
              { label: t('tohfaHome.sales.liveMarket'), value: dash },
              { label: t('tohfaHome.sales.horeca'), value: dash },
              { label: t('tohfaHome.sales.b2b'), value: dash },
            ]}
          />
          <Text style={styles.salesSubNote}>
            {t('tohfaHome.sales.ordersNote', { placed: dash, packed: dash, ready: dash, delivered: dash })}
          </Text>
          <TohfaSummaryCard
            testID="home.finance.card"
            accessibilityLabel={t('tohfaHome.finance.openA11y')}
            onPress={onOpenFinance}
            spaced
            rows={[
              { label: t('tohfaHome.finance.payoutsProcessing'), value: dash },
              { label: t('tohfaHome.finance.payoutsApproval'), value: dash },
              { label: t('tohfaHome.finance.failedHold'), value: dash },
              { label: t('tohfaHome.finance.refunds'), value: dash },
            ]}
          />
        </View>

        <View style={styles.sectionContainer}>
          <TohfaSectionHeader title={t('tohfaHome.warehouse.title')} />
          <TohfaEmptyCard text={t('tohfaHome.warehouse.empty')} />
        </View>

        <View style={styles.sectionContainer}>
          <TohfaSectionHeader title={t('tohfaHome.activity.title')} />
          <TohfaEmptyCard text={t('tohfaHome.activity.empty')} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TohfaDateRangeModal
        visible={showDateRangeModal}
        selected={dateRange}
        onSelect={(range) => {
          setDateRange(range);
          setShowDateRangeModal(false);
        }}
        onClose={() => setShowDateRangeModal(false)}
      />
    </SafeAreaView>
  );
}
