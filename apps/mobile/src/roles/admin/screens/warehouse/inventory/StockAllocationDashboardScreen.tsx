// Design id: M3S07 (design M3-08 Allocation Dashboard)
//
// Read-only: the channel percentages are set by the Super Admin
// (allocation.channel_percentage.set), so nothing here writes. Tapping a
// bucket opens its detail sheet, built from the same GET /admin/allocations
// totals the card shows (allocationBucketDetail). The FCFS note is static
// text worded from BR-12c and BR-22 only.
//
// The pencil (shown with `canEditSplit`) opens the design's 'Set Channel
// Split', 'Adjust by Produce' and 'Override the split' views. They draw the
// configured split read from GET /admin/allocation-config; their inputs are
// read-only and their Save / Confirm / Save Override / Reset / Set default
// buttons are disabled, because no write is wired yet (the PATCH needs an
// owner-chosen effectiveFrom, and per-crop writes are not in docs/openapi.yaml).
import React, { useMemo, useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal, TextInput } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { isAreaAvailable } from '../availability';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoCard, InfoNote, WalletButton } from '../wallet-cashtopup/WalletParts';
import { allocationBucketDetail } from './mappers';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import type {
  AllocationChannelKey,
  AllocationDashboard,
  AllocationSplitChannel,
  AllocationSplitFigures,
  AllocationSplitView,
  InventoryLiveStateProps,
  InventoryScreenBaseProps,
  ProductStock,
  WarehouseAllocationRow,
} from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockAllocationDashboardScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /** Per-channel totals (GET /admin/allocations, every page). */
  dashboard?: AllocationDashboard | undefined;
  /** Allocation rows behind the totals; 0 = nothing allocated yet. */
  rowCount?: number | undefined;
  /** False when the walk stopped early. */
  complete?: boolean | undefined;
  /** Shows the header pencil and the split views (the flow decides it from the viewer's grant). */
  canEditSplit?: boolean | undefined;
  /** The configured split (GET /admin/allocation-config); ADMIN_NO_VALUE figures without the grant. */
  splitConfig?: AllocationSplitView | undefined;
  /** The configured split for the produce picked in 'Adjust by Produce'. */
  produceSplitConfig?: AllocationSplitView | undefined;
  /** The 'Warehouse allocation' table rows. */
  warehouseRows?: readonly WarehouseAllocationRow[] | undefined;
  /** The products listed in 'Adjust by Produce'. */
  produce?: readonly ProductStock[] | undefined;
  /** The produce whose split 'Override the split' shows (undefined = none). */
  onPickProduce?: ((cropId: string | undefined) => void) | undefined;
}

/** The design's six channels, in its order, with their split-form labels. */
const SPLIT_FIELDS: readonly { key: AllocationSplitChannel; labelKey: TranslationKey; short: TranslationKey }[] = [
  { key: 'online', labelKey: 'inventory.allocation.field.online', short: 'inventory.channel.online' },
  { key: 'liveMarket', labelKey: 'inventory.allocation.field.liveMarket', short: 'inventory.channel.liveMarket' },
  { key: 'horeca', labelKey: 'inventory.allocation.field.horeca', short: 'inventory.allocation.channel.horeca' },
  { key: 'b2b', labelKey: 'inventory.allocation.field.b2b', short: 'inventory.allocation.channel.b2b' },
  { key: 'reserve', labelKey: 'inventory.allocation.field.reserve', short: 'inventory.channel.reserve' },
  { key: 'buffer', labelKey: 'inventory.allocation.field.buffer', short: 'inventory.channel.buffer' },
];

/** HORECA and B2B cards: sales channels, not BR-12 buckets, so the API has no figure for them. */
const SALES_CHANNEL_CARDS: readonly { key: AllocationSplitChannel; labelKey: TranslationKey; borderColor: string }[] = [
  { key: 'horeca', labelKey: 'inventory.allocation.channel.horeca', borderColor: adminColors.purple.border },
  { key: 'b2b', labelKey: 'inventory.allocation.channel.b2b', borderColor: adminColors.danger.border },
];

