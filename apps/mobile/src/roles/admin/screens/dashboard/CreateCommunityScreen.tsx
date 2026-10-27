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

// ─── Option Constants ─────────────────────────────────────────────────────────

const COMMUNITY_CATEGORIES = [
  'Select',
  'Regional Farmer Communities',
  'Crop & Soil Specialization',
  'Organic & Bio-Dynamic',
  'Women in Farming',
  'Youth & Agritech',
  'General Farming Forum',
];

const COMMUNITY_LANGUAGES = ['Select', 'English', 'Tamil', 'Malayalam', 'Hindi', 'Kannada'];

const VISIBILITY_OPTIONS = ['Select', 'Public', 'Private', 'Restricted'];

const MEMBERSHIP_METHODS = ['Select', 'Open to all', 'Request to join', 'Invite only'];

const POSTING_PERMISSIONS = ['Select', 'All members', 'Verified farmers only', 'Admins only'];

const DISCUSSION_PERMISSIONS = ['Select', 'All members', 'Verified farmers only', 'Admins only'];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CreateCommunityScreenProps {
  onBack: () => void;
  onSubmitSuccess?: () => void;
}

export function CreateCommunityScreen({ onBack, onSubmitSuccess }: CreateCommunityScreenProps) {
  // Community Details State (Screenshot 1)
  const [communityName, setCommunityName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [communityCategory, setCommunityCategory] = useState('Select');
  const [language, setLanguage] = useState('Select');
  const [communityRules, setCommunityRules] = useState('');

  // Community Settings State (Screenshots 1 & 2)
  const [communityVisibility, setCommunityVisibility] = useState('Select');
  const [membershipMethod, setMembershipMethod] = useState('Select');
  const [postingPermissions, setPostingPermissions] = useState('Select');
  const [discussionPermissions, setDiscussionPermissions] = useState('Select');

  // Modal Dropdown Visibility States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);

  const handleUploadImage = () => {
    Alert.alert('Upload Cover Image', 'Cover image selector opened.');
  };

  const handleCreateCommunity = () => {
    if (!communityName.trim()) {
      Alert.alert('Required Field', 'Please enter a community name.');
      return;
    }
    if (!shortDescription.trim()) {
      Alert.alert('Required Field', 'Please enter a short description.');
      return;
    }
    if (communityCategory === 'Select') {
      Alert.alert('Required Field', 'Please select a community category.');
      return;
    }
    if (language === 'Select') {
      Alert.alert('Required Field', 'Please select a language.');
      return;
    }

    Alert.alert(
      'Community Created',
      `Community "${communityName}" has been successfully created.`,
      [
        {
          text: 'OK',
          onPress: () => {
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
          <Text style={styles.headerTitle}>Create Community</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            COMMUNITY DETAILS (Screenshot 1)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionHeader}>Community details</Text>

        {/* Community name * */}
        <Text style={styles.fieldLabel}>
          Community name<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TextInput
          style={styles.singleLineInput}
          value={communityName}
          onChangeText={setCommunityName}
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

        {/* Community category * */}
        <Text style={styles.fieldLabel}>
          Community category<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              communityCategory === 'Select' && { color: adminColors.muted },
            ]}
          >
            {communityCategory}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Cover image (Outline Button) */}
        <Text style={styles.fieldLabel}>Cover image</Text>
        <TouchableOpacity
          style={styles.uploadImageBtn}
          onPress={handleUploadImage}
          activeOpacity={0.75}
        >
          <Text style={styles.uploadImageBtnText}>Upload images</Text>
        </TouchableOpacity>

        {/* Language * */}
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

        {/* Community rules */}
        <Text style={styles.fieldLabel}>Community rules</Text>
        <TextInput
          style={[styles.multilineInput, { minHeight: 74 }]}
          value={communityRules}
          onChangeText={setCommunityRules}
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
          multiline
          numberOfLines={3}
        />

        {/* ══════════════════════════════════════════════════════════════════════
            COMMUNITY SETTINGS (Screenshots 1 & 2)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Community settings</Text>

        {/* Community visibility * */}
        <Text style={styles.fieldLabel}>
          Community visibility<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowVisibilityModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              communityVisibility === 'Select' && { color: adminColors.muted },
            ]}
          >
            {communityVisibility}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Membership method * */}
        <Text style={styles.fieldLabel}>
          Membership method<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowMembershipModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              membershipMethod === 'Select' && { color: adminColors.muted },
            ]}
          >
            {membershipMethod}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>
        <Text style={styles.subCaption}>
          Request-to-join is not built until its approval flow is confirmed.
        </Text>

        {/* Posting permissions * */}
        <Text style={styles.fieldLabel}>
          Posting permissions<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowPostingModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              postingPermissions === 'Select' && { color: adminColors.muted },
            ]}
          >
            {postingPermissions}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Discussion permissions * */}
        <Text style={styles.fieldLabel}>
          Discussion permissions<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowDiscussionModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              discussionPermissions === 'Select' && { color: adminColors.muted },
            ]}
          >
            {discussionPermissions}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Content moderation 🔒 */}
        <View style={styles.labelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Content moderation</Text>
          <LockSmallIcon size={13} color={adminColors.muted} />
        </View>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>Reported content is reviewed</Text>
        </View>

        {/* Community managers 🔒 */}
        <View style={styles.labelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Community managers</Text>
          <LockSmallIcon size={13} color={adminColors.muted} />
        </View>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>Not supported</Text>
        </View>
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshots 1 & 2) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={styles.footerBtn}
          onPress={handleCreateCommunity}
          activeOpacity={0.8}
        >
          <Text style={styles.footerBtnText}>Create Community</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.footerBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════════════
          DROPDOWN MODALS
         ══════════════════════════════════════════════════════════════════════ */}

      {/* Category Modal */}
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
            {COMMUNITY_CATEGORIES.filter((c) => c !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  communityCategory === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setCommunityCategory(item);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    communityCategory === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Modal */}
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
            {COMMUNITY_LANGUAGES.filter((c) => c !== 'Select').map((item) => (
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

      {/* Visibility Modal */}
      <Modal visible={showVisibilityModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVisibilityModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Community visibility</Text>
            </View>
            {VISIBILITY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  communityVisibility === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setCommunityVisibility(item);
                  setShowVisibilityModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    communityVisibility === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Membership Method Modal */}
      <Modal visible={showMembershipModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMembershipModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Membership method</Text>
            </View>
            {MEMBERSHIP_METHODS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  membershipMethod === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setMembershipMethod(item);
                  setShowMembershipModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    membershipMethod === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Posting Permissions Modal */}
      <Modal visible={showPostingModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPostingModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Posting permissions</Text>
            </View>
            {POSTING_PERMISSIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  postingPermissions === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setPostingPermissions(item);
                  setShowPostingModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    postingPermissions === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Discussion Permissions Modal */}
      <Modal visible={showDiscussionModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDiscussionModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Discussion permissions</Text>
            </View>
            {DISCUSSION_PERMISSIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  discussionPermissions === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setDiscussionPermissions(item);
                  setShowDiscussionModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    discussionPermissions === item && styles.dropdownMenuItemTextActive,
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

  uploadImageBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  uploadImageBtnText: {
    ...adminType.body,
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '700',
  },

  subCaption: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 4,
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
    gap: 12,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 12,
  },
  footerBtn: {
    flex: 1,
    height: 44,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
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
