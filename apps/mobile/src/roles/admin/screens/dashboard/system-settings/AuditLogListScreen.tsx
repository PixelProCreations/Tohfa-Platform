/**
 * Screen 3 of the design: Audit Log list (filter bar, one card per entry with a
 * 3-dots menu). Entries come only from GET /admin/audit-log (BR-35).
 *
 * The menu keeps all five design items. View Details works; Copy Log ID and
 * the two downloads call host callbacks and are disabled without them; Delete
 * Log is always disabled, because the audit log is append-only (BR-35, root
 * CLAUDE.md 2.3) and no delete route exists or may exist.
 */
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import type { CursorList } from '../../../api/hooks';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import {
  AUDIT_KIND_TONE,
  AuditKindIcon,
  DocumentIcon,
  DownloadIcon,
  EyeIcon,
  PencilIcon,
  PlusCircleWhiteIcon,
  ThreeDotsVerticalIcon,
  TrashIcon,
} from './systemSettingsIcons';
import type { AuditLogRow } from './systemSettingsLogic';
import { HeaderAction, ScreenShell } from './SystemSettingsParts';
import { ssStyles as styles } from './systemSettingsStyles';
import { adminColors } from '../../../theme';

export type AuditDownloadFormat = 'json' | 'pdf';

export interface AuditLogListScreenProps {
  list: CursorList<AuditLogRow>;
  onBack: () => void;
  onOpenFilter: () => void;
  onClearFilters: () => void;
  onOpenDetail: (row: AuditLogRow) => void;
  onCopyText?: ((text: string) => void) | undefined;
  onDownloadLog?: ((entryId: string, format: AuditDownloadFormat) => void) | undefined;
}

function MenuItem({
  label,
  icon,
  onPress,
  danger = false,
  testID,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: (() => void) | undefined;
  danger?: boolean;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItemRow, onPress === undefined && styles.disabled]}
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      testID={testID}
    >
      {icon}
      <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function AuditLogListScreen({
  list,
  onBack,
  onOpenFilter,
  onClearFilters,
  onOpenDetail,
  onCopyText,
  onDownloadLog,
}: AuditLogListScreenProps) {
  const [menuRow, setMenuRow] = useState<AuditLogRow | null>(null);
  const close = () => setMenuRow(null);
  const withRow = (run: ((row: AuditLogRow) => void) | undefined) =>
    run === undefined || menuRow === null
      ? undefined
      : () => {
          const row = menuRow;
          close();
          run(row);
        };

  const menu = (
    <Modal visible={menuRow !== null} transparent animationType="fade" onRequestClose={close}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={close} testID="saSettings.auditLog.menu">
        <View style={styles.menuPopupCard}>
          <MenuItem
            label={t('saSettings.auditLog.menu.view')}
            icon={<EyeIcon />}
            onPress={withRow(onOpenDetail)}
            testID="saSettings.auditLog.menu.view"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label={t('saSettings.auditLog.menu.copyId')}
            icon={<PencilIcon size={18} color={adminColors.ink} />}
            onPress={withRow(onCopyText === undefined ? undefined : (row) => onCopyText(row.id))}
            testID="saSettings.auditLog.menu.copyId"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label={t('saSettings.auditLog.menu.downloadJson')}
            icon={<DownloadIcon />}
            onPress={withRow(onDownloadLog === undefined ? undefined : (row) => onDownloadLog(row.id, 'json'))}
            testID="saSettings.auditLog.menu.downloadJson"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label={t('saSettings.auditLog.menu.downloadPdf')}
            icon={<DocumentIcon />}
            onPress={withRow(onDownloadLog === undefined ? undefined : (row) => onDownloadLog(row.id, 'pdf'))}
            testID="saSettings.auditLog.menu.downloadPdf"
          />
          <View style={styles.menuDivider} />
          <MenuItem
            label={t('saSettings.auditLog.menu.delete')}
            icon={<TrashIcon />}
            onPress={undefined}
            danger
            testID="saSettings.auditLog.menu.delete"
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ScreenShell
      title={t('saSettings.auditLog.title')}
      onBack={onBack}
      testID="saSettings.auditLog"
      action={
        <HeaderAction onPress={onOpenFilter} label={t('saSettings.filter.title')} testID="saSettings.auditLog.openFilter">
          <PlusCircleWhiteIcon />
        </HeaderAction>
      }
      overlay={menu}
    >
      <View style={styles.filterBar}>
        <Text style={styles.filterBarTitle}>{t('saSettings.auditLog.filterBar')}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onClearFilters} testID="saSettings.auditLog.clearAll">
          <Text style={styles.clearAllText}>{t('saSettings.common.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      {list.isLoading ? <AdminLoadingState label={t('saSettings.auditLog.loading')} /> : null}
      {!list.isLoading && list.error !== null && list.items.length === 0 ? (
        <AdminErrorState error={list.error} onRetry={list.refresh} />
      ) : null}
      {!list.isLoading && list.error === null && list.items.length === 0 ? (
        <AdminEmptyState title={t('saSettings.auditLog.emptyTitle')} subtitle={t('saSettings.auditLog.emptySubtitle')} />
      ) : null}

      {list.items.map((row) => (
        <View key={row.id} style={styles.logCard} testID={`saSettings.auditLog.row.${row.id}`}>
          <View style={[styles.logIconBox, { backgroundColor: AUDIT_KIND_TONE[row.kind].bg }]}>
            <AuditKindIcon kind={row.kind} />
          </View>
          <TouchableOpacity style={styles.logBody} activeOpacity={0.8} onPress={() => onOpenDetail(row)}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logTitle} numberOfLines={1}>
                {row.title}
              </Text>
              <Text style={styles.logTimestamp}>{row.timestamp}</Text>
            </View>
            <Text style={styles.logSubtitle} numberOfLines={1}>
              {row.subtitle}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreDotsBtn}
            activeOpacity={0.7}
            onPress={() => setMenuRow(row)}
            accessibilityRole="button"
            accessibilityLabel={t('saSettings.auditLog.menu.open')}
            testID={`saSettings.auditLog.row.${row.id}.menu`}
          >
            <ThreeDotsVerticalIcon />
          </TouchableOpacity>
        </View>
      ))}

      {list.hasMore ? (
        <TouchableOpacity style={styles.loadMore} onPress={list.loadMore} testID="saSettings.auditLog.loadMore">
          <Text style={styles.clearAllText}>{t('saSettings.common.loadMore')}</Text>
        </TouchableOpacity>
      ) : null}
    </ScreenShell>
  );
}
