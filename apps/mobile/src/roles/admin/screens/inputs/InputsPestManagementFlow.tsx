import React, { useState } from 'react';
import { Alert } from 'react-native';
import type { Can } from '../../permissions/can';
import { useFlowBack } from '../warehouse/useFlowBack';

import { InputsPestHomeScreen } from './InputsPestHomeScreen';
import {
  ApprovedInputsScreen,
  AddNewInputScreen,
  EditInputScreen,
  type ApprovedInputItem,
  type CatalogInputItem,
} from './ApprovedInputsScreen';
import { InputDetailScreen } from './InputDetailScreen';
import {
  PestLibraryScreen,
  AddNewPestScreen,
  EditPestScreen,
  type PestItem,
} from './PestLibraryScreen';
import {
  ApplicationTreatmentGuidesScreen,
  type ApplicationTreatmentGuideItem,
} from './ApplicationTreatmentGuidesScreen';
import { AddNewGuideScreen, EditGuideScreen } from './AddNewGuideScreen';
import {
  FarmerPestIncidentsScreen,
  type IncidentItem,
} from './FarmerPestIncidentsScreen';
import { PestIncidentDetailScreen } from './PestIncidentDetailScreen';

export type InputsPestSubScreen =
  | 'home'
  | 'catalog'
  | 'add_input'
  | 'edit_input'
  | 'input_detail'
  | 'pest_library'
  | 'add_pest'
  | 'edit_pest'
  | 'application_guides'
  | 'add_guide'
  | 'edit_guide'
  | 'pest_incidents'
  | 'incident_detail';

export interface InputsPestManagementFlowProps {
  can?: Can | undefined;
  initialScreen?: InputsPestSubScreen | undefined;
  onBack: () => void;
}

