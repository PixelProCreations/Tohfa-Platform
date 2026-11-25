/**
 * Roles: every system role with its summary, live from GET /roles
 * (role.definition.view: SA/TOHFA all; FARMER_ADMIN, MAIN, SUB view).
 *
 * The KPI count, the role cards and the "N Roles" header come from the server
 * (the roles table, synced from docs/rbac.json). A role with no summary shows
 * the module's dash. "View" opens Assign Access on that role.
 */
// Design id: SA-M14 Roles
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { RoleDefinitionDto } from '../../../api/roles';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { WalletScreen } from '../wallet-cashtopup/WalletParts';
import { canViewRoles, filterRoles, roleIconKind, type RoleIconKind } from './accessMappers';
import { STAFF_NONE_KEY } from './mappers';
import { ChevronRightIcon, FilterSlidersIcon } from './StaffParts';
import type { WarehouseScreenBaseProps } from './types';
import { useRoleDefinitions } from './useStaffData';

export interface RolesScreenProps extends WarehouseScreenBaseProps {
  onSelectRole?: ((roleCode: string, roleName: string) => void) | undefined;
}

const ICON = 24;
const STROKE = adminColors.brand;

function RoleIcon({ kind }: { kind: RoleIconKind }) {
  switch (kind) {
    case 'crown':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="4.5" cy="8.5" r="1.5" stroke={STROKE} strokeWidth="1.8" />
          <Circle cx="12" cy="6" r="1.5" stroke={STROKE} strokeWidth="1.8" />
          <Circle cx="19.5" cy="8.5" r="1.5" stroke={STROKE} strokeWidth="1.8" />
          <Path d="M5 10l3.5 5 3.5-7 3.5 7 3.5-5v8H5V10z" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="4" y1="20" x2="20" y2="20" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'bank':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M12 3L3 7.5h18L12 3z" stroke={STROKE} strokeWidth="1.8" strokeLinejoin="round" />
          <Line x1="3" y1="9" x2="21" y2="9" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="6" y1="10.5" x2="6" y2="17" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="10" y1="10.5" x2="10" y2="17" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="14" y1="10.5" x2="14" y2="17" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="18" y1="10.5" x2="18" y2="17" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="3" y1="18" x2="21" y2="18" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="2" y1="20.5" x2="22" y2="20.5" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'shield':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M12 21s7-3.5 7-9V5.5l-7-2.5-7 2.5V12c0 5.5 7 9 7 9z" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy="10" r="2" stroke={STROKE} strokeWidth="1.5" />
          <Path d="M9 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke={STROKE} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case 'mainWarehouse':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M3 20V9l9-5 9 5v11H3z" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="7" y="11" width="10" height="9" stroke={STROKE} strokeWidth="1.6" />
          <Line x1="7" y1="14" x2="17" y2="14" stroke={STROKE} strokeWidth="1.4" />
          <Line x1="7" y1="17" x2="17" y2="17" stroke={STROKE} strokeWidth="1.4" />
        </Svg>
      );
    case 'subWarehouse':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M4 20V10l8-4 8 4v10H4z" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="8" y="12" width="8" height="8" stroke={STROKE} strokeWidth="1.6" />
          <Line x1="8" y1="15" x2="16" y2="15" stroke={STROKE} strokeWidth="1.4" />
          <Line x1="8" y1="17.5" x2="16" y2="17.5" stroke={STROKE} strokeWidth="1.4" />
        </Svg>
      );
    case 'farmer':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Path d="M9 8.5a3 3 0 016 0" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M4 11c2.5-1 13.5-1 16 0" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M8 12v1.5a4 4 0 008 0V12" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" />
          <Path d="M5 20v-1a5 5 0 0110 0v1" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
          <Line x1="10" y1="16" x2="10" y2="20" stroke={STROKE} strokeWidth="1.4" />
          <Line x1="14" y1="16" x2="14" y2="20" stroke={STROKE} strokeWidth="1.4" />
        </Svg>
      );
    case 'customer':
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="9" cy="20" r="1.5" fill={STROKE} />
          <Circle cx="18" cy="20" r="1.5" fill={STROKE} />
          <Path d="M2 3h3.5l2.6 11a2 2 0 002 1.5h9.8a2 2 0 002-1.5L23 6H6" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="9" y1="9" x2="20" y2="9" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
          <Line x1="10.5" y1="12" x2="18.5" y2="12" stroke={STROKE} strokeWidth="1.2" strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="8" r="4" stroke={STROKE} strokeWidth="1.8" />
          <Path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke={STROKE} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
  }
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={adminColors.muted} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={adminColors.brand} />
      <Path d="M12 8v1M12 12v4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function RolesScreen({ can, onBack, onSelectRole }: RolesScreenProps) {
  const allowed = canViewRoles(can);
  const [searchQuery, setSearchQuery] = useState('');
  const list = useRoleDefinitions(allowed);
  const filtered = useMemo(() => filterRoles(list.roles, searchQuery), [list.roles, searchQuery]);
  const loaded = !list.isLoading && !list.error;

  if (!allowed) {
    return (
      <WalletScreen title={t('staffAccess.roles.title')} onBack={onBack}>
        <AdminEmptyState title={t('staff.denied.title')} subtitle={t('staffAccess.denied.roles')} />
      </WalletScreen>
    );
  }

  const renderRole = ({ item }: { item: RoleDefinitionDto }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleIconBox}>
        <RoleIcon kind={roleIconKind(item.code)} />
      </View>
      <View style={styles.roleInfo}>
        <Text style={styles.roleName}>{item.name}</Text>
        <Text style={styles.roleDesc}>{item.summary ?? t(STAFF_NONE_KEY)}</Text>
      </View>
      <TouchableOpacity
        style={styles.viewBtn}
        onPress={() => onSelectRole?.(item.code, item.name)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('staffAccess.roles.viewA11y', { name: item.name })}
      >
        <Text style={styles.viewBtnText}>{t('staffAccess.roles.view')}</Text>
        <ChevronRightIcon size={14} color={adminColors.brand} />
      </TouchableOpacity>
    </View>
  );

  return (
    <WalletScreen title={t('staffAccess.roles.title')} onBack={onBack}>
      <FlatList
        data={loaded ? filtered : []}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{loaded ? String(list.roles.length) : t(STAFF_NONE_KEY)}</Text>
                <Text style={styles.kpiLabel}>{t('staffAccess.roles.kpiRoles')}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValueText}>{t('staffAccess.roles.kpiAccessValue')}</Text>
                <Text style={styles.kpiLabel}>{t('staffAccess.roles.kpiAccess')}</Text>
              </View>
            </View>

            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('staffAccess.roles.searchPlaceholder')}
                placeholderTextColor={adminColors.placeholder}
                accessibilityLabel={t('staffAccess.roles.searchPlaceholder')}
              />
              <FilterSlidersIcon size={16} color={adminColors.brand} />
            </View>

            <Text style={styles.sectionHeader}>
              {t('staffAccess.roles.count', { count: loaded ? String(filtered.length) : t(STAFF_NONE_KEY) })}
            </Text>
            {list.isLoading ? <AdminLoadingState /> : null}
            {list.error ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
          </>
        }
        renderItem={renderRole}
        ListFooterComponent={
          <View style={styles.footerNoteBox}>
            <InfoCircleIcon />
            <Text style={styles.footerNoteText}>{t('staffAccess.roles.footerNote')}</Text>
          </View>
        }
      />
    </WalletScreen>
  );
}

const ROLE_ICON_BOX = 44;
const SEARCH_HEIGHT = 48;

const styles = StyleSheet.create({
  listPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.section },
  kpiRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.lg },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink, marginBottom: adminSpacing.xs },
  kpiValueText: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.xs },
  kpiLabel: { ...adminType.rowMeta, color: adminColors.muted },
  searchBar: {
    height: SEARCH_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.mdLg,
    gap: adminSpacing.smMd,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink },
  sectionHeader: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  roleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.mdLg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  roleIconBox: {
    width: ROLE_ICON_BOX,
    height: ROLE_ICON_BOX,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  roleInfo: { flex: 1, marginRight: adminSpacing.sm },
  roleName: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.xs },
  roleDesc: { ...adminType.rowMeta, color: adminColors.muted },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.smMd,
    paddingVertical: adminSpacing.xsSm,
    borderRadius: adminRadius.sm,
  },
  viewBtnText: { ...adminType.caption, color: adminColors.brand },
  footerNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  footerNoteText: { flex: 1, ...adminType.rowMeta, color: adminColors.ink },
});
