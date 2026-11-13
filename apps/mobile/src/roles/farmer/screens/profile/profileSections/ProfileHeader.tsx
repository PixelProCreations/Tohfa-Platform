import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import type { deriveFarmRatingView } from '../../../api/farmer';
import { t } from '../../../../../i18n/farmer';
import { colors, authPalette as P } from '../../../theme';
import farmerAvatar from '../../../assets/farmer-kumar.jpg';
import { ChevronLeft } from './ProfileIcons';
import type { PersonalDetailsData } from './profileHelpers';
import { styles } from './profileStyles';

interface ProfileHeaderProps {
  personalDetails: PersonalDetailsData;
  farmerId: string;
  acres: string;
  certStatTone: { fg: string };
  certStatLabel: string;
  ratingLoading: boolean;
  ratingView: ReturnType<typeof deriveFarmRatingView>;
  auditQuickStatValue: string;
  onBack: (() => void) | undefined;
  onShare: () => void;
  onOpenSettings: () => void;
  onEditPhoto: () => void;
  onCertPress: () => void;
  onRatingPress: () => void;
  onAuditPress: () => void;
  onAcresPress: () => void;
}

/** Green banner: nav bar, avatar/identity block and the four overlapping quick-stat cards. */
export function ProfileHeader({
  personalDetails,
  farmerId,
  acres,
  certStatTone,
  certStatLabel,
  ratingLoading,
  ratingView,
  auditQuickStatValue,
  onBack,
  onShare,
  onOpenSettings,
  onEditPhoto,
  onCertPress,
  onRatingPress,
  onAuditPress,
  onAcresPress,
}: ProfileHeaderProps): React.JSX.Element {
  return (
    <View style={styles.headerBanner}>
      {/* Top Bar Navigation */}
      <View style={styles.headerNavRow}>
        <TouchableOpacity
          style={styles.navCircleButton}
          onPress={onBack}
          accessibilityLabel={t('farmer.profile.a11y.back')}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.white} />
        </TouchableOpacity>

        <Text style={styles.navTitle}>{t('farmer.profile.title')}</Text>

        <View style={styles.navRightActions}>
          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onShare}
            accessibilityLabel={t('farmer.profile.a11y.share')}
            activeOpacity={0.7}
          >
            <Icon name="share" size={16} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onOpenSettings}
            accessibilityLabel={t('farmer.profile.menu.settings')}
            activeOpacity={0.7}
          >
            <Icon name="settings" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Farmer Avatar & Basic Info */}
      <View style={styles.profileHero}>
        <View style={styles.avatarContainer}>
          <Image source={farmerAvatar} style={styles.avatarImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.avatarEditBadge}
            onPress={onEditPhoto}
            activeOpacity={0.8}
            accessibilityLabel={t('farmer.profile.a11y.editPhoto')}
          >
            <Icon name="edit" size={14} color={colors.brandGreen} />
          </TouchableOpacity>
        </View>

        <Text style={styles.farmerName}>{personalDetails.fullName}</Text>

        <View style={styles.idBadgePill}>
          <Text style={styles.idBadgeText}>{farmerId}</Text>
        </View>

        <Text style={styles.farmNameText}>{personalDetails.farmName}</Text>
        <View style={styles.iconTextRow}>
          <Icon name="place" size={12} color={P.green100} />
          <Text style={styles.locationText}>{personalDetails.location}</Text>
        </View>
      </View>

      {/* 4 Quick Stat Cards Overlapping Header */}
      <View style={styles.quickStatsRow}>
        <TouchableOpacity style={styles.quickStatCard} onPress={onCertPress} activeOpacity={0.8}>
          <Icon name="shield" size={18} color={certStatTone.fg} style={styles.statEmoji} />
          <Text style={[styles.statValue, { color: certStatTone.fg }]}>{certStatLabel}</Text>
          <Text style={styles.statLabel}>{t('farmer.profile.stats.cert')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickStatCard} onPress={onRatingPress} activeOpacity={0.8}>
          <Icon name="star" size={18} color={P.deepGreen} style={styles.statEmoji} />
          <Text style={[styles.statValue, styles.deepGreenText]}>
            {ratingLoading
              ? '—'
              : ratingView.isRated
                ? String(ratingView.overallRating)
                : t('farmer.profile.rating.notRatedShort')}
          </Text>
          <Text style={styles.statLabel}>{t('farmer.profile.stats.rating')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickStatCard} onPress={onAuditPress} activeOpacity={0.8}>
          <Icon name="calendar_today" size={18} color={P.orange900} style={styles.statEmoji} />
          <Text
            style={[styles.statValue, styles.auditStatValue, styles.orangeText]}
            numberOfLines={2}
          >
            {auditQuickStatValue}
          </Text>
          <Text style={styles.statLabel}>{t('farmer.profile.stats.audit')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickStatCard} onPress={onAcresPress} activeOpacity={0.8}>
          <Icon name="eco" size={18} color={P.deepGreen} style={styles.statEmoji} />
          <Text style={[styles.statValue, styles.deepGreenText]}>{acres}</Text>
          <Text style={styles.statLabel}>{t('farmer.profile.stats.acres')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
