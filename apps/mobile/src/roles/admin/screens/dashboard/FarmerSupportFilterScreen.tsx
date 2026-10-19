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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { FarmerSupportItem } from './FarmerSupportScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Options Constants ───────────────────────────────────────────────────────

export const SUPPORT_STATUS_OPTIONS: readonly string[] = [
  'Any',
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
];

export const SUPPORT_CATEGORY_OPTIONS: readonly string[] = [
  'Any',
  'Approved Inputs',
  'Payment Information',
  'Produce Listing Assistance',
  'Purchase Information',
  'Certification Assistance',
  'Logistics',
  'Inputs & Pest',
];

export const SUPPORT_SUBMITTED_OPTIONS: readonly string[] = [
  'Any',
  'Today',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
];

export const SUPPORT_ASSIGNED_OPTIONS: readonly string[] = [
  'Any',
  'Farmer Support',
  'Inspection Team',
  'Finance & Settlements',
  'Agronomy Team',
  'Unassigned',
];

export interface SupportFilterValues {
  searchQuery: string;
  status: string;
  category: string;
  submitted: string;
  farmer: string;
  assignedTeam: string;
}

export interface FarmerSupportFilterScreenProps {
  initialFilters: SupportFilterValues;
  requestsData: readonly FarmerSupportItem[];
  onBack: () => void;
  onApply: (filters: SupportFilterValues) => void;
  onReset?: () => void;
  onCancel?: () => void;
}

