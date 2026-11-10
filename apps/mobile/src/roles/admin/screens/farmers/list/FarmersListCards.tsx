/**
 * The two card layouts of the design: a farmer (avatar, name, "code · zone",
 * then Farming | Rating | Status) and an application (name + status badge,
 * "code · location · crops", "Submitted <day> · KYC <status>"). Text comes
 * from ./farmersListLogic.ts; a field the API does not send shows the
 * placeholder, never a sample value.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ApplicationRowView, FarmerRowView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import {
  applicationDetailText,
  applicationStatusLabelKey,
  applicationStatusTone,
  applicationSubText,
  farmerCodeZoneText,
  farmerFarmingText,
  farmerRatingText,
  farmerStatusLabelKey,
  farmerStatusTone,
} from './farmersListLogic';
import { FarmerAvatarIcon } from './FarmersListIcons';
import { styles, TONE_BG, TONE_TEXT } from './farmersListStyles';

export interface FarmerCardProps {
  farmer: FarmerRowView;
  onPress?: ((farmer: FarmerRowView) => void) | undefined;
}

export function FarmerCard({ farmer, onPress }: FarmerCardProps) {
  const statusLabel = t(farmerStatusLabelKey(farmer.status));
  return (
    <TouchableOpacity
      style={styles.farmerCard}
      activeOpacity={0.8}
      onPress={() => onPress?.(farmer)}
      accessibilityRole="button"
      accessibilityLabel={`${farmer.name}, ${statusLabel}`}
      testID={`farmersList.farmerCard.${farmer.id}`}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.cardAvatarCircle}>
          <FarmerAvatarIcon size={20} color={adminColors.brand} />
        </View>
        <View style={styles.cardIdentityCol}>
          <Text style={styles.cardFarmerName}>{farmer.name}</Text>
          <Text style={styles.cardFarmerCodeZone}>{farmerCodeZoneText(farmer)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardStatsRow}>
        <View style={styles.cardStatCol}>
          <Text style={styles.cardStatLabel}>{t('farmersList.card.farming')}</Text>
          <Text style={styles.cardStatValue}>{farmerFarmingText(farmer)}</Text>
        </View>
        <View style={styles.cardStatCol}>
          <Text style={styles.cardStatLabel}>{t('farmersList.card.rating')}</Text>
          <Text style={styles.cardStatValue}>{farmerRatingText(farmer)}</Text>
        </View>
        <View style={styles.cardStatCol}>
          <Text style={styles.cardStatLabel}>{t('farmersList.card.status')}</Text>
          <Text style={[styles.cardStatValue, { color: TONE_TEXT[farmerStatusTone(farmer.status)] }]}>{statusLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export interface ApplicationCardProps {
  application: ApplicationRowView;
  onPress?: ((application: ApplicationRowView) => void) | undefined;
}

export function ApplicationCard({ application, onPress }: ApplicationCardProps) {
  const tone = applicationStatusTone(application.status);
  const statusLabel = t(applicationStatusLabelKey(application.status));
  return (
    <TouchableOpacity
      style={styles.applicationCard}
      onPress={() => onPress?.(application)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${application.name}, ${statusLabel}`}
      testID={`farmersList.applicationCard.${application.id}`}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardName}>{application.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: TONE_BG[tone] }]}>
          <Text style={[styles.statusBadgeText, { color: TONE_TEXT[tone] }]}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.cardSubText}>{applicationSubText(application)}</Text>
      <Text style={styles.cardDetailText}>{applicationDetailText(application)}</Text>
    </TouchableOpacity>
  );
}
