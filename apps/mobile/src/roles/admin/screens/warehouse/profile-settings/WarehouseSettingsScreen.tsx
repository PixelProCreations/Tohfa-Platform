// Design id: M15-S05T
/**
 * Warehouse Settings, Main Warehouse only (FINAL_LIST #76).
 *
 * Live, and only what the server stores:
 *   - Capacity limit: GET /warehouses/{id}/capacity, edited with PATCH
 *     .../capacity (warehouse.capacity.set, BR-66). A decimal kg string end to
 *     end, never a float.
 *   - Contact phone and operating hours: GET /warehouses/{id}, edited with
 *     PATCH /warehouses/{id} (warehouse.profile.edit, BR-80): E.164 phone, and
 *     the week in the one shape the API accepts.
 *
 * Each edit is shown only with its own docs/rbac.json code; without either
 * (a Sub admin holds neither) the screen shows a permission note and nothing
 * else. The server checks both again (root CLAUDE.md 2.1).
 *
 * Removed: the per-warehouse low-stock threshold and its presets, the
 * escalation share, the assigned-staff stepper and the three automation
 * switches. None has an endpoint, and business thresholds belong in
 * system_config, not in a screen (root CLAUDE.md 2.7); they were local mock
 * state that saved nothing.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import type { UpdateWarehouseProfileBody } from '../../../api/warehouseSettings';
import { t } from '../../../i18n';
import { formatKg, gramsToKgString } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { Card, CheckIcon, PermissionNote, SectionTitle, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { toOperatingWeek } from './mappers';
import {
  capacityInputOf,
  operatingHoursBody,
  operatingHoursFormOf,
  parseCapacityInput,
  parsePhoneInput,
  type OperatingDayForm,
} from './mappers_settings';
import { PencilIcon } from './ProfileParts';
import type { CapacityView, WarehouseProfileView, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { SingleWarehouseHeader, warehouseProfileLayout } from './WarehouseProfileParts';

/** The docs/rbac.json codes this screen checks (both exist there). */
export const WAREHOUSE_SETTINGS_CODES = {
  capacitySet: 'warehouse.capacity.set',
  profileEdit: 'warehouse.profile.edit',
} as const;

/** How long the "saved" banner stays: a UI timing, not a business threshold. */
const SAVED_BANNER_MS = 3000;

export interface WarehouseSettingsScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  headerWarehouseId?: string | undefined;
  /** No warehouse to ask for (Main before the warehouse list loads, or none). */
  unavailable?: boolean | undefined;
  profile?: WarehouseProfileView | undefined;
  /** The stored operating hours as sent (GET /warehouses/{id}). */
  operatingHours?: unknown;
  capacity?: CapacityView | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;

  onSaveCapacity: (capacityKg: string, onDone: () => void) => void;
  isSavingCapacity?: boolean | undefined;
  capacityError?: unknown;
  onResetCapacity?: (() => void) | undefined;

  onSaveProfile: (body: UpdateWarehouseProfileBody, onDone: () => void) => void;
  isSavingProfile?: boolean | undefined;
  profileError?: unknown;
  onResetProfile?: (() => void) | undefined;
}

type Dialog = 'none' | 'capacity' | 'phone' | 'hours';

