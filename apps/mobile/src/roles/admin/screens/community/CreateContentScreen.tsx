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
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t, type TranslationKey } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useCreateLearningArticle, useUpdateLearningArticle } from '../../api/learningHooks';
import { useCreateAdminAnnouncement } from '../../api/announcementsHooks';
import type { LearningArticleSummaryDto, LearningCropRef } from '../../api/learning';
import { useMyAdminAccount } from '../../api/profileHooks';
import { buildArticleBody, buildArticleUpdateBody, canManageLearning } from './communityLogic';
import { ANNOUNCEMENT_AUDIENCES, buildAnnouncementBody, canPublishAnnouncement } from './announcementLogic';
import { EditItemGate, type EditTarget } from './EditItemGate';
import { CropPicker } from './CropPicker';
import { useCropPicker } from './useCropPicker';

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

/**
 * The option values above are the screen's own internal discriminator; what the
 * admin reads comes from the catalogue. "Video" shows as "Training Video"
 * (owner, 2026-11-24) — it is an instruction video, still a learning video, not
 * a scheduled training.
 */
const CONTENT_TYPE_LABEL: Record<ContentTypeOption, TranslationKey> = {
  Article: 'community.type.article',
  'Farming Guide': 'community.type.farmingGuide',
  Information: 'community.type.information',
  Announcement: 'community.type.announcement',
  Video: 'community.type.video',
};

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


// ─── Component Props ──────────────────────────────────────────────────────────

export interface CreateContentInitialData {
  contentType?: ContentTypeOption;
  title?: string;
  shortDescription?: string;
  farmingCategory?: string;
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
  readTime?: string;
}

/**
 * What an opened article puts in the form. Only fields the article actually has
 * are filled; farming type, conditions, precautions and references have no
 * stored value, so they stay at the form's own defaults rather than being
 * guessed.
 */
export function articleInitialData(dto: LearningArticleSummaryDto & { content?: string }): CreateContentInitialData {
  return {
    contentType: 'Article',
    title: dto.title,
    shortDescription: dto.snippet ?? '',
    farmingCategory: dto.tag,
    instructions: dto.content ?? '',
    readTime: dto.readTime,
  };
}

export interface CreateContentScreenProps {
  initialType?: ContentTypeOption | undefined;
  initialData?: CreateContentInitialData | undefined;
  onBack: () => void;
  onSubmitSuccess?: (() => void) | undefined;
  onNavigateAddVideo?: (() => void) | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means nothing can be saved. */
  can?: ((code: string) => boolean) | undefined;
  /**
   * The article being edited. Present means EDIT mode: the form is held back
   * until the item is loaded (EditItemGate), is prefilled from it, and Save is
   * PATCH /admin/learning/articles/{id} — never a POST. Absent means create.
   */
  editing?: EditTarget | undefined;
}

/**
 * Create an article (BR-59d). "Article", "Farming Guide" and "Information" are
 * three labels for the one resource the API has — POST /admin/learning/articles —
 * and Publish is the real request. What it cannot do stays drawn and disabled,
 * each with its reason, rather than raising a success toast with nothing sent:
 *
 *   - Submit for Review: an unsaved item has no id to submit. It is available
 *     from the saved item (ContentItemDetailScreen), where the review workflow
 *     (BR-59t) lives; review is its own axis and never gates Publish here.
 *   - Attachments: there is no upload endpoint and an article has no
 *     attachment field.
 *
 * The Announcement type is a different request (BR-213): Publish POSTs
 * /admin/announcements with target SYSTEM_WIDE, needs
 * `announcement.system_wide.create` rather than the learning permission, and is
 * reported only once the request settled. Of the "Send to" audiences only "All"
 * can be sent (ZONE and ROLE targets cannot be authored: 422), so the role
 * audiences are drawn, disabled, with a note.
 *
 * Only the fields an article has are sent (title, summary, body, category, read
 * time, author, related crops (BR-59r)); farming type, conditions, precautions, references and
 * visibility have no field and are not claimed as saved. A video is its own
 * screen (AddVideoScreen). There is no training form in this designed screen.
 */
export function CreateContentScreen({ editing, ...props }: CreateContentScreenProps) {
  if (editing === undefined) return <CreateContentForm {...props} />;
  return (
    <EditItemGate target={editing} onBack={props.onBack} can={props.can}>
      {(content) =>
        content.kind === 'article' ? (
          <CreateContentForm
            key={content.dto.id}
            {...props}
            edit={{
              id: content.dto.id,
              author: content.dto.author,
              crops: content.dto.crops,
              initialData: articleInitialData(content.dto),
            }}
          />
        ) : (
          <></>
        )
      }
    </EditItemGate>
  );
}

