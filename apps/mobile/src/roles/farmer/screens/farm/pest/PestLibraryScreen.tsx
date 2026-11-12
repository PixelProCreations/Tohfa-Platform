import React from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../theme';
import {
  ArrowBackIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
} from './pestManagement/icons';
import { CropPickerModal } from './pestLibrary/CropPickerModal';
import { PestAnalyticsModal } from './pestLibrary/PestAnalyticsModal';
import { PestDetailModal } from './pestLibrary/PestDetailModal';
import { PestLibraryList } from './pestLibrary/PestLibraryList';
import { cropLabelKey } from './pestLibrary/constants';
import { pl } from './pestLibrary/i18n';
import { BarChartIcon, CloudOutlineIcon } from './pestLibrary/icons';
import { styles } from './pestLibrary/styles';
import { usePestLibrary } from './pestLibrary/usePestLibrary';

export interface PestLibraryScreenProps {
  /**
   * Threaded down from PestManagementScreen when reached via the hub; resolved
   * locally (first farm, via `getFarms()`) when this screen is opened directly --
   * needed only for the Pest Analytics card/modal, which is farm-scoped.
   */
  farmId?: string | undefined;
  onBack?: () => void;
  onNavigateToSchedule?: (pestName?: string) => void;
}

const BACK_ICON_SIZE = 20;
const SEARCH_ICON_SIZE = 18;
const CHEVRON_DOWN_SIZE = 16;
const CLOUD_ICON_SIZE = 20;
const CHART_ICON_SIZE = 20;
const CHEVRON_RIGHT_SIZE = 18;

export function PestLibraryScreen({
  farmId,
  onBack,
  onNavigateToSchedule,
}: PestLibraryScreenProps): React.JSX.Element {
  const { state, patch, openAnalyticsModal } = usePestLibrary(farmId);
  const cropKey = cropLabelKey(state.selectedCrop);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={pl('farmer.common.back')}
          >
            <ArrowBackIcon size={BACK_ICON_SIZE} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerCodeBadge}>FR-F07</Text>
            <Text style={styles.headerMainTitle}>{pl('farmer.pestManagement.hub.libraryTitle')}</Text>
            <Text style={styles.headerSubtitle}>{pl('farmer.pestLibrary.subtitle')}</Text>
          </View>
        </View>

        {/* ── Search Input ── */}
        <View style={styles.searchBarBox}>
          <SearchIcon size={SEARCH_ICON_SIZE} color={P.twGray400} />
          <TextInput
            style={styles.searchBarInput}
            value={state.searchQuery}
            onChangeText={(searchQuery) => patch({ searchQuery })}
            placeholder={pl('farmer.pestLibrary.searchPlaceholder')}
            placeholderTextColor={P.twGray400}
            clearButtonMode="while-editing"
            maxLength={100}
          />
        </View>

        {/* ── Crop Dropdown Selector ── */}
        <TouchableOpacity
          style={styles.cropDropdownSelector}
          activeOpacity={0.8}
          onPress={() => patch({ isCropPickerOpen: true })}
          accessibilityRole="button"
          accessibilityLabel={pl('farmer.pestLibrary.filterByCropA11y')}
        >
          <Text style={styles.cropDropdownText}>
            {cropKey ? pl(cropKey) : state.selectedCrop}
          </Text>
          <ChevronDownIcon size={CHEVRON_DOWN_SIZE} color={P.twGray500} />
        </TouchableOpacity>

        {/* ── Weather-based Risk Banner ── */}
        {state.weatherNote && (
          <View style={styles.riskBannerCard}>
            <View style={styles.riskBannerIconBox}>
              <CloudOutlineIcon size={CLOUD_ICON_SIZE} color={P.twAmber800} />
            </View>
            <Text style={styles.riskBannerText}>
              <Text style={styles.riskBannerBold}>{pl('farmer.pestLibrary.weatherRiskLabel')}</Text>
              {state.weatherNote.note}
            </Text>
          </View>
        )}

        {/* ── Pest Analytics Card ── */}
        <TouchableOpacity
          style={styles.analyticsCard}
          activeOpacity={0.85}
          onPress={openAnalyticsModal}
          accessibilityRole="button"
          accessibilityLabel={pl('farmer.pestLibrary.analytics.openA11y')}
        >
          <View style={styles.analyticsIconBox}>
            <BarChartIcon size={CHART_ICON_SIZE} color={P.twGray700} />
          </View>
          <View style={styles.analyticsTextCol}>
            <Text style={styles.analyticsTitle}>{pl('farmer.pestLibrary.analytics.title')}</Text>
            <Text style={styles.analyticsSubtitle}>{pl('farmer.pestLibrary.analytics.cardSubtitle')}</Text>
          </View>
          <ChevronRightIcon size={CHEVRON_RIGHT_SIZE} color={P.twGray400} />
        </TouchableOpacity>

        {/* ── Pest / Disease List ── */}
        <PestLibraryList
          entries={state.entries}
          loading={state.entriesLoading}
          error={state.entriesError}
          onSelect={(entry) => patch({ selectedPestDetail: entry })}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CropPickerModal
        visible={state.isCropPickerOpen}
        selectedCrop={state.selectedCrop}
        onSelect={(selectedCrop) => patch({ selectedCrop, isCropPickerOpen: false })}
        onClose={() => patch({ isCropPickerOpen: false })}
      />

      <PestDetailModal
        pest={state.selectedPestDetail}
        onClose={() => patch({ selectedPestDetail: null })}
        onNavigateToSchedule={onNavigateToSchedule}
      />

      <PestAnalyticsModal
        visible={state.isAnalyticsModalOpen}
        summary={state.analyticsSummary}
        loading={state.analyticsLoading}
        error={state.analyticsError}
        onClose={() => patch({ isAnalyticsModalOpen: false })}
      />
    </SafeAreaView>
  );
}
