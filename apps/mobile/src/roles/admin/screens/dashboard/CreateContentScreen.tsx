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

// ─── Constants ───────────────────────────────────────────────────────────────

export type ContentTypeOption = 'Article' | 'Farming Guide' | 'Information' | 'Announcement' | 'Video';

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  'Article',
  'Farming Guide',
  'Information',
  'Announcement',
  'Video',
];

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

const AVAILABLE_CROPS = ['Tomato', 'Beans', 'Cabbage', 'Carrot', 'Potato', 'Garlic'];

const FARMING_TYPES = ['Natural', 'Organic', 'Bio-dynamic'];

const VISIBILITY_OPTIONS = ['Everyone', 'Members Only', 'Admins Only'];

const ANNOUNCEMENT_CATEGORIES = [
  'Select',
  'General Announcement',
  'Weather Alert',
  'Price & Market Update',
  'Scheme & Policy',
  'Operations & Logistics',
  'Training & Workshop',
];

const AUDIENCE_OPTIONS = [
  'All',
  'All Farmers',
  'Sub-Warehouse Managers',
  'Buyers & Retailers',
  'Field Officers',
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CreateContentInitialData {
  contentType?: ContentTypeOption;
  title?: string;
  shortDescription?: string;
  farmingCategory?: string;
  selectedCrops?: string[];
  selectedFarmingType?: string;
  suitableConditions?: string;
  instructions?: string;
  precautions?: string;
  referenceSources?: string;
  visibility?: string;
  announcementTitle?: string;
  shortSummary?: string;
  fullDescription?: string;
  announcementCategory?: string;
  audience?: string;
}

export interface CreateContentScreenProps {
  initialType?: ContentTypeOption | undefined;
  initialData?: CreateContentInitialData | undefined;
  onBack: () => void;
  onSubmitSuccess?: (() => void) | undefined;
  onNavigateAddVideo?: (() => void) | undefined;
}

export function CreateContentScreen({
  initialType = 'Article',
  initialData,
  onBack,
  onSubmitSuccess,
  onNavigateAddVideo,
}: CreateContentScreenProps) {
  // Common / Article Form State
  const [contentType, setContentType] = useState<ContentTypeOption>(
    initialData?.contentType || initialType
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [farmingCategory, setFarmingCategory] = useState(initialData?.farmingCategory || 'Select');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(initialData?.selectedCrops || []);
  const [selectedFarmingType, setSelectedFarmingType] = useState<string>(initialData?.selectedFarmingType || 'Natural');
  const [suitableConditions, setSuitableConditions] = useState(initialData?.suitableConditions || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [precautions, setPrecautions] = useState(initialData?.precautions || '');
  const [referenceSources, setReferenceSources] = useState(initialData?.referenceSources || '');
  const [visibility, setVisibility] = useState(initialData?.visibility || 'Everyone');

  // Announcement Form State (Matching Screenshot 6)
  const [announcementTitle, setAnnouncementTitle] = useState(initialData?.announcementTitle || '');
  const [shortSummary, setShortSummary] = useState(initialData?.shortSummary || '');
  const [fullDescription, setFullDescription] = useState(initialData?.fullDescription || '');
  const [announcementCategory, setAnnouncementCategory] = useState(initialData?.announcementCategory || 'Select');
  const [audience, setAudience] = useState(initialData?.audience || 'All');

  React.useEffect(() => {
    if (initialData) {
      if (initialData.contentType) setContentType(initialData.contentType);
      if (initialData.title !== undefined) setTitle(initialData.title);
      if (initialData.shortDescription !== undefined) setShortDescription(initialData.shortDescription);
      if (initialData.farmingCategory) setFarmingCategory(initialData.farmingCategory);
      if (initialData.selectedCrops) setSelectedCrops(initialData.selectedCrops);
      if (initialData.selectedFarmingType) setSelectedFarmingType(initialData.selectedFarmingType);
      if (initialData.suitableConditions !== undefined) setSuitableConditions(initialData.suitableConditions);
      if (initialData.instructions !== undefined) setInstructions(initialData.instructions);
      if (initialData.precautions !== undefined) setPrecautions(initialData.precautions);
      if (initialData.referenceSources !== undefined) setReferenceSources(initialData.referenceSources);
      if (initialData.visibility) setVisibility(initialData.visibility);
      if (initialData.announcementTitle !== undefined) setAnnouncementTitle(initialData.announcementTitle);
      if (initialData.shortSummary !== undefined) setShortSummary(initialData.shortSummary);
      if (initialData.fullDescription !== undefined) setFullDescription(initialData.fullDescription);
      if (initialData.announcementCategory) setAnnouncementCategory(initialData.announcementCategory);
      if (initialData.audience) setAudience(initialData.audience);
    }
  }, [initialData]);

  // Modal Dropdowns
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showAnnouncementCategoryDropdown, setShowAnnouncementCategoryDropdown] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);

  const isAnnouncement = contentType === 'Announcement';

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleSubmitForReview = () => {
    if (isAnnouncement) {
      if (!announcementTitle.trim()) {
        Alert.alert('Required Field', 'Please enter an announcement title.');
        return;
      }
      if (!shortSummary.trim()) {
        Alert.alert('Required Field', 'Please enter a short summary.');
        return;
      }
      if (!fullDescription.trim()) {
        Alert.alert('Required Field', 'Please enter full description.');
        return;
      }
      Alert.alert(
        'Submit for Review',
        `Submit announcement "${announcementTitle}" for moderation review?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            style: 'default',
            onPress: () => {
              Alert.alert('Success', 'Announcement submitted for review successfully.');
              if (onSubmitSuccess) onSubmitSuccess();
              else onBack();
            },
          },
        ]
      );
      return;
    }

    const effectiveTitle = title.trim() || 'Mulching for water retention';
    Alert.alert(
      'Submit for Review',
      `Submit "${effectiveTitle}" (${contentType}) for moderation review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => {
            Alert.alert('Success', 'Content submitted for review successfully.');
            if (onSubmitSuccess) onSubmitSuccess();
            else onBack();
          },
        },
      ]
    );
  };

  const handlePublish = () => {
    if (isAnnouncement) {
      if (!announcementTitle.trim()) {
        Alert.alert('Required Field', 'Please enter an announcement title.');
        return;
      }
      Alert.alert(
        'Publish Announcement',
        `Are you sure you want to immediately publish "${announcementTitle}" to ${audience}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Publish',
            style: 'default',
            onPress: () => {
              Alert.alert('Published', `Announcement broadcasted to ${audience} successfully.`);
              if (onSubmitSuccess) onSubmitSuccess();
              else onBack();
            },
          },
        ]
      );
      return;
    }

    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for the content.');
      return;
    }
    Alert.alert(
      'Publish Content',
      `Are you sure you want to immediately publish "${title}" to ${visibility}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: () => {
            Alert.alert('Published', 'Content published successfully.');
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

      {/* ─── Orange Terracotta Header ─── */}
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
          <Text style={styles.headerTitle}>Create Content</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            1 · BASIC INFORMATION (Screenshots 3 & 5)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionHeader}>1 · Basic information</Text>

        {/* Content Type Dropdown */}
        <Text style={styles.fieldLabel}>Content type</Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowTypeDropdown(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{contentType}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {isAnnouncement ? (
          /* ══════════════════════════════════════════════════════════════════════
              ANNOUNCEMENT FORM (Matching User Screenshot 6 Exactly)
             ══════════════════════════════════════════════════════════════════════ */
          <>
            {/* Announcement title * */}
            <Text style={styles.fieldLabel}>
              Announcement title<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={styles.singleLineInput}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
            />

            {/* Short summary * */}
            <Text style={styles.fieldLabel}>
              Short summary<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={[styles.multilineInput, { minHeight: 74 }]}
              value={shortSummary}
              onChangeText={setShortSummary}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
            />

            {/* Full description * */}
            <Text style={styles.fieldLabel}>
              Full description<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={[styles.multilineInput, { minHeight: 120 }]}
              value={fullDescription}
              onChangeText={setFullDescription}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={5}
            />

            {/* Category * */}
            <Text style={styles.fieldLabel}>
              Category<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowAnnouncementCategoryDropdown(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dropdownValueText,
                  announcementCategory === 'Select' && { color: adminColors.muted },
                ]}
              >
                {announcementCategory}
              </Text>
              <ChevronDownIcon size={16} />
            </TouchableOpacity>

            {/* Audience selection Section (Screenshot 6) */}
            <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Audience selection</Text>

            {/* Send to * */}
            <Text style={styles.fieldLabel}>
              Send to<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowAudienceDropdown(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownValueText}>{audience}</Text>
              <ChevronDownIcon size={16} />
            </TouchableOpacity>

            {/* Scheduling Section (Screenshot 6) */}
            <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Scheduling</Text>

            {/* Publication (Lock) */}
            <View style={styles.labelWithIconRow}>
              <Text style={styles.fieldLabelNoMargin}>Publication</Text>
              <LockSmallIcon size={13} color={adminColors.muted} />
            </View>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>Publish immediately</Text>
            </View>
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
              ARTICLE / FARMING GUIDE FORM (Screenshots 3, 4, 5)
             ══════════════════════════════════════════════════════════════════════ */
          <>
            {/* Dynamic Title Input */}
            <Text style={styles.fieldLabel}>
              {`${contentType} title`}<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={styles.singleLineInput}
              value={title}
              onChangeText={setTitle}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
            />

            {/* Short Description Input */}
            <Text style={styles.fieldLabel}>
              Short description<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={styles.multilineInput}
              value={shortDescription}
              onChangeText={setShortDescription}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
            />

            {/* Farming Category Dropdown (Screenshot 5) */}
            <Text style={styles.fieldLabel}>
              Farming category<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowCategoryDropdown(true)}
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

            {/* Author (Read-only lock) */}
            <View style={styles.labelWithIconRow}>
              <Text style={styles.fieldLabelNoMargin}>Author</Text>
              <LockSmallIcon size={13} color={adminColors.muted} />
            </View>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>Super Admin</Text>
            </View>

            {/* 2 · Farming information */}
            <Text style={[styles.sectionHeader, { marginTop: 22 }]}>2 · Farming information</Text>

            {/* Related Crops Multi-select chips */}
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

            {/* Farming Types Chips */}
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

            {/* Suitable Conditions */}
            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Suitable conditions</Text>
            <TextInput
              style={styles.singleLineInput}
              value={suitableConditions}
              onChangeText={setSuitableConditions}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
            />

            {/* Instructions */}
            <Text style={styles.fieldLabel}>
              Instructions<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={[styles.multilineInput, { minHeight: 88 }]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
            />

            {/* Notice Warning Text (Screenshot 4) */}
            <Text style={styles.warningNoticeText}>
              Do not enter an unverified dose, water or nutrient amount.
            </Text>

            {/* Precautions */}
            <Text style={styles.fieldLabel}>Precautions (verified)</Text>
            <TextInput
              style={styles.multilineInput}
              value={precautions}
              onChangeText={setPrecautions}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
            />

            {/* Reference Sources */}
            <Text style={styles.fieldLabel}>
              Reference sources (one link or document reference per line)
            </Text>
            <TextInput
              style={styles.multilineInput}
              value={referenceSources}
              onChangeText={setReferenceSources}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              multiline
            />
            <Text style={styles.helperText}>
              Required for crop-specific and pest and disease content.
            </Text>

            {/* 3 · Attachments */}
            <Text style={[styles.sectionHeader, { marginTop: 22 }]}>3 · Attachments</Text>

            <TouchableOpacity
              style={styles.addAttachmentBtn}
              onPress={() => Alert.alert('Add Attachments', 'Document picker simulated.')}
              activeOpacity={0.75}
            >
              <Text style={styles.addAttachmentBtnText}>Add images or PDF documents</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              JPG, PNG or PDF, up to 10 MB (proposed). Checked again on the server.
            </Text>

            {/* 4 · Publishing settings */}
            <Text style={[styles.sectionHeader, { marginTop: 22 }]}>4 · Publishing settings</Text>

            {/* Visibility */}
            <Text style={styles.fieldLabel}>Visibility</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setShowVisibilityDropdown(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownValueText}>{visibility}</Text>
              <ChevronDownIcon size={16} />
            </TouchableOpacity>

            {/* Publish Date (Lock) */}
            <View style={styles.labelWithIconRow}>
              <Text style={styles.fieldLabelNoMargin}>Publish date</Text>
              <LockSmallIcon size={13} color={adminColors.muted} />
            </View>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>Immediate (scheduling is not supported)</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshot 4) ─── */}
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

      {/* ─── Dropdown Modal: Content Type ─── */}
      <Modal visible={showTypeDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeDropdown(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Content Type</Text>
            </View>
            {CONTENT_TYPE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  contentType === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setShowTypeDropdown(false);
                  if (item === 'Video') {
                    if (onNavigateAddVideo) onNavigateAddVideo();
                    return;
                  }
                  setContentType(item);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    contentType === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Dropdown Modal: Farming Category (Matching Screenshot 5) ─── */}
      <Modal visible={showCategoryDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryDropdown(false)}
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
                  setShowCategoryDropdown(false);
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

      {/* ─── Dropdown Modal: Visibility ─── */}
      <Modal visible={showVisibilityDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVisibilityDropdown(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Visibility</Text>
            </View>
            {VISIBILITY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  visibility === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setVisibility(item);
                  setShowVisibilityDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    visibility === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Dropdown Modal: Announcement Category (Screenshot 6) ─── */}
      <Modal visible={showAnnouncementCategoryDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAnnouncementCategoryDropdown(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.categoryDropdownHeader}>
              <Text style={styles.categoryDropdownHeaderText}>Select</Text>
            </View>
            {ANNOUNCEMENT_CATEGORIES.filter((c) => c !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  announcementCategory === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setAnnouncementCategory(item);
                  setShowAnnouncementCategoryDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    announcementCategory === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Dropdown Modal: Audience / Send To (Screenshot 6) ─── */}
      <Modal visible={showAudienceDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAudienceDropdown(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Send to</Text>
            </View>
            {AUDIENCE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  audience === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setAudience(item);
                  setShowAudienceDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    audience === item && styles.dropdownMenuItemTextActive,
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
    ...adminShadow.sm,
  },
  chipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  chipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipTextActive: {
    color: adminColors.brandDeep,
  },

  warningNoticeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  helperText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },

  addAttachmentBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginTop: 4,
  },
  addAttachmentBtnText: {
    ...adminType.body,
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '800',
  },

  // ─── Docked Footer Actions ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  submitSolidBtn: {
    flex: 1.2,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  submitSolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  publishOutlineBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishOutlineBtnText: {
    color: adminColors.brand,
    fontSize: 12.5,
    fontWeight: '800',
  },
  cancelOutlineBtn: {
    flex: 0.9,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineBtnText: {
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ─── Dropdown Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  dropdownMenuCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    overflow: 'hidden',
    ...adminShadow.md,
  },
  dropdownHeaderRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  dropdownHeaderTitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  categoryDropdownHeader: {
    backgroundColor: adminColors.muted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryDropdownHeaderText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontSize: 13,
    fontWeight: '800',
  },
  dropdownMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownMenuItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownMenuItemText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '600',
  },
  dropdownMenuItemTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
});
