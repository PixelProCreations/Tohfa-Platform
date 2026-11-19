import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P } from '../../../theme';
import { ProfileModalShell } from './ProfileModalShell';
import { FARMING_TYPE_CODES, farmingTypeLabel, type PersonalDetailsData } from './profileHelpers';
import { NAME_MAX_LENGTH, type FieldValidation } from '../../../utils/validation';
import { ADDRESS_MAX_LENGTH, FARM_NAME_MAX_LENGTH, type PersonalField } from '../profileValidation';
import type { PersonalEditForm } from './useProfileEditForms';
import { styles } from './profileStyles';

interface EditPersonalModalProps {
  visible: boolean;
  form: PersonalEditForm;
  setField: (key: keyof PersonalEditForm, value: string) => void;
  /** Read-only KYC values shown in the locked section. */
  personalDetails: PersonalDetailsData;
  /** Inline errors for the typed fields; ProfileScreen gates `onSave` with its validateAll(). */
  validation: FieldValidation<PersonalField>;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditPersonalModal({
  visible,
  form,
  setField,
  personalDetails,
  validation,
  saving,
  onClose,
  onSave,
}: EditPersonalModalProps): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.personal.editTitle')}
      onClose={onClose}
      footer={
        <>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
            <Text style={styles.saveBtnText}>
              {saving ? t('farmer.farmDiary.newEntry.step3.saving') : t('farmer.profile.save')}
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={styles.inputLabel}>{t('farmer.profile.fullName')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.fullName}
        onChangeText={(v) => setField('fullName', v)}
        onBlur={() => validation.onBlur('fullName')}
        maxLength={NAME_MAX_LENGTH}
        placeholder={t('farmer.profile.fullName')}
      />
      {validation.messageFor('fullName') ? <Text style={styles.fieldErrorText}>{validation.messageFor('fullName')}</Text> : null}

      <Text style={styles.inputLabel}>{t('farmer.profile.dob')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.dob}
        onChangeText={(v) => setField('dob', v)}
        onBlur={() => validation.onBlur('dob')}
        maxLength={11}
        placeholder={t('farmer.profile.dobPlaceholder')}
      />
      {validation.messageFor('dob') ? <Text style={styles.fieldErrorText}>{validation.messageFor('dob')}</Text> : null}

      <Text style={styles.inputLabel}>{t('farmer.profile.yearsInOrganicLabel')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.yearsInOrganic}
        onChangeText={(v) => setField('yearsInOrganic', v)}
        onBlur={() => validation.onBlur('yearsInOrganic')}
        maxLength={2}
        keyboardType="numeric"
        placeholder={t('farmer.profile.yearsPlaceholder')}
      />
      {validation.messageFor('yearsInOrganic') ? <Text style={styles.fieldErrorText}>{validation.messageFor('yearsInOrganic')}</Text> : null}

      <Text style={styles.inputLabel}>{t('farmer.profile.farmingType')}</Text>
      <View style={styles.chipsRow}>
        {FARMING_TYPE_CODES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.choiceChip, form.farmingType === type && styles.choiceChipActive]}
            onPress={() => setField('farmingType', type)}
          >
            <Text
              style={[
                styles.choiceChipText,
                form.farmingType === type && styles.choiceChipTextActive,
              ]}
            >
              {farmingTypeLabel(type)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.farmingTypeNoteEdit}>{t('farmer.profile.farmingType.notSavedNote')}</Text>

      <Text style={styles.inputLabel}>{t('farmer.profile.farmName')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.farmName}
        onChangeText={(v) => setField('farmName', v)}
        onBlur={() => validation.onBlur('farmName')}
        maxLength={FARM_NAME_MAX_LENGTH}
        placeholder={t('farmer.profile.farmName')}
      />
      {validation.messageFor('farmName') ? <Text style={styles.fieldErrorText}>{validation.messageFor('farmName')}</Text> : null}

      <Text style={styles.inputLabel}>{t('farmer.profile.farmLocation')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.location}
        onChangeText={(v) => setField('location', v)}
        onBlur={() => validation.onBlur('location')}
        maxLength={ADDRESS_MAX_LENGTH}
        placeholder={t('farmer.profile.farmLocationPlaceholder')}
      />
      {validation.messageFor('location') ? <Text style={styles.fieldErrorText}>{validation.messageFor('location')}</Text> : null}

      <View style={styles.lockedSection}>
        <View style={[styles.iconTextRow, styles.lockedTitleRow]}>
          <Icon name="lock" size={12} color={P.slate800} />
          <Text style={[styles.lockedSectionTitle, styles.lockedTitleNoMargin]}>
            {t('farmer.profile.kycLockedTitle')}
          </Text>
        </View>
        <Text style={styles.lockedSectionSubtitle}>
          {t('farmer.profile.kycLockedNote', {
            mobile: personalDetails.mobile,
            aadhaar: personalDetails.aadhaar,
          })}
        </Text>
      </View>
    </ProfileModalShell>
  );
}
