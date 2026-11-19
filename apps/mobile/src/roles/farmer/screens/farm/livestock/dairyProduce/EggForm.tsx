import React from 'react';
import { Text, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { EggIcon } from './icons';
import { LabeledInput, OptionDropdown, SelectedText } from './fields';
import { OPTION_IDS, dp, optionLabel, type AvailableFlock } from './model';
import { styles } from './styles';
import type { EggForm as EggFormState } from './useEggForm';
import { COUNT_MAX, type ProduceField } from './validation';

interface EggFormProps {
  form: EggFormState;
  flocks: AvailableFlock[];
  currentFlock: AvailableFlock;
  /** Rendered validation messages, shown after a save attempt. */
  errors?: Partial<Record<ProduceField, string>>;
}

/** Fields for logging a flock-level egg collection. */
export function EggForm({ form, flocks, currentFlock, errors = {} }: EggFormProps): React.JSX.Element {
  const { state } = form;
  const sessionIds = OPTION_IDS.eggSession;
  return (
    <>
      <OptionDropdown
        tone="brown"
        label={t(dp('egg.flockLabel'))}
        trigger={
          <View style={styles.dropdownSelectedRow}>
            <View style={[styles.miniBadge, styles.miniBadgeEggs]}>
              <EggIcon size={16} color={P.twAmber700} fill={P.twAmber700} />
            </View>
            <View style={styles.flexFill}>
              <Text style={styles.dropdownSelectedText}>{currentFlock.name}</Text>
              <Text style={styles.dropdownSelectedSub}>{currentFlock.subtitle}</Text>
            </View>
          </View>
        }
        isOpen={state.flockOpen}
        onToggle={form.toggleFlockMenu}
        items={flocks.map((f) => ({ id: f.id, title: f.name, subtitle: f.subtitle }))}
        selectedIndex={state.flockIndex}
        onSelect={form.selectFlock}
      />

      <OptionDropdown
        tone="brown"
        label={t(dp('egg.sessionLabel'))}
        trigger={<SelectedText>{optionLabel('eggSession', state.session)}</SelectedText>}
        isOpen={state.sessionOpen}
        onToggle={form.toggleSessionMenu}
        items={sessionIds.map((id) => ({ id, title: optionLabel('eggSession', id) }))}
        selectedIndex={sessionIds.indexOf(state.session)}
        onSelect={(idx) => form.selectSession(sessionIds[idx] ?? state.session)}
      />

      <LabeledInput
        keyboardType="number-pad"
        label={t(dp('egg.goodLabel'))}
        placeholder={t(dp('egg.goodPlaceholder'))}
        value={state.count}
        onChangeText={form.setCount}
        error={errors.count}
        maxLength={COUNT_MAX.length}
        testID="eggForm.count"
      />
      <LabeledInput
        keyboardType="number-pad"
        label={t(dp('egg.damagedLabel'))}
        placeholder={t(dp('egg.damagedPlaceholder'))}
        value={state.damaged}
        onChangeText={form.setDamaged}
        error={errors.damaged}
        maxLength={COUNT_MAX.length}
        testID="eggForm.damaged"
      />
    </>
  );
}
