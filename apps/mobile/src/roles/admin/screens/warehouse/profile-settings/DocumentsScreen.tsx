// Design id: M15-S05
/**
 * Warehouse Documents for the Main and Sub warehouse admins (FINAL_LIST #88,
 * BR-105).
 *
 * Live: the list is GET /warehouses/{id}/documents (warehouse.document.view:
 * Sub its own warehouse, Main the warehouse picked in the header from the real
 * warehouse list). The status (Active / Expiring soon / Expired / Archived) is
 * derived by the server from system_config's warning window and shown as sent;
 * the status and type chips and the search are server filters.
 *
 * The detail is GET .../{documentId}. Open file asks for the detail again and
 * hands its signed 15-minute URL to the OS viewer (Linking), where the admin
 * can also save it; a deleted file says so instead.
 *
 * Edit metadata and Archive need warehouse.document.manage and a
 * single-warehouse scope (mappers_documents canManageDocuments): the Main
 * admin holds the code (rbac all) but, by owner decision 2026-10-23 (design
 * M15-08), sees documents view-only; the server would still accept its writes.
 * A Sub admin keeps its code (rbac none today). Never on an archived document.
 * An EXPIRING_SOON document shows the design's renewal banner. Adding a
 * document needs a file picker and an upload to POST /uploads/sign, which the
 * admin app does not have yet (the only uploader is farmer-only, and the
 * cross-role guard keeps it out of admin), so Add is not offered; a note says
 * why.
 *
 * Every state (loading, error with Retry, empty) comes from ../shared; error
 * text is adminErrorKey's, never the server's detail.
 */
