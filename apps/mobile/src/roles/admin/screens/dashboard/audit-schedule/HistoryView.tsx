/**
 * "Audit History" (design: the screen's fallback view) with the inline filter
 * card. Rows come from GET /admin/audits, newest first, within the chosen year.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import type { AuditSummaryDto } from '../../../api/audits';
import { adminColors, adminSpacing } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { ds } from './i18n';
import { BackArrowIcon, FilterSlidersIcon, SearchIcon } from './icons';
import { FilterPillGroup } from './FilterPills';
import {
  HISTORY_STATUS_FILTERS,
  TYPE_FILTERS,
  auditCode,
  badgeKeyOf,
  historyListQuery,
  historyYears,
  matchesSearch,
  orDash,
  scoreText,
  typeKeyOf,
  type HistoryFilters,
} from './scheduleFormat';
import { filterStyles } from './filterStyles';
import { scheduleStyles as styles } from './scheduleStyles';
import { sharedStyles } from './sharedStyles';
import { useQueryList } from './useScheduleData';

export function defaultHistoryFilters(now: Date): HistoryFilters {
  return { type: 'all', year: historyYears(now)[0] as number, status: 'all' };
}

export interface HistoryViewProps {
  now: Date;
  filters: HistoryFilters;
  onFiltersChange: (next: HistoryFilters) => void;
  showFilter: boolean;
  onToggleFilter: () => void;
  search: string;
  onSearchChange: (q: string) => void;
  onBack: () => void;
  onOpenAudit: (audit: AuditSummaryDto) => void;
}

function HistoryCard({ audit, onPress }: { audit: AuditSummaryDto; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.historyCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.historyCardTopRow}>
        <Text style={styles.historyCardId}>{auditCode(audit.id)}</Text>
        <View style={styles.historyBadgeCompleted}>
          <Text style={styles.historyBadgeCompletedText}>{ds(`admin.audits.dashSchedule.badge.${badgeKeyOf(audit.status)}`)}</Text>
        </View>
      </View>
      <Text style={styles.historyCardSubtitle}>
        {ds('admin.audits.dashSchedule.history.cardSubtitle', {
          farmer: orDash(audit.farmerName),
          type: ds(`admin.audits.dashSchedule.type.${typeKeyOf(audit.auditType)}`),
        })}
      </Text>
      <Text style={styles.historyCardFootnote}>
        {ds('admin.audits.dashSchedule.history.cardFootnote', {
          date: orDash(formatAdminDay(audit.scheduledFor)),
          major: audit.findingCounts.major,
          minor: audit.findingCounts.minor,
          score: scoreText(audit),
        })}
      </Text>
    </TouchableOpacity>
  );
}

function InlineHistoryFilter({ now, filters, onApply }: { now: Date; filters: HistoryFilters; onApply: (next: HistoryFilters) => void }) {
  const [draft, setDraft] = useState<HistoryFilters>(filters);
  return (
    <View style={filterStyles.inlineFilterCard}>
      <View style={filterStyles.inlineFilterHeaderRow}>
        <FilterSlidersIcon size={20} color={adminColors.brand} />
        <Text style={filterStyles.inlineFilterTitle}>{ds('admin.audits.dashSchedule.filter.title')}</Text>
      </View>

      <Text style={filterStyles.inlineFilterSectionLabel}>{ds('admin.audits.dashSchedule.filter.auditType')}</Text>
      <FilterPillGroup
        variant="inline"
        options={TYPE_FILTERS}
        selected={draft.type}
        label={(o) => ds(`admin.audits.dashSchedule.filter.type.${o}`)}
        onSelect={(type) => setDraft({ ...draft, type })}
      />

      <Text style={filterStyles.inlineFilterSectionLabel}>{ds('admin.audits.dashSchedule.filter.year')}</Text>
      <FilterPillGroup
        variant="inline"
        options={historyYears(now)}
        selected={draft.year}
        label={(o) => String(o)}
        onSelect={(year) => setDraft({ ...draft, year })}
      />

      <Text style={filterStyles.inlineFilterSectionLabel}>{ds('admin.audits.dashSchedule.filter.status')}</Text>
      <FilterPillGroup
        variant="inlineScroll"
        options={HISTORY_STATUS_FILTERS}
        selected={draft.status}
        label={(o) => ds(`admin.audits.dashSchedule.filter.historyStatus.${o}`)}
        onSelect={(status) => setDraft({ ...draft, status })}
      />
      <View style={filterStyles.filterScrollIndicatorTrack}>
        <View style={filterStyles.filterScrollIndicatorBar} />
      </View>

      <View style={filterStyles.inlineFilterActionsRow}>
        <TouchableOpacity style={filterStyles.inlineFilterApplyBtn} onPress={() => onApply(draft)} activeOpacity={0.8}>
          <Text style={filterStyles.inlineFilterApplyBtnText}>{ds('admin.audits.dashSchedule.filter.apply')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={filterStyles.inlineFilterClearBtn}
          onPress={() => {
            const cleared = defaultHistoryFilters(now);
            setDraft(cleared);
            onApply(cleared);
          }}
          activeOpacity={0.8}
        >
          <Text style={filterStyles.inlineFilterClearBtnText}>{ds('admin.audits.dashSchedule.filter.clear')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function HistoryView(props: HistoryViewProps) {
  const { filters, now, search } = props;
  const query = useMemo(() => historyListQuery(filters), [filters]);
  const list = useQueryList(query);
  const rows = useMemo(() => list.items.filter((a) => matchesSearch(a, search)), [list.items, search]);
  const loading = list.isLoading && list.items.length === 0;
  const failed = list.error !== null && list.error !== undefined && list.items.length === 0;

  return (
    <SafeAreaView style={sharedStyles.rootOrange}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={sharedStyles.headerBackBtn}
              onPress={props.onBack}
              activeOpacity={0.7}
              accessibilityLabel={ds('admin.audits.dashSchedule.a11y.back')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{ds('admin.audits.dashSchedule.header.auditHistory')}</Text>
          </View>
          <TouchableOpacity
            style={sharedStyles.headerFilterCircleBtn}
            onPress={props.onToggleFilter}
            activeOpacity={0.8}
            accessibilityLabel={ds('admin.audits.dashSchedule.a11y.filters')}
          >
            <FilterSlidersIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchIconWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={ds('admin.audits.dashSchedule.search.historyPlaceholder')}
          placeholderTextColor={adminColors.muted}
          value={search}
          onChangeText={props.onSearchChange}
        />
      </View>

      <ScrollView
        style={styles.scrollCanvas}
        contentContainerStyle={styles.recordsListPad}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - adminSpacing.page && list.hasMore) list.loadMore();
        }}
        scrollEventThrottle={200}
      >
        {props.showFilter ? <InlineHistoryFilter now={now} filters={filters} onApply={props.onFiltersChange} /> : null}

        {loading ? <AdminLoadingState /> : null}
        {failed ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}

        {!loading && !failed && rows.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{ds('admin.audits.dashSchedule.history.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{ds('admin.audits.dashSchedule.history.emptySub')}</Text>
          </View>
        ) : (
          rows.map((audit) => <HistoryCard key={audit.id} audit={audit} onPress={() => props.onOpenAudit(audit)} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