export function InputsPestManagementFlow({
  can,
  initialScreen = 'home',
  onBack,
}: InputsPestManagementFlowProps): React.JSX.Element {
  const [activeScreen, setActiveScreen] = useState<InputsPestSubScreen>(initialScreen);
  const [selectedCatalogInput, setSelectedCatalogInput] = useState<ApprovedInputItem | undefined>(undefined);
  const [selectedPest, setSelectedPest] = useState<PestItem | undefined>(undefined);
  const [selectedGuide, setSelectedGuide] = useState<ApplicationTreatmentGuideItem | undefined>(undefined);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | undefined>(undefined);

  const handleBack = (): boolean => {
    if (activeScreen === 'home') {
      return false;
    }
    if (
      activeScreen === 'catalog' ||
      activeScreen === 'pest_library' ||
      activeScreen === 'application_guides' ||
      activeScreen === 'pest_incidents'
    ) {
      setActiveScreen('home');
    } else if (
      activeScreen === 'add_input' ||
      activeScreen === 'edit_input' ||
      activeScreen === 'input_detail'
    ) {
      setActiveScreen('catalog');
    } else if (activeScreen === 'add_pest' || activeScreen === 'edit_pest') {
      setActiveScreen('pest_library');
    } else if (activeScreen === 'add_guide' || activeScreen === 'edit_guide') {
      setActiveScreen('application_guides');
    } else if (activeScreen === 'incident_detail') {
      setActiveScreen('pest_incidents');
    } else {
      setActiveScreen('home');
    }
    return true;
  };
  useFlowBack(handleBack);

  if (activeScreen === 'catalog') {
    return (
      <ApprovedInputsScreen
        onBack={() => setActiveScreen('home')}
        onAddNewInput={() => {
          setSelectedCatalogInput(undefined);
          setActiveScreen('add_input');
        }}
        onEditInput={(item) => {
          setSelectedCatalogInput(item as unknown as ApprovedInputItem);
          setActiveScreen('edit_input');
        }}
        onSelectInput={(item) => {
          setSelectedCatalogInput(item as unknown as ApprovedInputItem);
          setActiveScreen('input_detail');
        }}
      />
    );
  }

  if (activeScreen === 'add_input') {
    return (
      <AddNewInputScreen
        onBack={() => setActiveScreen('catalog')}
        onSave={() => setActiveScreen('catalog')}
      />
    );
  }

  if (activeScreen === 'edit_input') {
    return (
      <EditInputScreen
        initialItem={(selectedCatalogInput as unknown as CatalogInputItem) ?? null}
        onBack={() => setActiveScreen('catalog')}
        onSave={(updated) => {
          if (updated) setSelectedCatalogInput(updated as unknown as ApprovedInputItem);
          setActiveScreen('catalog');
        }}
      />
    );
  }

  if (activeScreen === 'input_detail') {
    return (
      <InputDetailScreen
        inputItem={selectedCatalogInput}
        can={can}
        onBack={() => setActiveScreen('catalog')}
        onEdit={() => setActiveScreen('edit_input')}
      />
    );
  }

  if (activeScreen === 'pest_library') {
    return (
      <PestLibraryScreen
        onBack={() => setActiveScreen('home')}
        onAddNewPest={() => {
          setSelectedPest(undefined);
          setActiveScreen('add_pest');
        }}
        onEditPest={(pest) => {
          setSelectedPest(pest);
          setActiveScreen('edit_pest');
        }}
        onSelectPest={(pest) => {
          setSelectedPest(pest);
          Alert.alert(pest.name, `${pest.scientificName || ''}\n${pest.metaLine || ''}`);
        }}
      />
    );
  }

  if (activeScreen === 'add_pest') {
    return (
      <AddNewPestScreen
        onBack={() => setActiveScreen('pest_library')}
        onSave={() => setActiveScreen('pest_library')}
      />
    );
  }

  if (activeScreen === 'edit_pest') {
    return (
      <EditPestScreen
        initialPest={selectedPest ?? null}
        onBack={() => setActiveScreen('pest_library')}
        onSave={(updated) => {
          if (updated) setSelectedPest(updated as PestItem);
          setActiveScreen('pest_library');
        }}
      />
    );
  }

  if (activeScreen === 'application_guides') {
    return (
      <ApplicationTreatmentGuidesScreen
        onBack={() => setActiveScreen('home')}
        onAddNewGuide={() => {
          setSelectedGuide(undefined);
          setActiveScreen('add_guide');
        }}
        onEditGuide={(guide) => {
          setSelectedGuide(guide);
          setActiveScreen('edit_guide');
        }}
      />
    );
  }

  if (activeScreen === 'add_guide') {
    return (
      <AddNewGuideScreen
        onBack={() => setActiveScreen('application_guides')}
        onSave={() => setActiveScreen('application_guides')}
      />
    );
  }

  if (activeScreen === 'edit_guide') {
    return (
      <EditGuideScreen
        initialGuide={selectedGuide ?? null}
        onBack={() => setActiveScreen('application_guides')}
        onSave={() => setActiveScreen('application_guides')}
      />
    );
  }

  if (activeScreen === 'pest_incidents') {
    return (
      <FarmerPestIncidentsScreen
        onBack={() => setActiveScreen('home')}
        onSelectIncident={(incident) => {
          setSelectedIncident(incident);
          setActiveScreen('incident_detail');
        }}
      />
    );
  }

  if (activeScreen === 'incident_detail') {
    return (
      <PestIncidentDetailScreen
        incident={selectedIncident}
        onBack={() => setActiveScreen('pest_incidents')}
      />
    );
  }

  return (
    <InputsPestHomeScreen
      onBack={onBack}
      onNavigateApprovedInputs={() => setActiveScreen('catalog')}
      onNavigatePestLibrary={() => setActiveScreen('pest_library')}
      onNavigateApplicationGuides={() => setActiveScreen('application_guides')}
      onNavigatePestIncidents={() => setActiveScreen('pest_incidents')}
      onAddInput={() => setActiveScreen('add_input')}
    />
  );
}
