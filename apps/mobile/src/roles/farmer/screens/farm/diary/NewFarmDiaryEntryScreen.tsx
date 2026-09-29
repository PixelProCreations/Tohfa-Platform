import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { t } from '../../../../../i18n/farmer';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { authPalette as P, typography } from '../../../theme';
import {
  listActiveCrops,
  listDiaryPlots,
  type DiaryActiveCrop,
  type DiaryPlot,
} from '../../../api/farmDiary';
import type { CropItem } from '../crops/ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FieldSquareIcon({ size = 16, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function CropSproutIcon({ size = 16, color = P.twGreen800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-8M12 13c-2-3-6-2.5-7-2 0 4 3 6 7 2zM12 11c2-3 6-2.5 7-2 0 4-3 6-7 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafOutlineIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C6 22 4 17 4 12 4 6.5 8.5 2 12 2c3.5 0 8 4.5 8 10 0 5-2 10-8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V10M12 14c3-1.5 5-1.5 5-1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarBoxIcon({ size = 22, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Props & Component
// ─────────────────────────────────────────────

/** Cosmetic placeholder — the entry's real `activityOn` defaults server-side. */
const DATE_LABEL_FALLBACK = '16 Jul 2026';

export interface NewFarmDiaryEntryStep1Data {
  plotId: string;
  plotName: string;
  /**
   * Only set when the plot had more than one active crop and the farmer picked
   * one. With a single active crop the server resolves it from `plotId`.
   */
  farmCropId?: string;
  cropName: string;
  date: string;
}

export interface NewFarmDiaryEntryScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onCancel?: () => void;
  onNext?: (data: NewFarmDiaryEntryStep1Data) => void;
}

type LoadState = 'loading' | 'error' | 'ready';

