/**
 * ProduceControlFlow: Produce Calendar & Overview (M4-S01) and its Filters
 * popup (M4-S01-1), Crop Data (M4-S28a,b,c), Add / Edit Crop Type, Add
 * Activity Category (M3-S28b) and Create Event.
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

export type ProduceControlSubScreen = 'calendar' | 'cropData' | 'addCropType' | 'addActivity' | 'createEvent';

export interface ProduceControlFlowProps {
  can: Can;
  initialScreen?: ProduceControlSubScreen | undefined;
  onBack: () => void;
}

export function ProduceControlFlow({ can, initialScreen = 'calendar', onBack }: ProduceControlFlowProps): React.JSX.Element {
  const [activeSubScreen, setActiveSubScreen] = useState<ProduceControlSubScreen>(initialScreen);
  const [selectedCropItem, setSelectedCropItem] = useState<CropTypeItem | undefined>(undefined);
  // Crop Data returns to the tab it was left on.
  const [cropDataSegment, setCropDataSegment] = useState<CropDataSegment>('crop_types');

  const backToCropData = () => {
    setSelectedCropItem(undefined);
    setActiveSubScreen('cropData');
  };
  const backToCalendar = () => setActiveSubScreen('calendar');

  const handleBack = (): boolean => {
    if (activeSubScreen === 'calendar' || (activeSubScreen === 'cropData' && initialScreen === 'cropData')) return false;
    if (activeSubScreen === 'cropData') backToCalendar();
    else backToCropData();
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

  return <ProduceCalendarView can={can} onBack={onBack} onOpenCropData={() => setActiveSubScreen('cropData')} />;
}
