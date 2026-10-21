import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#8C7E74' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={color} stroke={adminColors.card} strokeWidth="1.5" />
      <Circle cx="9" cy="12" r="2.5" fill={color} stroke={adminColors.card} strokeWidth="1.5" />
      <Circle cx="16" cy="18" r="2.5" fill={color} stroke={adminColors.card} strokeWidth="1.5" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface CatalogInputItem {
  id: string;
  name: string;
  code: string;
  category: string;
  manufacturer: string;
  applicableCrops: string;
  status: 'Approved' | 'Pending' | 'Inactive' | string;
  updatedDate: string;
  updatedBy: string;
  referenceNote?: string | undefined;
  hasEdit?: boolean | undefined;
  crops?: string[] | undefined;
  method?: string | undefined;
  usage?: string | undefined;
  frequency?: string | undefined;
  subcategory?: string | undefined;
  farmingType?: string | undefined;
  approvedDate?: string | undefined;
}

export type ApprovedInputItem = CatalogInputItem;

export const CATALOG_INPUTS: CatalogInputItem[] = [
  {
    id: 'IN-0041',
    name: 'Neem Oil Concentrate',
    code: 'IN-0041',
    category: 'Pest control',
    manufacturer: 'GreenGro Organics',
    applicableCrops: 'Applicable: Tomato, Cabbage',
    status: 'Approved',
    updatedDate: '11 Oct 2026',
    updatedBy: 'Priya Nair',
    hasEdit: true,
  },
  {
    id: 'IN-0055',
    name: 'Panchagavya Mix',
    code: 'IN-0055',
    category: 'Soil input',
    manufacturer: 'Farmer-prepared',
    applicableCrops: 'Applicable: All crops',
    status: 'Pending',
    updatedDate: '10 Oct 2026',
    updatedBy: 'Priya Nair',
    hasEdit: true,
  },
  {
    id: 'IN-0012',
    name: 'Vermicompost Grade A',
    code: 'IN-0012',
    category: 'Soil input',
    manufacturer: 'Local supplier',
    applicableCrops: 'Applicable: All crops',
    status: 'Inactive',
    updatedDate: '2 Jun 2026',
    updatedBy: 'Local supplier',
    referenceNote: 'Referenced by 6 historical farmer records — preserved',
    hasEdit: false,
  },
  {
    id: 'IN-0023',
    name: 'Trichoderma Viride',
    code: 'IN-0023',
    category: 'Bio-fungicide',
    manufacturer: 'BioCrop Tech',
    applicableCrops: 'Applicable: Potato, Tomato',
    status: 'Approved',
    updatedDate: '28 Sep 2026',
    updatedBy: 'Agronomy team',
    hasEdit: true,
  },
  {
    id: 'IN-0034',
    name: 'Pseudomonas Fluorescens',
    code: 'IN-0034',
    category: 'Bio-bactericide',
    manufacturer: 'AgriCare Labs',
    applicableCrops: 'Applicable: Cabbage, Carrot',
    status: 'Approved',
    updatedDate: '25 Sep 2026',
    updatedBy: 'Agronomy team',
    hasEdit: true,
  },
  {
    id: 'IN-0045',
    name: 'Bone Meal Organic',
    code: 'IN-0045',
    category: 'Phosphorus supplement',
    manufacturer: 'EcoFertilizers',
    applicableCrops: 'Applicable: Root crops',
    status: 'Approved',
    updatedDate: '18 Sep 2026',
    updatedBy: 'Senthil K.',
    hasEdit: true,
  },
  {
    id: 'IN-0062',
    name: 'Fish Amino Acid (FAA)',
    code: 'IN-0062',
    category: 'Growth promoter',
    manufacturer: 'Farmer-prepared',
    applicableCrops: 'Applicable: All vegetables',
    status: 'Pending',
    updatedDate: '15 Sep 2026',
    updatedBy: 'Sundar M.',
    hasEdit: true,
  },
  {
    id: 'IN-0078',
    name: 'Castor Cake Powder',
    code: 'IN-0078',
    category: 'Soil conditioner',
    manufacturer: 'GreenGro Organics',
    applicableCrops: 'Applicable: Tomato, Beans',
    status: 'Approved',
    updatedDate: '12 Sep 2026',
    updatedBy: 'Priya Nair',
    hasEdit: true,
  },
  {
    id: 'IN-0089',
    name: 'Beauveria Bassiana',
    code: 'IN-0089',
    category: 'Bio-insecticide',
    manufacturer: 'BioCrop Tech',
    applicableCrops: 'Applicable: Cabbage, Broccoli',
    status: 'Approved',
    updatedDate: '05 Sep 2026',
    updatedBy: 'Agronomy team',
    hasEdit: true,
  },
  {
    id: 'IN-0091',
    name: 'Agniastra Herbal Decoction',
    code: 'IN-0091',
    category: 'Pest repellent',
    manufacturer: 'Farmer-prepared',
    applicableCrops: 'Applicable: All crops',
    status: 'Approved',
    updatedDate: '01 Sep 2026',
    updatedBy: 'Ramesh Kumar',
    hasEdit: true,
  },
  {
    id: 'IN-0103',
    name: 'Karanj Seed Cake',
    code: 'IN-0103',
    category: 'Nematicide / fertilizer',
    manufacturer: 'EcoFertilizers',
    applicableCrops: 'Applicable: Potato, Carrot',
    status: 'Approved',
    updatedDate: '24 Aug 2026',
    updatedBy: 'Priya Nair',
    hasEdit: true,
  },
  {
    id: 'IN-0115',
    name: 'Jeevamrutha Concentrate',
    code: 'IN-0115',
    category: 'Soil micro-culture',
    manufacturer: 'Farmer-prepared',
    applicableCrops: 'Applicable: All crops',
    status: 'Approved',
    updatedDate: '18 Aug 2026',
    updatedBy: 'Arun V.',
    hasEdit: true,
  },
  {
    id: 'IN-0128',
    name: 'Metarhizium Anisopliae',
    code: 'IN-0128',
    category: 'Bio-pesticide',
    manufacturer: 'AgriCare Labs',
    applicableCrops: 'Applicable: Soil pests',
    status: 'Approved',
    updatedDate: '10 Aug 2026',
    updatedBy: 'Agronomy team',
    hasEdit: true,
  },
  {
    id: 'IN-0136',
    name: 'Rock Phosphate Meal',
    code: 'IN-0136',
    category: 'Mineral amendment',
    manufacturer: 'Old Mineral Co.',
    applicableCrops: 'Applicable: Field crops',
    status: 'Inactive',
    updatedDate: '15 Jul 2026',
    updatedBy: 'Inventory team',
    referenceNote: 'Discontinued due to formulation update — preserved',
    hasEdit: false,
  },
  {
    id: 'IN-0142',
    name: 'Dashaparni Kashayam',
    code: 'IN-0142',
    category: 'Broad spectrum botanical',
    manufacturer: 'Farmer-prepared',
    applicableCrops: 'Applicable: All vegetables',
    status: 'Approved',
    updatedDate: '01 Jul 2026',
    updatedBy: 'Meena S.',
    hasEdit: true,
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ApprovedInputsScreenProps {
  onBack: () => void;
  onSelectInput?: (inputItem: CatalogInputItem) => void;
  onAddNewInput?: () => void;
}

export function ApprovedInputsScreen({
  onBack,
  onSelectInput,
  onAddNewInput,
}: ApprovedInputsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Pending' | 'Inactive'>('All');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const filteredInputs = CATALOG_INPUTS.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.manufacturer.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Image 3) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Approved Inputs Catalog</Text>

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={onAddNewInput}
            activeOpacity={0.8}
            accessibilityLabel="Add input"
          >
            <PlusIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar with Filter Sliders Icon (Image 3) ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#8C7E74" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, ID or manufacturer"
            placeholderTextColor="#8C7E74"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Filter inputs"
          >
            <FilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ─── Records Count ─── */}
        <Text style={styles.recordsCount}>{filteredInputs.length} records</Text>

        {/* ─── Input Cards List (Image 3) ─── */}
        {filteredInputs.map((item) => {
          const isApproved = item.status === 'Approved';
          const isPending = item.status === 'Pending';
          const isInactive = item.status === 'Inactive';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.inputCard}
              onPress={() => onSelectInput && onSelectInput(item)}
              activeOpacity={0.85}
            >
              {/* Card Header Row: Title & Status Badge */}
              <View style={styles.cardTopRow}>
                <Text style={styles.inputCardTitle}>{item.name}</Text>
                <View
                  style={[
                    styles.badge,
                    isApproved && styles.badgeApproved,
                    isPending && styles.badgePending,
                    isInactive && styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isApproved && styles.badgeTextApproved,
                      isPending && styles.badgeTextPending,
                      isInactive && styles.badgeTextInactive,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Line 1: Code · Category · Manufacturer */}
              <Text style={styles.cardLineMeta}>
                {item.code} · {item.category} · {item.manufacturer}
              </Text>

              {/* Line 2: Applicable crops / Reference notes */}
              {item.referenceNote ? (
                <Text style={styles.cardLineMeta}>
                  Updated {item.updatedDate} · {item.referenceNote}
                </Text>
              ) : (
                <Text style={styles.cardLineMeta}>
                  {item.applicableCrops} · Updated {item.updatedDate} · {item.updatedBy}
                </Text>
              )}

              {/* Actions Row: View · Edit · History (Image 3) */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectInput && onSelectInput(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>View</Text>
                </TouchableOpacity>

                {item.hasEdit ? (
                  <TouchableOpacity
                    onPress={() => onSelectInput && onSelectInput(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionLink}>Edit</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={() => onSelectInput && onSelectInput(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>History</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ─── Filters Modal ─── */}
      <Modal
        visible={showFiltersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowFiltersModal(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.filtersModalTitle}>Filter Inputs</Text>

            <Text style={styles.filterFieldLabel}>Status</Text>
            <View style={styles.statusChipsRow}>
              {(['All', 'Approved', 'Pending', 'Inactive'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, isActive && styles.statusChipActive]}
                    onPress={() => setStatusFilter(st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setShowFiltersModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setStatusFilter('All');
                  setSearchQuery('');
                  setShowFiltersModal(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles Strictly Derived from Admin Theme ─────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.xs,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  filterBtn: {
    padding: adminSpacing.xs,
  },

  // Records Count
  recordsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
    marginHorizontal: 4,
    marginVertical: adminSpacing.sm,
  },

  // Input Card (Image 3)
  inputCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  cardLineMeta: {
    fontSize: 12.5,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Badges
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextApproved: {
    color: adminColors.success.text,
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextPending: {
    color: adminColors.warning.text,
  },
  badgeInactive: {
    backgroundColor: '#F3F4F6',
  },
  badgeTextInactive: {
    color: '#4B5563',
  },

  // Actions Row (View · Edit · History)
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 10,
  },
  actionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Modal / Bottom Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  filtersModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  filterFieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.lg,
  },
  statusChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#EDE7E1',
  },
  statusChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  statusChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  modalApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  modalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C8BFB5',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
});

// ─── Add New Input Screen (Images 1, 2, 3) ───────────────────────────────────

function CalendarIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UploadTrayIcon({ size = 28, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 8l-5-5-5 5M12 3v12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AddNewInputScreenProps {
  onBack: () => void;
  onSave?: (newItem: Partial<CatalogInputItem>) => void;
}

export function AddNewInputScreen({ onBack, onSave }: AddNewInputScreenProps) {
  // Basic Info Form State (Image 1)
  const [inputName, setInputName] = useState('');
  const [pestDisease, setPestDisease] = useState('');
  const [inputCategory, setInputCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [registrationId, setRegistrationId] = useState('');
  const [description, setDescription] = useState('');
  const [validityDate, setValidityDate] = useState('');

  // Composition & Usage Form State (Image 2 & 3)
  const [composition, setComposition] = useState('');
  const [usagePurpose, setUsagePurpose] = useState('');
  const [applicableCrops, setApplicableCrops] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('');
  const [applicationMethod, setApplicationMethod] = useState('');
  const [frequency, setFrequency] = useState('');
  const [safetyInstructions, setSafetyInstructions] = useState('');

  // Dropdown Picker Modal
  const [pickerModalTitle, setPickerModalTitle] = useState('');
  const [pickerModalOptions, setPickerModalOptions] = useState<string[]>([]);
  const [pickerOnSelect, setPickerOnSelect] = useState<(val: string) => void>(() => () => {});
  const [showPickerModal, setShowPickerModal] = useState(false);

  const openPicker = (title: string, options: string[], onSelect: (val: string) => void) => {
    setPickerModalTitle(title);
    setPickerModalOptions(options);
    setPickerOnSelect(() => onSelect);
    setShowPickerModal(true);
  };

  const handleSave = () => {
    const trimmedName = inputName.trim() || 'New Agricultural Input';
    const trimmedCategory = inputCategory.trim() || 'Pest control';
    const trimmedManufacturer = manufacturer.trim() || 'Farmer-prepared';
    const trimmedCode = registrationId.trim() || `IN-${Math.floor(1000 + Math.random() * 9000)}`;

    const newItem: CatalogInputItem = {
      id: trimmedCode,
      name: trimmedName,
      code: trimmedCode,
      category: trimmedCategory,
      manufacturer: trimmedManufacturer,
      applicableCrops: applicableCrops ? `Applicable: ${applicableCrops}` : 'Applicable: All crops',
      status: 'Pending',
      updatedDate: 'Just now',
      updatedBy: 'Admin',
      method: composition,
      usage: dosage ? `${dosage} ${unit || 'mL/L'}` : undefined,
      frequency: applicationMethod || undefined,
      hasEdit: true,
    };

    CATALOG_INPUTS.unshift(newItem);

    if (onSave) {
      onSave(newItem);
    } else {
      onBack();
    }
  };

  return (
    <View style={addStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner (Images 1, 2, 3) ─── */}
      <View style={addStyles.header}>
        <View style={addStyles.headerRow}>
          <TouchableOpacity
            style={addStyles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={addStyles.headerTitle}>Add New Input</Text>
        </View>
      </View>

      {/* ─── Scroll Form Container ─── */}
      <ScrollView
        style={addStyles.scroll}
        contentContainerStyle={addStyles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section 1: Basic Info (Image 1) ─── */}
        <Text style={addStyles.sectionTitle}>Basic Info</Text>
        <View style={addStyles.cardContainer}>
          {/* Input name * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Input name <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={inputName}
              onChangeText={setInputName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Referred Pest & Disease * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Referred Pest & Disease <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() =>
                openPicker(
                  'Select Pest & Disease',
                  [
                    'Late Blight (Tomato)',
                    'Early Blight (Potato)',
                    'Powdery Mildew',
                    'Aphids & Thrips',
                    'Root Rot Complex',
                    'Fruit Borer',
                    'General Protection',
                  ],
                  setPestDisease
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  addStyles.selectText,
                  !pestDisease && addStyles.selectPlaceholder,
                ]}
              >
                {pestDisease || 'Select...'}
              </Text>
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Input category * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Input category <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() =>
                openPicker(
                  'Select Category',
                  [
                    'Pest control',
                    'Soil input',
                    'Bio-fungicide',
                    'Bio-bactericide',
                    'Bio-insecticide',
                    'Growth promoter',
                    'Botanical extract',
                  ],
                  setInputCategory
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  addStyles.selectText,
                  !inputCategory && addStyles.selectPlaceholder,
                ]}
              >
                {inputCategory || 'Select...'}
              </Text>
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Manufacturer / supplier */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Manufacturer / supplier</Text>
            <TextInput
              style={addStyles.textInput}
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Product / registration ID (optional) */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Product / registration ID (optional)</Text>
            <TextInput
              style={addStyles.textInput}
              value={registrationId}
              onChangeText={setRegistrationId}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Description */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Description</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Validity date (if one applies) */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Validity date (if one applies)</Text>
            <View style={addStyles.dateBox}>
              <TextInput
                style={addStyles.dateInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor="#9CA3AF"
                value={validityDate}
                onChangeText={setValidityDate}
              />
              <CalendarIcon size={18} color="#6B7280" />
            </View>
          </View>
        </View>

        {/* ─── Section 2: Composition & Usage (Image 2 & 3) ─── */}
        <Text style={addStyles.sectionTitle}>Composition & Usage</Text>
        <View style={addStyles.cardContainer}>
          {/* Ingredients or composition */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Ingredients or composition</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={composition}
              onChangeText={setComposition}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Approved usage purpose * */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Approved usage purpose <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={usagePurpose}
              onChangeText={setUsagePurpose}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Applicable crops (none selected means every crop) */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Applicable crops (none selected means every crop)</Text>
            <TouchableOpacity
              style={addStyles.selectBox}
              onPress={() =>
                openPicker(
                  'Select Applicable Crops',
                  ['All crops', 'Tomato, Cabbage', 'Potato, Tomato', 'Root crops', 'All vegetables'],
                  setApplicableCrops
                )
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  addStyles.selectText,
                  !applicableCrops && addStyles.selectPlaceholder,
                ]}
              >
                {applicableCrops || 'Select...'}
              </Text>
              <ChevronDownIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Dosage & Unit (2 columns) */}
          <View style={addStyles.twoColRow}>
            <View style={addStyles.colLeft}>
              <Text style={addStyles.label}>Dosage</Text>
              <TextInput
                style={addStyles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={addStyles.colRight}>
              <Text style={addStyles.label}>Unit</Text>
              <TouchableOpacity
                style={addStyles.selectBox}
                onPress={() =>
                  openPicker('Select Unit', ['mL / litre', 'g / litre', 'kg / acre', 'litre / acre'], setUnit)
                }
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    addStyles.selectText,
                    !unit && addStyles.selectPlaceholder,
                  ]}
                >
                  {unit || 'Select...'}
                </Text>
                <ChevronDownIcon size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Application method */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Application method</Text>
            <TextInput
              style={addStyles.textInput}
              value={applicationMethod}
              onChangeText={setApplicationMethod}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Frequency, if established */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Frequency, if established</Text>
            <TextInput
              style={addStyles.textInput}
              value={frequency}
              onChangeText={setFrequency}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Restrictions, incompatibilities and safety instructions */}
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Restrictions, incompatibilities and safety instructions</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={safetyInstructions}
              onChangeText={setSafetyInstructions}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* ─── Section 3: Documents (Image 3) ─── */}
        <Text style={addStyles.sectionTitle}>Documents</Text>
        <View style={addStyles.uploadCard}>
          <UploadTrayIcon size={32} color="#4B5563" />
          <Text style={addStyles.uploadTitle}>Upload supporting document</Text>
          <Text style={addStyles.uploadSubtitle}>
            Save the draft first, then add the product label and supporting documents.
          </Text>
        </View>

        {/* Space for bottom fixed bar */}
        <View style={{ height: 85 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Save Button (Images 1, 2, 3) ─── */}
      <View style={addStyles.bottomBar}>
        <TouchableOpacity
          style={addStyles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={addStyles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Picker Sheet Modal ─── */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={addStyles.modalBackdrop}>
          <Pressable
            style={addStyles.modalDismissArea}
            onPress={() => setShowPickerModal(false)}
          />
          <View style={addStyles.modalSheet}>
            <Text style={addStyles.pickerSheetTitle}>{pickerModalTitle}</Text>
            {pickerModalOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={addStyles.pickerOptionRow}
                onPress={() => {
                  pickerOnSelect(opt);
                  setShowPickerModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={addStyles.pickerOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles for Add New Input ────────────────────────────────────────────────

const addStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Header Banner
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },

  // Card Container
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },

  // Field Group
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  // Dropdown Select Box
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
  },
  selectText: {
    fontSize: 13.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
  selectPlaceholder: {
    color: '#6B7280',
  },

  // Validity Date Box
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    height: 44,
  },
  dateInput: {
    flex: 1,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },

  // Two Column Row (Dosage & Unit)
  twoColRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: 14,
  },
  colLeft: {
    flex: 1,
  },
  colRight: {
    flex: 1,
  },

  // Documents Upload Card (Image 3)
  uploadCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: '#EDE7E1',
    paddingVertical: 32,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  uploadTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: 12.5,
    color: adminColors.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // Fixed Bottom Bar (Images 1, 2, 3)
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#EDE7E1',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: adminSpacing.lg + 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EA7C24',
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal / Picker
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  pickerSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  pickerOptionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
});

