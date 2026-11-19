import React from 'react';
import { t } from '../../../../../../i18n/farmer';
import { LabeledInput, OptionDropdown, SelectedText } from './fields';
import { OPTION_IDS, VALUE_ADDED_CONFIG, dp, optionLabel, type ValueAddedType } from './model';
import type { DairyProductForm as DairyProductFormState } from './useDairyProductForm';
import { QUANTITY_MAX_DECIMALS, QUANTITY_MAX_INTEGER_DIGITS, type ProduceField } from './validation';

const QUANTITY_INPUT_MAX = QUANTITY_MAX_INTEGER_DIGITS + QUANTITY_MAX_DECIMALS + 1;

interface DairyProductFormProps {
  product: ValueAddedType;
  form: DairyProductFormState;
  /** Rendered validation messages, shown after a save attempt. */
  errors?: Partial<Record<ProduceField, string>>;
}

/** Fields for one value-added dairy product (curd, paneer, butter, ghee,
 *  buttermilk or cheese): a variant dropdown, a yield, and -- for curd and
 *  paneer -- the raw milk converted. */
export function DairyProductForm({ product, form, errors = {} }: DairyProductFormProps): React.JSX.Element {
  const { state } = form;
  const config = VALUE_ADDED_CONFIG[product];
  const ids = OPTION_IDS[config.group];
  const selected = state.variant[product];
  return (
    <>
      <OptionDropdown
        label={t(dp(`form.${product}.variantLabel`))}
        trigger={<SelectedText>{optionLabel(config.group, selected)}</SelectedText>}
        isOpen={state.menuOpen[product]}
        onToggle={() => form.toggleMenu(product)}
        items={ids.map((id) => ({ id, title: optionLabel(config.group, id) }))}
        selectedIndex={ids.indexOf(selected)}
        onSelect={(idx) => form.selectVariant(product, ids[idx] ?? selected)}
      />

      <LabeledInput
        label={t(dp(`form.${product}.quantityLabel`))}
        placeholder={t(dp(`form.${product}.quantityPlaceholder`))}
        value={state.quantity[product]}
        onChangeText={(v) => form.setQuantity(product, v)}
        error={errors.quantity}
        maxLength={QUANTITY_INPUT_MAX}
        testID="dairyProductForm.quantity"
      />

      {product === 'curd' || product === 'paneer' ? (
        <LabeledInput
          label={t(dp(`form.${product}.milkUsedLabel`))}
          placeholder={t(dp(`form.${product}.milkUsedPlaceholder`))}
          value={state.milkUsed[product]}
          onChangeText={(v) => form.setMilkUsed(product, v)}
          error={errors.milkUsed}
          maxLength={QUANTITY_INPUT_MAX}
          testID="dairyProductForm.milkUsed"
        />
      ) : null}
    </>
  );
}
