/**
 * Edit Warehouse Profile (design M15 Edit Profile / Contact / Storage / Operations).
 * Four-tab form, opened from Warehouse Info's header pencil (ProfileFlow route
 * 'WarehouseEditProfile', gated by warehouse.profile.edit, BR-80).
 *
 * Server writes (docs/openapi.yaml; neither declares an Idempotency-Key, so none is sent):
 *   PATCH /warehouses/{id}          -> contactPhone, operatingHours   (warehouse.profile.edit)
 *   PATCH /warehouses/{id}/capacity -> capacityKg                     (warehouse.capacity.set, BR-66)
 *
 * Name, code and address are shown read-only: the server rejects them in
 * PATCH /warehouses/{id} with 422.
 *
 * Fail closed: without warehouse.profile.edit the screen draws a not-available
 * note and its data hooks get no warehouse id, so nothing is fetched. A save
 * reports nothing until the server answered: `onSaveSuccess` runs from the
 * mutation's onSuccess only, and a failure shows the mapped admin error. The
 * saves invalidate the warehouse query module (useWarehouseSettings), so the
 * screen the host returns to refetches.
 *
 * Every field starts from the live record (`null` state = untouched, so a
 * late-arriving capacity still fills the input); nothing here is sample data.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { formatKg, gramsToKgString } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  capacityInputOf,
  operatingHoursBody,
  operatingHoursFormOf,
  parseCapacityInput,
  parsePhoneInput,
  type OperatingDayForm,
} from './mappers_settings';
import { useWarehouseProfile, useWarehouseCapacity, useStorageLocations } from './useProfileData';
import { useSaveWarehouseProfile, useSaveCapacity } from './useWarehouseSettings';
import type { CapacityView, StorageLocationView, WarehouseProfileView, WarehouseScreenBaseProps } from './types';
import { TIME_SLOTS } from './warehouseFixtures';

export type EditWarehouseTab = 'Details' | 'Contact' | 'Storage' | 'Operations';

export interface WarehouseEditProfileScreenProps extends WarehouseScreenBaseProps {
  /** The warehouse uuid to edit (the flow's BR-30 pick); undefined = nothing to edit. */
  warehouseId: string | undefined;
  initialTab?: EditWarehouseTab | undefined;
  /** Runs once, after the server accepted a save. */
  onSaveSuccess?: (() => void) | undefined;
}

// Icon box sizes: drawing dimensions, not spacing.
const TAB_ICON = 15;
const BACK_ICON = 20;

// ─── Icons ───────────────────────────────────────────────────────────────────

