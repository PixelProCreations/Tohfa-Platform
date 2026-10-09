import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#7A2E14',
  primaryLight: '#FFF3EE',
  primarySoft: '#FFF3EE',
  primaryBorder: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#5F5E5A',
  border: '#EEDCD3',
  divider: '#EEDCD3',
  infoBg: '#E6F1FB',
  infoBorder: '#EEDCD3',
  infoText: '#0C447C',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

function ChevronDownIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PaperclipIcon({ size = 20, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SendIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseReportIssueScreenProps {
  initialIssueType?: string | undefined;
  onBack?: (() => void | ((fallbackScreen?: any) => void)) | undefined;
  onSubmit?: (() => void) | undefined;
  onSubmitSuccess?: ((ticketId: string) => void) | undefined;
}

export const CATEGORIES = [
  'Getting Started',
  'Warehouse Operations',
  'Orders',
  'Inventory',
  'Billing',
  'Wallet',
  'Reports',
  'Account & Security',
  'Other',
];

export const CATEGORY_SPECIFIC_ISSUES: Record<string, string[]> = {
  'Getting Started': [
    'App Navigation & Walkthrough Help',
    'Sub Warehouse Role & Permissions Setup',
    'Warehouse Facility Assignment Error',
    'Initial Barcode Scanner Pairing',
    'Other Getting Started Issue',
  ],
  'Warehouse Operations': [
    'Staff Shift & Attendance Logging Issue',
    'Expense Entry / Receipt Upload Failure',
    'Weighing Scale / Scanner Malfunction',
    'Crate & Staging Bay Capacity Full',
    'Cold Storage Temperature Alert',
    'Facility Maintenance Request',
    'Other Operations Issue',
  ],
  'Orders': [
    'Order Dispatch Delay',
    'Barcode Mismatch on Order Crates',
    'Customer Cancelled Order Handover',
    'Damaged Goods in Order Packing',
    'Wrong Product Items in Dispatch Batch',
    'Customer Pickup Verification Issue',
    'Other Order Issue',
  ],
  'Inventory': [
    'Physical Stock Count Discrepancy',
    'Damaged / Spoilt Produce Inbound Batch',
    'Produce Weight / Moisture Grade Discrepancy',
    'Bin Tag Barcode Printing Failure',
    'Storage Zone Capacity Exceeded',
    'Stock Reconciliation Error',
    'Other Inventory Issue',
  ],
  'Billing': [
    'Unable to Generate GST Invoice',
    'Incorrect Tax / HSN Rate Calculation',
    'Credit Note Issuance Failure',
    'Thermal Receipt Printer Connection Error',
    'Customer Invoice PDF Download Issue',
    'Other Billing Issue',
  ],
  'Wallet': [
    'Customer Cash Top-Up Confirmation Pending',
    'Wallet Balance Deduction Discrepancy',
    'Customer Refund Request Failed',
    'Daily Cash Summary Ledger Mismatch',
    'Customer Wallet PIN Reset Assistance',
    'Other Wallet Issue',
  ],
  'Reports': [
    'Sales Report Excel Export Failure',
    'Produce Shrinkage / Wastage Data Inaccurate',
    'Financial Expense Ledger Missing Entries',
    'Daily Shift Audit Summary Discrepancy',
    'Other Reports Issue',
  ],
  'Account & Security': [
    'Password Reset / Change Failure',
    'Suspicious Login Session Detected',
    'Device Authorization / Auto-Logout Error',
    'Biometric / PIN Verification Failure',
    'Other Security Concern',
  ],
  'Other': [
    'App Performance / Lag Issue',
    'Network Offline Sync Delay',
    'Feature Suggestion',
    'General Inquiry',
  ],
};

function CheckIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SubWarehouseReportIssueScreen({
  initialIssueType,
  onBack,
  onSubmit,
  onSubmitSuccess,
}: SubWarehouseReportIssueScreenProps) {
  const initialCat = (initialIssueType && CATEGORIES.includes(initialIssueType))
    ? initialIssueType
    : 'Orders';

  const [category, setCategory] = useState<string>(initialCat);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const currentSpecificIssues: string[] = CATEGORY_SPECIFIC_ISSUES[category] ?? CATEGORY_SPECIFIC_ISSUES['Other'] ?? ['General Issue'];
  const [specificIssue, setSpecificIssue] = useState<string>(currentSpecificIssues[0] ?? 'General Issue');
  const [showSpecificDropdown, setShowSpecificDropdown] = useState(false);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  const handleCategorySelect = (selectedCat: string) => {
    setCategory(selectedCat);
    setShowCategoryDropdown(false);
    const newSpecifics: string[] = CATEGORY_SPECIFIC_ISSUES[selectedCat] ?? CATEGORY_SPECIFIC_ISSUES['Other'] ?? ['General Issue'];
    const firstIssue = newSpecifics[0] ?? 'General Issue';
    setSpecificIssue(firstIssue);
    if (!subject.trim() || subject === specificIssue) {
      setSubject(firstIssue);
    }
  };

  const handleSpecificIssueSelect = (issue: string) => {
    setSpecificIssue(issue);
    setShowSpecificDropdown(false);
    if (!subject.trim() || subject === specificIssue) {
      setSubject(issue);
    }
  };

  const handleSelectAttachment = () => {
    Alert.alert('Attach File', 'Choose attachment source:', [
      {
        text: 'Document / Image',
        onPress: () => setAttachedFileName('receipt_inv_0048.png'),
      },
      {
        text: 'Camera Photo',
        onPress: () => setAttachedFileName('photo_damage_crate.jpg'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = () => {
    const finalSubject = subject.trim() || specificIssue;
    if (!finalSubject || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description for your issue.');
      return;
    }

    if (onSubmitSuccess) {
      onSubmitSuccess('SUP-00246');
    } else if (onSubmit) {
      onSubmit();
    } else {
      Alert.alert('Issue Submitted', 'Your support request SUP-00246 has been received.');
      if (onBack) onBack();
    }
  };

  // Dynamic placeholder for Reference ID based on Category
  const getRefPlaceholder = () => {
    switch (category) {
      case 'Orders': return 'e.g. ORD-2026-00452';
      case 'Inventory': return 'e.g. BATCH-2026-0891';
      case 'Billing': return 'e.g. INV-GST-2026-0012';
      case 'Wallet': return 'e.g. WAL-TOP-9921';
      case 'Warehouse Operations': return 'e.g. EXP-2026-0041';
      default: return 'e.g. REF-2026-001';
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onBack) onBack();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Report an Issue</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenHeading}>Report an Issue</Text>

        {/* Field 1: Category Dropdown */}
        <Text style={styles.inputLabel}>Category</Text>
        <TouchableOpacity
          style={styles.dropdownBox}
          onPress={() => setShowCategoryDropdown(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownValueWrap}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>Category</Text>
            </View>
            <Text style={styles.dropdownText}>{category}</Text>
          </View>
          <ChevronDownIcon />
        </TouchableOpacity>

        {/* Field 2: Specific Issue Dropdown (Relates directly to Category) */}
        <Text style={styles.inputLabel}>Specific Issue ({category})</Text>
        <TouchableOpacity
          style={[styles.dropdownBox, styles.specificDropdownBox]}
          onPress={() => setShowSpecificDropdown(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownValueWrap}>
            <Text style={styles.dropdownTextPrimary}>{specificIssue}</Text>
          </View>
          <ChevronDownIcon color={PALETTE.primary} />
        </TouchableOpacity>

        {/* Field 3: Subject */}
        <Text style={styles.inputLabel}>Subject</Text>
        <TextInput
          style={styles.textInput}
          placeholder={specificIssue || 'Brief summary of the issue'}
          placeholderTextColor={PALETTE.textMuted}
          value={subject}
          onChangeText={setSubject}
        />

        {/* Field 4: Description */}
        <Text style={styles.inputLabel}>Description</Text>
        <View style={styles.textAreaWrap}>
          <TextInput
            style={styles.textAreaInput}
            placeholder="Describe what happened, error message, or details..."
            placeholderTextColor={PALETTE.textMuted}
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.resizeHandle} />
        </View>

        {/* Field 5: Reference ID (optional) */}
        <Text style={styles.inputLabel}>Reference ID (optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder={getRefPlaceholder()}
          placeholderTextColor={PALETTE.textMuted}
          value={referenceId}
          onChangeText={setReferenceId}
        />

        {/* Field 6: Attachment */}
        <Text style={styles.inputLabel}>Attachment</Text>
        <View style={styles.attachmentRow}>
          <TouchableOpacity
            style={styles.attachmentBox}
            onPress={handleSelectAttachment}
            activeOpacity={0.75}
          >
            <PaperclipIcon size={22} color="#1E1612" />
          </TouchableOpacity>
          {attachedFileName && (
            <View style={styles.attachedFileBadge}>
              <Text style={styles.attachedFileText} numberOfLines={1}>
                {attachedFileName}
              </Text>
              <TouchableOpacity onPress={() => setAttachedFileName(null)}>
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Fixed Bottom Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <SendIcon size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>Submit Issue Request</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Modal 1: Select Category ─── */}
      <Modal
        visible={showCategoryDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
        >
          <View style={styles.dropdownModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeading}>Select Category</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setShowCategoryDropdown(false)}
              >
                <Text style={styles.modalCloseCircleText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalListScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionActive,
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected && <CheckIcon />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Modal 2: Select Specific Issue for Category ─── */}
      <Modal
        visible={showSpecificDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpecificDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpecificDropdown(false)}
        >
          <View style={styles.dropdownModalContent}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Select Specific Issue</Text>
                <Text style={styles.modalSubheading}>{category}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setShowSpecificDropdown(false)}
              >
                <Text style={styles.modalCloseCircleText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalListScroll}>
              {currentSpecificIssues.map((issue) => {
                const isSelected = specificIssue === issue;
                return (
                  <TouchableOpacity
                    key={issue}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionActive,
                    ]}
                    onPress={() => handleSpecificIssueSelect(issue)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {issue}
                    </Text>
                    {isSelected && <CheckIcon />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 12,
    marginBottom: 6,
  },

  dropdownBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specificDropdownBox: {
    borderColor: PALETTE.primaryBorder,
    backgroundColor: PALETTE.primarySoft,
  },
  dropdownValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  categoryBadge: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8B5E3C',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dropdownTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  textInput: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: PALETTE.textInk,
  },

  textAreaWrap: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    height: 110,
    position: 'relative',
  },
  textAreaInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    padding: 0,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: '#9CA3AF',
  },

  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  attachmentBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  attachedFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 200,
  },
  attachedFileText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textInk,
    marginRight: 6,
  },
  removeFileText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  submitBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Dropdown Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dropdownModalContent: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    padding: 18,
    maxHeight: '75%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalSubheading: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.primary,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseCircleText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  modalListScroll: {
    maxHeight: 320,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  dropdownOptionActive: {
    backgroundColor: PALETTE.primaryLight,
  },
  dropdownOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textInk,
    flex: 1,
    paddingRight: 8,
  },
  dropdownOptionTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
