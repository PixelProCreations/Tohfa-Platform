/**
 * Produce Calendar & Overview (M4-S01) with its Filters popup (M4-S01-1), the
 * main view of ProduceControlFlow. Data: GET /admin/produce/{records,calendar,
 * calendar/events,filter-options}, all behind produce.calendar.view_consolidated.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { Can } from '../../permissions/can';
import { t, type TranslationKey } from '../../i18n';
import { todayInIndia } from '../../api/pricingMappers';
import type { ProduceEventType, ProduceFilters } from '../../api/produce';
import {
  useProduceCalendar,
  useProduceCalendarEvents,
  useProduceFilterOptions,
  useProduceRecordCount,
} from '../../api/produceHooks';
import {
  BackArrowIcon,
  ChevronDownIcon,
  CloseIcon,
  DatabaseCylinderIcon,
  FilterSlidersIcon,
  HistoryClockIcon,
  LeafIcon,
  SearchIcon,
  TractorIcon,
  TrendChartIcon,
} from './produceIcons';
import { ProduceStatusBadge, formatProduceDate, longMonthName } from './produceParts';
import { PRODUCE_DASH, countText, dayMarks, dayParam, monthCells, monthParam, nextOption, shiftMonth, yearMonthOf } from './produceLogic';

export interface ProduceCalendarViewProps {
  can: Can;
  onBack: () => void;
  onOpenCropData: () => void;
  onOpenZoneBreakdown?: (() => void) | undefined;
  onOpenHarvestForecast?: (() => void) | undefined;
  onOpenCropHistory?: (() => void) | undefined;
}

const WEEKDAY_KEYS: readonly TranslationKey[] = [
  'produce.weekday.mon',
  'produce.weekday.tue',
  'produce.weekday.wed',
  'produce.weekday.thu',
  'produce.weekday.fri',
  'produce.weekday.sat',
  'produce.weekday.sun',
];

const EVENT_TITLE: Record<ProduceEventType, TranslationKey> = {
  PLANTING: 'produce.event.PLANTING',
  GROWTH_STAGE: 'produce.event.GROWTH_STAGE',
  HARVEST: 'produce.event.HARVEST',
};

function eventDotColor(type: ProduceEventType): string {
  if (type === 'PLANTING') return adminColors.info.text;
  if (type === 'HARVEST') return adminColors.success.text;
  return adminColors.brandDeep;
}

export function ProduceCalendarView({
  can,
  onBack,
  onOpenCropData,
  onOpenZoneBreakdown,
  onOpenHarvestForecast,
  onOpenCropHistory,
}: ProduceCalendarViewProps): React.JSX.Element {
  const canView = can('produce.calendar.view_consolidated');
  const canOpenCropData =
    can('admin.crop_taxonomy.manage') || can('admin.diary_taxonomy.manage') || can('platform.event.manage');

  const today = useMemo(() => todayInIndia(), []);
  const [ym, setYm] = useState(() => yearMonthOf(today));
  const [selectedDay, setSelectedDay] = useState<number>(() => Number(today.slice(8, 10)));
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [searchTxt, setSearchTxt] = useState('');
  const [zoneId, setZoneId] = useState<string | undefined>(undefined);
  const [cropId, setCropId] = useState<string | undefined>(undefined);
  // Applied only on Apply, as in the design's popup.
  const [draftZoneId, setDraftZoneId] = useState<string | undefined>(undefined);
  const [draftCropId, setDraftCropId] = useState<string | undefined>(undefined);

  const q = searchTxt.trim();
  const filters: ProduceFilters = { zoneId, cropId, q: q === '' ? undefined : q };
  const selectedIso = dayParam(ym, selectedDay);

  const recordCount = useProduceRecordCount(filters, { enabled: canView });
  const calendar = useProduceCalendar(monthParam(ym), filters, { enabled: canView });
  const events = useProduceCalendarEvents(selectedIso, filters, { enabled: canView });
  const options = useProduceFilterOptions({ enabled: canView });

  const total = recordCount.data?.page.total;
  const cells = monthCells(ym);
  const monthTitle = `${longMonthName(ym.month)} ${ym.year}`;
  const zoneName = options.data?.zones.find((z) => z.id === draftZoneId)?.name;
  const cropName = options.data?.crops.find((c) => c.id === draftCropId)?.name;

  const goMonth = (delta: number) => {
    setYm((prev) => shiftMonth(prev, delta));
    setSelectedDay(1);
  };

  const openFilters = () => {
    setDraftZoneId(zoneId);
    setDraftCropId(cropId);
    setShowFiltersModal(true);
  };

  const openQuick = (target: (() => void) | undefined) => {
    if (target) target();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('produce.back')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <TractorIcon size={24} color={adminColors.onBrand} />
          <Text style={styles.headerTitle}>
            {canOpenCropData ? t('produce.calendar.titleSuperAdmin') : t('produce.calendar.title')}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {t('produce.calendar.subtitle', { month: monthTitle, count: countText(total) })}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>{t('produce.overview.title')}</Text>

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>{t('produce.overview.recordsInView')}</Text>
            <Text style={styles.overviewValue}>{countText(total)}</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>{t('produce.overview.expectedHarvests')}</Text>
            <Text style={styles.overviewValue}>{PRODUCE_DASH}</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>{t('produce.overview.missingPlanting')}</Text>
            <Text style={styles.overviewValue}>{PRODUCE_DASH}</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>{t('produce.overview.needingUpdate')}</Text>
            <Text style={styles.overviewValue}>{t('produce.overview.ruleNotDefined')}</Text>
          </View>
        </View>

        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.monthNavBtn}
            activeOpacity={0.7}
            onPress={() => goMonth(-1)}
            accessibilityLabel={t('produce.calendar.previousMonth')}
          >
            <Text style={styles.monthNavArrow}>{'‹'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthNavTitle}>{monthTitle}</Text>
          <TouchableOpacity
            style={styles.monthNavBtn}
            activeOpacity={0.7}
            onPress={() => goMonth(1)}
            accessibilityLabel={t('produce.calendar.nextMonth')}
          >
            <Text style={styles.monthNavArrow}>{'›'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarContainer}>
          <View style={styles.weekHeadersRow}>
            {WEEKDAY_KEYS.map((key) => (
              <Text key={key} style={styles.weekHeaderCell}>
                {t(key)}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((day, cIdx) => {
              if (day === null) {
                return <View key={`empty-${cIdx}`} style={styles.calendarEmptyCell} />;
              }
              const iso = dayParam(ym, day);
              const marks = dayMarks(calendar.data, iso);
              const isSelected = selectedDay === day;
              const isToday = iso === today;
              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.calendarDayCell,
                    isSelected && styles.calendarDayCellSelected,
                    isToday && styles.calendarDayCellToday,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.calendarDayNumber, isSelected && styles.calendarDayNumberSelected]}>{day}</Text>
                  <View style={styles.dayDotsRow}>
                    {marks.planting && <View style={[styles.calendarDot, { backgroundColor: adminColors.info.text }]} />}
                    {marks.growthStage && <View style={[styles.calendarDot, { backgroundColor: adminColors.brandDeep }]} />}
                    {marks.harvest && <View style={[styles.calendarDot, { backgroundColor: adminColors.success.text }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: adminColors.info.text }]} />
            <Text style={styles.legendText}>{t('produce.legend.planting')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: adminColors.brandDeep }]} />
            <Text style={styles.legendText}>{t('produce.legend.growthStage')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendRing} />
            <Text style={styles.legendText}>{t('produce.legend.expectedHarvest')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: adminColors.success.text }]} />
            <Text style={styles.legendText}>{t('produce.legend.pastHarvest')}</Text>
          </View>
        </View>

        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('produce.calendar.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={searchTxt}
            onChangeText={setSearchTxt}
          />
          <TouchableOpacity
            style={styles.filterTouchBtn}
            onPress={openFilters}
            activeOpacity={0.7}
            accessibilityLabel={t('produce.filters.title')}
          >
            <FilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.dateSectionHeader}>{formatProduceDate(selectedIso)}</Text>

        {events.items.map((item, idx) => (
          <View key={`${item.record.id}-${item.eventType}-${idx}`} style={styles.activityCard}>
            <View style={styles.activityTopRow}>
              <View style={styles.activityTitleWrap}>
                <View style={[styles.activityDot, { backgroundColor: eventDotColor(item.eventType) }]} />
                <Text style={styles.activityTitle}>{t(EVENT_TITLE[item.eventType])}</Text>
              </View>
              <ProduceStatusBadge label={t('produce.event.recorded')} tone="success" />
            </View>
            <Text style={styles.activityMeta}>
              {[item.record.crop.name, item.record.farmer.name, item.record.zone?.name ?? PRODUCE_DASH, item.record.plot.name].join(
                ' · ',
              )}
            </Text>
            <Text style={styles.activityDate}>{formatProduceDate(item.date)}</Text>
          </View>
        ))}
        {!events.isLoading && events.items.length === 0 && (
          <Text style={styles.activityMeta}>{canView ? t('produce.calendar.noEvents') : PRODUCE_DASH}</Text>
        )}

        <Text style={styles.explanatoryFootnote}>{t('produce.calendar.footnote')}</Text>

        <Text style={styles.quickActionsSectionHeader}>{t('produce.quick.title')}</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionTile} onPress={() => openQuick(onOpenZoneBreakdown)} activeOpacity={0.8}>
            <LeafIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('produce.quick.zoneBreakdown')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionTile} onPress={() => openQuick(onOpenHarvestForecast)} activeOpacity={0.8}>
            <TrendChartIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('produce.quick.harvestForecast')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionTile} onPress={() => openQuick(onOpenCropHistory)} activeOpacity={0.8}>
            <HistoryClockIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('produce.quick.cropHistory')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => {
              if (canOpenCropData) onOpenCropData();
              else Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.cropData'));
            }}
            activeOpacity={0.8}
          >
            <DatabaseCylinderIcon size={24} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('produce.quick.cropData')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={showFiltersModal} transparent animationType="slide" onRequestClose={() => setShowFiltersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('produce.filters.title')}</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)} activeOpacity={0.7} accessibilityLabel={t('produce.close')}>
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterFieldLabel}>{t('produce.filters.farmer')}</Text>
            <View style={styles.filterDropdown}>
              <Text style={styles.filterDropdownValue}>{t('produce.filters.all')}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </View>

            <Text style={styles.filterFieldLabel}>{t('produce.filters.zone')}</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setDraftZoneId((cur) => nextOption((options.data?.zones ?? []).map((z) => z.id), cur))}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{zoneName ?? t('produce.filters.all')}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            <Text style={styles.filterFieldLabel}>{t('produce.filters.crop')}</Text>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setDraftCropId((cur) => nextOption((options.data?.crops ?? []).map((c) => c.id), cur))}
              activeOpacity={0.7}
            >
              <Text style={styles.filterDropdownValue}>{cropName ?? t('produce.filters.all')}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>

            <Text style={styles.filterFieldLabel}>{t('produce.filters.season')}</Text>
            <View style={styles.filterDropdown}>
              <Text style={styles.filterDropdownValue}>{t('produce.filters.all')}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </View>

            <Text style={styles.filterFieldLabel}>{t('produce.filters.growthStage')}</Text>
            <View style={styles.filterDropdown}>
              <Text style={styles.filterDropdownValue}>{t('produce.filters.all')}</Text>
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </View>

            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => {
                  setZoneId(draftZoneId);
                  setCropId(draftCropId);
                  setShowFiltersModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyBtnText}>{t('produce.filters.apply')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={() => {
                  setDraftZoneId(undefined);
                  setDraftCropId(undefined);
                  setZoneId(undefined);
                  setCropId(undefined);
                  setShowFiltersModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterResetBtnText}>{t('produce.filters.reset')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminColors.canvas },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  backBtn: { paddingRight: adminSpacing.xs, paddingVertical: adminSpacing.xs },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitle: {
    ...adminType.body,
    color: adminOverlay.headerSubtitle,
    marginTop: adminSpacing.xs,
    paddingLeft: adminSpacing.xxl,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.md },
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  overviewTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.xs },
  overviewLabel: { ...adminType.body, color: adminColors.muted, flexShrink: 1 },
  overviewValue: { ...adminType.rowTitle, color: adminColors.ink },
  dottedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: adminSpacing.xs,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    paddingHorizontal: adminSpacing.xs,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavArrow: { ...adminType.title, color: adminColors.brandDeep },
  monthNavTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  calendarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  weekHeadersRow: { flexDirection: 'row', marginBottom: adminSpacing.xsSm },
  weekHeaderCell: { flex: 1, textAlign: 'center', ...adminType.caption, color: adminColors.brandDeep },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarEmptyCell: { width: '14.28%', height: 44 },
  calendarDayCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  calendarDayCellSelected: { backgroundColor: adminColors.brandTint, borderWidth: 1.5, borderColor: adminColors.brand },
  calendarDayCellToday: { borderWidth: 1.5, borderColor: adminColors.brandDeep },
  calendarDayNumber: { ...adminType.caption, color: adminColors.ink },
  calendarDayNumberSelected: { color: adminColors.brand },
  dayDotsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2, minHeight: 6 },
  calendarDot: { width: 5, height: 5, borderRadius: 3 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.success.text,
    backgroundColor: 'transparent',
  },
  legendText: { ...adminType.rowMeta, color: adminColors.muted },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 46,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink },
  filterTouchBtn: { padding: adminSpacing.xs },
  dateSectionHeader: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  activityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  activityTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.xs },
  activityTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xsSm },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTitle: { ...adminType.sectionHead, color: adminColors.ink },
  activityMeta: { ...adminType.body, color: adminColors.muted, marginBottom: 2 },
  activityDate: { ...adminType.rowMeta, color: adminColors.muted },
  explanatoryFootnote: { ...adminType.rowMeta, color: adminColors.muted, marginVertical: adminSpacing.md },
  quickActionsSectionHeader: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  quickActionTile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
    minHeight: 100,
    ...adminShadow.sm,
  },
  quickActionLabel: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'center' },
  bottomSpacer: { height: 70 },
  modalOverlay: { flex: 1, backgroundColor: adminOverlay.scrim, justifyContent: 'flex-end' },
  filterCard: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    maxHeight: '82%',
  },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.md },
  filterModalTitle: { ...adminType.title, color: adminColors.brandDeep },
  filterFieldLabel: { ...adminType.caption, color: adminColors.ink, marginTop: adminSpacing.sm, marginBottom: adminSpacing.xs },
  filterDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  filterDropdownValue: { ...adminType.body, color: adminColors.ink },
  filterButtonsRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.lg, marginBottom: adminSpacing.md },
  filterApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  filterResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: { ...adminType.rowTitle, color: adminColors.ink },
});
