/**
 * Farm & land tab (team design), read-only from the profile's land locations.
 *
 * One card per land location of the farmer's single operation, with its plots
 * underneath. The boundary is shown only as "Boundary recorded / No boundary";
 * no GPS or centroid is drawn (landLocationCards never copies it). The design's
 * plot code, "Verified" status and submitted date have no API: the card title
 * is the location name and the date is the dash.
 *
 * Preview / Verify / Flag a discrepancy / Request a correction and the FMB
 * Sketch "View" are ported as designed (owner: "just bring the design") and
 * open DESIGN-ONLY modals (./RecordModals.tsx). Dev's "Open Farm Map" button
 * is kept.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { FarmerDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { DocumentIcon, MapIcon } from './icons';
import { landLocationCards, type DesignActionKind, type FarmerDetailAccess } from './model';
import { EmptyCard, Pill } from './parts';
import { detailStyles as s } from './styles';

export function ActionLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
      <Text style={s.actionLinkText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FarmLandTab({
  farmer,
  access,
  onDesignAction,
  onOpenFarmMap,
}: {
  farmer: FarmerDetailView;
  access: FarmerDetailAccess;
  onDesignAction: (kind: DesignActionKind, record: string) => void;
  onOpenFarmMap?: (() => void) | undefined;
}) {
  const cards = landLocationCards(farmer);
  return (
    <>
      {cards.length === 0 ? <EmptyCard text={t('farmerDetail.farm.empty')} /> : null}
      {cards.map((card) => (
        <View key={card.id} style={s.plotCard}>
          <View style={s.plotHeaderRow}>
            <Text style={s.plotTitle}>{card.title}</Text>
            <View style={s.plotPills}>
              {card.isPrimary ? <Pill label={t('farmerDetail.farm.primary')} tone="brandSoft" /> : null}
              <Pill
                label={card.hasBoundary ? t('farmerDetail.farm.boundaryRecorded') : t('farmerDetail.farm.noBoundary')}
                tone={card.hasBoundary ? 'success' : 'warning'}
              />
            </View>
          </View>
          <Text style={s.plotLine}>{card.location}</Text>
          <Text style={s.plotLine}>{card.meta}</Text>
          <Text style={s.plotSubDate}>{t('farmerDetail.farm.submitted', { date: card.submitted })}</Text>

          <View style={s.plotSubList}>
            <Text style={s.plotSubTitle}>{t('farmerDetail.farm.plotsTitle')}</Text>
            {card.plots.length === 0 ? <Text style={s.plotSubMeta}>{t('farmerDetail.farm.noPlots')}</Text> : null}
            {card.plots.map((p) => (
              <View key={p.id} style={s.plotSubRow}>
                <Text style={s.plotSubName}>{p.name}</Text>
                <Text style={s.plotSubMeta}>{p.meta}</Text>
              </View>
            ))}
          </View>

          {access.canUseRecordDesignActions ? (
            <View style={s.actionLinksRow}>
              <ActionLink label={t('farmerDetail.farm.preview')} onPress={() => onDesignAction('preview', card.title)} />
              <ActionLink label={t('farmerDetail.farm.verify')} onPress={() => onDesignAction('verify', card.title)} />
              <ActionLink label={t('farmerDetail.farm.flag')} onPress={() => onDesignAction('flag', card.title)} />
              <ActionLink label={t('farmerDetail.farm.correction')} onPress={() => onDesignAction('correction', card.title)} />
            </View>
          ) : null}
        </View>
      ))}

      <Text style={s.note}>{t('farmerDetail.farm.disclaimer')}</Text>

      <View style={s.fmbCard}>
        <View style={s.fmbLeft}>
          <DocumentIcon size={22} />
          <Text style={s.fmbTitle}>{t('farmerDetail.farm.fmbSketch')}</Text>
        </View>
        <TouchableOpacity
          style={s.fmbViewBtn}
          onPress={() => onDesignAction('preview', t('farmerDetail.farm.fmbSketch'))}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={s.fmbViewBtnText}>{t('farmerDetail.farm.view')}</Text>
        </TouchableOpacity>
      </View>

      {onOpenFarmMap !== undefined ? (
        <TouchableOpacity style={s.primaryActionButton} onPress={onOpenFarmMap} activeOpacity={0.85} accessibilityRole="button">
          <MapIcon />
          <Text style={s.primaryActionButtonText}>{t('farmerDetail.farm.openMap')}</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );
}
