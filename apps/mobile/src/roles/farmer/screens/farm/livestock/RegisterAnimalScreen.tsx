import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text } from 'react-native';
import { ScreenStatusBar, appAlert } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { extractFieldErrors, formatErrorMessage } from '../../../../../shell/api/client';
import { createAnimal, type CreateAnimalBody } from '../../../api/livestock';
import { AnimalFormFields } from './animalForm/AnimalFormFields';
import { AnimalAvatar, AnimalFormHeader, AnimalOptionPickers, SubmitBar } from './animalForm/chrome';
import { DatePickerModal } from './animalForm/DatePickerModal';
import { af } from './animalForm/i18n';
import {
  formatDisplayDate,
  genderToApi,
  organicStatusToApi,
  parseDisplayDate,
  sourceToApi,
  speciesLabel,
  speciesToApi,
  toIsoDate,
  type AnimalFormData,
} from './animalForm/model';
import { styles } from './animalForm/styles';
import { useAnimalForm } from './animalForm/useAnimalForm';
import { useDatePicker } from './animalForm/useDatePicker';
import { validateAnimalText } from './animalForm/validation';

// The form-data contract lives with the shared form; re-exported here because
// routes and AnimalDetailScreen import it from this module.
export type { AnimalFormData };

export interface RegisterAnimalScreenProps {
  initialAnimal?: Partial<AnimalFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: AnimalFormData) => void;
}

export function RegisterAnimalScreen({
  initialAnimal,
  onBack,
  onCancel,
  onSave,
}: RegisterAnimalScreenProps): React.JSX.Element {
  // A blank registration form -- the mock's placeholder identifiers ("C-015",
  // "Coonoor Dairy") were stand-in example values, not real defaults; keeping
  // them would submit a duplicate tag on every save (CONFLICT), so a fresh
  // form starts genuinely blank instead.
  const form = useAnimalForm({
    tag: initialAnimal?.tag || '',
    name: undefined,
    species: initialAnimal?.species || 'Cattle',
    gender: initialAnimal?.gender || 'Female',
    breed: initialAnimal?.breed || '',
    dob: initialAnimal?.dob || formatDisplayDate(new Date()),
    source: initialAnimal?.source || 'purchased',
    purchaseDate: initialAnimal?.purchaseDate || formatDisplayDate(new Date()),
    sourceFarm: initialAnimal?.sourceFarm || '',
    organicStatus: initialAnimal?.organicStatus || 'Transitioning',
  });
  const { state, patch, setField } = form;
  const datePicker = useDatePicker(state.dob);

  const handleSave = async () => {
    if (state.isSubmitting) return;
    patch({ submitError: '', fieldErrors: {} });
    const { tag, species, gender, breed, dob, source, purchaseDate, sourceFarm, organicStatus } = state;

    const trimmedTag = tag.trim();
    const textErrors = validateAnimalText(
      { tag, breed, sourceFarm, purchased: source === 'purchased' },
      t('farmer.livestock.registerAnimal.tagRequiredError'),
    );
    if (Object.keys(textErrors).length > 0) {
      patch({ fieldErrors: textErrors });
      return;
    }

    const body: CreateAnimalBody = {
      tag: trimmedTag,
      species: speciesToApi(species),
      gender: genderToApi(gender),
      ...(breed.trim() ? { breed: breed.trim() } : {}),
      dateOfBirth: toIsoDate(parseDisplayDate(dob)),
      source: sourceToApi(source),
      ...(source === 'purchased' ? { purchasedOn: toIsoDate(parseDisplayDate(purchaseDate)) } : {}),
      ...(source === 'purchased' && sourceFarm.trim() ? { sourceFarm: sourceFarm.trim() } : {}),
      organicStatus: organicStatusToApi(organicStatus),
    };

    patch({ isSubmitting: true });
    try {
      const created = await createAnimal(body);
      const payload: AnimalFormData = {
        id: created.id,
        tag: created.tag,
        name: created.name ?? undefined,
        species,
        gender,
        breed: created.breed ?? '',
        dob,
        source,
        purchaseDate: source === 'purchased' ? purchaseDate : undefined,
        sourceFarm: source === 'purchased' ? sourceFarm.trim() : undefined,
        organicStatus,
      };

      if (onSave) {
        onSave(payload);
      } else {
        appAlert(
          af('register.savedTitle'),
          af('register.savedMessage', { tag: trimmedTag, label: breed.trim() || speciesLabel(species) }),
          [{ text: t('farmer.common.ok'), onPress: onBack || onCancel }],
          { tone: 'success' },
        );
      }
    } catch (err: unknown) {
      patch({
        submitError: formatErrorMessage(err, t('farmer.livestock.registerAnimal.saveError')),
        fieldErrors: extractFieldErrors(err),
      });
    } finally {
      patch({ isSubmitting: false });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AnimalFormHeader
          title={af('register.title')}
          subtitle={af('register.subtitle')}
          onBack={onBack}
          onCancel={onCancel}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AnimalAvatar hint={af('register.addPhoto')} />
          <AnimalFormFields
            form={form}
            tagPlaceholder={af('register.tagPlaceholder')}
            onPressDob={() => datePicker.open('dob', state.dob)}
            onPressPurchaseDate={() => datePicker.open('purchaseDate', state.purchaseDate)}
            statusExplainer={
              <>
                {af('register.statusExplainerBefore')}
                <Text style={styles.statusHighlightOrange}>{t('farmer.livestock.list.statusTransitioning')}</Text>
                {af('register.statusExplainerAfter')}
              </>
            }
          />
        </ScrollView>

        <SubmitBar label={af('register.submit')} isSubmitting={state.isSubmitting} onPress={() => void handleSave()} />

        <AnimalOptionPickers form={form} variant="register" />
        <DatePickerModal picker={datePicker} onApply={setField} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
