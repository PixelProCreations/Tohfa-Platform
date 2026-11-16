/**
 * Super Admin "System Settings & Audit Log" flow, ported from the design
 * (origin/Superadmin-main apps/mobile/src/roles/admin/screens/dashboard/
 * SystemSettingsFlow.tsx). This file only hosts navigation between the
 * sub-screens in ./system-settings/ and owns the audit-log query; each
 * sub-screen's docblock says what is live and what is the dash.
 *
 * Live: the Audit Log list, its detail and its filters (GET /admin/audit-log,
 * auditlog.view). Everything else has no endpoint yet and is drawn in full
 * with the dash and disabled writes: System Configuration, Integration Keys
 * (list / add / detail / edit) and Emergency Database Export.
 *
 * Downloads, clipboard and the raw export are host concerns: each control
 * runs the matching optional callback and is disabled without it.
 */
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import {
  AuditLogDetailScreen,
  AuditLogFilterScreen,
  AuditLogListScreen,
  EmergencyExportScreen,
  IntegrationDetailView,
  IntegrationFormScreen,
  IntegrationKeysScreen,
  SYSTEM_SETTINGS_CODES,
  SystemConfigurationScreen,
  SystemSettingsHubScreen,
  applyAuditFilters,
  DEFAULT_APPLIED_AUDIT_FILTERS,
  distinctValues,
  useAuditLogList,
  type AppliedAuditFilters,
  type AuditDownloadFormat,
  type AuditLogRow,
  type EmergencyExportRequest,
  type HubRowId,
  type IntegrationKeyView,
  type SystemSettingsEntryScreen,
  type SystemSettingsScreen,
} from './system-settings';

export type AuditExportFormat = 'csv' | 'pdf' | 'json';

export interface SystemSettingsFlowProps {
  onBack: () => void;
  can: Can;
  initialScreen?: SystemSettingsEntryScreen | undefined;
  /** Copy a value (log id, sender id, endpoint) to the clipboard. */
  onCopyText?: ((text: string) => void) | undefined;
  /** Export the audit log with the applied filters. Only CSV has a route (GET /admin/audit-log/export). */
  onExportAuditLog?: ((format: AuditExportFormat, filters: AppliedAuditFilters) => void) | undefined;
  /** Download one audit entry. No route exists for either format. */
  onDownloadLog?: ((entryId: string, format: AuditDownloadFormat) => void) | undefined;
  /** Run the raw database export (system.db_export.raw). No route exists. */
  onEmergencyExport?: ((request: EmergencyExportRequest) => void) | undefined;
}

const ENTRY_CODE: Record<SystemSettingsEntryScreen, string | null> = {
  hub: null,
  config: SYSTEM_SETTINGS_CODES.config,
  audit_logs: SYSTEM_SETTINGS_CODES.auditView,
  integration_keys: SYSTEM_SETTINGS_CODES.integrationKeys,
  emergency_export: SYSTEM_SETTINGS_CODES.dbExport,
};

/** No integration-keys endpoint: the list is always empty until one exists. */
const NO_INTEGRATIONS: readonly IntegrationKeyView[] = [];

const AUDIT_SCREENS: readonly SystemSettingsScreen[] = ['audit_logs', 'log_details', 'filter_logs'];

