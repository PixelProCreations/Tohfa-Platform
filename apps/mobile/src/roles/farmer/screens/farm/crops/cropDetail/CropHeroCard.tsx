import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../../../../../i18n/farmer';
import { authPalette as P, radius, spacing, typography } from '../../../../theme';
import { ArrowBackIcon, PencilEditIcon } from './icons';
import { heroOverlayColors } from './overlayColors';
import { CropStatGrid } from './CropStatGrid';

export interface CropHeroCardProps {
  heroImageUri: string;
  thumbnailUri: string;
  title: string;
  subtitle: string;
  daysOld: number;
  daysToHarvest: number;
  grade: string;
  onBack?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
}

const HIT_SLOP = { top: spacing.lg, bottom: spacing.lg, left: spacing.lg, right: spacing.lg };
const BACK_ICON_SIZE = 20;
const EDIT_ICON_SIZE = 14;

/** Top hero banner: background image, back/edit controls, crop title and the stat grid. */
export function CropHeroCard({
  heroImageUri,
  thumbnailUri,
  title,
  subtitle,
  daysOld,
  daysToHarvest,
  grade,
  onBack,
  onEdit,
}: CropHeroCardProps): React.JSX.Element {
  return (
    <ImageBackground source={{ uri: heroImageUri }} style={styles.background} imageStyle={styles.backgroundImage}>
      {/* Dark gradient overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Navigation row: Back and Edit */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.cropDetail.a11y.back')}
            >
              <ArrowBackIcon size={BACK_ICON_SIZE} color={P.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}
              activeOpacity={0.7}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.cropDetail.a11y.edit')}
            >
              <PencilEditIcon size={EDIT_ICON_SIZE} color={P.white} />
              <Text style={styles.editText}>{t('farmer.cropDetail.hero.edit')}</Text>
            </TouchableOpacity>
          </View>

          {/* Crop Title & Thumbnail Row */}
          <View style={styles.cropInfoRow}>
            <View style={styles.thumbnailWrapper}>
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
            </View>

            <View style={styles.titleCol}>
              <Text style={styles.cropTitle}>{title}</Text>
              <Text style={styles.cropSubtitle}>{subtitle}</Text>
            </View>
          </View>

          <CropStatGrid daysOld={daysOld} daysToHarvest={daysToHarvest} grade={grade} />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const HERO_MIN_HEIGHT = 330;
const ANDROID_FALLBACK_STATUS_BAR = 32;
const NAV_BUTTON_SIZE = 44;
const NAV_BORDER_WIDTH = 1.5;
const EDIT_PADDING_V = 9;
const THUMB_SIZE = 52;
const THUMB_BORDER_WIDTH = 2;
const TITLE_LEFT_GAP = 14;
const EDIT_GAP = 6;
const TITLE_LETTER_SPACING = -0.3;
const SUBTITLE_TOP_GAP = 4;
const NAV_ROW_TOP = 4;
const OVERLAY_PADDING_BOTTOM = 20;
const INFO_ROW_BOTTOM = 20;

const styles = StyleSheet.create({
  background: {
    width: '100%',
    minHeight: HERO_MIN_HEIGHT,
  },
  backgroundImage: {
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: heroOverlayColors.scrim,
    paddingHorizontal: spacing.lg,
    paddingBottom: OVERLAY_PADDING_BOTTOM,
  },
  safeArea: {
    flex: 1,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? ANDROID_FALLBACK_STATUS_BAR) + spacing.sm : spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: NAV_ROW_TOP,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: NAV_BUTTON_SIZE,
    height: NAV_BUTTON_SIZE,
    borderRadius: NAV_BUTTON_SIZE / 2,
    backgroundColor: heroOverlayColors.controlBg,
    borderWidth: NAV_BORDER_WIDTH,
    borderColor: heroOverlayColors.controlBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: heroOverlayColors.controlBg,
    borderWidth: NAV_BORDER_WIDTH,
    borderColor: heroOverlayColors.controlBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: EDIT_PADDING_V,
    borderRadius: NAV_BUTTON_SIZE / 2,
    gap: EDIT_GAP,
  },
  editText: {
    color: P.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  cropInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: INFO_ROW_BOTTOM,
  },
  thumbnailWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: THUMB_BORDER_WIDTH,
    borderColor: heroOverlayColors.thumbBorder,
    backgroundColor: P.twGray100,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  titleCol: {
    marginLeft: TITLE_LEFT_GAP,
    flex: 1,
  },
  cropTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.white,
    letterSpacing: TITLE_LETTER_SPACING,
  },
  cropSubtitle: {
    fontSize: typography.body,
    fontWeight: '500',
    color: heroOverlayColors.subtitle,
    marginTop: SUBTITLE_TOP_GAP,
  },
});
