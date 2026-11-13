import React from 'react';
import { SoilManagementScreen } from '../screens/farm/soil/SoilManagementScreen';
import { SoilTestRecordsScreen } from '../screens/farm/soil/SoilTestRecordsScreen';
import { SoilHealthTrackerScreen } from '../screens/farm/soil/SoilHealthTrackerScreen';
import { SoilTypeClassificationScreen } from '../screens/farm/soil/SoilTypeClassificationScreen';
import { SoilAmendmentsLogScreen } from '../screens/farm/soil/SoilAmendmentsLogScreen';
import { CreateSoilAmendmentScreen } from '../screens/farm/CreateSoilAmendmentScreen';
import { CropRotationScreen } from '../screens/farm/crops/CropRotationScreen';
import { SoilMoistureTrackingScreen } from '../screens/farm/soil/SoilMoistureTrackingScreen';
import { ErosionConservationScreen } from '../screens/farm/soil/ErosionConservationScreen';
import { CreateErosionNoteScreen } from '../screens/farm/CreateErosionNoteScreen';
import { ExportSoilReportsScreen } from '../screens/farm/soil/ExportSoilReportsScreen';
import { UploadNewSoilTestScreen } from '../screens/farm/soil/UploadNewSoilTestScreen';
import { SoilTestScreen } from '../screens/profile/SoilTestScreen';
import type { FarmerRouteRenderer } from './types';

/** Soil management: tests, health, type, amendments, rotation, moisture, erosion and reports. */
export const renderSoilRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack }) => {
  // Every soil screen is scoped to one farm; an empty id is the screen's own "no farm" state.
  const farmId = typeof params['farmId'] === 'string' ? params['farmId'] : '';
  switch (screen) {
    case 'SoilManagement':
      return (
        <SoilManagementScreen
          onBack={goBack}
          onNavigateToSoilTestRecords={(id) => navigate('SoilTestRecords', { farmId: id })}
          onNavigateToSoilHealthTracker={(id) => navigate('SoilHealthTracker', { farmId: id })}
          onNavigateToSoilTypeClassification={(id) => navigate('SoilTypeClassification', { farmId: id })}
          onNavigateToAmendments={(id) => navigate('SoilAmendmentsLog', { farmId: id })}
          onNavigateToCropRotation={(id) => navigate('CropRotation', { farmId: id })}
          onNavigateToMoistureTracking={(id) => navigate('SoilMoistureTracking', { farmId: id })}
          onNavigateToErosionConservation={(id) => navigate('ErosionConservation', { farmId: id })}
          onNavigateToExportReports={(id) => navigate('ExportSoilReports', { farmId: id })}
          onNavigateToNewSoilTest={(id) => navigate('UploadNewSoilTest', { farmId: id })}
        />
      );
    case 'SoilTestRecords':
      return (
        <SoilTestRecordsScreen
          farmId={farmId}
          onBack={goBack}
          onNavigateToRecordDetail={() => navigate('SoilTest', { farmId: params['farmId'] })}
          onUploadNewTest={() => navigate('UploadNewSoilTest', { farmId: params['farmId'] })}
        />
      );
    case 'SoilHealthTracker':
      return <SoilHealthTrackerScreen farmId={farmId} onBack={goBack} />;
    case 'SoilTypeClassification':
      return <SoilTypeClassificationScreen farmId={farmId} onBack={goBack} />;
    case 'SoilAmendmentsLog':
      return (
        <SoilAmendmentsLogScreen
          farmId={farmId}
          onBack={goBack}
          onLogAmendment={() => navigate('CreateSoilAmendment', { farmId: params['farmId'] })}
        />
      );
    case 'CreateSoilAmendment':
    case 'LogSoilAmendment':
      return (
        <CreateSoilAmendmentScreen
          farmId={farmId}
          plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
          onBack={goBack}
          onSave={goBack}
        />
      );
    case 'CropRotation':
      return <CropRotationScreen farmId={farmId} onBack={goBack} />;
    case 'SoilMoistureTracking':
      return <SoilMoistureTrackingScreen farmId={farmId} onBack={goBack} />;
    case 'ErosionConservation':
      return (
        <ErosionConservationScreen
          farmId={farmId}
          onBack={goBack}
          onLogErosionNote={() => navigate('CreateErosionNote', { farmId: params['farmId'] })}
        />
      );
    case 'CreateErosionNote':
    case 'LogErosionNote':
      return (
        <CreateErosionNoteScreen
          farmId={farmId}
          plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
          onBack={goBack}
          onSave={goBack}
        />
      );
    case 'ExportSoilReports':
      return <ExportSoilReportsScreen farmId={farmId} onBack={goBack} />;
    case 'UploadNewSoilTest':
    case 'NewSoilTest':
      return (
        <UploadNewSoilTestScreen
          farmId={farmId}
          onBack={goBack}
          onSave={goBack}
          onNavigateToFieldContext={() => navigate('FieldContext', { farmId: params['farmId'], returnTo: screen })}
        />
      );
    case 'SoilTest':
      return (
        <SoilTestScreen
          farmId={farmId}
          onNavigateBack={goBack}
          onNavigateToNewSoilTest={() => navigate('UploadNewSoilTest', { farmId: params['farmId'] })}
        />
      );
    default:
      return undefined;
  }
};
