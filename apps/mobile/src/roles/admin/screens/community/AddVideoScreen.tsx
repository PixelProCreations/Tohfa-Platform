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
import { useCreateLearningVideo, useUpdateLearningVideo } from '../../api/learningHooks';
import type { LearningVideoDto } from '../../api/learning';
import { useMyAdminAccount } from '../../api/profileHooks';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { CropPicker } from './CropPicker';
import { useCropPicker } from './useCropPicker';
import { buildVideoBody, buildVideoUpdateBody, canManageLearning, languageFormLabel } from './communityLogic';
import { EditItemGate, type EditTarget } from './EditItemGate';

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

const FARMING_TYPES = ['Natural', 'Organic', 'Bio-dynamic'];

// Matching User Prompt: "in sleect videosource direct"
const VIDEO_SOURCES = ['Select', 'Direct', 'YouTube', 'Vimeo', 'External Link'];

// Exact list matching Screenshot 5
const SEND_TO_OPTIONS = ['All', 'Communities', 'Groups', 'All Farmers'];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface AddVideoScreenProps {
  onBack: () => void;
  onSubmitSuccess?: () => void;
  /** docs/rbac.json codes the signed-in admin holds; absent means nothing can be saved. */
  can?: ((code: string) => boolean) | undefined;
  /**
   * The video being edited. Present means EDIT mode: held back until the item
   * is loaded (EditItemGate), prefilled from it, and Save is PATCH
   * /admin/learning/videos/{id} — never a POST. Absent means create.
   */
  editing?: EditTarget | undefined;
}

/**
 * Add a video (BR-59d, BR-59j). A video is a title, description, an https://
 * link, a free-text duration, an author and a language, and Publish is the real
 * POST /admin/learning/videos. The designed extras that have no field or
 * endpoint stay drawn and say so instead of reporting a save:
 *
 *   - Submit for Review: there is no review state to submit into.
 *   - Thumbnail, video upload and attachments: there is no upload endpoint, and
 *     a video stores only a link.
 *   - Category, farming type, source, references and "send to" have no
 *     field; the group note says only the saved fields are saved. Related
 *     crops ARE saved (BR-59r), from the crop list the server serves.
 */
export function AddVideoScreen({ editing, ...props }: AddVideoScreenProps) {
  if (editing === undefined) return <AddVideoForm {...props} />;
  return (
    <EditItemGate target={editing} onBack={props.onBack} can={props.can}>
      {(content) =>
        content.kind === 'video' ? (
          <AddVideoForm key={content.dto.id} {...props} edit={{ id: content.dto.id, stored: content.dto }} />
        ) : (
          <></>
        )
      }
    </EditItemGate>
  );
}

interface AddVideoFormProps extends Omit<AddVideoScreenProps, 'editing'> {
  /** Set only once the video being edited is in hand. */
  edit?: { id: string; stored: LearningVideoDto } | undefined;
}