interface CreateContentFormProps extends Omit<CreateContentScreenProps, 'editing'> {
  /** Set only once the item being edited is in hand. */
  edit?: { id: string; author: string; crops: LearningCropRef[]; initialData: CreateContentInitialData } | undefined;
}

function CreateContentForm({
  initialType = 'Article',
  initialData: createInitialData,
  edit,
  onBack,
  onSubmitSuccess,
  onNavigateAddVideo,
  can,
}: CreateContentFormProps) {
  const initialData = edit?.initialData ?? createInitialData;
  // Common / Article Form State
  const [contentType, setContentType] = useState<ContentTypeOption>(
    initialData?.contentType || initialType
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [farmingCategory, setFarmingCategory] = useState(initialData?.farmingCategory || 'Select');
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
    // An edit takes its values once, from useState above; re-applying them on a
    // later render would overwrite what the admin has typed.
    if (edit === undefined && initialData) {
      if (initialData.contentType) setContentType(initialData.contentType);
      if (initialData.title !== undefined) setTitle(initialData.title);
      if (initialData.shortDescription !== undefined) setShortDescription(initialData.shortDescription);
      if (initialData.farmingCategory) setFarmingCategory(initialData.farmingCategory);
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
      if (initialData.readTime !== undefined) setReadTime(initialData.readTime);
    }
  }, [initialData, edit]);

  // Modal Dropdowns
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [showAnnouncementCategoryDropdown, setShowAnnouncementCategoryDropdown] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);

  const isAnnouncement = contentType === 'Announcement';

  const allowed = canManageLearning(can);
  // BR-59r: the chips are the crop list from the server; an edit starts from the item's own tags.
  const cropPicker = useCropPicker(can, edit?.crops);
  const create = useCreateLearningArticle();
  const update = useUpdateLearningArticle();
  const announce = useCreateAdminAnnouncement();
  // The author is the signed-in administrator, fetched; never a typed or assumed name.
  const me = useMyAdminAccount({ enabled: allowed });
  const [readTime, setReadTime] = useState(initialData?.readTime ?? '');
  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);

  const isSaving = create.isPending || update.isPending || announce.isPending;
  const saveError = create.error ?? update.error ?? announce.error;
  // An announcement needs its own permission; an article waits for the learning one.
  const mayPublish = isAnnouncement ? canPublishAnnouncement(can) : allowed;
  const publishDisabled = !mayPublish || isSaving;

  const handlePublishAnnouncement = () => {
    const built = buildAnnouncementBody({
      title: announcementTitle,
      summary: shortSummary,
      description: fullDescription,
      category: announcementCategory,
      audience,
    });
    if (!built.ok) {
      setFormErrorKey(built.errorKey);
      return;
    }
    setFormErrorKey(null);
    // Only a settled request reports anything; a failure renders announce.error.
    announce.mutate(built.body, {
      onSuccess: () => {
        Alert.alert(t('community.publish.success.title'), t('community.announcement.published'));
        if (onSubmitSuccess) onSubmitSuccess();
        else onBack();
      },
    });
  };

  const handlePublish = () => {
    if (publishDisabled) return;
    if (isAnnouncement) {
      handlePublishAnnouncement();
      return;
    }
    if (edit !== undefined) {
      // The stored author stays: the person editing is not the author.
      const builtUpdate = buildArticleUpdateBody({
        title,
        summary: shortDescription,
        body: instructions,
        category: farmingCategory,
        readTime,
        author: edit.author,
        cropIds: cropPicker.cropIdsForUpdate,
      });
      if (!builtUpdate.ok) {
        setFormErrorKey(builtUpdate.errorKey);
        return;
      }
      setFormErrorKey(null);
      update.mutate(
        { id: edit.id, body: builtUpdate.body },
        {
          onSuccess: () => {
            Alert.alert(t('community.publish.success.title'), t('community.content.updated'));
            if (onSubmitSuccess) onSubmitSuccess();
            else onBack();
          },
        },
      );
      return;
    }
    // The body of an article is the "Instructions" field; the summary is the snippet.
    const built = buildArticleBody({
      title,
      summary: shortDescription,
      body: instructions,
      category: farmingCategory,
      readTime,
      author: me.authorName,
      cropIds: cropPicker.cropIdsForCreate,
    });
    if (!built.ok) {
      setFormErrorKey(built.errorKey);
      return;
    }
    setFormErrorKey(null);
    // Only a settled request reports anything: the alert is in onSuccess, and a
    // failure renders create.error instead.
    create.mutate(built.body, {
      onSuccess: () => {
        Alert.alert(t('community.publish.success.title'), t('community.content.created'));
        if (onSubmitSuccess) onSubmitSuccess();
        else onBack();
      },
    });
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
          <Text style={styles.headerTitle}>{edit !== undefined ? t('community.edit.title') : 'Create Content'}</Text>
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
          <Text style={styles.dropdownValueText}>{t(CONTENT_TYPE_LABEL[contentType])}</Text>
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
              {t('community.field.titleFor', { type: t(CONTENT_TYPE_LABEL[contentType]) })}
              <Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={styles.singleLineInput}
              value={title}
              onChangeText={setTitle}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              testID="community.createContent.title"
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
              testID="community.createContent.shortDescription"
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

            {/* Read time: free text the API requires ("4 min read"), so it is asked for. */}
            <Text style={styles.fieldLabel}>
              {t('community.form.readTime')}<Text style={styles.requiredAsterisk}> *</Text>
            </Text>
            <TextInput
              style={styles.singleLineInput}
              value={readTime}
              onChangeText={setReadTime}
              placeholder=""
              placeholderTextColor={adminColors.placeholder}
              testID="community.createContent.readTime"
            />

            {/* Author (Read-only lock): the signed-in administrator, as the server reports them. */}
            <View style={styles.labelWithIconRow}>
              <Text style={styles.fieldLabelNoMargin}>{t('community.form.author')}</Text>
              <LockSmallIcon size={13} color={adminColors.muted} />
            </View>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText} testID="community.createContent.author">
                {edit !== undefined ? edit.author : me.authorName ?? ADMIN_NO_VALUE}
              </Text>
            </View>

            {/* 2 · Farming information */}
            <Text style={[styles.sectionHeader, { marginTop: 22 }]}>2 · Farming information</Text>

            {/* Related Crops Multi-select chips */}
            <Text style={styles.fieldLabel}>Related crops</Text>
            <CropPicker picker={cropPicker} styles={styles} />

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
              testID="community.createContent.instructions"
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
              style={[styles.addAttachmentBtn, styles.actionUnavailable]}
              disabled
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              testID="community.createContent.attachments"
            >
              <Text style={styles.addAttachmentBtnText}>Add images or PDF documents</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>{t('community.gap.content.attachments')}</Text>

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
        {/* Why the notes sit at the end of the form rather than in the docked
            footer: the footer is the designed three-button row and is left as
            drawn. These are the lines directly above it. */}
        {isAnnouncement ? null : <Text style={styles.subCaption}>{t('community.gap.content.unsent')}</Text>}
        <Text style={styles.subCaption}>{t('community.gap.content.review')}</Text>
        {!mayPublish ? (
          <Text style={styles.formError}>{t(isAnnouncement ? 'community.denied.announcement' : 'community.denied.subtitle')}</Text>
        ) : null}
        {formErrorKey !== null ? (
          <Text style={styles.formError} testID="community.createContent.validation">
            {t(formErrorKey)}
          </Text>
        ) : null}
        {saveError !== null && saveError !== undefined ? (
          <Text style={styles.formError} testID="community.createContent.error">
            {t(adminErrorKey(saveError))}
          </Text>
        ) : null}
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshot 4) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={[styles.submitSolidBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="community.createContent.submitForReview"
        >
          <Text style={styles.submitSolidBtnText}>Submit for Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishOutlineBtn, publishDisabled && styles.actionUnavailable]}
          onPress={publishDisabled ? undefined : handlePublish}
          disabled={publishDisabled}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityState={{ disabled: publishDisabled, busy: isSaving }}
          testID="community.createContent.publish"
        >
          <Text style={styles.publishOutlineBtnText}>
            {isSaving ? t('community.action.saving') : edit !== undefined ? t('community.action.saveChanges') : 'Publish'}
          </Text>
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
                    // An edit must not wander into the create-video form.
                    if (edit === undefined && onNavigateAddVideo) onNavigateAddVideo();
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
                  {t(CONTENT_TYPE_LABEL[item])}
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
            {ANNOUNCEMENT_AUDIENCES.map(({ label: item, target }) => {
              // Only "All" is a target that can be authored; the role audiences
              // are drawn, disabled, and the note below says why.
              const unavailable = target === null;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownMenuItem,
                    audience === item && styles.dropdownMenuItemActive,
                    unavailable && styles.actionUnavailable,
                  ]}
                  onPress={
                    unavailable
                      ? undefined
                      : () => {
                          setAudience(item);
                          setShowAudienceDropdown(false);
                        }
                  }
                  disabled={unavailable}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: unavailable }}
                  testID={`community.createContent.audience.${item}`}
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
              );
            })}
            <Text style={styles.audienceNote}>{t('community.gap.announcement.audience')}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles Strictly Derived From Admin Theme ───────────────────────────────

const styles = StyleSheet.create({
  audienceNote: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
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
  /** The designed button, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  subCaption: {
    ...adminType.caption,
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 4,
  },
  formError: {
    ...adminType.caption,
    color: adminColors.danger.text,
    marginTop: 6,
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
