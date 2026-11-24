/**
 * The "Related crops" chips (BR-59r), drawn from the fetched crop list. The
 * forms own the section label and the chip styles; this draws what goes under
 * the label, so the two forms cannot drift apart and the chips look exactly as
 * they did.
 *
 * Five states, each its own thing, never one blank row:
 *   ready    the crop list as chips, tapped to select;
 *   loading  a "loading" note;
 *   error    an error note and Retry;
 *   empty    a note that the crop list has no crops (genuinely empty);
 *   denied   a note that this account cannot browse the crop list.
 * Outside `ready` the chips are inert. What the item is already tagged with
 * still shows (selected, disabled) so it is visible that the tags are kept; with
 * none, one disabled dash chip stands in for them — the designed element stays,
 * and a dash says "no value", never "no crops exist".
 */
import React from 'react';
import { Text, TouchableOpacity, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { cropChipLabel } from './communityLogic';
import type { CropPicker as CropPickerModel } from './useCropPicker';

export interface CropPickerStyles {
  chipsRow: StyleProp<ViewStyle>;
  chip: StyleProp<ViewStyle>;
  chipActive: StyleProp<ViewStyle>;
  chipText: StyleProp<TextStyle>;
  chipTextActive: StyleProp<TextStyle>;
  helperText: StyleProp<TextStyle>;
}

export interface CropPickerProps {
  picker: CropPickerModel;
  styles: CropPickerStyles;
}

const NOTE_KEY = {
  loading: 'community.crops.loading',
  error: 'community.crops.error',
  empty: 'community.crops.empty',
  denied: 'community.crops.denied',
} as const;

export function CropPicker({ picker, styles }: CropPickerProps) {
  const { state } = picker;
  const interactive = state === 'ready';
  const shown = interactive ? picker.options : picker.tagged;
  const selected = new Set(picker.selectedIds);

  return (
    <>
      <View style={styles.chipsRow}>
        {shown.map((crop) => {
          const isSelected = selected.has(crop.id);
          return (
            <TouchableOpacity
              key={crop.id}
              testID={`community.cropPicker.chip.${crop.id}`}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={interactive ? () => picker.toggle(crop.id) : undefined}
              disabled={!interactive}
              accessibilityState={{ selected: isSelected, disabled: !interactive }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{cropChipLabel(crop)}</Text>
            </TouchableOpacity>
          );
        })}
        {shown.length === 0 && state !== 'empty' && state !== 'ready' ? (
          <TouchableOpacity
            testID="community.cropPicker.none"
            style={styles.chip}
            disabled
            accessibilityState={{ disabled: true }}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{ADMIN_NO_VALUE}</Text>
          </TouchableOpacity>
        ) : null}
        {state === 'error' ? (
          <TouchableOpacity
            testID="community.cropPicker.retry"
            style={styles.chip}
            onPress={picker.retry}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>{t('async.retry')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {state !== 'ready' ? (
        <Text style={styles.helperText} testID="community.cropPicker.note" accessibilityLiveRegion="polite">
          {t(NOTE_KEY[state])}
        </Text>
      ) : null}
    </>
  );
}
