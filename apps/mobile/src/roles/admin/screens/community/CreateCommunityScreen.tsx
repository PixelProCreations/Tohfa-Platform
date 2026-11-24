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
import { useCommunity, useCreateCommunity, useUpdateCommunity } from '../../api/communitiesHooks';
import type { CommunityDto } from '../../api/communities';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { buildCommunityBody, canModerateCommunities } from './communitiesLogic';

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

// ─── Component Props ──────────────────────────────────────────────────────────

export interface CreateCommunityScreenProps {
  onBack: () => void;
  onSubmitSuccess?: () => void;
  isEditing?: boolean;
  /** The community being edited (PATCH /admin/communities/{id}); creating needs none. */
  communityId?: string | undefined;
  /** docs/rbac.json codes the signed-in admin holds; absent means nothing can be saved. */
  can?: ((code: string) => boolean) | undefined;
}

/**
 * Create or edit a community (BR-59s, community.group.moderate). A community
 * carries exactly four fields — name, description, category and rules — and
 * those are what is sent: POST /admin/communities, or PATCH .../{id} when
 * editing. Everything else on the designed form has no field in the API, so it
 * is drawn and disabled rather than accepting a choice that is never stored:
 * the cover image, language, visibility, membership method, posting and
 * discussion permissions. Content moderation and managers were already
 * read-only.
 *
 * An edit is held back until the community is loaded and starts from it, so it
 * can never open blank and PATCH nothing (or, worse, POST a duplicate). Success
 * is reported only once the request has settled; a failure shows the server's
 * error and no success.
 */
export function CreateCommunityScreen({ communityId, isEditing = false, ...props }: CreateCommunityScreenProps) {
  const allowed = canModerateCommunities(props.can);
  const fetched = useCommunity(communityId, { enabled: allowed && isEditing });
  if (!isEditing) return <CommunityForm {...props} />;
  if (fetched.data === undefined || communityId === undefined) {
    // Nothing is loaded yet: never an empty form that would save over the real one.
    return (
      <SafeAreaView style={styles.root}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={props.onBack} activeOpacity={0.7} accessibilityLabel="Go back">
              <BackArrowWhiteIcon size={20} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('community.edit.community.title')}</Text>
          </View>
        </View>
        <View style={styles.gateBody}>
          {!allowed ? (
            <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
          ) : communityId === undefined ? (
            <AdminEmptyState title={t('community.gap.community.noId')} />
          ) : fetched.error !== null && fetched.error !== undefined ? (
            <AdminErrorState error={fetched.error} onRetry={() => void fetched.refetch()} />
          ) : (
            <AdminLoadingState />
          )}
        </View>
      </SafeAreaView>
    );
  }
  return <CommunityForm key={fetched.data.id} {...props} edit={fetched.data} />;
}

interface CommunityFormProps extends Omit<CreateCommunityScreenProps, 'isEditing' | 'communityId'> {
  /** Set only once the community being edited is in hand. */
  edit?: CommunityDto | undefined;
}

/** A designed dropdown with no field behind it: drawn, disabled, no handler. */
function UnavailableDropdown({ fieldId, label }: { fieldId: string; label: string }) {
  return (
    <TouchableOpacity
      style={[styles.dropdownInput, styles.actionUnavailable]}
      disabled
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityHint={t('community.gap.community.field')}
      testID={`community.createCommunity.${fieldId}`}
    >
      <Text style={[styles.dropdownValueText, { color: adminColors.muted }]}>{label}</Text>
      <ChevronDownIcon size={16} />
    </TouchableOpacity>
  );
}

