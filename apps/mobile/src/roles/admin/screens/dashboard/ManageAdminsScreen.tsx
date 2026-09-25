import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  ADMIN_PALETTE,
  AdminAccountData,
  AdminBackChevronIcon,
  AdminRoleType,
} from './CreateAdminAccountScreen';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function SearchIcon({ color = ADMIN_PALETTE.textSecondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreDotsIcon({ color = ADMIN_PALETTE.textSecondary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

// ─── Mock Admin Directory Data ────────────────────────────────────────────────
const MOCK_ADMIN_ACCOUNTS: AdminAccountData[] = [
  {
    id: 'adm-001',
    fullName: 'Rajesh Kumar',
    mobile: '9876543210',
    role: 'SA',
    warehouse: 'Apex Super Admin HQ',
    status: 'ACTIVE',
  },
  {
    id: 'adm-002',
    fullName: 'Anitha Raghavan',
    mobile: '9442188900',
    role: 'TA',
    warehouse: 'Ooty Central Exchange',
    status: 'ACTIVE',
  },
  {
    id: 'adm-003',
    fullName: 'Suresh Mani',
    mobile: '9789123456',
    role: 'TA',
    warehouse: 'Nilgiris Regional Ops',
    status: 'ACTIVE',
  },
  {
    id: 'adm-004',
    fullName: 'Prakash Velu',
    mobile: '9843055122',
    role: 'SW',
    warehouse: 'Coonoor Sub-Warehouse (SW)',
    status: 'ACTIVE',
  },
  {
    id: 'adm-005',
    fullName: 'Deepa Krishnan',
    mobile: '9487611299',
    role: 'SW',
    warehouse: 'Kotagiri Sub-Warehouse (SW)',
    status: 'PENDING',
  },
  {
    id: 'adm-006',
    fullName: 'Karthik N',
    mobile: '9944088711',
    role: 'SW',
    warehouse: 'Gudalur Sub-Warehouse (SW)',
    status: 'ACTIVE',
  },
  {
    id: 'adm-007',
    fullName: 'Venkatesh Rao',
    mobile: '9443377221',
    role: 'FA',
    warehouse: 'Ketti Valley Field Depot (SW)',
    status: 'ACTIVE',
  },
  {
    id: 'adm-008',
    fullName: 'Ramesh Sundaram',
    mobile: '9842233445',
    role: 'SW',
    warehouse: 'Wellington Sub-Hub (SW)',
    status: 'DISABLED',
  },
];

export interface ManageAdminsScreenProps {
  onBack?: (() => void) | undefined;
  onCreateNew?: (() => void) | undefined;
  onEditAdmin?: ((admin: AdminAccountData) => void) | undefined;
  onViewAdminDetail?: ((admin: AdminAccountData) => void) | undefined;
  onViewPermissionsMatrix?: (() => void) | undefined;
  onViewActivityLogs?: (() => void) | undefined;
  onViewRequests?: (() => void) | undefined;
}

export function ManageAdminsScreen({
  onBack,
  onCreateNew,
  onEditAdmin,
  onViewAdminDetail,
  onViewPermissionsMatrix,
  onViewActivityLogs,
  onViewRequests,
}: ManageAdminsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | AdminRoleType>('ALL');
  const [adminList, setAdminList] = useState<AdminAccountData[]>(MOCK_ADMIN_ACCOUNTS);

  const filters: { key: 'ALL' | AdminRoleType; label: string }[] = [
    { key: 'ALL', label: `All (${adminList.length})` },
    { key: 'SA', label: 'Super Admin' },
    { key: 'TA', label: 'Tohfa Admin' },
    { key: 'SW', label: 'Sub Warehouse' },
    { key: 'FA', label: 'Field / Finance' },
  ];

  const filteredAdmins = adminList.filter((item) => {
    const matchesFilter = selectedFilter === 'ALL' || item.role === selectedFilter;
    const matchesQuery =
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobile.includes(searchQuery) ||
      (item.warehouse && item.warehouse.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const getRoleBadgeStyle = (role: AdminRoleType) => {
    switch (role) {
      case 'SA':
        return { bg: '#FDEEE9', text: '#943818', label: 'Super Admin' };
      case 'TA':
        return { bg: '#FFF1EB', text: '#F0562A', label: 'TOHFA Admin' };
      case 'SW':
        return { bg: '#FEF3C7', text: '#B45309', label: 'Sub Warehouse' };
      case 'FA':
        return { bg: '#EBF3FA', text: '#1D6399', label: 'Field Admin' };
      case 'MW':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Main Warehouse' };
    }
  };

  const handleAdminAction = (admin: AdminAccountData) => {
    Alert.alert(
      admin.fullName,
      `Role: ${admin.role} · ${admin.warehouse ?? 'No Warehouse'}\nStatus: ${admin.status}`,
      [
        {
          text: 'View Profile',
          onPress: () => onViewAdminDetail?.(admin),
        },
        {
          text: 'Edit Account',
          onPress: () => onEditAdmin?.(admin),
        },
        {
          text: 'Reset Password',
          onPress: () => {
            const tempPass = 'Tohfa@' + Math.floor(1000 + Math.random() * 9000);
            Alert.alert(
              'Temporary Password Generated',
              `New temporary password for ${admin.fullName}:\n\n${tempPass}\n\nSMS notification dispatched to +91 ${admin.mobile}.`
            );
          },
        },
        {
          text: admin.status === 'DISABLED' ? 'Reactivate Account' : 'Deactivate Account',
          style: admin.status === 'DISABLED' ? 'default' : 'destructive',
          onPress: () => {
            const nextStatus = admin.status === 'DISABLED' ? 'ACTIVE' : 'DISABLED';
            setAdminList((prev) =>
              prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a))
            );
            Alert.alert('Status Updated', `${admin.fullName}'s account is now ${nextStatus}.`);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ADMIN_PALETTE.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AdminBackChevronIcon />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={onCreateNew}
          activeOpacity={0.85}
        >
          <PlusIcon />
          <Text style={styles.createBtnText}>Create Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Title Block */}
      <View style={styles.titleBlock}>
        <Text style={styles.screenTitle}>Manage Admin Accounts</Text>
        <Text style={styles.screenSubtitle}>
          Directory of all platform administrators, regional warehouse staff & field agents
        </Text>
      </View>

      {/* Quick Governance Links */}
      <View style={styles.govRow}>
        {onViewPermissionsMatrix && (
          <TouchableOpacity
            style={styles.govCard}
            onPress={onViewPermissionsMatrix}
            activeOpacity={0.75}
          >
            <Text style={styles.govCardTitle}>Role Permissions</Text>
            <Text style={styles.govCardSub}>Compare matrix →</Text>
          </TouchableOpacity>
        )}

        {onViewActivityLogs && (
          <TouchableOpacity
            style={styles.govCard}
            onPress={onViewActivityLogs}
            activeOpacity={0.75}
          >
            <Text style={styles.govCardTitle}>Security Logs</Text>
            <Text style={styles.govCardSub}>Audit trail →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Requests Banner (if applicable) */}
      {onViewRequests && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={onViewRequests}
          activeOpacity={0.8}
        >
          <View style={styles.requestsBadge}>
            <Text style={styles.requestsBadgeText}>2</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.requestsTitle}>Pending Admin Account Requests</Text>
            <Text style={styles.requestsSubtitle}>2 Sub Warehouse Admin creations awaiting review</Text>
          </View>
          <Text style={styles.requestsArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by admin name, phone, or warehouse..."
          placeholderTextColor={ADMIN_PALETTE.textMuted}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filtersList}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => setSelectedFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Admin List */}
      <FlatList
        data={filteredAdmins}
        keyExtractor={(item) => item.id ?? item.mobile}
        contentContainerStyle={styles.adminListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const roleMeta = getRoleBadgeStyle(item.role);

          return (
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => onViewAdminDetail?.(item)}
              activeOpacity={0.8}
            >
              <View style={styles.adminCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.adminName}>{item.fullName}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleMeta.bg }]}>
                      <Text style={[styles.roleBadgeText, { color: roleMeta.text }]}>
                        {item.role} · {roleMeta.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.adminWarehouse}>
                    {item.warehouse ?? 'No Warehouse Assigned'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => handleAdminAction(item)}
                  activeOpacity={0.6}
                >
                  <MoreDotsIcon />
                </TouchableOpacity>
              </View>

              <View style={styles.adminCardFooter}>
                <Text style={styles.adminPhone}>+91 {item.mobile}</Text>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'ACTIVE'
                        ? styles.statusActive
                        : item.status === 'PENDING'
                        ? styles.statusPending
                        : styles.statusDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'ACTIVE'
                          ? styles.statusTextActive
                          : item.status === 'PENDING'
                          ? styles.statusTextPending
                          : styles.statusTextDisabled,
                      ]}
                    >
                      {item.status === 'ACTIVE'
                        ? 'Active'
                        : item.status === 'PENDING'
                        ? 'Pending Setup'
                        : 'Suspended'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editCardBtn}
                    onPress={() => onViewAdminDetail?.(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editCardBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Administrators Found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search query or role filter.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.pageBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: ADMIN_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Title Block
  titleBlock: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: ADMIN_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: ADMIN_PALETTE.textSecondary,
    lineHeight: 18,
  },

  // Quick Governance
  govRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  govCard: {
    flex: 1,
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  govCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 2,
  },
  govCardSub: {
    fontSize: 11,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
  },

  // Requests Banner
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PALETTE.primaryOrangeLight,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.primaryOrangeBorder,
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 14,
  },
  requestsBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  requestsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_PALETTE.textHeading,
    marginBottom: 2,
  },
  requestsSubtitle: {
    fontSize: 11.5,
    color: ADMIN_PALETTE.textSecondary,
  },
  requestsArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: ADMIN_PALETTE.primaryOrange,
    marginLeft: 6,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: ADMIN_PALETTE.textPrimary,
    marginLeft: 8,
    paddingVertical: 0,
  },

  // Filters
  filtersWrapper: {
    marginBottom: 12,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  filterPillActive: {
    backgroundColor: ADMIN_PALETTE.primaryOrange,
    borderColor: ADMIN_PALETTE.primaryOrange,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Admin List
  adminListContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
  },
  adminCard: {
    backgroundColor: ADMIN_PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  adminName: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  adminWarehouse: {
    fontSize: 12,
    color: ADMIN_PALETTE.textSecondary,
  },
  moreBtn: {
    padding: 4,
  },
  adminCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ADMIN_PALETTE.pageBg,
  },
  adminPhone: {
    fontSize: 12.5,
    fontWeight: '600',
    color: ADMIN_PALETTE.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: ADMIN_PALETTE.successBg,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusDisabled: {
    backgroundColor: ADMIN_PALETTE.dangerBg,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusTextActive: {
    color: ADMIN_PALETTE.successText,
  },
  statusTextPending: {
    color: '#B45309',
  },
  statusTextDisabled: {
    color: ADMIN_PALETTE.dangerText,
  },
  editCardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: ADMIN_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: ADMIN_PALETTE.borderSoft,
  },
  editCardBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_PALETTE.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: ADMIN_PALETTE.textSecondary,
    textAlign: 'center',
  },
});
