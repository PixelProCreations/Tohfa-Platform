/**
 * Order / purchase filters: one config-driven filter screen.
 *
 * `config` picks the field set:
 *   - 'order'    customer orders (variant 'customer': search, status bucket,
 *                type, payment, date, customer) or the warehouse order queue
 *                (variant 'queue', the old M5S03 SearchFilters: search, queue
 *                status, fulfillment, sales channel, date, payment).
 *   - 'purchase' purchase history (the old SubWarehousePurchaseFiltersScreen:
 *                search, date, purchase status, product/crop, grade, sort).
 *
 * Scope (FINAL_LIST row 17): filter UI only, no gate beyond customer.list.view.
 * The Warehouse facet renders only for the Main view (scope.warehouseId
 * undefined); a Sub scope gets M5S03's "locked to your assigned warehouse" note.
 */
// Design id: M5S03 (order-queue variant)
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { ChipRow, CustomersScreen, HeaderTextButton, isAllWarehouses, NoteBox, SearchField } from './CustomersParts';
import { CUSTOMER_WAREHOUSES, DEFAULT_ORDER_FILTERS, DEFAULT_PURCHASE_FILTERS } from './fixtures';
import type {
  OrderFiltersVariant,
  OrderFilterState,
  PurchaseFilterState,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';

interface OrderFiltersBaseProps extends WarehouseScreenBaseProps {
  /** Prefills the Customer field of the customer-orders variant. */
  customerName?: string | undefined;
  /** Warehouses for the Main warehouse facet (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export type OrderFiltersScreenProps = OrderFiltersBaseProps &
  (
    | {
        config: 'order';
        variant?: OrderFiltersVariant | undefined;
        initialFilters?: OrderFilterState | undefined;
        onApplyFilters: (filters: OrderFilterState) => void;
      }
    | {
        config: 'purchase';
        initialFilters?: PurchaseFilterState | undefined;
        onApplyFilters: (filters: PurchaseFilterState) => void;
      }
  );

type FilterValues = Record<string, string | undefined>;

type FilterSection =
  | { kind: 'search'; key: string; placeholder: string }
  | { kind: 'chips'; key: string; label: string; options: readonly string[] }
  | { kind: 'text'; key: string; label: string; placeholder: string; suggestions?: readonly string[] | undefined }
  | { kind: 'date'; key: string; label: string; options: readonly string[] };

const CUSTOMER_ORDER_SECTIONS: readonly FilterSection[] = [
  { kind: 'search', key: 'searchQuery', placeholder: 'Search Order ID / Product' },
  { kind: 'chips', key: 'orderStatus', label: 'Order Status', options: ['All', 'Active', 'Completed', 'Cancelled'] },
  { kind: 'chips', key: 'orderType', label: 'Order Type', options: ['All', 'Pickup', 'Delivery'] },
  { kind: 'chips', key: 'paymentStatus', label: 'Payment Status', options: ['All', 'Paid', 'Pending'] },
  { kind: 'date', key: 'datePreset', label: 'Date Range', options: ['All Time', 'Today', 'Last 7 Days', 'This Month', 'Custom'] },
  { kind: 'text', key: 'customer', label: 'Customer', placeholder: 'Search customer name or ID' },
];

/**
 * The order-queue statuses are the ones OrdersListScreen shows, so the chosen
 * status narrows the list (M5S03 offered Packed / Picked Up, which no queue row has).
 */
const ORDER_QUEUE_SECTIONS: readonly FilterSection[] = [
  { kind: 'search', key: 'searchQuery', placeholder: 'Search by order ID, customer name, phone' },
  {
    kind: 'chips',
    key: 'orderStatus',
    label: 'Order Status',
    options: ['All', 'Confirmed', 'Packing', 'Ready for Pickup', 'Quantity Issue', 'Completed'],
  },
  { kind: 'chips', key: 'orderType', label: 'Fulfillment Type', options: ['All', 'Pickup', 'Delivery'] },
  { kind: 'chips', key: 'channel', label: 'Sales Channel', options: ['All', 'Online', 'Live Market', 'HORECA', 'B2B'] },
  { kind: 'date', key: 'datePreset', label: 'Date Range', options: ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Custom'] },
  { kind: 'chips', key: 'paymentStatus', label: 'Payment Status', options: ['All', 'Paid', 'Pending', 'Failed'] },
];

const PURCHASE_SECTIONS: readonly FilterSection[] = [
  { kind: 'search', key: 'searchQuery', placeholder: 'Search Product / Order ID / Invoice' },
  { kind: 'date', key: 'datePreset', label: 'Date Range', options: ['All Time', 'Today', 'This Month', 'Custom'] },
  { kind: 'chips', key: 'purchaseStatus', label: 'Purchase Status', options: ['All', 'Paid', 'Pending', 'Cancelled'] },
  {
    kind: 'text',
    key: 'productCrop',
    label: 'Product / Crop',
    placeholder: 'e.g. Tomato, Carrot',
    suggestions: ['Tomato', 'Carrot', 'Beans', 'Potato', 'Onion'],
  },
  { kind: 'chips', key: 'grade', label: 'Grade', options: ['All', 'Grade 1', 'Grade 2', 'Grade 3'] },
  {
    kind: 'chips',
    key: 'sortBy',
    label: 'Sort By',
    options: ['Newest First', 'Oldest First', 'Highest Amount', 'Lowest Amount'],
  },
];

const ALL_WAREHOUSES_LABEL = 'All Warehouses';

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4"
        stroke={adminColors.brandDeep}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Section({ label, children }: { label?: string | undefined; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

export function OrderFiltersScreen(props: OrderFiltersScreenProps) {
  const { scope, onBack, customerName = '', warehouseOptions = CUSTOMER_WAREHOUSES } = props;
  const allWarehouses = isAllWarehouses(scope);
  const variant: OrderFiltersVariant = props.config === 'order' ? props.variant ?? 'customer' : 'customer';
  const defaults: FilterValues =
    props.config === 'order'
      ? { ...DEFAULT_ORDER_FILTERS, customer: variant === 'customer' ? customerName : '' }
      : { ...DEFAULT_PURCHASE_FILTERS };
  const sections =
    props.config === 'purchase' ? PURCHASE_SECTIONS : variant === 'queue' ? ORDER_QUEUE_SECTIONS : CUSTOMER_ORDER_SECTIONS;

  const [values, setValues] = useState<FilterValues>(() => {
    const initial: FilterValues = { ...defaults, ...props.initialFilters };
    if (props.config === 'order' && variant === 'customer' && !initial['customer']) initial['customer'] = customerName;
    return initial;
  });
  const set = (key: string, value: string | undefined) => setValues((prev) => ({ ...prev, [key]: value }));
  const clearAll = () => setValues({ ...defaults, customer: '' });

  const apply = () => {
    // Values only ever hold the option strings of the matching config.
    if (props.config === 'order') props.onApplyFilters({ ...DEFAULT_ORDER_FILTERS, ...values } as OrderFilterState);
    else props.onApplyFilters({ ...DEFAULT_PURCHASE_FILTERS, ...values } as PurchaseFilterState);
  };

  const warehouseChips = [
    ALL_WAREHOUSES_LABEL,
    ...warehouseOptions.filter((w) => w.warehouseId !== undefined).map((w) => w.warehouseName ?? String(w.warehouseId)),
  ];
  const selectedWarehouseLabel =
    warehouseOptions.find((w) => w.warehouseId === values['warehouseId'])?.warehouseName ?? ALL_WAREHOUSES_LABEL;

  return (
    <CustomersScreen
      title={props.config === 'purchase' ? 'Purchase Filters' : 'Order Filters'}
      onBack={onBack}
      headerRight={<HeaderTextButton label="Reset" onPress={clearAll} />}
      footer={
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={clearAll} activeOpacity={0.7} accessibilityRole="button">
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={apply} activeOpacity={0.85} accessibilityRole="button">
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      }
    >
      {sections.map((section) => {
        const value = values[section.key] ?? '';
        switch (section.kind) {
          case 'search':
            return (
              <Section key={section.key} label="Search">
                <SearchField value={value} onChangeText={(text) => set(section.key, text)} placeholder={section.placeholder} />
              </Section>
            );
          case 'chips':
            return (
              <Section key={section.key} label={section.label}>
                <ChipRow options={section.options} selected={value} onSelect={(next) => set(section.key, next)} />
              </Section>
            );
          case 'date':
            return (
              <Section key={section.key} label={section.label}>
                <ChipRow options={section.options} selected={value} onSelect={(next) => set(section.key, next)} />
                {value === 'Custom' ? (
                  <View style={styles.dateRow}>
                    {(['startDate', 'endDate'] as const).map((key) => (
                      <View key={key} style={styles.dateCol}>
                        <Text style={styles.inputLabel}>{key === 'startDate' ? 'From' : 'To'}</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="DD/MM/YYYY"
                          placeholderTextColor={adminColors.placeholder}
                          value={values[key] ?? ''}
                          onChangeText={(text) => set(key, text)}
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </Section>
            );
          case 'text':
            return (
              <Section key={section.key} label={section.label}>
                <TextInput
                  style={styles.textInput}
                  placeholder={section.placeholder}
                  placeholderTextColor={adminColors.placeholder}
                  value={value}
                  onChangeText={(text) => set(section.key, text)}
                />
                {section.suggestions ? (
                  <View style={styles.suggestions}>
                    <ChipRow options={section.suggestions} selected={value} onSelect={(next) => set(section.key, next)} />
                  </View>
                ) : null}
              </Section>
            );
          default:
            return null;
        }
      })}

      {allWarehouses ? (
        <Section label="Warehouse">
          <ChipRow
            options={warehouseChips}
            selected={selectedWarehouseLabel}
            onSelect={(label) =>
              set('warehouseId', warehouseOptions.find((w) => (w.warehouseName ?? w.warehouseId) === label)?.warehouseId)
            }
          />
        </Section>
      ) : (
        <NoteBox
          icon={<LockIcon />}
          text="Locked to your assigned warehouse. Records from other warehouses are not visible."
        />
      )}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    paddingBottom: 0,
    marginBottom: adminSpacing.md,
  },
  sectionLabel: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  dateRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.md },
  dateCol: { flex: 1 },
  inputLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  textInput: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  suggestions: { marginTop: -adminSpacing.xs },
  footer: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    padding: adminSpacing.lg,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  clearButton: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: { ...adminType.rowTitle, color: adminColors.muted },
  applyButton: {
    flex: 2,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: { ...adminType.rowTitle, color: adminColors.onBrand },
});
