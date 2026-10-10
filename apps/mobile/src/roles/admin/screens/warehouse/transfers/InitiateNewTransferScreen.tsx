/**
 * Initiate New Transfer: pick source / destination, produce, quantity and
 * priority, then dispatch (or submit for Super Admin approval).
 *
 * Gate (FINAL_LIST 142): Main-only. The whole screen needs
 * `transfer.inter_warehouse.initiate` (SA all, MAIN all, SUB none, BR-26);
 * without it a not-available note renders and TransfersFlow refuses the route.
 * A quantity at or above the high-value threshold is routed to Super Admin
 * approval unless the initiator holds `transfer.high_value.approve` (SA only).
 * The threshold lives in config/businessThresholds.ts (CLAUDE.md 2.7; it is
 * undefined in system_config, SPEC_GAPS W4w-1), no longer `qty >= 1000` here.
 * Warehouse options are the seeded warehouses (fixtures), not literals.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatTransferThreshold, transferNeedsApproval } from '../../../config/businessThresholds';
import {
  ChipGroup,
  EmptyState,
  InfoNote,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { WarningTriangleIcon } from '../storage-ops/StorageParts';
import { DEMO_DISPATCH, TRANSFER_PRODUCE_OPTIONS, TRANSFER_QTY_PRESETS_KG, TRANSFER_WAREHOUSES, transferWarehouseLabel } from './fixtures';
import { ArrowDownRouteIcon, DispatchIcon, formatTransferKg, TRANSFER_CODES } from './TransferParts';
import type { TransferItem, WarehouseScreenBaseProps } from './types';

type Priority = 'Urgent' | 'Standard';

const PRIORITY_COPY: Record<Priority, { title: string; subtitle: string }> = {
  Urgent: { title: 'Low Stock Rebalance', subtitle: 'Urgent dispatch to resolve critical deficit' },
  Standard: { title: 'Standard Rotation', subtitle: 'Regular stock leveling across facilities' },
};

const WAREHOUSE_IDS: readonly string[] = TRANSFER_WAREHOUSES.flatMap((w) => (w.warehouseId ? [w.warehouseId] : []));

export interface InitiateNewTransferScreenProps extends WarehouseScreenBaseProps {
  onSubmitTransfer?: ((transfer: TransferItem) => void) | undefined;
}

export function InitiateNewTransferScreen({ can, onBack, onSubmitTransfer }: InitiateNewTransferScreenProps) {
  const [sourceId, setSourceId] = useState(WAREHOUSE_IDS[0] ?? '');
  const [destId, setDestId] = useState(WAREHOUSE_IDS[2] ?? WAREHOUSE_IDS[1] ?? '');
  const [produce, setProduce] = useState(TRANSFER_PRODUCE_OPTIONS[0] ?? '');
  const [quantityKg, setQuantityKg] = useState('300');
  const [priority, setPriority] = useState<Priority>('Urgent');

  if (!can(TRANSFER_CODES.initiate)) {
    return (
      <WalletScreen title="Initiate New Transfer" onBack={onBack}>
        <EmptyState
          title="Not available"
          subtitle="Initiating an inter-warehouse transfer needs transfer initiate permission."
        />
      </WalletScreen>
    );
  }

  const parsedQty = parseInt(quantityKg, 10) || 0;
  const needsApproval = transferNeedsApproval(parsedQty, can(TRANSFER_CODES.highValueApprove));
  const sourceLabel = transferWarehouseLabel(sourceId);
  const destLabel = transferWarehouseLabel(destId);

  const selectSource = (id: string) => {
    setSourceId(id);
    if (id === destId) setDestId(WAREHOUSE_IDS.find((w) => w !== id) ?? '');
  };

  const handleDispatch = () => {
    if (sourceId === destId) {
      Alert.alert('Invalid Route', 'Source and destination facilities must be different.');
      return;
    }
    if (parsedQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid transfer quantity.');
      return;
    }
    const id = String(Date.now()).slice(-5);
    const transfer: TransferItem = {
      id,
      code: `TRF-${id}`,
      sourceWarehouseId: sourceId,
      destinationWarehouseId: destId,
      produce,
      quantityKg: parsedQty,
      status: needsApproval ? 'Pending SA Approval' : 'In Transit',
      eta: needsApproval ? undefined : DEMO_DISPATCH.eta,
      vehicle: needsApproval ? undefined : DEMO_DISPATCH.vehicle,
      initiatedBy: DEMO_DISPATCH.initiatedBy,
    };
    Alert.alert(
      needsApproval ? 'Transfer Submitted for Approval' : 'Transfer Dispatched',
      needsApproval
        ? `Transfer of ${formatTransferKg(parsedQty)} from ${sourceLabel} to ${destLabel} routed to Super Admin for dual-key authorization.`
        : `Transfer manifest created. Truck ${DEMO_DISPATCH.vehicle} dispatched to ${destLabel}.`,
      [{ text: 'OK', onPress: () => (onSubmitTransfer ? onSubmitTransfer(transfer) : onBack()) }],
    );
  };

  return (
    <WalletScreen
      title="Initiate New Transfer"
      subtitle="Dispatch stock between facilities"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton
            label={needsApproval ? 'Submit for Super Admin Sign-off' : 'Dispatch Transfer'}
            icon={<DispatchIcon />}
            onPress={handleDispatch}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>Source Warehouse</Text>
          <ChipGroup options={WAREHOUSE_IDS} value={sourceId} onChange={selectSource} labelOf={transferWarehouseLabel} />
          <View style={styles.routeDividerRow}>
            <View style={styles.routeDividerLine} />
            <View style={styles.routeArrowBox}>
              <ArrowDownRouteIcon />
            </View>
            <View style={styles.routeDividerLine} />
          </View>
          <Text style={styles.label}>Destination Facility</Text>
          <ChipGroup
            options={WAREHOUSE_IDS.filter((w) => w !== sourceId)}
            value={destId}
            onChange={setDestId}
            labelOf={transferWarehouseLabel}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Produce Type</Text>
          <ChipGroup options={TRANSFER_PRODUCE_OPTIONS} value={produce} onChange={setProduce} />
          <Text style={[styles.label, styles.labelSpaced]}>Transfer Quantity (kg)</Text>
          <View style={styles.qtyInputBox}>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={quantityKg}
              onChangeText={setQuantityKg}
              placeholder="e.g. 300"
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel="Transfer quantity in kg"
            />
            <Text style={styles.qtyUnit}>kg</Text>
          </View>
          <View style={styles.presetRow}>
            {TRANSFER_QTY_PRESETS_KG.map((add) => (
              <TouchableOpacity
                key={add}
                style={styles.presetBtn}
                onPress={() => setQuantityKg(String(parsedQty + add))}
                accessibilityRole="button"
              >
                <Text style={styles.presetText}>+{formatTransferKg(add)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionTitle>Transfer Reason / Priority</SectionTitle>
        {(Object.keys(PRIORITY_COPY) as Priority[]).map((p) => {
          const active = priority === p;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.priorityBtn, active && styles.priorityBtnActive]}
              onPress={() => setPriority(p)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.priorityTitle, active && styles.priorityTitleActive]}>{PRIORITY_COPY[p].title}</Text>
              <Text style={styles.prioritySub}>{PRIORITY_COPY[p].subtitle}</Text>
            </TouchableOpacity>
          );
        })}

        {needsApproval ? (
          <InfoNote tone="brandSoft" icon={<WarningTriangleIcon color={adminColors.brandDeep} />}>
            Transfers of {formatTransferThreshold()} or more need dual-key approval from Super Admin before the dispatch
            manifest is issued.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const ROUTE_ARROW = 32;

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  label: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  labelSpaced: { marginTop: adminSpacing.lg },
  routeDividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: adminSpacing.md },
  routeDividerLine: { flex: 1, height: 1, backgroundColor: adminColors.border },
  routeArrowBox: {
    width: ROUTE_ARROW,
    height: ROUTE_ARROW,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: adminSpacing.sm,
  },
  qtyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  qtyInput: { ...adminType.title, flex: 1, color: adminColors.ink, padding: 0 },
  qtyUnit: { ...adminType.sectionHead, color: adminColors.muted },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: adminSpacing.sm },
  presetBtn: {
    backgroundColor: adminColors.canvas,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.xs,
  },
  presetText: { ...adminType.caption, color: adminColors.ink },
  priorityBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  priorityBtnActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  priorityTitle: { ...adminType.sectionHead, color: adminColors.ink },
  priorityTitleActive: { color: adminColors.brand },
  prioritySub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
});
