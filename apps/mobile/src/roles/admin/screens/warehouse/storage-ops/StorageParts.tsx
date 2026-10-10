/**
 * Building blocks shared by the storage-ops screens (design module M4), on the
 * admin theme. The frame, cards, chips and buttons come from
 * wallet-cashtopup/WalletParts like the other warehouse areas; this file only
 * adds the storage-specific icons, the action tile and the permission codes.
 */
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

/** docs/rbac.json codes the storage-ops screens check (MAIN / SUB grants in types.ts). */
export const STORAGE_CODES = {
  /** Add Material, Add Stock, Receive, Issue. MAIN all, SUB own. */
  materialManage: 'inventory.material_handling.manage',
  /** Storage location detail 'View Stock' link. MAIN all, SUB own. */
  batchView: 'inventory.batch.view',
  /** Confirm Location Assignment. MAIN all, SUB all. */
  batchAssign: 'inventory.batch.assign',
  /** Manage Capacity Limits link (the edit itself lives in Warehouse Settings). MAIN all, SUB none. */
  capacitySet: 'warehouse.capacity.set',
  /** Consolidated all-warehouse views: Warehouse Performance, the capacity comparison. MAIN all, SUB none. */
  allWarehousesView: 'warehouse.all.view',
  /** The warehouse workforce roster (Top Performing Staff). MAIN all, SUB own. */
  staffRoster: 'warehouse.staff.list_view',
  /**
   * Report an Issue (support request and operational issue). MAIN none, SUB
   * none today, so the form is unreachable for warehouse admins (SPEC_GAPS W4v-2).
   */
  issueReport: 'support.ticket.create_own',
  /** Activity log CSV export (absorbed Operations History). MAIN view, SUB own. */
  reportExport: 'report.export.file',
} as const;

interface IconProps {
  size?: number;
  color?: string;
}

export function ReceiveIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IssueIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16V8M8 12l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HistoryIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MinusIcon({ size = 16, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 20, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ClipboardIcon({ size = 20, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrendingDownIcon({ size = 20, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="17 18 23 18 23 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrendingUpIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BoxIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function WarningTriangleIcon({ size = 18, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L1 21h22L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function WarehouseIcon({ size = 20, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-6 9 6v12H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 14, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AlertCircleIcon({ size = 20, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v5M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function ImageIcon({ size = 24, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PaperclipIcon({ size = 22, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SendIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Option picker shown over the screen (Report an Issue category / specific
 * issue). The old scrim was translucent black; no translucent token exists, so
 * (as notifications / orders) the backdrop is the solid canvas and the card is
 * raised with adminShadow.lg. Tapping the backdrop closes it.
 */
export function PickerModal<T extends string>({
  visible,
  title,
  subtitle,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string | undefined;
  options: readonly T[];
  value: T;
  onSelect: (option: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Close">
        <View style={styles.pickerCard} onStartShouldSetResponder={() => true}>
          <View style={styles.pickerHeader}>
            <View style={styles.pickerHeaderText}>
              <Text style={styles.pickerTitle}>{title}</Text>
              {subtitle ? <Text style={styles.pickerSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <CloseIcon />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = option === value;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.pickerOption, active && styles.pickerOptionActive]}
                  onPress={() => onSelect(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.pickerOptionText, active && styles.pickerOptionTextActive]}>{option}</Text>
                  {active ? <CheckCircleIcon color={adminColors.brand} /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/** One square action tile (Receive / Issue / History). Several share a row. */
export function ActionTile({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <Text style={styles.actionTileText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ActionTileRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.actionRow}>{children}</View>;
}

/** Thin occupancy bar; `percent` is clamped to 0-100. */
export function ProgressBar({ percent, tone = 'brand' }: { percent: number; tone?: 'brand' | 'success' | 'warning' | 'danger' }) {
  const width = `${Math.max(0, Math.min(100, percent))}%` as const;
  const fill = tone === 'brand' ? adminColors.brand : adminColors[tone].text;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: fill }]} />
    </View>
  );
}

/** Occupancy percent of a location / warehouse, rounded; 0 when the capacity is unknown. */
export function occupancyPercent(currentKg: number, capacityKg: number): number {
  return capacityKg > 0 ? Math.round((currentKg / capacityKg) * 100) : 0;
}

/** '2,000 kg' */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString('en-IN')} kg`;
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.lg },
  actionTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  actionTileText: { ...adminType.rowTitle, color: adminColors.ink },
  track: { height: 8, borderRadius: adminRadius.full, backgroundColor: adminColors.canvas, overflow: 'hidden' },
  fill: { height: 8, borderRadius: adminRadius.full },

  // Was a translucent black scrim; no translucent token, so the solid canvas (see PickerModal).
  pickerBackdrop: { flex: 1, backgroundColor: adminColors.canvas, justifyContent: 'center', padding: adminSpacing.lg },
  pickerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    maxHeight: '75%',
    ...adminShadow.lg,
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: adminSpacing.md },
  pickerHeaderText: { flex: 1 },
  pickerTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  pickerSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  pickerList: { flexGrow: 0 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  pickerOptionActive: { backgroundColor: adminColors.brandTint },
  pickerOptionText: { ...adminType.body, color: adminColors.ink, flex: 1 },
  pickerOptionTextActive: { ...adminType.sectionHead, color: adminColors.brandDeep },
});