function AddVideoForm({ onBack, onSubmitSuccess, can, edit }: AddVideoFormProps) {
  const stored = edit?.stored;
  // 1 · Basic information State (Screenshot 1)
  const [videoTitle, setVideoTitle] = useState(stored?.title ?? '');
  const [shortDescription, setShortDescription] = useState(stored?.description ?? '');
  const [farmingCategory, setFarmingCategory] = useState('Select');
  const [language, setLanguage] = useState(languageFormLabel(stored?.language));

  // 2 · Farming information State (Screenshots 1 & 2)
  const [selectedFarmingType, setSelectedFarmingType] = useState<string>('Natural');
  const [referenceSources, setReferenceSources] = useState('');

  // Video source and media State (Screenshots 2 & 3)
  const [videoSource, setVideoSource] = useState('Select');
  const [thumbnailImage, setThumbnailImage] = useState('');
  const [videoLinkOrUpload, setVideoLinkOrUpload] = useState(stored?.videoUrl ?? '');

  // 4 · Publishing settings State (Screenshots 2, 3, 5)
  const [sendTo, setSendTo] = useState('All');

  // Modal Dropdown States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showVideoSourceModal, setShowVideoSourceModal] = useState(false);
  const [showSendToModal, setShowSendToModal] = useState(false);

  const allowed = canManageLearning(can);
  // BR-59r: the chips are the crop list from the server; an edit starts from the video's own tags.
  const cropPicker = useCropPicker(can, stored?.crops);
  const create = useCreateLearningVideo();
  const update = useUpdateLearningVideo();
  // The author is the signed-in administrator, fetched; never a typed or assumed name.
  const me = useMyAdminAccount({ enabled: allowed });
  const [duration, setDuration] = useState(stored?.duration ?? '');
  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);

  const isSaving = create.isPending || update.isPending;
  const saveError = create.error ?? update.error;
  const publishDisabled = !allowed || isSaving;

  const handlePublish = () => {
    if (publishDisabled) return;
    if (edit !== undefined && stored !== undefined) {
      // The stored author stays: the person editing is not the author.
      const builtUpdate = buildVideoUpdateBody({
        title: videoTitle,
        description: shortDescription,
        videoUrl: videoLinkOrUpload,
        duration,
        language,
        author: stored.author,
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
            Alert.alert(t('community.publish.success.title'), t('community.video.updated'));
            if (onSubmitSuccess) onSubmitSuccess();
            else onBack();
          },
        },
      );
      return;
    }
    const built = buildVideoBody({
      title: videoTitle,
      description: shortDescription,
      videoUrl: videoLinkOrUpload,
      duration,
      language,
      author: me.authorName,
      cropIds: cropPicker.cropIdsForCreate,
    });
    if (!built.ok) {
      setFormErrorKey(built.errorKey);
      return;
    }
    setFormErrorKey(null);
    // Only a settled request reports anything; a failure renders create.error.
    create.mutate(built.body, {
      onSuccess: () => {
        Alert.alert(t('community.publish.success.title'), t('community.video.created'));
        if (onSubmitSuccess) onSubmitSuccess();
        else onBack();
      },
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
          <Text style={styles.headerTitle}>{edit !== undefined ? t('community.edit.video.title') : 'Add video'}</Text>
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
          testID="community.addVideo.title"
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
          testID="community.addVideo.description"
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
          <Text style={styles.fieldLabelNoMargin}>{t('community.form.author')}</Text>
          <LockSmallIcon size={13} color={adminColors.muted} />
        </View>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText} testID="community.addVideo.author">
            {stored !== undefined ? stored.author : me.authorName ?? ADMIN_NO_VALUE}
          </Text>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════
            2 · FARMING INFORMATION (Screenshots 1 & 2)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>2 · Farming information</Text>

        {/* Related crops */}
        <Text style={styles.fieldLabel}>Related crops</Text>
        <CropPicker picker={cropPicker} styles={styles} />

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
            style={[styles.uploadSquareBtn, styles.actionUnavailable]}
            disabled
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="community.addVideo.thumbnailPicker"
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
            testID="community.addVideo.link"
            placeholder=""
            placeholderTextColor={adminColors.placeholder}
          />
          <TouchableOpacity
            style={[styles.uploadSquareBtn, styles.actionUnavailable]}
            disabled
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="community.addVideo.videoPicker"
          >
            <UploadArrowIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Duration: free text the API requires ("6:10"), so it is asked for. */}
        <Text style={styles.fieldLabel}>
          {t('community.form.duration')}<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TextInput
          style={styles.singleLineInput}
          value={duration}
          onChangeText={setDuration}
          placeholder=""
          placeholderTextColor={adminColors.placeholder}
          testID="community.addVideo.duration"
        />

        {/* ══════════════════════════════════════════════════════════════════════
            3 · ATTACHMENTS (Screenshots 2 & 3)
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>3 · Attachments</Text>

        <TouchableOpacity
          style={[styles.attachmentDashedBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="community.addVideo.attachments"
        >
          <Text style={styles.attachmentDashedBtnText}>Add images or PDF documents</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>{t('community.gap.video.upload')}</Text>

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

        {/* Why the notes sit at the end of the form rather than in the docked
            footer: the footer is the designed three-button row and is left as
            drawn. These are the lines directly above it. */}
        <Text style={styles.subCaption}>{t('community.gap.video.unsent')}</Text>
        <Text style={styles.subCaption}>{t('community.gap.video.thumbnail')}</Text>
        <Text style={styles.subCaption}>{t('community.gap.video.review')}</Text>
        {!allowed ? <Text style={styles.formError}>{t('community.denied.subtitle')}</Text> : null}
        {formErrorKey !== null ? (
          <Text style={styles.formError} testID="community.addVideo.validation">
            {t(formErrorKey)}
          </Text>
        ) : null}
        {saveError !== null && saveError !== undefined ? (
          <Text style={styles.formError} testID="community.addVideo.error">
            {t(adminErrorKey(saveError))}
          </Text>
        ) : null}
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshots 1, 2, 3) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={[styles.submitSolidBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="community.addVideo.submitForReview"
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
          testID="community.addVideo.publish"
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
                testID={`community.addVideo.language.${item}`}
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
