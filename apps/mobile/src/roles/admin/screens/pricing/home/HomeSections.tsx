/**
 * The Market & Pricing home's sections, drawn as in the team design's Tohfa
 * layout (KPI grid, Alerts, Market & Pricing Overview, Quick actions) plus the
 * Farmer Admin layout's Recently Updated Prices and View History. Which
 * sections render is decided by ./pricingHomeLogic.ts from the read codes.
 *
 * Live data: only the overview rows (GET /retail-prices, each with the
 * ceiling in force, BR-09). KPIs, alerts and the recently-updated feed have
 * no API source: the dash or an empty state, never the design's numbers.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRetailPriceList } from '../../../api/pricingHooks';
import type { RetailPriceRowView } from '../../../api/pricingTypes';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { queryViewState } from '../../warehouse/shared/queryViewState';
import {
  ceilingComparisonBadge,
  cropGradeTitle,
  dayText,
  diffText,
  priceText,
  type PricingAccess,
} from '../ceiling/pricingLogic';
import { BanknotesIcon, CategoryShapesIcon, FairPriceIcon, PriceHistoryIcon } from '../ceiling/PricingIcons';
import { TONE_BG, TONE_TEXT } from '../ceiling/pricingStyles';
import {
  canSee,
  HOME_KPI_CARDS,
  HOME_OVERVIEW_ROWS,
  HOME_QUICK_ACTIONS,
  kpiValueText,
  type HomeQuickAction,
  type HomeTarget,
} from './pricingHomeLogic';
import { homeStyles as styles } from './pricingHomeStyles';

export type HomeNavigate = Record<HomeTarget, (() => void) | undefined>;

export function HomeKpiGrid({ access, navigate }: { access: PricingAccess; navigate: HomeNavigate }) {
  const cards = HOME_KPI_CARDS.filter((card) => canSee(access, card.code));
  return (
    <OverviewCardsGrid style={styles.kpiGrid}>
      {cards.map((card) => (
        <OverviewDashboardCard key={card.id} value={kpiValueText()} title={t(card.titleKey)} icon={card.icon} onPress={navigate[card.target]} />
      ))}
    </OverviewCardsGrid>
  );
}

function EmptySection({ titleKey, emptyKey }: { titleKey: 'pricingCeiling.home.alerts.title' | 'pricingCeiling.home.recent.title'; emptyKey: 'pricingCeiling.home.alerts.empty' | 'pricingCeiling.home.recent.empty' }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionHeading}>{t(titleKey)}</Text>
      <View style={styles.emptyCard}>
        <AdminEmptyState title={t(emptyKey)} />
      </View>
    </View>
  );
}

/** Tohfa layout "Alerts": no alerts endpoint, so an empty state. */
export function HomeAlertsSection() {
  return <EmptySection titleKey="pricingCeiling.home.alerts.title" emptyKey="pricingCeiling.home.alerts.empty" />;
}

/** FA layout "Recently Updated Prices": no feed endpoint, so an empty state, then "View History". */
export function HomeRecentSection({ onViewHistory }: { onViewHistory?: (() => void) | undefined }) {
  return (
    <View style={styles.sectionBlock}>
      <EmptySection titleKey="pricingCeiling.home.recent.title" emptyKey="pricingCeiling.home.recent.empty" />
      <TouchableOpacity
        style={styles.viewHistoryOutlineBtn}
        onPress={onViewHistory}
        activeOpacity={0.8}
        accessibilityRole="button"
        testID="pricingHome.viewHistory"
      >
        <Text style={styles.viewHistoryOutlineBtnText}>{t('pricingCeiling.home.viewHistory')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function OverviewRow({ row, onPress }: { row: RetailPriceRowView; onPress?: (() => void) | undefined }) {
  const badge = ceilingComparisonBadge(row.ceilingComparison);
  const over = badge?.tone === 'danger';
  return (
    <TouchableOpacity
      style={[styles.rowCard, over && styles.rowCardOver]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      testID={`pricingHome.overview.${row.id}`}
    >
      <View style={styles.rowTopRow}>
        <Text style={styles.rowTitle}>{cropGradeTitle(row.cropName, row.grade)}</Text>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: TONE_BG[badge.tone], borderColor: TONE_TEXT[badge.tone] }]}>
            <Text style={[styles.badgeText, { color: TONE_TEXT[badge.tone] }]}>{t(badge.labelKey)}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.rowSubtitle}>
        {t('pricingCeiling.home.overview.line', {
          ceiling: priceText(row.ceilingPrice),
          retail: priceText(row.retailPrice),
          diff: diffText(row.ceilingComparison),
          date: dayText(row.effectiveFrom),
        })}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Tohfa layout "Market & Pricing Overview": the first retail prices in force,
 * each against its ceiling (BR-09, compared in paise by the mapper). Mounted
 * only with pricing.retail_price.view, so the retail list is never requested
 * otherwise.
 */
export function LiveOverviewSection({ warehouseId, onViewAll }: { warehouseId: string | undefined; onViewAll?: (() => void) | undefined }) {
  const list = useRetailPriceList(warehouseId, {}, { enabled: true });
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeading}>{t('pricingCeiling.home.overview.title')}</Text>
        {onViewAll ? (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7} accessibilityRole="button" testID="pricingHome.overviewViewAll">
            <Text style={styles.viewLinkText}>{t('pricingCeiling.home.overview.viewAll')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {view === 'loading' ? <AdminLoadingState /> : null}
      {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
      {view === 'empty' ? (
        <View style={styles.emptyCard}>
          <AdminEmptyState title={t('pricingCeiling.home.overview.empty')} />
        </View>
      ) : null}
      {view === 'ready' ? (
        <View style={styles.listGap}>
          {list.items.slice(0, HOME_OVERVIEW_ROWS).map((row) => (
            <OverviewRow key={row.id} row={row} onPress={onViewAll} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function quickIcon(id: HomeQuickAction['id']): React.ReactNode {
  if (id === 'retail') return <BanknotesIcon color={adminColors.brand} />;
  if (id === 'fairPrices') return <FairPriceIcon color={adminColors.brand} />;
  if (id === 'categories') return <CategoryShapesIcon color={adminColors.brand} />;
  return <PriceHistoryIcon color={adminColors.brand} />;
}

export function HomeQuickActions({ access, navigate }: { access: PricingAccess; navigate: HomeNavigate }) {
  const actions = HOME_QUICK_ACTIONS.filter((a) => canSee(access, a.code));
  return (
    <View>
      <Text style={styles.sectionHeading}>{t('pricingCeiling.home.quick.title')}</Text>
      <View style={styles.quickGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickCard}
            onPress={navigate[action.target]}
            activeOpacity={0.75}
            accessibilityRole="button"
            testID={`pricingHome.quick.${action.id}`}
          >
            {quickIcon(action.id)}
            <Text style={styles.quickCardLabel}>{t(action.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
