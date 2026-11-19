import React from 'react';
import { WeatherScreen } from '../screens/dashboard/WeatherScreen';
import { ActiveCropsScreen } from '../screens/dashboard/ActiveCropsScreen';
import { TohfaCalendarScreen } from '../screens/dashboard/TohfaCalendarScreen';
import { CropPlanningInsightScreen } from '../screens/dashboard/CropPlanningInsightScreen';
import { FarmManagementScreen } from '../screens/farm/FarmManagementScreen';
import { DairyProduceScreen } from '../screens/farm/livestock/DairyProduceScreen';
import { CropManagementScreen } from '../screens/farm/crops/CropManagementScreen';
import { ProduceCalendarScreen } from '../screens/farm/crops/ProduceCalendarScreen';
import { NewCropScreen } from '../screens/farm/crops/NewCropScreen';
import { CropDetailScreen } from '../screens/farm/crops/CropDetailScreen';
import { CropMilestonesScreen } from '../screens/farm/crops/CropMilestonesScreen';
import { CropDiaryEntriesScreen } from '../screens/farm/diary/CropDiaryEntriesScreen';
import { CropInputsAppliedScreen } from '../screens/farm/crops/CropInputsAppliedScreen';
import { InputManagementScreen } from '../screens/farm/crops/InputManagementScreen';
import { LogFertigationScreen } from '../screens/farm/crops/LogFertigationScreen';
import { LogPestTreatmentScreen } from '../screens/farm/pest/LogPestTreatmentScreen';
import { AddInputAppliedScreen } from '../screens/farm/crops/AddInputAppliedScreen';
import { EditInputAppliedScreen } from '../screens/farm/crops/EditInputAppliedScreen';
import { PestManagementScreen } from '../screens/farm/pest/PestManagementScreen';
import { PestLibraryScreen } from '../screens/farm/pest/PestLibraryScreen';
import { TreatmentScheduleScreen } from '../screens/farm/pest/TreatmentScheduleScreen';
import { WeatherRiskAnalyticsScreen } from '../screens/farm/pest/WeatherRiskAnalyticsScreen';
import { CropWorkforceHoursScreen } from '../screens/farm/crops/CropWorkforceHoursScreen';
import { CropNPKContributionScreen } from '../screens/farm/crops/CropNPKContributionScreen';
import type { FarmerRouteRenderer } from './types';

