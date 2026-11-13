import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P } from '../../../theme';
import { ProfileModalShell } from './ProfileModalShell';
import type { FarmDetailsData } from './profileHelpers';
import type { FieldValidation } from '../../../utils/validation';
import type { FarmField } from '../profileValidation';
import type { FarmEditForm } from './useProfileEditForms';
import { styles } from './profileStyles';

interface EditFarmModalProps {
  visible: boolean;
  form: FarmEditForm;
  setField: (key: keyof FarmEditForm, value: string) => void;
  farmDetails: FarmDetailsData;
  /** Inline errors for the typed fields; ProfileScreen gates `onSave` with its validateAll(). */
  validation: FieldValidation<FarmField>;
  hasBoundary: boolean;
  gpsStatusLabel: string;
  onClose: () => void;
  onSave: () => void;
}

export function EditFarmModal({
  visible,
  form,
  setField,
  farmDetails,
  validation,
  hasBoundary,
  gpsStatusLabel,
  onClose,
  onSave,
}: EditFarmModalProps): React.JSX.Element {
  return (
    <ProfileModalShell
      visible={visible}
      title={t('farmer.profile.farm.editTitle')}
      onClose={onClose}
      footer={
        <>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveBtnText}>{t('farmer.common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={styles.inputLabel}>{t('farmer.profile.farm.acresLabel')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.acres}
        onChangeText={(v) => setField('acres', v)}
        onBlur={() => validation.onBlur('acres')}
        maxLength={12}
        keyboardType="decimal-pad"
        placeholder={t('farmer.profile.farm.acresPlaceholder')}
      />
      {validation.messageFor('acres') ? <Text style={styles.fieldErrorText}>{validation.messageFor('acres')}</Text> : null}

      <Text style={styles.inputLabel}>{t('farmer.profile.farm.zonesLabel')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.zones}
        onChangeText={(v) => setField('zones', v)}
        onBlur={() => validation.onBlur('zones')}
        maxLength={4}
        keyboardType="numeric"
        placeholder={t('farmer.profile.farm.zonesPlaceholder')}
      />
      {validation.messageFor('zones') ? <Text style={styles.fieldErrorText}>{validation.messageFor('zones')}</Text> : null}

      <Text style={styles.inputLabel}>{t('farmer.profile.farm.waterSource')}</Text>
      <TextInput
        style={styles.textInput}
        value={form.waterSource}
        onChangeText={(v) => setField('waterSource', v)}
        onBlur={() => validation.onBlur('waterSource')}
        maxLength={600}
        placeholder={t('farmer.profile.farm.waterSourcePlaceholder')}
      />
      {validation.messageFor('waterSource') ? <Text style={styles.fieldErrorText}>{validation.messageFor('waterSource')}</Text> : null}

      <View style={styles.lockedSection}>
        <View style={[styles.iconTextRow, styles.lockedTitleRow]}>
          <Icon name="place" size={12} color={P.slate800} />
          <Text style={[styles.lockedSectionTitle, styles.lockedTitleNoMargin]}>
            {t('farmer.profile.farm.fmbTitle')}
          </Text>
        </View>
        <Text style={styles.lockedSectionSubtitle}>
          {hasBoundary
            ? t('farmer.profile.farm.fmbNote', {
                points: farmDetails.fmbPts,
                coordinates: gpsStatusLabel,
              })
            : t('farmer.profile.farm.fmbPendingNote')}
        </Text>
      </View>
    </ProfileModalShell>
  );
}
