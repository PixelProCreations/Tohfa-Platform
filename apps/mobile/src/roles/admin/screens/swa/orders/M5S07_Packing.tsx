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
import { ORDERS_THEME } from './theme';

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
        stroke={ORDERS_THEME.textSecondary}
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
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.info} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={ORDERS_THEME.info} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CameraPhotoIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={ORDERS_THEME.textSecondary}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={ORDERS_THEME.textSecondary} strokeWidth="1.8" />
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
        {/* Top Header */}
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

          {/* Info Alert Box */}
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

          {/* Package Count Field */}
          <View style={styles.textInputBox}>
            <TextInput
              style={styles.singleLineInput}
              value={packageCount}
              onChangeText={setPackageCount}
              placeholder="Number of packages"
              placeholderTextColor={ORDERS_THEME.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Section 5: Packing Notes */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Packing Notes</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
          <View style={styles.notesInputBox}>
            <TextInput
              style={styles.notesTextInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add packing observations or special handling..."
              placeholderTextColor={ORDERS_THEME.textSecondary}
              multiline
            />
          </View>

          {/* Section 6: Package Photo */}
          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Package Photo</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
          <TouchableOpacity
            style={styles.photoBox}
            activeOpacity={0.7}
            onPress={() => setHasPhoto(!hasPhoto)}
          >
            <CameraPhotoIcon />
            <Text style={styles.photoText}>{hasPhoto ? '1 Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Bar */}
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

        {/* Package Picker Modal */}
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
              {packageOptions.map(opt => (
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
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  subtitleRow: {
    backgroundColor: ORDERS_THEME.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12.5,
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    marginTop: 16,
    marginBottom: 8,
  },
  checklistCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ORDERS_THEME.border,
  },
  greenCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: ORDERS_THEME.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.border,
    backgroundColor: ORDERS_THEME.cardBg,
    marginRight: 12,
  },
  checklistText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  itemDetailCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 3,
  },
  detailValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  packedQtyInputContainer: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.primary,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  packedQtyTextInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: ORDERS_THEME.textInk,
    height: '100%',
  },
  unitText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: ORDERS_THEME.textSecondary,
  },
  infoBox: {
    backgroundColor: ORDERS_THEME.infoBg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: ORDERS_THEME.info,
    lineHeight: 16,
  },
  dropdownBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
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
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: ORDERS_THEME.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownValue: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '600',
    color: ORDERS_THEME.textInk,
  },
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  labelWithOptionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  optionalText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
  },
  textInputBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  singleLineInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: ORDERS_THEME.textInk,
    height: '100%',
  },
  notesInputBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: 76,
  },
  notesTextInput: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: ORDERS_THEME.textInk,
    textAlignVertical: 'top',
    height: '100%',
  },
  photoBox: {
    width: 68,
    height: 68,
    borderRadius: ORDERS_THEME.radiusSM,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.border,
    borderStyle: 'dashed',
    backgroundColor: ORDERS_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '600',
    color: ORDERS_THEME.textSecondary,
    marginTop: 4,
  },
  bottomBar: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  confirmBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    fontFamily: 'Poppins',
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
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    padding: 18,
  },
  modalTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    marginBottom: 12,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: ORDERS_THEME.radiusXS,
  },
  modalOptionSelected: {
    backgroundColor: ORDERS_THEME.orangeTint,
  },
  modalOptionText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    color: ORDERS_THEME.textInk,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: ORDERS_THEME.primary,
  },
});