import React, { useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  InfoCard,
  InfoNote,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import {
  canManageDocument,
  canManageDocuments,
  documentExpiryBannerKey,
  documentsReadOnlyNoteKey,
  DOCUMENT_STATUS_FILTERS,
  DOCUMENT_TYPE_FILTERS,
  documentEditBody,
  documentFormOf,
  documentTypeLabel,
  statusFilterLabel,
  typeFilterLabel,
  type DocumentForm,
  type DocumentStatusFilter,
  type DocumentTypeFilter,
  type WarehouseDocumentDetailView,
  type WarehouseDocumentView,
} from './mappers_documents';
import { WAREHOUSE_DOCUMENT_TYPES, type UpdateWarehouseDocumentBody } from '../../../api/warehouseDocuments';
import type { WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { DocumentFileMissingError } from './useWarehouseDocuments';
import { SingleWarehouseHeader, warehouseProfileLayout, WarningTriangleIcon } from './WarehouseProfileParts';

/** The docs/rbac.json codes this screen checks (both exist there). */
export const WAREHOUSE_DOCUMENT_CODES = {
  view: 'warehouse.document.view',
  manage: 'warehouse.document.manage',
} as const;

export interface DocumentsScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** The warehouse uuid in the header (Sub: its own; Main: the real pick). */
  headerWarehouseId?: string | undefined;
  /** No warehouse to ask for (Main before the warehouse list loads, or none). */
  unavailable?: boolean | undefined;

  documents?: readonly WarehouseDocumentView[] | undefined;
  total?: number | null | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;

  statusFilter: DocumentStatusFilter;
  onStatusFilterChange: (next: DocumentStatusFilter) => void;
  typeFilter: DocumentTypeFilter;
  onTypeFilterChange: (next: DocumentTypeFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (next: string) => void;

  /** The open document (detail view), or undefined for the list. */
  openDocumentId?: string | undefined;
  onOpenDocument: (documentId: string | undefined) => void;
  detail?: WarehouseDocumentDetailView | undefined;
  detailLoading?: boolean | undefined;
  detailError?: unknown;
  onRetryDetail?: (() => void) | undefined;

  onOpenFile: (documentId: string) => void;
  isOpeningFile?: boolean | undefined;
  openFileError?: unknown;

  onSaveEdit: (documentId: string, body: UpdateWarehouseDocumentBody, onDone: () => void) => void;
  isSavingEdit?: boolean | undefined;
  saveEditError?: unknown;
  onResetEdit?: (() => void) | undefined;

  onArchive: (documentId: string) => void;
  isArchiving?: boolean | undefined;
  archiveError?: unknown;
}

function errorText(err: unknown): string {
  return err instanceof DocumentFileMissingError ? t('warehouseDocs.file.missing') : t(adminErrorKey(err));
}

export function DocumentsScreen(props: DocumentsScreenProps) {
  const { scope, can, onBack, onTabChange, warehouseOptions, headerWarehouseId, onSelectWarehouse } = props;
  const canManage = canManageDocuments(scope, can(WAREHOUSE_DOCUMENT_CODES.manage));
  const readOnlyNoteKey = documentsReadOnlyNoteKey(scope, can(WAREHOUSE_DOCUMENT_CODES.manage));
  const header = (
    <SingleWarehouseHeader scope={scope} warehouseId={headerWarehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
  );
  const footer = onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined;

  if (props.openDocumentId !== undefined) {
    return <DocumentDetail {...props} canManage={canManage} readOnlyNoteKey={readOnlyNoteKey} header={header} footer={footer} />;
  }

  const documents = props.documents ?? [];
  const state = props.unavailable
    ? props.isLoading
      ? 'loading'
      : 'unavailable'
    : queryViewState({ isLoading: props.isLoading ?? false, error: props.error, itemCount: documents.length });

  return (
    <WalletScreen title={t('warehouseDocs.title')} onBack={onBack} headerExtra={header} footer={footer}>
      <ScrollView
        contentContainerStyle={warehouseProfileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={props.onRefresh ? <RefreshControl refreshing={props.isRefreshing ?? false} onRefresh={props.onRefresh} /> : undefined}
      >
        {canManage ? <InfoNote tone="info">{t('warehouseDocs.addUnavailable')}</InfoNote> : null}
        <View style={warehouseProfileLayout.gap} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ChipGroup options={DOCUMENT_STATUS_FILTERS} value={props.statusFilter} onChange={props.onStatusFilterChange} labelOf={statusFilterLabel} />
        </ScrollView>
        <View style={warehouseProfileLayout.gap} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <ChipGroup options={DOCUMENT_TYPE_FILTERS} value={props.typeFilter} onChange={props.onTypeFilterChange} labelOf={typeFilterLabel} />
        </ScrollView>
        <View style={warehouseProfileLayout.gap} />
        <SearchBar value={props.searchQuery} onChangeText={props.onSearchQueryChange} placeholder={t('warehouseDocs.searchPlaceholder')} />
        <View style={warehouseProfileLayout.gap} />

        {state === 'unavailable' ? (
          <AdminEmptyState title={t('warehouseDocs.unavailable')} />
        ) : state === 'loading' ? (
          <AdminLoadingState />
        ) : state === 'error' ? (
          <AdminErrorState error={props.error} onRetry={props.onRetry} />
        ) : state === 'empty' ? (
          <AdminEmptyState title={t('warehouseDocs.empty.title')} subtitle={t('warehouseDocs.empty.subtitle')} />
        ) : (
          <>
            {props.total !== null && props.total !== undefined ? (
              <Text style={styles.countText}>{t('warehouseDocs.count', { count: String(props.total) })}</Text>
            ) : null}
            {documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.docCard}
                onPress={() => props.onOpenDocument(doc.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={doc.title}
              >
                <View style={styles.docText}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>
                    {doc.documentNumber === null ? doc.docTypeLabel : `${doc.docTypeLabel} · ${doc.documentNumber}`}
                  </Text>
                  <Text style={styles.docMeta}>{doc.dateLine}</Text>
                </View>
                <View style={styles.badgeRow}>
                  {doc.status === 'EXPIRING_SOON' || doc.status === 'EXPIRED' ? <WarningTriangleIcon /> : null}
                  <StatusBadge label={doc.statusLabel} tone={doc.statusTone} />
                </View>
              </TouchableOpacity>
            ))}
            {props.hasMore && props.onLoadMore ? (
              <WalletButton label={t('warehouseDocs.loadMore')} variant="outline" onPress={props.onLoadMore} />
            ) : null}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

function DocumentDetail(
  props: DocumentsScreenProps & {
    canManage: boolean;
    readOnlyNoteKey: ReturnType<typeof documentsReadOnlyNoteKey>;
    header: React.ReactNode;
    footer: React.ReactNode;
  },
) {
  const { detail, canManage, readOnlyNoteKey } = props;
  const [form, setForm] = useState<DocumentForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const close = () => props.onOpenDocument(undefined);
  const state = detail !== undefined ? 'ready' : queryViewState({ isLoading: props.detailLoading ?? false, error: props.detailError, itemCount: 0 });
  const noValue = t('profile.noValue');

  const startEdit = () => {
    if (detail === undefined) return;
    props.onResetEdit?.();
    setFormError(null);
    setForm(documentFormOf(detail));
  };

  const saveEdit = () => {
    if (detail === undefined || form === null) return;
    const result = documentEditBody(detail, form);
    if ('errorKey' in result) {
      setFormError(t(result.errorKey));
      return;
    }
    setFormError(null);
    props.onSaveEdit(detail.id, result.body, () => setForm(null));
  };

  const confirmArchive = () => {
    if (detail === undefined) return;
    Alert.alert(t('warehouseDocs.archive.confirmTitle'), t('warehouseDocs.archive.confirmBody', { title: detail.title }), [
      { text: t('warehouseDocs.action.cancel'), style: 'cancel' },
      { text: t('warehouseDocs.action.archive'), style: 'destructive', onPress: () => props.onArchive(detail.id) },
    ]);
  };

  return (
    <WalletScreen title={t('warehouseDocs.detailTitle')} onBack={close} headerExtra={props.header} footer={props.footer}>
      {state === 'loading' ? (
        <AdminLoadingState />
      ) : state !== 'ready' || detail === undefined ? (
        <AdminErrorState error={props.detailError} onRetry={props.onRetryDetail} />
      ) : (
        <ScrollView contentContainerStyle={warehouseProfileLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailHead}>
            <Text style={styles.detailTitle}>{detail.title}</Text>
            <StatusBadge label={detail.statusLabel} tone={detail.statusTone} />
          </View>
          {(() => {
            const bannerKey = documentExpiryBannerKey(detail.status);
            return bannerKey === null ? null : (
              <InfoNote tone="warning" icon={<WarningTriangleIcon />}>
                {t(bannerKey)}
              </InfoNote>
            );
          })()}
          <InfoCard
            rows={[
              [
                { label: t('warehouseDocs.field.type'), value: detail.docTypeLabel },
                { label: t('warehouseDocs.field.number'), value: detail.documentNumber ?? noValue },
              ],
              [
                { label: t('warehouseDocs.field.issueDate'), value: detail.issueLabel ?? noValue },
                { label: t('warehouseDocs.field.expiryDate'), value: detail.expiryLabel ?? t('warehouseDocs.noExpiry') },
              ],
              [
                { label: t('warehouseDocs.field.status'), value: detail.statusLabel },
                { label: t('warehouseDocs.field.added'), value: detail.addedLabel ?? noValue },
              ],
            ]}
          />
          <View style={warehouseProfileLayout.gap} />

          {detail.hasFile ? (
            <WalletButton
              label={props.isOpeningFile ? t('warehouseDocs.file.opening') : t('warehouseDocs.file.open')}
              onPress={() => props.onOpenFile(detail.id)}
              disabled={props.isOpeningFile ?? false}
            />
          ) : (
            <InfoNote tone="warning">{t('warehouseDocs.file.missing')}</InfoNote>
          )}
          {detail.hasFile ? <Text style={styles.hint}>{t('warehouseDocs.file.hint')}</Text> : null}
          {props.openFileError ? <Text style={styles.error}>{errorText(props.openFileError)}</Text> : null}

          {canManageDocument(detail, canManage) ? (
            <View style={styles.manageRow}>
              <WalletButton label={t('warehouseDocs.action.edit')} variant="outline" flex onPress={startEdit} />
              <WalletButton
                label={props.isArchiving ? t('warehouseDocs.action.archiving') : t('warehouseDocs.action.archive')}
                variant="neutral"
                flex
                disabled={props.isArchiving ?? false}
                onPress={confirmArchive}
              />
            </View>
          ) : null}
          {props.archiveError ? <Text style={styles.error}>{errorText(props.archiveError)}</Text> : null}
          {readOnlyNoteKey !== null ? <Text style={styles.hint}>{t(readOnlyNoteKey)}</Text> : null}
        </ScrollView>
      )}

      <Modal visible={form !== null} transparent animationType="fade" onRequestClose={() => setForm(null)}>
        <View style={styles.backdrop}>
          {form !== null ? (
            <ScrollView contentContainerStyle={styles.dialog} keyboardShouldPersistTaps="handled">
              <Text style={styles.dialogTitle}>{t('warehouseDocs.edit.title')}</Text>
              <FormField label={t('warehouseDocs.field.title')} value={form.title} onChange={(title) => setForm({ ...form, title })} />
              <Text style={styles.inputLabel}>{t('warehouseDocs.field.type')}</Text>
              <ChipGroup
                options={WAREHOUSE_DOCUMENT_TYPES}
                value={form.docType}
                onChange={(docType) => setForm({ ...form, docType })}
                labelOf={documentTypeLabel}
              />
              <FormField
                label={t('warehouseDocs.field.number')}
                value={form.documentNumber}
                onChange={(documentNumber) => setForm({ ...form, documentNumber })}
              />
              <FormField
                label={t('warehouseDocs.field.issueDate')}
                value={form.issueDate}
                placeholder={t('warehouseDocs.edit.datePlaceholder')}
                onChange={(issueDate) => setForm({ ...form, issueDate })}
              />
              <FormField
                label={t('warehouseDocs.field.expiryDate')}
                value={form.expiryDate}
                placeholder={t('warehouseDocs.edit.datePlaceholder')}
                onChange={(expiryDate) => setForm({ ...form, expiryDate })}
              />
              <Text style={styles.hint}>{t('warehouseDocs.edit.dateHint')}</Text>
              {formError !== null ? <Text style={styles.error}>{formError}</Text> : null}
              {formError === null && props.saveEditError ? <Text style={styles.error}>{errorText(props.saveEditError)}</Text> : null}
              <View style={styles.manageRow}>
                <WalletButton label={t('warehouseDocs.action.cancel')} variant="neutral" flex onPress={() => setForm(null)} />
                <WalletButton
                  label={props.isSavingEdit ? t('warehouseDocs.action.saving') : t('warehouseDocs.action.save')}
                  flex
                  disabled={props.isSavingEdit ?? false}
                  onPress={saveEdit}
                />
              </View>
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </WalletScreen>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string | undefined;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  countText: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.sm },
  docCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  docText: { flex: 1 },
  docTitle: { ...adminType.rowTitle, color: adminColors.ink },
  docMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  detailTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  manageRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  hint: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.sm },
  // No translucent token: a solid canvas scrim with the card raised by adminShadow.lg (as Warehouse Settings).
  backdrop: { flex: 1, backgroundColor: adminColors.canvas, justifyContent: 'center', padding: adminSpacing.xl },
  dialog: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    ...adminShadow.lg,
  },
  dialogTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.sm },
  inputGroup: { marginTop: adminSpacing.md },
  inputLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs, marginTop: adminSpacing.sm },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
});
