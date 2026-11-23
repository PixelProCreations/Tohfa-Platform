import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import { AuditManagementScreen } from './AuditManagementScreen';
import { AuditScheduleAssignmentScreen } from './AuditScheduleAssignmentScreen';
import { ScheduleAuditFormScreen } from './ScheduleAuditFormScreen';
import { AuditHistoryComplianceScreen } from './AuditHistoryComplianceScreen';
import { GenerateAuditReportScreen } from './GenerateAuditReportScreen';
import { AuditReportsTierConfigScreen } from './AuditReportsTierConfigScreen';
import { AuditReportHistoryScreen } from './AuditReportHistoryScreen';
import { AuditScheduleScreen } from '../dashboard/AuditScheduleScreen';

export type AuditSubScreen =
  | 'management'
  | 'scheduleAssignment'
  | 'detailsRecord'
  | 'scheduleForm'
  | 'historyCompliance'
  | 'generateReport'
  | 'reportsTierConfig'
  | 'reportHistory'
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
  userScope,
  initialScreen = 'management',
  initialAuditId = 'AUD-2026-0034',
  onBack,
  onOpenFarmerProfile,
}: AuditManagementFlowProps): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<AuditSubScreen>(initialScreen);
  const [selectedAuditId, setSelectedAuditId] = useState<string>(initialAuditId);
  const [detailsReturnScreen, setDetailsReturnScreen] = useState<AuditSubScreen>('management');
  const [scheduleFormReturnScreen, setScheduleFormReturnScreen] = useState<AuditSubScreen>('management');
  const [reportHistoryReturnScreen, setReportHistoryReturnScreen] = useState<AuditSubScreen>('management');

  // 1. Audit Details (Image 2: Left Detail -> Middle Inspection/Findings -> Right Audit Inspection)
  if (currentScreen === 'detailsRecord') {
    return (
      <AuditScheduleScreen
        key={selectedAuditId}
        initialView="detail"
        initialAuditId={selectedAuditId}
        role={role}
        can={can}
        onBack={() => setCurrentScreen(detailsReturnScreen)}
        onNavigateFarmerProfile={onOpenFarmerProfile}
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
        onBack={() => setCurrentScreen(detailsReturnScreen)}
        onNavigateFarmerProfile={onOpenFarmerProfile}
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
        onBack={() => setCurrentScreen(scheduleFormReturnScreen)}
        onScheduleSuccess={() => setCurrentScreen(scheduleFormReturnScreen)}
        onSaveDraft={() => setCurrentScreen(scheduleFormReturnScreen)}
      />
    );
  }

  // 3. Schedule & Assignment View
  if (currentScreen === 'scheduleAssignment') {
    return (
      <AuditScheduleAssignmentScreen
        onBack={() => setCurrentScreen('management')}
        onViewSchedule={(schedule) => {
          setSelectedAuditId(schedule.code);
          setDetailsReturnScreen('scheduleAssignment');
          setCurrentScreen('detailsRecord');
        }}
        onEditSchedule={(schedule) => {
          setSelectedAuditId(schedule.code);
          setScheduleFormReturnScreen('scheduleAssignment');
          setCurrentScreen('scheduleForm');
        }}
        onReschedule={(schedule) => {
          setSelectedAuditId(schedule.code);
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
          setSelectedAuditId(audit.code);
          setDetailsReturnScreen('historyCompliance');
          setCurrentScreen('detailsRecord');
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
        onBack={() => setCurrentScreen(reportHistoryReturnScreen)}
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
        setSelectedAuditId(audit.code);
        setDetailsReturnScreen('management');
        setCurrentScreen('detailsRecord');
      }}
    />
  );
}

