/**
 * Screen 4 of the design: Log Details. Every row of the design is drawn; a
 * value the entry does not carry (Device / Browser always, Affected User for a
 * non-person entity, a null IP) is the dash. See ./systemSettingsLogic.ts for
 * the field mapping.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import type { AuditDownloadFormat } from './AuditLogListScreen';
import { DocumentIcon, DownloadIcon } from './systemSettingsIcons';
import { changeBullets, type AuditLogRow } from './systemSettingsLogic';
import { DetailRow, ScreenShell, SectionTitle } from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';

export interface AuditLogDetailScreenProps {
  row: AuditLogRow | null;
  onBack: () => void;
  onCopyText?: ((text: string) => void) | undefined;
  onDownloadLog?: ((entryId: string, format: AuditDownloadFormat) => void) | undefined;
}

export function AuditLogDetailScreen({ row, onBack, onCopyText, onDownloadLog }: AuditLogDetailScreenProps) {
  const v = (pick: (r: AuditLogRow) => string) => (row === null ? ADMIN_NO_VALUE : pick(row));
  const bullets = row === null ? [{ key: t('saSettings.logDetails.summary'), value: ADMIN_NO_VALUE }] : changeBullets(row.dto);
  const copyId = onCopyText === undefined || row === null ? undefined : () => onCopyText(row.id);
  const download = (format: AuditDownloadFormat) =>
    onDownloadLog === undefined || row === null ? undefined : () => onDownloadLog(row.id, format);
  const downloadJson = download('json');
  const downloadPdf = download('pdf');

  return (
    <ScreenShell title={t('saSettings.logDetails.title')} onBack={onBack} testID="saSettings.logDetails">
      <SectionTitle first>{t('saSettings.logDetails.section.details')}</SectionTitle>
      <View style={styles.detailCard}>
        <DetailRow
          label={t('saSettings.logDetails.logId')}
          value={v((r) => r.id)}
          strong
          onCopy={{ run: copyId }}
          testID="saSettings.logDetails.logId"
        />
        <DetailRow label={t('saSettings.logDetails.actionType')} value={v((r) => r.actionType)} testID="saSettings.logDetails.actionType" />
        <DetailRow label={t('saSettings.logDetails.module')} value={v((r) => r.module)} testID="saSettings.logDetails.module" />
        <DetailRow label={t('saSettings.logDetails.performedBy')} value={v((r) => r.performedBy)} testID="saSettings.logDetails.performedBy" />
        <DetailRow label={t('saSettings.logDetails.affectedUser')} value={v((r) => r.affectedUser)} testID="saSettings.logDetails.affectedUser" />
        <DetailRow label={t('saSettings.logDetails.ip')} value={v((r) => r.ip)} testID="saSettings.logDetails.ip" />
        <DetailRow label={t('saSettings.logDetails.device')} value={v((r) => r.device)} testID="saSettings.logDetails.device" />
        <DetailRow label={t('saSettings.logDetails.dateTime')} value={v((r) => r.timestamp)} last testID="saSettings.logDetails.dateTime" />
      </View>

      <SectionTitle>{t('saSettings.logDetails.section.changes')}</SectionTitle>
      <View style={styles.detailCard}>
        <Text style={styles.changeSubhead}>{t('saSettings.logDetails.changeSubhead')}</Text>
        <View style={styles.bulletList}>
          {bullets.map((b) => (
            <View key={b.key} style={styles.bulletRow} testID={`saSettings.logDetails.bullet.${b.key}`}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletKey} numberOfLines={1}>
                {t('saSettings.logDetails.bulletKey', { key: b.key })}
              </Text>
              <Text style={styles.bulletVal}>{b.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.downloadOutlineBtn, downloadJson === undefined && styles.disabled]}
          activeOpacity={0.8}
          onPress={downloadJson}
          disabled={downloadJson === undefined}
          testID="saSettings.logDetails.downloadJson"
        >
          <DownloadIcon color={adminColors.brand} strokeWidth="2" />
          <Text style={styles.downloadOutlineBtnText}>{t('saSettings.auditLog.menu.downloadJson')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.downloadSolidBtn, downloadPdf === undefined && styles.disabled]}
          activeOpacity={0.8}
          onPress={downloadPdf}
          disabled={downloadPdf === undefined}
          testID="saSettings.logDetails.downloadPdf"
        >
          <DocumentIcon color={adminColors.onBrand} lines={false} />
          <Text style={styles.downloadSolidBtnText}>{t('saSettings.auditLog.menu.downloadPdf')}</Text>
        </TouchableOpacity>
      </View>
    </ScreenShell>
  );
}
