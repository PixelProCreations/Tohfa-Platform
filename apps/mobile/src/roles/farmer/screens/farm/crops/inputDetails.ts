import { Alert } from 'react-native';
import { t, type TranslationKey } from '../../../../../i18n/farmer';

/**
 * Purpose and target-pest options for Add / Edit Input Applied (BR-56k).
 *
 * The API stores `purpose` and `targetPest` as plain strings. The form sends a
 * stable code (never the label the farmer saw), so a row recorded in Tamil reads
 * the same as one recorded in English, and the label is looked up again on
 * display. A stored value that is not one of these codes (an older client, or a
 * future free-text entry) is shown as it was stored rather than dropped.
 *
 * These are the Dev design's pick-list options, not facts about any farm.
 */
export const PURPOSE_CODES = [
  'GENERAL_NUTRITION',
  'PEST_PREVENTION',
  'DISEASE_CONTROL',
  'SOIL_FERTILITY',
  'FLOWERING_BOOSTER',
] as const;
export type PurposeCode = (typeof PURPOSE_CODES)[number];

export const PEST_CODES = [
  'APHIDS',
  'FRUIT_BORER',
  'EARLY_BLIGHT',
  'LEAF_CURL_VIRUS',
  'WHITEFLIES',
  'MITES',
  'CUTWORMS',
  'POWDERY_MILDEW',
] as const;
export type PestCode = (typeof PEST_CODES)[number];

const PURPOSE_LABEL_KEY: Record<PurposeCode, TranslationKey> = {
  GENERAL_NUTRITION: 'farmer.addInput.purposeOption.GENERAL_NUTRITION',
  PEST_PREVENTION: 'farmer.addInput.purposeOption.PEST_PREVENTION',
  DISEASE_CONTROL: 'farmer.addInput.purposeOption.DISEASE_CONTROL',
  SOIL_FERTILITY: 'farmer.addInput.purposeOption.SOIL_FERTILITY',
  FLOWERING_BOOSTER: 'farmer.addInput.purposeOption.FLOWERING_BOOSTER',
};

const PEST_LABEL_KEY: Record<PestCode, TranslationKey> = {
  APHIDS: 'farmer.addInput.pestOption.APHIDS',
  FRUIT_BORER: 'farmer.addInput.pestOption.FRUIT_BORER',
  EARLY_BLIGHT: 'farmer.addInput.pestOption.EARLY_BLIGHT',
  LEAF_CURL_VIRUS: 'farmer.addInput.pestOption.LEAF_CURL_VIRUS',
  WHITEFLIES: 'farmer.addInput.pestOption.WHITEFLIES',
  MITES: 'farmer.addInput.pestOption.MITES',
  CUTWORMS: 'farmer.addInput.pestOption.CUTWORMS',
  POWDERY_MILDEW: 'farmer.addInput.pestOption.POWDERY_MILDEW',
};

function isPurposeCode(value: string): value is PurposeCode {
  return (PURPOSE_CODES as readonly string[]).includes(value);
}

function isPestCode(value: string): value is PestCode {
  return (PEST_CODES as readonly string[]).includes(value);
}

/** The localized label for a stored purpose; an unknown value is shown as stored. */
export function purposeLabel(value: string): string {
  return isPurposeCode(value) ? t(PURPOSE_LABEL_KEY[value]) : value;
}

/** The localized label for a stored target pest; an unknown value is shown as stored. */
export function targetPestLabel(value: string): string {
  return isPestCode(value) ? t(PEST_LABEL_KEY[value]) : value;
}

/**
 * The one delete confirmation for a crop input (BR-56l), shared by the history
 * row and the edit screen so both ask the same question. `onConfirm` runs only
 * when the farmer taps Delete.
 */
export function confirmDeleteCropInput(inputName: string, onConfirm: () => void): void {
  Alert.alert(
    t('farmer.inputHistory.deleteConfirm.title'),
    t('farmer.inputHistory.deleteConfirm.body', { name: inputName }),
    [
      { text: t('farmer.common.cancel'), style: 'cancel' },
      { text: t('farmer.inputHistory.deleteConfirm.confirm'), style: 'destructive', onPress: onConfirm },
    ],
  );
}
