import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import { AuditManagementScreen } from './AuditManagementScreen';
import { AuditScheduleAssignmentScreen } from './AuditScheduleAssignmentScreen';
import { ScheduleAuditFormScreen } from './ScheduleAuditFormScreen';
import { AuditHistoryComplianceScreen } from './AuditHistoryComplianceScreen';
import { GenerateAuditReportScreen } from './GenerateAuditReportScreen';
import { AuditReportsTierConfigScreen } from './AuditReportsTierConfigScreen';
import { AuditReportHistoryScreen } from './AuditReportHistoryScreen';
import { AuditReportPreviewScreen } from './AuditReportPreviewScreen';
import { AuditReportExportWizardScreen } from './AuditReportExportWizardScreen';
import { AuditDetailsFarmerRecordsScreen } from './AuditDetailsFarmerRecordsScreen';
import { AuditScheduleScreen } from '../dashboard/AuditScheduleScreen';

export type AuditSubScreen =
  | 'management'
  | 'scheduleAssignment'
  | 'detailsRecord'
  | 'completedDetailsRecord'
  | 'scheduleForm'
  | 'historyCompliance'
  | 'generateReport'
  | 'reportsTierConfig'
  | 'reportHistory'
  | 'reportDetails'
  | 'exportWizard'
  | 'auditInspection'
  | 'soilTesting';

export interface AuditManagementFlowProps {
  can?: Can | undefined;
  role?: string | undefined;
  userScope?: { warehouseId?: string | undefined; zoneId?: string | undefined } | undefined;
  initialScreen?: AuditSubScreen | undefined;
  initialAuditId?: string | undefined;
  onBack: () => void;
  onOpenFarmerProfile?: ((farmerId?: string) => void) | undefined;
}

/**
 * AuditManagementFlow
 *
 * Consolidated state machine flow for Audit Management across Super Admin
 * and TOHFA Admin shells. Eliminates duplicate screen copies and handles
 * bidirectional redirects cleanly with RBAC checks.
 */
