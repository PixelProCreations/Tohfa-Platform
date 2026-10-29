/**
 * Inspect Returned Product — record what actually came back, then confirm.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Save Inspection" and "Continue Review" gated by `inventory.quality_check.perform`.
 */
// Design id: M10-S03
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import type { ReturnItemCondition } from '../../../api/returns';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { toRmaRecord } from './mappers';
import { useInspectReturn, useReturn } from './useReturnData';
import {
  InfoCard,
  PermissionNote,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  SectionTitle,
} from './ReturnsParts';
import type { InspectionCondition, InspectionResultData, InspectStep, RmaScreenBaseProps } from './types';

export interface InspectProductScreenProps extends RmaScreenBaseProps {
  initialStep?: InspectStep | undefined;
  onContinueToReview: (inspection: InspectionResultData) => void;
}

const CONDITIONS: readonly { value: ReturnItemCondition; label: InspectionCondition }[] = [
  { value: 'GOOD', label: 'Acceptable' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'SPOILED', label: 'Spoiled' },
];

function SaveDiskIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowForwardIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BigCheckCircleIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5 5.5-5.5"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InspectProductScreen({
  can,
  returnId,
  rma: initialRma,
  onBack,
  initialStep = 'form',
  onContinueToReview,
}: InspectProductScreenProps) {
  const effectiveId = returnId ?? initialRma?.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : initialRma;

  const canInspect = can('inventory.quality_check.perform');
  const inspectMutation = useInspectReturn();

  const [step, setStep] = useState<InspectStep>(initialStep);
  const [acceptedQty, setAcceptedQty] = useState('');
  const [damagedQty, setDamagedQty] = useState('');
  const [condition, setCondition] = useState<ReturnItemCondition>('DAMAGED');
  const [submitError, setSubmitError] = useState<unknown>(null);

  const permissionNote = canInspect ? null : (
    <PermissionNote>Saving an inspection needs the QC inspection permission (inventory.quality_check.perform).</PermissionNote>
  );

  if (returnQuery.isLoading && !rma) {
    return (
      <ReturnsScreen title="Inspect Returned Product" onBack={onBack}>
        <AdminLoadingState />
      </ReturnsScreen>
    );
  }

  if (returnQuery.isError && !rma) {
    return (
      <ReturnsScreen title="Inspect Returned Product" onBack={onBack}>
        <AdminErrorState error={returnQuery.error} onRetry={() => returnQuery.refetch()} />
      </ReturnsScreen>
    );
  }

  if (!rma) {
    return (
      <ReturnsScreen title="Inspect Returned Product" onBack={onBack}>
        <AdminErrorState error={new Error('Return not found')} onRetry={onBack} />
      </ReturnsScreen>
    );
  }

  const items = returnQuery.data?.items ?? [];
  const activeItem = items[0];
  const requestedGrams = activeItem?.requestedQty ? parseKgToGrams(activeItem.requestedQty) ?? 0 : parseKgToGrams(rma.requestedQuantity.replace(' KG', '')) ?? 0;

  const parsedAccepted = parseKgToGrams(acceptedQty);
  const parsedDamaged = parseKgToGrams(damagedQty);

  const isQtyValid =
    parsedAccepted !== null &&
    parsedAccepted >= 0 &&
    parsedDamaged !== null &&
    parsedDamaged >= 0 &&
    parsedAccepted + parsedDamaged <= requestedGrams &&
    parsedAccepted + parsedDamaged > 0;

  const handleSaveInspection = async () => {
    if (!isQtyValid || !activeItem || !effectiveId) return;
    setSubmitError(null);
    try {
      await inspectMutation.mutateAsync({
        id: effectiveId,
        body: {
          items: [
            {
              orderItemId: activeItem.orderItemId,
              condition,
              acceptedQty: gramsToKgString(parsedAccepted),
              damagedQty: gramsToKgString(parsedDamaged),
            },
          ],
        },
      });
      setStep('saved');
    } catch (err) {
      setSubmitError(err);
    }
  };

  if (step === 'saved') {
    const totalReceivedKg = parsedAccepted !== null && parsedDamaged !== null ? gramsToKgString(parsedAccepted + parsedDamaged) : '0';
    const conditionOption = CONDITIONS.find((c) => c.value === condition)?.label ?? 'Damaged';

    return (
      <ReturnsScreen
        title="Inspect Returned Product"
        subtitle={rma.rmaId}
        onBack={() => setStep('form')}
        footer={
          <ReturnsFooter>
            <ReturnsButton
              label="Continue Review"
              icon={<ArrowForwardIcon />}
              disabled={!canInspect}
              onPress={() =>
                onContinueToReview({
                  rma,
                  receivedQty: `${totalReceivedKg} KG`,
                  condition: conditionOption,
                  result: condition,
                  notes: '',
                })
              }
            />
            {permissionNote}
          </ReturnsFooter>
        }
      >
        <View style={styles.savedContainer}>
          <View style={styles.successIconCircle}>
            <BigCheckCircleIcon />
          </View>
          <Text style={styles.savedTitle}>Inspection Saved</Text>
          <Text style={styles.savedSubtitle}>RMA is ready for review.</Text>
        </View>
      </ReturnsScreen>
    );
  }

  return (
    <ReturnsScreen
      title="Inspect Returned Product"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          <ReturnsButton
            label={inspectMutation.isPending ? 'Saving...' : 'Save Inspection'}
            icon={<SaveDiskIcon />}
            disabled={!canInspect || !isQtyValid || inspectMutation.isPending}
            onPress={handleSaveInspection}
          />
          {permissionNote}
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {submitError ? (
          <View style={{ marginBottom: adminSpacing.md }}>
            <AdminErrorState error={submitError} onRetry={handleSaveInspection} />
          </View>
        ) : null}

        <SectionTitle>RMA Summary</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer', value: rma.customerName },
              { label: 'Order', value: rma.orderId },
            ],
            [
              { label: 'Product', value: `${rma.productName} – ${rma.grade}` },
              { label: 'Requested Return', value: rma.requestedQuantity },
            ],
          ]}
        />

        <SectionTitle>Inspection Quantity</SectionTitle>
        <InfoCard rows={[[{ label: 'Expected Return Quantity', value: rma.requestedQuantity }]]} />

        <Text style={styles.subHeader}>Accepted Quantity</Text>
        <View style={styles.inputWithSuffix}>
          <TextInput
            style={styles.qtyInput}
            value={acceptedQty}
            onChangeText={setAcceptedQty}
            keyboardType="decimal-pad"
            placeholder="0.000"
            placeholderTextColor={adminColors.placeholder}
            editable={canInspect && !inspectMutation.isPending}
          />
          <Text style={styles.suffixText}>KG</Text>
        </View>

        <Text style={styles.subHeader}>Damaged Quantity</Text>
        <View style={styles.inputWithSuffix}>
          <TextInput
            style={styles.qtyInput}
            value={damagedQty}
            onChangeText={setDamagedQty}
            keyboardType="decimal-pad"
            placeholder="0.000"
            placeholderTextColor={adminColors.placeholder}
            editable={canInspect && !inspectMutation.isPending}
          />
          <Text style={styles.suffixText}>KG</Text>
        </View>

        {parsedAccepted !== null && parsedDamaged !== null && parsedAccepted + parsedDamaged > requestedGrams ? (
          <Text style={styles.errorText}>
            Accepted + Damaged ({gramsToKgString(parsedAccepted + parsedDamaged)} KG) cannot exceed requested quantity.
          </Text>
        ) : null}

        <SectionTitle>Product Condition</SectionTitle>
        <View style={styles.conditionRow}>
          {CONDITIONS.map((cond) => {
            const isSelected = condition === cond.value;
            return (
              <TouchableOpacity
                key={cond.value}
                style={[styles.condBtn, isSelected && styles.condBtnActive]}
                onPress={() => setCondition(cond.value)}
                activeOpacity={0.75}
                disabled={!canInspect || inspectMutation.isPending}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !canInspect }}
              >
                <Text style={[styles.condBtnText, isSelected && styles.condBtnTextActive]}>{cond.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ReturnsScreen>
  );
}

const SUCCESS_CIRCLE = 72;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  subHeader: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.md, marginBottom: adminSpacing.sm },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 52,
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  qtyInput: { ...adminType.kpiValue, color: adminColors.ink, flex: 1, padding: 0 },
  suffixText: { ...adminType.rowTitle, color: adminColors.ink },
  conditionRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  condBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  condBtnActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  condBtnText: { ...adminType.body, color: adminColors.muted },
  condBtnTextActive: { ...adminType.rowTitle, color: adminColors.brandDeep },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginBottom: adminSpacing.sm },
  savedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: adminSpacing.xl },
  successIconCircle: {
    width: SUCCESS_CIRCLE,
    height: SUCCESS_CIRCLE,
    borderRadius: SUCCESS_CIRCLE / 2,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  savedTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.xs },
  savedSubtitle: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
});
