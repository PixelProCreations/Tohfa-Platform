import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import type { PestDetection } from '../../../../api/pest';
import { formatIsoDisplay } from './dateUtils';
import { DetectionBadges } from './DetectionBadges';
import { ArrowBackIcon, PestBugIcon } from './icons';
import { STATUS_LABEL_KEY } from './labels';
import { styles } from './styles';
import type { DetectionFilterTab } from './usePestDetections';

const FILTER_TABS: readonly DetectionFilterTab[] = ['All', 'Ongoing', 'Resolved', 'Recurring'];

interface DetectionLogViewProps {
  activeCount: number;
  resolvedCount: number;
  filterTab: DetectionFilterTab;
  onFilterChange: (tab: DetectionFilterTab) => void;
  detectionsLoading: boolean;
  detectionsError: string | null;
  filteredDetections: PestDetection[];
  plotName: string;
  onBack: () => void;
  onSelect: (item: PestDetection) => void;
  onReport: () => void;
}

export function DetectionLogView({
  activeCount,
  resolvedCount,
  filterTab,
  onFilterChange,
  detectionsLoading,
  detectionsError,
  filteredDetections,
  plotName,
  onBack,
  onSelect,
  onReport,
}: DetectionLogViewProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.logScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.logHeaderRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>
          <View style={styles.logHeaderTitleCol}>
            <Text style={styles.logHeaderTitle}>{t('farmer.pestManagement.log.title')}</Text>
            <Text style={styles.logHeaderSubtitle}>
              {t('farmer.pestManagement.log.subtitle', { active: activeCount, resolved: resolvedCount })}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = filterTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTabPill, isActive && styles.filterTabPillActive]}
                onPress={() => onFilterChange(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab === 'All' ? t('farmer.pestManagement.filter.all') : t(STATUS_LABEL_KEY[tab])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detections List */}
        {detectionsLoading ? (
          <View style={styles.detectionsSkeletonList}>
            <Skeleton height={90} width="100%" />
            <Skeleton height={90} width="100%" />
          </View>
        ) : detectionsError ? (
          <Text style={styles.loadErrorText}>{detectionsError}</Text>
        ) : filteredDetections.length === 0 ? (
          <Text style={styles.treatmentHistoryEmpty}>{t('farmer.pestManagement.log.empty')}</Text>
        ) : (
          <View style={styles.detectionsList}>
            {filteredDetections.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.detectionCard}
                activeOpacity={0.85}
                onPress={() => onSelect(item)}
              >
                <View style={styles.detectionIconBox}>
                  <PestBugIcon size={22} color={colors.brandGreen} />
                </View>

                <View style={styles.detectionMainCol}>
                  <Text style={styles.detectionName}>{item.pestName}</Text>
                  <Text style={styles.detectionSub}>
                    {[item.cropLabel, plotName, formatIsoDisplay(item.detectedOn)].filter(Boolean).join(' · ')}
                  </Text>
                  <DetectionBadges severity={item.severity} status={item.status} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Report Detection CTA */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.reportCtaButton} activeOpacity={0.85} onPress={onReport}>
          <Text style={styles.reportCtaPlus}>+</Text>
          <Text style={styles.reportCtaText}>{t('farmer.pestManagement.reportDetection')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
