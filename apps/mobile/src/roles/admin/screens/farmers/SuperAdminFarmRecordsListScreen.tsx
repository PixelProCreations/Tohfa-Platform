import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  ChevronRightIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import { t } from '../../i18n';
import { DEMO_ALL_FARMERS, type FarmerListItem } from './AdminAllFarmersScreen';

export interface FarmRecordFarmerEntry {
  id: string;
  initials: string;
  farmTitle: string;
  farmer: FarmerListItem;
}

const FARM_RECORD_ENTRIES: FarmRecordFarmerEntry[] = [
  {
    id: 'fr-1',
    initials: 'RK',
    farmTitle: 'Ramesh Kumar Farm',
    farmer: {
      ...(DEMO_ALL_FARMERS[0] ?? { name: 'Ramesh Kumar' }),
      id: 'fmr-00124',
      name: 'Ramesh Kumar',
      farmName: 'Ramesh Kumar Farm',
      code: 'FMR-00124',
      initials: 'RK',
      mobile: '+91 90000 20000',
      phone: '+91 90000 20000',
      location: 'Coonoor',
      status: 'ACTIVE',
    },
  },
  {
    id: 'fr-2',
    initials: 'K',
    farmTitle: 'Kumar Farming',
    farmer: {
      ...(DEMO_ALL_FARMERS[1] ?? { name: 'Kumar' }),
      id: 'fmr-00125',
      name: 'Kumar',
      farmName: 'Kumar Farming',
      code: 'FMR-00125',
      initials: 'K',
      mobile: '+91 90000 20001',
      phone: '+91 90000 20001',
      location: 'Ooty',
      status: 'ACTIVE',
    },
  },
  {
    id: 'fr-3',
    initials: 'J',
    farmTitle: 'John Farm house',
    farmer: {
      ...(DEMO_ALL_FARMERS[2] ?? { name: 'John' }),
      id: 'fmr-00126',
      name: 'John',
      farmName: 'John Farm house',
      code: 'FMR-00126',
      initials: 'J',
      mobile: '+91 90000 20002',
      phone: '+91 90000 20002',
      location: 'Kotagiri',
      status: 'ACTIVE',
    },
  },
  {
    id: 'fr-4',
    initials: 'R',
    farmTitle: 'Rani Farm village',
    farmer: {
      ...(DEMO_ALL_FARMERS[3] ?? { name: 'Rani' }),
      id: 'fmr-00127',
      name: 'Rani',
      farmName: 'Rani Farm village',
      code: 'FMR-00127',
      initials: 'R',
      mobile: '+91 90000 20003',
      phone: '+91 90000 20003',
      location: 'Coonoor',
      status: 'ACTIVE',
    },
  },
];

const ZONE_FILTERS = ['All', 'Coonoor', 'Ooty', 'Kotagiri'] as const;

export interface SuperAdminFarmRecordsListScreenProps {
  onBack: () => void;
  onSelectRecord: (farmer: FarmerListItem) => void;
  onAddRecord?: (() => void) | undefined;
}

export function SuperAdminFarmRecordsListScreen({
  onBack,
  onSelectRecord,
  onAddRecord,
}: SuperAdminFarmRecordsListScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<(typeof ZONE_FILTERS)[number]>('All');
  const [filterOpen, setFilterOpen] = useState(false);

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FARM_RECORD_ENTRIES.filter((entry) => {
      if (
        selectedZone !== 'All' &&
        (entry.farmer.location ?? '').toLowerCase() !== selectedZone.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      const code = (entry.farmer.code ?? '').toLowerCase();
      const phone = (entry.farmer.mobile ?? entry.farmer.phone ?? '').toLowerCase();
      const loc = (entry.farmer.location ?? '').toLowerCase();
      return (
        entry.farmTitle.toLowerCase().includes(q) ||
        entry.farmer.name.toLowerCase().includes(q) ||
        code.includes(q) ||
        phone.includes(q) ||
        loc.includes(q)
      );
    });
  }, [searchQuery, selectedZone]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('superAdmin.farmRecords.title')}
        </Text>
        {onAddRecord ? (
          <TouchableOpacity
            style={styles.headerPlusBtn}
            onPress={onAddRecord}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Add farm record"
          >
            <PlusIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchBarRow}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterIconBtn}
            onPress={() => setFilterOpen(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Filter farm records"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.resultsCount}>
          {visibleEntries.length} {visibleEntries.length === 1 ? 'record' : 'records'}
          {selectedZone !== 'All' ? ` · ${selectedZone}` : ''}
        </Text>

        <View style={styles.listWrap}>
          {visibleEntries.map((entry) => {
            const code = entry.farmer.code ?? 'FMR-00124';
            const phone = entry.farmer.mobile ?? entry.farmer.phone ?? '+91 90000 20000';
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.recordCard}
                onPress={() => onSelectRecord(entry.farmer)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={entry.farmTitle}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{entry.initials}</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.farmTitle}>{entry.farmTitle}</Text>
                  <Text style={styles.farmMeta}>
                    {code} · {phone}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <AdminStatusBadge status="ACTIVE" label="Active" size="sm" />
                  <ChevronRightIcon size={16} color={adminColors.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setFilterOpen(false)} />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Filter by Zone</Text>
            {ZONE_FILTERS.map((zone) => {
              const active = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.pickerOption, active && styles.pickerOptionActive]}
                  onPress={() => {
                    setSelectedZone(zone);
                    setFilterOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>
                    {zone === 'All' ? 'All Zones' : zone}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    flex: 1,
    color: adminColors.onBrand,
    fontWeight: '700',
    textAlign: 'left',
  },
  headerPlusBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconBtn: {
    padding: adminSpacing.xs,
  },
  resultsCount: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  listWrap: {
    gap: adminSpacing.sm,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  avatarText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  cardInfo: {
    flex: 1,
  },
  farmTitle: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
  farmMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  modalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerSheet: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
    ...adminShadow.lg,
  },
  pickerTitle: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  pickerOption: {
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  pickerOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerOptionTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});
