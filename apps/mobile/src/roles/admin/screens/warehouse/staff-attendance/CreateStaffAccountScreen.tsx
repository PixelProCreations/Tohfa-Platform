/**
 * Create account: one form for a person who works for TOHFA, with or without
 * a login.
 *
 *   Application login       POST /admin/accounts (SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN;
 *                           admin.<role>.create) or POST /admin/sub-warehouse-admins
 *                           (admin.sub_wh_admin.create, needs a warehouse)
 *   No application access   POST /admin/warehouse-staff (admin.staff.manage, needs a warehouse)
 *
 * Only roles the viewer holds a create code for can be picked; the server
 * checks again (BR-28). What the endpoints carry is sent: the name (first,
 * middle and last joined), the mobile, and for a staff record the
 * designation, joining date, status and warehouse. Every other field of the
 * form shows the module's dash and does not take input, because no endpoint
 * stores it. Farmer Admin needs a zone and the app has no zone list, so it
 * cannot be created here yet.
 */
// Design id: SA-M14 Create account
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminErrorKey } from '../../../api/errors';
import type { StaffStatus } from '../../../api/staff';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { CalendarIcon, WalletButton, WalletFooter, WalletScreen } from '../wallet-cashtopup/WalletParts';
import {
  APPLICATION_ROLE_LABEL,
  APPLICATION_ROLES,
  applicationRoleSelectable,
  buildAccountRequest,
  creatableLoginRoles,
  emptyAccountForm,
  type AccountAccess,
  type AccountForm,
  type ApplicationRole,
} from './accessMappers';
import { canManageStaff, istToday, STAFF_CODES, STAFF_NONE_KEY, staffStatusLabel } from './mappers';
import { ChevronDownIcon } from './StaffParts';
import type { WarehouseScreenBaseProps } from './types';
import { useCreateAccountMutation, useStaffWarehouses } from './useStaffData';

export interface CreateStaffAccountScreenProps extends WarehouseScreenBaseProps {
  /** After the success dialog: back to the staff list. */
  onSave: () => void;
}

const STATUS_OPTIONS: readonly StaffStatus[] = ['ACTIVE', 'INACTIVE'];

const DOCUMENTS: readonly { title: TranslationKey; sub: TranslationKey }[] = [
  { title: 'staffAccess.create.doc.idProof', sub: 'staffAccess.create.doc.idProofSub' },
  { title: 'staffAccess.create.doc.addressProof', sub: 'staffAccess.create.doc.policyOptional' },
  { title: 'staffAccess.create.doc.bankProof', sub: 'staffAccess.create.doc.bankProofSub' },
  { title: 'staffAccess.create.doc.appointment', sub: 'staffAccess.create.doc.policyOptional' },
  { title: 'staffAccess.create.doc.agreement', sub: 'staffAccess.create.doc.agreementSub' },
  { title: 'staffAccess.create.doc.education', sub: 'staffAccess.create.doc.policyOptional' },
  { title: 'staffAccess.create.doc.experience', sub: 'staffAccess.create.doc.policyOptional' },
  { title: 'staffAccess.create.doc.other', sub: 'staffAccess.create.doc.policyOptional' },
];

function UploadIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8l-5-5-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="3" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function RadioIcon({ selected, color }: { selected: boolean; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={selected ? 2.5 : 2} />
      {selected ? <Circle cx="12" cy="12" r="5" fill={color} /> : null}
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={adminColors.muted} strokeWidth="2" />
    </Svg>
  );
}

