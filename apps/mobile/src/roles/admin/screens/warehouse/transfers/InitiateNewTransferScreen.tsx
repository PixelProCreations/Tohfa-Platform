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
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, SafeAreaView, StatusBar } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
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
import { useFlowBack } from '../useFlowBack';

type Priority = 'Urgent' | 'Standard';

const PRIORITY_COPY: Record<Priority, { title: string; subtitle: string }> = {
  Urgent: { title: 'Low Stock Rebalance', subtitle: 'Urgent dispatch to resolve critical deficit' },
  Standard: { title: 'Standard Rotation', subtitle: 'Regular stock leveling across facilities' },
};

const WAREHOUSE_IDS: readonly string[] = TRANSFER_WAREHOUSES.flatMap((w) => (w.warehouseId ? [w.warehouseId] : []));

function BackArrowIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface InitiateNewTransferScreenProps extends WarehouseScreenBaseProps {
  onSubmitTransfer?: ((transfer: TransferItem) => void) | undefined;
}

export function InitiateNewTransferScreen({ scope, can, onBack, onSubmitTransfer }: InitiateNewTransferScreenProps) {
  const isSub = scope?.warehouseId !== undefined;
  const isMain = !isSub;
  const [step, setStep] = useState<number>(1);
  const [selectedSource, setSelectedSource] = useState<number>(0);
  const [selectedDest, setSelectedDest] = useState<string>('Coonoor');
  const [transferQty, setTransferQty] = useState<string>('50');

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

  const [isCreated, setIsCreated] = useState<boolean>(false);

  const handleDone = () => {
    if (onSubmitTransfer) {
      onSubmitTransfer({
        id: '00285',
        code: 'TRF-00285',
        sourceWarehouseId: 'ooty',
        destinationWarehouseId: 'coonoor',
        produce: 'Tomato — Grade 1',
        quantityKg: 50,
        status: 'In Transit',
        initiatedBy: 'Main Admin',
      });
    } else {
      onBack();
    }
  };

  const handleBack = () => {
    if (isCreated) {
      handleDone();
    } else if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      onBack();
    }
  };

  useFlowBack(() => {
    if (isMain) {
      if (isCreated) {
        handleDone();
        return true;
      }
      if (step > 1) {
        handleBack();
        return true;
      }
    }
    return false;
  });

  if (isMain) {
    return (
      <SafeAreaView style={wizardStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={wizardStyles.container}>
          {/* Header */}
          <View style={wizardStyles.header}>
            <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={wizardStyles.backBtn}>
              <BackArrowIcon color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={wizardStyles.headerTitle}>{isCreated ? 'Transfer Created' : 'Create Transfer'}</Text>
          </View>

          {/* Progress Bar (6 segments) */}
          {!isCreated && (
            <View style={wizardStyles.progressContainer}>
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <View
                  key={idx}
                  style={[
                    wizardStyles.progressSegment,
                    idx <= step && wizardStyles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Step Body */}
          <ScrollView style={wizardStyles.content} contentContainerStyle={wizardStyles.scrollContent} showsVerticalScrollIndicator={false}>
            {isCreated ? (
              <View>
                <View style={wizardStyles.createdCenterGroup}>
                  <View style={wizardStyles.createdIconCircle}>
                    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" stroke={adminColors.success.text} strokeWidth="2" />
                      <Path d="M8 12l2.5 2.5 5-5" stroke={adminColors.success.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={wizardStyles.createdTitle}>Transfer Created</Text>
                  <Text style={wizardStyles.createdSubtitle}>TRF-00285</Text>
                </View>

                <View style={wizardStyles.reviewCard}>
                  <View style={wizardStyles.reviewRow}>
                    <View style={wizardStyles.reviewCol}>
                      <Text style={wizardStyles.reviewLabel}>Source</Text>
                      <Text style={wizardStyles.reviewValue}>Ooty</Text>
                    </View>
                    <View style={wizardStyles.reviewCol}>
                      <Text style={wizardStyles.reviewLabel}>Destination</Text>
                      <Text style={wizardStyles.reviewValue}>Coonoor</Text>
                    </View>
                  </View>

                  <View style={[wizardStyles.reviewRow, { marginTop: 14 }]}>
                    <View style={wizardStyles.reviewCol}>
                      <Text style={wizardStyles.reviewLabel}>Quantity</Text>
                      <Text style={wizardStyles.reviewValue}>50 KG</Text>
                    </View>
                    <View style={wizardStyles.reviewCol} />
                  </View>
                </View>
              </View>
            ) : (
              <>
                {step === 1 && (
                  <View>
                    <Text style={wizardStyles.stepTitle}>Step 1 — Source Warehouse</Text>
                    <View style={wizardStyles.grid2x2}>
                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedSource === 0 && wizardStyles.gridBtnSelected]}
                        onPress={() => setSelectedSource(0)}
                        activeOpacity={0.7}
                      >
                        <Text style={wizardStyles.gridBtnTextBold}>Ooty</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedSource === 1 && wizardStyles.gridBtnSelected]}
                        onPress={() => setSelectedSource(1)}
                        activeOpacity={0.7}
                      >
                        <Text style={wizardStyles.gridBtnTextBold}>Coonoor</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedSource === 2 && wizardStyles.gridBtnSelected]}
                        onPress={() => setSelectedSource(2)}
                        activeOpacity={0.7}
                      >
                        <Text style={wizardStyles.gridBtnTextBold}>Kotagiri</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedSource === 3 && wizardStyles.gridBtnSelected]}
                        onPress={() => setSelectedSource(3)}
                        activeOpacity={0.7}
                      >
                        <Text style={wizardStyles.gridBtnTextBold}>Gudalur Market</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {step === 2 && (
                  <View>
                    <Text style={wizardStyles.stepTitle}>Step 2 — Destination</Text>
                    <View style={wizardStyles.grid2x2}>
                      <View style={[wizardStyles.gridBtn, wizardStyles.gridBtnDisabled]}>
                        <Text style={wizardStyles.gridBtnTextDisabled}>Ooty</Text>
                      </View>

                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedDest === 'Coonoor' ? wizardStyles.gridBtnActivePeach : null]}
                        onPress={() => setSelectedDest('Coonoor')}
                        activeOpacity={0.7}
                      >
                        <Text style={[wizardStyles.gridBtnTextBold, selectedDest === 'Coonoor' && { color: adminColors.brandDeep }]}>
                          Coonoor
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedDest === 'Kotagiri' ? wizardStyles.gridBtnActivePeach : null]}
                        onPress={() => setSelectedDest('Kotagiri')}
                        activeOpacity={0.7}
                      >
                        <Text style={wizardStyles.gridBtnTextBold}>Kotagiri</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[wizardStyles.gridBtn, selectedDest === 'Gudalur Market' ? wizardStyles.gridBtnActivePeach : null]}
                        onPress={() => setSelectedDest('Gudalur Market')}
                        activeOpacity={0.7}
                      >
                        <Text style={wizardStyles.gridBtnTextBold}>Gudalur Market</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={wizardStyles.noteBanner}>
                      <Text style={wizardStyles.noteBannerText}>Destination must be different from source.</Text>
                    </View>
                  </View>
                )}

                {step === 3 && (
                  <View>
                    <Text style={wizardStyles.stepTitle}>Step 3 — Product</Text>
                    <View style={wizardStyles.dropdownCard}>
                      <Text style={wizardStyles.dropdownCardText}>Tomato — Grade 1</Text>
                      <ChevronDownIcon color={adminColors.ink} />
                    </View>

                    <View style={wizardStyles.infoCard}>
                      <Text style={wizardStyles.infoCardTitle}>Available at Source</Text>
                      <Text style={wizardStyles.infoCardValue}>120 KG</Text>
                    </View>
                  </View>
                )}

                {step === 4 && (
                  <View>
                    <Text style={wizardStyles.stepTitle}>Step 4 — Quantity</Text>
                    <View style={wizardStyles.qtyInputCard}>
                      <TextInput
                        style={wizardStyles.qtyInputValue}
                        value={transferQty}
                        onChangeText={setTransferQty}
                        keyboardType="numeric"
                      />
                      <Text style={wizardStyles.qtyInputUnit}>KG</Text>
                    </View>

                    <View style={wizardStyles.infoCard}>
                      <Text style={wizardStyles.infoCardTitle}>Available Quantity</Text>
                      <Text style={wizardStyles.infoCardValue}>120 KG</Text>
                    </View>
                  </View>
                )}

                {step === 5 && (
                  <View>
                    <Text style={wizardStyles.stepTitle}>Step 5 — Reason</Text>
                    <View style={wizardStyles.dropdownCard}>
                      <Text style={wizardStyles.dropdownCardText}>Low Stock Rebalancing</Text>
                      <ChevronDownIcon color={adminColors.ink} />
                    </View>
                  </View>
                )}

                {step === 6 && (
                  <View>
                    <Text style={wizardStyles.stepTitle}>Step 6 — Review</Text>
                    <View style={wizardStyles.reviewCard}>
                      <View style={wizardStyles.reviewRow}>
                        <View style={wizardStyles.reviewCol}>
                          <Text style={wizardStyles.reviewLabel}>Source</Text>
                          <Text style={wizardStyles.reviewValue}>Ooty</Text>
                        </View>
                        <View style={wizardStyles.reviewCol}>
                          <Text style={wizardStyles.reviewLabel}>Destination</Text>
                          <Text style={wizardStyles.reviewValue}>Coonoor</Text>
                        </View>
                      </View>

                      <View style={[wizardStyles.reviewRow, { marginTop: 14 }]}>
                        <View style={wizardStyles.reviewCol}>
                          <Text style={wizardStyles.reviewLabel}>Quantity</Text>
                          <Text style={wizardStyles.reviewValue}>50 KG</Text>
                        </View>
                        <View style={wizardStyles.reviewCol} />
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {isCreated ? (
            <View style={wizardStyles.footer}>
              <TouchableOpacity
                style={wizardStyles.confirmBtn}
                activeOpacity={0.8}
                onPress={handleDone}
              >
                <Text style={wizardStyles.confirmBtnText}>← Back to Transfer Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : step === 6 ? (
            <View style={wizardStyles.footer}>
              <TouchableOpacity
                style={wizardStyles.confirmBtn}
                activeOpacity={0.8}
                onPress={() => setIsCreated(true)}
              >
                <Text style={wizardStyles.confirmBtnText}>✓ Confirm Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={wizardStyles.backOutlineBtn}
                activeOpacity={0.8}
                onPress={() => setStep(5)}
              >
                <Text style={wizardStyles.backOutlineBtnText}>Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={wizardStyles.footer}>
              <TouchableOpacity
                style={wizardStyles.nextBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (step < 6) {
                    setStep(step + 1);
                  }
                }}
              >
                <Text style={wizardStyles.nextBtnText}>→ Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

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

const wizardStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: adminSpacing.md,
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    gap: adminSpacing.xs,
    backgroundColor: adminColors.canvas,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.border,
  },
  progressSegmentActive: {
    backgroundColor: adminColors.brand,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.xxl,
  },
  stepTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  gridBtn: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  gridBtnSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  gridBtnActivePeach: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  gridBtnDisabled: {
    backgroundColor: adminColors.canvas,
    borderColor: adminColors.border,
  },
  gridBtnTextBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  gridBtnTextDisabled: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  noteBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  noteBannerText: {
    color: adminColors.brandDeep,
    ...adminType.caption,
    fontWeight: '600',
  },
  dropdownCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  dropdownCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  qtyInputCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  qtyInputValue: {
    ...adminType.title,
    color: adminColors.ink,
    flex: 1,
    padding: 0,
  },
  qtyInputUnit: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.md,
    ...adminShadow.sm,
  },
  infoCardTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  infoCardValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  footer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
    backgroundColor: adminColors.canvas,
  },
  nextBtn: {
    backgroundColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...adminShadow.md,
  },
  nextBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  reviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  reviewRow: {
    flexDirection: 'row',
  },
  reviewCol: {
    flex: 1,
  },
  reviewLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  reviewValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  confirmBtn: {
    backgroundColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...adminShadow.md,
  },
  confirmBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  backOutlineBtn: {
    backgroundColor: adminColors.card,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: adminSpacing.sm,
  },
  backOutlineBtnText: {
    ...adminType.sectionHead,
    color: adminColors.muted,
  },
  createdCenterGroup: {
    alignItems: 'center',
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.sm,
  },
  createdIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  createdTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  createdSubtitle: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
});


