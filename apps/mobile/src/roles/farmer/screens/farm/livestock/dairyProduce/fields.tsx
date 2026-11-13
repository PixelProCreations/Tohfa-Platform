import React from 'react';
import { Text, TextInput, TouchableOpacity, View, type KeyboardTypeOptions } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import { CheckIcon, ChevronDownIcon } from './icons';
import { styles } from './styles';

export interface OptionItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface OptionDropdownProps {
  label: string;
  /** Contents of the closed trigger (selected value). */
  trigger: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  items: OptionItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Egg forms highlight the selection in brown rather than brand green. */
  tone?: 'green' | 'brown';
}

/** Label + dropdown trigger + (when open) its menu. */
export function OptionDropdown({
  label,
  trigger,
  isOpen,
  onToggle,
  items,
  selectedIndex,
  onSelect,
  tone = 'green',
}: OptionDropdownProps): React.JSX.Element {
  const activeTitle = tone === 'brown' ? styles.menuItemTitleActiveEgg : styles.menuItemTitleActive;
  const checkColor = tone === 'brown' ? P.brownDeep2 : colors.brandGreen;
  return (
    <>
      <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>{label}</Text>
      <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.8} onPress={onToggle}>
        {trigger}
        <ChevronDownIcon size={18} color={P.twGray500} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          {items.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                onPress={() => onSelect(idx)}
              >
                {item.subtitle !== undefined ? (
                  <View style={styles.flexFill}>
                    <Text style={[styles.menuItemTitle, isSelected && activeTitle]}>{item.title}</Text>
                    <Text style={styles.menuItemSub}>{item.subtitle}</Text>
                  </View>
                ) : (
                  <Text style={[styles.menuItemTitle, isSelected && activeTitle]}>{item.title}</Text>
                )}
                {isSelected && <CheckIcon size={18} color={checkColor} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );
}

/** Plain selected-value text used as the trigger of a simple dropdown. */
export function SelectedText({ children }: { children: string }): React.JSX.Element {
  return <Text style={styles.dropdownSelectedText}>{children}</Text>;
}

interface LabeledInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  /** Rendered message under the input when it fails validation. */
  error?: string | undefined;
  maxLength?: number;
  testID?: string;
}

export function LabeledInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'decimal-pad',
  error,
  maxLength,
  testID,
}: LabeledInputProps): React.JSX.Element {
  return (
    <>
      <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>{label}</Text>
      <TextInput
        style={styles.textInput}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={P.twGray400}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        testID={testID}
      />
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </>
  );
}
