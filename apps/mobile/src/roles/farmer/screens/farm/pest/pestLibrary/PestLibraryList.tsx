import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../../theme';
import type { PestLibraryEntry } from '../../../../api/pest';
import { CalendarIcon } from '../pestManagement/icons';
import { SKELETON_CARD_HEIGHT, SKELETON_COUNT, SKELETON_FULL_WIDTH } from './constants';
import { pl } from './i18n';
import { styles } from './styles';

const TAG_ICON_SIZE = 12;

interface Props {
  entries: PestLibraryEntry[];
  loading: boolean;
  error: string | null;
  onSelect: (entry: PestLibraryEntry) => void;
}

export function PestLibraryList({ entries, loading, error, onSelect }: Props): React.JSX.Element {
  if (loading) {
    return (
      <View style={styles.skeletonList}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <Skeleton key={i} height={SKELETON_CARD_HEIGHT} width={SKELETON_FULL_WIDTH} />
        ))}
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{pl('farmer.pestLibrary.error.loadLibraryTitle')}</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
      </View>
    );
  }
  return (
    <View style={styles.libraryList}>
      {entries.length > 0 ? (
        entries.map((item) => {
          const isDisease = item.category === 'Disease';
          const isPest = item.category === 'Pest';
          const isHighRisk = item.riskLevel === 'High';
          const isMedRisk = item.riskLevel === 'Medium';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.pestCard}
              activeOpacity={0.85}
              onPress={() => onSelect(item)}
            >
              <View style={styles.pestCardTopRow}>
                <View style={styles.pestCardTitleGroup}>
                  <View
                    style={[
                      styles.statusDot,
                      isHighRisk && styles.statusDotHigh,
                      isMedRisk && styles.statusDotMed,
                      !isHighRisk && !isMedRisk && styles.statusDotLow,
                    ]}
                  />
                  <Text style={styles.pestNameText}>{item.name}</Text>
                </View>

                <View
                  style={[
                    styles.categoryPill,
                    isDisease && styles.categoryPillDisease,
                    isPest && styles.categoryPillPest,
                    !isDisease && !isPest && styles.categoryPillWeed,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isDisease && styles.categoryPillTextDisease,
                      isPest && styles.categoryPillTextPest,
                      !isDisease && !isPest && styles.categoryPillTextWeed,
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              {item.scientificName ? (
                <Text style={styles.scientificNameText}>{item.scientificName}</Text>
              ) : null}

              <View style={styles.tagsRow}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{item.crops.join(', ')}</Text>
                </View>

                {item.season ? (
                  <View style={[styles.tagPill, styles.tagPillWithIcon]}>
                    <CalendarIcon size={TAG_ICON_SIZE} color={P.twGray500} />
                    <Text style={styles.tagPillText}>{item.season}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{pl('farmer.pestLibrary.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>{pl('farmer.pestLibrary.empty.subtitle')}</Text>
        </View>
      )}
    </View>
  );
}
