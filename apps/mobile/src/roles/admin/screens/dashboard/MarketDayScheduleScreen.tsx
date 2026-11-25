/**
 * Screen 43 — Market Day Schedule, reading the live warehouse network.
 *
 * The fixture's MOCK_DAYS is gone, and so is the host prop that passed it back
 * in. Rows come from GET /warehouses (warehouse.all.view) through
 * useMarketDayVenues; see ../../api/marketDay.ts for the spec gap this sits on
 * — there is no market-day schedule endpoint, only the warehouse's own
 * `is_market_day_venue` / `market_day_of_week`.
 *
 * What the design shows and the API does not carry renders as the dash, never
 * as a demo value: the calendar date (the server stores a recurring weekday,
 * not dated occurrences) and the opening-hours range. The enable/disable
 * switch has no write endpoint, so it is shown DISABLED with an explanation
 * and can never report a change that did not happen.
 *
 * The fixture's hardcoded palette is left exactly as it was; a theme pass is a
 * separate change.
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { useMarketDayVenues } from '../../api/marketDayHooks';
import type { MarketDayVenueView } from '../../api/marketDay';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
  red: '#E8562A',
};

export interface MarketDayScheduleScreenProps {
  onBack: () => void;
  onAddMarketDay: () => void;
  /** Permission check from /auth/me. Missing means nothing is permitted (fail closed). */
  can?: Can | undefined;
}

/** The weekday label for `market_day_of_week`, or the dash when the server has none. */
export function weekdayLabel(dayOfWeek: number | null): string {
  return dayOfWeek === null ? t('pricingMarketDay.noValue') : t(`pricingMarketDay.schedule.weekday.${dayOfWeek}` as never);
}

export function MarketDayScheduleScreen({ onBack, onAddMarketDay, can }: MarketDayScheduleScreenProps) {
  const canView = can !== undefined && can('warehouse.all.view');
  const list = useMarketDayVenues({ enabled: canView });
  const dash = t('pricingMarketDay.noValue');
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.venues.length });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('pricingMarketDay.back')}
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>{t('pricingMarketDay.schedule.title')}</Text>
        <Text style={styles.subtitle}>{t('pricingMarketDay.schedule.subtitle')}</Text>

        {!canView ? <AdminEmptyState title={t('pricingMarketDay.schedule.notPermitted')} /> : null}
        {canView && view === 'loading' ? <AdminLoadingState /> : null}
        {canView && view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {canView && view === 'empty' ? <AdminEmptyState title={t('pricingMarketDay.schedule.empty')} /> : null}

        {/* Market Day List */}
        {canView && view === 'ready' ? (
          <View style={styles.dayList}>
            {list.venues.map((day: MarketDayVenueView) => (
              <View key={day.warehouseId} style={styles.dayCard} testID={`pricingMarketDay.row.${day.warehouseId}`}>
                <View style={styles.dateBox}>
                  {/* No dated occurrence exists; the weekday is what the server stores. */}
                  <Text style={styles.dateNum}>{dash}</Text>
                  <Text style={styles.dateMonth}>{weekdayLabel(day.dayOfWeek)}</Text>
                </View>

                <View style={styles.dayInfo}>
                  <Text style={styles.warehouseName}>{day.warehouseName}</Text>
                  {/* Opening hours are not published on a warehouse read. */}
                  <Text style={styles.timeRange}>{dash}</Text>
                </View>

                <Switch
                  value={day.isMarketDayVenue}
                  disabled
                  accessibilityLabel={t('pricingMarketDay.schedule.toggleLabel')}
                  accessibilityState={{ disabled: true, checked: day.isMarketDayVenue }}
                  trackColor={{ false: P.border, true: P.orangeBg }}
                  thumbColor={day.isMarketDayVenue ? P.orange : P.muted}
                  ios_backgroundColor={P.border}
                  testID={`pricingMarketDay.row.${day.warehouseId}.toggle`}
                />
              </View>
            ))}
            <Text style={styles.noteText}>{t('pricingMarketDay.schedule.toggleUnavailable')}</Text>
            <Text style={styles.noteText}>{t('pricingMarketDay.schedule.hoursUnavailable')}</Text>
          </View>
        ) : null}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addMarketBtn}
          onPress={onAddMarketDay}
          activeOpacity={0.8}
          accessibilityRole="button"
          testID="pricingMarketDay.add"
        >
          <Icon name="add" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addMarketBtnText}>{t('pricingMarketDay.schedule.add')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: P.lightGray,
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  dayList: {
    gap: 12,
    marginBottom: 20,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: P.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    minWidth: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FDF3F0',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5D2510',
    lineHeight: 22,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: P.red,
    letterSpacing: 0.5,
    marginTop: 1,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  dayInfo: {
    flex: 1,
  },
  warehouseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  timeRange: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#1A1A1A',
    lineHeight: 17.6,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  addMarketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addMarketBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  noteText: {
    fontSize: 12,
    color: P.lightGray,
    marginTop: 6,
    lineHeight: 17,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
