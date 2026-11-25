/**
 * Building blocks every System Settings sub-screen draws with, as in the design:
 * the orange header, select / checkbox / switch fields, detail rows, the
 * dropdown sheet and the dual action bar.
 */
import React from 'react';
import { Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { BackArrowIcon, CheckmarkIcon, ChevronDownIcon, CopyIcon, InfoCircleIcon } from './systemSettingsIcons';
import { ssStyles as styles } from './systemSettingsStyles';

export function ScreenShell({
  title,
  onBack,
  action,
  testID,
  children,
  overlay,
}: {
  title: string;
  onBack: () => void;
  action?: React.ReactNode;
  testID: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.root} testID={testID}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={onBack}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('saSettings.common.back')}
          testID={`${testID}.back`}
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {action}
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {overlay}
    </SafeAreaView>
  );
}

export function HeaderAction({
  onPress,
  label,
  testID,
  children,
}: {
  onPress: (() => void) | undefined;
  label: string;
  testID: string;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={[styles.headerAction, onPress === undefined && styles.disabled]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}

export function SectionTitle({ children, first = false }: { children: string; first?: boolean }) {
  return <Text style={[styles.sectionHeaderTitle, !first && styles.sectionGap]}>{children}</Text>;
}

export function FieldLabel({ children, first = false }: { children: string; first?: boolean }) {
  return <Text style={[styles.fieldLabel, !first && styles.fieldLabelGap]}>{children}</Text>;
}

export function SelectField({
  value,
  placeholder = false,
  onPress,
  leading,
  testID,
}: {
  value: string;
  placeholder?: boolean;
  onPress: (() => void) | undefined;
  leading?: React.ReactNode;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.selectInput, onPress === undefined && styles.disabled]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      testID={testID}
    >
      <View style={styles.selectInputLead}>
        {leading}
        <Text style={[styles.selectInputText, placeholder && styles.placeholderText]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <ChevronDownIcon size={16} color={adminColors.ink} />
    </TouchableOpacity>
  );
}

export function CheckboxRow({
  label,
  checked,
  onToggle,
  padded = false,
  testID,
}: {
  label: string;
  checked: boolean;
  onToggle: (() => void) | undefined;
  padded?: boolean;
  testID: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.checkboxItem, padded && styles.checkboxItemPadded, onToggle === undefined && styles.disabled]}
      activeOpacity={0.8}
      onPress={onToggle}
      disabled={onToggle === undefined}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: onToggle === undefined }}
      testID={testID}
    >
      <View style={[styles.checkboxBox, checked && styles.checkboxBoxActive]}>
        {checked ? <CheckmarkIcon size={14} color={adminColors.onBrand} /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SwitchField({
  label,
  subLabel,
  value,
  onChange,
  bordered = true,
  testID,
}: {
  label: string;
  subLabel?: string | undefined;
  value: boolean;
  onChange: ((next: boolean) => void) | undefined;
  bordered?: boolean;
  testID: string;
}) {
  return (
    <View style={bordered ? styles.switchRow : styles.switchRowPlain}>
      <View style={styles.switchTextBox}>
        <Text style={styles.switchLabel}>{label}</Text>
        {subLabel !== undefined ? <Text style={styles.switchSubLabel}>{subLabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={onChange === undefined}
        trackColor={{ false: adminColors.border, true: adminColors.brand }}
        thumbColor={adminColors.card}
        testID={testID}
      />
    </View>
  );
}

export function HelpText({ children }: { children: string }) {
  return (
    <View style={styles.fieldHelpRow}>
      <InfoCircleIcon size={12} color={adminColors.muted} />
      <Text style={styles.fieldHelpText}>{children}</Text>
    </View>
  );
}

export function DetailRow({
  label,
  value,
  strong = false,
  onCopy,
  last = false,
  testID,
}: {
  label: string;
  value: string;
  strong?: boolean;
  /** Present = the design's copy icon; undefined callback = drawn but disabled. */
  onCopy?: { run: (() => void) | undefined } | undefined;
  last?: boolean;
  testID: string;
}) {
  const valueText = (
    <Text style={[styles.detailValue, strong && styles.detailValueStrong]} numberOfLines={1} testID={`${testID}.value`}>
      {value}
    </Text>
  );
  return (
    <>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        {onCopy === undefined ? (
          valueText
        ) : (
          <TouchableOpacity
            style={[styles.detailValueCopy, onCopy.run === undefined && styles.disabled]}
            activeOpacity={0.7}
            onPress={onCopy.run}
            disabled={onCopy.run === undefined}
            accessibilityRole="button"
            accessibilityLabel={t('saSettings.common.copy')}
            testID={`${testID}.copy`}
          >
            {valueText}
            <CopyIcon />
          </TouchableOpacity>
        )}
      </View>
      {last ? null : <View style={styles.detailDivider} />}
    </>
  );
}

export function DualActions({
  secondary,
  primary,
  testID,
}: {
  secondary: { label: string; onPress: (() => void) | undefined };
  primary: { label: string; onPress: (() => void) | undefined };
  testID: string;
}) {
  return (
    <View style={styles.bottomRow}>
      <TouchableOpacity
        style={[styles.resetButton, secondary.onPress === undefined && styles.disabled]}
        activeOpacity={0.8}
        onPress={secondary.onPress}
        disabled={secondary.onPress === undefined}
        accessibilityRole="button"
        testID={`${testID}.secondary`}
      >
        <Text style={styles.resetButtonText}>{secondary.label}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveButton, primary.onPress === undefined && styles.disabled]}
        activeOpacity={0.8}
        onPress={primary.onPress}
        disabled={primary.onPress === undefined}
        accessibilityRole="button"
        testID={`${testID}.primary`}
      >
        <Text style={styles.saveButtonText}>{primary.label}</Text>
      </TouchableOpacity>
    </View>
  );
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownState {
  title: string;
  options: readonly DropdownOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export function DropdownModal({ state, onClose }: { state: DropdownState | null; onClose: () => void }) {
  if (state === null) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} testID="saSettings.dropdown">
        <View style={styles.dropdownModalCard}>
          <Text style={styles.dropdownModalTitle}>{state.title}</Text>
          {state.options.map((opt) => {
            const selected = state.selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.dropdownOptionRow, selected && styles.dropdownOptionRowActive]}
                activeOpacity={0.75}
                onPress={() => {
                  state.onSelect(opt.value);
                  onClose();
                }}
                testID={`saSettings.dropdown.option.${opt.value}`}
              >
                <Text style={[styles.dropdownOptionText, selected && styles.dropdownOptionTextActive]}>{opt.label}</Text>
                {selected ? <CheckmarkIcon size={16} color={adminColors.brand} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
