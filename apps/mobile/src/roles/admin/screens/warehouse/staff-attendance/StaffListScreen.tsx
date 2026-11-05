/**
 * Staff list screen (Image 3 & 4):
 * Shared directory list of all workforce/staff members across warehouses.
 *
 * For Subwarehouse & Main Warehouse: Displays the list without the docked button (Image 3).
 * For Tohfa Admin: Displays the list with inline actions and docked "Create Account" button (Image 4).
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { EmptyState, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { STAFF_MEMBERS, staffWarehouseName } from './fixtures';
import { FilterSlidersIcon, SearchIcon } from './StaffParts';
import { isTohfaAdminUser } from './StaffDetailScreen';
import type { StaffMember, WarehouseScreenBaseProps } from './types';

export interface StaffListScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  members?: readonly StaffMember[] | undefined;
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  onEditStaff?: ((staff: StaffMember) => void) | undefined;
  onCreateAccount?: (() => void) | undefined;
}

export function StaffListScreen({
  scope,
  can,
  role,
  onBack,
  members = STAFF_MEMBERS,
  onSelectStaff,
  onEditStaff,
  onCreateAccount,
}: StaffListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>(() => [...members]);
  const isTohfa = isTohfaAdminUser(can, role);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.staffId.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    });
  }, [staffList, searchQuery]);

  const handleToggleDeactivate = (staff: StaffMember) => {
    const isInactive = staff.status === 'Inactive';
    const nextStatus = isInactive ? 'Active' : 'Inactive';
    Alert.alert(
      isInactive ? 'Activate Staff' : 'Deactivate Staff',
      `Are you sure you want to ${isInactive ? 'activate' : 'deactivate'} ${staff.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isInactive ? 'Activate' : 'Deactivate',
          style: isInactive ? 'default' : 'destructive',
          onPress: () => {
            setStaffList((prev) =>
              prev.map((item) =>
                item.id === staff.id ? { ...item, status: nextStatus as any } : item,
              ),
            );
          },
        },
      ],
    );
  };

  return (
    <WalletScreen
      title="Staff list"
      onBack={onBack}
      footer={
        isTohfa && onCreateAccount ? (
          <View style={styles.dockedFooter}>
            <TouchableOpacity
              style={styles.createAccountBtn}
              onPress={onCreateAccount}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={styles.createAccountBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar matching Image 3 & 4 */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity activeOpacity={0.7}>
              <FilterSlidersIcon size={18} color={adminColors.brand} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subCountText}>11 admin · 14 warehouse staff · 7 drivers</Text>
        </View>

        {filteredStaff.length === 0 ? (
          <EmptyState title="No staff found" subtitle="Try another search keyword." />
        ) : (
          <View style={styles.cardsList}>
            {filteredStaff.map((staff) => {
              const whName = staff.warehouseName ?? (staff.warehouseId ? staffWarehouseName(staff.warehouseId) : 'Main Warehouse, Ooty');
              const isPending = staff.status === 'Pending activation';
              const isActive = staff.status === 'Active';

              return (
                <TouchableOpacity
                  key={staff.id}
                  style={styles.card}
                  onPress={onSelectStaff ? () => onSelectStaff(staff) : undefined}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>{`${staff.staffId} · ${staff.name}`}</Text>
                    <View
                      style={[
                        styles.badge,
                        isActive
                          ? styles.badgeActive
                          : isPending
                          ? styles.badgePending
                          : styles.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isActive
                            ? styles.badgeTextActive
                            : isPending
                            ? styles.badgeTextPending
                            : styles.badgeTextInactive,
                        ]}
                      >
                        {staff.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardSubtitle}>
                    {isPending
                      ? `${staff.role} · ${whName} · ${staff.activationNote ?? 'Created 12 Oct 2026 by TOHFA Admin\nActivation flow proposed, not yet confirmed'}`
                      : `${staff.role} · ${staff.workSection ?? 'Loading & sorting'} · ${whName} · Joined ${staff.joiningDate ?? '1 Mar 2026'}`}
                  </Text>

                  {/* Inline Actions row for Tohfa Admin */}
                  {isTohfa && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        onPress={() => onEditStaff?.(staff)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.actionEdit}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleDeactivate(staff)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text
                          style={
                            staff.status === 'Active'
                              ? styles.actionDeactivate
                              : styles.actionActivate
                          }
                        >
                          {staff.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  searchWrapper: {
    marginBottom: adminSpacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  subCountText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    marginTop: 8,
    marginLeft: 2,
  },
  cardsList: {
    gap: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeActive: {
    backgroundColor: '#E6F4EA',
  },
  badgePending: {
    backgroundColor: '#FEF7E0',
  },
  badgeInactive: {
    backgroundColor: '#FCE8E6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: '#137333',
  },
  badgeTextPending: {
    color: '#B06000',
  },
  badgeTextInactive: {
    color: '#C5221F',
  },
  cardSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    lineHeight: 17,
    color: adminColors.muted,
    marginBottom: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: adminColors.border,
  },
  actionEdit: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  actionDeactivate: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  actionActivate: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  dockedFooter: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  createAccountBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  createAccountBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});

