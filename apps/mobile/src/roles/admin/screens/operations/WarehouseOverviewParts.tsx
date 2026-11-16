/**
 * Presentational parts of the Inventory & Warehouse overview (M10-S01): the
 * design's icons, header, search bar, warehouse comparison card, quick-link
 * tiles and filter modal. No data access; the screen passes text in.
 *
 * Dropped from the design on purpose: the header "+" (Add Warehouse, BR-23b:
 * the four warehouses are fixed, no create endpoint).
 *
 * Bell: always rendered (gated on notification.own.view by the host); shows
 * "Not available yet" when no callback is wired.
 *
 * Activate / Cancel buttons: always rendered on inactive warehouse cards; no
 * activate endpoint exists yet — both show "Not available yet" on press.
 */
import React from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';
import { t } from '../../i18n';
import type { FilterOption, WarehouseRowView } from './warehouseOverviewLogic';
import { styles } from './warehouseOverviewStyles';

// ─── Icons (from the design) ─────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseHeaderIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 21V13.5h7V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="9.8" y="17" width="2" height="2" rx="0.3" fill={color} />
      <Rect x="12.2" y="17" width="2" height="2" rx="0.3" fill={color} />
      <Rect x="11" y="14.5" width="2" height="2" rx="0.3" fill={color} />
    </Svg>
  );
}

function SearchGrayIcon({ size = 18, color = adminColors.placeholder }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="2" />
      <Path d="M16 16l5 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersOrangeIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6.5h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15 4v5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M3 12h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 9.5v5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M3 17.5h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 15v5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockLedgerBoxIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4.5" width="16" height="4.5" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="5" y="9" width="14" height="11" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M10 13h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InterWarehouseArrowsIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 8.5h10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M13.5 5.2L17 8.5L13.5 11.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 15.5H7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M10.5 12.2L7 15.5L10.5 18.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellWhiteIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

export function OverviewHeader({
  onBack,
  onOpenNotifications,
}: {
  onBack?: (() => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
}) {
  return (
    <View style={styles.headerBanner}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleGroup}>
          {onBack ? (
            <TouchableOpacity
              testID="warehouseOverview.back"
              style={styles.headerBackBtn}
              onPress={onBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('warehouseOverview.header.back')}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
          ) : null}
          <WarehouseHeaderIcon />
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t('warehouseOverview.header.title')}
          </Text>
        </View>
        {onOpenNotifications !== undefined ? (
          <TouchableOpacity
            testID="warehouseOverview.notifications"
            style={styles.headerBackBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('warehouseOverview.header.notifications')}
          >
            <BellWhiteIcon />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ─── Search ──────────────────────────────────────────────────────────────────

export function OverviewSearchBar({
  value,
  onChange,
  onOpenFilter,
}: {
  value: string;
  onChange: (text: string) => void;
  onOpenFilter: () => void;
}) {
  return (
    <View style={styles.searchBarContainer}>
      <SearchGrayIcon />
      <TextInput
        testID="warehouseOverview.search"
        style={styles.searchInput}
        placeholder={t('warehouseOverview.search.placeholder')}
        placeholderTextColor={adminColors.placeholder}
        value={value}
        onChangeText={onChange}
        accessibilityLabel={t('warehouseOverview.search.label')}
      />
      <TouchableOpacity
        testID="warehouseOverview.filterButton"
        style={styles.searchFilterBtn}
        onPress={onOpenFilter}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('warehouseOverview.filter.open')}
      >
        <FilterSlidersOrangeIcon />
      </TouchableOpacity>
    </View>
  );
}

// ─── Warehouse comparison card ───────────────────────────────────────────────

function notAvailableToast() {
  Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));
}

export function WarehouseComparisonCard({ row, onPress }: { row: WarehouseRowView; onPress?: (() => void) | undefined }) {
  const inactiveButtons = !row.active ? (
    <View style={styles.whCardActionRow}>
      <TouchableOpacity
        testID={`warehouseOverview.card.activate.${row.id}`}
        style={[styles.whCardActionBtn, styles.whCardActionBtnPrimary]}
        onPress={notAvailableToast}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('warehouseOverview.card.activate')}
      >
        <Text style={[styles.whCardActionBtnText, styles.whCardActionBtnTextPrimary]}>{t('warehouseOverview.card.activate')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID={`warehouseOverview.card.cancel.${row.id}`}
        style={[styles.whCardActionBtn, styles.whCardActionBtnNeutral]}
        onPress={notAvailableToast}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('warehouseOverview.card.cancel')}
      >
        <Text style={[styles.whCardActionBtnText, styles.whCardActionBtnTextNeutral]}>{t('warehouseOverview.card.cancel')}</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const body = (
    <>
      <View style={styles.whCardHeader}>
        <Text style={styles.whCardTitle}>{row.title}</Text>
        <View style={[styles.whStatusBadge, row.active ? styles.whStatusActive : styles.whStatusInactive]}>
          <Text style={[styles.whStatusText, row.active ? styles.whStatusTextActive : styles.whStatusTextInactive]}>{row.statusLabel}</Text>
        </View>
      </View>
      <Text style={[styles.whCardLine, row.capacityFailed && styles.whCardLineFailed]}>{row.line1}</Text>
      <Text style={styles.whCardLine}>{row.line2}</Text>
      <Text style={styles.whCardLine}>{row.line3}</Text>
      {inactiveButtons}
    </>
  );
  const cardStyle = [styles.whCard, row.capacityFailed && styles.whCardFailed];
  if (!onPress) return <View style={cardStyle}>{body}</View>;
  return (
    <TouchableOpacity
      testID={`warehouseOverview.card.${row.id}`}
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('warehouseOverview.card.open', { name: row.name })}
    >
      {body}
    </TouchableOpacity>
  );
}

