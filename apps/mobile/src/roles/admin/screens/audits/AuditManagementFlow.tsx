import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import { AuditManagementScreen } from './AuditManagementScreen';
import { AuditScheduleAssignmentScreen } from './AuditScheduleAssignmentScreen';
import { ScheduleAuditFormScreen, type ScheduleAuditDraft } from './ScheduleAuditFormScreen';
import { AuditScheduleScreen } from '../dashboard/AuditScheduleScreen';
import { AuditInspectionOverviewScreen } from '../dashboard/AuditInspectionOverviewScreen';

export type AuditSubScreen =
  | 'management'
  | 'scheduleAssignment'
  | 'detailsRecord'
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
  const [savedDraft, setSavedDraft] = useState<SavedDraft | undefined>(undefined);

  const openDetails = (auditId: string, from: AuditSubScreen) => {
    setSelectedAuditId(auditId);
    setDetailsReturnScreen(from);
    setCurrentScreen('detailsRecord');
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

    // Second wave: historyCompliance, generateReport, reportsTierConfig and
    // reportHistory render their screens here once built. Their transitions:
    //   historyCompliance  -> onBack: management; onSelectAudit: openDetails(audit.id, 'historyCompliance')
    //   generateReport     -> onBack: management; configure / generate: reportsTierConfig
    //   reportsTierConfig  -> onBack: generateReport; success: reportHistory (return reportsTierConfig)
    //   reportHistory      -> onBack: reportHistoryReturnScreen
    case 'historyCompliance':
    case 'generateReport':
    case 'reportsTierConfig':
    case 'reportHistory':
      void reportHistoryReturnScreen;
      return management;

    case 'management':
    default:
      return management;
  }
}
