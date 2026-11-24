import React, { useState } from 'react';
import {
  Alert,
  Modal,
ScrollView,
StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t, type TranslationKey } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useCreateLearningGroup, useUpdateLearningGroup } from '../../api/learningHooks';
import { useCommunities } from '../../api/communitiesHooks';
import { AdminErrorState } from '../warehouse/shared/AsyncStates';
import { buildGroupBody, canManageLearning } from './communityLogic';
import { canModerateCommunities, communityNameOf, communityOptions } from './communitiesLogic';

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

function CheckboxSquare({ checked }: { checked: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Rect
        x="1"
        y="1"
        width="16"
        height="16"
        rx="3"
        stroke={adminColors.brand}
        strokeWidth="1.5"
        fill={checked ? adminColors.brand : 'none'}
      />
      {checked && (
        <Path
          d="M5 9l2.5 2.5L13 6"
          stroke={adminColors.onBrand}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

// ─── Option Constants ─────────────────────────────────────────────────────────

// Exact list matching Screenshot 5
const GROUP_CATEGORIES = [
  'Select',
  'Training',
  'Audit schedule',
  'Awareness campaign',
  'Seasonal information',
  'Market',
  'Practice update',
  'Community meeting',
];

const GROUP_LANGUAGES = ['Select', 'English', 'Tamil', 'Malayalam', 'Hindi', 'Kannada'];

const FARMING_TYPES = ['All', 'Natural', 'Organic', 'Bio-dynamic'];

const CROP_INTERESTS = ['All', 'Tomato', 'Beans', 'Cabbage', 'Carrot', 'Potato', 'Garlic'];

const REGIONS_ZONES = ['All', 'Zone A', 'Zone B', 'Zone C', 'Zone D', 'Kotagiri', 'Ooty', 'Coonoor'];

const VISIBILITY_OPTIONS = ['All', 'Public', 'Private', 'Restricted'];

const MEMBERSHIP_METHODS = ['All', 'Open to all', 'Request to join', 'Invite only'];

const WHO_CAN_POST_OPTIONS = ['All', 'All members', 'Admins only', 'Moderators and Admins'];

const WHO_CAN_COMMENT_OPTIONS = ['All', 'All members', 'Admins only'];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CreateGroupScreenProps {
  onBack: () => void;
  onSubmitSuccess?: () => void;
  isEditing?: boolean;
  /** The group being edited (PATCH /admin/learning/groups/{id}); creating needs none. */
  groupId?: string | undefined;
  /** The opened group's current values, so an edit starts from what is stored. */
  initialGroup?:
    | { name: string; description?: string | null | undefined; category: string; communityId?: string | null | undefined }
    | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means nothing can be saved. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * Create or edit a community group (BR-59d). The group itself is real —
 * POST /admin/learning/groups, or PATCH .../{id} when editing — and carries
 * exactly three fields: name, description and category. Everything else on the
 * designed form is drawn and says it is not saved, with one addition: the
 * parent community (BR-59s). A group may belong to one community, chosen from
 * GET /admin/communities and sent as `communityId`; choosing none sends nothing
 * on a create and `null` on an edit (which clears it). The selector needs
 * `community.group.moderate` to read the community list; without it the control
 * is drawn disabled and the group is still saveable.
 *
 *   - Language, visibility, membership, posting rights, targeting: a group has
 *     no such field.
 *   - Cover image: no image field on a group and no upload endpoint.
 *   - Farmers: there is no bulk-member endpoint for an administrator, so the
 *     group is created WITHOUT members and the screen never claims otherwise.
 *     The farmer list below is the designed picker, not a roster.
 */
export function CreateGroupScreen({
  onBack,
  onSubmitSuccess,
  isEditing = false,
  groupId,
  initialGroup,
  can,
}: CreateGroupScreenProps) {
  // 1 · Group Information State
  const [groupName, setGroupName] = useState(initialGroup?.name ?? '');
  const [groupDescription, setGroupDescription] = useState(initialGroup?.description ?? '');
  const [groupCategory, setGroupCategory] = useState(initialGroup?.category ?? 'Select');
  const [groupLanguage, setGroupLanguage] = useState('Select');
  // BR-59s: the parent community. null is "none"; an edit starts from the stored one.
  const [parentCommunityId, setParentCommunityId] = useState<string | null>(initialGroup?.communityId ?? null);
  const [showParentModal, setShowParentModal] = useState(false);

  // 2 · Group Targeting State
  const [farmingType, setFarmingType] = useState('All');
  const [cropInterest, setCropInterest] = useState('All');
  const [regionOrZone, setRegionOrZone] = useState('All');

  // 3 · Group Settings State
  const [groupVisibility, setGroupVisibility] = useState('All');
  const [membershipMethod, setMembershipMethod] = useState('All');
  const [whoCanPost, setWhoCanPost] = useState('All');
  const [whoCanComment, setWhoCanComment] = useState('All');
  const [membersCanInvite, setMembersCanInvite] = useState(false);

  // 4 · Add Farmers State
  const [farmerSearchQuery, setFarmerSearchQuery] = useState('');

  // 5 · Confirmation State

  // Modal Dropdown Visibility States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFarmingTypeModal, setShowFarmingTypeModal] = useState(false);
  const [showCropInterestModal, setShowCropInterestModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showWhoCanPostModal, setShowWhoCanPostModal] = useState(false);
  const [showWhoCanCommentModal, setShowWhoCanCommentModal] = useState(false);

  const allowed = canManageLearning(can);
  const parentAllowed = canModerateCommunities(can);
  const communityList = useCommunities({ isArchived: false }, { enabled: parentAllowed });
  const parentOptions = communityOptions(communityList.items);
  const parentDisabled = !parentAllowed;
  const createGroup = useCreateLearningGroup();
  const updateGroup = useUpdateLearningGroup();
  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);

  // An edit with no group opened has nothing to PATCH, and a create must not
  // stand in for it.
  const missingEditTarget = isEditing && groupId === undefined;
  const isSaving = createGroup.isPending || updateGroup.isPending;
  const saveDisabled = !allowed || missingEditTarget || isSaving;
  const saveError = createGroup.error ?? updateGroup.error;

  const handleCreateGroup = () => {
    if (saveDisabled) return;
    const built = buildGroupBody({
      name: groupName,
      description: groupDescription,
      category: groupCategory,
      // A create files the group under a parent only when one was chosen; an edit
      // always states it, so choosing "none" clears a stored parent (null).
      ...(isEditing ? { communityId: parentCommunityId } : parentCommunityId === null ? {} : { communityId: parentCommunityId }),
    });
    if (!built.ok) {
      setFormErrorKey(built.errorKey);
      return;
    }
    setFormErrorKey(null);
    // Only a settled request reports anything: the alert is in onSuccess, and a
    // failure renders saveError instead. No farmer count is claimed — nothing
    // here adds a member.
    const onSuccess = () => {
      Alert.alert(
        t('community.publish.success.title'),
        t(isEditing ? 'community.group.updated' : 'community.group.created'),
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSubmitSuccess) onSubmitSuccess();
              else onBack();
            },
          },
        ],
      );
    };
    if (isEditing && groupId !== undefined) updateGroup.mutate({ id: groupId, body: built.body }, { onSuccess });
    else createGroup.mutate(built.body, { onSuccess });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Group' : 'Create Group'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════════
            1 · GROUP INFORMATION (Screenshots 1 & 5)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={styles.sectionHeader}>1 · Group information</Text>

        {/* Group name * */}
        <Text style={styles.fieldLabel}>
          Group name<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TextInput
          style={styles.singleLineInput}
          value={groupName}
          onChangeText={setGroupName}
          testID="community.createGroup.name"
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
        />

        {/* Group description * */}
        <Text style={styles.fieldLabel}>
          Group description<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TextInput
          style={[styles.multilineInput, { minHeight: 74 }]}
          value={groupDescription}
          onChangeText={setGroupDescription}
          testID="community.createGroup.description"
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
          multiline
          numberOfLines={3}
        />

        {/* Parent community * */}
        <Text style={styles.fieldLabel}>
          Parent community<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        {/* BR-59s: the parent community, from GET /admin/communities. */}
        <TouchableOpacity
          style={[styles.dropdownInput, parentDisabled && styles.actionUnavailable]}
          onPress={parentDisabled ? undefined : () => setShowParentModal(true)}
          disabled={parentDisabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: parentDisabled }}
          testID="community.createGroup.parent"
        >
          <Text style={[styles.dropdownValueText, parentCommunityId === null && { color: adminColors.muted }]}>
            {parentCommunityId === null ? 'Select' : communityNameOf(parentCommunityId, parentOptions)}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>
        {parentAllowed && communityList.error !== null && communityList.error !== undefined ? (
          <AdminErrorState error={communityList.error} onRetry={communityList.refresh} />
        ) : null}

        {/* Group category * (Screenshot 5) */}
        <Text style={styles.fieldLabel}>
          Group category<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              groupCategory === 'Select' && { color: adminColors.muted },
            ]}
          >
            {groupCategory}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Cover image (Outline Button) */}
        <Text style={styles.fieldLabel}>Cover image</Text>
        <TouchableOpacity
          style={[styles.uploadImageBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="community.createGroup.cover"
        >
          <Text style={styles.uploadImageBtnText}>Upload images</Text>
        </TouchableOpacity>
        <Text style={styles.draftNoteText}>{t('community.gap.group.cover')}</Text>

        {/* Group language * */}
        <Text style={styles.fieldLabel}>
          Group language<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownValueText,
              groupLanguage === 'Select' && { color: adminColors.muted },
            ]}
          >
            {groupLanguage}
          </Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* ══════════════════════════════════════════════════════════════════════
            2 · GROUP TARGETING (Screenshots 1 & 2)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>2 · Group targeting</Text>

        {/* Farming type */}
        <Text style={styles.fieldLabel}>Farming type</Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowFarmingTypeModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{farmingType}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Crop interest */}
        <Text style={styles.fieldLabel}>Crop interest</Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowCropInterestModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{cropInterest}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Region or zone */}
        <Text style={styles.fieldLabel}>Region or zone</Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowRegionModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{regionOrZone}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* ══════════════════════════════════════════════════════════════════════
            3 · GROUP SETTINGS (Screenshot 2)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>3 · Group settings</Text>

        {/* Group visibility * */}
        <Text style={styles.fieldLabel}>
          Group visibility<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowVisibilityModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{groupVisibility}</Text>
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
          <Text style={styles.dropdownValueText}>{membershipMethod}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Who can post * */}
        <Text style={styles.fieldLabel}>
          Who can post<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowWhoCanPostModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{whoCanPost}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Who can comment * */}
        <Text style={styles.fieldLabel}>
          Who can comment<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowWhoCanCommentModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownValueText}>{whoCanComment}</Text>
          <ChevronDownIcon size={16} />
        </TouchableOpacity>

        {/* Checkbox: Members can invite other farmers */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setMembersCanInvite(!membersCanInvite)}
          activeOpacity={0.7}
        >
          <CheckboxSquare checked={membersCanInvite} />
          <Text style={styles.checkboxLabel}>Members can invite other farmers</Text>
        </TouchableOpacity>

        {/* ══════════════════════════════════════════════════════════════════════
            4 · ADD FARMERS (Screenshots 3 & 4)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>4 · Add farmers</Text>

        {/* Search by farmer ID or name */}
        <Text style={styles.fieldLabel}>Search by farmer ID or name</Text>
        <TextInput
          style={styles.singleLineInput}
          value={farmerSearchQuery}
          onChangeText={setFarmerSearchQuery}
          editable={false}
          testID="community.createGroup.farmerSearch"
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
        />

        {/* 2-column filter row: Region or zone & Farming type */}
        <View style={styles.filterTwoColRow}>
          <View style={styles.filterCol}>
            <Text style={styles.fieldLabel}>Region or zone</Text>
            <TouchableOpacity
              style={[styles.dropdownInput, styles.actionUnavailable]}
              disabled
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              testID="community.createGroup.farmerRegion"
            >
              <Text style={styles.dropdownValueText}>All</Text>
              <ChevronDownIcon size={16} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterCol}>
            <Text style={styles.fieldLabel}>Farming type</Text>
            <TouchableOpacity
              style={[styles.dropdownInput, styles.actionUnavailable]}
              disabled
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              testID="community.createGroup.farmerType"
            >
              <Text style={styles.dropdownValueText}>All</Text>
              <ChevronDownIcon size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* No farmer lookup exists: the picker is drawn, disabled, and says so. */}
        <Text style={styles.farmerMatchCaption} testID="community.createGroup.farmerNote">
          {t('community.gap.group.farmers')}
        </Text>

        {/* ══════════════════════════════════════════════════════════════════════
            5 · CONFIRMATION (Screenshot 4)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>5 · Confirmation</Text>

        {/* Summary Card */}
        <View style={styles.confirmationCard}>
          {/* Row 1: Group name */}
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Group name</Text>
            <Text style={styles.confirmValue}>{groupName.trim() ? groupName : '—'}</Text>
          </View>
          <View style={styles.dashedDivider} />

          {/* Row 2: Parent community */}
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Parent community</Text>
            <Text style={styles.confirmValue}>{communityNameOf(parentCommunityId, parentOptions)}</Text>
          </View>
          <View style={styles.dashedDivider} />

          {/* Membership method */}
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Membership method</Text>
            <Text style={styles.confirmValue}>
              {membershipMethod !== 'All' ? membershipMethod : '—'}
            </Text>
          </View>
        </View>

        {/* Checkbox: Notify the added farmers in the app */}
        <TouchableOpacity
          style={[styles.checkboxRow, { marginTop: 14 }, styles.actionUnavailable]}
          disabled
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="community.createGroup.notify"
        >
          <CheckboxSquare checked={false} />
          <Text style={styles.checkboxLabel}>Notify the added farmers in the app</Text>
        </TouchableOpacity>

        {/* Sub-caption */}
        <Text style={styles.draftNoteText}>Saving a group as a draft is not supported.</Text>

        {/* Why these notes sit at the end of the form rather than in the docked
            footer: the footer is the designed two-button row, left as drawn. */}
        <Text style={styles.draftNoteText}>{t('community.gap.group.unsent')}</Text>
        <Text style={styles.draftNoteText}>{t('community.gap.group.language')}</Text>
        <Text style={styles.draftNoteText}>{t('community.gap.group.members')}</Text>
        {missingEditTarget ? <Text style={styles.formError}>{t('community.gap.group.noId')}</Text> : null}
        {!allowed ? <Text style={styles.formError}>{t('community.denied.subtitle')}</Text> : null}
        {formErrorKey !== null ? (
          <Text style={styles.formError} testID="community.createGroup.validation">
            {t(formErrorKey)}
          </Text>
        ) : null}
        {saveError !== null && saveError !== undefined ? (
          <Text style={styles.formError} testID="community.createGroup.error">
            {t(adminErrorKey(saveError))}
          </Text>
        ) : null}
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshots 1-4) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={[styles.footerBtn, saveDisabled && styles.actionUnavailable]}
          onPress={saveDisabled ? undefined : handleCreateGroup}
          disabled={saveDisabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: saveDisabled, busy: isSaving }}
          testID="community.createGroup.submit"
        >
          <Text style={styles.footerBtnText}>
            {isSaving ? t('community.action.saving') : isEditing ? 'Save Changes' : 'Create Group'}
          </Text>
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


      {/* Group Category Modal (Screenshot 5) */}
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
            {GROUP_CATEGORIES.filter((c) => c !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                testID={`community.createGroup.category.${item}`}
                style={[
                  styles.dropdownMenuItem,
                  groupCategory === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setGroupCategory(item);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    groupCategory === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Parent Community Modal (BR-59s): the active communities the server returned, and "none". */}
      <Modal visible={showParentModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowParentModal(false)}>
          <View style={styles.dropdownMenuCard}>
            <View style={styles.categoryDropdownHeader}>
              <Text style={styles.categoryDropdownHeaderText}>Select</Text>
            </View>
            <TouchableOpacity
              style={[styles.dropdownMenuItem, parentCommunityId === null && styles.dropdownMenuItemActive]}
              onPress={() => {
                setParentCommunityId(null);
                setShowParentModal(false);
              }}
              testID="community.createGroup.parent.none"
            >
              <Text style={[styles.dropdownMenuItemText, parentCommunityId === null && styles.dropdownMenuItemTextActive]}>{ADMIN_NO_VALUE}</Text>
            </TouchableOpacity>
            {parentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.dropdownMenuItem, parentCommunityId === option.id && styles.dropdownMenuItemActive]}
                onPress={() => {
                  setParentCommunityId(option.id);
                  setShowParentModal(false);
                }}
                testID={`community.createGroup.parent.option.${option.id}`}
              >
                <Text style={[styles.dropdownMenuItemText, parentCommunityId === option.id && styles.dropdownMenuItemTextActive]}>
                  {option.name}
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
            {GROUP_LANGUAGES.filter((c) => c !== 'Select').map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  groupLanguage === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setGroupLanguage(item);
                  setShowLanguageModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    groupLanguage === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Farming Type Modal */}
      <Modal visible={showFarmingTypeModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFarmingTypeModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Farming type</Text>
            </View>
            {FARMING_TYPES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  farmingType === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setFarmingType(item);
                  setShowFarmingTypeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    farmingType === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Crop Interest Modal */}
      <Modal visible={showCropInterestModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCropInterestModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Crop interest</Text>
            </View>
            {CROP_INTERESTS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  cropInterest === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setCropInterest(item);
                  setShowCropInterestModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    cropInterest === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Region or Zone Modal */}
      <Modal visible={showRegionModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegionModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Region or zone</Text>
            </View>
            {REGIONS_ZONES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  regionOrZone === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setRegionOrZone(item);
                  setShowRegionModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    regionOrZone === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Group Visibility Modal */}
      <Modal visible={showVisibilityModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowVisibilityModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Group visibility</Text>
            </View>
            {VISIBILITY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  groupVisibility === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setGroupVisibility(item);
                  setShowVisibilityModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    groupVisibility === item && styles.dropdownMenuItemTextActive,
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

      {/* Who Can Post Modal */}
      <Modal visible={showWhoCanPostModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWhoCanPostModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Who can post</Text>
            </View>
            {WHO_CAN_POST_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  whoCanPost === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setWhoCanPost(item);
                  setShowWhoCanPostModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    whoCanPost === item && styles.dropdownMenuItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Who Can Comment Modal */}
      <Modal visible={showWhoCanCommentModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowWhoCanCommentModal(false)}
        >
          <View style={styles.dropdownMenuCard}>
            <View style={styles.dropdownHeaderRow}>
              <Text style={styles.dropdownHeaderTitle}>Who can comment</Text>
            </View>
            {WHO_CAN_COMMENT_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.dropdownMenuItem,
                  whoCanComment === item && styles.dropdownMenuItemActive,
                ]}
                onPress={() => {
                  setWhoCanComment(item);
                  setShowWhoCanCommentModal(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    whoCanComment === item && styles.dropdownMenuItemTextActive,
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

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  checkboxLabel: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.ink,
    fontWeight: '700',
  },

  // ─── Filter Row ───
  filterTwoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterCol: {
    flex: 1,
  },
  farmerMatchCaption: {
    ...adminType.caption,
    color: adminColors.info.text,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },

  // ─── Farmer Selection List ───
  farmerListContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  farmerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  farmerItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  farmerInfoCol: {
    flex: 1,
  },
  farmerNameText: {
    ...adminType.rowTitle,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  farmerSubText: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 2,
  },

  // ─── Confirmation Card ───
  confirmationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  confirmLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    fontWeight: '500',
  },
  confirmValue: {
    ...adminType.body,
    fontSize: 11.5,
    color: adminColors.ink,
    fontWeight: '700',
  },
  confirmValueBold: {
    fontWeight: '800',
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 4,
  },

  /** The designed button, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  formError: {
    ...adminType.caption,
    color: adminColors.danger.text,
    marginTop: 6,
  },
  draftNoteText: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 8,
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