export function NewFarmDiaryEntryScreen({
  crop,
  onBack,
  onCancel,
  onNext,
}: NewFarmDiaryEntryScreenProps): React.JSX.Element {
  // Plots
  const [plots, setPlots] = useState<DiaryPlot[]>([]);
  const [plotsState, setPlotsState] = useState<LoadState>('loading');
  const [plotsError, setPlotsError] = useState<string>('');
  const [plotsReloadKey, setPlotsReloadKey] = useState<number>(0);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  // Active crops for the selected plot
  const [crops, setCrops] = useState<DiaryActiveCrop[]>([]);
  const [cropsState, setCropsState] = useState<LoadState>('loading');
  const [cropsError, setCropsError] = useState<string>('');
  const [cropsReloadKey, setCropsReloadKey] = useState<number>(0);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    setPlotsState('loading');
    listDiaryPlots(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setPlots(items);
        setSelectedPlotId((prev) =>
          prev && items.some((p) => p.id === prev) ? prev : (items[0]?.id ?? null),
        );
        setPlotsState('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setPlotsError(formatErrorMessage(err, t('farmer.farmDiary.newEntry.step1.loadFieldsError')));
        setPlotsState('error');
      });
    return () => controller.abort();
  }, [plotsReloadKey]);

  const preferredCropName = crop?.name;
  useEffect(() => {
    if (!selectedPlotId) return undefined;
    const controller = new AbortController();
    setCropsState('loading');
    setCrops([]);
    setSelectedCropId(null);
    listActiveCrops(selectedPlotId, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setCrops(items);
        // One crop: auto-select. Several: pre-select the crop this flow was
        // opened from (if it is among them), otherwise make the farmer choose.
        const only = items.length === 1 ? items[0] : undefined;
        const preferred = items.find(
          (c) => preferredCropName !== undefined && c.cropName === preferredCropName,
        );
        setSelectedCropId(only?.id ?? preferred?.id ?? null);
        setCropsState('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setCropsError(formatErrorMessage(err, t('farmer.farmDiary.newEntry.step1.loadCropsError')));
        setCropsState('error');
      });
    return () => controller.abort();
  }, [selectedPlotId, cropsReloadKey, preferredCropName]);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) ?? null;
  const selectedCrop = crops.find((c) => c.id === selectedCropId) ?? null;
  const hasNoActiveCrop = cropsState === 'ready' && crops.length === 0;
  const canProceed = plotsState === 'ready' && selectedPlot !== null && selectedCrop !== null;

  const dateLabel = t('farmer.farmDiary.newEntry.step1.dateValue', { date: DATE_LABEL_FALLBACK });

  const handleFieldChange = (plotId: string) => {
    setSelectedPlotId(plotId);
    setIsFieldModalOpen(false);
  };

  const handleCropChange = (cropId: string) => {
    setSelectedCropId(cropId);
    setIsCropModalOpen(false);
  };

  const handleProceed = () => {
    if (!onNext || !selectedPlot || !selectedCrop) return;
    onNext({
      plotId: selectedPlot.id,
      plotName: selectedPlot.name,
      // Only an explicit choice among several crops is sent; with one crop the
      // server derives it from the plot.
      ...(crops.length > 1 ? { farmCropId: selectedCrop.id } : {}),
      cropName: selectedCrop.cropName,
      date: dateLabel,
    });
  };

  const handleExit = onCancel ?? onBack;

  const cropDropdownLabel =
    cropsState === 'loading'
      ? t('farmer.farmDiary.newEntry.step1.loadingCrops')
      : cropsState === 'error'
        ? t('farmer.farmDiary.newEntry.step1.loadCropsShortError')
        : hasNoActiveCrop
          ? t('farmer.farmDiary.newEntry.step1.noActiveCrop')
          : (selectedCrop?.cropName ?? t('farmer.farmDiary.newEntry.step1.selectCropPlaceholder'));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.navCircleButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.farmDiary.common.goBackLabel')}
          >
            <ArrowBackIcon size={18} color={P.twGreen700} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{t('farmer.farmDiary.common.newEntryTitle')}</Text>
            <Text style={styles.headerSubtitle}>{t('farmer.farmDiary.newEntry.step1.subtitle')}</Text>
          </View>

          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.cancel')}
          >
            <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3-Segment Progress Bar ── */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
          <View style={[styles.progressSegment, styles.progressInactive]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subtitle Instruction ── */}
        <Text style={styles.introInstruction}>
          {t('farmer.farmDiary.newEntry.step1.introInstruction')}
        </Text>

        {plotsState === 'loading' ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={P.twGreen700} />
            <Text style={styles.statusText}>{t('farmer.farmDiary.newEntry.step1.loadingFields')}</Text>
          </View>
        ) : plotsState === 'error' ? (
          <View style={[styles.statusBox, styles.errorBox]}>
            <Text style={styles.errorText}>{plotsError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setPlotsReloadKey((k) => k + 1)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.farmDiary.newEntry.step1.retryFieldsLabel')}
            >
              <Text style={styles.retryButtonText}>{t('farmer.common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : plots.length === 0 ? (
          <View style={[styles.statusBox, styles.warningBox]}>
            <Text style={styles.warningText}>
              {t('farmer.farmDiary.newEntry.step1.noFieldsWarning')}
            </Text>
          </View>
        ) : (
          <>
            {/* ── 1. Field Dropdown ── */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <FieldSquareIcon size={15} color={P.twGreen800} />
                <Text style={styles.labelTitle}> {t('farmer.farmDiary.newEntry.step1.fieldLabel')} </Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>

              <TouchableOpacity
                style={[styles.dropdownBox, styles.dropdownBoxActive]}
                activeOpacity={0.8}
                onPress={() => setIsFieldModalOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.farmDiary.common.selectFieldModalTitle')}
              >
                <Text style={styles.dropdownSelectedText}>
                  {selectedPlot?.name ?? t('farmer.farmDiary.newEntry.step1.selectFieldPlaceholder')}
                </Text>
                <ChevronDownIcon size={18} color={P.twGreen700} />
              </TouchableOpacity>

              <Text style={styles.helperNote}>{t('farmer.farmDiary.newEntry.step1.fieldHelperNote')}</Text>
            </View>

            {/* ── 2. Crop Dropdown ── */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <CropSproutIcon size={16} color={P.twGreen800} />
                <Text style={styles.labelTitle}> {t('farmer.farmDiary.newEntry.step1.cropLabel')} </Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>

              <TouchableOpacity
                style={styles.dropdownBox}
                activeOpacity={0.8}
                onPress={() => setIsCropModalOpen(true)}
                disabled={cropsState !== 'ready' || crops.length < 2}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.farmDiary.newEntry.step1.selectCropLabel')}
              >
                <Text style={styles.dropdownSelectedText}>{cropDropdownLabel}</Text>
                {cropsState === 'loading' ? (
                  <ActivityIndicator size="small" color={P.twGray500} />
                ) : (
                  <ChevronDownIcon size={18} color={P.twGray500} />
                )}
              </TouchableOpacity>

              {cropsState === 'error' ? (
                <View style={styles.inlineErrorRow}>
                  <Text style={styles.inlineErrorText}>{cropsError}</Text>
                  <TouchableOpacity
                    onPress={() => setCropsReloadKey((k) => k + 1)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.farmDiary.newEntry.step1.retryCropsLabel')}
                  >
                    <Text style={styles.inlineRetryText}>{t('farmer.common.retry')}</Text>
                  </TouchableOpacity>
                </View>
              ) : hasNoActiveCrop ? (
                <View style={[styles.statusBox, styles.warningBox, styles.inlineWarning]}>
                  <Text style={styles.warningText}>
                    {t('farmer.farmDiary.newEntry.step1.noActiveCropWarning')}
                  </Text>
                </View>
              ) : crops.length > 1 ? (
                <Text style={styles.helperNote}>
                  {t('farmer.farmDiary.newEntry.step1.multipleCropsHelper', { count: crops.length })}
                </Text>
              ) : (
                <Text style={styles.helperNote}>
                  {t('farmer.farmDiary.newEntry.step1.singleCropHelper')}
                </Text>
              )}
            </View>

            {/* ── 3. Crop Duration Card ── */}
            <View style={styles.infoCard}>
              <View style={styles.infoIconBox}>
                <LeafOutlineIcon size={22} color={P.twGreen700} />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>{t('farmer.farmDiary.newEntry.step1.cropDurationLabel')}</Text>
                <Text style={styles.infoCardValue}>{selectedCrop?.cropName ?? '—'}</Text>
                <Text style={styles.infoCardSub}>
                  {selectedCrop?.plantedOn
                    ? t('farmer.farmDiary.newEntry.step1.plantedOn', { date: selectedCrop.plantedOn })
                    : t('farmer.farmDiary.newEntry.step1.plantingDateNotRecorded')}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── 4. Date Card ── */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <CalendarBoxIcon size={22} color={P.twGray500} />
          </View>
          <View style={styles.infoCardContent}>
            <Text style={styles.infoCardLabel}>{t('farmer.farmDiary.newEntry.step1.dateCardLabel')}</Text>
            <Text style={styles.infoCardValue}>{dateLabel}</Text>
          </View>
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeText}>{t('farmer.farmDiary.newEntry.step1.autoBadge')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Sticky Action Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.activityTypeBtn, !canProceed && styles.activityTypeBtnDisabled]}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.farmDiary.newEntry.step1.proceedLabel')}
          accessibilityState={{ disabled: !canProceed }}
        >
          <Text style={styles.activityTypeBtnText}>{t('farmer.farmDiary.newEntry.step1.activityTypeButton')}</Text>
          <ArrowRightIcon size={18} color={P.white} />
        </TouchableOpacity>
      </View>

      {/* ── Field Selection Modal ── */}
      <Modal
        visible={isFieldModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFieldModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFieldModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>{t('farmer.farmDiary.newEntry.step1.selectFieldZoneModalTitle')}</Text>
            {plots.map((plot) => (
              <TouchableOpacity
                key={plot.id}
                style={[
                  styles.modalOption,
                  selectedPlotId === plot.id ? styles.modalOptionSelected : undefined,
                ]}
                onPress={() => handleFieldChange(plot.id)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedPlotId === plot.id ? styles.modalOptionTextSelected : undefined,
                  ]}
                >
                  {plot.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Crop Selection Modal ── */}
      <Modal
        visible={isCropModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCropModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCropModalOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>{t('farmer.farmDiary.newEntry.step1.selectCropLabel')}</Text>
            {crops.map((activeCrop) => (
              <TouchableOpacity
                key={activeCrop.id}
                style={[
                  styles.modalOption,
                  selectedCropId === activeCrop.id ? styles.modalOptionSelected : undefined,
                ]}
                onPress={() => handleCropChange(activeCrop.id)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedCropId === activeCrop.id ? styles.modalOptionTextSelected : undefined,
                  ]}
                >
                  {activeCrop.cropName}
                  {activeCrop.plantedOn
                    ? t('farmer.farmDiary.newEntry.step1.plantedSuffix', { date: activeCrop.plantedOn })
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: P.slate900,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: P.slate500,
    fontSize: typography.bodySmall,
    marginTop: 2,
  },
  cancelBtnText: {
    color: P.slate600,
    fontSize: typography.body,
    fontWeight: '600',
  },

  /* 3-Segment Progress */
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: P.twGreen700,
  },
  progressInactive: {
    backgroundColor: P.slate200,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  introInstruction: {
    fontSize: typography.body,
    color: P.slate500,
    lineHeight: 19,
    marginBottom: 20,
  },

  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate800,
  },
  requiredAsterisk: {
    color: P.twRed500,
    fontWeight: '700',
    fontSize: typography.body,
  },

  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: P.white,
  },
  dropdownBoxActive: {
    borderColor: P.twGreen600,
    borderWidth: 1.5,
  },
  dropdownSelectedText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.slate900,
  },
  helperNote: {
    fontSize: typography.caption,
    color: P.slate400,
    marginTop: 6,
  },

  /* Info Cards */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.slate50,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  infoIconBox: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoCardLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoCardValue: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
  },
  infoCardSub: {
    fontSize: typography.bodySmall,
    color: P.slate500,
    marginTop: 2,
  },
  autoBadge: {
    backgroundColor: P.slate200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.slate600,
    letterSpacing: 0.4,
  },

  /* Bottom Sticky Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  activityTypeBtn: {
    height: 48,
    backgroundColor: P.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activityTypeBtnDisabled: {
    opacity: 0.5,
  },
  activityTypeBtnText: {
    color: P.white,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },

  /* Loading / error / empty states */
  statusBox: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: typography.bodySmall,
    color: P.slate500,
  },
  errorBox: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
  },
  errorText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twRed200,
  },
  retryButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twRed700,
  },
  warningBox: {
    backgroundColor: P.twAmber50,
    borderColor: P.twAmber100,
  },
  warningText: {
    fontSize: typography.bodySmall,
    color: P.twAmber800,
    textAlign: 'center',
  },
  inlineWarning: {
    marginTop: 8,
    marginBottom: 0,
    padding: 12,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: typography.caption,
    color: P.twRed700,
  },
  inlineRetryText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twRed700,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 16,
    elevation: 6,
  },
  modalHeading: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.slate900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: typography.body,
    color: P.slate800,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: P.twGreen700,
    fontWeight: '700',
  },
});
