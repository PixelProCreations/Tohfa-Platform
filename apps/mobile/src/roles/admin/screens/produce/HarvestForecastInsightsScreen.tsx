import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  DownloadIcon,
} from './produceIcons';

export interface ExportCropRecordsModalProps {
  visible: boolean;
  onClose: () => void;
  onDownloadCSV: () => void;
}

export function ExportCropRecordsModal({
  visible,
  onClose,
  onDownloadCSV,
}: ExportCropRecordsModalProps): React.JSX.Element {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <View style={styles.exportModalContent}>
          <Text style={styles.exportModalTitle}>Export crop records</Text>

          <View style={styles.exportInfoBox}>
            <View style={styles.trendTableRow}>
              <Text style={styles.exportInfoLabel}>Rows</Text>
              <Text style={styles.exportInfoValue}>43 crop records</Text>
            </View>
            <View style={styles.dottedDivider} />
            <View style={[styles.trendTableRow, { alignItems: 'flex-start', paddingTop: 8 }]}>
              <Text style={[styles.exportInfoLabel, { width: 70 }]}>Columns</Text>
              <Text style={[styles.exportInfoValue, { flex: 1, textAlign: 'right', lineHeight: 20 }]}>
                record, farmer ID, zone, plot, crop, variety, season, planting date, stage, expected harvest, status, recorded quantity
              </Text>
            </View>
          </View>

          <Text style={styles.exportFootnote}>
            Expected harvest dates are exported as forecasts. Farmer phone numbers are not included.
          </Text>

          <View style={styles.exportActionsRow}>
            <TouchableOpacity
              style={styles.exportBtnOutline}
              onPress={onDownloadCSV}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={styles.exportBtnOutlineText}>Download CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtnOutline}
              onPress={onClose}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={styles.exportBtnOutlineText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export interface HarvestForecastInsightsScreenProps {
  onBack: () => void;
  onOpenExportModal?: () => void;
  onOpenFilters?: () => void;
}

export function HarvestForecastInsightsScreen({
  onBack,
  onOpenExportModal,
  onOpenFilters: _onOpenFilters,
}: HarvestForecastInsightsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'forecast' | 'insights'>('forecast');
  const [timeFilter, setTimeFilter] = useState('All');
  const [localExportVisible, setLocalExportVisible] = useState(false);

  const handleOpenExport = onOpenExportModal ?? (() => setLocalExportVisible(true));
  const handleCloseExport = () => setLocalExportVisible(false);

  return (
    <View style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtnTouch} accessibilityRole="button">
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Harvest Forecast & Insights</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Top Pill Tabs */}
        <View style={styles.forecastTabsContainer}>
          <TouchableOpacity
            style={[
              styles.forecastTabButton,
              activeTab === 'forecast' && styles.forecastTabButtonActive,
            ]}
            onPress={() => setActiveTab('forecast')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.forecastTabText,
                activeTab === 'forecast' && styles.forecastTabTextActive,
              ]}
            >
              Forecast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.forecastTabButton,
              activeTab === 'insights' && styles.forecastTabButtonActive,
            ]}
            onPress={() => setActiveTab('insights')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.forecastTabText,
                activeTab === 'insights' && styles.forecastTabTextActive,
              ]}
            >
              Insights
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Filter Pills */}
        <View style={styles.timeFilterRow}>
          {['Next 30 days', 'Next 60 days', 'Next 90 days', 'All'].map((item) => {
            const isSelected = timeFilter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.timeFilterBtn, isSelected && styles.timeFilterBtnActive]}
                onPress={() => setTimeFilter(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={[styles.timeFilterText, isSelected && styles.timeFilterTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Forecast Card */}
        <View style={styles.forecastCard}>
          <Text style={styles.forecastCardTitle}>Harvest Projection</Text>
          <View style={styles.trendTableRow}>
            <Text style={styles.trendRowLabel}>Expected volume</Text>
            <Text style={styles.trendRowValue}>—</Text>
          </View>
          <View style={styles.dottedDivider} />
          <View style={styles.trendTableRow}>
            <Text style={styles.trendRowLabel}>Active crop types</Text>
            <Text style={styles.trendRowValue}>—</Text>
          </View>
          <View style={styles.dottedDivider} />
          <View style={styles.trendTableRow}>
            <Text style={styles.trendRowLabel}>Forecast accuracy confidence</Text>
            <Text style={styles.trendRowValue}>High</Text>
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={styles.exportActionBtn}
          onPress={handleOpenExport}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <DownloadIcon size={18} color={adminColors.brand} />
          <Text style={styles.exportActionBtnText}>Export crop records</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExportCropRecordsModal
        visible={localExportVisible}
        onClose={handleCloseExport}
        onDownloadCSV={handleCloseExport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtnTouch: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  forecastTabsContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    padding: adminSpacing.xs / 2,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  forecastTabButton: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    borderRadius: adminRadius.full,
  },
  forecastTabButtonActive: {
    backgroundColor: adminColors.brand,
  },
  forecastTabText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
  },
  forecastTabTextActive: {
    color: adminColors.onBrand,
  },
  timeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  timeFilterBtn: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  timeFilterBtnActive: {
    backgroundColor: adminColors.brandDeep,
    borderColor: adminColors.brandDeep,
  },
  timeFilterText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  timeFilterTextActive: {
    color: adminColors.onBrand,
  },
  forecastCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    ...adminShadow.sm,
  },
  forecastCardTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  trendTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  trendRowLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  trendRowValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  dottedDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs / 2,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
  },
  exportActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  exportModalContent: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
  },
  exportModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  exportInfoBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  exportInfoLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  exportInfoValue: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  exportFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: adminSpacing.lg,
  },
  exportActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  exportBtnOutline: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
  },
  exportBtnOutlineText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
