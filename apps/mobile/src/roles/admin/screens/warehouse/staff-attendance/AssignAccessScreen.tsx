/**
 * Assign & Access: an admin user, the role assigned, and that role's module
 * permissions, read from GET /roles (role.definition.view).
 *
 *   Assign Role             the role definitions from the server
 *   Module Permissions      one row per module; Access is on where the role
 *                           holds a grant, the Permissions menu lists those
 *                           grants (code, description, scope)
 *
 * There is no admin-user list, no role type, no per-module expiry and no
 * write route for grants (role.permission.edit is not built on the server), so
 * those fields show the module's dash and their controls do not act.
 */
// Design id: SA-M14 Assign & Access
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { RoleDefinitionDto, RolePermissionGrantDto } from '../../../api/roles';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { InfoNote, WalletButton, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { accessModuleRows, canViewRoles, moduleIconKind, type ModuleIconKind, type ModuleRow } from './accessMappers';
import { STAFF_NONE_KEY } from './mappers';
import { ChevronDownIcon, CloseIcon } from './StaffParts';
import type { WarehouseScreenBaseProps } from './types';
import { useRoleDefinitions } from './useStaffData';

export interface AssignAccessScreenProps extends WarehouseScreenBaseProps {
  /** Role code to open on (from Roles "View"). */
  initialRoleCode?: string | undefined;
}

const SCOPE_LABEL: Readonly<Record<RolePermissionGrantDto['scope'], TranslationKey>> = {
  all: 'staffAccess.scope.all',
  own: 'staffAccess.scope.own',
  view: 'staffAccess.scope.view',
  conditional: 'staffAccess.scope.conditional',
};

const MODULE_ICON = 16;

function ModuleIcon({ kind }: { kind: ModuleIconKind }) {
  const c = adminColors.brand;
  switch (kind) {
    case 'grid':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.8" />
        </Svg>
      );
    case 'users':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="7" r="3.5" stroke={c} strokeWidth="1.8" />
          <Path d="M16 11a3 3 0 00-3-3M3 20c0-3 2.5-5 6-5s6 2 6 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'produce':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="6" cy="17" r="3" stroke={c} strokeWidth="1.8" />
          <Circle cx="18" cy="15" r="5" stroke={c} strokeWidth="1.8" />
          <Path d="M9 17h4M12 9h4l2 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'audit':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="1.8" />
          <Path d="M16 2v4M8 2v4M3 10h18M8 14l2 2 4-4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21a9 9 0 009-9c0-6-9-9-9-9s-9 3-9 9a9 9 0 009 9z" stroke={c} strokeWidth="1.8" />
          <Path d="M12 21V12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'rupee':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
          <Path d="M8 7h8M8 11h5a2.5 2.5 0 000-5H8M8 11l6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'cart':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="20" r="1.5" fill={c} />
          <Circle cx="18" cy="20" r="1.5" fill={c} />
          <Path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'sales':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M4 7h16v13a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M8 7V4a2 2 0 012-2h4a2 2 0 012 2v3M9 12h6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'warehouse':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M3 21h18M3 9l9-5 9 5v12H3V9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M9 21v-7h6v7" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
        </Svg>
      );
    case 'finance':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
          <Path d="M12 6v12M15 9.5a2.5 2.5 0 00-2.5-2.5h-1a2.5 2.5 0 000 5h1a2.5 2.5 0 010 5h-1A2.5 2.5 0 019 14.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'idCard':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8" />
          <Circle cx="12" cy="10" r="3" stroke={c} strokeWidth="1.6" />
          <Path d="M7 18c0-2 2-3.5 5-3.5s5 1.5 5 3.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        </Svg>
      );
    case 'gear':
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8" />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={MODULE_ICON} height={MODULE_ICON} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="3" width="16" height="18" rx="2" stroke={c} strokeWidth="1.8" />
          <Line x1="8" y1="8" x2="16" y2="8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="8" y1="12" x2="16" y2="12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="8" y1="16" x2="12" y2="16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
  }
}

