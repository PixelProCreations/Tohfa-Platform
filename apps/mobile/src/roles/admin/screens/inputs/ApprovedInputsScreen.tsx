import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';
import {
  BackArrowIcon,
  PlusIcon,
  SearchIcon,
  FilterSlidersIcon,
  ChevronDownIcon,
  CalendarIcon,
  UploadTrayIcon,
} from './inputsIcons';

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

export interface ApprovedInputsScreenProps {
  onBack: () => void;
  onSelectInput?: (inputItem: CatalogInputItem) => void;
  onAddNewInput?: () => void;
  onEditInput?: (inputItem: CatalogInputItem) => void;
}

export function ApprovedInputsScreen({
  onBack,
  onSelectInput,
  onAddNewInput,
  onEditInput,
}: ApprovedInputsScreenProps): React.JSX.Element {
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
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
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

      {/* Scroll Container */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Filter Sliders Icon */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, ID or manufacturer"
            placeholderTextColor={adminColors.placeholder}
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

        {/* Records Count */}
        <Text style={styles.recordsCount}>{filteredInputs.length} records</Text>

        {/* Input Cards List */}
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

              {/* Actions Row: View · Edit · History */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectInput && onSelectInput(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLink}>View</Text>
                </TouchableOpacity>

                {item.hasEdit ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (onEditInput) {
                        onEditInput(item);
                      } else if (onSelectInput) {
                        onSelectInput(item);
                      }
                    }}
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

      {/* Filters Modal */}
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

// ─── Add New Input Screen ───────────────────────────────────────────────────

export interface AddNewInputScreenProps {
  onBack: () => void;
  onSave?: (newItem: Partial<CatalogInputItem>) => void;
  initialItem?: CatalogInputItem | null | undefined;
  isEditing?: boolean;
}

export function AddNewInputScreen({
  onBack,
  onSave,
  initialItem,
  isEditing = false,
}: AddNewInputScreenProps): React.JSX.Element {
  const [inputName, setInputName] = useState(initialItem?.name || '');
  const [pestDisease, setPestDisease] = useState(initialItem?.referenceNote || '');
  const [inputCategory, setInputCategory] = useState(initialItem?.category || '');
  const [manufacturer, setManufacturer] = useState(initialItem?.manufacturer || '');
  const [registrationId, setRegistrationId] = useState(initialItem?.code || initialItem?.id || '');
  const [description, setDescription] = useState(initialItem?.referenceNote || '');
  const [validityDate, setValidityDate] = useState(initialItem?.approvedDate || '');

  const [composition, setComposition] = useState(initialItem?.method || '');
  const [usagePurpose, setUsagePurpose] = useState(initialItem?.category || '');
  const [applicableCrops, setApplicableCrops] = useState(
    initialItem?.crops ? initialItem.crops.join(', ') : (initialItem?.applicableCrops ? initialItem.applicableCrops.replace(/^Applicable:\s*/, '') : '')
  );
  const [dosage, setDosage] = useState(initialItem?.usage ? initialItem.usage.split(' ')[0] : '');
  const [unit, setUnit] = useState(initialItem?.usage && initialItem.usage.split(' ')[1] ? initialItem.usage.split(' ')[1] : 'mL/L');
  const [applicationMethod, setApplicationMethod] = useState(initialItem?.frequency || '');
  const [frequency, setFrequency] = useState(initialItem?.frequency || '');
  const [safetyInstructions, setSafetyInstructions] = useState('');

  const [pickerModalTitle, setPickerModalTitle] = useState('');
  const [pickerModalOptions, setPickerModalOptions] = useState<string[]>([]);
  const [pickerOnSelect, setPickerOnSelect] = useState<(val: string) => void>(() => () => {});
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [validityCalendarOpen, setValidityCalendarOpen] = useState(false);

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

    if (isEditing && initialItem) {
      initialItem.name = trimmedName;
      initialItem.category = trimmedCategory;
      initialItem.manufacturer = trimmedManufacturer;
      initialItem.code = trimmedCode;
      initialItem.applicableCrops = applicableCrops ? `Applicable: ${applicableCrops}` : initialItem.applicableCrops;
      initialItem.updatedDate = 'Just now';
      initialItem.updatedBy = 'Admin';
      initialItem.method = composition || initialItem.method;
      initialItem.usage = dosage ? `${dosage} ${unit || 'mL/L'}` : initialItem.usage;
      initialItem.frequency = applicationMethod || frequency || initialItem.frequency;
      initialItem.referenceNote = description || initialItem.referenceNote;

      const idx = CATALOG_INPUTS.findIndex((i) => i.id === initialItem.id);
      if (idx !== -1) {
        CATALOG_INPUTS[idx] = { ...initialItem };
      }
      if (onSave) {
        onSave(initialItem);
      } else {
        onBack();
      }
      return;
    }

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
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
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
          <Text style={addStyles.headerTitle}>{isEditing ? 'Edit Input' : 'Add New Input'}</Text>
        </View>
      </View>

      {/* Scroll Form Container */}
      <ScrollView
        style={addStyles.scroll}
        contentContainerStyle={addStyles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Basic Info */}
        <Text style={addStyles.sectionTitle}>Basic Info</Text>
        <View style={addStyles.cardContainer}>
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Input name <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={inputName}
              onChangeText={setInputName}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

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
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

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
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Manufacturer / supplier</Text>
            <TextInput
              style={addStyles.textInput}
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Product / registration ID (optional)</Text>
            <TextInput
              style={addStyles.textInput}
              value={registrationId}
              onChangeText={setRegistrationId}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Description</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Validity date (if one applies)</Text>
            <View style={addStyles.dateBox}>
              <TextInput
                style={addStyles.dateInput}
                placeholder="dd-mm-yyyy"
                placeholderTextColor={adminColors.placeholder}
                value={validityDate}
                onChangeText={setValidityDate}
              />
              <TouchableOpacity
                onPress={() => setValidityCalendarOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pick validity date"
              >
                <CalendarIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 2: Composition & Usage */}
        <Text style={addStyles.sectionTitle}>Composition & Usage</Text>
        <View style={addStyles.cardContainer}>
          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Ingredients or composition</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={composition}
              onChangeText={setComposition}
              multiline
              numberOfLines={3}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>
              Approved usage purpose <Text style={addStyles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={addStyles.textInput}
              value={usagePurpose}
              onChangeText={setUsagePurpose}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

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
              <ChevronDownIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          <View style={addStyles.twoColRow}>
            <View style={addStyles.colLeft}>
              <Text style={addStyles.label}>Dosage</Text>
              <TextInput
                style={addStyles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholderTextColor={adminColors.placeholder}
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
                <ChevronDownIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Application method</Text>
            <TextInput
              style={addStyles.textInput}
              value={applicationMethod}
              onChangeText={setApplicationMethod}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Frequency, if established</Text>
            <TextInput
              style={addStyles.textInput}
              value={frequency}
              onChangeText={setFrequency}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={addStyles.fieldGroup}>
            <Text style={addStyles.label}>Restrictions, incompatibilities and safety instructions</Text>
            <TextInput
              style={[addStyles.textInput, addStyles.multilineInput]}
              value={safetyInstructions}
              onChangeText={setSafetyInstructions}
              multiline
              numberOfLines={3}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* Section 3: Documents */}
        <Text style={addStyles.sectionTitle}>Documents</Text>
        <View style={addStyles.uploadCard}>
          <UploadTrayIcon size={32} color={adminColors.muted} />
          <Text style={addStyles.uploadTitle}>Upload supporting document</Text>
          <Text style={addStyles.uploadSubtitle}>
            Save the draft first, then add the product label and supporting documents.
          </Text>
        </View>

        <View style={{ height: 85 }} />
      </ScrollView>

      {/* Pinned Bottom Save Button */}
      <View style={addStyles.bottomBar}>
        <TouchableOpacity
          style={addStyles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={addStyles.saveBtnText}>{isEditing ? 'Save Changes' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Picker Sheet Modal */}
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

      <AdminCalendarPickerModal
        visible={validityCalendarOpen}
        value={validityDate}
        onSelect={setValidityDate}
        onClose={() => setValidityCalendarOpen(false)}
      />
    </View>
  );
}

export function EditInputScreen(props: AddNewInputScreenProps): React.JSX.Element {
  return <AddNewInputScreen {...props} isEditing={true} />;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
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
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: adminSpacing.xs,
    ...adminType.body,
    color: adminColors.ink,
  },
  filterBtn: {
    padding: adminSpacing.xs,
  },
  recordsCount: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    marginHorizontal: 4,
    marginVertical: adminSpacing.sm,
  },
  inputCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  cardLineMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: 4,
  },
  badge: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.xsSm,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
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
    backgroundColor: adminColors.canvas,
  },
  badgeTextInactive: {
    color: adminColors.muted,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    marginTop: 10,
  },
  actionLink: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  filtersModalTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.lg,
  },
  filterFieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xsSm,
    marginBottom: adminSpacing.xl,
  },
  statusChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  statusChipActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  statusChipText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  statusChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  modalApplyBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  modalResetBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});

const addStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
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
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredStar: {
    color: adminColors.danger.text,
    fontWeight: '800',
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    ...adminType.body,
    color: adminColors.ink,
  },
  multilineInput: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  selectText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  selectPlaceholder: {
    color: adminColors.placeholder,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  dateInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
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
  uploadCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 32,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  uploadTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  uploadSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: adminSpacing.lg + 4,
  },
  saveBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xl + 20,
  },
  pickerSheetTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  pickerOptionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerOptionText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
});
