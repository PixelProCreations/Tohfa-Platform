import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import { AuditManagementScreen } from './AuditManagementScreen';
import { AuditScheduleAssignmentScreen } from './AuditScheduleAssignmentScreen';
import { ScheduleAuditFormScreen, type ScheduleAuditDraft } from './ScheduleAuditFormScreen';
import { AuditScheduleScreen } from '../dashboard/AuditScheduleScreen';
import { AuditInspectionOverviewScreen } from '../dashboard/AuditInspectionOverviewScreen';
import { AuditHistoryComplianceScreen } from './AuditHistoryComplianceScreen';
import { GenerateAuditReportScreen } from './GenerateAuditReportScreen';
import { AuditReportsTierConfigScreen } from './AuditReportsTierConfigScreen';
import { AuditReportHistoryScreen } from './AuditReportHistoryScreen';
import { AuditDetailsFarmerRecordsScreen } from './AuditDetailsFarmerRecordsScreen';

export type AuditSubScreen =
  | 'management'
  | 'scheduleAssignment'
  | 'detailsRecord'
  | 'detailsFarmerRecords'
  | 'scheduleForm'
  | 'inspectionOverview'
  | 'historyCompliance'
  | 'generateReport'
  | 'reportsTierConfig'
  | 'reportHistory';

export interface AuditManagementFlowProps {
  can?: Can | undefined;
  /** Accepted for the design's call shape; gating is `can` only. */
  role?: string | undefined;
  userScope?: { warehouseId?: string | undefined; zoneId?: string | undefined } | undefined;
  initialScreen?: AuditSubScreen | undefined;
  /** API id (uuid) of the audit the detail / form screens open on. */
  initialAuditId?: string | undefined;
  onBack: () => void;
  onOpenFarmerProfile?: ((farmerId?: string) => void) | undefined;
}

interface SavedDraft {
  auditId: string | undefined;
  draft: ScheduleAuditDraft;
}

/**
 * Audit Management flow (origin/Superadmin-main AuditManagementFlow): one
 * state machine over the audit screens. Every audit id it carries is the API
 * id of the row the user picked; nothing is preselected.
 */
