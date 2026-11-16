/**
 * Small building blocks the Market & Pricing view-only screens share, drawn as
 * in the team design: the search bar with its filter button, a status badge,
 * the details sheet (spec rows with dotted dividers + Close), the header
 * filter button and the Load more link. No data and no decisions here.
 */
import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import type { PricingTone } from './pricingLogic';
import { HorizontalSlidersIcon, SearchIcon } from './PricingIcons';
import { styles, TONE_BG, TONE_TEXT } from './pricingStyles';

export interface PricingSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  testID: string;
  onFilterPress?: (() => void) | undefined;
  filterTestID?: string | undefined;
}

export function PricingSearchBar({ value, onChangeText, placeholder, testID, onFilterPress, filterTestID }: PricingSearchBarProps) {
  return (
    <View style={styles.searchBarContainer}>
      <SearchIcon />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
        value={value}
        onChangeText={onChangeText}
        testID={testID}
      />
      {onFilterPress ? (
        <TouchableOpacity
          style={styles.searchFilterBtn}
          onPress={onFilterPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('pricingCeiling.ceiling.openFilters')}
          testID={filterTestID}
        >
          <HorizontalSlidersIcon />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function PricingBadge({ label, tone }: { label: string; tone: PricingTone }) {
  return (
    <View style={[styles.badge, { backgroundColor: TONE_BG[tone] }]}>
      <Text style={[styles.badgeText, { color: TONE_TEXT[tone] }]}>{label}</Text>
    </View>
  );
}

export function LoadMoreLink({ onPress, testID }: { onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity style={styles.loadMore} onPress={onPress} accessibilityRole="button" testID={testID}>
      <Text style={styles.loadMoreText}>{t('pricingCeiling.loadMore')}</Text>
    </TouchableOpacity>
  );
}

export interface SpecEntry {
  key: string;
  label: string;
  value: string;
}

/** The design's spec table: label left, bold value right, dotted dividers between. */
export function SpecTable({ entries }: { entries: readonly SpecEntry[] }) {
  return (
    <View style={styles.specCard}>
      {entries.map((entry, i) => (
        <React.Fragment key={entry.key}>
          {i > 0 ? <View style={styles.dottedDivider} /> : null}
          <View style={styles.specRow}>
            <Text style={styles.specKey}>{entry.label}</Text>
            <Text style={styles.specValBold}>{entry.value}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export interface PricingSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeTestID: string;
  children: React.ReactNode;
}

/** A bottom sheet over the scrim; tapping outside or Close dismisses it. */
export function PricingSheet({ visible, title, onClose, closeTestID, children }: PricingSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} accessibilityLabel={t('pricingCeiling.close')} />
        <View style={styles.sheetContainer}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{title}</Text>
            {children}
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={onClose} activeOpacity={0.8} accessibilityRole="button" testID={closeTestID}>
              <Text style={styles.sheetCloseText}>{t('pricingCeiling.close')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function HeaderFilterButton({ onPress, testID }: { onPress: () => void; testID: string }) {
  return (
    <TouchableOpacity
      style={styles.headerIconBtn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('pricingCeiling.ceiling.openFilters')}
      testID={testID}
    >
      <HorizontalSlidersIcon color={adminColors.onBrand} />
    </TouchableOpacity>
  );
}
