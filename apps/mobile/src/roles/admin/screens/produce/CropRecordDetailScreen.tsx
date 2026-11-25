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
  BackArrowIcon,
  CheckCircleIcon,
  CurrentStageIcon,
} from './produceIcons';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

export interface CropRecordData {
  recordId?: string | undefined;
  cropName?: string | undefined;
  farmerName?: string | undefined;
  farmerId?: string | undefined;
  category?: string | undefined;
  zone?: string | undefined;
  plot?: string | undefined;
  plantingDate?: string | undefined;
  expectedHarvest?: string | undefined;
  stage?: string | undefined;
}

export interface CropRecordDetailScreenProps {
  recordId?: string | undefined;
  record?: CropRecordData | undefined;
  onBack: () => void;
  onOpenFarmerProfile?: (() => void) | undefined;
}

export function CropRecordDetailScreen({
  recordId,
  record,
  onBack,
  onOpenFarmerProfile,
}: CropRecordDetailScreenProps): React.JSX.Element {
  const [activePillTab, setActivePillTab] = useState('Overview');

  const recId = record?.recordId || recordId || ADMIN_NO_VALUE;
  const cropName = record?.cropName || ADMIN_NO_VALUE;
  const farmerName = record?.farmerName || ADMIN_NO_VALUE;
  const farmerId = record?.farmerId || ADMIN_NO_VALUE;
  const category = record?.category || ADMIN_NO_VALUE;
  const zonePlot = record?.zone && record?.plot ? `${record.zone} · ${record.plot}` : (record?.zone || record?.plot || ADMIN_NO_VALUE);
  const plantingDate = record?.plantingDate || ADMIN_NO_VALUE;
  const expectedHarvest = record?.expectedHarvest || ADMIN_NO_VALUE;
  const stage = record?.stage || ADMIN_NO_VALUE;

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtnTouch} accessibilityRole="button">
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{cropName} · {recId}</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {farmerName} · {zonePlot}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Key-Value Details */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Crop record</Text>
            <Text style={styles.detailRowValue}>{recId}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Farmer / farm</Text>
            <Text style={styles.detailRowValue}>{farmerId !== ADMIN_NO_VALUE ? `${farmerId} · ${farmerName}` : farmerName}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Crops Category</Text>
            <Text style={styles.detailRowValue}>{category}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Zone / plot</Text>
            <Text style={styles.detailRowValue}>{zonePlot}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Planting date</Text>
            <Text style={styles.detailRowValue}>{plantingDate}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Expected harvest</Text>
            <Text style={styles.detailRowValue}>{expectedHarvest}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Current stage</Text>
            <Text style={styles.detailRowValue}>{stage}</Text>
          </View>
          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Last updated</Text>
            <Text style={styles.detailRowValue}>{ADMIN_NO_VALUE}</Text>
          </View>

          <Text style={styles.detailFootnote}>
            Calculated: planting date plus estimated crop duration rule
          </Text>

          {onOpenFarmerProfile ? (
            <TouchableOpacity style={styles.openFarmerProfileTouch} onPress={onOpenFarmerProfile} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.openFarmerProfileText}>Open farmer profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Footnote */}
        <Text style={styles.breakdownFootnote}>
          Stage names are proposed (the official seven are to be confirmed). A stage is shown as completed only when it was recorded.
        </Text>

        {/* ─── Growth stages Section ─── */}
        <Text style={styles.breakdownSectionHeader}>Growth stages</Text>

        <View style={styles.growthStagesCard}>
          <View style={styles.growthStageRow}>
            <View style={styles.stageNameWrap}>
              <CheckCircleIcon size={18} />
              <Text style={styles.stageNameText}>1 · Land preparation</Text>
            </View>
            <Text style={styles.stageDateText}>26 Feb 2025</Text>
          </View>
          <View style={styles.stageDottedDivider} />

          <View style={styles.growthStageRow}>
            <View style={styles.stageNameWrap}>
              <CheckCircleIcon size={18} />
              <Text style={styles.stageNameText}>2 · Planting</Text>
            </View>
            <Text style={styles.stageDateText}>5 Mar 2025</Text>
          </View>
          <View style={styles.stageDottedDivider} />

          <View style={styles.growthStageRow}>
            <View style={styles.stageNameWrap}>
              <CheckCircleIcon size={18} />
              <Text style={styles.stageNameText}>3 · Germination</Text>
            </View>
            <Text style={styles.stageDateText}>23 Mar 2025</Text>
          </View>
          <View style={styles.stageDottedDivider} />

          <View style={styles.growthStageRow}>
            <View style={styles.stageNameWrap}>
              <CheckCircleIcon size={18} />
              <Text style={styles.stageNameText}>4 · Vegetative growth</Text>
            </View>
            <Text style={styles.stageDateText}>10 Apr 2025</Text>
          </View>
          <View style={styles.stageDottedDivider} />

          <View style={styles.growthStageRow}>
            <View style={styles.stageNameWrap}>
              <CheckCircleIcon size={18} />
              <Text style={styles.stageNameText}>5 · Flowering</Text>
            </View>
            <Text style={styles.stageDateText}>28 Apr 2025</Text>
          </View>
          <View style={styles.stageDottedDivider} />

          <View style={styles.growthStageRow}>
            <View style={styles.stageNameWrap}>
              <CheckCircleIcon size={18} />
              <Text style={styles.stageNameText}>6 · Crop development</Text>
            </View>
            <Text style={styles.stageDateText}>16 May 2025</Text>
          </View>
          <View style={styles.stageDottedDivider} />

          <View style={[styles.growthStageRow, styles.stageRowCurrent]}>
            <View style={styles.stageNameWrap}>
              <CurrentStageIcon size={18} />
              <Text style={[styles.stageNameText, styles.stageNameTextCurrent]}>
                7 · Harvest (current)
              </Text>
            </View>
            <Text style={[styles.stageDateText, styles.stageDateTextCurrent]}>3 Jun 2025</Text>
          </View>
        </View>

        {/* ─── Pill Tabs Row ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollRow}>
          {['Overview', 'Schedule', 'Growth history', 'Nutrients', 'Harvest', 'Crop history', 'Related'].map((tab) => {
            const isSelected = activePillTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setActivePillTab(tab)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
  headerTopRow: {
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
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: adminSpacing.xs / 2,
    paddingLeft: adminSpacing.xxl + adminSpacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  detailRowLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  detailRowValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  detailDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs / 2,
  },
  detailFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginTop: adminSpacing.md,
  },
  openFarmerProfileTouch: {
    marginTop: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
  },
  openFarmerProfileText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
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
  growthStagesCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  growthStageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  stageRowCurrent: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.sm,
  },
  stageNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  stageNameText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  stageNameTextCurrent: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  stageDateText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  stageDateTextCurrent: {
    color: adminColors.brand,
  },
  stageDottedDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs / 2,
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
});