export function WarehouseSettingsScreen(props: WarehouseSettingsScreenProps) {
  const { scope, can, onBack, warehouseOptions, headerWarehouseId, onSelectWarehouse, profile, capacity } = props;
  const canCapacity = can(WAREHOUSE_SETTINGS_CODES.capacitySet);
  const canProfile = can(WAREHOUSE_SETTINGS_CODES.profileEdit);

  const [dialog, setDialog] = useState<Dialog>('none');
  const [capacityInput, setCapacityInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [hoursInput, setHoursInput] = useState<OperatingDayForm[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (savedMessage === null) return undefined;
    const timer = setTimeout(() => setSavedMessage(null), SAVED_BANNER_MS);
    return () => clearTimeout(timer);
  }, [savedMessage]);

  const week = useMemo(() => toOperatingWeek(props.operatingHours, new Date()), [props.operatingHours]);

  if (!canCapacity && !canProfile) {
    return (
      <WalletScreen title={t('warehouseSettings.title')} onBack={onBack}>
        <View style={warehouseProfileLayout.scrollContent}>
          <PermissionNote>{t('warehouseSettings.noPermission')}</PermissionNote>
        </View>
      </WalletScreen>
    );
  }

  const state = props.unavailable
    ? props.isLoading
      ? 'loading'
      : 'unavailable'
    : profile !== undefined
      ? 'ready'
      : queryViewState({ isLoading: props.isLoading ?? false, error: props.error, itemCount: 0 });
  const noValue = t('profile.noValue');
  const warehouseName = profile?.name ?? '';

  const open = (next: Dialog) => {
    setInputError(null);
    props.onResetCapacity?.();
    props.onResetProfile?.();
    if (next === 'capacity') {
      setCapacityInput(capacity?.capacityGrams === null || capacity === undefined ? '' : capacityInputOf(gramsToKgString(capacity.capacityGrams)));
    } else if (next === 'phone') {
      setPhoneInput(profile?.contactPhone ?? '');
    } else if (next === 'hours') {
      setHoursInput(operatingHoursFormOf(props.operatingHours).days);
    }
    setDialog(next);
  };

  const done = (messageKey: 'warehouseSettings.saved.capacity' | 'warehouseSettings.saved.phone' | 'warehouseSettings.saved.hours') => () => {
    setDialog('none');
    setSavedMessage(t(messageKey, { warehouse: warehouseName }));
  };

  const save = () => {
    if (dialog === 'capacity') {
      const parsed = parseCapacityInput(capacityInput);
      if ('errorKey' in parsed) return setInputError(t(parsed.errorKey));
      setInputError(null);
      props.onSaveCapacity(parsed.value, done('warehouseSettings.saved.capacity'));
    } else if (dialog === 'phone') {
      const parsed = parsePhoneInput(phoneInput);
      if ('errorKey' in parsed) return setInputError(t(parsed.errorKey));
      setInputError(null);
      props.onSaveProfile({ contactPhone: parsed.value }, done('warehouseSettings.saved.phone'));
    } else if (dialog === 'hours') {
      const parsed = operatingHoursBody(hoursInput);
      if ('errorKey' in parsed) {
        const day = 'day' in parsed ? hoursInput.find((d) => d.day === parsed.day) : undefined;
        return setInputError(day ? t('warehouseSettings.hours.error.onDay', { day: t(day.labelKey), message: t(parsed.errorKey) }) : t(parsed.errorKey));
      }
      setInputError(null);
      props.onSaveProfile({ operatingHours: parsed.value }, done('warehouseSettings.saved.hours'));
    }
    return undefined;
  };

  const updateDay = (day: OperatingDayForm['day'], patch: Partial<OperatingDayForm>) =>
    setHoursInput((prev) => prev.map((d) => (d.day === day ? { ...d, ...patch } : d)));

  const saving = dialog === 'capacity' ? props.isSavingCapacity ?? false : props.isSavingProfile ?? false;
  const serverError = dialog === 'capacity' ? props.capacityError : dialog === 'none' ? null : props.profileError;
  const dialogTitle =
    dialog === 'capacity'
      ? t('warehouseSettings.capacity.dialogTitle')
      : dialog === 'phone'
        ? t('warehouseSettings.phone.dialogTitle')
        : t('warehouseSettings.hours.dialogTitle');

  return (
    <WalletScreen
      title={t('warehouseSettings.title')}
      subtitle={warehouseName || undefined}
      onBack={onBack}
      headerExtra={<SingleWarehouseHeader scope={scope} warehouseId={headerWarehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />}
    >
      {state === 'unavailable' ? (
        <AdminEmptyState title={t('warehouseSettings.unavailable')} />
      ) : state === 'loading' ? (
        <AdminLoadingState />
      ) : state !== 'ready' || profile === undefined ? (
        <AdminErrorState error={props.error} onRetry={props.onRetry} />
      ) : (
        <ScrollView
          contentContainerStyle={warehouseProfileLayout.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={props.onRefresh ? <RefreshControl refreshing={props.isRefreshing ?? false} onRefresh={props.onRefresh} /> : undefined}
        >
          {savedMessage ? (
            <View style={styles.savedBanner}>
              <View style={styles.savedIcon}>
                <CheckIcon size={14} />
              </View>
              <Text style={styles.savedText}>{savedMessage}</Text>
            </View>
          ) : null}

          <SectionTitle>{t('warehouseSettings.section.capacity')}</SectionTitle>
          <Card>
            <SettingRow label={t('warehouseSettings.capacity.label')} sub={t('warehouseSettings.capacity.sub')} first>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>
                  {capacity?.capacityGrams === null || capacity === undefined ? t('warehouseSettings.capacity.notSet') : formatKg(capacity.capacityGrams)}
                </Text>
                {canCapacity ? <EditPill label={t('warehouseSettings.capacity.edit')} onPress={() => open('capacity')} /> : null}
              </View>
            </SettingRow>
            {capacity !== undefined ? (
              <SettingRow label={t('warehouseSettings.capacity.used')} sub={capacity.utilizationLabel ?? noValue}>
                <Text style={styles.rowValue}>{formatKg(capacity.usedGrams)}</Text>
              </SettingRow>
            ) : null}
          </Card>
          {canCapacity ? <Text style={styles.hint}>{t('warehouseSettings.capacity.note')}</Text> : null}

          <SectionTitle>{t('warehouseSettings.section.contact')}</SectionTitle>
          <Card>
            <SettingRow label={t('warehouseSettings.phone.label')} sub={t('warehouseSettings.phone.sub')} first>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{profile.contactPhone ?? noValue}</Text>
                {canProfile ? <EditPill label={t('warehouseSettings.phone.edit')} onPress={() => open('phone')} /> : null}
              </View>
            </SettingRow>
          </Card>

          <SectionTitle
            right={canProfile ? <EditPill label={t('warehouseSettings.hours.edit')} onPress={() => open('hours')} /> : undefined}
          >
            {t('warehouseSettings.section.hours')}
          </SectionTitle>
          <Card>
            {week === null ? (
              <Text style={styles.settingSub}>{t('profile.operating.notConfigured')}</Text>
            ) : (
              week.map((day, i) => (
                <SettingRow key={day.day} label={day.day} first={i === 0}>
                  <Text style={styles.rowValue}>{day.hours ?? t('profile.operating.closed')}</Text>
                </SettingRow>
              ))
            )}
          </Card>
          {!canCapacity || !canProfile ? <PermissionNote>{t('warehouseSettings.partialPermission')}</PermissionNote> : null}
        </ScrollView>
      )}

      <Modal visible={dialog !== 'none'} transparent animationType="fade" onRequestClose={() => setDialog('none')}>
        <View style={styles.backdrop}>
          <ScrollView contentContainerStyle={styles.dialog} keyboardShouldPersistTaps="handled">
            <Text style={styles.dialogTitle}>{dialogTitle}</Text>
            <Text style={styles.dialogSub}>{warehouseName}</Text>

            {dialog === 'capacity' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('warehouseSettings.capacity.inputLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={capacityInput}
                  onChangeText={setCapacityInput}
                  keyboardType="decimal-pad"
                  placeholder={t('warehouseSettings.capacity.placeholder')}
                  placeholderTextColor={adminColors.placeholder}
                />
              </View>
            ) : dialog === 'phone' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('warehouseSettings.phone.inputLabel')}</Text>
                <TextInput
                  style={styles.input}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  keyboardType="phone-pad"
                  placeholder={t('warehouseSettings.phone.placeholder')}
                  placeholderTextColor={adminColors.placeholder}
                />
                <Text style={styles.hint}>{t('warehouseSettings.phone.hint')}</Text>
              </View>
            ) : dialog === 'hours' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.hint}>{t('warehouseSettings.hours.hint')}</Text>
                {hoursInput.map((day) => (
                  <View key={day.day} style={styles.dayRow}>
                    <Text style={styles.dayLabel}>{t(day.labelKey)}</Text>
                    <Switch
                      value={day.isOpen}
                      onValueChange={(isOpen) => updateDay(day.day, { isOpen })}
                      trackColor={{ false: adminColors.border, true: adminColors.brand }}
                      thumbColor={adminColors.card}
                      accessibilityLabel={t('warehouseSettings.hours.openToggle', { day: t(day.labelKey) })}
                    />
                    {day.isOpen ? (
                      <View style={styles.timeRow}>
                        <TextInput
                          style={[styles.input, styles.timeInput]}
                          value={day.open}
                          onChangeText={(value) => updateDay(day.day, { open: value })}
                          placeholder={t('warehouseSettings.hours.openPlaceholder')}
                          placeholderTextColor={adminColors.placeholder}
                          keyboardType="numbers-and-punctuation"
                        />
                        <TextInput
                          style={[styles.input, styles.timeInput]}
                          value={day.close}
                          onChangeText={(value) => updateDay(day.day, { close: value })}
                          placeholder={t('warehouseSettings.hours.closePlaceholder')}
                          placeholderTextColor={adminColors.placeholder}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    ) : (
                      <Text style={styles.closedText}>{t('profile.operating.closed')}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}

            {inputError ? <Text style={styles.error}>{inputError}</Text> : null}
            {!inputError && serverError ? <Text style={styles.error}>{t(adminErrorKey(serverError))}</Text> : null}
            <View style={styles.dialogActions}>
              <WalletButton label={t('warehouseSettings.action.cancel')} variant="neutral" flex onPress={() => setDialog('none')} />
              <WalletButton
                label={saving ? t('warehouseSettings.action.saving') : t('warehouseSettings.action.save')}
                flex
                disabled={saving}
                onPress={save}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </WalletScreen>
  );
}

function EditPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.editPill} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      <PencilIcon size={12} color={adminColors.brandDeep} />
      <Text style={styles.editPillText}>{t('warehouseSettings.action.edit')}</Text>
    </TouchableOpacity>
  );
}

function SettingRow({
  label,
  sub,
  first = false,
  children,
}: {
  label: string;
  sub?: string | undefined;
  first?: boolean | undefined;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.settingRow, !first && styles.settingRowDivider]}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// Saved-banner icon diameter: an icon size, not spacing.
const SAVED_ICON = 22;

const styles = StyleSheet.create({
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  savedIcon: {
    width: SAVED_ICON,
    height: SAVED_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedText: { ...adminType.rowTitle, color: adminColors.success.text, flex: 1 },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md, paddingVertical: adminSpacing.md },
  settingRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  settingText: { flex: 1 },
  settingLabel: { ...adminType.rowTitle, color: adminColors.ink },
  settingSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  rowRight: { alignItems: 'flex-end', gap: adminSpacing.xs },
  rowValue: { ...adminType.rowTitle, color: adminColors.ink },
  hint: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
  },
  editPillText: { ...adminType.caption, color: adminColors.brandDeep },

  // No translucent token: a solid canvas scrim with the card raised by adminShadow.lg.
  backdrop: { flex: 1, backgroundColor: adminColors.canvas, justifyContent: 'center', padding: adminSpacing.xl },
  dialog: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    ...adminShadow.lg,
  },
  dialogTitle: { ...adminType.title, color: adminColors.ink },
  dialogSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  inputGroup: { marginTop: adminSpacing.lg },
  inputLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
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
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  dayLabel: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  timeRow: { flexDirection: 'row', gap: adminSpacing.sm, width: '100%' },
  timeInput: { flex: 1 },
  closedText: { ...adminType.rowMeta, color: adminColors.muted },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.md },
  dialogActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.xl },
});
