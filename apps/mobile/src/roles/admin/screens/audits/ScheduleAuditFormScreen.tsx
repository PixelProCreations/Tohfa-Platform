/**
 * Schedule Audit form, ported from origin/Superadmin-main.
 *
 * Without `initialAuditId` it schedules a new INTERNAL audit through
 * POST /admin/audits; with one it loads GET /admin/audits/{id} and saves the
 * changed fields through PATCH /admin/audits/{id} (SCHEDULED audits only; the
 * farmer and the audit type never change). Both need audit.schedule.
 *
 * The body never carries fiscalYear/quarter (the server derives them from
 * `scheduledFor` in IST, BR-03); EXTERNAL carries externalAgencyName and
 * INTERNAL never does (auditScheduleFormat.buildCreateBody). Server refusals
 * such as AUDIT_QUARTER_TAKEN are shown through the admin error catalogue.
 *
 * Farmer options come from the farmer directory (GET /admin/farmers) and farm
 * options from that farmer's land locations (GET /admin/farmers/{id}); both
 * need farmer.profile.view_all and are fetched only while their picker is
 * open. Save Draft hands the current form to the host (`onSaveDraft`); the API
 * keeps no drafts, and `initialDraft` restores one.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { adminErrorKey } from '../../api/errors';
import { useFarmer, useFarmerList } from '../../api/farmerHooks';
import { t } from '../../i18n';
import { makeCan, type Can } from '../../permissions/can';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import {
  auditorFieldValue,
  buildCreateBody,
  buildUpdateBody,
  draftFromAudit,
  emptyDraft,
  farmLabel,
  ts,
  type AuditsScheduleKey,
  type ScheduleAuditDraft,
} from './auditScheduleFormat';
import { useAuditDetail, useCreateAudit, useUpdateAudit } from './useAuditsData';

export type { ScheduleAuditDraft } from './auditScheduleFormat';

/** docs/rbac.json codes this screen checks. */
export const SCHEDULE_AUDIT_FORM_CODES = {
  schedule: 'audit.schedule',
  /** GET /admin/farmers and /admin/farmers/{id}, behind the farmer and farm pickers. */
  farmers: 'farmer.profile.view_all',
} as const;

const FAIL_CLOSED: Can = makeCan([]);
const LOAD_MORE_THRESHOLD = 120;

// ─── Header & Lock Icons ───────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 15, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Picker option lists (mounted only while their picker is open) ───────────

interface PickedOption {
  id: string;
  label: string;
}

