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
import Svg, { Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

function LockSmallIcon({ size = 13, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UploadArrowIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 17V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20h16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Dropdown Options ─────────────────────────────────────────────────────────

// Exact list matching Screenshot 4
const FARMING_CATEGORIES = [
  'Select',
  'Organic Farming',
  'Soil Health',
  'Crop Cultivation',
  'Pest & Disease Management',
  'Irrigation & Water Management',
  'Composting',
  'Harvesting & Post-Harvest Handling',
  'Government Schemes and Farming Updates',
];

// Matching User Prompt: "and in lanagage tamil,english"
const VIDEO_LANGUAGES = ['Select', 'Tamil', 'English'];

const AVAILABLE_CROPS = ['Tomato', 'Beans', 'Cabbage', 'Carrot', 'Potato', 'Garlic'];

const FARMING_TYPES = ['Natural', 'Organic', 'Bio-dynamic'];

// Matching User Prompt: "in sleect videosource direct"
const VIDEO_SOURCES = ['Select', 'Direct', 'YouTube', 'Vimeo', 'External Link'];

// Exact list matching Screenshot 5
const SEND_TO_OPTIONS = ['All', 'Communities', 'Groups', 'All Farmers'];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface AddVideoScreenProps {
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

export function AddVideoScreen({ onBack, onSubmitSuccess }: AddVideoScreenProps) {
  // 1 · Basic information State (Screenshot 1)
  const [videoTitle, setVideoTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [farmingCategory, setFarmingCategory] = useState('Select');
  const [language, setLanguage] = useState('Select');

  // 2 · Farming information State (Screenshots 1 & 2)
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [selectedFarmingType, setSelectedFarmingType] = useState<string>('Natural');
  const [referenceSources, setReferenceSources] = useState('');

  // Video source and media State (Screenshots 2 & 3)
  const [videoSource, setVideoSource] = useState('Select');
  const [thumbnailImage, setThumbnailImage] = useState('');
  const [videoLinkOrUpload, setVideoLinkOrUpload] = useState('');

  // 4 · Publishing settings State (Screenshots 2, 3, 5)
  const [sendTo, setSendTo] = useState('All');

  // Modal Dropdown States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVideoSourceModal, setShowVideoSourceModal] = useState(false);
  const [showSendToModal, setShowSendToModal] = useState(false);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleUploadThumbnail = () => {
    Alert.alert('Upload Thumbnail', 'Image picker opened to select video thumbnail.');
  };

  const handleUploadVideo = () => {
    Alert.alert('Upload Video', 'Media picker opened to upload or link video file.');
  };

  const handleAddAttachments = () => {
    Alert.alert('Add Attachments', 'Document picker opened (JPG, PNG or PDF, up to 10 MB).');
  };

  const handleSubmitForReview = () => {
    const effectiveVideoTitle = videoTitle.trim() || 'Mulching for water retention';

    Alert.alert(
      'Submit for Review',
      `Submit video "${effectiveVideoTitle}" for review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => {
            Alert.alert('Success', 'Video submitted for moderation review successfully.');
            if (onSubmitSuccess) onSubmitSuccess();
            else onBack();
          },
        },
      ]
    );
  };

  const handlePublish = () => {
    if (!videoTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a video title.');
      return;
    }
    Alert.alert(
      'Publish Video',
      `Publish "${videoTitle}" immediately to ${sendTo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: () => {
            Alert.alert('Published', `Video published to ${sendTo} successfully.`);
            if (onSubmitSuccess) onSubmitSuccess();
            else onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowWhiteIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add video</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            1 · BASIC INFORMATION (Screenshot 1)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionHeader}>1 · Basic information</Text>

        {/* Content type (Lock) */}
        <View style={styles.labelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Content type</Text>
          <LockSmallIcon size={13} color={adminColors.muted} />
        </View>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>Video</Text>
        </View>

        {/* Video title * */}
        <Text style={styles.fieldLabel}>
          Video title<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TextInput
          style={styles.singleLineInput}
          value={videoTitle}
          onChangeText={setVideoTitle}
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
        />

        {/* Short description * */}
        <Text style={styles.fieldLabel}>
          Short description<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TextInput
          style={[styles.multilineInput, { minHeight: 74 }]}
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
          multiline
          numberOfLines={3}
        />

        {/* Farming category * (Screenshot 4) */}
        <Text style={styles.fieldLabel}>
          Farming category<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              farmingCategory === 'Select' && { color: adminColors.muted },
            ]}
          >
            {farmingCategory}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>
        <Text style={styles.categoryConfirmCaption}>
          The category list is suggested; TOHFA confirms it.
        </Text>

        {/* Language * (User requested: Tamil, English) */}
        <Text style={styles.fieldLabel}>
          Language<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              language === 'Select' && { color: adminColors.muted },
            ]}
          >
            {language}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Author (Lock) */}
        <View style={styles.labelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Author</Text>
          <LockSmallIcon size={13} color={adminColors.muted} />
        </View>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>Super Admin</Text>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            2 · FARMING INFORMATION (Screenshots 1 & 2)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>2 · Farming information</Text>

        {/* Related crops */}
        <Text style={styles.fieldLabel}>Related crops</Text>
        <View style={styles.chipsRow}>
          {AVAILABLE_CROPS.map((crop) => {
            const isSelected = selectedCrops.includes(crop);
            return (
              <TouchableOpacity
                key={crop}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => toggleCrop(crop)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {crop}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Farming types */}
        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Farming types</Text>
        <View style={styles.chipsRow}>
          {FARMING_TYPES.map((type) => {
            const isSelected = selectedFarmingType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedFarmingType(type)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reference sources */}
        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Reference sources</Text>
        <TextInput
          style={[styles.multilineInput, { minHeight: 74 }]}
          value={referenceSources}
          onChangeText={setReferenceSources}
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
          multiline
        />
        <Text style={styles.helperText}>
          Required for crop-specific and pest and disease content.
        </Text>

        {/* ══════════════════════════════════════════════════════════════════════
            VIDEO SOURCE AND MEDIA (Screenshots 2 & 3)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Video source and media</Text>

        {/* Video source * */}
        <Text style={styles.fieldLabel}>
          Video source<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowVideoSourceModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              videoSource === 'Select' && { color: adminColors.muted },
            ]}
          >
            {videoSource}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Thumbnail image with Upload square button */}
        <Text style={styles.fieldLabel}>Thumbnail image</Text>
        <View style={styles.inputWithUploadBtnRow}>
          <TextInput
            style={[styles.singleLineInput, { flex: 1 }]}
            value={thumbnailImage}
            onChangeText={setThumbnailImage}
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
          />
          <TouchableOpacity
            style={styles.uploadSquareBtn}
            onPress={handleUploadThumbnail}
            activeOpacity={0.7}
          >
            <UploadArrowIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Video link or Upload with Upload square button */}
        <Text style={styles.fieldLabel}>Video link or Upload</Text>
        <View style={styles.inputWithUploadBtnRow}>
          <TextInput
            style={[styles.singleLineInput, { flex: 1 }]}
            value={videoLinkOrUpload}
            onChangeText={setVideoLinkOrUpload}
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
          />
          <TouchableOpacity
            style={styles.uploadSquareBtn}
            onPress={handleUploadVideo}
            activeOpacity={0.7}
          >
            <UploadArrowIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            3 · ATTACHMENTS (Screenshots 2 & 3)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>3 · Attachments</Text>

        <TouchableOpacity
          style={styles.attachmentDashedBtn}
          onPress={handleAddAttachments}
          activeOpacity={0.75}
        >
          <Text style={styles.attachmentDashedBtnText}>Add images or PDF documents</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          JPG, PNG or PDF, up to 10 MB (proposed). Checked again on the server.
        </Text>

        {/* ══════════════════════════════════════════════════════════════════════
            4 · PUBLISHING SETTINGS (Screenshots 2, 3, 5)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>4 · Publishing settings</Text>

        {/* Send to * (Screenshot 5: All, Communities, Groups, All Farmers) */}
        <Text style={styles.fieldLabel}>
          Send to<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowSendToModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{sendTo}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Publish date (Lock) */}
        <View style={styles.labelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Publish date</Text>
          <LockSmallIcon size={13} color={adminColors.muted} />
        </View>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>Immediate (scheduling is not supported)</Text>
        </View>
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshots 1, 2, 3) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={styles.submitSolidBtn}
          onPress={handleSubmitForReview}
          activeOpacity={0.85}
        >
          <Text style={styles.submitSolidBtnText}>Submit for Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.publishOutlineBtn}
          onPress={handlePublish}
          activeOpacity={0.75}
        >
          <Text style={styles.publishOutlineBtnText}>Publish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelOutlineBtn}
          onPress={onBack}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelOutlineBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          DROPDOWN MODALS
         ══════════════════════════════════════════════════════════════════════ */}

      {/* Farming Category Modal (Screenshot 4) */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.categoryDropdownHeader}>
              <Text style={styles.categoryDropdownHeaderText}>Select</Text>
            </View>
            {FARMING_CATEGORIES.filter((c) => c !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  farmingCategory === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setFarmingCategory(item);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    farmingCategory === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Modal (Tamil, English per user request) */}
      <Modal visible={showLanguageModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.categoryDropdownHeader}>
              <Text style={styles.categoryDropdownHeaderText}>Select</Text>
            </View>
            {VIDEO_LANGUAGES.filter((l) => l !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  language === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setLanguage(item);
                  setShowLanguageModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    language === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Video Source Modal (Direct, YouTube, Vimeo, External Link) */}
      <Modal visible={showVideoSourceModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVideoSourceModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.categoryDropdownHeader}>
              <Text style={styles.categoryDropdownHeaderText}>Select</Text>
            </View>
            {VIDEO_SOURCES.filter((s) => s !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  videoSource === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setVideoSource(item);
                  setShowVideoSourceModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    videoSource === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Send To Modal (Screenshot 5: All, Communities, Groups, All Farmers) */}
      <Modal visible={showSendToModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSendToModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.categoryDropdownHeader}>
              <Text style={styles.categoryDropdownHeaderText}>All</Text>
            </View>
            {SEND_TO_OPTIONS.filter((s) => s !== 'All').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  sendTo === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setSendTo(item);
                  setShowSendToModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    sendTo === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived From Admin Theme ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: 110,
  },

  sectionHeader: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  requiredAsterisk: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  labelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 5,
  },
  fieldLabelNoMargin: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 11.5,
    fontWeight: '700',
  },

  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  dropdownValueText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.ink,
    fontWeight: '600',
  },

  categoryConfirmCaption: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 4,
  },

  singleLineInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 12.5,
    color: adminColors.ink,
  },
  multilineInput: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 64,
    fontSize: 12.5,
    color: adminColors.ink,
    textAlignVertical: 'top',
  },

  readOnlyInput: {
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  readOnlyText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.muted,
  },

  // ─── Upload Row ───
  inputWithUploadBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadSquareBtn: {
    width: 44,
    height: 44,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Dashed Attachment Button ───
  attachmentDashedBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderStyle: 'dashed',
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  attachmentDashedBtnText: {
    ...adminType.body,
    color: adminColors.brand,
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ─── Chips ───
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  chipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },

  helperText: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 4,
  },

  // ─── Docked Footer ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 12,
  },
  submitSolidBtn: {
    flex: 1.2,
    height: 44,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitSolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  publishOutlineBtn: {
    flex: 1,
    height: 44,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishOutlineBtnText: {
    color: adminColors.brand,
    fontSize: 12.5,
    fontWeight: '700',
  },
  cancelOutlineBtn: {
    flex: 0.9,
    height: 44,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineBtnText: {
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ─── Dropdown Modals ───
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dropdownMenuCard: {
    width: '90%',
    maxHeight: '75%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  categoryDropdownHeader: {
    backgroundColor: adminColors.muted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryDropdownHeaderText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontSize: 12.5,
    fontWeight: '700',
  },
  dropdownMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  dropdownMenuItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownMenuItemText: {
    ...adminType.body,
    fontSize: 12.5,
    color: adminColors.ink,
  },
  dropdownMenuItemTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
});
