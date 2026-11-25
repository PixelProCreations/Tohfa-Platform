/**
 * The design's three pill rows (bottom sheet, full filter page, inline history
 * card) drawn by one component; each variant keeps the design's own styles.
 */
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { filterStyles } from './filterStyles';

export type PillVariant = 'sheet' | 'page' | 'inline' | 'inlineScroll';

export interface FilterPillGroupProps<T extends string | number> {
  variant: PillVariant;
  options: readonly T[];
  selected: T;
  label: (option: T) => string;
  onSelect: (option: T) => void;
}

function Pill<T extends string | number>({
  variant,
  option,
  active,
  label,
  onSelect,
}: {
  variant: PillVariant;
  option: T;
  active: boolean;
  label: string;
  onSelect: (option: T) => void;
}) {
  if (variant === 'sheet') {
    return (
      <TouchableOpacity
        style={[filterStyles.filterModalPill, active ? filterStyles.filterModalPillActive : filterStyles.filterModalPillInactive]}
        onPress={() => onSelect(option)}
        activeOpacity={0.8}
      >
        <Text style={[filterStyles.filterModalPillText, active ? filterStyles.filterModalPillTextActive : filterStyles.filterModalPillTextInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
  if (variant === 'page') {
    return (
      <TouchableOpacity
        style={[filterStyles.pillButton, active ? filterStyles.pillButtonActive : filterStyles.pillButtonInactive]}
        onPress={() => onSelect(option)}
        activeOpacity={0.8}
      >
        <Text style={[filterStyles.pillButtonText, active ? filterStyles.pillButtonTextActive : filterStyles.pillButtonTextInactive]}>{label}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      style={[filterStyles.inlineFilterPill, active && filterStyles.inlineFilterPillActive]}
      onPress={() => onSelect(option)}
      activeOpacity={0.8}
    >
      <Text style={[filterStyles.inlineFilterPillText, active && filterStyles.inlineFilterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FilterPillGroup<T extends string | number>({ variant, options, selected, label, onSelect }: FilterPillGroupProps<T>) {
  const pills = options.map((o) => (
    <Pill key={String(o)} variant={variant} option={o} active={o === selected} label={label(o)} onSelect={onSelect} />
  ));
  if (variant === 'inlineScroll') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterStyles.inlineFilterStatusScroll}>
        {pills}
      </ScrollView>
    );
  }
  const row = variant === 'sheet' ? filterStyles.filterModalPillsRow : variant === 'page' ? filterStyles.filterPillsContainer : filterStyles.inlineFilterPillsRow;
  return <View style={row}>{pills}</View>;
}
