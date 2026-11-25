/**
 * Audit Schedule & Assignment (M5-S05 / M5-S05a), ported from
 * origin/Superadmin-main and wired to GET /admin/audits (audit.view).
 *
 * Rows: SCHEDULED, IN_PROGRESS and COMPLETED audits from the server, cursor
 * paged (the next page loads as the list scrolls to its end). The filter modal
 * sends farmer, zone, type and the date range as server filters; the search box
 * and the score range apply to the loaded rows, because the endpoint has no
 * text or score query. Farmer and zone options come from the rows seen so far.
 *
 * Every row callback receives an AuditScheduleRow whose `id` is the API id of
 * the audit. Edit and Reschedule are offered for SCHEDULED audits only (PATCH
 * accepts nothing else); Cancel for SCHEDULED or IN_PROGRESS, after a reason
 * (3-500 characters, docs/openapi.yaml), through POST /admin/audits/{id}/cancel.
 * Edit, Reschedule and Cancel need audit.schedule; View needs audit.view.
 * Without a permission or a host callback the control is drawn but disabled.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { AuditType } from '../../api/audits';
import { adminErrorKey } from '../../api/errors';
import { t } from '../../i18n';
import { makeCan, type Can } from '../../permissions/can';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';
import {
  EMPTY_SCHEDULE_FILTERS,
  STATUS_LABEL_KEY,
  isAnyFilterActive,
  isValidCancelReason,
  matchesSearch,
  mergeOptions,
  parseScoreBound,
  statusTone,
  toListFilters,
  toScheduleRow,
  ts,
  withinScore,
  type AuditScheduleRow,
  type FilterOption,
  type ScheduleFilterValues,
} from './auditScheduleFormat';
import { useAuditList, useCancelAudit } from './useAuditsData';

export type { AuditScheduleRow } from './auditScheduleFormat';

/** docs/rbac.json codes this screen checks. */
export const AUDIT_SCHEDULE_CODES = { view: 'audit.view', schedule: 'audit.schedule' } as const;

const FAIL_CLOSED: Can = makeCan([]);
/** How close to the end of the list (in points) the next page starts loading. */
const LOAD_MORE_THRESHOLD = 240;

// ─── Header & Utility Icons ───────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3.5" y1="16" x2="20.5" y2="16" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="8" y1="12.5" x2="8" y2="19.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 17, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function ChevronIcon({ isOpen, size = 16, color = adminColors.muted }: { isOpen?: boolean; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isOpen ? (
        <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  );
}

// ─── Dropdown (the design's three identical filter dropdowns) ────────────────

interface DropdownOption {
  /** null = All. */
  id: string | null;
  label: string;
  /** Drawn but not choosable (the design's "Field Visit" has no AuditType). */
  disabled?: boolean;
}

