import React from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DatePicker, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../theme';
import type { Plot } from '../../../api/farms';
import { DATE_FORMAT, DIM, HEADER_TAG, HIT_SLOP, ICON, OPACITY, SKELETON } from './constants';
import { SaveErrorBanner } from './fields';
import { ArrowBackIcon, CheckCircleIcon } from './icons';
import { SHARED_KEYS, sf, t } from './i18n';
import { styles } from './styles';

interface ShellStateView {
  plots: Plot[];
  selectedPlotId: string;
  plotsLoading: boolean;
  plotsError: string | null;
  zonePickerVisible: boolean;
  datePickerVisible: boolean;
  saving: boolean;
  saveError: string | null;
}

interface SoilFormShellProps {
  /** Each screen keeps its own status bar element (they differ). */
  statusBar: React.ReactNode;
  title: string;
  subtitle: string;
  state: ShellStateView;
  onBack?: (() => void) | undefined;
  onSelectPlot: (plotId: string) => void;
  setZonePickerVisible: (visible: boolean) => void;
  setDatePickerVisible: (visible: boolean) => void;
  saveLabel: string;
  saveA11yLabel: string;
  onSavePress: () => void;
  datePickerTitle: string;
  datePickerValue: Date;
  onSelectDate: (date: Date) => void;
  /** Rendered after the date picker (the screen's success modal). */
  successModal: React.ReactNode;
  /** The form fields, rendered inside the scroll view under the error banner. */
  children: React.ReactNode;
}

/**
 * Layout shared by the soil forms: header, loading / load-error / scrolling
 * body, bottom Cancel + Save bar, zone picker modal and date picker.
 */
export function SoilFormShell({
  statusBar,
  title,
  subtitle,
  state,
  onBack,
  onSelectPlot,
  setZonePickerVisible,
  setDatePickerVisible,
  saveLabel,
  saveA11yLabel,
  onSavePress,
  datePickerTitle,
  datePickerValue,
  onSelectDate,
  successModal,
  children,
}: SoilFormShellProps) {
  const { plots, selectedPlotId, plotsLoading, plotsError, saving, saveError } = state;
  const saveDisabled = saving || plotsLoading || !!plotsError;

  return (
    <SafeAreaView style={styles.safeArea}>
      {statusBar}

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={OPACITY.pressed}
            hitSlop={HIT_SLOP.back}
            accessibilityRole="button"
            accessibilityLabel={t(SHARED_KEYS.goBack)}
          >
            <ArrowBackIcon size={ICON.back} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>{HEADER_TAG}</Text>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>

      {plotsLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={SKELETON.fieldHeight} width={DIM.full} style={styles.skeletonFirst} />
          <Skeleton height={SKELETON.cardHeight} width={DIM.full} />
        </View>
      ) : plotsError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{plotsError}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SaveErrorBanner message={saveError} />
          {children}
        </ScrollView>
      )}

      {/* ── Bottom Action Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={OPACITY.pressed}
            accessibilityRole="button"
            accessibilityLabel={t(SHARED_KEYS.cancel)}
          >
            <Text style={styles.cancelBtnText}>{t(SHARED_KEYS.cancel)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saveDisabled ? styles.saveBtnDisabled : styles.saveBtnEnabled]}
            onPress={onSavePress}
            disabled={saveDisabled}
            activeOpacity={OPACITY.strong}
            accessibilityRole="button"
            accessibilityLabel={saveA11yLabel}
          >
            {saving ? (
              <ActivityIndicator size="small" color={P.white} />
            ) : (
              <Text style={styles.saveBtnText}>{saveLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Zone Selection Modal ── */}
      <Modal
        visible={state.zonePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZonePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={OPACITY.enabled}
          onPress={() => setZonePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{sf('common.selectTargetZone')}</Text>
            {plots.map((plot) => {
              const isSelected = selectedPlotId === plot.id;
              return (
                <TouchableOpacity
                  key={plot.id}
                  style={[styles.modalOption, isSelected ? styles.modalOptionSelected : undefined]}
                  onPress={() => onSelectPlot(plot.id)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected ? styles.modalOptionTextSelected : undefined,
                    ]}
                  >
                    {plot.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Date Picker Modal ── */}
      <DatePicker
        visible={state.datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={onSelectDate}
        value={datePickerValue}
        title={datePickerTitle}
        format={DATE_FORMAT}
      />

      {successModal}
    </SafeAreaView>
  );
}

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  plotName: string | undefined;
  dateLabel: string;
  dateValue: string | undefined;
  /** Context rows rendered under the divider. */
  children: React.ReactNode;
}

/** Success card: icon, title, zone + date columns, screen-specific rows, OK. */
export function SoilSuccessModal({
  visible,
  onClose,
  title,
  subtitle,
  plotName,
  dateLabel,
  dateValue,
  children,
}: SuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalCard}>
          <View style={styles.successIconCircle}>
            <CheckCircleIcon size={ICON.success} color={P.twGreen700} />
          </View>

          <Text style={styles.successModalTitle}>{title}</Text>
          <Text style={styles.successModalSubtitle}>{subtitle}</Text>

          <View style={styles.successDataBox}>
            <View style={styles.successDataRow}>
              <View style={styles.successDataCol}>
                <Text style={styles.successColLabel}>{sf('common.successTargetZone')}</Text>
                <Text style={styles.successColVal}>{plotName}</Text>
              </View>
              <View style={styles.successDataCol}>
                <Text style={styles.successColLabel}>{dateLabel}</Text>
                <Text style={styles.successColVal}>{dateValue}</Text>
              </View>
            </View>

            <View style={styles.successDivider} />

            {children}
          </View>

          <TouchableOpacity
            style={styles.successModalOkBtn}
            onPress={onClose}
            activeOpacity={OPACITY.strong}
            accessibilityRole="button"
            accessibilityLabel={t(SHARED_KEYS.ok)}
          >
            <Text style={styles.successModalOkBtnText}>{t(SHARED_KEYS.ok)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
