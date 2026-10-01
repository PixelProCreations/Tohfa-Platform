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
import { SWA_COLORS, SWA_TYPOGRAPHY } from '../constants';

interface M5S07Props {
  orderId?: string;
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

function GreenCheckboxIcon() {
  return (
    <View style={styles.greenCheckbox}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function EmptyCheckboxIcon() {
  return <View style={styles.emptyCheckbox} />;
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

function InfoCircleBlueIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
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

function CheckmarkWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S07_Packing: React.FC<M5S07Props> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  // Checklist items matching Image 1
  const [checklist, setChecklist] = useState([
    { id: '1', name: 'Tomato · 2 KG', checked: true },
    { id: '2', name: 'Carrot · 3 KG', checked: true },
    { id: '3', name: 'Beans · 1 KG', checked: false },
    { id: '4', name: 'Cabbage · 2 KG', checked: false },
  ]);

  const [packedQty, setPackedQty] = useState('');
  const [packageType, setPackageType] = useState('Select');
  const [showPackagePicker, setShowPackagePicker] = useState(false);
  const [packageCount, setPackageCount] = useState('2');
  const [notes, setNotes] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const toggleCheck = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const checkedCount = checklist.filter(c => c.checked).length;

  const packageOptions = [
    'Select',
    'Crate / Corrugated Box',
    'Plastic Bag',
    'Paper Pouch',
    'Insulated Box',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header - Orange Theme matching Image 1 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Packing</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {orderId} · {checkedCount} / {checklist.length} Items
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Packing Checklist */}
          <Text style={styles.sectionTitle}>Packing Checklist</Text>
          <View style={styles.checklistCard}>
            {checklist.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checklistItem,
                  index < checklist.length - 1 && styles.checklistItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleCheck(item.id)}
              >
                {item.checked ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section 2: Item Detail */}
          <Text style={styles.sectionTitle}>Item Detail</Text>
          <View style={styles.itemDetailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Tomato</Text>
                <Text style={styles.detailValue}>Grade 1</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Cold Storage · Rack 02</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Required</Text>
                <Text style={styles.detailValue}>2 KG</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Packed</Text>
                <Text style={styles.detailValue}>2 KG</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Packed Quantity */}
          <Text style={styles.sectionTitle}>Packed Quantity</Text>
          <View style={styles.packedQtyInputContainer}>
            <TextInput
              style={styles.packedQtyTextInput}
              value={packedQty}
              onChangeText={setPackedQty}
              placeholder=""
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>KG</Text>
          </View>

          {/* Info Alert Box in Blue */}
          <View style={styles.infoBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.infoText}>
              Packed quantity cannot exceed the ordered quantity without a supported exception workflow.
            </Text>
          </View>

          {/* Section 4: Package Information */}
          <Text style={styles.sectionTitle}>Package Information</Text>

          {/* Packaging Type Dropdown */}
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.7}
            onPress={() => setShowPackagePicker(true)}
          >
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>PACKAGING TYPE</Text>
              <Text style={styles.dropdownValue}>{packageType}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Package Count */}
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Package Count</Text>
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.singleLineInput}
              value={packageCount}
              onChangeText={setPackageCount}
              keyboardType="numeric"
            />
          </View>

          {/* Packing Notes */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Packing Notes</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
          <View style={styles.notesInputBox}>
            <TextInput
              style={styles.notesTextInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Photo */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Photo</Text>
            <Text style={styles.optionalText}>If supported</Text>
          </View>
          <TouchableOpacity
            style={styles.photoBox}
            activeOpacity={0.7}
            onPress={() => setHasPhoto(!hasPhoto)}
          >
            <CameraPhotoIcon />
            <Text style={styles.photoText}>{hasPhoto ? 'Photo Added' : 'Add Photo'}</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.confirmBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S08', { orderId })}
          >
            <CheckmarkWhiteIcon />
            <Text style={styles.confirmBtnText}>Confirm Packing</Text>
          </TouchableOpacity>
        </View>

        {/* Packaging Type Modal */}
        <Modal
          visible={showPackagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPackagePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPackagePicker(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Packaging Type</Text>
              {packageOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    packageType === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setPackageType(opt);
                    setShowPackagePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      packageType === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
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
    paddingBottom: 4,
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginTop: 16,
    marginBottom: 8,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECE4',
  },
  greenCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  checklistText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  itemDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 3,
  },
  detailValue: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
  },
  packedQtyInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E85226',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  packedQtyTextInput: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#1D2420',
    height: '100%',
  },
  unitText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  infoBox: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 16,
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
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  labelWithOptionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  optionalText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  textInputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  singleLineInput: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '600',
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
    height: 76,
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
  },
  photoText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  confirmBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
