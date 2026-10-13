import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseBuildingIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-5 9 5v12H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V13h6v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UserActiveIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={adminColors.brandDeep} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={adminColors.brandDeep} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UserUnassignedIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={adminColors.muted} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="4" x2="20" y2="20" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface AdminRecordItem {
  id: string;
  name: string;
  adminId: string;
  warehouse: string;
  status: 'Active' | 'Pending';
  isUnassigned?: boolean;
}

const DEFAULT_ADMINS: AdminRecordItem[] = [
  {
    id: '1',
    name: 'Karthik Kumar',
    adminId: 'SWA-002',
    warehouse: 'Coonoor',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Priya Raman',
    adminId: 'SWA-001',
    warehouse: 'Ooty',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Vijay S',
    adminId: 'SWA-003',
    warehouse: 'Kotagiri',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Unassigned',
    adminId: '',
    warehouse: 'Gudalur Market',
    status: 'Pending',
    isUnassigned: true,
  },
];

export interface MainWarehouseManageSWAsScreenProps {
  onBack: () => void;
  initialView?: 'list' | 'detail' | 'create' | undefined;
  initialAdminId?: string | undefined;
  initialWarehouse?: string | undefined;
}

export function MainWarehouseManageSWAsScreen({
  onBack,
  initialView = 'list',
  initialAdminId,
  initialWarehouse,
}: MainWarehouseManageSWAsScreenProps) {
  const getInitialAdmin = () => {
    if (initialAdminId) {
      const found = DEFAULT_ADMINS.find((item) => item.id === initialAdminId);
      if (found) return found;
    }
    if (initialWarehouse) {
      const found = DEFAULT_ADMINS.find(
        (item) => item.warehouse.toLowerCase() === initialWarehouse.toLowerCase()
      );
      if (found) return found;
    }
    return (
      DEFAULT_ADMINS[0] ?? {
        id: '1',
        name: 'Karthik Kumar',
        adminId: 'SWA-002',
        warehouse: 'Coonoor',
        status: 'Active',
      }
    );
  };

  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'create'>(initialView);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRecordItem>(getInitialAdmin);
  const [searchQuery, setSearchQuery] = useState('');

  // Create wizard state
  const [createStep, setCreateStep] = useState(1);
  const [newAdminName, setNewAdminName] = useState('');
  const [assignedWarehouse, setAssignedWarehouse] = useState('Gudalur Market');

  const filteredAdmins = DEFAULT_ADMINS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.adminId.toLowerCase().includes(q) ||
      item.warehouse.toLowerCase().includes(q)
    );
  });

  const handleAdminRecordPress = (admin: AdminRecordItem) => {
    setSelectedAdmin(admin);
    setCurrentView('detail');
  };

  // 1. DETAIL SCREEN
  if (currentView === 'detail') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => {
                if (initialView === 'detail') {
                  onBack();
                } else {
                  setCurrentView('list');
                }
              }}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sub Warehouse Admin</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailProfileCard}>
            <View style={styles.detailAvatarWrap}>
              <UserActiveIcon />
            </View>
            <Text style={styles.detailName}>{selectedAdmin.name}</Text>
            <Text style={styles.detailSub}>
              {selectedAdmin.isUnassigned
                ? `${selectedAdmin.warehouse} · No SWA`
                : `Admin ID: ${selectedAdmin.adminId} · ${selectedAdmin.status}`}
            </Text>
          </View>
          
          <Text style={styles.sectionTitle}>Warehouse Assignment</Text>
          <View style={styles.cardFull}>
            <Text style={styles.cardLabel}>Assigned Warehouse</Text>
            <Text style={styles.cardValue}>{selectedAdmin.warehouse} Warehouse</Text>
          </View>

          <Text style={styles.sectionTitle}>Responsibility Summary</Text>
          <View style={[styles.cardFull, { paddingVertical: adminSpacing.md }]}>
            <View style={styles.pillRow}>
              {['Goods Receiving', 'Inventory', 'Orders', 'Sales', 'Finance'].map((r) => (
                <View key={r} style={styles.responsibilityPill}>
                  <Text style={styles.responsibilityPillText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2. CREATE WIZARD
  if (currentView === 'create') {
    if (createStep === 1) {
      return (
        <View style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setCurrentView('list')} style={styles.backBtn}>
                <ArrowBackIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Sub Warehouse Admin</Text>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Admin Information</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={adminColors.placeholder}
              value={newAdminName}
              onChangeText={setNewAdminName}
            />
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setCreateStep(2)}>
              <Text style={styles.primaryBtnText}>Next: Warehouse Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentView('list')}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (createStep === 2) {
      return (
        <View style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setCreateStep(1)} style={styles.backBtn}>
                <ArrowBackIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Warehouse Assignment</Text>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Warehouse Assignment</Text>
            <View style={styles.pillRow}>
              {['Gudalur Market', 'Kotagiri', 'Coonoor'].map((loc) => (
                <TouchableOpacity 
                  key={loc} 
                  style={[styles.pill, assignedWarehouse === loc && styles.pillActive]}
                  onPress={() => setAssignedWarehouse(loc)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, assignedWarehouse === loc && styles.pillTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setCreateStep(3)}>
              <Text style={styles.primaryBtnText}>Next: Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCreateStep(1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (createStep === 3) {
      return (
        <View style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setCreateStep(2)} style={styles.backBtn}>
                <ArrowBackIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Review</Text>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionTitle}>Review</Text>
            <View style={styles.cardFull}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Name</Text>
                  <Text style={styles.cardValue}>{newAdminName || 'New Admin'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.cardLabel}>Assigned Warehouse</Text>
                  <Text style={styles.cardValue}>{assignedWarehouse}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setCurrentView('list')}>
              <Text style={styles.primaryBtnText}>Create Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCreateStep(2)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  }

  // 3. MAIN LIST SCREEN
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sub Warehouse Admins</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.warehouseDropdown} activeOpacity={0.8}>
          <WarehouseBuildingIcon />
          <Text style={styles.warehouseDropdownText}>All Warehouses</Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        <View style={styles.grid}>
          <View style={styles.cardHalf}>
            <Text style={styles.cardLabel}>TOTAL SWAS</Text>
            <Text style={styles.cardValue}>3</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.cardLabel}>ACTIVE</Text>
            <Text style={styles.cardValue}>3</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.cardLabel}>PENDING ASSIGNMENT</Text>
            <Text style={[styles.cardValue, styles.cardValueWarning]}>1</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.cardLabel}>ATTENTION REQUIRED</Text>
            <Text style={[styles.cardValue, styles.cardValueDanger]}>1</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search admin name, admin ID, warehouse"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredAdmins.map((admin) => (
          <TouchableOpacity
            key={admin.id}
            style={styles.listItem}
            onPress={() => handleAdminRecordPress(admin)}
            activeOpacity={0.8}
          >
            <View style={admin.isUnassigned ? styles.avatarWrapUnassigned : styles.avatarWrapActive}>
              {admin.isUnassigned ? <UserUnassignedIcon /> : <UserActiveIcon />}
            </View>
            <View style={styles.listItemTextWrap}>
              <Text style={styles.listItemTitle}>{admin.name}</Text>
              <Text style={styles.listItemSub}>
                {admin.isUnassigned
                  ? `${admin.warehouse} · No SWA`
                  : `${admin.adminId} · ${admin.warehouse} · ${admin.status}`}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                admin.status === 'Active' ? styles.badgeActive : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  admin.status === 'Active' ? styles.badgeTextActive : styles.badgeTextPending,
                ]}
              >
                {admin.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: adminSpacing.md, paddingVertical: adminSpacing.xs },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xl },

  warehouseDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    alignSelf: 'flex-start',
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  warehouseDropdownText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  cardHalf: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  cardFull: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  cardLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  cardValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  cardValueWarning: {
    color: adminColors.warning.text,
  },
  cardValueDanger: {
    color: adminColors.danger.text,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
  },

  listItem: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapActive: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  avatarWrapUnassigned: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  listItemTextWrap: { flex: 1 },
  listItemTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs / 2 },
  listItemSub: { ...adminType.rowMeta, color: adminColors.muted },

  badge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs / 2,
    borderRadius: adminRadius.full,
  },
  badgeActive: { backgroundColor: adminColors.success.bg },
  badgePending: { backgroundColor: adminColors.warning.bg },
  badgeText: { ...adminType.caption },
  badgeTextActive: { color: adminColors.success.text },
  badgeTextPending: { color: adminColors.warning.text },

  detailProfileCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xl,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  detailAvatarWrap: {
    width: 56,
    height: 56,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  detailName: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  detailSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  responsibilityPill: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  responsibilityPillText: {
    ...adminType.caption,
    color: adminColors.ink,
  },

  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  inputLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  input: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: adminSpacing.xl,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  pill: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  pillText: { ...adminType.rowMeta, color: adminColors.ink },
  pillTextActive: { ...adminType.caption, color: adminColors.onBrand },
  row: { flexDirection: 'row' },
  col: { flex: 1 },

  footer: {
    padding: adminSpacing.lg,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  secondaryBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  secondaryBtnText: { ...adminType.rowTitle, color: adminColors.muted },
});
