import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S16Props {
  orderId?: string;
  initialSubmitted?: boolean;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke="#64748B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CameraPhotoIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke="#64748B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke="#64748B" strokeWidth="1.8" />
    </Svg>
  );
}

function SendPlaneWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RadioSelectedIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#E85226" strokeWidth="2.5" />
      <Circle cx="12" cy="12" r="4.5" fill="#E85226" />
    </Svg>
  );
}

function RadioUnselectedIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#CBD5E1" strokeWidth="2" />
    </Svg>
  );
}

function InfoCircleRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BigGreenCheckSuccessIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke="#10B981"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const ISSUE_TYPES = [
  'Quality',
  'Quantity',
  'Missing',
  'Wrong',
  'Damaged',
  'Late',
];

const ITEMS_LIST = [
  'Select item',
  'Tomato · 2 KG',
  'Carrot · 3 KG',
  'Beans · 1 KG',
  'Cabbage · 2 KG',
  'Entire Order',
];

export const M5S16_OrderIssue: React.FC<M5S16Props> = ({
  orderId = 'ORD-1024',
  initialSubmitted = false,
  onNavigate,
  onBack,
}) => {
  const [selectedType, setSelectedType] = useState('Quality');
  const [selectedItem, setSelectedItem] = useState('Select item');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);

  // ─── STATE 2: Issue Submitted (Image 4 Left) ──────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setSubmitted(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Issue Submitted</Text>
          </View>

          <View style={styles.contentPacked}>
            {/* Centered Green Circle Badge */}
            <View style={styles.heroContainer}>
              <View style={styles.successCircleBadge}>
                <BigGreenCheckSuccessIcon />
              </View>
              <Text style={styles.heroTitle}>Issue Submitted</Text>
            </View>

            {/* Summary Card */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Issue ID</Text>
                  <Text style={styles.fieldValue}>ISS-0028</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValue}>Open</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Fixed Action Button: Resolved "Continue in Module 10" to clean "Continue" */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S01')}
            >
              <Text style={styles.submitBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STATE 1: Order Issue Form (Images 2 & 3) ─────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 2 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Issue</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Issue Type (Required) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Issue Type</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>
          <View style={styles.radioListCard}>
            {ISSUE_TYPES.map((type, index) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.radioItem,
                    index < ISSUE_TYPES.length - 1 && styles.radioItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedType(type)}
                >
                  {isSelected ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                  <Text style={styles.radioText}>{type}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 2: Affected Item */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Affected Item</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.7}
            onPress={() => setShowItemPicker(true)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>AFFECTED ITEM</Text>
              <Text style={styles.dropdownValue}>{selectedItem}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Section 3: Affected Quantity (If supported) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Affected Quantity</Text>
            <Text style={styles.optionalText}>If supported</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.singleLineInput}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g. 2 KG"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Section 4: Description (Required) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>
          <View style={styles.notesInputBox}>
            <TextInput
              style={styles.notesTextInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Section 5: Photos */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Photos</Text>
          <TouchableOpacity
            style={styles.photoBox}
            activeOpacity={0.7}
            onPress={() => setHasPhoto(!hasPhoto)}
          >
            <CameraPhotoIcon />
            <Text style={styles.photoText}>{hasPhoto ? 'Photo Added' : 'Add Photo'}</Text>
          </TouchableOpacity>

          {/* Red RMA Alert Box matching Image 3 */}
          <View style={styles.redAlertBox}>
            <InfoCircleRedIcon />
            <Text style={styles.redAlertText}>
              Further RMA/refund processing happens in Module 10 — Returns & Issues. No refund calculation is performed here.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 3 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => setSubmitted(true)}
          >
            <SendPlaneWhiteIcon />
            <Text style={styles.submitBtnText}>Submit Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Item Picker Modal */}
        <Modal
          visible={showItemPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowItemPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowItemPicker(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Affected Item</Text>
              {ITEMS_LIST.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.modalOption,
                    selectedItem === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedItem(item);
                    setShowItemPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedItem === item && styles.modalOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  headerTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FAF8F5',
  },
  subtitleText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7A6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  requiredText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
  },
  optionalText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
  },
  radioListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  radioItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECE4',
  },
  radioText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dropdownContent: {
    flex: 1,
  },
  dropdownLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 2,
  },
  singleLineInput: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    color: '#1D2420',
    height: '100%',
  },
  notesInputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 90,
    marginTop: 2,
  },
  notesTextInput: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13,
    color: '#1D2420',
    textAlignVertical: 'top',
    height: '100%',
  },
  photoBox: {
    width: 68,
    height: 68,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  photoText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  redAlertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  redAlertText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#B91C1C',
    lineHeight: 16,
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  submitBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Issue Submitted Styles (Image 4 Left) ────────────────────────────────
  contentPacked: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successCircleBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 19,
    fontWeight: '700',
    color: '#1D2420',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  fieldValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#FFF7ED',
  },
  modalOptionText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    color: '#334155',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: '#E85226',
  },
});
