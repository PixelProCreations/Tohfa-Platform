import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import {
  BackArrowIcon,
  FilterSlidersIcon,
  Grid4Icon,
} from './produceIcons';
import { useProduceRecordList } from '../../api/produceHooks';
import type { Can } from '../../permissions/can';
import { formatAdminDay } from '../../utils/datetime';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

export interface ZoneCropBreakdownScreenProps {
  can: Can;
  onBack: () => void;
  onOpenFilters: () => void;
  onSelectCropRecord: (recordId: string) => void;
}

const OPEN_STATUSES = ['GROWING', 'PLANNED'] as const;
const STAGE_SEGMENTS = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * Zone & Crop Breakdown. The crop records are GET /admin/produce/records
 * (open records: GROWING, PLANNED; produce.calendar.view_consolidated). The
 * four headline figures have no server aggregate, so they are dashed, and the
 * list carries no growth stage, so the 7-segment stage bar is drawn empty
 * rather than at an invented stage.
 */
export function ZoneCropBreakdownScreen({
  can,
  onBack,
  onOpenFilters,
  onSelectCropRecord,
}: ZoneCropBreakdownScreenProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState('Horticultural');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Vegetables');

  const canView = can('produce.calendar.view_consolidated');
  const records = useProduceRecordList({ statuses: OPEN_STATUSES }, { enabled: canView });
  const firstZone = records.items.find((r) => r.zone !== null)?.zone ?? null;
  // The zone panel lists the farms of the first zone among the loaded records (names only; the
  // design's soil / sun / irrigation line is per plot and not on a record summary).
  const zoneFarms = useMemo(() => {
    if (firstZone === null) return [];
    const seen = new Map<string, string>();
    for (const r of records.items) if (r.zone?.id === firstZone.id) seen.set(r.farm.id, r.farm.name);
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [records.items, firstZone]);

  const day = (iso: string | null) => (iso === null ? ADMIN_NO_VALUE : formatAdminDay(iso) || ADMIN_NO_VALUE);

  const renderRecords = () => {
    if (!canView) return <AdminEmptyState title={t('wiringFarmers.produce.notLoaded')} />;
    if (records.isLoading) return <AdminLoadingState />;
    if (records.error) return <AdminErrorState error={records.error} onRetry={records.refresh} />;
    if (records.items.length === 0) return <AdminEmptyState title={t('wiringFarmers.produce.breakdown.empty')} />;
    return records.items.map((r) => (
      <TouchableOpacity
        key={r.id}
        style={styles.cropRecordCard}
        onPress={() => onSelectCropRecord(r.id)}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <View style={styles.cropRecordTopRow}>
          <Text style={styles.cropRecordName}>
            {t('wiringFarmers.produce.breakdown.cardTitle', { crop: r.crop.name, farm: r.farm.name })}
          </Text>
          <View style={styles.growingBadge}>
            <Text style={styles.growingBadgeText}>{t(`wiringFarmers.produce.status.${r.status}`)}</Text>
          </View>
        </View>
        <Text style={styles.cropRecordSub}>
          {t('wiringFarmers.produce.breakdown.cardSub', {
            zone: r.zone?.name ?? ADMIN_NO_VALUE,
            plot: r.plot.name,
            planted: day(r.plantedOn),
            stage: ADMIN_NO_VALUE,
          })}
        </Text>

        {/* 7-Segment stage bar: the list sends no stage, so no segment is filled. */}
        <View style={styles.progressBarRow}>
          {STAGE_SEGMENTS.map((i) => (
            <View key={i} style={[styles.progressSegment, styles.segmentGray]} />
          ))}
        </View>

        <Text style={styles.cropRecordHarvest}>
          {t('wiringFarmers.produce.breakdown.expectedHarvest', { date: day(r.expectedHarvestOn) })}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRowBetween}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtnTouch} accessibilityRole="button">
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Grid4Icon size={20} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Zone & Crop Breakdown</Text>
          </View>

          <TouchableOpacity style={styles.headerRightIconTouch} onPress={onOpenFilters} activeOpacity={0.8} accessibilityRole="button">
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2x2 Metric Cards Grid: no server aggregate exists for any of the four. */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
          <OverviewDashboardCard
            value={ADMIN_NO_VALUE}
            title="Farms with crop records"
            icon="orders"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={ADMIN_NO_VALUE}
            title="Zones with active plans"
            icon="inventory"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={ADMIN_NO_VALUE}
            title="Crops in growth stages"
            icon="receiving"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={ADMIN_NO_VALUE}
            subtitle={t('wiringFarmers.produce.breakdown.excluded', { count: ADMIN_NO_VALUE })}
            title="Expected harvests in 30 days"
            icon="box"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

        {/* Footnote: the exclusion count has no source. */}
        <Text style={styles.breakdownFootnote}>
          {t('wiringFarmers.produce.breakdown.footnote', { count: ADMIN_NO_VALUE })}
        </Text>

        {/* ─── Crops category Section ─── */}
        <Text style={styles.breakdownSectionHeader}>Crops category</Text>

        {/* Category Row 1 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollRow}>
          {['Horticultural', 'Cash and Commercial', 'Oilseed', 'Pulses'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Row 2 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollRow}>
          {['Vegetables', 'Fruits', 'Spices & Condiments'].map((sub) => {
            const isSelected = selectedSubCategory === sub;
            return (
              <TouchableOpacity
                key={sub}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedSubCategory(sub)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Zone panel Section ─── */}
        <Text style={styles.breakdownSectionHeader}>
          {t('wiringFarmers.produce.breakdown.zonePanel', { zone: firstZone?.name ?? ADMIN_NO_VALUE })}
        </Text>

        <View style={styles.zonePanelCard}>
          {zoneFarms.map((farm, idx) => (
            <React.Fragment key={farm.id}>
              {idx > 0 && <View style={styles.zonePanelDivider} />}
              <View style={styles.zonePanelRow}>
                <Text style={styles.zonePanelFarm}>{farm.name}</Text>
                <Text style={styles.zonePanelDetail}>{ADMIN_NO_VALUE}</Text>
              </View>
            </React.Fragment>
          ))}
          {zoneFarms.length === 0 && (
            <View style={styles.zonePanelRow}>
              <Text style={styles.zonePanelFarm}>{ADMIN_NO_VALUE}</Text>
              <Text style={styles.zonePanelDetail}>{ADMIN_NO_VALUE}</Text>
            </View>
          )}
        </View>

        {/* ─── Crop records Section ─── */}
        <Text style={styles.breakdownSectionHeader}>Crop records</Text>

        {renderRecords()}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtnTouch: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerRightIconTouch: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  breakdownFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: adminSpacing.md,
  },
  breakdownSectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  chipScrollRow: {
    flexDirection: 'row',
    marginBottom: adminSpacing.sm,
  },
  categoryChip: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    marginRight: adminSpacing.xs,
  },
  categoryChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  categoryChipText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  categoryChipTextActive: {
    color: adminColors.onBrand,
  },
  zonePanelCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  zonePanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  zonePanelFarm: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  zonePanelDetail: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  zonePanelDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs / 2,
  },
  cropRecordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cropRecordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  cropRecordName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  growingBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
  },
  growingBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  cropRecordSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  segmentGreen: {
    backgroundColor: adminColors.success.text,
  },
  segmentOrange: {
    backgroundColor: adminColors.brand,
  },
  segmentGray: {
    backgroundColor: adminColors.border,
  },
  cropRecordHarvest: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});
