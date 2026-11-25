/**
 * Screen 1 of the design: "System Settings & Audit Log" hub, five rows. A row
 * is drawn only when the caller holds its docs/rbac.json code (the server
 * checks again on every request).
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { Can } from '../../../permissions/can';
import { t, type TranslationKey } from '../../../i18n';
import {
  ChevronRightIcon,
  HubAuditLogIcon,
  HubDatabaseIcon,
  HubExportIcon,
  HubGearIcon,
  HubIntegrationIcon,
} from './systemSettingsIcons';
import { SYSTEM_SETTINGS_CODES } from './systemSettingsLogic';
import { ScreenShell, SectionTitle } from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

export type HubRowId = 'config' | 'auditLog' | 'exportAuditLog' | 'integrationKeys' | 'emergencyExport';

interface HubRowSpec {
  id: HubRowId;
  code: string;
  title: TranslationKey;
  subtitle: TranslationKey;
  Icon: () => React.JSX.Element;
}

export const HUB_ROWS: readonly HubRowSpec[] = [
  {
    id: 'config',
    code: SYSTEM_SETTINGS_CODES.config,
    title: 'saSettings.hub.config.title',
    subtitle: 'saSettings.hub.config.subtitle',
    Icon: HubGearIcon,
  },
  {
    id: 'auditLog',
    code: SYSTEM_SETTINGS_CODES.auditView,
    title: 'saSettings.hub.auditLog.title',
    subtitle: 'saSettings.hub.auditLog.subtitle',
    Icon: HubAuditLogIcon,
  },
  {
    id: 'exportAuditLog',
    code: SYSTEM_SETTINGS_CODES.auditExport,
    title: 'saSettings.hub.exportAuditLog.title',
    subtitle: 'saSettings.hub.exportAuditLog.subtitle',
    Icon: HubExportIcon,
  },
  {
    id: 'integrationKeys',
    code: SYSTEM_SETTINGS_CODES.integrationKeys,
    title: 'saSettings.hub.integrationKeys.title',
    subtitle: 'saSettings.hub.integrationKeys.subtitle',
    Icon: HubIntegrationIcon,
  },
  {
    id: 'emergencyExport',
    code: SYSTEM_SETTINGS_CODES.dbExport,
    title: 'saSettings.hub.emergencyExport.title',
    subtitle: 'saSettings.hub.emergencyExport.subtitle',
    Icon: HubDatabaseIcon,
  },
];

export interface SystemSettingsHubScreenProps {
  can: Can;
  onBack: () => void;
  /** Per row; undefined = the row is drawn but disabled. */
  onOpen: (id: HubRowId) => (() => void) | undefined;
}

export function SystemSettingsHubScreen({ can, onBack, onOpen }: SystemSettingsHubScreenProps) {
  const rows = HUB_ROWS.filter((row) => can(row.code));
  return (
    <ScreenShell title={t('saSettings.hub.title')} onBack={onBack} testID="saSettings.hub">
      <SectionTitle first>{t('saSettings.hub.section')}</SectionTitle>
      {rows.map(({ id, title, subtitle, Icon }) => {
        const onPress = onOpen(id);
        return (
          <TouchableOpacity
            key={id}
            style={[styles.hubCard, onPress === undefined && styles.disabled]}
            activeOpacity={0.75}
            onPress={onPress}
            disabled={onPress === undefined}
            accessibilityRole="button"
            testID={`saSettings.hub.row.${id}`}
          >
            <View style={styles.hubIconBox}>
              <Icon />
            </View>
            <View style={styles.hubTextBox}>
              <Text style={styles.hubCardTitle}>{t(title)}</Text>
              <Text style={styles.hubCardSubtitle}>{t(subtitle)}</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        );
      })}
    </ScreenShell>
  );
}