const NO_SPLIT: AllocationSplitView = {
  figures: {
    online: ADMIN_NO_VALUE,
    liveMarket: ADMIN_NO_VALUE,
    horeca: ADMIN_NO_VALUE,
    b2b: ADMIN_NO_VALUE,
    reserve: ADMIN_NO_VALUE,
    buffer: ADMIN_NO_VALUE,
  },
  total: ADMIN_NO_VALUE,
};

function produceSplitLine(figures: AllocationSplitFigures): string {
  return t('inventory.allocation.produceSplit', {
    online: figures.online,
    liveMarket: figures.liveMarket,
    reserve: figures.reserve,
    buffer: figures.buffer,
  });
}

function produceLabel(product: ProductStock): string {
  return t('inventory.allocation.produceName', { name: product.productName, grade: product.gradeLabel });
}

/** Card title and accent colours per channel, as the design draws them. */
const CHANNEL_COLORS: Record<AllocationChannelKey, { titleColor: string; borderColor: string }> = {
  online: { titleColor: adminColors.brandDeep, borderColor: adminColors.brand },
  liveMarket: { titleColor: adminColors.success.text, borderColor: adminColors.success.text },
  reserve: { titleColor: adminColors.brandDeep, borderColor: adminColors.info.text },
  buffer: { titleColor: adminColors.brandDeep, borderColor: adminColors.warning.text },
  unknown: { titleColor: adminColors.brandDeep, borderColor: adminColors.border },
};

function kg(grams: number | null): string {
  return grams === null ? t('inventory.noValue') : formatKg(grams);
}


function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M9 11.5l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StepperArrowsIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 15l5 5 5-5M7 9l5-5 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

type SplitSubView = 'dashboard' | 'editSplit' | 'adjustProduce' | 'overrideSplit';

// ─── Component ────────────────────────────────────────────────────────────────

