import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';
import { MainWarehouseDetailScreen } from './MainWarehouseDetailScreen';

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 4v4M8 10v4M15 16v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export interface WarehouseListItem {
  name: string;
  id: string;
  location: string;
  status: string;
  stock: string;
  capacity: string;
  staff: string;
}

const DEFAULT_WAREHOUSES: WarehouseListItem[] = [
  {
    name: 'Ooty',
    id: 'WH-001',
    location: 'Ooty, Nilgiris',
    status: 'Active',
    stock: '4,820 kg',
    capacity: '68%',
    staff: '12',
  },
  {
    name: 'Coonoor',
    id: 'WH-002',
    location: 'Coonoor, Nilgiris',
    status: 'Active',
    stock: '5,240 kg',
    capacity: '74%',
    staff: '15',
  },
];

export function MainWarehouseListScreen({
  onBack,
  warehouses = DEFAULT_WAREHOUSES,
}: {
  onBack: () => void;
  warehouses?: WarehouseListItem[] | undefined;
}) {
  const [selectedWarehouse, setSelectedWarehouse] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<'All' | 'Active' | 'Inactive'>('All');
  const [tempStatusFilter, setTempStatusFilter] = React.useState<'All' | 'Active' | 'Inactive'>('All');

  if (selectedWarehouse) {
    return <MainWarehouseDetailScreen onBack={() => setSelectedWarehouse(null)} warehouse={selectedWarehouse} />;
  }

  const filtered = warehouses.filter((item) => {
    if (statusFilter !== 'All' && item.status !== statusFilter) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Warehouses</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search warehouse name, ID, location"
            placeholderTextColor={adminColors.placeholder}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity
            onPress={() => {
              setTempStatusFilter(statusFilter);
              setShowFilterModal(true);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.searchFilterBtn}
            accessibilityRole="button"
            accessibilityLabel="Filter Warehouses"
          >
            <FilterSlidersIcon size={18} color={statusFilter !== 'All' ? adminColors.brand : adminColors.muted} />
          </TouchableOpacity>
        </View>

        {statusFilter !== 'All' ? (
          <View style={styles.appliedFilterRow}>
            <Text style={styles.appliedFilterText}>Filter: {statusFilter}</Text>
            <TouchableOpacity onPress={() => setStatusFilter('All')} activeOpacity={0.7}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filtered.map((wh) => (
            <TouchableOpacity
              key={`${wh.id}-${wh.name}`}
              style={styles.card}
              onPress={() => setSelectedWarehouse(wh.name)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>{wh.name} · {wh.id}</Text>
                  <Text style={styles.cardSub}>{wh.location}</Text>
                </View>
                <View style={styles.tagGreen}>
                  <Text style={styles.tagGreenText}>{wh.status}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{wh.stock}</Text>
                  <Text style={styles.statLabel}>Inventory</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{wh.capacity}</Text>
                  <Text style={styles.statLabel}>Capacity</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{wh.staff}</Text>
                  <Text style={styles.statLabel}>Staff</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Warehouses</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.chipRow}>
              {(['All', 'Active', 'Inactive'] as const).map((st) => {
                const active = tempStatusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setTempStatusFilter(st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setTempStatusFilter('All');
                  setStatusFilter('All');
                  setShowFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => {
                  setStatusFilter(tempStatusFilter);
                  setShowFilterModal(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: adminSpacing.md },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  
  mainContainer: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    margin: adminSpacing.lg,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    marginLeft: adminSpacing.sm,
  },
  searchFilterBtn: {
    padding: 6,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    marginHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.sm,
  },
  appliedFilterText: { ...adminType.caption, color: '#92400E', fontWeight: '600' },
  clearFilterText: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: adminSpacing.lg },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs / 2 },
  cardSub: { ...adminType.rowMeta, color: adminColors.muted },
  tagGreen: { backgroundColor: adminColors.success.bg, paddingHorizontal: adminSpacing.sm, paddingVertical: adminSpacing.xs / 2, borderRadius: adminRadius.full },
  tagGreenText: { ...adminType.caption, color: adminColors.success.text },
  
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: adminColors.border, paddingTop: adminSpacing.lg },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs / 2 },
  statLabel: { ...adminType.caption, color: adminColors.muted },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  modalTitle: { ...adminType.title, color: adminColors.ink },
  modalCloseText: { fontSize: 18, color: adminColors.muted, fontWeight: '700' },
  filterSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: { ...adminType.caption, color: adminColors.ink },
  chipTextActive: { ...adminType.caption, color: adminColors.onBrand, fontWeight: '700' },
  modalActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  modalResetBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetText: { ...adminType.sectionHead, color: adminColors.muted },
  modalApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: { ...adminType.sectionHead, color: adminColors.onBrand, fontWeight: '700' },
});
