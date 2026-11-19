import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../../../../../../i18n/farmer';
import { authPalette as P, radius, spacing, typography } from '../../../../theme';
import type { FarmCropResponse } from '../../../../api/crops';
import { cropStatusLabelKey, formatIsoDisplay } from './format';
import { sectionStyles } from './sectionStyles';

export interface CropDetailsSectionProps {
  farmCrop: FarmCropResponse | null;
  currentStage?: { stageNumber: number; name: string } | undefined;
  zoneArea: string;
  varietyCompany: string;
  seedUsedCost: string;
  plantedOn: string;
  expectedHarvest: string;
  expectedQty: string;
}

function Divider(): React.JSX.Element {
  return <View style={styles.divider} />;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {children}
    </View>
  );
}

/** "CROP DETAILS" header plus the details card. */
export function CropDetailsSection({
  farmCrop,
  currentStage,
  zoneArea,
  varietyCompany,
  seedUsedCost,
  plantedOn,
  expectedHarvest,
  expectedQty,
}: CropDetailsSectionProps): React.JSX.Element {
  return (
    <>
      <View style={sectionStyles.sectionHeader}>
        <Text style={sectionStyles.sectionTitle}>{t('farmer.cropDetail.section.details')}</Text>
      </View>

      <View style={styles.detailsCard}>
        <DetailRow label={t('farmer.cropDetail.field.currentStage')}>
          <Text style={styles.detailValueStage}>
            {t('farmer.cropDetail.field.stageValue', {
              number: currentStage?.stageNumber ?? '',
              name: currentStage?.name ?? '',
            })}
          </Text>
        </DetailRow>

        <Divider />

        <DetailRow label={t('farmer.cropDetail.field.zoneArea')}>
          <Text style={styles.detailValue}>{zoneArea}</Text>
        </DetailRow>

        <Divider />

        <DetailRow label={t('farmer.cropDetail.field.varietyCompany')}>
          <Text style={styles.detailValue}>{varietyCompany}</Text>
        </DetailRow>

        <Divider />

        <DetailRow label={t('farmer.cropDetail.field.seedUsedCost')}>
          <Text style={styles.detailValue}>{seedUsedCost}</Text>
        </DetailRow>

        <Divider />

        <DetailRow label={t('farmer.cropDetail.field.plantedOn')}>
          <Text style={styles.detailValue}>{plantedOn}</Text>
        </DetailRow>

        <Divider />

        <DetailRow label={t('farmer.cropDetail.field.expectedHarvest')}>
          <Text style={styles.detailValue}>{expectedHarvest}</Text>
        </DetailRow>

        <Divider />

        <DetailRow label={t('farmer.cropDetail.field.expectedQuantity')}>
          <Text style={styles.detailValue}>{expectedQty}</Text>
        </DetailRow>

        {farmCrop && (
          <>
            <Divider />
            <DetailRow label={t('farmer.cropDetail.field.status')}>
              <Text style={styles.detailValue}>{t(cropStatusLabelKey(farmCrop.status))}</Text>
            </DetailRow>

            {farmCrop.actualHarvestOn && (
              <>
                <Divider />
                <DetailRow label={t('farmer.cropDetail.field.actualHarvest')}>
                  <Text style={styles.detailValue}>
                    {formatIsoDisplay(farmCrop.actualHarvestOn)}
                    {farmCrop.actualYieldKg !== null
                      ? ` · ${farmCrop.actualYieldKg} ${t('farmer.cropDetail.unit.kg')}`
                      : ''}
                  </Text>
                </DetailRow>
              </>
            )}

            {farmCrop.notes && (
              <>
                <Divider />
                <DetailRow label={t('farmer.cropDetail.field.notes')}>
                  <Text style={styles.detailValue}>{farmCrop.notes}</Text>
                </DetailRow>
              </>
            )}
          </>
        )}
      </View>
    </>
  );
}

const CARD_MARGIN_BOTTOM = 20;
const SHADOW_OFFSET_Y = 2;
const SHADOW_OPACITY = 0.03;
const SHADOW_RADIUS = 6;
const CARD_ELEVATION = 2;
const ROW_PADDING_V = 12;
const STAGE_PADDING_V = 3;

const styles = StyleSheet.create({
  detailsCard: {
    backgroundColor: P.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: CARD_MARGIN_BOTTOM,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: SHADOW_OFFSET_Y },
    shadowOpacity: SHADOW_OPACITY,
    shadowRadius: SHADOW_RADIUS,
    elevation: CARD_ELEVATION,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ROW_PADDING_V,
  },
  detailLabel: {
    fontSize: typography.body,
    color: P.twGray500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: typography.body,
    color: P.ink,
    fontWeight: '700',
  },
  detailValueStage: {
    fontSize: typography.body,
    color: P.brandGreen,
    fontWeight: '800',
    backgroundColor: P.twGreen50,
    paddingHorizontal: spacing.sm,
    paddingVertical: STAGE_PADDING_V,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  divider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
});
