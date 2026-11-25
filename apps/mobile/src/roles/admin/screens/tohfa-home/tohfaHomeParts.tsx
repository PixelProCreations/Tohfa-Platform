/**
 * Building blocks of the Tohfa Admin Home tab: the brand header, the greeting
 * card (with its refresh button), the search bar with its filter button and
 * date-range chip, the date-range modal, a summary card of label/value rows,
 * and an empty-state card. Layout
 * and styles follow the design (origin/tofhafarmfin-rbac
 * TohfaAdminDashboardScreen, Home tab); see ./tohfaHomeStyles.ts.
 */
import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import {
  BellHeaderIcon,
  CalendarIcon,
  ChevronDownIcon,
  FilterSlidersIcon,
  HomeHeaderIcon,
  ProfileHeaderIcon,
  RefreshIcon,
  SearchIcon,
} from './tohfaHomeIcons';
import { TOHFA_DATE_RANGES, tohfaDateRangeLabel, type TohfaDateRange } from './tohfaHomeLogic';
import { tohfaHomeStyles as styles } from './tohfaHomeStyles';

export function TohfaHomeHeader({
  dateText,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
}: {
  dateText: string;
  /** Unread notifications. The design's red dot shows only for a real count above zero. */
  unreadCount: number | undefined;
  onOpenNotifications: (() => void) | undefined;
  onOpenProfile: (() => void) | undefined;
}) {
  return (
    <View style={styles.headerBanner}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="tohfaHomeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={adminColors.brand} />
            <Stop offset="1" stopColor={adminColors.brand} stopOpacity={0.92} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#tohfaHomeGrad)" />
      </Svg>

      <View style={styles.headerTopRow}>
        <View style={styles.headerLeftCol}>
          <View style={styles.headerBrandTitleRow}>
            <HomeHeaderIcon size={20} />
            <Text style={styles.headerBrandText}>{t('tohfaHome.header.brand')}</Text>
          </View>
          <Text style={styles.headerDateText}>{dateText}</Text>
        </View>

        <View style={styles.headerIconsRow}>
          {onOpenNotifications ? (
            <TouchableOpacity
              testID="home.header.notifications"
              style={styles.headerIconButton}
              onPress={onOpenNotifications}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('tohfaHome.header.notifications')}
            >
              <BellHeaderIcon size={20} />
              {unreadCount !== undefined && unreadCount > 0 ? <View testID="home.header.unreadDot" style={styles.notificationDot} /> : null}
            </TouchableOpacity>
          ) : null}
          {onOpenProfile ? (
            <TouchableOpacity
              testID="home.header.profile"
              style={styles.headerIconButton}
              onPress={onOpenProfile}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('tohfaHome.header.profile')}
            >
              <ProfileHeaderIcon size={20} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function TohfaGreetingCard({
  greeting,
  dateStamp,
  onRefresh,
}: {
  greeting: string;
  dateStamp: string;
  onRefresh: (() => void) | undefined;
}) {
  return (
    <View style={styles.greetingCard}>
      <View style={styles.greetingTopRow}>
        <Text style={styles.greetingTitle} numberOfLines={1}>
          {greeting}
        </Text>
        <View style={styles.roleBadgePill}>
          <Text style={styles.roleBadgeText}>{t('tohfaHome.greeting.badge')}</Text>
        </View>
      </View>
      <Text style={styles.greetingSubTitle}>{t('tohfaHome.greeting.subtitle')}</Text>
      <Text style={styles.greetingDateStamp}>{dateStamp}</Text>
      <View style={styles.greetingBottomRow}>
        <Text style={styles.lastUpdatedText}>{t('tohfaHome.greeting.lastUpdated', { value: t('tohfaHome.dash') })}</Text>
        {onRefresh ? (
          <TouchableOpacity
            testID="home.refresh"
            style={styles.refreshButton}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('tohfaHome.greeting.refresh')}
          >
            <RefreshIcon />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export interface SummaryRowDef {
  label: string;
  value: string;
  big?: boolean;
}

/**
 * The design's summary card: rows split by hairlines. Pressable (and given
 * `testID`) only when the host can open the overview behind it; otherwise a
 * plain card with the same look.
 */
export function TohfaSummaryCard({
  rows,
  onPress,
  testID,
  accessibilityLabel,
  spaced,
}: {
  rows: readonly SummaryRowDef[];
  onPress: (() => void) | undefined;
  testID: string;
  accessibilityLabel: string;
  spaced?: boolean;
}) {
  const body = rows.map((row, i) => (
    <React.Fragment key={row.label}>
      {i > 0 ? <View style={styles.summaryDivider} /> : null}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryRowLabel}>{row.label}</Text>
        <Text testID="home.summary.value" style={row.big ? styles.summaryOrderValueBig : styles.summaryRowValue}>
          {row.value}
        </Text>
      </View>
    </React.Fragment>
  ));
  const style = [styles.summaryListCard, spaced && styles.summaryListCardSpaced];
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <TouchableOpacity
      testID={testID}
      style={style}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {body}
    </TouchableOpacity>
  );
}

export function TohfaSectionHeader({
  title,
  onOpen,
  openTestID,
  openA11y,
}: {
  title: string;
  onOpen?: (() => void) | undefined;
  openTestID?: string;
  openA11y?: string;
}) {
  if (!onOpen) return <Text style={styles.sectionHeading}>{title}</Text>;
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <TouchableOpacity testID={openTestID} onPress={onOpen} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={openA11y}>
        <Text style={styles.sectionOpenLink}>{t('tohfaHome.section.open')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function TohfaEmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

/**
 * The design's search bar and date-range chip. Typing only updates the local
 * query: there is no Home search endpoint, so no results are drawn. The
 * filter button shows when `onOpenFilter` is set (always, unless gated).
 */
export function TohfaSearchBar({
  query,
  onChangeQuery,
  onOpenFilter,
  rangeLabel,
  onOpenRange,
}: {
  query: string;
  onChangeQuery: (next: string) => void;
  onOpenFilter: (() => void) | undefined;
  rangeLabel: string;
  onOpenRange: () => void;
}) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <SearchIcon />
        <TextInput
          testID="home.search.input"
          style={styles.searchInput}
          placeholder={t('tohfaHome.search.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          value={query}
          onChangeText={onChangeQuery}
          accessibilityLabel={t('tohfaHome.search.placeholder')}
        />
        {onOpenFilter ? (
          <TouchableOpacity
            testID="home.search.filter"
            onPress={onOpenFilter}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('tohfaHome.search.filter')}
          >
            <FilterSlidersIcon />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.dateFilterContainer}>
        <TouchableOpacity
          testID="home.dateRange"
          style={styles.dateFilterButton}
          onPress={onOpenRange}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('tohfaHome.dateRange.a11y', { range: rangeLabel })}
        >
          <CalendarIcon />
          <Text style={styles.dateFilterText}>{rangeLabel}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** The design's "Select Time Period" modal. Picking a range only changes the chip (state). */
export function TohfaDateRangeModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: TohfaDateRange;
  onSelect: (range: TohfaDateRange) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity testID="home.dateRange.backdrop" style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.datePickerModalContent}>
          <Text style={styles.modalSheetTitle}>{t('tohfaHome.dateRange.title')}</Text>
          {TOHFA_DATE_RANGES.map((range) => {
            const isSelected = range === selected;
            return (
              <TouchableOpacity
                key={range}
                testID={`home.dateRange.option.${range}`}
                style={[styles.datePickerOption, isSelected && styles.datePickerOptionSelected]}
                onPress={() => onSelect(range)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.datePickerOptionText, isSelected && styles.datePickerOptionTextSelected]}>
                  {tohfaDateRangeLabel(range)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
