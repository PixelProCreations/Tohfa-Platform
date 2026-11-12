import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { appAlert } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { PestLibraryScreen } from './PestLibraryScreen';
import { TreatmentScheduleScreen } from './TreatmentScheduleScreen';
import { WeatherRiskAnalyticsScreen } from './WeatherRiskAnalyticsScreen';
import { showStatusAlert } from './pestManagement/alerts';
import { DetectionDetailView } from './pestManagement/DetectionDetailView';
import { DetectionLogView } from './pestManagement/DetectionLogView';
import { PestHubView } from './pestManagement/PestHubView';
import { ReportDetectionModal } from './pestManagement/ReportDetectionModal';
import { styles } from './pestManagement/styles';
import { usePestDetections } from './pestManagement/usePestDetections';
import { useReportForm } from './pestManagement/useReportForm';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PestManagementScreenProps {
  /**
   * Threaded down like SoilManagementScreen's farmId when a caller already has
   * one; resolved locally (first farm, via `getFarms()`) when this screen is the
   * root of the pest subtree -- App.tsx's `navigate('PestManagement')` passes no
   * farmId today, the same situation SoilManagementScreen resolves for its own
   * subtree on mount.
   */
  farmId?: string | undefined;
  onBack?: () => void;
  onNavigateToSchedule?: ((farmId: string) => void) | undefined;
  onNavigateToPestLibrary?: ((farmId: string) => void) | undefined;
  onNavigateToWeatherRisk?: ((farmId: string) => void) | undefined;
}

type PestView = 'hub' | 'log' | 'detail' | 'library' | 'schedule' | 'weatherRisk';

export function PestManagementScreen({
  farmId,
  onBack,
  onNavigateToSchedule,
  onNavigateToPestLibrary,
  onNavigateToWeatherRisk,
}: PestManagementScreenProps): React.JSX.Element {
  const [currentView, setCurrentView] = useState<PestView>('hub');

  const data = usePestDetections(farmId, currentView === 'detail');
  const { resolvedFarmId, plotId, selectedDetection, applyDetectionUpdate } = data;

  const reportForm = useReportForm({
    resolvedFarmId,
    plotId,
    setResolvedFarmId: data.setResolvedFarmId,
    setPlotId: data.setPlotId,
    onCreated: (created) => {
      data.setDetections((prev) => [created, ...prev]);
      data.setSelectedDetection(created);
      setCurrentView('log');
    },
  });

  const openSchedule = () => {
    if (onNavigateToSchedule) {
      onNavigateToSchedule(resolvedFarmId);
    } else {
      setCurrentView('schedule');
    }
  };

  const openLibrary = () => {
    if (onNavigateToPestLibrary) {
      onNavigateToPestLibrary(resolvedFarmId);
    } else {
      setCurrentView('library');
    }
  };

  const openWeatherRisk = () => {
    if (onNavigateToWeatherRisk) {
      onNavigateToWeatherRisk(resolvedFarmId);
    } else {
      setCurrentView('weatherRisk');
    }
  };

  const handleToggleResolved = () => {
    if (!selectedDetection) return;
    if (selectedDetection.status === 'Resolved') {
      void applyDetectionUpdate({ status: 'Ongoing' });
      showStatusAlert('Ongoing');
      return;
    }
    // Closes the gap between the mock and what WeatherRiskAnalyticsScreen's
    // effectiveness stat needs: `resolutionEffective` is the farmer's own
    // after-the-fact assessment (BR-38), never guessed by the client.
    const resolveWith = (resolutionEffective: boolean) => () => {
      void applyDetectionUpdate({ status: 'Resolved', resolutionEffective });
      showStatusAlert('Resolved');
    };
    appAlert(
      t('farmer.pestManagement.alert.markResolvedTitle'),
      t('farmer.pestManagement.alert.markResolvedQuestion'),
      [
        { text: t('farmer.pestManagement.cancel'), style: 'cancel' },
        { text: t('farmer.pestManagement.alert.notEffective'), onPress: resolveWith(false) },
        { text: t('farmer.pestManagement.alert.effective'), onPress: resolveWith(true) },
      ],
      { tone: 'info' },
    );
  };

  const openReport = () => reportForm.setIsReportModalVisible(true);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {currentView === 'hub' && (
        <PestHubView
          onBack={onBack}
          contextError={data.contextError}
          contextLoading={data.contextLoading}
          activeCount={data.activeCount}
          resolvedCount={data.resolvedCount}
          nextTreatmentLabel={data.nextTreatmentLabel}
          onOpenLog={() => setCurrentView('log')}
          onOpenLibrary={openLibrary}
          onOpenSchedule={openSchedule}
          onOpenWeatherRisk={openWeatherRisk}
          onReport={openReport}
        />
      )}

      {currentView === 'log' && (
        <DetectionLogView
          activeCount={data.activeCount}
          resolvedCount={data.resolvedCount}
          filterTab={data.filterTab}
          onFilterChange={data.setFilterTab}
          detectionsLoading={data.detectionsLoading}
          detectionsError={data.detectionsError}
          filteredDetections={data.filteredDetections}
          plotName={data.plotName}
          onBack={() => setCurrentView('hub')}
          onSelect={(item) => {
            data.setSelectedDetection(item);
            setCurrentView('detail');
          }}
          onReport={openReport}
        />
      )}

      {currentView === 'detail' && selectedDetection && (
        <DetectionDetailView
          detection={selectedDetection}
          plotName={data.plotName}
          referenceTreatments={data.referenceTreatments}
          detailTreatmentHistory={data.detailTreatmentHistory}
          detailLoading={data.detailLoading}
          onBack={() => setCurrentView('log')}
          onSchedule={openSchedule}
          onToggleResolved={handleToggleResolved}
        />
      )}

      {currentView === 'library' && (
        <PestLibraryScreen
          farmId={resolvedFarmId || undefined}
          onBack={() => setCurrentView('hub')}
          onNavigateToSchedule={openSchedule}
        />
      )}

      {currentView === 'schedule' && (
        <TreatmentScheduleScreen
          farmId={resolvedFarmId || undefined}
          plotId={plotId || undefined}
          onBack={() => setCurrentView('hub')}
        />
      )}

      {currentView === 'weatherRisk' && (
        <WeatherRiskAnalyticsScreen farmId={resolvedFarmId || undefined} onBack={() => setCurrentView('hub')} />
      )}

      <ReportDetectionModal form={reportForm} />
    </SafeAreaView>
  );
}
