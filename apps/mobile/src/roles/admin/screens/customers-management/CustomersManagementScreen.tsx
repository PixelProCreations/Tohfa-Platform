/**
 * Customers Management, ported element for element from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "Screen 1: Customers
 * Management"). The owner's rule: don't remove any design. Every element below
 * renders; where the API has no value the figure is the dash
 * (CUSTOMERS_MGMT_DASH), never a hidden card.
 *
 * Real: Total Customers and New Registrations (list `summary`), the Recent
 * customers cards (first rows of GET /admin/customers, mobile masked as the
 * server sends it, BR-92), and the search box (the list's `q`).
 * Dash: Individual, Business, Recent Orders, Business Details Pending (no API
 * field) and the "New registrations this period" chart (no time series). The
 * period modal keeps its choice in local state; no endpoint filters by period.
 *
 * Access: `customer.list.view`, fail closed. Without it the header and a
 * not-available state draw and the list hook fetches nothing (the server still
 * decides, root CLAUDE.md 2.1).
 */
import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { OverviewCardsGrid, OverviewDashboardCard, type OverviewCardIcon } from '../../components';
import type { OverviewCardTone } from '../../components/overviewDashboardCardStyle';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  BackArrowWhiteIcon,
  ClipboardMetricIcon,
  CustomerDirectoryActionIcon,
  CustomersManagementHeaderIcon,
  FilterSlidersCircleIcon,
  GstBuildingActionIcon,
  SearchIcon,
  UsersMetricIcon,
} from './customersManagementIcons';
import {
  CUSTOMERS_MGMT_DASH,
  CUSTOMER_LIST_PERMISSION,
  DEFAULT_PERIOD,
  METRIC_KEYS,
  PERIOD_KEYS,
  SEARCH_DEBOUNCE_MS,
  metricValue,
  searchParam,
  toRecentCustomerView,
  type MetricKey,
  type PeriodKey,
} from './customersManagementLogic';
import { customersManagementStyles as styles } from './customersManagementStyles';
import { useCustomersManagementList } from './useCustomersManagementData';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const GRADIENT_ID = 'custMgmtGrad';

interface MetricSpec {
  titleKey: TranslationKey;
  /** The design's icon name; `users` and `clipboard` are drawn by this module, the rest by the card. */
  icon: OverviewCardIcon | React.ReactNode;
  tone?: OverviewCardTone;
}

/** The design's six cards, in its order. */
const METRICS: Readonly<Record<MetricKey, MetricSpec>> = {
  total: { titleKey: 'customersMgmt.metric.total', icon: <UsersMetricIcon /> },
  newRegistrations: { titleKey: 'customersMgmt.metric.newRegistrations', icon: <ClipboardMetricIcon /> },
  individual: { titleKey: 'customersMgmt.metric.individual', icon: <UsersMetricIcon /> },
  business: { titleKey: 'customersMgmt.metric.business', icon: 'box' },
  recentOrders: { titleKey: 'customersMgmt.metric.recentOrders', icon: 'orders' },
  detailsPending: { titleKey: 'customersMgmt.metric.detailsPending', icon: 'alert', tone: 'warning' },
};

const PERIOD_LABEL_KEYS: Readonly<Record<PeriodKey, TranslationKey>> = {
  thisWeek: 'customersMgmt.period.thisWeek',
  lastWeek: 'customersMgmt.period.lastWeek',
  thisMonth: 'customersMgmt.period.thisMonth',
  last30Days: 'customersMgmt.period.last30Days',
  allTime: 'customersMgmt.period.allTime',
};