function OptionRow({ label, onPress }: { label: string; onPress?: (() => void) | undefined }) {
  return (
    <TouchableOpacity style={styles.modalOptionItem} onPress={onPress} disabled={onPress === undefined} activeOpacity={0.7}>
      <Text style={styles.modalOptionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function FarmerOptions({ onSelect }: { onSelect: (option: PickedOption) => void }) {
  const farmers = useFarmerList(undefined, {});
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (farmers.hasMore && !farmers.isLoading && layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD) {
      farmers.loadMore();
    }
  };
  if (farmers.items.length === 0 && farmers.isLoading) return <AdminLoadingState />;
  if (farmers.items.length === 0 && farmers.error) return <AdminErrorState error={farmers.error} onRetry={farmers.refresh} />;
  return (
    <ScrollView style={styles.modalListScroll} onScroll={onScroll} scrollEventThrottle={200}>
      {farmers.items.length === 0 ? <OptionRow label={ADMIN_NO_VALUE} /> : null}
      {farmers.items.map((f) => {
        const label = ts('admin.audits.form.farmerOption', { name: f.name, code: f.farmerCode });
        return <OptionRow key={f.id} label={label} onPress={() => onSelect({ id: f.id, label })} />;
      })}
    </ScrollView>
  );
}

function FarmOptions({ farmerId, onSelect }: { farmerId: string; onSelect: (option: PickedOption) => void }) {
  const farmer = useFarmer(undefined, farmerId);
  if (farmer.dto === undefined && farmer.isLoading) return <AdminLoadingState />;
  if (farmer.dto === undefined && farmer.error) return <AdminErrorState error={farmer.error} onRetry={farmer.refresh} />;
  const locations = farmer.dto?.landLocations ?? [];
  const zone = farmer.dto?.zone?.name ?? null;
  return (
    <ScrollView style={styles.modalListScroll}>
      {locations.length === 0 ? <OptionRow label={ADMIN_NO_VALUE} /> : null}
      {locations.map((loc) => {
        const label = farmLabel(loc.name, loc.village ?? loc.taluk ?? loc.district, zone);
        return <OptionRow key={loc.id} label={label} onPress={() => onSelect({ id: loc.id, label })} />;
      })}
    </ScrollView>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export interface ScheduleAuditFormScreenProps {
  /** The API id of the audit to edit; absent schedules a new audit. */
  initialAuditId?: string | undefined;
  onBack: () => void;
  /** Called after the server accepted the create or update; without it the screen goes back. */
  onScheduleSuccess?: (() => void) | undefined;
  /** Receives the form as it stands (the API has no drafts). */
  onSaveDraft?: ((draft: ScheduleAuditDraft) => void) | undefined;
  /** A draft handed back by the host to restore the form (create only). */
  initialDraft?: ScheduleAuditDraft | undefined;
  /** Permission check (docs/rbac.json codes); absent means nothing is permitted. */
  can?: Can | undefined;
}

type PickerKind = 'farmer' | 'farm' | 'auditor';

const PICKER_TITLE: Record<PickerKind, AuditsScheduleKey> = {
  farmer: 'admin.audits.form.picker.farmer',
  farm: 'admin.audits.form.picker.farm',
  auditor: 'admin.audits.form.picker.auditor',
};

export function ScheduleAuditFormScreen({
  initialAuditId,
  onBack,
  onScheduleSuccess,
  onSaveDraft,
  initialDraft,
  can = FAIL_CLOSED,
}: ScheduleAuditFormScreenProps) {
  const isEdit = initialAuditId !== undefined && initialAuditId !== '';
  const canSchedule = can(SCHEDULE_AUDIT_FORM_CODES.schedule);
  const canListFarmers = can(SCHEDULE_AUDIT_FORM_CODES.farmers);

  const detail = useAuditDetail(isEdit ? initialAuditId : undefined);
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();

  const [draft, setDraft] = useState<ScheduleAuditDraft>(() => (isEdit ? emptyDraft() : initialDraft ?? emptyDraft()));
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Prefill once from the loaded audit; a refetch must not overwrite what the admin typed.
  const prefilled = useRef(false);
  useEffect(() => {
    if (isEdit && detail.data !== undefined && !prefilled.current) {
      prefilled.current = true;
      setDraft(draftFromAudit(detail.data));
    }
  }, [isEdit, detail.data]);

  const audit = detail.data;
  const isEditable = canSchedule && (!isEdit || audit?.status === 'SCHEDULED');
  const isPending = createAudit.isPending || updateAudit.isPending;
  const submitEnabled = isEditable && !isPending && (!isEdit || audit !== undefined);
  const farmerPickable = isEditable && !isEdit && canListFarmers;
  const farmPickable = isEditable && canListFarmers && draft.farmerId !== null;
  const auditorPickable = isEditable && draft.auditType === 'INTERNAL';

  const update = (patch: Partial<ScheduleAuditDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setFormError(null);
  };

  const onSubmit = () => {
    if (!submitEnabled) return;
    const done = onScheduleSuccess ?? onBack;
    const onError = (err: unknown) => setFormError(t(adminErrorKey(err)));
    if (isEdit) {
      if (audit === undefined || initialAuditId === undefined) return;
      const result = buildUpdateBody(audit, draft);
      if (!result.ok) {
        setFormError(ts(result.errorKey));
        return;
      }
      updateAudit.mutate({ auditId: initialAuditId, body: result.body }, { onSuccess: done, onError });
      return;
    }
    const result = buildCreateBody(draft);
    if (!result.ok) {
      setFormError(ts(result.errorKey));
      return;
    }
    createAudit.mutate(result.body, { onSuccess: done, onError });
  };

  const showLoading = isEdit && audit === undefined && detail.isPending;
  const showError = isEdit && audit === undefined && !detail.isPending && detail.error !== null;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={ts('admin.audits.form.back')}
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{ts('admin.audits.form.title')}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showLoading ? <AdminLoadingState /> : null}
        {showError ? <AdminErrorState error={detail.error} onRetry={() => void detail.refetch()} /> : null}
        {!showLoading && !showError ? (
          <View style={styles.formCard}>
            {/* ── 1 · Audit information ── */}
            <Text style={styles.sectionHeaderTitle}>{ts('admin.audits.form.section.info')}</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.labelWithIconRow}>
                <Text style={styles.fieldLabelInline}>{ts('admin.audits.form.field.auditId')}</Text>
                <LockIcon />
              </View>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>{ts('admin.audits.form.field.date')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={draft.date}
                  onChangeText={(v) => update({ date: v })}
                  editable={isEditable}
                  placeholder={ts('admin.audits.form.placeholder.date')}
                  placeholderTextColor={adminColors.placeholder}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>{ts('admin.audits.form.field.startTime')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={draft.startTime}
                  onChangeText={(v) => update({ startTime: v })}
                  editable={isEditable}
                  placeholder={ts('admin.audits.form.placeholder.time')}
                  placeholderTextColor={adminColors.placeholder}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{ts('admin.audits.form.field.duration')}</Text>
              <TextInput
                style={styles.textInput}
                value={draft.duration}
                editable={false}
                keyboardType="numeric"
                placeholder={ADMIN_NO_VALUE}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>

            {/* ── 2 · Farmer & farm ── */}
            <Text style={styles.sectionHeaderTitle}>{ts('admin.audits.form.section.farmer')}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{ts('admin.audits.form.field.farmer')}</Text>
              <TouchableOpacity
                style={[styles.dropdownPicker, !farmerPickable && styles.disabled]}
                onPress={() => setPicker('farmer')}
                disabled={!farmerPickable}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownPickerText} numberOfLines={1}>
                  {draft.farmerLabel}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{ts('admin.audits.form.field.farm')}</Text>
              <TouchableOpacity
                style={[styles.dropdownPicker, !farmPickable && styles.disabled]}
                onPress={() => setPicker('farm')}
                disabled={!farmPickable}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownPickerText} numberOfLines={1}>
                  {draft.farmLabel}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
              <Text style={styles.fieldHint}>{ts('admin.audits.form.farmHint')}</Text>
            </View>

            {/* ── 3 · Auditor assignment ── */}
            <Text style={styles.sectionHeaderTitle}>{ts('admin.audits.form.section.auditor')}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{ts('admin.audits.form.field.auditor')}</Text>
              <TouchableOpacity
                style={[styles.dropdownPicker, !auditorPickable && styles.disabled]}
                onPress={() => setPicker('auditor')}
                disabled={!auditorPickable}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownPickerText} numberOfLines={1}>
                  {auditorFieldValue(audit, draft)}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>
            </View>

            {formError !== null ? <Text style={styles.errorText}>{formError}</Text> : null}
          </View>
        ) : null}
      </ScrollView>

      {/* ── Bottom buttons ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.scheduleAuditBtn, !submitEnabled && styles.disabled]}
          onPress={onSubmit}
          disabled={!submitEnabled}
          activeOpacity={0.8}
        >
          <Text style={styles.scheduleAuditBtnText}>{ts('admin.audits.form.submit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveDraftBtn, onSaveDraft === undefined && styles.disabled]}
          onPress={() => onSaveDraft?.(draft)}
          disabled={onSaveDraft === undefined}
          activeOpacity={0.8}
        >
          <Text style={styles.saveDraftBtnText}>{ts('admin.audits.form.saveDraft')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Option picker ── */}
      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPicker(null)} />

          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{picker === null ? '' : ts(PICKER_TITLE[picker])}</Text>
            {picker === 'farmer' ? (
              <FarmerOptions
                onSelect={(o) => {
                  update({ farmerId: o.id, farmerLabel: o.label, farmId: null, farmLabel: ADMIN_NO_VALUE });
                  setPicker(null);
                }}
              />
            ) : null}
            {picker === 'farm' && draft.farmerId !== null ? (
              <FarmOptions
                farmerId={draft.farmerId}
                onSelect={(o) => {
                  update({ farmId: o.id, farmLabel: o.label });
                  setPicker(null);
                }}
              />
            ) : null}
            {picker === 'auditor' ? (
              <ScrollView style={styles.modalListScroll}>
                <OptionRow label={ADMIN_NO_VALUE} />
              </ScrollView>
            ) : null}

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPicker(null)} activeOpacity={0.7}>
              <Text style={styles.modalCloseBtnText}>{ts('admin.audits.form.picker.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CONTROL_HEIGHT = 44;
const BUTTON_HEIGHT = 46;
const CLOSE_HEIGHT = 42;
const ICON_BUTTON = 36;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: ICON_BUTTON,
    height: ICON_BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.xsSm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  fieldGroup: {
    marginBottom: adminSpacing.md,
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: adminSpacing.xs,
    marginBottom: adminSpacing.xsSm,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: adminSpacing.xsSm,
  },
  fieldLabelInline: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  disabledInput: {
    height: CONTROL_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    justifyContent: 'center',
  },
  disabledInputText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  twoColRow: {
    flexDirection: 'row',
    columnGap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  colHalf: {
    flex: 1,
  },
  textInput: {
    ...adminType.body,
    height: CONTROL_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    color: adminColors.ink,
  },
  dropdownPicker: {
    height: CONTROL_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownPickerText: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  fieldHint: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  errorText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
  },
  disabled: {
    opacity: 0.5,
  },

  // Bottom buttons
  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    flexDirection: 'row',
    columnGap: adminSpacing.md,
  },
  scheduleAuditBtn: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleAuditBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  saveDraftBtn: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDraftBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // Picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '60%',
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  modalListScroll: {
    marginBottom: adminSpacing.md,
  },
  modalOptionItem: {
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalCloseBtn: {
    height: CLOSE_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
});
