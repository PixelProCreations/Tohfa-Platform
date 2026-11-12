import React, { useMemo, useState } from 'react';
import {
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
  ChevronDownIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import { type Can } from '../../permissions/can';
import { t } from '../../i18n';
import type { FarmerListItem } from './AdminAllFarmersScreen';
import { AdminAddFarmRecordScreen, type AddRecordTab } from './AdminAddFarmRecordScreen';
import { AdminEditFarmRecordScreen, type EditFarmRecordData } from './AdminEditFarmRecordScreen';
import { FarmRecordsSection } from './FarmRecordsSection';

export interface SuperAdminFarmRecordsScreenProps {
  can?: Can;
  farmer?: FarmerListItem | undefined;
  onBack: () => void;
  onAddDiaryEntry?: () => void;
  onEditDiaryEntry?: (entry: DiaryEntry) => void;
  onSelectFarmer?: (farmer?: FarmerListItem) => void;
}

export type FarmRecordTab = 'Diary' | 'Crops' | 'Livestock' | 'Assets';

export interface DiaryEntry {
  id: string;
  category: string;
  activity: string;
  badgeType: 'on_behalf' | 'farmers_own';
  badgeLabel: string;
  datePlot: string;
  workforce: string;
  addedBy: string;
}

const DEMO_DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'd1',
    category: 'Nutrient',
    activity: 'Compost application',
    badgeType: 'on_behalf',
    badgeLabel: 'Added on behalf',
    datePlot: '26 Oct 2026 · Plot 2 (1.2 acre) · 90 minutes · Linked crop: Tomato',
    workforce: 'Workforce: 2 workers, 4 hrs each · 2 photos',
    addedBy: 'Added by Demo Super Admin on behalf',
  },
  {
    id: 'd2',
    category: 'Weed',
    activity: 'Hand weeding',
    badgeType: 'farmers_own',
    badgeLabel: "Farmer's own",
    datePlot: '24 Oct 2026 · Plot 1 (1.8 acre) · 120 minutes · No linked crop',
    workforce: 'No workforce logged · 0 photos',
    addedBy: 'Added by Ramesh Kumar',
  },
];

export function SuperAdminFarmRecordsScreen({
  can,
  farmer,
  onBack,
  onAddDiaryEntry,
  onEditDiaryEntry,
  onSelectFarmer,
}: SuperAdminFarmRecordsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FarmRecordTab>('Diary');
  const [searchQuery, setSearchQuery] = useState('');
  const [addRecordInitialTab, setAddRecordInitialTab] = useState<AddRecordTab | null>(null);
  const [editingRecordData, setEditingRecordData] = useState<EditFarmRecordData | null>(null);

  const activeFarmerName = farmer?.farmName ?? farmer?.name ?? 'Ramesh Kumar Farm';
  const activeFarmerCode = farmer?.code ?? (farmer as any)?.farmerId ?? 'FMR-00124';
  const activeFarmerPhone = farmer?.mobile ?? (farmer as any)?.phone ?? '+91 90000 20000';

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return DEMO_DIARY_ENTRIES;
    const q = searchQuery.toLowerCase().trim();
    return DEMO_DIARY_ENTRIES.filter(
      (e) =>
        e.category.toLowerCase().includes(q) ||
        e.activity.toLowerCase().includes(q) ||
        e.datePlot.toLowerCase().includes(q) ||
        e.addedBy.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  if (editingRecordData !== null) {
    return (
      <AdminEditFarmRecordScreen
        record={editingRecordData}
        onBack={() => setEditingRecordData(null)}
        onSave={() => setEditingRecordData(null)}
      />
    );
  }

  if (addRecordInitialTab !== null) {
    return (
      <AdminAddFarmRecordScreen
        initialTab={addRecordInitialTab}
        farmerName={activeFarmerName}
        farmerId={activeFarmerCode}
        onBack={() => setAddRecordInitialTab(null)}
        onSave={() => setAddRecordInitialTab(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header matching exact design: left-aligned with back arrow preceding title */}
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
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Farmer Dropdown Box */}
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownLabel}>
            {t('superAdmin.farmRecords.searchFarmer')}
          </Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Text style={styles.dropdownValue}>
              {activeFarmerName} ({activeFarmerCode})
            </Text>
            <ChevronDownIcon size={18} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Farmer Summary Header Card */}
        <TouchableOpacity
          style={styles.farmerSummaryCard}
          onPress={() => onSelectFarmer?.(farmer)}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {activeFarmerName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </Text>
          </View>
          <View style={styles.farmerSummaryInfo}>
            <Text style={styles.farmerSummaryName}>{activeFarmerName}</Text>
            <Text style={styles.farmerSummaryMeta}>
              {activeFarmerCode} · {activeFarmerPhone}
            </Text>
          </View>
          <AdminStatusBadge status="ACTIVE" label="Active" size="sm" />
        </TouchableOpacity>

        {/* Sub-Tabs: Diary, Plant & Crops, Livestock, Assets with Shared Cards */}
        <FarmRecordsSection
          onAddRecord={(tab) => {
            if (onAddDiaryEntry && tab === 'Diary') {
              onAddDiaryEntry();
            } else {
              setAddRecordInitialTab(tab);
            }
          }}
          onEditDiary={(entry) => setEditingRecordData(entry)}
          onEditRecord={(record) => setEditingRecordData(record)}
        />
      </ScrollView>
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
    color: adminColors.onBrand,
    fontWeight: '700',
    textAlign: 'left',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl * 2,
  },
  dropdownSection: {
    marginBottom: adminSpacing.md,
  },
  dropdownLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  dropdownValue: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  farmerSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.sm,
  },
  avatarText: {
    ...adminType.title,
    color: adminColors.brand,
  },
  farmerSummaryInfo: {
    flex: 1,
  },
  farmerSummaryName: {
    ...adminType.title,
    color: adminColors.ink,
  },
  farmerSummaryMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabItemActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabItemText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  tabItemTextActive: {
    color: adminColors.onBrand,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 44,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsCount: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  entryList: {
    gap: adminSpacing.sm,
  },
  entryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: adminSpacing.xs,
  },
  entryTitle: {
    ...adminType.title,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.xs,
  },
  onBehalfBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  onBehalfBadgeText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '600',
    fontSize: 11,
  },
  farmersOwnBadge: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  farmersOwnBadgeText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    fontSize: 11,
  },
  entrySubtext: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: 2,
  },
  entryAddedBy: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButton: {
    marginTop: adminSpacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  editButtonText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.md,
  },
  addDiaryButton: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  addDiaryButtonText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
