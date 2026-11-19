import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { CowIcon, PawIcon } from './icons';
import { LabeledInput, OptionDropdown, SelectedText } from './fields';
import { OPTION_IDS, animalTypeText, dp, optionLabel, type AvailableAnimal } from './model';
import { styles } from './styles';
import type { MilkForm as MilkFormState } from './useMilkForm';
import { FAT_PERCENT_MAX, QUANTITY_MAX_INTEGER_DIGITS, QUANTITY_MAX_DECIMALS, type ProduceField } from './validation';

interface MilkFormProps {
  form: MilkFormState;
  animals: AvailableAnimal[];
  currentAnimal: AvailableAnimal;
  /** Rendered validation messages, shown after a save attempt. */
  errors?: Partial<Record<ProduceField, string>>;
}

/** Fields for logging a per-animal milking session. */
export function MilkForm({ form, animals, currentAnimal, errors = {} }: MilkFormProps): React.JSX.Element {
  const { state } = form;
  const sessionIds = OPTION_IDS.milkSession;
  return (
    <>
      <OptionDropdown
        label={t(dp('milk.animalLabel'))}
        trigger={
          <View style={styles.dropdownSelectedRow}>
            <View style={[styles.miniBadge, styles.miniBadgeMilk]}>
              {currentAnimal.iconType === 'cow' ? (
                <CowIcon size={16} color={colors.brandGreen} />
              ) : (
                <PawIcon size={14} color={colors.brandGreen} />
              )}
            </View>
            <View style={styles.flexFill}>
              <Text style={styles.dropdownSelectedText}>{currentAnimal.name}</Text>
              <Text style={styles.dropdownSelectedSub}>
                {animalTypeText(currentAnimal.type)} · {currentAnimal.breed} ({currentAnimal.code})
              </Text>
            </View>
          </View>
        }
        isOpen={state.animalOpen}
        onToggle={form.toggleAnimalMenu}
        items={animals.map((a) => ({
          id: a.id,
          title: a.name,
          subtitle: `${animalTypeText(a.type)} · ${a.breed} · ${a.code}`,
        }))}
        selectedIndex={state.animalIndex}
        onSelect={form.selectAnimal}
      />

      <OptionDropdown
        label={t(dp('milk.sessionLabel'))}
        trigger={<SelectedText>{optionLabel('milkSession', state.session)}</SelectedText>}
        isOpen={state.sessionOpen}
        onToggle={form.toggleSessionMenu}
        items={sessionIds.map((id) => ({ id, title: optionLabel('milkSession', id) }))}
        selectedIndex={sessionIds.indexOf(state.session)}
        onSelect={(idx) => form.selectSession(sessionIds[idx] ?? state.session)}
      />

      <LabeledInput
        label={t(dp('milk.quantityLabel'))}
        placeholder={t(dp('milk.quantityPlaceholder'))}
        value={state.quantity}
        onChangeText={form.setQuantity}
        error={errors.quantity}
        maxLength={QUANTITY_MAX_INTEGER_DIGITS + QUANTITY_MAX_DECIMALS + 1}
        testID="milkForm.quantity"
      />
      <LabeledInput
        label={t(dp('milk.fatLabel'))}
        placeholder={t(dp('milk.fatPlaceholder'))}
        value={state.fat}
        onChangeText={form.setFat}
        error={errors.fat}
        maxLength={String(FAT_PERCENT_MAX).length + 3}
        testID="milkForm.fat"
      />
    </>
  );
}