export function SystemSettingsFlow({
  onBack,
  can,
  initialScreen = 'hub',
  onCopyText,
  onExportAuditLog,
  onDownloadLog,
  onEmergencyExport,
}: SystemSettingsFlowProps): React.JSX.Element {
  const entryCode = ENTRY_CODE[initialScreen];
  const [screen, setScreen] = useState<SystemSettingsScreen>(
    entryCode === null || can(entryCode) ? initialScreen : 'hub',
  );
  const [filters, setFilters] = useState<AppliedAuditFilters>(DEFAULT_APPLIED_AUDIT_FILTERS);
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationKeyView | null>(null);
  const [seenActions, setSeenActions] = useState<string[]>([]);
  const [seenModules, setSeenModules] = useState<string[]>([]);

  const canAudit = can(SYSTEM_SETTINGS_CODES.auditView);
  const auditList = useAuditLogList(filters, canAudit && AUDIT_SCREENS.includes(screen));

  useEffect(() => {
    if (auditList.items.length === 0) return;
    setSeenActions((prev) => distinctValues([...prev, ...auditList.items.map((r) => r.dto.action)]));
    setSeenModules((prev) => distinctValues([...prev, ...auditList.items.map((r) => r.dto.entityType)]));
  }, [auditList.items]);

  const toHub = () => setScreen('hub');

  const exportAuditLog =
    onExportAuditLog === undefined
      ? undefined
      : () =>
          Alert.alert(t('saSettings.hub.exportAuditLog.title'), t('saSettings.exportAudit.prompt'), [
            { text: t('saSettings.exportAudit.csv'), onPress: () => onExportAuditLog('csv', filters) },
            { text: t('saSettings.exportAudit.pdf'), onPress: () => onExportAuditLog('pdf', filters) },
            { text: t('saSettings.exportAudit.json'), onPress: () => onExportAuditLog('json', filters) },
            { text: t('saSettings.common.cancel'), style: 'cancel' },
          ]);

  const hubTarget = (id: HubRowId): (() => void) | undefined => {
    if (id === 'config') return () => setScreen('config');
    if (id === 'auditLog') return () => setScreen('audit_logs');
    if (id === 'exportAuditLog') return exportAuditLog;
    if (id === 'integrationKeys') return () => setScreen('integration_keys');
    return () => setScreen('emergency_export');
  };

  const openLog = (row: AuditLogRow) => {
    setSelectedLog(row);
    setScreen('log_details');
  };

  switch (screen) {
    case 'config':
      return <SystemConfigurationScreen onBack={toHub} />;
    case 'audit_logs':
      return (
        <AuditLogListScreen
          list={auditList}
          onBack={toHub}
          onOpenFilter={() => setScreen('filter_logs')}
          onClearFilters={() => setFilters(DEFAULT_APPLIED_AUDIT_FILTERS)}
          onOpenDetail={openLog}
          onCopyText={onCopyText}
          onDownloadLog={onDownloadLog}
        />
      );
    case 'log_details':
      return (
        <AuditLogDetailScreen
          row={selectedLog}
          onBack={() => setScreen('audit_logs')}
          onCopyText={onCopyText}
          onDownloadLog={onDownloadLog}
        />
      );
    case 'filter_logs':
      return (
        <AuditLogFilterScreen
          initial={filters}
          actionOptions={seenActions}
          moduleOptions={seenModules}
          onBack={() => setScreen('audit_logs')}
          onApply={(draft) => {
            setFilters(applyAuditFilters(draft, new Date()));
            setScreen('audit_logs');
          }}
        />
      );
    case 'integration_keys':
      return (
        <IntegrationKeysScreen
          items={NO_INTEGRATIONS}
          onBack={toHub}
          onAdd={() => setScreen('add_integration')}
          onOpen={(item) => {
            setSelectedIntegration(item);
            setScreen('integration_detail');
          }}
        />
      );
    case 'add_integration':
      return <IntegrationFormScreen key="add" mode="add" integration={null} onBack={() => setScreen('integration_keys')} />;
    case 'integration_detail':
      return (
        <IntegrationDetailView
          integration={selectedIntegration}
          onBack={() => setScreen('integration_keys')}
          onEdit={() => setScreen('edit_integration')}
          onCopyText={onCopyText}
        />
      );
    case 'edit_integration':
      return (
        <IntegrationFormScreen
          key="edit"
          mode="edit"
          integration={selectedIntegration}
          onBack={() => setScreen('integration_detail')}
        />
      );
    case 'emergency_export':
      return <EmergencyExportScreen onBack={toHub} onExport={onEmergencyExport} />;
    case 'hub':
    default:
      return <SystemSettingsHubScreen can={can} onBack={onBack} onOpen={hubTarget} />;
  }
}
