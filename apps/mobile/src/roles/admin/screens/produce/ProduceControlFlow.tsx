/**
 * ProduceControlFlow: Produce Calendar & Overview (M4-S01) and its Filters
 * popup (M4-S01-1), Crop Data (M4-S28a,b,c), Add / Edit Crop Type, Add
 * Activity Category (M3-S28b), Create Event, Zone & Crop Breakdown,
 * Crop Record Detail, Harvest Forecast & Insights, and Crop History Records.
 *
 * Gated with `can()`:
 *  - produce.calendar.view_consolidated  calendar, overview, filters
 *  - admin.crop_taxonomy.manage          crop types
 *  - admin.diary_taxonomy.manage         diary activity categories
 *  - platform.event.manage               platform events
 */
import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import { useFlowBack } from '../warehouse/useFlowBack';
import { CropDataScreen, type CropDataSegment, type CropTypeItem } from './CropDataScreen';
import { AddCropTypeScreen } from './AddCropTypeScreen';
import { AddActivityCategoryScreen } from './AddActivityCategoryScreen';
import { CreateEventScreen } from './CreateEventScreen';
import { ProduceCalendarView } from './ProduceCalendarView';
import { ZoneCropBreakdownScreen } from './ZoneCropBreakdownScreen';
import { CropRecordDetailScreen } from './CropRecordDetailScreen';
import { HarvestForecastInsightsScreen } from './HarvestForecastInsightsScreen';
import { CropHistoryRecordsScreen } from './CropHistoryRecordsScreen';
import { ProduceControlFiltersModal } from './ProduceControlFiltersModal';

export type ProduceControlSubScreen =
  | 'calendar'
  | 'cropData'
  | 'addCropType'
  | 'addActivity'
  | 'createEvent'
  | 'zoneBreakdown'
  | 'cropDetail'
  | 'harvestForecast'
  | 'cropHistory';

export interface ProduceControlFlowProps {
  can: Can;
  initialScreen?: ProduceControlSubScreen | undefined;
  onBack: () => void;
}