function CommunityForm({ onBack, onSubmitSuccess, can, edit }: CommunityFormProps) {
  const [communityName, setCommunityName] = useState(edit?.name ?? '');
  const [shortDescription, setShortDescription] = useState(edit?.description ?? '');
  const [communityCategory, setCommunityCategory] = useState(edit?.category ?? 'Select');
  const [communityRules, setCommunityRules] = useState(edit?.rules ?? '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [formErrorKey, setFormErrorKey] = useState<TranslationKey | null>(null);

  const allowed = canModerateCommunities(can);
  const create = useCreateCommunity();
  const update = useUpdateCommunity();
  const isEditing = edit !== undefined;
  const isSaving = create.isPending || update.isPending;
  const saveError = create.error ?? update.error;
  const saveDisabled = !allowed || isSaving;

  const handleSave = () => {
    if (saveDisabled) return;
    const built = buildCommunityBody({
      name: communityName,
      description: shortDescription,
      category: communityCategory,
      rules: communityRules,
    });
    if (!built.ok) {
      setFormErrorKey(built.errorKey);
      return;
    }
    setFormErrorKey(null);
    // Only a settled request reports anything: the alert is in onSuccess, and a
    // failure renders saveError instead.
    const onSuccess = () => {
      Alert.alert(t('community.publish.success.title'), t(isEditing ? 'community.community.updated' : 'community.community.created'), [
        {
          text: 'OK',
          onPress: () => {
            if (onSubmitSuccess) onSubmitSuccess();
            else onBack();
          },
        },
      ]);
    };
    if (edit !== undefined) update.mutate({ id: edit.id, body: built.body }, { onSuccess });
    else create.mutate(built.body, { onSuccess });
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
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Community' : 'Create Community'}</Text>
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
          testID="community.createCommunity.name"
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
          testID="community.createCommunity.description"
        />

        {/* Community category * */}
        <Text style={styles.fieldLabel}>
          Community category<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.7}
          testID="community.createCommunity.category"
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
          style={[styles.uploadImageBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="community.createCommunity.cover"
        >
          <Text style={styles.uploadImageBtnText}>Upload images</Text>
        </TouchableOpacity>
        <Text style={styles.subCaption}>{t('community.gap.community.cover')}</Text>

        {/* Language *: a community has no language field. */}
        <Text style={styles.fieldLabel}>
          Language<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <UnavailableDropdown fieldId="language" label="Select" />

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
          testID="community.createCommunity.rules"
        />

        {/* ══════════════════════════════════════════════════════════════════════
            COMMUNITY SETTINGS (Screenshots 1 & 2): none of these is a field of a
            community, so each is drawn and disabled.
           ══════════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionHeader, { marginTop: 22 }]}>Community settings</Text>

        <Text style={styles.fieldLabel}>
          Community visibility<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <UnavailableDropdown fieldId="visibility" label="Select" />

        <Text style={styles.fieldLabel}>
          Membership method<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <UnavailableDropdown fieldId="membership" label="Select" />

        <Text style={styles.fieldLabel}>
          Posting permissions<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <UnavailableDropdown fieldId="posting" label="Select" />

        <Text style={styles.fieldLabel}>
          Discussion permissions<Text style={styles.requiredAsterisk}> *</Text>
        </Text>
        <UnavailableDropdown fieldId="discussion" label="Select" />

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

        {!allowed ? <Text style={styles.formError}>{t('community.denied.subtitle')}</Text> : null}
        {formErrorKey !== null ? (
          <Text style={styles.formError} testID="community.createCommunity.validation">
            {t(formErrorKey)}
          </Text>
        ) : null}
        {saveError !== null && saveError !== undefined ? (
          <Text style={styles.formError} testID="community.createCommunity.error">
            {t(adminErrorKey(saveError))}
          </Text>
        ) : null}
      </ScrollView>

      {/* ─── Bottom Docked Actions (Screenshots 1 & 2) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={[styles.footerBtn, saveDisabled && styles.actionUnavailable]}
          onPress={saveDisabled ? undefined : handleSave}
          disabled={saveDisabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: saveDisabled, busy: isSaving }}
          testID="community.createCommunity.submit"
        >
          <Text style={styles.footerBtnText}>
            {isSaving ? t('community.action.saving') : isEditing ? 'Save Changes' : 'Create Community'}
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
                testID={`community.createCommunity.category.${item}`}
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

  /** The designed button, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },

  formError: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
    marginTop: 10,
  },
  gateBody: {
    flex: 1,
    padding: adminSpacing.md,
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
