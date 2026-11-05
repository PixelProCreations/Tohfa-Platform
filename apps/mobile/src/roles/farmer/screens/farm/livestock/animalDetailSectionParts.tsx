/**
 * Shared pieces of AnimalDetailScreen's per-tab sections: the per-section
 * loading / error(+Retry) block and the "Show more" pagination footer.
 *
 * The sections render inside Dev's AnimalDetailScreen design, so they take the
 * screen's own StyleSheet as a prop (`AnimalDetailStyles` is a type-only import:
 * no runtime import cycle back into the screen).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { colors, radius, spacing } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import type { AnimalDetailStyles } from './AnimalDetailScreen';
import type { PagedRecords } from './useAnimalRecords';
import { PlusCircleGreenIcon } from './animalDetailIcons';

export interface SectionProps {
  styles: AnimalDetailStyles;
}

/**
 * Loading skeleton / ErrorState with Retry for one section; null once ready.
 * `errorMessage` lets a section name a specific failure (a 403, the housing
 * standard not being configured) instead of the error's own text.
 */
export function SectionState({
  list,
  testID,
  styles,
  errorMessage,
}: SectionProps & {
  list: PagedRecords<unknown>;
  testID: string;
  errorMessage?: string | undefined;
}): React.JSX.Element | null {
  switch (list.state) {
    case 'loading':
    case 'idle':
      return (
        <View style={styles.whiteCardContainer} testID={`${testID}.loading`}>
          <Skeleton width="100%" height={spacing.xxxl} borderRadius={radius.lg} />
        </View>
      );
    case 'error':
      return (
        <View testID={`${testID}.error`}>
          <ErrorState
            error={list.error}
            message={errorMessage}
            onRetry={list.retry}
            retryTitle={t('farmer.livestock.detail.common.retry')}
          />
        </View>
      );
    default:
      return null;
  }
}

/** Footer for a paginated section: "Show more" while the API says there is more. */
export function ShowMoreRow({
  list,
  testID,
  styles,
}: SectionProps & { list: PagedRecords<unknown>; testID: string }): React.JSX.Element | null {
  if (!list.hasMore) return null;
  return (
    <TouchableOpacity
      style={local.showMoreBtn}
      onPress={list.loadMore}
      disabled={list.loadingMore}
      accessibilityRole="button"
      testID={testID}
    >
      <Text style={styles.registerOffspringBtnText}>
        {list.loadMoreError
          ? t('farmer.livestock.detail.common.loadMoreFailed')
          : t('farmer.livestock.detail.common.showMore')}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * The "Add ..." entry point of a tab section: Dev's outlined green button
 * (the Register offspring style), opening that section's add-record modal.
 */
export function AddRecordButton({
  label,
  onPress,
  testID,
  styles,
}: SectionProps & { label: string; onPress: () => void; testID: string }): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.registerOffspringBtn}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <PlusCircleGreenIcon size={spacing.lg} color={colors.brandGreen} />
      <Text style={styles.registerOffspringBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const local = StyleSheet.create({
  showMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