function FilterDropdown({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string | null;
  options: DropdownOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string | null) => void;
}) {
  const selected = options.find((o) => o.id === value) ?? options[0];
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdownField} onPress={onToggle} activeOpacity={0.7} accessibilityRole="button">
        <Text style={styles.dropdownValue}>{selected?.label ?? ''}</Text>
        <ChevronIcon isOpen={isOpen} />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdownMenu}>
          <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled showsVerticalScrollIndicator>
            {options.map((opt, idx) => {
              const isSelected = opt.id === value;
              return (
                <TouchableOpacity
                  key={opt.id ?? 'all'}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemActive,
                    idx === options.length - 1 && styles.dropdownItemLast,
                    opt.disabled === true && styles.disabled,
                  ]}
                  disabled={opt.disabled === true}
                  onPress={() => onSelect(opt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export interface AuditScheduleAssignmentScreenProps {
  onBack: () => void;
  onViewSchedule?: ((schedule: AuditScheduleRow) => void) | undefined;
  onEditSchedule?: ((schedule: AuditScheduleRow) => void) | undefined;
  onReschedule?: ((schedule: AuditScheduleRow) => void) | undefined;
  /** Called after the audit was cancelled on the server. */
  onCancelSchedule?: ((schedule: AuditScheduleRow) => void) | undefined;
  /** Permission check (docs/rbac.json codes); absent means nothing is permitted. */
  can?: Can | undefined;
}

type DropdownKey = 'farmer' | 'zone' | 'auditType';

export function AuditScheduleAssignmentScreen({
  onBack,
  onViewSchedule,
  onEditSchedule,
  onReschedule,
  onCancelSchedule,
  can = FAIL_CLOSED,
}: AuditScheduleAssignmentScreenProps) {
  const canView = can(AUDIT_SCHEDULE_CODES.view);
  const canSchedule = can(AUDIT_SCHEDULE_CODES.schedule);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [applied, setApplied] = useState<ScheduleFilterValues>(EMPTY_SCHEDULE_FILTERS);
  const [temp, setTemp] = useState<ScheduleFilterValues>(EMPTY_SCHEDULE_FILTERS);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [options, setOptions] = useState<{ farmers: FilterOption[]; zones: FilterOption[] }>({ farmers: [], zones: [] });

  const [cancelTarget, setCancelTarget] = useState<AuditScheduleRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const cancelAudit = useCancelAudit();

  const listFilters = useMemo(() => toListFilters(applied), [applied]);
  const list = useAuditList(listFilters, { enabled: canView });

  useEffect(() => {
    setOptions((prev) => mergeOptions(prev, list.items));
  }, [list.items]);

  const minScore = parseScoreBound(applied.minScore);
  const maxScore = parseScoreBound(applied.maxScore);
  const rows = useMemo(() => {
    const now = new Date();
    return list.items
      .filter((a) => matchesSearch(a, searchQuery) && withinScore(a, minScore, maxScore))
      .map((a) => toScheduleRow(a, now));
  }, [list.items, searchQuery, minScore, maxScore]);

  const viewState = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: rows.length });
  const anyFilterActive = isAnyFilterActive(applied);
  const allLabel = ts('admin.audits.schedule.filters.all');

  const farmerOptions: DropdownOption[] = [{ id: null, label: allLabel }, ...options.farmers];
  const zoneOptions: DropdownOption[] = [{ id: null, label: allLabel }, ...options.zones];
  const typeOptions: DropdownOption[] = [
    { id: null, label: allLabel },
    { id: 'INTERNAL', label: ts('admin.audits.schedule.type.INTERNAL') },
    { id: 'EXTERNAL', label: ts('admin.audits.schedule.type.EXTERNAL') },
    { id: 'FIELD_VISIT', label: ts('admin.audits.schedule.type.FIELD_VISIT'), disabled: true },
  ];

  const openFilterModal = () => {
    setTemp(applied);
    setOpenDropdown(null);
    setIsFilterModalVisible(true);
  };
  const applyFilters = () => {
    setApplied(temp);
    setIsFilterModalVisible(false);
  };
  const resetFilters = () => {
    setTemp(EMPTY_SCHEDULE_FILTERS);
    setOpenDropdown(null);
  };
  const clearAppliedFilters = () => setApplied(EMPTY_SCHEDULE_FILTERS);
  const toggleDropdown = (key: DropdownKey) => setOpenDropdown(openDropdown === key ? null : key);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (list.hasMore && !list.isLoading && layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD) {
      list.loadMore();
    }
  };

  const openCancel = (row: AuditScheduleRow) => {
    setCancelTarget(row);
    setCancelReason('');
    setCancelError(null);
  };
  const confirmCancel = () => {
    if (cancelTarget === null) return;
    if (!isValidCancelReason(cancelReason)) {
      setCancelError(ts('admin.audits.schedule.cancel.reasonInvalid'));
      return;
    }
    const row = cancelTarget;
    cancelAudit.mutate(
      { auditId: row.id, body: { reason: cancelReason.trim() } },
      {
        onSuccess: () => {
          setCancelTarget(null);
          onCancelSchedule?.(row);
        },
        onError: (err) => setCancelError(t(adminErrorKey(err))),
      },
    );
  };

  const countKey = rows.length === 1 ? 'admin.audits.schedule.count.one' : 'admin.audits.schedule.count.other';

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={ts('admin.audits.schedule.back')}
        >
          <BackArrowIcon />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {ts('admin.audits.schedule.title')}
        </Text>

        <TouchableOpacity
          style={[styles.headerFilterBtn, anyFilterActive && styles.headerFilterBtnActive]}
          onPress={openFilterModal}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={ts('admin.audits.schedule.openFilters')}
        >
          <FilterSlidersIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={200}
      >
        {/* ── Search ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={ts('admin.audits.schedule.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* ── Active schedules count ── */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>{ts(countKey, { count: rows.length })}</Text>
          {anyFilterActive ? (
            <TouchableOpacity onPress={clearAppliedFilters} activeOpacity={0.7}>
              <Text style={styles.clearFilterText}>{ts('admin.audits.schedule.resetFilter')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Schedules list ── */}
        <View style={styles.listContainer}>
          {viewState === 'loading' ? <AdminLoadingState /> : null}
          {viewState === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
          {viewState === 'empty' ? <AdminEmptyState title={ts('admin.audits.schedule.empty')} /> : null}
          {rows.map((schedule) => {
            const tone = adminColors[statusTone(schedule.status)];
            const viewEnabled = canView && onViewSchedule !== undefined;
            const editEnabled = canSchedule && schedule.isEditable && onEditSchedule !== undefined;
            const rescheduleEnabled = canSchedule && schedule.isEditable && onReschedule !== undefined;
            const cancelEnabled = canSchedule && schedule.isCancellable;
            return (
              <TouchableOpacity
                key={schedule.id}
                style={styles.scheduleCard}
                activeOpacity={0.85}
                disabled={!viewEnabled}
                onPress={() => onViewSchedule?.(schedule)}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {ts('admin.audits.schedule.cardTitle', { code: schedule.code, farmer: schedule.farmerName })}
                  </Text>
                  <View style={[styles.badgeContainer, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.badgeText, { color: tone.text }]}>{ts(STATUS_LABEL_KEY[schedule.status])}</Text>
                  </View>
                </View>

                <Text style={styles.cardDetails}>
                  {ts('admin.audits.schedule.details', {
                    farm: schedule.farmLocation,
                    zone: schedule.zone,
                    type: schedule.typeLabel,
                    date: schedule.dateStr,
                    auditor: schedule.auditor,
                  })}
                </Text>

                {schedule.isViewOnly ? (
                  <Text style={styles.viewOnlyNote}>{ts('admin.audits.schedule.viewOnly')}</Text>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => onViewSchedule?.(schedule)}
                      disabled={!viewEnabled}
                      activeOpacity={0.7}
                      style={[styles.actionBtn, !viewEnabled && styles.disabled]}
                    >
                      <Text style={styles.actionLink}>{ts('admin.audits.schedule.action.view')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onEditSchedule?.(schedule)}
                      disabled={!editEnabled}
                      activeOpacity={0.7}
                      style={[styles.actionBtn, !editEnabled && styles.disabled]}
                    >
                      <Text style={styles.actionLink}>{ts('admin.audits.schedule.action.edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => onReschedule?.(schedule)}
                      disabled={!rescheduleEnabled}
                      activeOpacity={0.7}
                      style={[styles.actionBtn, !rescheduleEnabled && styles.disabled]}
                    >
                      <Text style={styles.actionLink}>{ts('admin.audits.schedule.action.reschedule')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openCancel(schedule)}
                      disabled={!cancelEnabled}
                      activeOpacity={0.7}
                      style={[styles.actionBtn, !cancelEnabled && styles.disabled]}
                    >
                      <Text style={styles.cancelLink}>{ts('admin.audits.schedule.action.cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── M5-S05a: Filters popup ── */}
      <Modal visible={isFilterModalVisible} transparent animationType="slide" onRequestClose={() => setIsFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsFilterModalVisible(false)} />

          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{ts('admin.audits.schedule.filters.title')}</Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                activeOpacity={0.7}
                style={styles.closeBtn}
                accessibilityLabel={ts('admin.audits.schedule.filters.close')}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              <FilterDropdown
                label={ts('admin.audits.schedule.filters.farmer')}
                value={temp.farmerId}
                options={farmerOptions}
                isOpen={openDropdown === 'farmer'}
                onToggle={() => toggleDropdown('farmer')}
                onSelect={(id) => {
                  setTemp({ ...temp, farmerId: id });
                  setOpenDropdown(null);
                }}
              />
              <FilterDropdown
                label={ts('admin.audits.schedule.filters.zone')}
                value={temp.zoneId}
                options={zoneOptions}
                isOpen={openDropdown === 'zone'}
                onToggle={() => toggleDropdown('zone')}
                onSelect={(id) => {
                  setTemp({ ...temp, zoneId: id });
                  setOpenDropdown(null);
                }}
              />
              <FilterDropdown
                label={ts('admin.audits.schedule.filters.type')}
                value={temp.type}
                options={typeOptions}
                isOpen={openDropdown === 'auditType'}
                onToggle={() => toggleDropdown('auditType')}
                onSelect={(id) => {
                  setTemp({ ...temp, type: id === 'INTERNAL' || id === 'EXTERNAL' ? (id satisfies AuditType) : null });
                  setOpenDropdown(null);
                }}
              />

              <Text style={styles.fieldLabel}>{ts('admin.audits.schedule.filters.dateFrom')}</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder={ts('admin.audits.schedule.filters.datePlaceholder')}
                  placeholderTextColor={adminColors.placeholder}
                  value={temp.dateFrom}
                  onChangeText={(v) => setTemp({ ...temp, dateFrom: v })}
                />
                <CalendarIcon />
              </View>

              <Text style={styles.fieldLabel}>{ts('admin.audits.schedule.filters.dateTo')}</Text>
              <View style={styles.dateInputField}>
                <TextInput
                  style={styles.dateInputText}
                  placeholder={ts('admin.audits.schedule.filters.datePlaceholder')}
                  placeholderTextColor={adminColors.placeholder}
                  value={temp.dateTo}
                  onChangeText={(v) => setTemp({ ...temp, dateTo: v })}
                />
                <CalendarIcon />
              </View>

              <Text style={styles.fieldLabel}>{ts('admin.audits.schedule.filters.minScore')}</Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                value={temp.minScore}
                onChangeText={(v) => setTemp({ ...temp, minScore: v })}
              />

              <Text style={styles.fieldLabel}>{ts('admin.audits.schedule.filters.maxScore')}</Text>
              <TextInput
                style={styles.numericInput}
                keyboardType="numeric"
                value={temp.maxScore}
                onChangeText={(v) => setTemp({ ...temp, maxScore: v })}
              />
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={applyFilters} activeOpacity={0.8}>
                <Text style={styles.modalApplyBtnText}>{ts('admin.audits.schedule.filters.apply')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalResetBtn} onPress={resetFilters} activeOpacity={0.8}>
                <Text style={styles.modalResetBtnText}>{ts('admin.audits.schedule.filters.reset')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Cancel: the API requires a reason ── */}
      <Modal visible={cancelTarget !== null} transparent animationType="slide" onRequestClose={() => setCancelTarget(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setCancelTarget(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{ts('admin.audits.schedule.cancel.title')}</Text>
              <TouchableOpacity
                onPress={() => setCancelTarget(null)}
                activeOpacity={0.7}
                style={styles.closeBtn}
                accessibilityLabel={ts('admin.audits.schedule.filters.close')}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>
            {cancelTarget !== null ? (
              <Text style={styles.cardDetails}>
                {ts('admin.audits.schedule.cardTitle', { code: cancelTarget.code, farmer: cancelTarget.farmerName })}
              </Text>
            ) : null}
            <Text style={styles.fieldLabel}>{ts('admin.audits.schedule.cancel.reasonLabel')}</Text>
            <TextInput
              style={styles.numericInput}
              placeholder={ts('admin.audits.schedule.cancel.reasonPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={cancelReason}
              onChangeText={setCancelReason}
              maxLength={500}
            />
            {cancelError !== null ? <Text style={styles.errorText}>{cancelError}</Text> : null}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalApplyBtn, cancelAudit.isPending && styles.disabled]}
                onPress={confirmCancel}
                disabled={cancelAudit.isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelLink}>{ts('admin.audits.schedule.cancel.confirm')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalResetBtn} onPress={() => setCancelTarget(null)} activeOpacity={0.8}>
                <Text style={styles.modalResetBtnText}>{ts('admin.audits.schedule.cancel.dismiss')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const CONTROL_HEIGHT = 44;
const SEARCH_HEIGHT = 46;
const ICON_BUTTON = 36;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackBtn: {
    width: ICON_BUTTON,
    height: ICON_BUTTON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: adminSpacing.xsSm,
  },
  headerFilterBtn: {
    width: ICON_BUTTON,
    height: ICON_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFilterBtnActive: {
    borderWidth: 1.5,
    borderColor: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: SEARCH_HEIGHT,
    ...adminShadow.sm,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: adminSpacing.sm,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  clearFilterText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  listContainer: {
    rowGap: adminSpacing.md,
  },
  scheduleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: adminSpacing.xs,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  badgeContainer: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    ...adminType.caption,
  },
  cardDetails: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.smMd,
  },
  viewOnlyNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: adminSpacing.md,
  },
  actionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  actionLink: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  cancelLink: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    marginTop: adminSpacing.xs,
  },

  // Modal sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  closeBtn: {
    padding: adminSpacing.xs,
  },
  modalScroll: {
    marginBottom: adminSpacing.md,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginBottom: adminSpacing.xsSm,
    marginTop: adminSpacing.sm,
  },
  dropdownField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: CONTROL_HEIGHT,
    marginBottom: adminSpacing.xs,
  },
  dropdownValue: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    marginTop: 2,
    marginBottom: adminSpacing.sm,
    maxHeight: 200,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: adminSpacing.smMd,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemActive: {
    backgroundColor: adminColors.muted,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownItemTextActive: {
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  dateInputField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: CONTROL_HEIGHT,
    marginBottom: adminSpacing.xs,
  },
  dateInputText: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
  },
  numericInput: {
    ...adminType.body,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: CONTROL_HEIGHT,
    marginBottom: adminSpacing.xs,
    color: adminColors.ink,
  },
  modalButtonRow: {
    flexDirection: 'row',
    columnGap: adminSpacing.smMd,
    marginTop: adminSpacing.xsSm,
  },
  modalApplyBtn: {
    flex: 1,
    height: CONTROL_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  modalResetBtn: {
    flex: 1,
    height: CONTROL_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
