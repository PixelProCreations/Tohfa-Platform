import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, radius, spacing } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { type BuildResult } from '../animalRecordForms';
import { formatDayMonth } from '../animalRecordView';
import { type PagedRecords } from '../useAnimalRecords';
import { type PickedAttachment } from '../animalAttachment';
import { styles } from './styles';
import { PawPrintIcon, GenderSymbolIcon } from '../../../../assets/icons/AssetIcons';

/**
 * Small pieces shared by AnimalDetailScreen and its tab / modal sections
 * (moved out of the screen unchanged).
 */

/** The add-record modal's attachment: a real picked file, uploaded on save. */
export type AttachmentState = PickedAttachment | null;

/** "12 Jul" with the translated month (farmer.audits.monthShort.*). */
export function formatShortDate(iso: string): string {
  return formatDayMonth(iso);
}

/** Footer row for a paginated section: "Show more" while the API says there is more. */
export function ShowMoreRow({
  list,
  testID,
}: {
  list: PagedRecords<unknown>;
  testID: string;
}): React.JSX.Element | null {
  if (!list.hasMore) return null;
  return (
    <TouchableOpacity
      style={styles.showMoreBtn}
      onPress={list.loadMore}
      disabled={list.loadingMore}
      accessibilityRole="button"
      testID={testID}
    >
      <Text style={styles.sectionHeaderAddText}>
        {list.loadMoreError
          ? t('farmer.livestock.detail.common.loadMoreFailed')
          : t('farmer.livestock.detail.common.showMore')}
      </Text>
    </TouchableOpacity>
  );
}

/** Loading / error+Retry block for one tab section. */
export function SectionState({
  list,
  testID,
}: {
  list: PagedRecords<unknown>;
  testID: string;
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
          <ErrorState onRetry={list.retry} />
        </View>
      );
    default:
      return null;
  }
}

/** "Please fix the following" block above a modal's buttons. */
export function FormErrors({
  errors,
  testID,
}: {
  errors: string[];
  testID: string;
}): React.JSX.Element | null {
  if (errors.length === 0) return null;
  return (
    <View style={styles.formErrorBox} testID={testID} accessibilityLiveRegion="polite">
      <Text style={styles.formErrorTitle}>{t('farmer.livestock.detail.common.errorsTitle')}</Text>
      {errors.map((message) => (
        <Text key={message} style={styles.formErrorText}>
          {message}
        </Text>
      ))}
    </View>
  );
}

/** The display values of the animal shown on every add-record modal's summary card. */
export interface AnimalSummary {
  displayName: string;
  displaySpecies: string;
  displayBreed: string;
  displayAge: string;
  displayStatusBadge: string;
}

/** Animal summary card at the top of an add-record modal. */
export function ModalAnimalCard({ summary }: { summary: AnimalSummary }): React.JSX.Element {
  const { displayName, displaySpecies, displayBreed, displayAge, displayStatusBadge } = summary;
  return (
    <View style={styles.modalAnimalCard}>
      <View style={styles.modalAvatarCircle}>
        <PawPrintIcon size={22} color={P.twAmber800} />
        <View style={styles.modalAvatarDot} />
      </View>
      <View style={styles.modalAnimalInfoCol}>
        <Text style={styles.modalAnimalName}>{displayName}</Text>
        <View style={styles.modalAnimalSubtitleRow}>
          <Text style={styles.modalAnimalSubtitle}>
            {displaySpecies} · {displayBreed} ·{' '}
          </Text>
          <GenderSymbolIcon size={12} color={P.twGray500} />
          <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
        </View>
      </View>
      <View style={styles.modalStatusBadgePill}>
        <Text style={styles.modalStatusBadgeText}>{displayStatusBadge}</Text>
      </View>
    </View>
  );
}

/** The screen's shared save pipeline (validate, upload the attachment, POST); true when saved. */
export type SubmitRecord = <B>(
  built: BuildResult<B>,
  setErrors: (errors: string[]) => void,
  file: AttachmentState,
  post: (body: B) => Promise<unknown>,
) => Promise<boolean>;

/** What every add-record modal needs from the screen. */
export interface RecordModalContext {
  animalId: string | undefined;
  saving: boolean;
  displayName: string;
  summary: AnimalSummary;
  submitRecord: SubmitRecord;
  handlePickAttachment: (
    setFile: (file: AttachmentState) => void,
    setErrors: (errors: string[]) => void,
  ) => Promise<void>;
  attachmentSizeLabel: (file: PickedAttachment) => string;
}
