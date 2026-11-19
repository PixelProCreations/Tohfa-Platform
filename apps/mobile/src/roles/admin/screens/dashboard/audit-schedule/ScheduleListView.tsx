/**
 * "Audit Schedule" / "Field Visit Schedule" list (design: currentView
 * 'calendar', calendarViewMode 'List') with its filter bottom sheet.
 */
import React, { useMemo, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import type { AuditSummaryDto } from '../../../api/audits';
import { adminColors, adminSpacing } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { ds } from './i18n';
import { BackArrowIcon, CloseXIcon, FilterSlidersIcon, SearchIcon } from './icons';
import { FilterPillGroup } from './FilterPills';
import {
  DATE_FILTERS,
  STATUS_FILTERS,
  TYPE_FILTERS,
  auditCode,
  auditorOf,
  badgeKeyOf,
  matchesSearch,
  orDash,
  scheduleListQuery,
  typeKeyOf,
  type BadgeKey,
  type ScheduleFilters,
} from './scheduleFormat';
import { filterStyles } from './filterStyles';
import { scheduleStyles as styles } from './scheduleStyles';
import { sharedStyles } from './sharedStyles';
import { useQueryList } from './useScheduleData';

export const DEFAULT_SCHEDULE_FILTERS: ScheduleFilters = { type: 'all', status: 'all', date: 'today' };

export interface ScheduleListViewProps {
  fieldVisitMode: boolean;
  now: Date;
  filters: ScheduleFilters;
  onFiltersChange: (next: ScheduleFilters) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onBack: () => void;
  onOpenAudit: (audit: AuditSummaryDto) => void;
}

function badgeStyle(key: BadgeKey) {
  switch (key) {
    case 'cancelled':
      return { wrap: styles.badgeCancelled, text: styles.badgeCancelledText };
    case 'scheduled':
      return { wrap: styles.badgeScheduled, text: styles.badgeScheduledText };
    case 'inProgress':
      return { wrap: styles.badgeInProgress, text: styles.badgeInProgressText };
    case 'completed':
    default:
      return { wrap: styles.badgeCompleted, text: styles.badgeCompletedText };
  }
}

function ScheduleCard({ audit, onPress }: { audit: AuditSummaryDto; onPress: () => void }) {
  const key = badgeKeyOf(audit.status);
  const badge = badgeStyle(key);
  const completed = audit.status === 'COMPLETED';
  const type = ds(`admin.audits.dashSchedule.type.${typeKeyOf(audit.auditType)}`);
  const date = orDash(formatAdminDay(audit.scheduledFor));
  return (
    <TouchableOpacity style={styles.scheduleRecordCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.scheduleRecordCardTopRow}>
        <Text style={styles.scheduleRecordCardId}>
          {completed
            ? ds('admin.audits.dashSchedule.list.completedTitle', { code: auditCode(audit.id), farmer: orDash(audit.farmerName) })
            : auditCode(audit.id)}
        </Text>
        <View style={badge.wrap}>
          <Text style={badge.text}>{ds(`admin.audits.dashSchedule.badge.${key}`)}</Text>
        </View>
      </View>
      <Text style={styles.scheduleRecordCardSub}>
        {completed
          ? ds('admin.audits.dashSchedule.list.completedSub', { farm: orDash(audit.farmName), type, date, auditor: auditorOf(audit) })
          : ds('admin.audits.dashSchedule.list.cardSub', { farmer: orDash(audit.farmerName), farm: orDash(audit.farmName), type })}
      </Text>
      <Text style={styles.scheduleRecordCardMeta}>
        {completed
          ? ds('admin.audits.dashSchedule.list.completedNote')
          : ds('admin.audits.dashSchedule.list.cardMeta', { date, auditor: auditorOf(audit) })}
      </Text>
    </TouchableOpacity>
  );
}

function ScheduleFilterSheet({
  visible,
  filters,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: ScheduleFilters;
  onApply: (next: ScheduleFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ScheduleFilters>(filters);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => setDraft(filters)}>
      <View style={filterStyles.filterModalOverlay}>
        <TouchableOpacity style={filterStyles.filterModalDismissArea} onPress={onClose} activeOpacity={1} />
        <View style={filterStyles.filterModalSheet}>
          <View style={filterStyles.filterModalHeaderRow}>
            <View style={filterStyles.filterModalTitleWrap}>
              <FilterSlidersIcon size={20} color={adminColors.brandDeep} />
              <Text style={filterStyles.filterModalTitleText}>{ds('admin.audits.dashSchedule.filter.title')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} accessibilityLabel={ds('admin.audits.dashSchedule.a11y.close')}>
              <CloseXIcon size={20} color={adminColors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView style={filterStyles.filterModalScroll} showsVerticalScrollIndicator={false}>
            <Text style={filterStyles.filterModalSectionLabel}>{ds('admin.audits.dashSchedule.filter.auditType')}</Text>
            <FilterPillGroup
              variant="sheet"
              options={TYPE_FILTERS}
              selected={draft.type}
              label={(o) => ds(`admin.audits.dashSchedule.filter.type.${o}`)}
              onSelect={(type) => setDraft({ ...draft, type })}
            />
            <Text style={filterStyles.filterModalSectionLabel}>{ds('admin.audits.dashSchedule.filter.status')}</Text>
            <FilterPillGroup
              variant="sheet"
              options={STATUS_FILTERS}
              selected={draft.status}
              label={(o) => ds(`admin.audits.dashSchedule.filter.status.${o}`)}
              onSelect={(status) => setDraft({ ...draft, status })}
            />
            <Text style={filterStyles.filterModalSectionLabel}>{ds('admin.audits.dashSchedule.filter.date')}</Text>
            <FilterPillGroup
              variant="sheet"
              options={DATE_FILTERS}
              selected={draft.date}
              label={(o) => ds(`admin.audits.dashSchedule.filter.date.${o}`)}
              onSelect={(date) => setDraft({ ...draft, date })}
            />

            <View style={filterStyles.filterModalActionRow}>
              <TouchableOpacity style={filterStyles.filterModalApplyBtn} onPress={() => onApply(draft)} activeOpacity={0.85}>
                <Text style={filterStyles.filterModalApplyBtnText}>{ds('admin.audits.dashSchedule.filter.applyFilters')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={filterStyles.filterModalResetBtn}
                onPress={() => {
                  setDraft(DEFAULT_SCHEDULE_FILTERS);
                  onApply(DEFAULT_SCHEDULE_FILTERS);
                }}
                activeOpacity={0.8}
              >
                <Text style={filterStyles.filterModalResetBtnText}>{ds('admin.audits.dashSchedule.filter.reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={filterStyles.filterModalCancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={filterStyles.filterModalCancelBtnText}>{ds('admin.audits.dashSchedule.filter.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ScheduleListView(props: ScheduleListViewProps) {
  const { filters, now, search } = props;
  const [sheetOpen, setSheetOpen] = useState(false);
  const query = useMemo(() => scheduleListQuery(filters, now), [filters, now]);
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
            <Text style={styles.headerTitle}>
              {props.fieldVisitMode
                ? ds('admin.audits.dashSchedule.header.fieldVisitSchedule')
                : ds('admin.audits.dashSchedule.header.auditSchedule')}
            </Text>
          </View>
          <TouchableOpacity
            style={sharedStyles.headerFilterCircleBtn}
            onPress={() => setSheetOpen(true)}
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
          placeholder={ds('admin.audits.dashSchedule.search.schedulePlaceholder')}
          placeholderTextColor={adminColors.muted}
          value={search}
          onChangeText={props.onSearchChange}
        />
      </View>

      <ScrollView
        style={styles.scrollCanvas}
        contentContainerStyle={local.listPad}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - adminSpacing.page && list.hasMore) list.loadMore();
        }}
        scrollEventThrottle={200}
      >
        {loading ? <AdminLoadingState /> : null}
        {failed ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}

        {rows.map((audit) => (
          <ScheduleCard key={audit.id} audit={audit} onPress={() => props.onOpenAudit(audit)} />
        ))}

        {!loading && !failed && rows.length === 0 ? (
          <View style={[styles.infoNoteCard, local.emptyCard]}>
            <Text style={[styles.infoNoteText, local.centerText]}>{ds('admin.audits.dashSchedule.list.noMatch')}</Text>
            <TouchableOpacity
              onPress={() => {
                props.onFiltersChange(DEFAULT_SCHEDULE_FILTERS);
                props.onSearchChange('');
              }}
              style={local.resetLink}
            >
              <Text style={styles.resetFiltersLinkText}>{ds('admin.audits.dashSchedule.list.resetFilters')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <ScheduleFilterSheet
        visible={sheetOpen}
        filters={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          props.onFiltersChange(next);
          setSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  listPad: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: 110 },
  emptyCard: { marginTop: adminSpacing.mdLg, alignItems: 'center' },
  centerText: { textAlign: 'center' },
  resetLink: { marginTop: adminSpacing.sm },
});
