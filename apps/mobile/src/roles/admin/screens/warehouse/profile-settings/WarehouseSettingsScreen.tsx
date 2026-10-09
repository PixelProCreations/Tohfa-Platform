// Design id: M15-S05T
/**
 * Warehouse Settings (capacity & thresholds), Main Warehouse only
 * (FINAL_LIST #76).
 *
 * Was admin/screens/warehouse/WarehouseSettingsScreen. Route-guarded with
 * can('warehouse.capacity.set') (MAIN_WH_ADMIN all, SUB_WH_ADMIN none): without
 * it the screen shows a permission note and nothing else.
 *
 * The capacity row used to be locked "SA-only" (following the Role Matrix),
 * but docs/rbac.json grants MAIN_WH_ADMIN warehouse.capacity.set = all (reqs
 * Ch.6 precedence, conflictPrecedence entry "warehouse capacity"), so the row
 * is unlocked: an Edit control opens a capacity dialog. There is no capacity
 * write endpoint (GET /warehouses only), so the change is local until one
 * exists (SPEC_GAPS W4m-4).
 *
 * "Edit Threshold & Hours" and the "Automated Operational Rules" switches have
 * no rbac code: shown ungated (inside the guard) and local only (SPEC_GAPS
 * W4m-4). The threshold presets, hours, staff count and the escalation share
 * come from the warehouse record (mock), not from constants in this screen; the
 * old hard-coded warehouse list ('Kotagiri' / 'Ooty' / 'Coonoor') is the
 * scope's warehouse options.
 */
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  CheckIcon,
  EmptyState,
  PermissionNote,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { PencilIcon } from './ProfileParts';
import type { WarehouseScreenBaseProps, WarehouseSelectionProps, WarehouseSettingsValues } from './types';
import { PROFILE_WAREHOUSES, THRESHOLD_PRESETS, WAREHOUSE_SETTINGS } from './warehouseFixtures';
import {
  ClockIcon,
  formatKg,
  singleWarehouseId,
  SingleWarehouseHeader,
  WAREHOUSE_PROFILE_CODES,
  warehouseNameOf,
  warehouseProfileLayout,
} from './WarehouseProfileParts';

export interface WarehouseSettingsScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  settings?: readonly WarehouseSettingsValues[] | undefined;
  /** Quick-pick low-stock thresholds in the editor. */
  thresholdPresets?: readonly number[] | undefined;
}

type Dialog = 'none' | 'thresholdHours' | 'capacity';