export function ProduceControlFlow({ can, initialScreen = 'calendar', onBack }: ProduceControlFlowProps): React.JSX.Element {
  const [activeSubScreen, setActiveSubScreen] = useState<ProduceControlSubScreen>(initialScreen);
  const [selectedCropItem, setSelectedCropItem] = useState<CropTypeItem | undefined>(undefined);
  const [_selectedRecordId, setSelectedRecordId] = useState<string | undefined>(undefined);
  const [detailOriginScreen, setDetailOriginScreen] = useState<'zoneBreakdown' | 'cropHistory'>('zoneBreakdown');

  // Filters Modal State
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedGrowthStage, setSelectedGrowthStage] = useState('All');

  // Crop Data returns to the tab it was left on.
  const [cropDataSegment, setCropDataSegment] = useState<CropDataSegment>('crop_types');

  const backToCropData = () => {
    setSelectedCropItem(undefined);
    setActiveSubScreen('cropData');
  };
  const backToCalendar = () => setActiveSubScreen('calendar');

  const handleBack = (): boolean => {
    if (activeSubScreen === 'calendar' || (activeSubScreen === 'cropData' && initialScreen === 'cropData')) return false;
    if (activeSubScreen === 'cropData') {
      backToCalendar();
    } else if (activeSubScreen === 'addCropType' || activeSubScreen === 'addActivity' || activeSubScreen === 'createEvent') {
      backToCropData();
    } else if (activeSubScreen === 'cropDetail') {
      setActiveSubScreen(detailOriginScreen);
    } else {
      backToCalendar();
    }
    return true;
  };
  useFlowBack(handleBack);

  if (activeSubScreen === 'cropData') {
    return (
      <CropDataScreen
        can={can}
        initialSegment={cropDataSegment}
        onSegmentChange={setCropDataSegment}
        onBack={initialScreen === 'cropData' ? onBack : backToCalendar}
        onNavigateToAddCropType={(crop) => {
          setSelectedCropItem(crop);
          setActiveSubScreen('addCropType');
        }}
        onNavigateToAddActivity={() => setActiveSubScreen('addActivity')}
        onNavigateToCreateEvent={() => setActiveSubScreen('createEvent')}
      />
    );
  }

  if (activeSubScreen === 'addCropType') {
    return <AddCropTypeScreen can={can} crop={selectedCropItem} onBack={backToCropData} onSuccess={backToCropData} />;
  }

  if (activeSubScreen === 'addActivity') {
    return <AddActivityCategoryScreen can={can} onBack={backToCropData} onSuccess={backToCropData} />;
  }

  if (activeSubScreen === 'createEvent') {
    return <CreateEventScreen can={can} onBack={backToCropData} onSuccess={backToCropData} />;
  }

  if (activeSubScreen === 'zoneBreakdown') {
    return (
      <>
        <ZoneCropBreakdownScreen
          onBack={backToCalendar}
          onOpenFilters={() => setShowFiltersModal(true)}
          onSelectCropRecord={(recordId) => {
            setSelectedRecordId(recordId);
            setDetailOriginScreen('zoneBreakdown');
            setActiveSubScreen('cropDetail');
          }}
        />
        <ProduceControlFiltersModal
          visible={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          selectedFarmer={selectedFarmer}
          onChangeFarmer={setSelectedFarmer}
          selectedZone={selectedZone}
          onChangeZone={setSelectedZone}
          selectedCrop={selectedCrop}
          onChangeCrop={setSelectedCrop}
          selectedSeason={selectedSeason}
          onChangeSeason={setSelectedSeason}
          selectedGrowthStage={selectedGrowthStage}
          onChangeGrowthStage={setSelectedGrowthStage}
        />
      </>
    );
  }

  if (activeSubScreen === 'cropDetail') {
    return (
      <CropRecordDetailScreen
        onBack={() => setActiveSubScreen(detailOriginScreen)}
      />
    );
  }

  if (activeSubScreen === 'harvestForecast') {
    return (
      <>
        <HarvestForecastInsightsScreen
          onBack={backToCalendar}
          onOpenFilters={() => setShowFiltersModal(true)}
        />
        <ProduceControlFiltersModal
          visible={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          selectedFarmer={selectedFarmer}
          onChangeFarmer={setSelectedFarmer}
          selectedZone={selectedZone}
          onChangeZone={setSelectedZone}
          selectedCrop={selectedCrop}
          onChangeCrop={setSelectedCrop}
          selectedSeason={selectedSeason}
          onChangeSeason={setSelectedSeason}
          selectedGrowthStage={selectedGrowthStage}
          onChangeGrowthStage={setSelectedGrowthStage}
        />
      </>
    );
  }

  if (activeSubScreen === 'cropHistory') {
    return (
      <>
        <CropHistoryRecordsScreen
          onBack={backToCalendar}
          onOpenFilters={() => setShowFiltersModal(true)}
          onSelectCropRecord={(recordId) => {
            setSelectedRecordId(recordId);
            setDetailOriginScreen('cropHistory');
            setActiveSubScreen('cropDetail');
          }}
        />
        <ProduceControlFiltersModal
          visible={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          selectedFarmer={selectedFarmer}
          onChangeFarmer={setSelectedFarmer}
          selectedZone={selectedZone}
          onChangeZone={setSelectedZone}
          selectedCrop={selectedCrop}
          onChangeCrop={setSelectedCrop}
          selectedSeason={selectedSeason}
          onChangeSeason={setSelectedSeason}
          selectedGrowthStage={selectedGrowthStage}
          onChangeGrowthStage={setSelectedGrowthStage}
        />
      </>
    );
  }

  return (
    <>
      <ProduceCalendarView
        can={can}
        onBack={onBack}
        onOpenCropData={() => setActiveSubScreen('cropData')}
        onOpenZoneBreakdown={() => setActiveSubScreen('zoneBreakdown')}
        onOpenHarvestForecast={() => setActiveSubScreen('harvestForecast')}
        onOpenCropHistory={() => setActiveSubScreen('cropHistory')}
      />
      <ProduceControlFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        selectedFarmer={selectedFarmer}
        onChangeFarmer={setSelectedFarmer}
        selectedZone={selectedZone}
        onChangeZone={setSelectedZone}
        selectedCrop={selectedCrop}
        onChangeCrop={setSelectedCrop}
        selectedSeason={selectedSeason}
        onChangeSeason={setSelectedSeason}
        selectedGrowthStage={selectedGrowthStage}
        onChangeGrowthStage={setSelectedGrowthStage}
      />
    </>
  );
}