export function FarmerSupportFilterScreen({
  initialFilters,
  requestsData,
  onBack,
  onApply,
  onReset,
  onCancel,
}: FarmerSupportFilterScreenProps) {
  // Draft Form States
  const [draftSearch, setDraftSearch] = useState(initialFilters.searchQuery || '');
  const [draftStatus, setDraftStatus] = useState(initialFilters.status || 'Any');
  const [draftCategory, setDraftCategory] = useState(initialFilters.category || 'Any');
  const [draftSubmitted, setDraftSubmitted] = useState(initialFilters.submitted || 'Any');
  const [draftFarmer, setDraftFarmer] = useState(initialFilters.farmer || '');
  const [draftAssignedTeam, setDraftAssignedTeam] = useState(initialFilters.assignedTeam || 'Any');

  // Picker Modal State
  const [activePickerField, setActivePickerField] = useState<
    'status' | 'category' | 'submitted' | 'assignedTeam' | null
  >(null);

  // Dynamic Matching Count Calculation
  const matchingCount = useMemo(() => {
    const q = draftSearch.trim().toLowerCase();
    const farmerQ = draftFarmer.trim().toLowerCase();

    return requestsData.filter((item) => {
      // 1. Search Query
      if (q) {
        const matchesSearch =
          item.id.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.farmerName.toLowerCase().includes(q) ||
          item.farmerId.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Status
      if (draftStatus !== 'Any') {
        if (item.status !== draftStatus) return false;
      }

      // 3. Category
      if (draftCategory !== 'Any') {
        if (item.category.toLowerCase() !== draftCategory.toLowerCase()) return false;
      }

      // 4. Farmer
      if (farmerQ && farmerQ !== 'any farmer') {
        const matchesFarmer =
          item.farmerName.toLowerCase().includes(farmerQ) ||
          item.farmerId.toLowerCase().includes(farmerQ);
        if (!matchesFarmer) return false;
      }

      // 5. Assigned Team
      if (draftAssignedTeam !== 'Any') {
        if (draftAssignedTeam === 'Unassigned') {
          if (item.assignedTo !== 'Not assigned') return false;
        } else {
          const matchesTeam =
            item.assignedTo.toLowerCase().includes(draftAssignedTeam.toLowerCase()) ||
            (draftAssignedTeam === 'Farmer Support' && item.assignedTo.includes('Suresh'));
          if (!matchesTeam) return false;
        }
      }

      return true;
    }).length;
  }, [requestsData, draftSearch, draftStatus, draftCategory, draftFarmer, draftAssignedTeam]);

  const handleReset = () => {
    setDraftSearch('');
    setDraftStatus('Any');
    setDraftCategory('Any');
    setDraftSubmitted('Any');
    setDraftFarmer('');
    setDraftAssignedTeam('Any');
    if (onReset) {
      onReset();
    }
  };

  const handleApply = () => {
    onApply({
      searchQuery: draftSearch,
      status: draftStatus,
      category: draftCategory,
      submitted: draftSubmitted,
      farmer: draftFarmer,
      assignedTeam: draftAssignedTeam,
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onBack();
    }
  };

  // Helper for picker modal title & options
  const pickerConfig = useMemo(() => {
    switch (activePickerField) {
      case 'status':
        return {
          title: 'Select Status',
          options: SUPPORT_STATUS_OPTIONS,
          currentValue: draftStatus,
          onSelect: (val: string) => setDraftStatus(val),
        };
      case 'category':
        return {
          title: 'Select Category',
          options: SUPPORT_CATEGORY_OPTIONS,
          currentValue: draftCategory,
          onSelect: (val: string) => setDraftCategory(val),
        };
      case 'submitted':
        return {
          title: 'Select Submitted Timeframe',
          options: SUPPORT_SUBMITTED_OPTIONS,
          currentValue: draftSubmitted,
          onSelect: (val: string) => setDraftSubmitted(val),
        };
      case 'assignedTeam':
        return {
          title: 'Select Assigned Team',
          options: SUPPORT_ASSIGNED_OPTIONS,
          currentValue: draftAssignedTeam,
          onSelect: (val: string) => setDraftAssignedTeam(val),
        };
      default:
        return null;
    }
  }, [activePickerField, draftStatus, draftCategory, draftSubmitted, draftAssignedTeam]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Search & Filters</Text>
              <Text style={styles.headerSubtitle}>
                Refine support requests by ID, status, category, or farmer
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerResetBtn}
            onPress={handleReset}
            activeOpacity={0.75}
            accessibilityLabel="Reset filters"
          >
            <Text style={styles.headerResetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Full Screen Form Card ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* 1. Search: */}
          <Text style={styles.fieldLabel}>Search:</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Search by request ID, farmer, or subject"
              placeholderTextColor={adminColors.placeholder}
              value={draftSearch}
              onChangeText={setDraftSearch}
              autoCorrect={false}
            />
            {draftSearch.length > 0 && (
              <TouchableOpacity onPress={() => setDraftSearch('')} activeOpacity={0.7}>
                <Text style={styles.clearIconText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 2. Status */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Status</Text>
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setActivePickerField('status')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValueText}>{draftStatus}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>
          <Text style={styles.helperText}>
            includes pre-proposal/list, pending review, confirmation.
          </Text>

          {/* 3. Category */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Category</Text>
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setActivePickerField('category')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValueText}>{draftCategory}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* 4. Submitted */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Submitted</Text>
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setActivePickerField('submitted')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValueText}>{draftSubmitted}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* 5. Farmer */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Farmer</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Any farmer"
              placeholderTextColor={adminColors.placeholder}
              value={draftFarmer}
              onChangeText={setDraftFarmer}
              autoCorrect={false}
            />
            <SearchIcon size={17} color={adminColors.muted} />
          </View>

          {/* 6. Assigned team */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Assigned team</Text>
          <TouchableOpacity
            style={styles.dropdownField}
            onPress={() => setActivePickerField('assignedTeam')}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownValueText}>{draftAssignedTeam}</Text>
            <ChevronDownIcon size={16} color={adminColors.ink} />
          </TouchableOpacity>

          {/* 7. Matching Requests Count */}
          <Text style={styles.matchingText}>{matchingCount} matching requests</Text>

          {/* 8. Action Buttons: Apply Filters, Reset, Cancel */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Apply Filters"
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleReset}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Reset"
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Picker Modal for Dropdowns ─── */}
      <Modal
        visible={pickerConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePickerField(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActivePickerField(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{pickerConfig?.title}</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {pickerConfig?.options.map((opt) => {
                const isSelected = pickerConfig.currentValue === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalOption, isSelected && styles.modalOptionActive]}
                    onPress={() => {
                      pickerConfig.onSelect(opt);
                      setActivePickerField(null);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <CheckmarkIcon size={18} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setActivePickerField(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerTextGroup: {
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'left',
  },
  headerResetBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: adminRadius.sm,
  },
  headerResetText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    marginLeft: 0,
    textAlign: 'left',
  },

  // ─── Body Card ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },

  // Form Field Labels
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },

  // Text Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  clearIconText: {
    fontSize: 14,
    color: adminColors.muted,
    paddingHorizontal: 4,
  },

  // Dropdown Fields
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownValueText: {
    fontSize: 13.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Matching Requests Counter
  matchingText: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 18,
    marginBottom: 16,
  },

  // Action Buttons Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyBtn: {
    flex: 1.4,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: adminColors.onBrand,
    fontSize: 13.5,
    fontWeight: '700',
  },
  resetBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: adminRadius.sm,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  modalOptionText: {
    fontSize: 13.5,
    color: adminColors.ink,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  modalCloseBtn: {
    marginTop: 12,
    backgroundColor: adminColors.brand,
    paddingVertical: 10,
    borderRadius: adminRadius.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: adminColors.onBrand,
    fontSize: 13,
    fontWeight: '700',
  },
});
