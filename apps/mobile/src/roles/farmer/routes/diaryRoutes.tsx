import React from 'react';
import { FarmDiaryScreen } from '../screens/farm/diary/FarmDiaryScreen';
import { DiaryCalendarScreen } from '../screens/farm/diary/DiaryCalendarScreen';
import { NewFarmDiaryEntryScreen } from '../screens/farm/diary/NewFarmDiaryEntryScreen';
import { NewFarmDiaryEntryStep2Screen } from '../screens/farm/diary/NewFarmDiaryEntryStep2Screen';
import { NewFarmDiaryEntryStep3Screen } from '../screens/farm/diary/NewFarmDiaryEntryStep3Screen';
import type { FarmerRouteRenderer } from './types';

/** The farm diary, its calendar and the three-step new entry flow. */
export const renderDiaryRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack, selections }) => {
  const { selectedCrop } = selections;
  switch (screen) {
    case 'FarmDiary':
      return (
        <FarmDiaryScreen
          onBack={goBack}
          onNavigateToNewEntry={() => navigate('NewFarmDiaryEntry')}
          onNavigateToCalendar={() => navigate('DiaryCalendar')}
        />
      );
    case 'DiaryCalendar':
      return (
        <DiaryCalendarScreen
          onBack={goBack}
        />
      );
    case 'NewFarmDiaryEntry':
      return (
        <NewFarmDiaryEntryScreen
          crop={selectedCrop}
          onBack={goBack}
          onCancel={() => navigate('FarmDiary')}
          onNext={(data) => {
            // `navigate` replaces `params` with its second argument, so the
            // accumulated entry state must be passed forward explicitly.
            navigate('NewFarmDiaryEntryStep2', {
              ...params,
              plotId: data.plotId,
              plotName: data.plotName,
              farmCropId: data.farmCropId, // undefined clears a stale pick
              cropName: data.cropName,
              date: data.date,
            });
          }}
        />
      );
    case 'NewFarmDiaryEntryStep2':
      return (
        <NewFarmDiaryEntryStep2Screen
          crop={selectedCrop}
          categoryKey={typeof params['categoryKey'] === 'string' ? params['categoryKey'] : undefined}
          onChangeCategory={goBack}
          onBack={goBack}
          onCancel={() => navigate('FarmDiary')}
          onNext={(entryData) => {
            navigate('NewFarmDiaryEntryStep3', {
              ...params,
              categoryKey: entryData.categoryKey,
              categoryName: entryData.categoryName,
              subActivityKey: entryData.subActivityKey,
              subActivityName: entryData.subActivityName,
            });
          }}
        />
      );
    case 'NewFarmDiaryEntryStep3':
      // Ids are passed through without fallbacks: a missing plotId/categoryKey/
      // subActivityKey is a navigation bug that Step 3 surfaces, not something to mock.
      return (
        <NewFarmDiaryEntryStep3Screen
          crop={selectedCrop}
          plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
          farmCropId={typeof params['farmCropId'] === 'string' ? params['farmCropId'] : undefined}
          categoryKey={typeof params['categoryKey'] === 'string' ? params['categoryKey'] : undefined}
          subActivityKey={typeof params['subActivityKey'] === 'string' ? params['subActivityKey'] : undefined}
          entryCategory={typeof params['categoryName'] === 'string' ? params['categoryName'] : undefined}
          entrySubActivity={typeof params['subActivityName'] === 'string' ? params['subActivityName'] : undefined}
          fieldZone={typeof params['plotName'] === 'string' ? params['plotName'] : undefined}
          cropName={typeof params['cropName'] === 'string' ? params['cropName'] : undefined}
          onBack={goBack}
          onCancel={() => navigate('FarmDiary')}
          onDone={() => {
            if (selectedCrop) {
              navigate('CropDiaryEntries');
            } else {
              navigate('FarmDiary');
            }
          }}
          onSave={() => {
            if (selectedCrop) {
              navigate('CropDiaryEntries');
            } else {
              navigate('FarmDiary');
            }
          }}
        />
      );
    default:
      return undefined;
  }
};