function CalendarCheckIcon() {
  const c = adminColors.success.text;
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={c} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 15l2 2 4-4" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={adminColors.muted} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.muted} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function AssignAccessScreen({ can, onBack, initialRoleCode }: AssignAccessScreenProps) {
  const allowed = canViewRoles(can);
  const list = useRoleDefinitions(allowed);
  const [roleCode, setRoleCode] = useState<string | undefined>(initialRoleCode);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [permRow, setPermRow] = useState<ModuleRow | null>(null);
  const [accessRow, setAccessRow] = useState<ModuleRow | null>(null);
  const rows = useMemo(() => accessModuleRows(list.roles, roleCode), [list.roles, roleCode]);
  const selected: RoleDefinitionDto | undefined = list.roles.find((r) => r.code === roleCode);
  const dash = t(STAFF_NONE_KEY);

  if (!allowed) {
    return (
      <WalletScreen title={t('staffAccess.assign.title')} onBack={onBack}>
        <AdminEmptyState title={t('staff.denied.title')} subtitle={t('staffAccess.denied.roles')} />
      </WalletScreen>
    );
  }

  const label = (text: string, required: boolean) => (
    <Text style={styles.fieldLabel}>
      {text}
      {required ? <Text style={styles.asterisk}>{t('staffAccess.common.required')}</Text> : null}
    </Text>
  );

  return (
    <WalletScreen title={t('staffAccess.assign.title')} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        {label(t('staffAccess.assign.user'), true)}
        <TouchableOpacity style={[styles.dropdown, styles.dropdownDisabled]} disabled accessibilityState={{ disabled: true }}>
          <Text style={styles.dropdownMuted}>{dash}</Text>
          <ChevronDownIcon size={12} color={adminColors.muted} />
        </TouchableOpacity>

        <View style={styles.twoColRow}>
          <View style={styles.col}>
            {label(t('staffAccess.assign.role'), true)}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRolePicker(true)}
              disabled={list.roles.length === 0}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selected?.name ?? dash}
              </Text>
              <ChevronDownIcon size={12} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
          <View style={styles.col}>
            {label(t('staffAccess.assign.roleType'), true)}
            <TouchableOpacity style={[styles.dropdown, styles.dropdownDisabled]} disabled accessibilityState={{ disabled: true }}>
              <Text style={styles.dropdownMuted}>{dash}</Text>
              <ChevronDownIcon size={12} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.moduleCard}>
          <View style={styles.moduleHeaderRow}>
            <View style={styles.moduleTitleRow}>
              <ModuleIcon kind="grid" />
              <Text style={styles.moduleSectionTitle}>
                {t('staffAccess.assign.modules')}{' '}
                <Text style={styles.moduleCount}>{t('staffAccess.assign.moduleCount', { count: String(rows.length) })}</Text>
              </Text>
            </View>
            <View style={styles.selectAllRow}>
              <Text style={styles.selectAllLabel}>{t('staffAccess.assign.select')}</Text>
              <View style={styles.checkbox} />
              <Text style={styles.selectAllText}>{t('staffAccess.assign.all')}</Text>
            </View>
          </View>

          <View style={styles.tableHeadRow}>
            <Text style={[styles.thText, styles.colNum]}>{t('staffAccess.assign.col.num')}</Text>
            <Text style={[styles.thText, styles.colModule]}>{t('staffAccess.assign.col.module')}</Text>
            <Text style={[styles.thText, styles.colPerm, styles.center]}>{t('staffAccess.assign.col.permissions')}</Text>
            <Text style={[styles.thText, styles.colAccess, styles.center]}>{t('staffAccess.assign.col.access')}</Text>
            <Text style={[styles.thText, styles.colExpiry, styles.center]}>{t('staffAccess.assign.col.expiry')}</Text>
          </View>

          {list.isLoading ? <AdminLoadingState /> : null}
          {list.error ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
          {rows.map((row) => {
            const granted = row.grants.length > 0;
            return (
              <View key={row.module} style={styles.tableRow}>
                <View style={styles.colNum}>
                  <Text style={styles.numText}>{row.index}</Text>
                </View>
                <View style={[styles.colModule, styles.moduleInfo]}>
                  <View style={styles.moduleIconBox}>
                    <ModuleIcon kind={moduleIconKind(row.module)} />
                  </View>
                  <Text style={styles.moduleName} numberOfLines={2}>
                    {row.module}
                  </Text>
                </View>
                <View style={[styles.colPerm, styles.centerItems]}>
                  <TouchableOpacity
                    style={styles.permDropdown}
                    onPress={() => setPermRow(row)}
                    disabled={!granted}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <Text style={styles.permText} numberOfLines={1}>
                      {granted ? t('staffAccess.assign.codes', { count: String(row.grants.length) }) : dash}
                    </Text>
                    <ChevronDownIcon size={12} color={adminColors.muted} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.colAccess, styles.centerItems]}>
                  <Switch
                    value={granted}
                    disabled
                    trackColor={{ false: adminColors.border, true: adminColors.brand }}
                    thumbColor={adminColors.onBrand}
                  />
                </View>
                <View style={[styles.colExpiry, styles.centerItems]}>
                  <TouchableOpacity onPress={() => setAccessRow(row)} activeOpacity={0.7} accessibilityRole="button">
                    <Text style={styles.dashText}>{dash}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.bottomRow}>
          <WalletButton flex label={t('staff.common.cancel')} variant="neutral" onPress={onBack} />
          <WalletButton flex label={t('staffAccess.assign.save')} disabled onPress={onBack} />
        </View>
        <InfoNote>{t('staffAccess.assign.readOnlyNote')}</InfoNote>
      </ScrollView>

      {/* Permission Access */}
      <Modal visible={accessRow !== null} transparent animationType="fade" onRequestClose={() => setAccessRow(null)}>
        <View style={styles.overlay}>
          <View style={styles.accessCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setAccessRow(null)} accessibilityRole="button" accessibilityLabel={t('staff.common.close')}>
              <CloseIcon size={20} color={adminColors.muted} />
            </TouchableOpacity>
            <View style={styles.calendarCircle}>
              <CalendarCheckIcon />
            </View>
            <Text style={styles.accessTitle}>{t('staffAccess.access.title')}</Text>
            <Text style={styles.accessSub}>{t('staffAccess.access.subtitle')}</Text>
            <View style={styles.radioRow}>
              {(['staffAccess.access.permanent', 'staffAccess.access.timeBound'] as const).map((key) => (
                <View key={key} style={styles.radioPill}>
                  <View style={styles.radioOuter} />
                  <Text style={styles.radioText}>{t(key)}</Text>
                </View>
              ))}
            </View>
            <View style={styles.formCard}>
              <Text style={styles.modalLabel}>{t('staffAccess.access.expiryDate')}</Text>
              <View style={[styles.modalInput, styles.dropdownDisabled]}>
                <Text style={styles.dropdownMuted}>{dash}</Text>
                <CalendarIcon />
              </View>
              <Text style={styles.modalLabel}>{t('staffAccess.access.reminder')}</Text>
              <View style={[styles.modalInput, styles.dropdownDisabled]}>
                <Text style={styles.dropdownMuted}>{dash}</Text>
                <ChevronDownIcon size={12} color={adminColors.muted} />
              </View>
              <Text style={styles.modalLabel}>{t('staffAccess.access.expiryTime')}</Text>
              <View style={[styles.modalInput, styles.dropdownDisabled]}>
                <View style={styles.inline}>
                  <ClockIcon />
                  <Text style={styles.dropdownMuted}>{dash}</Text>
                </View>
                <ChevronDownIcon size={12} color={adminColors.muted} />
              </View>
              <Text style={styles.modalLabel}>{t('staffAccess.access.reason')}</Text>
              <TextInput
                style={[styles.textArea, styles.dropdownDisabled]}
                editable={false}
                value=""
                placeholder={dash}
                placeholderTextColor={adminColors.placeholder}
                multiline
              />
              <Text style={styles.charCount}>{dash}</Text>
            </View>
            <View style={styles.bottomRow}>
              <WalletButton flex label={t('staff.common.cancel')} variant="neutral" onPress={() => setAccessRow(null)} />
              <WalletButton flex label={t('staff.common.apply')} disabled onPress={() => setAccessRow(null)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Permissions menu: the role's grants in the tapped module */}
      <Modal visible={permRow !== null} transparent animationType="fade" onRequestClose={() => setPermRow(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPermRow(null)}>
          <View style={styles.menu}>
            <ScrollView>
              {(permRow?.grants ?? []).map((grant, i, all) => (
                <View key={grant.code} style={[styles.menuItem, i < all.length - 1 && styles.menuDivider]}>
                  <Text style={styles.menuText}>{grant.description}</Text>
                  <Text style={styles.menuMeta}>
                    {t('staffAccess.assign.grantMeta', { code: grant.code, scope: t(SCOPE_LABEL[grant.scope]) })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Role picker */}
      <Modal visible={showRolePicker} transparent animationType="fade" onRequestClose={() => setShowRolePicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowRolePicker(false)}>
          <View style={styles.menu}>
            {list.roles.map((role, i, all) => (
              <TouchableOpacity
                key={role.code}
                style={[styles.menuItem, i < all.length - 1 && styles.menuDivider, role.code === roleCode && styles.menuItemActive]}
                onPress={() => {
                  setRoleCode(role.code);
                  setShowRolePicker(false);
                }}
                accessibilityRole="button"
              >
                <Text style={[styles.menuText, role.code === roleCode && styles.menuTextActive]}>{role.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </WalletScreen>
  );
}

const DROPDOWN_HEIGHT = 44;
const MODAL_INPUT_HEIGHT = 38;
const TEXT_AREA_HEIGHT = 52;
const COL_NUM = 22;
const COL_PERM = 78;
const COL_ACCESS = 52;
const COL_EXPIRY = 80;
const MODULE_ICON_BOX = 26;
const CHECKBOX = 16;
const RADIO = 14;
const CALENDAR_CIRCLE = 48;
const MENU_WIDTH = 260;

const styles = StyleSheet.create({
  scrollPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.section },
  fieldLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xsSm, marginTop: adminSpacing.xsSm },
  asterisk: { color: adminColors.danger.text },
  dropdown: {
    height: DROPDOWN_HEIGHT,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.smMd,
  },
  dropdownDisabled: { backgroundColor: adminColors.canvas },
  dropdownText: { ...adminType.body, color: adminColors.ink, flex: 1 },
  dropdownMuted: { ...adminType.body, color: adminColors.muted },
  twoColRow: { flexDirection: 'row', gap: adminSpacing.lg, marginBottom: adminSpacing.sm },
  col: { flex: 1 },
  moduleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.mdLg,
    marginTop: adminSpacing.xsSm,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  moduleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xsSm, flex: 1 },
  moduleSectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  moduleCount: { ...adminType.rowMeta, color: adminColors.muted },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  selectAllLabel: { ...adminType.rowMeta, color: adminColors.muted },
  checkbox: {
    width: CHECKBOX,
    height: CHECKBOX,
    borderRadius: adminRadius.xs / 2,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  selectAllText: { ...adminType.caption, color: adminColors.ink },
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: adminSpacing.smMd,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  thText: { ...adminType.caption, color: adminColors.brandDeep },
  center: { textAlign: 'center' },
  centerItems: { alignItems: 'center', justifyContent: 'center' },
  colNum: { width: COL_NUM },
  colModule: { flex: 1 },
  colPerm: { width: COL_PERM },
  colAccess: { width: COL_ACCESS },
  colExpiry: { width: COL_EXPIRY },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: adminSpacing.smMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  numText: { ...adminType.rowTitle, color: adminColors.ink },
  moduleInfo: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginRight: adminSpacing.xs },
  moduleIconBox: { width: MODULE_ICON_BOX, height: MODULE_ICON_BOX, alignItems: 'center', justifyContent: 'center' },
  moduleName: { flex: 1, ...adminType.rowTitle, color: adminColors.ink },
  permDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    width: '100%',
    backgroundColor: adminColors.card,
  },
  permText: { ...adminType.rowMeta, color: adminColors.ink, flexShrink: 1 },
  dashText: { ...adminType.rowTitle, color: adminColors.muted },
  bottomRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.sm, marginBottom: adminSpacing.md },
  overlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.input,
  },
  accessCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.input,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  closeBtn: { position: 'absolute', top: adminSpacing.lg, right: adminSpacing.lg, padding: adminSpacing.xs, zIndex: 1 },
  calendarCircle: {
    width: CALENDAR_CIRCLE,
    height: CALENDAR_CIRCLE,
    borderRadius: CALENDAR_CIRCLE / 2,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.smMd,
  },
  accessTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center', marginBottom: adminSpacing.xs },
  accessSub: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', marginBottom: adminSpacing.lg },
  radioRow: { flexDirection: 'row', gap: adminSpacing.smMd, width: '100%', marginBottom: adminSpacing.mdLg },
  radioPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xsSm,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.smMd,
    paddingHorizontal: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
  },
  radioOuter: { width: RADIO, height: RADIO, borderRadius: RADIO / 2, borderWidth: 1.5, borderColor: adminColors.muted },
  radioText: { ...adminType.rowMeta, color: adminColors.muted },
  formCard: {
    width: '100%',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  modalLabel: { ...adminType.rowTitle, color: adminColors.muted, marginTop: adminSpacing.xsSm, marginBottom: adminSpacing.xs },
  modalInput: {
    height: MODAL_INPUT_HEIGHT,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.smMd,
    marginBottom: adminSpacing.xs,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xsSm },
  textArea: {
    height: TEXT_AREA_HEIGHT,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.smMd,
    paddingVertical: adminSpacing.xsSm,
    textAlignVertical: 'top',
    ...adminType.body,
    color: adminColors.ink,
  },
  charCount: { ...adminType.caption, color: adminColors.muted, textAlign: 'right', marginTop: adminSpacing.xs },
  menu: {
    width: MENU_WIDTH,
    maxHeight: '70%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    ...adminShadow.lg,
  },
  menuItem: { paddingVertical: adminSpacing.smMd, paddingHorizontal: adminSpacing.mdLg },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: adminColors.border },
  menuItemActive: { backgroundColor: adminColors.brandTint },
  menuText: { ...adminType.body, color: adminColors.ink },
  menuTextActive: { color: adminColors.brand },
  menuMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
});