function TabIcon({ tab, color }: { tab: EditWarehouseTab; color: string }) {
  if (tab === 'Details') return (
    <Svg width={TAB_ICON} height={TAB_ICON} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
  if (tab === 'Contact') return (
    <Svg width={TAB_ICON} height={TAB_ICON} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
  if (tab === 'Storage') return (
    <Svg width={TAB_ICON} height={TAB_ICON} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 9h18M9 21V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
  return (
    <Svg width={TAB_ICON} height={TAB_ICON} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The failure of the last save, in admin wording (never the server's `detail`). */
function SaveError({ error }: { error: unknown }) {
  return error === null || error === undefined ? null : <Text style={s.errorText}>{t(adminErrorKey(error))}</Text>;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function DetailsTab({ profile }: { profile: WarehouseProfileView | undefined }) {
  const row = (label: string, value: string | null | undefined) => (
    <View style={s.infoRow} key={label}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value ?? t('profile.noValue')}</Text>
    </View>
  );
  if (!profile) return <AdminEmptyState title={t('warehouseEdit.noProfile')} />;
  return (
    <View style={s.tabContent}>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t('warehouseEdit.details.title')}</Text>
        {row(t('warehouseEdit.details.name'), profile.name)}
        {row(t('warehouseEdit.details.code'), profile.code)}
        {row(t('warehouseEdit.details.status'), profile.statusLabel)}
        {row(t('warehouseEdit.details.type'), profile.kindLabel)}
        {row(t('warehouseEdit.details.address'), profile.address)}
        {row(t('warehouseEdit.details.coordinates'), profile.coordinates)}
      </View>
      <Text style={s.note}>{t('warehouseEdit.details.note')}</Text>
    </View>
  );
}

function ContactTab({ profile, onSaved }: { profile: WarehouseProfileView | undefined; onSaved: (() => void) | undefined }) {
  const save = useSaveWarehouseProfile(profile?.warehouseId);
  // null = untouched: the input shows the live phone until the admin types.
  const [typed, setTyped] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phone = typed ?? profile?.contactPhone ?? '';

  const handleSave = useCallback(() => {
    const parsed = parsePhoneInput(phone);
    if ('errorKey' in parsed) { setPhoneError(t(parsed.errorKey)); return; }
    setPhoneError(null);
    save.run({ contactPhone: parsed.value }, onSaved);
  }, [phone, save, onSaved]);

  return (
    <View style={s.tabContent}>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t('warehouseEdit.contact.title')}</Text>
        <Text style={s.infoLabel}>{t('warehouseSettings.phone.hint')}</Text>
        <TextInput
          style={[s.input, phoneError ? s.inputError : null]}
          value={phone}
          onChangeText={(v) => { setTyped(v); setPhoneError(null); save.reset(); }}
          placeholder={t('warehouseSettings.phone.placeholder')}
          keyboardType="phone-pad"
          editable={!save.isPending}
          testID="warehouseEdit.contactPhone"
        />
        {phoneError ? <Text style={s.errorText}>{phoneError}</Text> : null}
        <SaveError error={save.error} />
        <TouchableOpacity
          style={[s.saveBtn, save.isPending ? s.saveBtnDisabled : null]}
          onPress={handleSave}
          disabled={save.isPending}
          testID="warehouseEdit.savePhone"
        >
          <Text style={s.saveBtnText}>{save.isPending ? t('warehouseSettings.action.saving') : t('warehouseEdit.contact.save')}</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.note}>{t('warehouseEdit.contact.note')}</Text>
    </View>
  );
}

function StorageTab({
  capacity,
  locations,
  locationsLoading,
  canSetCapacity,
  warehouseId,
  onSaved,
}: {
  capacity: CapacityView | undefined;
  locations: StorageLocationView[];
  locationsLoading: boolean;
  canSetCapacity: boolean;
  warehouseId: string;
  onSaved: (() => void) | undefined;
}) {
  const saveCapacity = useSaveCapacity(warehouseId);
  // null = untouched: the stored capacity (blank when none is set) until the admin types.
  const [typed, setTyped] = useState<string | null>(null);
  const [capError, setCapError] = useState<string | null>(null);
  const capInput = typed ?? (capacity?.capacityGrams != null ? capacityInputOf(gramsToKgString(capacity.capacityGrams)) : '');

  const handleSaveCapacity = useCallback(() => {
    const parsed = parseCapacityInput(capInput);
    if ('errorKey' in parsed) { setCapError(t(parsed.errorKey)); return; }
    setCapError(null);
    saveCapacity.run(parsed.value, onSaved);
  }, [capInput, saveCapacity, onSaved]);

  const noValue = t('profile.noValue');
  return (
    <View style={s.tabContent}>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t('warehouseEdit.storage.capacityTitle')}</Text>
        {canSetCapacity ? (
          <>
            <Text style={s.infoLabel}>{t('warehouseEdit.storage.capacityLabel')}</Text>
            <TextInput
              style={[s.input, capError ? s.inputError : null]}
              value={capInput}
              onChangeText={(v) => { setTyped(v); setCapError(null); saveCapacity.reset(); }}
              keyboardType="numeric"
              editable={!saveCapacity.isPending}
              testID="warehouseEdit.capacity"
            />
            {capError ? <Text style={s.errorText}>{capError}</Text> : null}
            <SaveError error={saveCapacity.error} />
            {capacity && (
              <Text style={s.infoLabel}>
                {t('warehouseEdit.storage.usage', {
                  used: formatKg(capacity.usedGrams),
                  available: capacity.availableGrams !== null ? formatKg(capacity.availableGrams) : noValue,
                })}
              </Text>
            )}
            <TouchableOpacity
              style={[s.saveBtn, saveCapacity.isPending ? s.saveBtnDisabled : null]}
              onPress={handleSaveCapacity}
              disabled={saveCapacity.isPending}
              testID="warehouseEdit.saveCapacity"
            >
              <Text style={s.saveBtnText}>{saveCapacity.isPending ? t('warehouseSettings.action.saving') : t('warehouseEdit.storage.saveCapacity')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={s.infoValue}>{capacity?.capacityGrams != null ? formatKg(capacity.capacityGrams) : noValue}</Text>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t('warehouseEdit.storage.locationsTitle')}</Text>
        {locationsLoading ? (
          <AdminLoadingState />
        ) : locations.length === 0 ? (
          <AdminEmptyState title={t('warehouseEdit.storage.noLocations')} />
        ) : (
          locations.map((loc) => (
            <View key={loc.id} style={s.locationRow}>
              <Text style={s.locCode}>{loc.code}</Text>
              <Text style={s.locName}>{loc.name}</Text>
              <Text style={[s.locStatus, loc.isActive ? s.statusActive : s.statusInactive]}>{loc.statusLabel}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function TimeRow({ label, value, onPick }: { label: string; value: string; onPick: (slot: string) => void }) {
  return (
    <>
      <Text style={s.infoLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timeScroll}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity key={slot} style={[s.timeChip, value === slot ? s.timeChipActive : null]} onPress={() => onPick(slot)}>
            <Text style={[s.timeChipText, value === slot ? s.timeChipTextActive : null]}>{slot}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

function OperationsTab({
  operatingHours,
  warehouseId,
  onSaved,
}: {
  operatingHours: unknown;
  warehouseId: string;
  onSaved: (() => void) | undefined;
}) {
  const save = useSaveWarehouseProfile(warehouseId);
  const initial = useMemo(() => operatingHoursFormOf(operatingHours), [operatingHours]);
  const [days, setDays] = useState<OperatingDayForm[]>(initial.days);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const toggleDay = useCallback((idx: number) => {
    setDays((prev) => prev.map((d, i) => i === idx ? { ...d, isOpen: !d.isOpen, open: d.open || '08:00', close: d.close || '18:00' } : d));
    save.reset();
  }, [save]);
  const setTime = useCallback((idx: number, field: 'open' | 'close', val: string) => {
    setDays((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
    save.reset();
  }, [save]);

  const handleSave = useCallback(() => {
    const body = operatingHoursBody(days);
    if ('errorKey' in body) { setBodyError(t(body.errorKey)); return; }
    setBodyError(null);
    save.run({ operatingHours: body.value }, onSaved);
  }, [days, save, onSaved]);

  return (
    <View style={s.tabContent}>
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t('warehouseEdit.hours.title')}</Text>
        {!initial.configured && <Text style={s.note}>{t('warehouseEdit.hours.notConfigured')}</Text>}
        {days.map((d, idx) => (
          <View key={d.day} style={s.dayRow}>
            <View style={s.dayToggleRow}>
              <Text style={s.dayLabel}>{t(d.labelKey)}</Text>
              <Switch
                value={d.isOpen}
                onValueChange={() => toggleDay(idx)}
                trackColor={{ true: adminColors.brand }}
                disabled={save.isPending}
                testID={'warehouseEdit.day.' + d.day}
              />
            </View>
            {d.isOpen && (
              <View style={s.timePicker}>
                <TimeRow label={t('warehouseEdit.hours.opens')} value={d.open} onPick={(slot) => setTime(idx, 'open', slot)} />
                <TimeRow label={t('warehouseEdit.hours.closes')} value={d.close} onPick={(slot) => setTime(idx, 'close', slot)} />
              </View>
            )}
          </View>
        ))}
        {bodyError ? <Text style={s.errorText}>{bodyError}</Text> : null}
        <SaveError error={save.error} />
        <TouchableOpacity
          style={[s.saveBtn, save.isPending ? s.saveBtnDisabled : null]}
          onPress={handleSave}
          disabled={save.isPending}
          testID="warehouseEdit.saveHours"
        >
          <Text style={s.saveBtnText}>{save.isPending ? t('warehouseSettings.action.saving') : t('warehouseEdit.hours.save')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const TABS: EditWarehouseTab[] = ['Details', 'Contact', 'Storage', 'Operations'];

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} style={s.backBtn} accessibilityRole="button" accessibilityLabel={t('warehouseEdit.back')} testID="warehouseEdit.back">
        <Svg width={BACK_ICON} height={BACK_ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      <Text style={s.headerTitle}>{t('warehouseEdit.title')}</Text>
    </View>
  );
}

export function WarehouseEditProfileScreen({
  can,
  onBack,
  warehouseId,
  initialTab = 'Details',
  onSaveSuccess,
}: WarehouseEditProfileScreenProps) {
  const [activeTab, setActiveTab] = useState<EditWarehouseTab>(initialTab);

  // Fail closed: without the code the hooks below get no id and fetch nothing.
  const canEdit = can('warehouse.profile.edit');
  const canSetCapacity = can('warehouse.capacity.set');
  const readId = canEdit ? warehouseId : undefined;

  const profileQ = useWarehouseProfile(readId);
  const capacityQ = useWarehouseCapacity(readId);
  const locationsQ = useStorageLocations(readId, {});

  if (!canEdit || !readId) {
    return (
      <SafeAreaView style={s.root}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
        <Header onBack={onBack} />
        <AdminEmptyState
          title={t(canEdit ? 'warehouseSettings.unavailable' : 'warehouseAdmin.notAvailable.title')}
          subtitle={canEdit ? undefined : t('warehouseEdit.noPermission')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <Header onBack={onBack} />
      <View style={s.tabBar}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          const color = active ? adminColors.brand : adminColors.muted;
          return (
            <TouchableOpacity
              key={tab}
              style={[s.tabItem, active ? s.tabItemActive : null]}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              testID={'warehouseEdit.tab.' + tab}
            >
              <TabIcon tab={tab} color={color} />
              <Text style={[s.tabLabel, active ? s.tabLabelActive : null]}>{t(`warehouseEdit.tab.${tab}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {profileQ.isLoading ? (
        <AdminLoadingState />
      ) : profileQ.error ? (
        <AdminErrorState error={profileQ.error} onRetry={profileQ.refresh} />
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          refreshControl={<RefreshControl refreshing={profileQ.isRefreshing} onRefresh={profileQ.refresh} />}
        >
          {activeTab === 'Details' && <DetailsTab profile={profileQ.warehouse} />}
          {activeTab === 'Contact' && <ContactTab profile={profileQ.warehouse} onSaved={onSaveSuccess} />}
          {activeTab === 'Storage' && (
            <StorageTab
              capacity={capacityQ.capacity}
              locations={locationsQ.locations}
              locationsLoading={locationsQ.isLoading}
              canSetCapacity={canSetCapacity}
              warehouseId={readId}
              onSaved={onSaveSuccess}
            />
          )}
          {activeTab === 'Operations' && (
            <OperationsTab operatingHours={profileQ.operatingHours} warehouseId={readId} onSaved={onSaveSuccess} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// Fixed widths of the code column and the time-chip strip: layout sizes, not spacing.
const LOC_CODE_WIDTH = 72;
const TIME_SCROLL_HEIGHT = 36;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: adminSpacing.lg, paddingVertical: adminSpacing.md, borderBottomWidth: 1, borderBottomColor: adminColors.border },
  backBtn: { marginRight: adminSpacing.md, padding: adminSpacing.xs },
  headerTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: adminColors.border, backgroundColor: adminColors.card },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: adminSpacing.md, gap: adminSpacing.xs },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: adminColors.brand },
  tabLabel: { ...adminType.caption, color: adminColors.muted },
  tabLabelActive: { color: adminColors.brand },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, gap: adminSpacing.lg },
  tabContent: { gap: adminSpacing.lg },
  card: { backgroundColor: adminColors.card, borderRadius: adminRadius.lg, padding: adminSpacing.lg, gap: adminSpacing.md, ...adminShadow.sm },
  sectionTitle: { ...adminType.rowTitle, color: adminColors.ink },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: adminSpacing.xs },
  infoLabel: { ...adminType.caption, color: adminColors.muted },
  infoValue: { ...adminType.body, color: adminColors.ink },
  note: { ...adminType.caption, color: adminColors.muted, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: adminColors.border, borderRadius: adminRadius.md, paddingHorizontal: adminSpacing.md, paddingVertical: adminSpacing.sm, ...adminType.body, color: adminColors.ink },
  inputError: { borderColor: adminColors.danger.border },
  errorText: { ...adminType.caption, color: adminColors.danger.text },
  saveBtn: { backgroundColor: adminColors.brand, borderRadius: adminRadius.md, paddingVertical: adminSpacing.md, alignItems: 'center', marginTop: adminSpacing.sm },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  locationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: adminSpacing.sm, borderBottomWidth: 1, borderBottomColor: adminColors.border, gap: adminSpacing.sm },
  locCode: { ...adminType.caption, color: adminColors.brand, width: LOC_CODE_WIDTH },
  locName: { ...adminType.body, color: adminColors.ink, flex: 1 },
  locStatus: { ...adminType.caption },
  statusActive: { color: adminColors.success.text },
  statusInactive: { color: adminColors.muted },
  dayRow: { borderBottomWidth: 1, borderBottomColor: adminColors.border, paddingVertical: adminSpacing.sm, gap: adminSpacing.sm },
  dayToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { ...adminType.body, color: adminColors.ink },
  timePicker: { gap: adminSpacing.xs },
  timeScroll: { maxHeight: TIME_SCROLL_HEIGHT },
  timeChip: { paddingHorizontal: adminSpacing.sm, paddingVertical: adminSpacing.xs, borderRadius: adminRadius.full, borderWidth: 1, borderColor: adminColors.border, marginRight: adminSpacing.xs },
  timeChipActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  timeChipText: { ...adminType.caption, color: adminColors.muted },
  timeChipTextActive: { color: adminColors.brand },
});