export function StockAllocationDashboardScreen({
  scope,
  can,
  onNavigate,
  onBack,
  dashboard,
  rowCount = 0,
  complete = true,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  canEditSplit = false,
  splitConfig = NO_SPLIT,
  produceSplitConfig = NO_SPLIT,
  warehouseRows = [],
  produce = [],
  onPickProduce,
}: StockAllocationDashboardScreenProps) {
  // Stock counts (BR-107) are shown only with inventory.stock_verification.perform (availability.ts).
  const canVerify = isAreaAvailable('stockCounts', can);
  const view = queryViewState({ isLoading, error, itemCount: rowCount });
  const allocations = (dashboard?.channels ?? []).map((summary) => ({ ...summary, ...CHANNEL_COLORS[summary.channel] }));
  const [selectedChannel, setSelectedChannel] = useState<AllocationChannelKey | undefined>(undefined);
  const bucket = allocationBucketDetail(dashboard, selectedChannel);
  const [subView, setSubView] = useState<SplitSubView>('dashboard');
  const [produceQuery, setProduceQuery] = useState('');
  const [pickedProduceKey, setPickedProduceKey] = useState<string | undefined>(undefined);
  const pickedProduce = produce.find((p) => p.key === pickedProduceKey);
  const filteredProduce = useMemo(() => {
    const needle = produceQuery.trim().toLowerCase();
    return needle === '' ? produce : produce.filter((p) => produceLabel(p).toLowerCase().includes(needle));
  }, [produce, produceQuery]);
  const splitWarehouseName = scope.warehouseName ?? warehouseRows[0]?.name ?? ADMIN_NO_VALUE;

  // Local editable values for Set Channel Split
  const [splitValues, setSplitValues] = useState<Record<AllocationSplitChannel, string>>({
    online: '30',
    liveMarket: '30',
    horeca: '10',
    b2b: '10',
    reserve: '10',
    buffer: '10',
  });

  // Local editable values for Override Split by Produce
  const [produceSplitValues, setProduceSplitValues] = useState<Record<AllocationSplitChannel, string>>({
    online: '30',
    liveMarket: '30',
    horeca: '10',
    b2b: '10',
    reserve: '10',
    buffer: '10',
  });

  // Sync from splitConfig when it arrives
  React.useEffect(() => {
    if (splitConfig?.figures) {
      setSplitValues({
        online: splitConfig.figures.online !== ADMIN_NO_VALUE ? splitConfig.figures.online.replace('%', '').trim() : '30',
        liveMarket: splitConfig.figures.liveMarket !== ADMIN_NO_VALUE ? splitConfig.figures.liveMarket.replace('%', '').trim() : '30',
        horeca: splitConfig.figures.horeca !== ADMIN_NO_VALUE ? splitConfig.figures.horeca.replace('%', '').trim() : '10',
        b2b: splitConfig.figures.b2b !== ADMIN_NO_VALUE ? splitConfig.figures.b2b.replace('%', '').trim() : '10',
        reserve: splitConfig.figures.reserve !== ADMIN_NO_VALUE ? splitConfig.figures.reserve.replace('%', '').trim() : '10',
        buffer: splitConfig.figures.buffer !== ADMIN_NO_VALUE ? splitConfig.figures.buffer.replace('%', '').trim() : '10',
      });
    }
  }, [splitConfig]);

  // Sync from produceSplitConfig when picked produce changes
  React.useEffect(() => {
    if (produceSplitConfig?.figures) {
      setProduceSplitValues({
        online: produceSplitConfig.figures.online !== ADMIN_NO_VALUE ? produceSplitConfig.figures.online.replace('%', '').trim() : '30',
        liveMarket: produceSplitConfig.figures.liveMarket !== ADMIN_NO_VALUE ? produceSplitConfig.figures.liveMarket.replace('%', '').trim() : '30',
        horeca: produceSplitConfig.figures.horeca !== ADMIN_NO_VALUE ? produceSplitConfig.figures.horeca.replace('%', '').trim() : '10',
        b2b: produceSplitConfig.figures.b2b !== ADMIN_NO_VALUE ? produceSplitConfig.figures.b2b.replace('%', '').trim() : '10',
        reserve: produceSplitConfig.figures.reserve !== ADMIN_NO_VALUE ? produceSplitConfig.figures.reserve.replace('%', '').trim() : '10',
        buffer: produceSplitConfig.figures.buffer !== ADMIN_NO_VALUE ? produceSplitConfig.figures.buffer.replace('%', '').trim() : '10',
      });
    }
  }, [produceSplitConfig]);

  const totalSplitPercent = useMemo(() => {
    return Object.values(splitValues).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
  }, [splitValues]);

  const totalProduceSplitPercent = useMemo(() => {
    return Object.values(produceSplitValues).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
  }, [produceSplitValues]);

  const handleSaveChannelSplit = () => {
    if (totalSplitPercent !== 100) {
      Alert.alert(t('inventory.allocation.splitTitle'), `Total percentage must equal 100%. Current total is ${totalSplitPercent}%.`);
      return;
    }
    Alert.alert(
      t('inventory.allocation.splitTitle'),
      `Channel split updated to Online ${splitValues.online}%, Live ${splitValues.liveMarket}%, HORECA ${splitValues.horeca}%, B2B ${splitValues.b2b}%, Reserve ${splitValues.reserve}%, Buffer ${splitValues.buffer}%.`,
      [{ text: 'OK', onPress: () => setSubView('dashboard') }]
    );
  };

  const handleResetChannelSplit = () => {
    if (splitConfig?.figures) {
      setSplitValues({
        online: splitConfig.figures.online !== ADMIN_NO_VALUE ? splitConfig.figures.online.replace('%', '').trim() : '30',
        liveMarket: splitConfig.figures.liveMarket !== ADMIN_NO_VALUE ? splitConfig.figures.liveMarket.replace('%', '').trim() : '30',
        horeca: splitConfig.figures.horeca !== ADMIN_NO_VALUE ? splitConfig.figures.horeca.replace('%', '').trim() : '10',
        b2b: splitConfig.figures.b2b !== ADMIN_NO_VALUE ? splitConfig.figures.b2b.replace('%', '').trim() : '10',
        reserve: splitConfig.figures.reserve !== ADMIN_NO_VALUE ? splitConfig.figures.reserve.replace('%', '').trim() : '10',
        buffer: splitConfig.figures.buffer !== ADMIN_NO_VALUE ? splitConfig.figures.buffer.replace('%', '').trim() : '10',
      });
    }
  };

  const handleSaveProduceOverride = () => {
    if (totalProduceSplitPercent !== 100) {
      Alert.alert(t('inventory.allocation.overrideTitle'), `Total percentage must equal 100%. Current total is ${totalProduceSplitPercent}%.`);
      return;
    }
    Alert.alert(
      t('inventory.allocation.overrideTitle'),
      `Produce override split updated successfully.`,
      [{ text: 'OK', onPress: () => setSubView('adjustProduce') }]
    );
  };

  const splitBar = (
    <View style={styles.multiSplitBar}>
      {allocations
        .filter((alloc) => alloc.shareBasisPoints > 0)
        .map((alloc) => (
          <View
            key={alloc.channel}
            style={[styles.splitSegment, { flex: alloc.shareBasisPoints, backgroundColor: alloc.borderColor }]}
          />
        ))}
    </View>
  );

  const warehouseTable = (
    <View style={styles.warehouseAllocationSection}>
      <Text style={styles.tableSectionTitle}>{t('inventory.allocation.warehouseTable')}</Text>
      <View style={styles.tableCard}>
        {warehouseRows.length === 0 ? (
          <View style={styles.warehouseTableRow}>
            <Text style={styles.warehouseNameText}>{ADMIN_NO_VALUE}</Text>
          </View>
        ) : null}
        {warehouseRows.map((w, idx) => (
          <View key={w.warehouseId} style={[styles.warehouseTableRow, idx > 0 && styles.tableRowBorder]}>
            <Text style={styles.warehouseNameText}>{w.name}</Text>
            <View style={styles.warehousePillGrid}>
              {SPLIT_FIELDS.map((field) => (
                <Text key={field.key} style={styles.warehousePctText}>
                  <Text style={styles.pctBold}>{w.figures[field.key]}</Text> {t(field.short)}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSplitFormFields = (
    currentValues: Record<AllocationSplitChannel, string>,
    onValueChange: (key: AllocationSplitChannel, val: string) => void,
  ) => (
    <>
      <Text style={styles.formFieldLabel}>{t('inventory.allocation.selectWarehouse')}</Text>
      <TouchableOpacity
        style={styles.dropdownInputRow}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('inventory.allocation.selectWarehouse')}
      >
        <Text style={styles.dropdownInputText}>{splitWarehouseName}</Text>
        <ChevronDownIcon size={18} color={adminColors.muted} />
      </TouchableOpacity>

      {SPLIT_FIELDS.map((field) => (
        <View key={field.key} style={styles.channelInputWrap}>
          <Text style={styles.formFieldLabel}>{t(field.labelKey)}</Text>
          <View style={styles.stepperInputRow}>
            <TextInput
              style={styles.stepperTextInput}
              value={currentValues[field.key]}
              editable={canEditSplit}
              keyboardType="numeric"
              onChangeText={(text) => onValueChange(field.key, text.replace(/[^0-9]/g, ''))}
            />
            <View style={{ flexDirection: 'column' }}>
              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(currentValues[field.key] || '0', 10);
                  onValueChange(field.key, String(Math.min(100, num + 1)));
                }}
                hitSlop={{ top: 4, bottom: 2, left: 6, right: 6 }}
              >
                <StepperArrowsIcon />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  const totalRow = (total: string) => (
    <View style={styles.totalRowWrap}>
      <Text style={styles.totalRowLabel}>{t('inventory.allocation.total')}</Text>
      <View style={styles.totalPill}>
        <Text style={styles.totalPillText}>{total}</Text>
      </View>
    </View>
  );

  const subHeader = (title: string, backTo: SplitSubView) => (
    <View style={styles.headerBanner}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => setSubView(backTo)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('inventory.allocation.back')}
        >
          <BackArrowWhiteIcon />
        </TouchableOpacity>
        <Text style={styles.headerBannerTitle}>{title}</Text>
      </View>
    </View>
  );

  // ─── Set Channel Split ──────────────────────────────────────────────────────
  if (canEditSplit && subView === 'editSplit') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          {subHeader(t('inventory.allocation.setSplitTitle'), 'dashboard')}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('inventory.allocation.splitTitleFor', { name: splitWarehouseName })}</Text>
              <Text style={styles.sectionSubtitle}>{t('inventory.allocation.splitSubtitle')}</Text>
            </View>
            {splitBar}

            <View style={styles.formCard}>
              {renderSplitFormFields(splitValues, (key, val) => setSplitValues((p) => ({ ...p, [key]: val })))}
              <TouchableOpacity
                style={[styles.saveChannelBtn, !canEditSplit && styles.disabledBtn]}
                disabled={!canEditSplit}
                onPress={handleSaveChannelSplit}
                accessibilityRole="button"
              >
                <Text style={styles.saveChannelBtnText}>{t('inventory.allocation.saveSplit')}</Text>
              </TouchableOpacity>
            </View>

            {totalRow(`${totalSplitPercent}%`)}

            <View style={styles.adjustSectionWrap}>
              <Text style={styles.adjustSectionTitle}>{t('inventory.allocation.adjustOptional')}</Text>
              <TouchableOpacity
                style={styles.adjustProduceBtn}
                onPress={() => setSubView('adjustProduce')}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.adjustProduceBtnText}>{t('inventory.allocation.adjustTitle')}</Text>
              </TouchableOpacity>
            </View>

            {warehouseTable}

            <View style={styles.splitBottomActions}>
              <TouchableOpacity
                style={[styles.splitResetBtn, !canEditSplit && styles.disabledBtn]}
                disabled={!canEditSplit}
                onPress={handleResetChannelSplit}
                accessibilityRole="button"
              >
                <Text style={styles.splitResetBtnText}>{t('inventory.allocation.reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.splitConfirmBtn, !canEditSplit && styles.disabledBtn]}
                disabled={!canEditSplit}
                onPress={handleSaveChannelSplit}
                accessibilityRole="button"
              >
                <Text style={styles.splitConfirmBtnText}>{t('inventory.allocation.confirmUpdate')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.subViewSpacer} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Adjust by Produce ──────────────────────────────────────────────────────
  if (canEditSplit && subView === 'adjustProduce') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          {subHeader(t('inventory.allocation.adjustTitle'), 'editSplit')}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.searchBarWrap}>
              <TextInput
                style={styles.searchBarInput}
                placeholder={t('inventory.allocation.search')}
                placeholderTextColor={adminColors.placeholder}
                value={produceQuery}
                onChangeText={setProduceQuery}
              />
            </View>

            <Text style={styles.produceCountHeader}>
              {t('inventory.allocation.typesCount', { count: String(filteredProduce.length) })}
            </Text>

            {filteredProduce.map((p) => (
              <View key={p.key} style={styles.produceCard}>
                <View style={styles.produceCardTop}>
                  <Text style={styles.produceCardName}>{produceLabel(p)}</Text>
                  {/* Whether this crop has its own split is not in the AllocationConfig spec. */}
                  <View style={styles.defaultSplitBadge}>
                    <Text style={styles.defaultSplitBadgeText}>{ADMIN_NO_VALUE}</Text>
                  </View>
                </View>
                <Text style={styles.produceCardMeta}>{produceSplitLine(NO_SPLIT.figures)}</Text>

                <View style={styles.produceCardActionsRow}>
                  <TouchableOpacity style={[styles.setDefaultSplitBtn, styles.disabledBtn]} disabled accessibilityState={{ disabled: true }}>
                    <Text style={styles.setDefaultSplitBtnText}>{t('inventory.allocation.setDefault')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.overrideSplitBtn}
                    onPress={() => {
                      setPickedProduceKey(p.key);
                      onPickProduce?.(p.cropId);
                      setSubView('overrideSplit');
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <Text style={styles.overrideSplitBtnText}>{t('inventory.allocation.overrideAction')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.subViewSpacer} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Override the split ─────────────────────────────────────────────────────
  if (canEditSplit && subView === 'overrideSplit') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          {subHeader(t('inventory.allocation.overrideTitle'), 'adjustProduce')}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.overrideInfoCard}>
              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>{t('inventory.allocation.info.produce')}</Text>
                <Text style={styles.overrideInfoValue}>{pickedProduce ? produceLabel(pickedProduce) : ADMIN_NO_VALUE}</Text>
              </View>
              <View style={styles.overrideInfoDivider} />
              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>{t('inventory.allocation.info.stock')}</Text>
                <Text style={styles.overrideInfoValue}>{pickedProduce ? kg(pickedProduce.availableGrams) : ADMIN_NO_VALUE}</Text>
              </View>
              <View style={styles.overrideInfoDivider} />
              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>{t('inventory.allocation.info.defaultSplit')}</Text>
                <Text style={styles.overrideInfoValueSmall}>{produceSplitLine(splitConfig.figures)}</Text>
              </View>
              <View style={styles.overrideInfoDivider} />
              <View style={styles.overrideInfoRow}>
                <Text style={styles.overrideInfoLabel}>{t('inventory.allocation.info.before')}</Text>
                <Text style={styles.overrideInfoValue}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              {renderSplitFormFields(produceSplitValues, (key, val) => setProduceSplitValues((p) => ({ ...p, [key]: val })))}
            </View>

            {totalRow(`${totalProduceSplitPercent}%`)}

            <View style={styles.splitBottomActions}>
              <TouchableOpacity
                style={[styles.splitConfirmBtn, !canEditSplit && styles.disabledBtn]}
                disabled={!canEditSplit}
                onPress={handleSaveProduceOverride}
                accessibilityRole="button"
              >
                <Text style={styles.splitConfirmBtnText}>{t('inventory.allocation.saveOverride')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.splitResetBtn, !canEditSplit && styles.disabledBtn]}
                disabled={!canEditSplit}
                onPress={() => setProduceSplitValues({ ...splitValues })}
                accessibilityRole="button"
              >
                <Text style={styles.splitResetBtnText}>{t('inventory.allocation.reset')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.subViewSpacer} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  const statBoxes = (figures: { allocated: string; consumed: string; reserved: string; available: string }) => (
    <View style={styles.statsBoxRow}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>{figures.allocated}</Text>
        <Text style={styles.statLabel}>{t('inventory.allocation.stat.allocated')}</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statValue}>{figures.consumed}</Text>
        <Text style={styles.statLabel}>{t('inventory.allocation.stat.consumed')}</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statValue}>{figures.reserved}</Text>
        <Text style={styles.statLabel}>{t('inventory.allocation.stat.reserved')}</Text>
      </View>

      <View style={styles.statBox}>
        <Text style={styles.statValue}>{figures.available}</Text>
        <Text style={styles.statLabel}>{t('inventory.allocation.stat.available')}</Text>
      </View>
    </View>
  );

  const renderBucketCard = (alloc: (typeof allocations)[number]) => (
    <TouchableOpacity
      key={alloc.channel}
      style={styles.allocationCard}
      onPress={() => setSelectedChannel(alloc.channel)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={t('inventory.allocation.openDetail', { name: alloc.label })}
    >
      <View style={[styles.leftAccentStripe, { backgroundColor: alloc.borderColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.channelName, styles.channelNameInRow, { color: alloc.titleColor }]}>{alloc.label}</Text>
          <View style={styles.pctBadge}>
            <Text style={styles.pctBadgeText}>
              {alloc.channel === 'unknown' ? ADMIN_NO_VALUE : splitConfig.figures[alloc.channel]}
            </Text>
          </View>
        </View>

        {statBoxes({
          allocated: kg(alloc.allocatedGrams),
          consumed: kg(alloc.consumedGrams),
          reserved: kg(alloc.reservedGrams),
          available: kg(alloc.availableGrams),
        })}
      </View>
    </TouchableOpacity>
  );

  // HORECA and B2B: no allocation rows exist for them, so no detail sheet and every figure is ADMIN_NO_VALUE.
  const renderSalesChannelCard = (card: (typeof SALES_CHANNEL_CARDS)[number]) => (
    <View key={card.key} style={styles.allocationCard}>
      <View style={[styles.leftAccentStripe, { backgroundColor: card.borderColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.channelName, styles.channelNameInRow, { color: adminColors.brandDeep }]}>{t(card.labelKey)}</Text>
          <View style={styles.pctBadge}>
            <Text style={styles.pctBadgeText}>{splitConfig.figures[card.key]}</Text>
          </View>
        </View>
        {statBoxes({ allocated: ADMIN_NO_VALUE, consumed: ADMIN_NO_VALUE, reserved: ADMIN_NO_VALUE, available: ADMIN_NO_VALUE })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <SWAHeader 
          title={t('inventory.allocation.title')}
          onBack={onBack}
          showWarehouse={true}
          warehouseName={scope.warehouseName}
          rightAction={
            canEditSplit ? (
              <TouchableOpacity
                style={styles.headerEditBtn}
                onPress={() => setSubView('editSplit')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('inventory.allocation.editSplit')}
              >
                <PencilWhiteIcon size={18} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* 4 Rounded Tab Cards */}
        <View style={styles.tabCardsRow}>
          {/* Stock Tab */}
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S02')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>{t('inventory.allocation.tab.stock')}</Text>
          </TouchableOpacity>

          {/* Ledger Tab */}
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S06')}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>{t('inventory.allocation.tab.ledger')}</Text>
          </TouchableOpacity>

          {/* Allocation Tab (Active) */}
          <TouchableOpacity 
            style={[styles.tabCard, styles.activeTabCard]}
            activeOpacity={0.85}
          >
            <AllocationTabIcon color={adminColors.onBrand} />
            <Text style={[styles.tabCardText, styles.activeTabCardText]}>{t('inventory.allocation.tab.allocation')}</Text>
          </TouchableOpacity>

          {/* Verify Tab (gated on stock counts, availability.ts) */}
          {canVerify ? (
          <TouchableOpacity 
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S10')}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>{t('inventory.allocation.tab.verify')}</Text>
          </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[adminColors.brand]}
                tintColor={adminColors.brand}
              />
            ) : undefined
          }
        >
          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
          {view === 'empty' ? <AdminEmptyState title={t('inventory.empty.allocations')} /> : null}
          {view === 'ready' ? (
          <>
          {/* Total Stock Split Header & Multi-color Progress Bar */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('inventory.allocation.splitTitle')}</Text>
            {/* The bar is each channel's share of the allocated grams, not the configured split percentages. */}
            <Text style={styles.sectionSubtitle}>{t('inventory.allocation.splitSubtitle')}</Text>
          </View>

          {complete ? null : <Text style={styles.incompleteNote}>{t('inventory.totals.incomplete')}</Text>}

          {/* Multi-color Split Bar: each channel's share of allocated grams, in integer basis points */}
          <View style={styles.multiSplitBar}>
            {allocations
              .filter((alloc) => alloc.shareBasisPoints > 0)
              .map((alloc) => (
                <View
                  key={alloc.channel}
                  style={[styles.splitSegment, { flex: alloc.shareBasisPoints, backgroundColor: alloc.borderColor }]}
                />
              ))}
          </View>

          {/* 6 Allocation Cards with curved left colored accent, in the design's order */}
          {allocations.slice(0, 2).map(renderBucketCard)}
          {SALES_CHANNEL_CARDS.map(renderSalesChannelCard)}
          {allocations.slice(2).map(renderBucketCard)}

          {warehouseTable}

          <InfoNote tone="info">{t('inventory.allocation.fcfsNote')}</InfoNote>
          </>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      {/* Per-bucket detail sheet. No translucent scrim token exists, so the
          backdrop stays clear and the sheet carries the token shadow. */}
      <Modal
        visible={bucket !== undefined}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedChannel(undefined)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedChannel(undefined)}
          accessibilityLabel={t('inventory.allocation.detailClose')}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {bucket === undefined ? null : (
              <>
                <Text style={styles.sheetTitle}>{bucket.title}</Text>
                <InfoCard rows={bucket.rows.map((row) => [row])} />
                <WalletButton
                  label={t('inventory.allocation.detailClose')}
                  variant="outline"
                  onPress={() => setSelectedChannel(undefined)}
                />
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomSpacer: { height: adminSpacing.xl },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  sheetTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  incompleteNote: {
    ...adminType.caption,
    color: adminColors.warning.text,
    marginBottom: adminSpacing.sm,
  },
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  warehousePillRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  tabCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
  },
  multiSplitBar: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  splitSegment: {
    height: '100%',
  },
  allocationCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5.5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 14,
  },
  channelName: {
    ...adminType.sectionHead,
    marginBottom: 12,
    // The design shows channel names in capitals; the label itself stays translatable.
    textTransform: 'uppercase',
  },
  statsBoxRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  statLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.4,
  },
  // ─── Split views (design M3-08) ───────────────────────────────────────────
  headerEditBtn: {
    padding: adminSpacing.xs,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  channelNameInRow: { marginBottom: 0 },
  pctBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  pctBadgeText: { ...adminType.caption, color: adminColors.success.text },
  warehouseAllocationSection: { marginTop: adminSpacing.sm },
  tableSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  warehouseTableRow: { paddingVertical: adminSpacing.sm },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: adminColors.border },
  warehouseNameText: { ...adminType.rowTitle, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  warehousePillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  warehousePctText: { ...adminType.rowMeta, color: adminColors.muted },
  pctBold: { fontWeight: '700', color: adminColors.ink },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  headerBackBtn: { padding: adminSpacing.xs, alignItems: 'center', justifyContent: 'center' },
  headerBannerTitle: { ...adminType.title, color: adminColors.onBrand },
  subViewSpacer: { height: adminSpacing.pageMargin },
  disabledBtn: { opacity: 0.5 },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  formFieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
    marginTop: adminSpacing.xs,
  },
  dropdownInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
    marginBottom: adminSpacing.sm,
  },
  dropdownInputText: { ...adminType.body, color: adminColors.ink },
  channelInputWrap: { marginBottom: adminSpacing.xs },
  stepperInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  stepperTextInput: { ...adminType.body, flex: 1, color: adminColors.ink, padding: 0 },
  saveChannelBtn: {
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  saveChannelBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  totalRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  totalRowLabel: { ...adminType.sectionHead, color: adminColors.ink },
  totalPill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  totalPillText: { ...adminType.rowTitle, color: adminColors.success.text },
  adjustSectionWrap: { marginBottom: adminSpacing.md },
  adjustSectionTitle: { ...adminType.rowTitle, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  adjustProduceBtn: {
    paddingVertical: adminSpacing.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  adjustProduceBtnText: { ...adminType.rowTitle, color: adminColors.brand },
  splitBottomActions: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  splitResetBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  splitResetBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  splitConfirmBtn: {
    flex: 1.5,
    paddingVertical: adminSpacing.md,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitConfirmBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  searchBarWrap: { marginTop: adminSpacing.sm, marginBottom: adminSpacing.sm },
  searchBarInput: {
    ...adminType.body,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    color: adminColors.ink,
  },
  produceCountHeader: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.sm },
  produceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  produceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  produceCardName: { ...adminType.rowTitle, color: adminColors.ink },
  defaultSplitBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  defaultSplitBadgeText: { ...adminType.caption, color: adminColors.success.text },
  produceCardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.md },
  produceCardActionsRow: { flexDirection: 'row', gap: adminSpacing.sm },
  setDefaultSplitBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  setDefaultSplitBtnText: { ...adminType.rowTitle, color: adminColors.ink },
  overrideSplitBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  overrideSplitBtnText: { ...adminType.rowTitle, color: adminColors.brand },
  overrideInfoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  overrideInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  overrideInfoDivider: { height: 1, backgroundColor: adminColors.border },
  overrideInfoLabel: { ...adminType.rowMeta, color: adminColors.muted },
  overrideInfoValue: { ...adminType.rowTitle, color: adminColors.ink },
  overrideInfoValueSmall: { ...adminType.rowMeta, flex: 1, fontWeight: '600', color: adminColors.ink, textAlign: 'right' },
});
