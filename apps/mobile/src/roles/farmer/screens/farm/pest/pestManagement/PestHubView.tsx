import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import {
  ArrowBackIcon,
  BookLibraryIcon,
  CalendarScheduleIcon,
  ChevronRightIcon,
  PestBugIcon,
  WeatherAnalyticsIcon,
} from './icons';
import { styles } from './styles';

interface PestHubViewProps {
  onBack?: (() => void) | undefined;
  contextError: string | null;
  contextLoading: boolean;
  activeCount: number;
  resolvedCount: number;
  nextTreatmentLabel: string | null;
  onOpenLog: () => void;
  onOpenLibrary: () => void;
  onOpenSchedule: () => void;
  onOpenWeatherRisk: () => void;
  onReport: () => void;
}

export function PestHubView({
  onBack,
  contextError,
  contextLoading,
  activeCount,
  resolvedCount,
  nextTreatmentLabel,
  onOpenLog,
  onOpenLibrary,
  onOpenSchedule,
  onOpenWeatherRisk,
  onReport,
}: PestHubViewProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.hubScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <View style={styles.hubHeaderRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.pestManagement.back')}
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>
        </View>

        {/* Central Icon & Title */}
        <View style={styles.hubTitleSection}>
          <View style={styles.hubIconBadge}>
            <PestBugIcon size={28} color={colors.brandGreen} />
          </View>
          <Text style={styles.hubMainTitle}>{t('farmer.pestManagement.hub.title')}</Text>
          <Text style={styles.hubSubtitle}>{t('farmer.pestManagement.hub.subtitle')}</Text>
        </View>

        {contextError ? (
          <Text style={styles.loadErrorText}>{contextError}</Text>
        ) : (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{contextLoading ? '—' : activeCount}</Text>
                <Text style={styles.statLabel}>{t('farmer.pestManagement.hub.activeDetections')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{nextTreatmentLabel ?? '—'}</Text>
                <Text style={styles.statLabel}>{t('farmer.pestManagement.hub.nextTreatment')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{contextLoading ? '—' : resolvedCount}</Text>
                <Text style={styles.statLabel}>{t('farmer.pestManagement.hub.resolved')}</Text>
              </View>
            </View>
          </>
        )}

        {/* Features List */}
        <Text style={styles.sectionHeaderTitle}>{t('farmer.pestManagement.hub.features')}</Text>

        <View style={styles.featuresList}>
          {/* Feature 1: Detection Log */}
          <TouchableOpacity style={styles.featureCard} activeOpacity={0.8} onPress={onOpenLog}>
            <View style={[styles.featureIconBox, styles.featureIconBoxForest]}>
              <PestBugIcon size={22} color={P.white} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureCode}>FR-F07-B</Text>
              <Text style={styles.featureTitle}>{t('farmer.pestManagement.hub.detectionLogTitle')}</Text>
              <Text style={styles.featureDesc}>{t('farmer.pestManagement.hub.detectionLogDesc')}</Text>
            </View>
            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Feature 2: Pest Library */}
          <TouchableOpacity style={styles.featureCard} activeOpacity={0.8} onPress={onOpenLibrary}>
            <View style={[styles.featureIconBox, styles.featureIconBoxBrand]}>
              <BookLibraryIcon size={22} color={P.white} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureCode}>FR-F07-C</Text>
              <Text style={styles.featureTitle}>{t('farmer.pestManagement.hub.libraryTitle')}</Text>
              <Text style={styles.featureDesc}>{t('farmer.pestManagement.hub.libraryDesc')}</Text>
            </View>
            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Feature 3: Treatment Schedule */}
          <TouchableOpacity style={styles.featureCard} activeOpacity={0.8} onPress={onOpenSchedule}>
            <View style={[styles.featureIconBox, styles.featureIconBoxOrange]}>
              <CalendarScheduleIcon size={22} color={P.white} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureCode}>FR-F07-D</Text>
              <Text style={styles.featureTitle}>{t('farmer.pestManagement.hub.scheduleTitle')}</Text>
              <Text style={styles.featureDesc}>{t('farmer.pestManagement.hub.scheduleDesc')}</Text>
            </View>
            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Feature 4: Weather Risk & Analytics */}
          <TouchableOpacity style={styles.featureCard} activeOpacity={0.8} onPress={onOpenWeatherRisk}>
            <View style={[styles.featureIconBox, styles.featureIconBoxBlue]}>
              <WeatherAnalyticsIcon size={22} color={P.white} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureCode}>FR-F07-E</Text>
              <Text style={styles.featureTitle}>{t('farmer.pestManagement.hub.weatherTitle')}</Text>
              <Text style={styles.featureDesc}>{t('farmer.pestManagement.hub.weatherDesc')}</Text>
            </View>
            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Report Detection CTA */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={[styles.reportCtaButton, (contextLoading || !!contextError) && styles.reportCtaButtonDisabled]}
          activeOpacity={0.85}
          onPress={onReport}
          disabled={contextLoading || !!contextError}
        >
          <Text style={styles.reportCtaPlus}>+</Text>
          <Text style={styles.reportCtaText}>{t('farmer.pestManagement.reportDetection')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