export function CreateStaffAccountScreen({ scope, can, onBack, onSave }: CreateStaffAccountScreenProps) {
  const [now] = useState(() => new Date());
  const [form, setForm] = useState<AccountForm>(() => ({
    ...emptyAccountForm(istToday(now)),
    access: creatableLoginRoles(can).length > 0 ? 'login' : 'no_login',
  }));
  const [openField, setOpenField] = useState<'role' | 'status' | 'warehouse' | null>(null);
  const [pickedWarehouseId, setPickedWarehouseId] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const confined = scope.warehouseId !== undefined;
  const pickerAllowed = !confined && can(STAFF_CODES.warehouseList);
  const warehouses = useStaffWarehouses(scope, pickerAllowed ? can : () => false);
  const create = useCreateAccountMutation();

  const dash = t(STAFF_NONE_KEY);
  const loginAllowed = creatableLoginRoles(can).length > 0;
  const recordAllowed = canManageStaff(can);
  const warehouseId = confined ? scope.warehouseId : pickedWarehouseId;
  const warehouseText = confined ? (scope.warehouseName ?? dash) : pickedWarehouseId === undefined ? dash : warehouses.nameOf(pickedWarehouseId);
  const set = (patch: Partial<AccountForm>) => setForm((prev) => ({ ...prev, ...patch }));
  const toggle = (field: 'role' | 'status' | 'warehouse') => setOpenField((prev) => (prev === field ? null : field));

  const setAccess = (access: AccountAccess) => {
    // A role chosen for the other kind of account no longer applies.
    setForm((prev) => ({ ...prev, access, role: prev.role !== null && applicationRoleSelectable(prev.role, access, can) ? prev.role : null }));
  };

  const submit = () => {
    const result = buildAccountRequest(form, warehouseId);
    if (!result.ok) {
      setFormError(t(result.errorKey));
      return;
    }
    setFormError(null);
    create.mutate(result.body, {
      onSuccess: (code) => {
        Alert.alert(t('staffAccess.create.doneTitle'), t('staffAccess.create.doneMessage', { code: code ?? dash }), [
          { text: t('staffAccess.common.ok'), onPress: onSave },
        ]);
      },
    });
  };

  // ─── Building blocks ────────────────────────────────────────────────────────

  const card = (step: string, title: TranslationKey, subtitle: TranslationKey, children: React.ReactNode) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{t(title)}</Text>
          <Text style={styles.cardSubtitle}>{t(subtitle)}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      {children}
    </View>
  );

  const field = (labelKey: TranslationKey, mark: 'required' | 'optional' | 'none', children: React.ReactNode, helper?: TranslationKey) => (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{t(labelKey)}</Text>
        {mark === 'required' ? <Text style={styles.requiredStar}>{t('staffAccess.common.required')}</Text> : null}
        {mark === 'optional' ? <Text style={styles.optionalText}>{t('staffAccess.create.optional')}</Text> : null}
      </View>
      {children}
      {helper !== undefined ? <Text style={styles.helper}>{t(helper)}</Text> : null}
    </View>
  );

  /** A field no endpoint stores: rendered, shows the dash, takes no input. */
  const dashInput = (labelKey: TranslationKey, mark: 'required' | 'optional' | 'none' = 'none', helper?: TranslationKey, icon?: React.ReactNode) =>
    field(
      labelKey,
      mark,
      <View style={[styles.inputRow, styles.disabled]}>
        <Text style={styles.mutedText}>{dash}</Text>
        {icon}
      </View>,
      helper,
    );

  const dashSelect = (labelKey: TranslationKey, mark: 'required' | 'optional' | 'none' = 'none', helper?: TranslationKey) =>
    dashInput(labelKey, mark, helper, <ChevronDownIcon size={16} color={adminColors.muted} />);

  const textInput = (value: string, onChange: (v: string) => void, labelKey: TranslationKey, keyboardType: 'default' | 'phone-pad' = 'default') => (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      placeholderTextColor={adminColors.placeholder}
      accessibilityLabel={t(labelKey)}
    />
  );

  const select = (value: string, open: boolean, onPress: () => void, placeholder: boolean) => (
    <TouchableOpacity style={styles.inputRow} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityState={{ expanded: open }}>
      <Text style={placeholder ? styles.mutedText : styles.inputText}>{value}</Text>
      <ChevronDownIcon size={16} color={adminColors.ink} />
    </TouchableOpacity>
  );

  const menu = <T extends string>(options: readonly T[], value: T | null | undefined, labelOf: (o: T) => string, onPick: (o: T) => void, enabled: (o: T) => boolean = () => true) => (
    <View style={styles.menu}>
      {options.map((option) => {
        const active = option === value;
        const on = enabled(option);
        return (
          <TouchableOpacity
            key={option}
            style={[styles.menuItem, active && styles.menuItemActive]}
            disabled={!on}
            onPress={() => {
              onPick(option);
              setOpenField(null);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ disabled: !on, selected: active }}
          >
            <Text style={[styles.menuText, active && styles.menuTextActive, !on && styles.menuTextDisabled]}>{labelOf(option)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const radio = (access: AccountAccess, titleKey: TranslationKey, subKey: TranslationKey, enabled: boolean) => {
    const selected = form.access === access;
    return (
      <TouchableOpacity
        style={[styles.radioCard, selected && styles.radioCardSelected, !enabled && styles.disabled]}
        onPress={() => setAccess(access)}
        disabled={!enabled}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled: !enabled }}
      >
        <RadioIcon selected={selected} color={selected ? adminColors.brand : adminColors.muted} />
        <View style={styles.flex}>
          <Text style={styles.radioTitle}>{t(titleKey)}</Text>
          <Text style={styles.radioSub}>{t(subKey)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const statusBoxText =
    form.access === 'login' ? t('staffAccess.create.statusLogin') : staffStatusLabel(form.status);
  const statusBoxHelper = form.access === 'login' ? t('staffAccess.create.statusLoginHelp') : t('staffAccess.create.statusRecordHelp');

  return (
    <WalletScreen
      title={t('staffAccess.create.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <View style={styles.footerRow}>
            <WalletButton flex label={t('staffAccess.create.submit')} disabled={create.isPending} onPress={submit} />
            <WalletButton flex label={t('staff.common.cancel')} variant="neutral" onPress={onBack} />
          </View>
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {card(
          '1',
          'staffAccess.create.personal',
          'staffAccess.create.personalSub',
          <>
            {field(
              'staffAccess.create.photo',
              'optional',
              <View style={styles.photoRow}>
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>{dash}</Text>
                </View>
                <View style={[styles.uploadBtn, styles.disabled]}>
                  <UploadIcon color={adminColors.muted} />
                  <Text style={styles.mutedStrong}>{t('staffAccess.create.uploadPhoto')}</Text>
                </View>
              </View>,
              'staffAccess.create.photoHelp',
            )}
            {field('staffAccess.create.firstName', 'required', textInput(form.firstName, (v) => set({ firstName: v }), 'staffAccess.create.firstName'))}
            {field('staffAccess.create.middleName', 'optional', textInput(form.middleName, (v) => set({ middleName: v }), 'staffAccess.create.middleName'))}
            {field('staffAccess.create.lastName', 'required', textInput(form.lastName, (v) => set({ lastName: v }), 'staffAccess.create.lastName'))}
            {dashInput('staffAccess.create.dob', 'optional', undefined, <CalendarIcon color={adminColors.muted} />)}
            {dashSelect('staffAccess.create.gender')}
            {dashSelect('staffAccess.create.marital')}
            {dashInput('staffAccess.create.guardian', 'optional')}
            {dashInput('staffAccess.create.nationality', 'optional')}
            {dashSelect('staffAccess.create.language', 'optional')}
            {dashSelect('staffAccess.create.bloodGroup')}
          </>,
        )}

        {card(
          '2',
          'staffAccess.create.contact',
          'staffAccess.create.contactSub',
          <>
            {field(
              'staffAccess.create.mobile',
              'required',
              textInput(form.mobile, (v) => set({ mobile: v }), 'staffAccess.create.mobile', 'phone-pad'),
              'staffAccess.create.mobileHelp',
            )}
            {dashInput('staffAccess.create.altMobile')}
            {dashInput('staffAccess.create.email', 'none', 'staffAccess.create.emailHelp')}
            {dashInput('staffAccess.create.address')}
            {dashInput('staffAccess.create.state')}
            {dashInput('staffAccess.create.district')}
            {dashInput('staffAccess.create.city')}
            {dashInput('staffAccess.create.pin')}
          </>,
        )}

        {card(
          '3',
          'staffAccess.create.idProofSection',
          'staffAccess.create.idProofSectionSub',
          <>
            {dashSelect('staffAccess.create.idProofType', 'none', 'staffAccess.create.idProofTypeHelp')}
            {dashInput('staffAccess.create.idProofNumber', 'none', 'staffAccess.create.idProofNumberHelp')}
            {dashInput('staffAccess.create.idProofName')}
          </>,
        )}

        {card(
          '4',
          'staffAccess.create.bank',
          'staffAccess.create.bankSub',
          <>
            {dashInput('staffAccess.create.accountHolder')}
            {dashInput('staffAccess.create.bankName')}
            {dashInput('staffAccess.create.accountNumber', 'none', undefined, <EyeIcon />)}
            {dashInput('staffAccess.create.confirmAccount')}
            {dashInput('staffAccess.create.ifsc', 'none', 'staffAccess.create.ifscHelp')}
            {dashInput('staffAccess.create.branch')}
            {dashSelect('staffAccess.create.accountType')}
            {field(
              'staffAccess.create.bankProofUpload',
              'optional',
              <View style={styles.dropZone}>
                <UploadIcon size={24} color={adminColors.muted} />
                <Text style={styles.dropZoneTitle}>{dash}</Text>
                <Text style={styles.helper}>{t('staffAccess.create.fileTypes')}</Text>
                <View style={[styles.browseBtn, styles.disabled]}>
                  <Text style={styles.mutedStrong}>{t('staffAccess.create.browse')}</Text>
                </View>
              </View>,
            )}
          </>,
        )}

        {card(
          '5',
          'staffAccess.create.employment',
          'staffAccess.create.employmentSub',
          <>
            {field(
              'staffAccess.create.staffId',
              'none',
              <View style={[styles.inputRow, styles.disabled]}>
                <Text style={styles.mutedText}>{t('staffAccess.create.generatedOnSave')}</Text>
              </View>,
            )}
            {dashInput('staffAccess.create.employeeId', 'optional')}
            {field(
              'staffAccess.create.joiningDate',
              form.access === 'no_login' ? 'required' : 'optional',
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.embeddedInput}
                  value={form.joinedOn}
                  onChangeText={(v) => set({ joinedOn: v.trim() })}
                  placeholder={t('staff.form.datePlaceholder')}
                  placeholderTextColor={adminColors.placeholder}
                  accessibilityLabel={t('staffAccess.create.joiningDate')}
                />
                <CalendarIcon color={adminColors.brand} />
              </View>,
            )}
            {dashSelect('staffAccess.create.employmentType')}
            {dashSelect('staffAccess.create.department')}
            {field(
              'staffAccess.create.designation',
              form.access === 'no_login' ? 'required' : 'none',
              textInput(form.designation, (v) => set({ designation: v }), 'staffAccess.create.designation'),
            )}
            {field(
              'staffAccess.create.employmentStatus',
              'optional',
              <>
                {select(staffStatusLabel(form.status), openField === 'status', () => toggle('status'), false)}
                {openField === 'status' ? menu(STATUS_OPTIONS, form.status, staffStatusLabel, (status) => set({ status })) : null}
              </>,
            )}
            {field(
              'staffAccess.create.workLocation',
              'none',
              confined ? (
                <View style={[styles.inputRow, styles.disabled]}>
                  <Text style={styles.inputText}>{warehouseText}</Text>
                </View>
              ) : !pickerAllowed ? (
                <View style={[styles.inputRow, styles.disabled]}>
                  <Text style={styles.mutedText}>{dash}</Text>
                </View>
              ) : warehouses.isLoading ? (
                <AdminLoadingState />
              ) : warehouses.error ? (
                <AdminErrorState error={warehouses.error} onRetry={warehouses.refresh} />
              ) : (
                <>
                  {select(warehouseText, openField === 'warehouse', () => toggle('warehouse'), pickedWarehouseId === undefined)}
                  {openField === 'warehouse'
                    ? menu(
                        warehouses.options.map((o) => o.warehouseId),
                        pickedWarehouseId,
                        warehouses.nameOf,
                        setPickedWarehouseId,
                      )
                    : null}
                </>
              ),
            )}
          </>,
        )}

        {card(
          '6',
          'staffAccess.create.roleAccess',
          'staffAccess.create.roleAccessSub',
          <>
            {field(
              'staffAccess.create.accountAccess',
              'required',
              <>
                {radio('login', 'staffAccess.create.accessLogin', 'staffAccess.create.accessLoginSub', loginAllowed)}
                {radio('no_login', 'staffAccess.create.accessNone', 'staffAccess.create.accessNoneSub', recordAllowed)}
              </>,
            )}
            {field(
              'staffAccess.create.appRole',
              'required',
              <>
                {select(form.role === null ? dash : t(APPLICATION_ROLE_LABEL[form.role]), openField === 'role', () => toggle('role'), form.role === null)}
                {openField === 'role'
                  ? menu<ApplicationRole>(
                      APPLICATION_ROLES,
                      form.role,
                      (r) => t(APPLICATION_ROLE_LABEL[r]),
                      (role) => set({ role }),
                      (r) => applicationRoleSelectable(r, form.access, can),
                    )
                  : null}
              </>,
              'staffAccess.create.appRoleHelp',
            )}
            {dashInput('staffAccess.create.loginEmail', 'none', 'staffAccess.create.loginEmailHelp')}
            {field(
              'staffAccess.create.accountStatus',
              'none',
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxText}>{statusBoxText}</Text>
                <Text style={styles.statusBoxHelper}>{statusBoxHelper}</Text>
              </View>,
            )}
          </>,
        )}

        {card(
          '8',
          'staffAccess.create.emergency',
          'staffAccess.create.emergencySub',
          <>
            {dashInput('staffAccess.create.contactName')}
            {dashSelect('staffAccess.create.relationship')}
            {dashInput('staffAccess.create.contactPhone')}
            {dashInput('staffAccess.create.contactAltPhone', 'optional')}
            {dashInput('staffAccess.create.contactAddress', 'optional')}
          </>,
        )}

        {card(
          '9',
          'staffAccess.create.documents',
          'staffAccess.create.documentsSub',
          <>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>{t('staffAccess.create.documentsCallout')}</Text>
            </View>
            {DOCUMENTS.map((doc, i) => (
              <View key={doc.title} style={[styles.docItem, i === DOCUMENTS.length - 1 && styles.docItemLast]}>
                <Text style={styles.docTitle}>{t(doc.title)}</Text>
                <Text style={styles.helper}>{t(doc.sub)}</Text>
                <View style={styles.docPill}>
                  <Text style={styles.docPillText}>{t('staffAccess.create.optionalPill')}</Text>
                </View>
                <Text style={styles.mutedText}>{dash}</Text>
                <Text style={styles.helper}>{t('staffAccess.create.verification')}</Text>
                <View style={styles.verifyPill}>
                  <Text style={styles.verifyPillText}>{dash}</Text>
                </View>
                <View style={[styles.docBtn, styles.disabled]}>
                  <Text style={styles.mutedStrong}>{t('staffAccess.create.browse')}</Text>
                </View>
              </View>
            ))}
          </>,
        )}

        {formError !== null ? <Text style={styles.errorText}>{formError}</Text> : null}
        {create.error ? <Text style={styles.errorText}>{t(adminErrorKey(create.error))}</Text> : null}
      </ScrollView>
    </WalletScreen>
  );
}

const STEP_BADGE = 24;
const INPUT_HEIGHT = 44;
const PHOTO = 58;
const BUTTON_HEIGHT = 44;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: adminSpacing.lg, paddingBottom: adminSpacing.largeSection },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  stepBadge: {
    width: STEP_BADGE,
    height: STEP_BADGE,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.smMd,
  },
  stepBadgeText: { ...adminType.sectionHead, color: adminColors.brand },
  cardTitle: { ...adminType.sectionHead, color: adminColors.ink },
  cardSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  divider: { height: 1, backgroundColor: adminColors.border, marginTop: adminSpacing.md, marginBottom: adminSpacing.lg },
  field: { marginBottom: adminSpacing.mdLg },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: adminSpacing.xsSm },
  label: { ...adminType.rowTitle, color: adminColors.ink },
  requiredStar: { ...adminType.rowTitle, color: adminColors.danger.text },
  optionalText: { ...adminType.rowMeta, color: adminColors.muted, marginLeft: adminSpacing.xsSm },
  helper: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  input: {
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
  },
  inputRow: {
    height: INPUT_HEIGHT,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  embeddedInput: { flex: 1, height: INPUT_HEIGHT, ...adminType.body, color: adminColors.ink, padding: 0 },
  disabled: { backgroundColor: adminColors.canvas },
  inputText: { ...adminType.body, color: adminColors.ink },
  mutedText: { ...adminType.body, color: adminColors.muted },
  mutedStrong: { ...adminType.rowTitle, color: adminColors.muted },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.mdLg },
  photoPlaceholder: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO / 2,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  photoPlaceholderText: { ...adminType.title, color: adminColors.brandDeep },
  uploadBtn: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  menu: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginTop: adminSpacing.xs,
    ...adminShadow.sm,
  },
  menuItem: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  menuItemActive: { backgroundColor: adminColors.brandTint },
  menuText: { ...adminType.rowTitle, color: adminColors.ink },
  menuTextActive: { color: adminColors.brand },
  menuTextDisabled: { color: adminColors.placeholder },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  radioCardSelected: { borderWidth: 1.5, borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  radioTitle: { ...adminType.rowTitle, color: adminColors.ink },
  radioSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  statusBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.xs,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
  },
  statusBoxText: { ...adminType.rowTitle, color: adminColors.warning.text },
  statusBoxHelper: { ...adminType.rowMeta, color: adminColors.warning.text, marginTop: adminSpacing.xs },
  dropZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    padding: adminSpacing.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneTitle: { ...adminType.rowTitle, color: adminColors.muted, marginTop: adminSpacing.smMd },
  browseBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  callout: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.sm,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.mdLg,
  },
  calloutText: { ...adminType.rowMeta, color: adminColors.info.text },
  docItem: { paddingVertical: adminSpacing.md, borderBottomWidth: 1, borderBottomColor: adminColors.border, gap: adminSpacing.xs },
  docItemLast: { borderBottomWidth: 0 },
  docTitle: { ...adminType.rowTitle, color: adminColors.ink },
  docPill: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs / 2,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: adminSpacing.xs / 2,
  },
  docPillText: { ...adminType.caption, color: adminColors.muted },
  verifyPill: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.xs / 2,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: adminSpacing.xs / 2,
  },
  verifyPillText: { ...adminType.caption, color: adminColors.warning.text },
  docBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xsSm,
    marginTop: adminSpacing.xs,
  },
  footerRow: { flexDirection: 'row', gap: adminSpacing.md },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginBottom: adminSpacing.md },
});
