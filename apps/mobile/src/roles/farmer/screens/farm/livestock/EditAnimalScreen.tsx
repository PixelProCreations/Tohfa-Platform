import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, View } from 'react-native';
import { ErrorState, Skeleton, ScreenStatusBar, appAlert } from '@tohfa/mobile-ui';
import { authPalette as P, radius } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { extractFieldErrors, formatErrorMessage } from '../../../../../shell/api/client';
import { getAnimal, updateAnimal, type AnimalResponse, type UpdateAnimalBody } from '../../../api/livestock';
import { AnimalFormFields } from './animalForm/AnimalFormFields';
import { AnimalAvatar, AnimalFormHeader, AnimalOptionPickers, SubmitBar } from './animalForm/chrome';
import { af } from './animalForm/i18n';
import {
  genderFromApi,
  genderToApi,
  isoToDisplay,
  organicStatusFromApi,
  organicStatusToApi,
  parseDisplayDate,
  sourceFromApi,
  sourceToApi,
  speciesFromApi,
  speciesLabel,
  speciesToApi,
  toIsoDate,
  type AnimalFormData,
} from './animalForm/model';
import { AVATAR_SIZE, FIELD_HEIGHT, styles } from './animalForm/styles';
import { useAnimalForm, type AnimalFormValues } from './animalForm/useAnimalForm';
import { validateAnimalText } from './animalForm/validation';

export interface EditAnimalScreenProps {
  initialAnimal?: Partial<AnimalFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: AnimalFormData) => void;
}

/** Form values from the server's copy of the animal (dates as "02 Jun 2026"). */
function valuesFromAnimal(animal: AnimalResponse): Partial<AnimalFormValues> {
  return {
    tag: animal.tag,
    name: animal.name ?? undefined,
    species: speciesFromApi(animal.species),
    gender: genderFromApi(animal.gender),
    breed: animal.breed ?? '',
    dob: animal.dateOfBirth ? isoToDisplay(animal.dateOfBirth) : '',
    source: sourceFromApi(animal.source),
    purchaseDate: animal.purchasedOn ? isoToDisplay(animal.purchasedOn) : '',
    sourceFarm: animal.sourceFarm ?? '',
    organicStatus: organicStatusFromApi(animal.organicStatus),
  };
}

const SKELETON_FIELD_ROWS = 3;

export function EditAnimalScreen({
  initialAnimal,
  onBack,
  onCancel,
  onSave,
}: EditAnimalScreenProps): React.JSX.Element {
  const animalId = initialAnimal?.id;

  const form = useAnimalForm({
    tag: initialAnimal?.tag || '',
    name: initialAnimal?.name,
    species: initialAnimal?.species || 'Cattle',
    gender: initialAnimal?.gender || 'Female',
    breed: initialAnimal?.breed || '',
    dob: initialAnimal?.dob || '',
    source: initialAnimal?.source || 'purchased',
    purchaseDate: initialAnimal?.purchaseDate || '',
    sourceFarm: initialAnimal?.sourceFarm || '',
    organicStatus: initialAnimal?.organicStatus || 'Organic',
  });
  const { state, patch, setField } = form;

  // Load / error state for the initial GET
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    if (!animalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const animal = await getAnimal(animalId);
      patch(valuesFromAnimal(animal));
    } catch (err: unknown) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [animalId, patch]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (state.isSubmitting) return;
    patch({ submitError: '', fieldErrors: {} });
    const { tag, species, gender, breed, dob, source, purchaseDate, sourceFarm, organicStatus } = state;

    if (!animalId) {
      patch({ submitError: t('farmer.livestock.editAnimal.missingIdError') });
      return;
    }

    const trimmedTag = tag.trim();
    const textErrors = validateAnimalText(
      { tag, breed, sourceFarm, purchased: source === 'purchased' },
      t('farmer.livestock.editAnimal.tagRequiredError'),
    );
    if (Object.keys(textErrors).length > 0) {
      patch({ fieldErrors: textErrors });
      return;
    }

    const body: UpdateAnimalBody = {
      tag: trimmedTag,
      species: speciesToApi(species),
      gender: genderToApi(gender),
      breed: breed.trim() ? breed.trim() : null,
      dateOfBirth: dob.trim() ? toIsoDate(parseDisplayDate(dob)) : null,
      source: sourceToApi(source),
      purchasedOn: source === 'purchased' && purchaseDate.trim() ? toIsoDate(parseDisplayDate(purchaseDate)) : null,
      sourceFarm: source === 'purchased' && sourceFarm.trim() ? sourceFarm.trim() : null,
      organicStatus: organicStatusToApi(organicStatus),
    };

    patch({ isSubmitting: true });
    try {
      const updated = await updateAnimal(animalId, body);
      const payload: AnimalFormData = {
        id: updated.id,
        tag: updated.tag,
        name: updated.name ?? undefined,
        species,
        gender,
        breed: updated.breed ?? '',
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
          af('edit.updatedTitle'),
          af('edit.updatedMessage', { tag: trimmedTag, label: breed.trim() || speciesLabel(species) }),
          [{ text: t('farmer.common.ok'), onPress: onBack || onCancel }],
          { tone: 'success' },
        );
      }
    } catch (err: unknown) {
      patch({
        submitError: formatErrorMessage(err, t('farmer.livestock.editAnimal.saveError')),
        fieldErrors: extractFieldErrors(err),
      });
    } finally {
      patch({ isSubmitting: false });
    }
  };

  // Dates on this screen are typed in (iOS Alert.prompt), not picked from a calendar.
  const promptDate = (title: string, message: string, field: 'dob' | 'purchaseDate') => {
    if (Alert.prompt) {
      Alert.prompt(title, message, (val) => {
        if (val) setField(field, val);
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} style={styles.skeletonAvatar} />
          {Array.from({ length: SKELETON_FIELD_ROWS }, (_, i) => (
            <Skeleton key={i} width="100%" height={FIELD_HEIGHT} borderRadius={radius.lg} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !animalId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.loadErrorContainer}>
          <ErrorState
            error={loadError}
            message={!animalId ? t('farmer.livestock.editAnimal.missingIdError') : undefined}
            onRetry={animalId ? () => void load() : undefined}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AnimalFormHeader
          title={af('edit.title')}
          subtitle={
            <>
              {state.name || state.tag} · {state.tag}
            </>
          }
          onBack={onBack}
          onCancel={onCancel}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AnimalAvatar hint={af('edit.changePhoto')} />
          <AnimalFormFields
            form={form}
            tagPlaceholder={af('edit.tagPlaceholder')}
            onPressDob={() => promptDate(t('farmer.profile.dob'), af('edit.dobPromptMessage'), 'dob')}
            onPressPurchaseDate={() =>
              promptDate(af('field.purchaseDateTitle'), af('edit.purchaseDatePromptMessage'), 'purchaseDate')
            }
            statusExplainer={af('edit.statusExplainer')}
          />
        </ScrollView>

        <SubmitBar label={t('farmer.fmb.edit.save')} isSubmitting={state.isSubmitting} onPress={() => void handleSave()} />

        <AnimalOptionPickers form={form} variant="edit" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
