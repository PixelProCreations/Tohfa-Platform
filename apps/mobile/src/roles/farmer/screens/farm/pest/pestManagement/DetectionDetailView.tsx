import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import type { PestDetection, PestTreatmentLog } from '../../../../api/pest';
import { formatIsoDisplay } from './dateUtils';
import { DetectionBadges } from './DetectionBadges';
import { ArrowBackIcon, CalendarIcon, CheckIcon, InfoCircleIcon, PestBugIcon } from './icons';
import { styles } from './styles';

interface DetectionDetailViewProps {
  detection: PestDetection;
  plotName: string;
  referenceTreatments: string[];
  detailTreatmentHistory: PestTreatmentLog[];
  detailLoading: boolean;
  onBack: () => void;
  onSchedule: () => void;
  onToggleResolved: () => void;
}

export function DetectionDetailView({
  detection,
  plotName,
  referenceTreatments,
  detailTreatmentHistory,
  detailLoading,
  onBack,
  onSchedule,
  onToggleResolved,
}: DetectionDetailViewProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.detailScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.detailHeaderRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>{t('farmer.pestManagement.detail.title')}</Text>
        </View>

        {/* Hero Image / Banner Card */}
        <View style={styles.detailHeroBanner}>
          <PestBugIcon size={56} color={P.deepGreen} />
        </View>

        {/* Title & Scientific Name */}
        <View style={styles.detailMetaCard}>
          <Text style={styles.detailPestTitle}>{detection.pestName}</Text>
          {detection.scientificName ? (
            <Text style={styles.detailScientificName}>{detection.scientificName}</Text>
          ) : null}
          <Text style={styles.detailCropDate}>
            {[detection.cropLabel, plotName].filter(Boolean).join(' · ')}
            {detection.cropLabel || plotName ? ' · ' : ''}
            {t('farmer.pestManagement.detail.detectedOn', { date: formatIsoDisplay(detection.detectedOn) })}
          </Text>
          {detection.notes ? <Text style={styles.detailCropDate}>{detection.notes}</Text> : null}

          <DetectionBadges severity={detection.severity} status={detection.status} withSeveritySuffix />
        </View>

        {/* Reference Treatments Card */}
        <View style={styles.detailSectionCard}>
          <Text style={styles.cardHeaderTitle}>{t('farmer.pestManagement.detail.referenceHeader')}</Text>
          {detailLoading ? (
            <Skeleton height={40} width="100%" />
          ) : referenceTreatments.length > 0 ? (
            referenceTreatments.map((treatment, idx) => (
              <View key={idx} style={styles.referenceTreatmentItem}>
                <Text style={styles.referenceTreatmentName}>{treatment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.treatmentHistoryEmpty}>{t('farmer.pestManagement.detail.noLibraryMatch')}</Text>
          )}

          <View style={styles.detailCalloutBox}>
            <InfoCircleIcon size={14} color={P.twGray500} />
            <Text style={styles.detailCalloutText}>{t('farmer.pestManagement.detail.referenceCallout')}</Text>
          </View>
        </View>

        {/* Treatment History Card */}
        <View style={styles.detailSectionCard}>
          <Text style={styles.cardHeaderTitle}>{t('farmer.pestManagement.detail.historyHeader')}</Text>
          {detailLoading ? (
            <Skeleton height={40} width="100%" />
          ) : detailTreatmentHistory.length > 0 ? (
            detailTreatmentHistory.map((th) => (
              <View key={th.id} style={styles.treatmentHistoryItem}>
                <Text style={styles.treatmentHistoryName}>{th.treatment}</Text>
                <Text style={styles.treatmentHistoryDate}>{formatIsoDisplay(th.appliedOn)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.treatmentHistoryEmpty}>{t('farmer.pestManagement.detail.noHistory')}</Text>
          )}
        </View>

        <View style={styles.detailBottomSpacer} />
      </ScrollView>

      {/* Bottom Dual Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.8} onPress={onSchedule}>
          <CalendarIcon size={18} color={P.twGray700} />
          <Text style={styles.scheduleButtonText}>{t('farmer.pestManagement.detail.schedule')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.markResolvedButton, detection.status === 'Resolved' && styles.markResolvedButtonActive]}
          activeOpacity={0.85}
          onPress={onToggleResolved}
        >
          <CheckIcon size={18} color={P.white} />
          <Text style={styles.markResolvedButtonText}>
            {detection.status === 'Resolved'
              ? t('farmer.pestManagement.detail.reopenCase')
              : t('farmer.pestManagement.alert.markResolvedTitle')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
