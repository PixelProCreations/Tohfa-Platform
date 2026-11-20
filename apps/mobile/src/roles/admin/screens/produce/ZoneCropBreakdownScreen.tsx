import React, { useState } from 'react';
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

export interface ZoneCropBreakdownScreenProps {
  onBack: () => void;
  onOpenFilters: () => void;
  onSelectCropRecord: (recordId: string) => void;
}

export function ZoneCropBreakdownScreen({
  onBack,
  onOpenFilters,
  onSelectCropRecord,
}: ZoneCropBreakdownScreenProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState('Horticultural');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Vegetables');

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
        {/* 2x2 Metric Cards Grid */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
          <OverviewDashboardCard
            value="—"
            title="Farms with crop records"
            icon="orders"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="—"
            title="Zones with active plans"
            icon="inventory"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="—"
            title="Crops in growth stages"
            icon="receiving"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="—"
            subtitle="(2 excluded)"
            title="Expected harvests in 30 days"
            icon="box"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

        {/* Footnote */}
        <Text style={styles.breakdownFootnote}>
          2 open records excluded from the 30-day count: missing planting date or no duration rule for the crop.
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

        {/* ─── Coonoor — zone panel Section ─── */}
        <Text style={styles.breakdownSectionHeader}>Coonoor — zone panel</Text>

        <View style={styles.zonePanelCard}>
          <View style={styles.zonePanelRow}>
            <Text style={styles.zonePanelFarm}>Ramesh Kumar Farm</Text>
            <Text style={styles.zonePanelDetail}>Red loam · Full sun · Drip</Text>
          </View>
          <View style={styles.zonePanelDivider} />
          <View style={styles.zonePanelRow}>
            <Text style={styles.zonePanelFarm}>Selvi Farm</Text>
            <Text style={styles.zonePanelDetail}>Not recorded</Text>
          </View>
        </View>

        {/* ─── Crop records Section ─── */}
        <Text style={styles.breakdownSectionHeader}>Crop records</Text>

        {/* Card 1: Tomato · Ramesh Kumar Farm */}
        <TouchableOpacity
          style={styles.cropRecordCard}
          onPress={() => onSelectCropRecord('CR-2026-0017')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <View style={styles.cropRecordTopRow}>
            <Text style={styles.cropRecordName}>Tomato · Ramesh Kumar Farm</Text>
            <View style={styles.growingBadge}>
              <Text style={styles.growingBadgeText}>Growing</Text>
            </View>
          </View>
          <Text style={styles.cropRecordSub}>
            Coonoor, plot 1 · Planted 15 Jul 2026 · Stage 5 of 7 (Flowering)
          </Text>

          {/* 7-Segment Progress Bar: 4 completed green, 1 active orange, 2 upcoming gray */}
          <View style={styles.progressBarRow}>
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentOrange]} />
            <View style={[styles.progressSegment, styles.segmentGray]} />
            <View style={[styles.progressSegment, styles.segmentGray]} />
          </View>

          <Text style={styles.cropRecordHarvest}>Expected harvest: 13 Oct 2026 (calculated)</Text>
        </TouchableOpacity>

        {/* Card 2: Carrot · Selvi */}
        <TouchableOpacity
          style={styles.cropRecordCard}
          onPress={() => onSelectCropRecord('CR-2026-0018')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <View style={styles.cropRecordTopRow}>
            <Text style={styles.cropRecordName}>Carrot · Selvi</Text>
            <View style={styles.growingBadge}>
              <Text style={styles.growingBadgeText}>Growing</Text>
            </View>
          </View>
          <Text style={styles.cropRecordSub}>
            Coonoor, plot 2 · Planted 02 Jul 2026 · Stage 5 of 7 (Flowering)
          </Text>

          {/* 7-Segment Progress Bar */}
          <View style={styles.progressBarRow}>
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentGreen]} />
            <View style={[styles.progressSegment, styles.segmentOrange]} />
            <View style={[styles.progressSegment, styles.segmentGray]} />
            <View style={[styles.progressSegment, styles.segmentGray]} />
          </View>

          <Text style={styles.cropRecordHarvest}>Expected harvest: 10 Oct 2026 (calculated)</Text>
        </TouchableOpacity>

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