/** The Farm hub, crops and their records, crop inputs, pest management and the dashboard's detail screens. */
export const renderFarmRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack, selections }) => {
  const { selectedCrop, setSelectedCrop } = selections;
  switch (screen) {
    case 'FarmManagement':
      return (
        <FarmManagementScreen
          onBack={() => goBack('MainTabs')}
          onNavigateToAudits={() => navigate('Audits')}
          onNavigateToDiary={() => navigate('FarmDiary')}
          onNavigateToCertifications={() => navigate('Certifications')}
          onNavigateToProduceCalendar={() => navigate('ProduceCalendar')}
          onNavigateToWeather={() => navigate('Weather')}
          onNavigateToCalendar={() => navigate('TohfaCalendar')}
          onNavigateToActiveCrops={() => navigate('ActiveCrops')}
          onNavigateToCropManagement={() => navigate('CropManagement')}
          onNavigateToAttendance={() => navigate('DailyAttendance')}
          onNavigateToWorkforce={() => navigate('Workforce')}
          onNavigateToLivestock={() => navigate('Livestock')}
          onNavigateToDairyProduce={() => navigate('DairyProduce')}
          onNavigateToLearningHub={() => navigate('LearningHub')}
          onNavigateToSoilManagement={() => navigate('SoilManagement')}
        />
      );
    case 'DairyProduce':
      return <DairyProduceScreen onBack={goBack} />;
    case 'CropManagement':
      return (
        <CropManagementScreen
          onBack={goBack}
          onNavigateToInputManagement={() => navigate('InputManagement')}
          onNavigateToSoilManagement={() => navigate('SoilManagement')}
          onNavigateToPestManagement={() => navigate('PestManagement')}
        />
      );
    case 'InputManagement':
      return (
        <InputManagementScreen
          onBack={goBack}
          onNavigateToLogFertigation={(crop) => {
            if (crop) setSelectedCrop(crop);
            navigate('LogFertigation');
          }}
          onNavigateToLogPestTreatment={(crop, context) => {
            if (crop) setSelectedCrop(crop);
            // A pest reminder's "Log now" carries the reminder's zone.
            navigate('LogPestTreatment', context ? { farmId: context.farmId, plotId: context.plotId } : {});
          }}
          onNavigateToLogInput={(crop, inputType) => {
            if (crop) setSelectedCrop(crop);
            if (inputType === 'Fertigation') {
              navigate('LogFertigation');
            } else if (inputType === 'Pest Treatment') {
              navigate('LogPestTreatment');
            } else {
              navigate('AddInputApplied', { initialInputType: inputType });
            }
          }}
          onNavigateToFullHistory={() => navigate('CropInputsApplied', { scope: 'all' })}
        />
      );
    case 'LogFertigation':
      return (
        <LogFertigationScreen
          crop={selectedCrop}
          onBack={goBack}
          onSave={() => goBack('InputManagement')}
        />
      );
    case 'LogPestTreatment':
      return (
        <LogPestTreatmentScreen
          crop={selectedCrop}
          farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
          plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
          onBack={goBack}
          onSave={() => goBack('InputManagement')}
        />
      );
    case 'PestManagement':
      return (
        <PestManagementScreen
          farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
          onBack={goBack}
          onNavigateToSchedule={(farmId) => navigate('TreatmentSchedule', { farmId })}
          onNavigateToPestLibrary={(farmId) => navigate('PestLibrary', { farmId })}
          onNavigateToWeatherRisk={(farmId) => navigate('WeatherRiskAnalytics', { farmId })}
        />
      );
    case 'PestLibrary':
      return (
        <PestLibraryScreen
          farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
          onBack={goBack}
          onNavigateToSchedule={() => {
            navigate('TreatmentSchedule', { farmId: params['farmId'] });
          }}
        />
      );
    case 'TreatmentSchedule':
      return (
        <TreatmentScheduleScreen
          farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
          onBack={goBack}
        />
      );
    case 'WeatherRiskAnalytics':
      return (
        <WeatherRiskAnalyticsScreen
          farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
          onBack={goBack}
        />
      );
    case 'ProduceCalendar':
      return (
        <ProduceCalendarScreen
          onBack={() => goBack('FarmManagement')}
          onNavigateToNewCrop={() => navigate('NewCrop')}
          onNavigateToCropDetail={(item) => {
            setSelectedCrop(item);
            navigate('CropDetail');
          }}
        />
      );
    case 'CropDetail':
      return (
        <CropDetailScreen
          crop={selectedCrop}
          onBack={() => goBack('ProduceCalendar')}
          onEdit={() => navigate('NewCrop')}
          onNavigateToMilestones={() => navigate('CropMilestones')}
          onNavigateToDiary={() => navigate('FarmDiary')}
          onNavigateToInputs={() => navigate('CropInputsApplied')}
          onNavigateToWorkforce={() => navigate('CropWorkforceHours')}
          onNavigateToNPK={() => navigate('CropNPKContribution')}
        />
      );
    case 'CropMilestones':
      return (
        <CropMilestonesScreen
          crop={selectedCrop}
          onBack={() => goBack('CropDetail')}
        />
      );
    case 'CropDiaryEntries':
      return (
        <CropDiaryEntriesScreen
          crop={selectedCrop}
          onBack={() => goBack('CropDetail')}
          onNewEntry={() => navigate('AddInputApplied', { fromDiary: '1', initialInputType: 'Fertigation' })}
        />
      );
    case 'CropInputsApplied':
      return (
        <CropInputsAppliedScreen
          // Input Management's "Full history" is farm-wide; Crop Detail's is that crop's.
          crop={params['scope'] === 'all' ? null : selectedCrop}
          onBack={goBack}
          onNewInput={() => navigate('AddInputApplied', params['scope'] === 'all' ? { scope: 'all' } : {})}
          // BR-56l: back from the edit screen remounts this list, which refetches.
          onEditInput={(target) => navigate('EditInputApplied', { ...target })}
        />
      );
    case 'AddInputApplied':
      return (
        <AddInputAppliedScreen
          // Opened from the farm-wide history there is no single crop to log against: never reuse a stale
          // one. With crop=null the screen shows a crop picker and the farmer chooses the crop.
          crop={params['scope'] === 'all' ? null : selectedCrop}
          initialInputType={params['initialInputType'] as 'Fertigation' | 'Pest Treatment' | undefined}
          onBack={goBack}
          onSave={goBack}
        />
      );
    case 'EditInputApplied':
      if (typeof params['farmCropId'] !== 'string' || typeof params['inputId'] !== 'string') return undefined;
      return (
        <EditInputAppliedScreen
          farmCropId={params['farmCropId']}
          inputId={params['inputId']}
          cropName={typeof params['cropName'] === 'string' ? params['cropName'] : null}
          zoneName={typeof params['zoneName'] === 'string' ? params['zoneName'] : null}
          onBack={goBack}
          onSaved={() => goBack()}
          onDeleted={() => goBack()}
        />
      );
    case 'CropWorkforceHours':
      return (
        <CropWorkforceHoursScreen
          crop={selectedCrop}
          onBack={() => goBack('CropDetail')}
        />
      );
    case 'CropNPKContribution':
      return (
        <CropNPKContributionScreen
          crop={selectedCrop}
          onBack={() => goBack('CropDetail')}
        />
      );
    case 'NewCrop':
      return (
        <NewCropScreen
          onBack={() => goBack('ProduceCalendar')}
          onCancel={() => goBack('ProduceCalendar')}
          onSaveCrop={() => {
            // NewCropScreen already persisted the crop via createFarmCrop();
            // ProduceCalendarScreen re-fetches from the API when it remounts.
            goBack('ProduceCalendar');
          }}
        />
      );
    case 'Weather':
      return (
        <WeatherScreen
          onNavigateBack={goBack}
        />
      );
    case 'ActiveCrops':
      return (
        <ActiveCropsScreen
          onNavigateBack={goBack}
          onNavigateToCropDetail={(crop) => {
            setSelectedCrop(crop);
            navigate('CropDetail');
          }}
          onNavigateToNewCrop={() => navigate('NewCrop')}
        />
      );
    case 'TohfaCalendar':
      return (
        <TohfaCalendarScreen
          onNavigateBack={goBack}
          onNavigateToCropInsight={() => navigate('CropPlanningInsight')}
        />
      );
    case 'CropPlanningInsight':
      return <CropPlanningInsightScreen onNavigateBack={goBack} />;
    default:
      return undefined;
  }
};
