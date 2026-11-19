/**
 * "Filter and sort tasks" bottom sheet, ported from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "WORK QUEUE FILTER &
 * SORT MODAL (M1-S03a)"): one select box per field that opens an inline
 * option list, then Apply / Reset / Cancel.
 *
 * Changes from the design, and why:
 *   - the sheet edits a draft; Apply commits it, Cancel discards it (the design
 *     applied every pick immediately, so Cancel could not cancel);
 *   - Task type lists the design's four categories plus every type the API
 *     produces (see workQueueLogic UNSOURCED_CATEGORIES for the four);
 *   - Status keeps the design's six options; Exception / Blocked / In review
 *     are selectable but match nothing (the API has no such state), and the
 *     design's list has no Done, so none is offered;
 *   - Warehouse lists the real warehouses (GET /warehouses) with
 *     warehouse.all.view (otherwise only "Any"); the design's three names were fixtures;
 *   - Assigned to is drawn where the design has it, disabled and showing the
 *     empty value with a "not available yet" hint: a task has no assignee, and
 *     the design's sample names are not shown.
 */
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import type { WarehouseOption } from '../../api/warehouseList';
import { ChevronDownIcon, WORK_QUEUE_ICON } from './workQueueIcons';
import {
  DEFAULT_WORK_QUEUE_FILTERS,
  DUE_FILTERS,
  DUE_LABEL,
  SORTS,
  SORT_LABEL,
  STATUS_FILTERS,
  STATUS_LABEL,
  TYPE_FILTERS,
  TYPE_LABEL,
  type WorkQueueFilters,
} from './workQueueLogic';
import { workQueueStyles as styles } from './workQueueStyles';

type Field = 'type' | 'status' | 'due' | 'warehouse' | 'assign' | 'sort';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  field: Field;
  label: string;
  value: string;
  options: readonly Option[];
  open: boolean;
  helper?: string | undefined;
  /** Drawn but not usable (no data behind it yet); `value` is then shown as is. */
  disabled?: boolean | undefined;
  onToggle: (field: Field) => void;
  onPick: (field: Field, value: string) => void;
}

function SelectField({ field, label, value, options, open, helper, disabled = false, onToggle, onPick }: SelectFieldProps) {
  const current = disabled ? value : options.find((o) => o.value === value)?.label ?? '';
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        testID={`workQueue.filter.field.${field}`}
        style={[styles.selectBox, disabled && styles.selectBoxDisabled]}
        onPress={() => onToggle(field)}
        disabled={disabled}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open, disabled }}
      >
        <Text style={styles.selectValue}>{current}</Text>
        <ChevronDownIcon size={WORK_QUEUE_ICON.chevron} color={adminColors.muted} />
      </TouchableOpacity>
      {helper !== undefined ? <Text style={styles.helperText}>{helper}</Text> : null}
      {open && !disabled ? (
        <View style={styles.dropdownList}>
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <TouchableOpacity
                key={opt.value}
                testID={`workQueue.filter.option.${field}.${opt.value}`}
                style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
                onPress={() => onPick(field, opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.dropdownItemText, selected && styles.dropdownItemTextSelected]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** '' stands for "any warehouse" in the option list. */
const ANY_WAREHOUSE = '';

export interface WorkQueueFilterSheetProps {
  visible: boolean;
  filters: WorkQueueFilters;
  /** Real warehouses; offered as options only when `showWarehouse`, the field itself is always drawn. */
  warehouses: readonly WarehouseOption[];
  showWarehouse: boolean;
  onApply: (filters: WorkQueueFilters) => void;
  onClose: () => void;
}

export function WorkQueueFilterSheet({ visible, filters, warehouses, showWarehouse, onApply, onClose }: WorkQueueFilterSheetProps) {
  const [draft, setDraft] = useState<WorkQueueFilters>(filters);
  const [openField, setOpenField] = useState<Field | null>(null);
  const [lastVisible, setLastVisible] = useState(visible);

  // Each time the sheet opens it starts from the applied filters.
  if (visible !== lastVisible) {
    setLastVisible(visible);
    if (visible) {
      setDraft(filters);
      setOpenField(null);
    }
  }

  const toggle = (field: Field) => setOpenField((cur) => (cur === field ? null : field));
  const pick = (field: Field, value: string) => {
    setDraft((d) => {
      switch (field) {
        case 'type':
          return { ...d, type: value as WorkQueueFilters['type'] };
        case 'status':
          return { ...d, status: value as WorkQueueFilters['status'] };
        case 'due':
          return { ...d, due: value as WorkQueueFilters['due'] };
        case 'warehouse':
          return { ...d, warehouseId: value === ANY_WAREHOUSE ? undefined : value };
        case 'assign':
          // No assignee data yet; the field is disabled and never picks.
          return d;
        default:
          return { ...d, sort: value as WorkQueueFilters['sort'] };
      }
    });
    setOpenField(null);
  };

  const common = { onToggle: toggle, onPick: pick };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity style={styles.sheetDismissArea} activeOpacity={1} onPress={onClose} accessibilityLabel={t('workQueue.filter.cancel')} />
        <View style={styles.sheetContainer}>
          <Text style={styles.sheetTitle} accessibilityRole="header">
            {t('workQueue.filter.title')}
          </Text>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <SelectField
              {...common}
              field="type"
              label={t('workQueue.type.label')}
              value={draft.type}
              open={openField === 'type'}
              options={TYPE_FILTERS.map((v) => ({ value: v, label: t(TYPE_LABEL[v]) }))}
            />
            <SelectField
              {...common}
              field="status"
              label={t('workQueue.status.label')}
              value={draft.status}
              open={openField === 'status'}
              options={STATUS_FILTERS.map((v) => ({ value: v, label: t(STATUS_LABEL[v]) }))}
            />
            <SelectField
              {...common}
              field="due"
              label={t('workQueue.due.label')}
              value={draft.due}
              open={openField === 'due'}
              options={DUE_FILTERS.map((v) => ({ value: v, label: t(DUE_LABEL[v]) }))}
            />
            <SelectField
              {...common}
              field="warehouse"
              label={t('workQueue.warehouse.label')}
              value={draft.warehouseId ?? ANY_WAREHOUSE}
              open={openField === 'warehouse'}
              helper={t('workQueue.warehouse.helper')}
              options={[
                { value: ANY_WAREHOUSE, label: t('workQueue.warehouse.any') },
                ...(showWarehouse ? warehouses.map((w) => ({ value: w.warehouseId, label: w.warehouseName })) : []),
              ]}
            />
            <SelectField
              {...common}
              field="assign"
              label={t('workQueue.assign.label')}
              value={t('workQueue.assign.none')}
              open={false}
              disabled
              helper={t('workQueue.assign.helper')}
              options={[]}
            />
            <SelectField
              {...common}
              field="sort"
              label={t('workQueue.sort.label')}
              value={draft.sort}
              open={openField === 'sort'}
              helper={t('workQueue.sort.helper')}
              options={SORTS.map((v) => ({ value: v, label: t(SORT_LABEL[v]) }))}
            />
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              testID="workQueue.filter.apply"
              style={styles.applyButton}
              onPress={() => onApply(draft)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.applyText}>{t('workQueue.filter.apply')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="workQueue.filter.reset"
              style={styles.resetButton}
              onPress={() => setDraft(DEFAULT_WORK_QUEUE_FILTERS)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.resetText}>{t('workQueue.filter.reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="workQueue.filter.cancel"
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>{t('workQueue.filter.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