// ─── Quick links ─────────────────────────────────────────────────────────────

export type QuickLinkId = 'stockLedger' | 'transfers';

const LINK_ICON: Record<QuickLinkId, () => React.ReactElement> = {
  stockLedger: () => <StockLedgerBoxIcon />,
  transfers: () => <InterWarehouseArrowsIcon />,
};

const LINK_LABEL = {
  stockLedger: 'warehouseOverview.link.stockLedger',
  transfers: 'warehouseOverview.link.transfers',
} as const;

export interface QuickLink {
  id: QuickLinkId;
  onPress: () => void;
}

/** The design's tile row: exactly two tiles; a lone tile keeps the design's tile size. */
export function QuickLinksGrid({ links }: { links: readonly QuickLink[] }) {
  const rows: QuickLink[][] = [];
  for (let i = 0; i < links.length; i += 2) rows.push(links.slice(i, i + 2));
  return (
    <>
      {rows.map((pair) => (
        <View key={pair.map((l) => l.id).join('-')} style={styles.quickNavRow}>
          {pair.map((link) => (
            <TouchableOpacity
              key={link.id}
              testID={`warehouseOverview.link.${link.id}`}
              style={styles.quickNavTile}
              onPress={link.onPress}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <View style={styles.tileIconContainer}>{LINK_ICON[link.id]()}</View>
              <Text style={styles.tileLabel}>{t(LINK_LABEL[link.id])}</Text>
            </TouchableOpacity>
          ))}
          {pair.length === 1 ? <View style={styles.quickNavSpacer} /> : null}
        </View>
      ))}
    </>
  );
}

// ─── Filter modal ────────────────────────────────────────────────────────────

export function WarehouseFilterModal({
  visible,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: readonly FilterOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('warehouseOverview.filter.title')}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id ?? 'all'}
              testID={`warehouseOverview.filterOption.${opt.id ?? 'all'}`}
              style={styles.modalOption}
              onPress={() => onSelect(opt.id)}
              accessibilityRole="button"
            >
              <Text style={[styles.modalOptionText, selectedId === opt.id && styles.modalOptionTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
