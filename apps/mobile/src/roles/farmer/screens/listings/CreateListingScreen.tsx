import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { getLocale, t } from '../../../../i18n/farmer';
import { authPalette as P, colors, typography } from '../../theme';
import { listCropMaster, type CropMasterResponse } from '../../api/crops';
import { type ListingCropChoice } from '../../api/listings';
import { cropPhotoFor } from './cropImages';

// Custom Icons
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowRight = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke={P.weatherCloudWhite} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoCircle = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={P.blue700} strokeWidth="1.5" />
    <Path d="M12 16V12M12 8H12.01" stroke={P.blue700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckCircle = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill={colors.brandGreen} />
    <Path d="M7 12L10 15L17 8" stroke={P.weatherCloudWhite} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EmptyCircle = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" stroke={P.grey300} strokeWidth="1" fill={P.weatherCloudWhite} />
  </Svg>
);

interface CreateListingScreenProps {
  onCancel?: () => void;
  /** Step 2 needs the crop's id (for `POST /listings` and the ceiling lookup) and its display name. */
  onNext?: (crop: ListingCropChoice) => void;
}

// ─────────────────────────────────────────────
// Data: the active crop taxonomy from GET /farmers/me/crop-master
// (`listCropMaster`). Left out of the approved design because crop_master has
// no such fields (not faked): the per-crop grade badge and the
// "Zone A · 180 kg available" line -- there is no harvest-record endpoint that
// yields a grade, zone or available quantity for a listing.
// ─────────────────────────────────────────────

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; crops: CropMasterResponse[] };

function displayNameOf(crop: CropMasterResponse): string {
  return getLocale() === 'ta' && crop.nameTa ? crop.nameTa : crop.name;
}

export function CreateListingScreen({
  onCancel,
  onNext,
}: CreateListingScreenProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ kind: 'loading' });
    try {
      const crops = await listCropMaster(controller.signal);
      if (controller.signal.aborted) return;
      setState({ kind: 'ready', crops });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ kind: 'error', error });
    }
  }, []);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  const selectedCrop =
    state.kind === 'ready' ? (state.crops.find((c) => c.id === selectedId) ?? null) : null;

  const handleNext = () => {
    if (selectedCrop === null) return;
    onNext?.({ id: selectedCrop.id, slug: selectedCrop.slug, displayName: displayNameOf(selectedCrop) });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onCancel}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.back')}
          >
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>{t('farmer.listings.create.step1.title')}</Text>
            <Text style={styles.headerSub}>{t('farmer.listings.create.step1.subtitle')}</Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.cancel')}
          >
            <Text style={styles.cancelText}>{t('farmer.common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconBox}>
            <InfoCircle />
          </View>
          <Text style={styles.infoText}>
            {t('farmer.listings.create.step1.infoPrefix')}
            <Text style={{ fontWeight: '700' }}>{t('farmer.listings.create.step1.infoBold')}</Text>
            {t('farmer.listings.create.step1.infoSuffix')}
          </Text>
        </View>

        {/* List Header */}
        <Text style={styles.sectionTitle}>{t('farmer.listings.create.step1.sectionTitle')}</Text>

        {/* Crop Selection Cards */}
        {state.kind === 'loading' ? (
          <>
            <Skeleton width="100%" height={80} borderRadius={16} />
            <View style={styles.skeletonGap} />
            <Skeleton width="100%" height={80} borderRadius={16} />
            <View style={styles.skeletonGap} />
            <Skeleton width="100%" height={80} borderRadius={16} />
          </>
        ) : state.kind === 'error' ? (
          <ErrorState
            error={state.error}
            message={t('farmer.listings.create.step1.loadError')}
            retryTitle={t('farmer.common.retry')}
            offlineMessage={t('farmer.common.offline')}
            onRetry={() => void load()}
          />
        ) : state.crops.length === 0 ? (
          <Text style={styles.emptyText}>{t('farmer.listings.create.step1.empty')}</Text>
        ) : (
          state.crops.map((crop) => {
            const isSelected = crop.id === selectedId;
            const photo = cropPhotoFor(crop.slug, crop.name);
            return (
              <TouchableOpacity
                key={crop.id}
                style={[styles.cropCard, isSelected ? styles.cropCardSelected : null]}
                onPress={() => setSelectedId(crop.id)}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.cropIconBox, { backgroundColor: colors.brandGreenLight }]}>
                  {photo !== null ? <Image source={photo} style={styles.realCropImg} /> : null}
                </View>
                <View style={styles.cropTextCol}>
                  <View style={styles.cropTitleRow}>
                    <Text style={styles.cropTitle}>{displayNameOf(crop)}</Text>
                  </View>
                </View>
                <View style={styles.radioBox}>
                  {isSelected ? <CheckCircle /> : <EmptyCircle />}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer / Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, selectedCrop === null ? styles.btnDisabled : null]}
          onPress={handleNext}
          disabled={selectedCrop === null}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.listings.create.step1.next')}
          accessibilityState={{ disabled: selectedCrop === null }}
        >
          <Text style={styles.nextBtnText}>{t('farmer.listings.create.step1.next')}</Text>
          <ArrowRight />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.grey50,
  },
  header: {
    backgroundColor: P.weatherCloudWhite,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.grey300,
    backgroundColor: P.weatherCloudWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.teal900,
  },
  headerSub: {
    fontSize: typography.body,
    color: P.blueGrey400,
    marginTop: 2,
  },
  cancelText: {
    fontSize: typography.bodyLarge,
    color: P.blueGrey500,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
    paddingHorizontal: 20,
    gap: 8,
  },
  progressActive: {
    flex: 1,
    backgroundColor: colors.brandGreen,
    borderRadius: 1.5,
  },
  progressInactive: {
    flex: 1,
    backgroundColor: P.grey300,
    borderRadius: 1.5,
  },
  scrollContent: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: P.blue50, // light blue
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.blue100,
  },
  infoIconBox: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: typography.body,
    color: P.blueGrey700,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: P.grey500,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1.5,
    borderColor: P.grey100,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cropCardSelected: {
    borderColor: colors.brandGreen,
  },
  cropIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  realCropImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cropTextCol: {
    flex: 1,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  cropTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.grey900,
  },
  cropSub: {
    fontSize: typography.body,
    color: P.grey600,
  },
  radioBox: {
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: P.grey50,
    borderTopWidth: 1,
    borderTopColor: P.grey100,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandGreen,
    borderRadius: 16,
    paddingVertical: 16,
  },
  nextBtnText: {
    color: P.weatherCloudWhite,
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    marginRight: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  skeletonGap: {
    height: 12,
  },
  emptyText: {
    fontSize: typography.body,
    color: P.grey600,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