export interface CustomersManagementScreenProps {
  can: Can | undefined;
  onBack: () => void;
  /** Quick action "Customer Directory". Undefined until that screen exists: the card still draws. */
  onOpenDirectory?: (() => void) | undefined;
  /** Quick action "GST & Business". Undefined until that screen exists: the card still draws. */
  onOpenGstBusiness?: (() => void) | undefined;
  onSelectCustomer?: ((customer: { id: string; name: string }) => void) | undefined;
}

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function CustomersManagementScreen({
  can,
  onBack,
  onOpenDirectory,
  onOpenGstBusiness,
  onSelectCustomer,
}: CustomersManagementScreenProps) {
  const canView = can?.(CUSTOMER_LIST_PERMISSION) === true;
  const [search, setSearch] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>(DEFAULT_PERIOD);
  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);
  const list = useCustomersManagementList(searchParam(debouncedSearch), canView);
  const summary = list.firstPage?.summary;

  const closeModal = () => setShowPeriodModal(false);

  return (
    <SafeAreaView style={styles.rootContainer}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header banner */}
      <View style={styles.headerBanner}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={adminColors.brand} />
              <Stop offset="1" stopColor={adminColors.brand} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
        </Svg>

        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWithIconRow}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={HIT_SLOP}
              style={styles.headerBackBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customersMgmt.backA11y')}
              testID="customersMgmt.back"
            >
              <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <CustomersManagementHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle} accessibilityRole="header">
              {t('customersMgmt.title')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.circularHeaderBtn}
            onPress={() => setShowPeriodModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('customersMgmt.filterA11y')}
            testID="customersMgmt.filter"
          >
            <FilterSlidersCircleIcon />
          </TouchableOpacity>
        </View>
      </View>

      {!canView ? (
        <AdminEmptyState title={t('customersMgmt.notAvailable.title')} subtitle={t('customersMgmt.notAvailable.subtitle')} />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search bar */}
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('customersMgmt.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              testID="customersMgmt.search"
            />
          </View>

          {/* Six metric cards */}
          <OverviewCardsGrid style={styles.metricsGrid}>
            {METRIC_KEYS.map((key) => {
              const spec = METRICS[key];
              return (
                <OverviewDashboardCard
                  key={key}
                  title={t(spec.titleKey)}
                  value={metricValue(key, summary)}
                  icon={spec.icon}
                  tone={spec.tone ?? 'default'}
                  titlePosition="bottom"
                />
              );
            })}
          </OverviewCardsGrid>

          {/* Helper note */}
          <Text style={styles.helperNote}>{t('customersMgmt.helperNote')}</Text>

          {/* New registrations this period: no time-series endpoint, so the card draws its empty state */}
          <Text style={styles.sectionHeading}>{t('customersMgmt.section.registrations')}</Text>
          <View style={styles.chartCard} testID="customersMgmt.chart">
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{CUSTOMERS_MGMT_DASH}</Text>
              <View style={styles.progressTrack} />
              <Text style={styles.progressValue}>{CUSTOMERS_MGMT_DASH}</Text>
            </View>
            <Text style={styles.chartEmptyNote}>{t('customersMgmt.chart.empty')}</Text>
          </View>

          {/* Recent customers */}
          <Text style={styles.sectionHeading}>{t('customersMgmt.section.recent')}</Text>
          {list.isLoading ? (
            <AdminLoadingState />
          ) : list.error !== null && list.error !== undefined ? (
            <AdminErrorState error={list.error} onRetry={list.refresh} />
          ) : list.items.length === 0 ? (
            <AdminEmptyState title={t('customersMgmt.empty.title')} subtitle={t('customersMgmt.empty.subtitle')} />
          ) : (
            list.items.map((row) => {
              const view = toRecentCustomerView(row);
              const active = view.badgeTone === 'active';
              return (
                <TouchableOpacity
                  key={view.id}
                  style={styles.recentCustomerCard}
                  activeOpacity={0.75}
                  onPress={() => onSelectCustomer?.({ id: row.id, name: row.name })}
                  accessibilityRole="button"
                  accessibilityLabel={view.a11yLabel}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.customerCardTitle}>{view.title}</Text>
                    <View style={active ? styles.badgeActive : styles.badgePending}>
                      <Text style={active ? styles.badgeActiveText : styles.badgePendingText}>{view.badgeLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.customerCardSubtext}>{view.subtext}</Text>
                </TouchableOpacity>
              );
            })
          )}

          {/* Quick actions */}
          <Text style={styles.sectionHeading}>{t('customersMgmt.section.quickActions')}</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={onOpenDirectory}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('customersMgmt.quick.directory')}
              testID="customersMgmt.quick.directory"
            >
              <CustomerDirectoryActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickActionText}>{t('customersMgmt.quick.directory')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={onOpenGstBusiness}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('customersMgmt.quick.gstBusiness')}
              testID="customersMgmt.quick.gst"
            >
              <GstBuildingActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickActionText}>{t('customersMgmt.quick.gstBusiness')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Period filter modal: the choice is local state; no endpoint filters by period yet */}
      <Modal visible={showPeriodModal} transparent animationType="fade" onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('customersMgmt.modal.title')}</Text>

            <Text style={styles.filterSectionTitle}>{t('customersMgmt.modal.selectPeriod')}</Text>
            <View style={styles.filterChipsRow}>
              {PERIOD_KEYS.map((period) => {
                const selected = selectedPeriod === period;
                return (
                  <TouchableOpacity
                    key={period}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                    onPress={() => setSelectedPeriod(period)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {t(PERIOD_LABEL_KEYS[period])}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setSelectedPeriod(DEFAULT_PERIOD);
                  closeModal();
                }}
                accessibilityRole="button"
              >
                <Text style={styles.modalResetBtnText}>{t('customersMgmt.modal.reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={closeModal} accessibilityRole="button">
                <Text style={styles.modalApplyBtnText}>{t('customersMgmt.modal.apply')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
