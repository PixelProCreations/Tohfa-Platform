/** The full-page "Filters" view of the schedule list (design: currentView 'filters'). */
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { adminColors } from '../../../theme';
import { ds } from './i18n';
import { BackArrowIcon, FilterSlidersIcon } from './icons';
import { FilterPillGroup } from './FilterPills';
import { DATE_FILTERS, STATUS_FILTERS, TYPE_FILTERS, type ScheduleFilters } from './scheduleFormat';
import { DEFAULT_SCHEDULE_FILTERS } from './ScheduleListView';
import { filterStyles } from './filterStyles';
import { sharedStyles } from './sharedStyles';

export interface FiltersPageViewProps {
  filters: ScheduleFilters;
  onApply: (next: ScheduleFilters) => void;
  onClear: () => void;
  onBack: () => void;
}

export function FiltersPageView({ filters, onApply, onClear, onBack }: FiltersPageViewProps) {
  const [draft, setDraft] = useState<ScheduleFilters>(filters);
  return (
    <SafeAreaView style={sharedStyles.rootOrange}>
      <StatusBar barStyle="light-content" />
      <View style={filterStyles.filterPageHeader}>
        <TouchableOpacity
          style={filterStyles.filterBackBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel={ds('admin.audits.dashSchedule.a11y.back')}
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <View style={filterStyles.filterHeaderTitleWrap}>
          <FilterSlidersIcon size={22} color={adminColors.onBrand} />
          <Text style={filterStyles.filterPageTitle}>{ds('admin.audits.dashSchedule.filter.title')}</Text>
        </View>
      </View>

      <View style={filterStyles.filterBodyContainer}>
        <ScrollView style={sharedStyles.scroll} contentContainerStyle={filterStyles.filterPageContent} showsVerticalScrollIndicator={false}>
          <Text style={filterStyles.filterSectionTitle}>{ds('admin.audits.dashSchedule.filter.auditType')}</Text>
          <FilterPillGroup
            variant="page"
            options={TYPE_FILTERS}
            selected={draft.type}
            label={(o) => ds(`admin.audits.dashSchedule.filter.type.${o}`)}
            onSelect={(type) => setDraft({ ...draft, type })}
          />
          <Text style={filterStyles.filterSectionTitle}>{ds('admin.audits.dashSchedule.filter.status')}</Text>
          <FilterPillGroup
            variant="page"
            options={STATUS_FILTERS}
            selected={draft.status}
            label={(o) => ds(`admin.audits.dashSchedule.filter.status.${o}`)}
            onSelect={(status) => setDraft({ ...draft, status })}
          />
          <Text style={filterStyles.filterSectionTitle}>{ds('admin.audits.dashSchedule.filter.date')}</Text>
          <FilterPillGroup
            variant="page"
            options={DATE_FILTERS}
            selected={draft.date}
            label={(o) => ds(`admin.audits.dashSchedule.filter.date.${o}`)}
            onSelect={(date) => setDraft({ ...draft, date })}
          />
        </ScrollView>

        <View style={filterStyles.filterBottomActionRow}>
          <TouchableOpacity style={filterStyles.applyBtn} onPress={() => onApply(draft)} activeOpacity={0.85}>
            <Text style={filterStyles.applyBtnText}>{ds('admin.audits.dashSchedule.filter.apply')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={filterStyles.clearBtn}
            onPress={() => {
              setDraft(DEFAULT_SCHEDULE_FILTERS);
              onClear();
            }}
            activeOpacity={0.85}
          >
            <Text style={filterStyles.clearBtnText}>{ds('admin.audits.dashSchedule.filter.clear')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