export function AuditManagementFlow({
  can,
  initialScreen = 'management',
  initialAuditId,
  onBack,
  onOpenFarmerProfile,
}: AuditManagementFlowProps): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<AuditSubScreen>(initialScreen);
  const [selectedAuditId, setSelectedAuditId] = useState<string | undefined>(initialAuditId);
  const [detailsReturnScreen, setDetailsReturnScreen] = useState<AuditSubScreen>('management');
  const [scheduleFormReturnScreen, setScheduleFormReturnScreen] = useState<AuditSubScreen>('management');
  const [reportHistoryReturnScreen, setReportHistoryReturnScreen] = useState<AuditSubScreen>('management');
  const [farmerRecordsReturnScreen, setFarmerRecordsReturnScreen] = useState<AuditSubScreen>('management');
  const [savedDraft, setSavedDraft] = useState<SavedDraft | undefined>(undefined);

  const openDetails = (auditId: string, from: AuditSubScreen) => {
    setSelectedAuditId(auditId);
    setDetailsReturnScreen(from);
    setCurrentScreen('detailsRecord');
  };
  const openFarmerRecords = (auditId: string, from: AuditSubScreen) => {
    setSelectedAuditId(auditId);
    setFarmerRecordsReturnScreen(from);
    setCurrentScreen('detailsFarmerRecords');
  };
  const openScheduleForm = (auditId: string | undefined, from: AuditSubScreen) => {
    setSelectedAuditId(auditId);
    setScheduleFormReturnScreen(from);
    setCurrentScreen('scheduleForm');
  };

  const management = (
    <AuditManagementScreen
      can={can}
      onBack={onBack}
      onOpenSchedule={() => setCurrentScreen('scheduleAssignment')}
      onOpenHistory={() => setCurrentScreen('historyCompliance')}
      onOpenGenerateReport={() => setCurrentScreen('generateReport')}
      onOpenReportHistory={() => {
        setReportHistoryReturnScreen('management');
        setCurrentScreen('reportHistory');
      }}
      onSelectAuditItem={(audit) => openDetails(audit.id, 'management')}
      onNavigateSchedule={(_preFilter, auditId) => {
        if (auditId !== undefined) openDetails(auditId, 'management');
        else setCurrentScreen('scheduleAssignment');
      }}
    />
  );

  switch (currentScreen) {
    case 'detailsRecord':
      return (
        <AuditScheduleScreen
          key={selectedAuditId ?? ''}
          {...(can !== undefined ? { can } : {})}
          initialAuditId={selectedAuditId}
          initialView="detail"
          onBack={() => setCurrentScreen(detailsReturnScreen)}
          onNavigateFarmerProfile={onOpenFarmerProfile}
          onOpenInspection={(auditId) => {
            setSelectedAuditId(auditId);
            setCurrentScreen('inspectionOverview');
          }}
        />
      );

    case 'inspectionOverview':
      return selectedAuditId === undefined ? (
        management
      ) : (
        <AuditInspectionOverviewScreen
          record={{ id: selectedAuditId }}
          completedSections={{}}
          can={can}
          onSelectSection={() => {}}
          onBack={() => setCurrentScreen('detailsRecord')}
          onReviewSubmit={() => setCurrentScreen('detailsRecord')}
          onSaveDraft={() => setCurrentScreen('detailsRecord')}
        />
      );

    case 'scheduleForm':
      return (
        <ScheduleAuditFormScreen
          key={selectedAuditId ?? ''}
          can={can}
          initialAuditId={selectedAuditId}
          initialDraft={savedDraft !== undefined && savedDraft.auditId === selectedAuditId ? savedDraft.draft : undefined}
          onBack={() => setCurrentScreen(scheduleFormReturnScreen)}
          onScheduleSuccess={() => {
            setSavedDraft(undefined);
            setCurrentScreen(scheduleFormReturnScreen);
          }}
          onSaveDraft={(draft) => {
            setSavedDraft({ auditId: selectedAuditId, draft });
            setCurrentScreen(scheduleFormReturnScreen);
          }}
        />
      );

    case 'scheduleAssignment':
      return (
        <AuditScheduleAssignmentScreen
          can={can}
          onBack={() => setCurrentScreen('management')}
          onViewSchedule={(row) => openDetails(row.id, 'scheduleAssignment')}
          onEditSchedule={(row) => openScheduleForm(row.id, 'scheduleAssignment')}
          onReschedule={(row) => openScheduleForm(row.id, 'scheduleAssignment')}
        />
      );

    case 'historyCompliance':
      return (
        <AuditHistoryComplianceScreen
          can={can}
          onBack={() => setCurrentScreen('management')}
          onSelectAudit={(audit) => openFarmerRecords(audit.id, 'historyCompliance')}
        />
      );

    // The design's `detailsRecord`. It is a second detail view, kept separate
    // from the existing `detailsRecord` (AuditScheduleScreen) route so that the
    // schedule-side entry points behave exactly as they did before.
    case 'detailsFarmerRecords':
      return (
        <AuditDetailsFarmerRecordsScreen
          key={selectedAuditId ?? ''}
          auditId={selectedAuditId}
          can={can}
          onBack={() => setCurrentScreen(farmerRecordsReturnScreen)}
          onEditSchedule={() => openScheduleForm(selectedAuditId, 'detailsFarmerRecords')}
          onReschedule={() => openScheduleForm(selectedAuditId, 'detailsFarmerRecords')}
          onCancelSchedule={() => setCurrentScreen(farmerRecordsReturnScreen)}
          onOpenFarmerProfile={onOpenFarmerProfile}
        />
      );

    case 'generateReport':
      return (
        <GenerateAuditReportScreen
          can={can}
          auditId={selectedAuditId}
          onBack={() => setCurrentScreen('management')}
          onConfigureReport={() => setCurrentScreen('reportsTierConfig')}
          onGenerateReport={() => setCurrentScreen('reportsTierConfig')}
        />
      );

    case 'reportsTierConfig':
      return (
        <AuditReportsTierConfigScreen
          can={can}
          onBack={() => setCurrentScreen('generateReport')}
          onGenerateReportSuccess={() => {
            setReportHistoryReturnScreen('reportsTierConfig');
            setCurrentScreen('reportHistory');
          }}
        />
      );

    // Reachable from the hub and from reportsTierConfig, so back has to return
    // to whichever one opened it.
    case 'reportHistory':
      return <AuditReportHistoryScreen can={can} onBack={() => setCurrentScreen(reportHistoryReturnScreen)} />;

    case 'management':
    default:
      return management;
  }
}
