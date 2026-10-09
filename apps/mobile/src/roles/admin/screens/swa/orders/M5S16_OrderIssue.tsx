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
        stroke={ORDERS_THEME.textSecondary}
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
        stroke={ORDERS_THEME.textSecondary}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={ORDERS_THEME.textSecondary} strokeWidth="1.8" />
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
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={ORDERS_THEME.primary} strokeWidth="2.2" />
      <Circle cx="12" cy="12" r="4.5" fill={ORDERS_THEME.primary} />
    </Svg>
  );
}

function RadioUnselectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={ORDERS_THEME.border} strokeWidth="2" />
    </Svg>
  );
}

function InfoCircleRedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.danger} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={ORDERS_THEME.danger} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export const M5S16_OrderIssue: React.FC<M5S16Props> = ({
  orderId = 'ORD-1024',
  onNavigate,
  onBack,
}) => {
  const issueTypes = [
    'Quality',
    'Quantity',
    'Missing',
    'Wrong',
    'Damaged',
    'Late',
  ];

  const [issueType, setIssueType] = useState('Quality');
  const [selectedItem, setSelectedItem] = useState('Select item');
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [affectedQty, setAffectedQty] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const orderItems = [
    'Tomato - Grade 1 (2 KG)',
    'Carrot - Grade 1 (3 KG)',
    'Potato - Grade 1 (5 KG)',
    'Whole Order',
  ];

  const handleSubmit = () => {
    onNavigate('M5S16B', {
      orderId,
      issueId: 'ISS-0028',
      category: issueType,
      item: selectedItem,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
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

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Label: Order ID */}
          <Text style={styles.orderRefLabel}>{orderId}</Text>

          {/* Section: Issue Type (Required) */}
          <View style={styles.sectionHeaderRowTop}>
            <Text style={styles.sectionHeading}>Issue Type</Text>
            <Text style={styles.helperLabel}>Required</Text>
          </View>

          {/* Issue Type Card with all 6 options */}
          <View style={styles.categoryCard}>
            {issueTypes.map((type, index) => {
              const isSelected = issueType === type;
              const isLast = index === issueTypes.length - 1;
              return (
                <React.Fragment key={type}>
                  <TouchableOpacity
                    style={styles.radioRow}
                    activeOpacity={0.75}
                    onPress={() => setIssueType(type)}
                  >
                    {isSelected ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                    <Text style={styles.radioText}>{type}</Text>
                  </TouchableOpacity>
                  {!isLast && <View style={styles.cardDivider} />}
                </React.Fragment>
              );
            })}
          </View>

          {/* Affected Item Section */}
          <Text style={styles.sectionHeading}>Affected Item</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            activeOpacity={0.75}
            onPress={() => setShowItemPicker(true)}
          >
            <View style={styles.dropdownTextWrap}>
              <Text style={styles.dropdownCaption}>AFFECTED ITEM</Text>
              <Text style={[styles.dropdownValue, selectedItem === 'Select item' && styles.dropdownPlaceholder]}>
                {selectedItem}
              </Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Affected Quantity Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Affected Quantity</Text>
            <Text style={styles.helperLabel}>If supported</Text>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2 KG"
              placeholderTextColor={ORDERS_THEME.textSecondary}
              value={affectedQty}
              onChangeText={setAffectedQty}
            />
          </View>

          {/* Description Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.helperLabel}>Required</Text>
          </View>
          <View style={styles.textareaBox}>
            <TextInput
              style={styles.textareaInput}
              placeholder="Describe the issue..."
              placeholderTextColor={ORDERS_THEME.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Photos Section */}
          <Text style={styles.sectionHeading}>Photos</Text>
          <TouchableOpacity
            style={[styles.photoBox, hasPhoto && styles.photoBoxActive]}
            activeOpacity={0.75}
            onPress={() => setHasPhoto(!hasPhoto)}
          >
            <CameraPhotoIcon />
            <Text style={styles.photoBoxText}>{hasPhoto ? '1 Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>

          {/* Red Alert Notice Box */}
          <View style={styles.noticeBox}>
            <View style={styles.noticeIconWrap}>
              <InfoCircleRedIcon />
            </View>
            <Text style={styles.noticeText}>
              Further RMA/refund processing happens in Module 10 — Returns & Issues. No refund calculation is performed here.
            </Text>
          </View>

          {/* Submit Issue Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={handleSubmit}
          >
            <SendPlaneWhiteIcon />
            <Text style={styles.submitBtnText}>Submit Issue</Text>
          </TouchableOpacity>

          <View style={{ height: 28 }} />
        </ScrollView>

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
              {orderItems.map((item) => (
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
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  orderRefLabel: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 8,
    paddingLeft: 2,
  },
  sectionHeaderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  radioText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  cardDivider: {
    height: 1,
    backgroundColor: ORDERS_THEME.border,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  helperLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownCaption: {
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
  dropdownPlaceholder: {
    color: ORDERS_THEME.textSecondary,
  },
  inputBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    height: 46,
    paddingHorizontal: 14,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    color: ORDERS_THEME.textInk,
    paddingVertical: 0,
  },
  textareaBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    height: 85,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textareaInput: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: ORDERS_THEME.textInk,
    textAlignVertical: 'top',
    height: '100%',
  },
  photoBox: {
    width: 72,
    height: 72,
    borderRadius: ORDERS_THEME.radiusSM,
    borderWidth: 1.5,
    borderColor: ORDERS_THEME.border,
    borderStyle: 'dashed',
    backgroundColor: ORDERS_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  photoBoxActive: {
    borderColor: ORDERS_THEME.primary,
    backgroundColor: ORDERS_THEME.orangeTint,
  },
  photoBoxText: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '600',
    color: ORDERS_THEME.textSecondary,
    marginTop: 4,
  },
  noticeBox: {
    backgroundColor: ORDERS_THEME.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: ORDERS_THEME.danger,
    lineHeight: 16,
  },
  submitBtn: {
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
  submitBtnText: {
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