export function WarehouseSettingsScreen({
  scope,
  can,
  onBack,
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  onSelectWarehouse,
  settings = WAREHOUSE_SETTINGS,
  thresholdPresets = THRESHOLD_PRESETS,
}: WarehouseSettingsScreenProps) {
  const [localSelection, setLocalSelection] = useState<string | undefined>(selectedWarehouseId);
  const selected = onSelectWarehouse ? selectedWarehouseId : localSelection;
  const select = onSelectWarehouse ?? setLocalSelection;
  const warehouseId = singleWarehouseId(scope, selected, warehouseOptions);
  const warehouseName = warehouseNameOf(scope, warehouseId, warehouseOptions);

  // Local edits per warehouse (no write endpoint yet, SPEC_GAPS W4m-4).
  const [values, setValues] = useState<readonly WarehouseSettingsValues[]>(settings);
  const current = values.find((v) => v.warehouseId === warehouseId);

  const [dialog, setDialog] = useState<Dialog>('none');
  const [thresholdInput, setThresholdInput] = useState('');
  const [hoursInput, setHoursInput] = useState('');
  const [staffInput, setStaffInput] = useState(1);
  const [capacityInput, setCapacityInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (savedMessage === null) return undefined;
    const timer = setTimeout(() => setSavedMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [savedMessage]);

  if (!can(WAREHOUSE_PROFILE_CODES.capacitySet)) {
    return (
      <WalletScreen title="Warehouse Settings" onBack={onBack}>
        <View style={warehouseProfileLayout.scrollContent}>
          <PermissionNote>Warehouse settings need the warehouse.capacity.set permission (Main Warehouse admins).</PermissionNote>
        </View>
      </WalletScreen>
    );
  }

  const update = (patch: Partial<WarehouseSettingsValues>) => {
    setValues((prev) => prev.map((v) => (v.warehouseId === warehouseId ? { ...v, ...patch } : v)));
  };

  const openThresholdHours = () => {
    if (!current) return;
    setThresholdInput(String(current.lowStockThresholdPercent));
    setHoursInput(current.operatingHours);
    setStaffInput(current.assignedStaff);
    setInputError(null);
    setDialog('thresholdHours');
  };

  const openCapacity = () => {
    if (!current) return;
    setCapacityInput(String(current.capacityKg));
    setInputError(null);
    setDialog('capacity');
  };

  const saveThresholdHours = () => {
    const threshold = Number(thresholdInput.trim());
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
      setInputError('Enter a whole-number threshold between 1 and 100.');
      return;
    }
    if (!hoursInput.trim()) {
      setInputError('Enter the operating hours.');
      return;
    }
    update({ lowStockThresholdPercent: threshold, operatingHours: hoursInput.trim(), assignedStaff: staffInput });
    setDialog('none');
    setSavedMessage(`Settings updated for ${warehouseName}`);
  };

  const saveCapacity = () => {
    const kg = Number(capacityInput.replace(/,/g, '').trim());
    if (!Number.isInteger(kg) || kg <= 0) {
      setInputError('Enter the capacity as a whole number of kg.');
      return;
    }
    update({ capacityKg: kg });
    setDialog('none');
    setSavedMessage(`Capacity updated for ${warehouseName}`);
  };

  return (
    <WalletScreen
      title="Warehouse Settings"
      subtitle={`${warehouseName} · Threshold & operating configuration`}
      onBack={onBack}
      headerExtra={<SingleWarehouseHeader scope={scope} warehouseId={warehouseId} options={warehouseOptions} onSelect={select} />}
    >
      {current === undefined ? (
        <EmptyState title="No settings" subtitle="This warehouse has no configuration yet." />
      ) : (
        <ScrollView contentContainerStyle={warehouseProfileLayout.scrollContent} showsVerticalScrollIndicator={false}>
          {savedMessage ? (
            <View style={styles.savedBanner}>
              <View style={styles.savedIcon}>
                <CheckIcon size={14} />
              </View>
              <Text style={styles.savedText}>{savedMessage}</Text>
            </View>
          ) : null}

          <SectionTitle>Threshold & Operating Configurations</SectionTitle>
          <Card>
            <SettingRow label="Capacity limit" sub="Maximum storage for this warehouse" first>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{formatKg(current.capacityKg)}</Text>
                <TouchableOpacity
                  style={styles.editPill}
                  onPress={openCapacity}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Edit capacity limit"
                >
                  <PencilIcon size={12} color={adminColors.brandDeep} />
                  <Text style={styles.editPillText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </SettingRow>
            <SettingRow label="Low-stock threshold" sub="Triggers procurement replenishment alert">
              <StatusBadge label={`${current.lowStockThresholdPercent}%`} tone="warning" />
            </SettingRow>
            <SettingRow label="Operating hours" sub="Receiving & dispatch operational window">
              <View style={styles.hoursBadge}>
                <ClockIcon size={14} />
                <Text style={styles.hoursText}>{current.operatingHours}</Text>
              </View>
            </SettingRow>
            <SettingRow label="Assigned staff" sub="Active Sub-Warehouse Administrators">
              <Text style={styles.rowValue}>{`${current.assignedStaff} members`}</Text>
            </SettingRow>
          </Card>
          <View style={warehouseProfileLayout.gap} />
          <WalletButton
            label="Edit Threshold & Hours"
            variant="outline"
            icon={<PencilIcon size={16} color={adminColors.brandDeep} />}
            onPress={openThresholdHours}
          />

          <SectionTitle>Automated Operational Rules</SectionTitle>
          <Card>
            <SettingRow label="Inbound Storage Auto-Assignment" sub="Auto-assign storage racks based on product temperature" first>
              <RuleSwitch value={current.autoAssignment} onChange={(v) => update({ autoAssignment: v })} />
            </SettingRow>
            <SettingRow label="Immediate Low-Stock Push Alerts" sub="Notify central warehouse when threshold is breached">
              <RuleSwitch value={current.lowStockAlerts} onChange={(v) => update({ lowStockAlerts: v })} />
            </SettingRow>
            <SettingRow
              label="Auto-Escalate Discrepancies"
              sub={`Escalate quantity mismatches exceeding ${current.escalationThresholdPercent}%`}
            >
              <RuleSwitch value={current.discrepancyEscalation} onChange={(v) => update({ discrepancyEscalation: v })} />
            </SettingRow>
          </Card>
        </ScrollView>
      )}

      <Modal visible={dialog !== 'none'} transparent animationType="fade" onRequestClose={() => setDialog('none')}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{dialog === 'capacity' ? 'Set Capacity Limit' : 'Configure Threshold & Hours'}</Text>
            <Text style={styles.dialogSub}>{warehouseName}</Text>

            {dialog === 'capacity' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CAPACITY LIMIT (KG)</Text>
                <TextInput
                  style={styles.input}
                  value={capacityInput}
                  onChangeText={setCapacityInput}
                  keyboardType="numeric"
                  placeholder="Capacity in kg"
                  placeholderTextColor={adminColors.placeholder}
                />
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>LOW-STOCK THRESHOLD (%)</Text>
                  <View style={styles.presetRow}>
                    {thresholdPresets.map((preset) => {
                      const active = thresholdInput === String(preset);
                      return (
                        <TouchableOpacity
                          key={preset}
                          style={[styles.preset, active && styles.presetActive]}
                          onPress={() => setThresholdInput(String(preset))}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[styles.presetText, active && styles.presetTextActive]}>{preset}%</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={thresholdInput}
                    onChangeText={setThresholdInput}
                    keyboardType="numeric"
                    placeholder="Custom threshold"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>OPERATING HOURS</Text>
                  <TextInput
                    style={styles.input}
                    value={hoursInput}
                    onChangeText={setHoursInput}
                    placeholder="Opening – closing time"
                    placeholderTextColor={adminColors.placeholder}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ASSIGNED SWA STAFF</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setStaffInput((n) => Math.max(1, n - 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Fewer staff"
                    >
                      <Text style={styles.stepperButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{`${staffInput} members`}</Text>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => setStaffInput((n) => n + 1)}
                      accessibilityRole="button"
                      accessibilityLabel="More staff"
                    >
                      <Text style={styles.stepperButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            {inputError ? <Text style={styles.error}>{inputError}</Text> : null}
            <View style={styles.dialogActions}>
              <WalletButton label="Cancel" variant="neutral" flex onPress={() => setDialog('none')} />
              <WalletButton label="Save" flex onPress={dialog === 'capacity' ? saveCapacity : saveThresholdHours} />
            </View>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

function SettingRow({
  label,
  sub,
  first = false,
  children,
}: {
  label: string;
  sub: string;
  first?: boolean | undefined;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.settingRow, !first && styles.settingRowDivider]}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

function RuleSwitch({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: adminColors.border, true: adminColors.brand }}
      thumbColor={adminColors.card}
    />
  );
}

// Saved-banner icon and stepper button diameters: icon sizes, not spacing.
const SAVED_ICON = 22;
const STEPPER_BUTTON = 36;

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
  settingSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: adminSpacing.xs },
  rowValue: { ...adminType.rowTitle, color: adminColors.ink },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
  },
  editPillText: { ...adminType.caption, color: adminColors.brandDeep },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
  },
  hoursText: { ...adminType.caption, color: adminColors.brandDeep },

  // Was a translucent black overlay; no translucent token, so a solid canvas scrim with the card raised by adminShadow.lg.
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
  presetRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  presetActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  presetText: { ...adminType.rowTitle, color: adminColors.muted },
  presetTextActive: { color: adminColors.brandDeep },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperButton: {
    width: STEPPER_BUTTON,
    height: STEPPER_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { ...adminType.title, color: adminColors.brandDeep },
  stepperValue: { ...adminType.sectionHead, color: adminColors.ink },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.md },
  dialogActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.xl },
});