export function AuditManagementFlow({
  can,
  role = 'SUPER_ADMIN',
  userScope: _userScope,
  initialScreen = 'management',
  initialAuditId = 'AUD-2026-0034',
  onBack,
  onOpenFarmerProfile,
}: AuditManagementFlowProps): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<AuditSubScreen>(initialScreen);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(initialAuditId);
  const [selectedAuditStatus, setSelectedAuditStatus] = useState<string>('Scheduled');
  const [selectedFarmerName, setSelectedFarmerName] = useState<string>('Selvi');
  const [auditDetailsInitialTab, setAuditDetailsInitialTab] = useState<'details' | 'inspection'>('details');
  const [detailsReturnScreen, setDetailsReturnScreen] = useState<AuditSubScreen>('management');
  const [scheduleFormReturnScreen, setScheduleFormReturnScreen] = useState<AuditSubScreen>('management');
  const [reportHistoryReturnScreen, setReportHistoryReturnScreen] = useState<AuditSubScreen>('management');
  const [inspectionReturnScreen, setInspectionReturnScreen] = useState<AuditSubScreen>('completedDetailsRecord');
  const [selectedReportTitle, setSelectedReportTitle] = useState<string>('Audit Summary Report');
  const [rescheduleData, setRescheduleData] = useState<{
    auditId: string;
    farmer?: string;
    farm?: string;
    auditor?: string;
    previousDate?: string;
    mode?: 'schedule' | 'reschedule';
  } | null>(null);

  const handleSelectAudit = (
    code: string,
    badge: string,
    farmerName?: string,
    returnTo: AuditSubScreen = 'management',
  ) => {
    setSelectedAuditId(code);
    setSelectedAuditStatus(badge);
    setSelectedFarmerName(farmerName || 'Farmer');
    setDetailsReturnScreen(returnTo);

    // No reschedule: all audits route directly to completedDetailsRecord
    setAuditDetailsInitialTab('inspection');
    setCurrentScreen('completedDetailsRecord');
  };

  // 1. Completed Audit Details & Farmer Records / Inspection & Findings (Direct flow, no intermediate detail screen)
  if (currentScreen === 'completedDetailsRecord') {
    return (
      <AuditDetailsFarmerRecordsScreen
        auditId={selectedAuditId}
        status={selectedAuditStatus}
        farmerName={selectedFarmerName}
        initialTab={auditDetailsInitialTab}
        role={role}
        can={can}
        onBack={() => {
          const target = (!detailsReturnScreen || detailsReturnScreen === 'completedDetailsRecord')
            ? 'management'
            : detailsReturnScreen;
          setCurrentScreen(target);
        }}
        onOpenFarmerProfile={onOpenFarmerProfile}
        onStartAudit={() => {
          setInspectionReturnScreen('completedDetailsRecord');
          setCurrentScreen('auditInspection');
        }}
        onResumeAudit={() => {
          setInspectionReturnScreen('completedDetailsRecord');
          setCurrentScreen('auditInspection');
        }}
      />
    );
  }

  // 1b. Direct Audit Inspection (12 sections)
  if (currentScreen === 'auditInspection') {
    return (
      <AuditScheduleScreen
        key={selectedAuditId}
        initialView="audit_inspection"
        initialAuditId={selectedAuditId}
        role={role}
        can={can}
        onBack={() => setCurrentScreen(inspectionReturnScreen || 'completedDetailsRecord')}
        onNavigateFarmerProfile={onOpenFarmerProfile}
        onCompleteAudit={() => {
          // If 12 steps are completed, list down in view audit history
          setCurrentScreen('historyCompliance');
        }}
      />
    );
  }

  // 1c. Direct Soil Testing & Soil Report (Step 5)
  if (currentScreen === 'soilTesting') {
    return (
      <AuditScheduleScreen
        key={selectedAuditId}
        initialView="inspection_step"
        initialStep={5}
        initialAuditId={selectedAuditId}
        role={role}
        can={can}
        onBack={() => setCurrentScreen(detailsReturnScreen)}
        onNavigateFarmerProfile={onOpenFarmerProfile}
      />
    );
  }

  // 2. Schedule Audit Form
  if (currentScreen === 'scheduleForm') {
    return (
      <ScheduleAuditFormScreen
        initialAuditId={selectedAuditId}
        initialFarmer={rescheduleData?.farmer}
        initialFarm={rescheduleData?.farm}
        initialAuditor={rescheduleData?.auditor}
        previousDate={rescheduleData?.previousDate}
        mode={rescheduleData?.mode || 'schedule'}
        onBack={() => {
          setRescheduleData(null);
          setCurrentScreen(scheduleFormReturnScreen);
        }}
        onScheduleSuccess={() => {
          setRescheduleData(null);
          setCurrentScreen(scheduleFormReturnScreen);
        }}
        onSaveDraft={() => {
          setRescheduleData(null);
          setCurrentScreen(scheduleFormReturnScreen);
        }}
      />
    );
  }

  // 3. Schedule & Assignment View
  if (currentScreen === 'scheduleAssignment') {
    return (
      <AuditScheduleAssignmentScreen
        onBack={() => setCurrentScreen('management')}
        onViewSchedule={(schedule) => {
          handleSelectAudit(schedule.code, schedule.status, schedule.farmerName, 'scheduleAssignment');
        }}
        onUpdateSchedule={(schedule) => {
          handleSelectAudit(schedule.code, schedule.status, schedule.farmerName, 'scheduleAssignment');
        }}
        onReviewSchedule={(schedule) => {
          handleSelectAudit(schedule.code, schedule.status, schedule.farmerName, 'scheduleAssignment');
        }}
        onReschedule={(schedule) => {
          setSelectedAuditId(schedule.code);
          setRescheduleData({
            auditId: schedule.code,
            farmer: schedule.farmerName,
            farm: `${schedule.farmLocation} · ${schedule.zone}`,
            auditor: schedule.auditor.replace('Auditor: ', '').replace('Auditor ', ''),
            previousDate: schedule.dateStr,
            mode: 'reschedule',
          });
          setScheduleFormReturnScreen('scheduleAssignment');
          setCurrentScreen('scheduleForm');
        }}
      />
    );
  }

  // 4. Audit History & Compliance Records
  if (currentScreen === 'historyCompliance') {
    return (
      <AuditHistoryComplianceScreen
        onBack={() => setCurrentScreen('management')}
        onSelectAudit={(audit) => {
          handleSelectAudit(audit.code, audit.badge, audit.farmerName, 'historyCompliance');
        }}
      />
    );
  }

  // 5. Generate Audit Report
  if (currentScreen === 'generateReport') {
    return (
      <GenerateAuditReportScreen
        onBack={() => setCurrentScreen('management')}
        onConfigureReport={() => setCurrentScreen('reportsTierConfig')}
        onGenerateReport={() => setCurrentScreen('reportsTierConfig')}
      />
    );
  }

  // 6. Reports & Compliance Tier Configuration (RBAC gated: audit.tier.configure_thresholds)
  if (currentScreen === 'reportsTierConfig') {
    return (
      <AuditReportsTierConfigScreen
        onBack={() => setCurrentScreen('generateReport')}
        onExportReport={(repName) => {
          setSelectedReportTitle(repName || 'Audit Summary Report');
          setCurrentScreen('exportWizard');
        }}
        onGenerateReportSuccess={() => {
          setReportHistoryReturnScreen('reportsTierConfig');
          setCurrentScreen('reportHistory');
        }}
      />
    );
  }

  // 7. Audit Report History
  if (currentScreen === 'reportHistory') {
    return (
      <AuditReportHistoryScreen
        role={role}
        onBack={() => setCurrentScreen(reportHistoryReturnScreen)}
        onSelectReport={(report) => {
          setSelectedReportTitle(report.title || 'Audit Summary Report');
          setCurrentScreen('reportDetails');
        }}
      />
    );
  }

  // 7b. Report Details Preview (M5-S06b)
  if (currentScreen === 'reportDetails') {
    return (
      <AuditReportPreviewScreen
        reportTitle={selectedReportTitle}
        onBack={() => setCurrentScreen('reportHistory')}
      />
    );
  }

  // 7c. 5-Step Export Report Wizard (Audit Data)
  if (currentScreen === 'exportWizard') {
    return (
      <AuditReportExportWizardScreen
        initialReportName={selectedReportTitle}
        role={role}
        can={can}
        onBack={() => setCurrentScreen('reportsTierConfig')}
        onFinishExport={() => {
          setReportHistoryReturnScreen('reportsTierConfig');
          setCurrentScreen('reportHistory');
        }}
      />
    );
  }

  // 8. Main Audit Management Dashboard (Default)
  return (
    <AuditManagementScreen
      role={role}
      onBack={onBack}
      onOpenSchedule={() => setCurrentScreen('scheduleAssignment')}
      onOpenHistory={() => setCurrentScreen('historyCompliance')}
      onOpenGenerateReport={() => setCurrentScreen('generateReport')}
      onOpenReportHistory={() => {
        setReportHistoryReturnScreen('management');
        setCurrentScreen('reportHistory');
      }}
      onSelectAuditItem={(audit) => {
        handleSelectAudit(audit.code, audit.badge, audit.farmerName, 'management');
      }}
    />
  );
}

