import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

// ─── Step Icons ───────────────────────────────────────────────────────────────
function CheckFilledIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="12" fill={SALES_PALETTE.primaryOrange} />
      <Path
        d="M7.5 12l3 3 6-6"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StepBoxIcon({ size = 22, color = '#A0978E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" fill="#FFFFFF" />
      <Path
        d="M16 14V10a1 1 0 0 0-.5-.87l-3-1.73a1 1 0 0 0-1 0l-3 1.73A1 1 0 0 0 8 10v4a1 1 0 0 0 .5.87l3 1.73a1 1 0 0 0 1 0l3-1.73A1 1 0 0 0 16 14z"
        stroke={color}
        strokeWidth="1.4"
      />
    </Svg>
  );
}

function QrOtpIcon({ size = 22, color = '#A0978E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" fill="#FFFFFF" />
      <Rect x="8" y="8" width="3" height="3" fill={color} />
      <Rect x="13" y="8" width="3" height="3" fill={color} />
      <Rect x="8" y="13" width="3" height="3" fill={color} />
      <Rect x="13" y="13" width="3" height="3" fill={color} />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#1F1714', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BoxActionIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

import { t } from '../../i18n';
import { packOrder } from '../../api/orders';
import { useAdminMutation } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { useWarehouseOptions } from '../warehouse/shared/useWarehouseOptions';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

export interface SalesFulfillmentAssignmentScreenProps {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  onBack?: () => void;
  onNavigateToInvoice?: () => void;
  onPacked?: () => void;
}

export function SalesFulfillmentAssignmentScreen({
  orderId,
  orderNumber = ADMIN_NO_VALUE,
  customerName = ADMIN_NO_VALUE,
  onBack,
  onNavigateToInvoice,
  onPacked,
}: SalesFulfillmentAssignmentScreenProps) {
  const { options: warehouseOptions, isLoading: loadingWarehouses } = useWarehouseOptions();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [isPacked, setIsPacked] = useState(false);
  const [warehousePickerVisible, setWarehousePickerVisible] = useState(false);
  const [packAttemptKey] = useState(() =>
    orderId ? `pack-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : '',
  );

  const packMutation = useAdminMutation({
    mutationFn: () => packOrder(orderId ?? '', {}, packAttemptKey),
    invalidates: [adminKeys.module('orders')],
  });

  const selectedWarehouseName =
    warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ??
    warehouseOptions[0]?.warehouseName ??
    ADMIN_NO_VALUE;
  const canPack = Boolean(orderId && !isPacked && !packMutation.isPending);

  const handleMarkPacked = () => {
    if (!canPack) return;
    packMutation.mutate(undefined, {
      onSuccess: () => {
        setIsPacked(true);
        onPacked?.();
        Alert.alert(
          t('wiringSales.fulfillment.packSuccessTitle'),
          t('wiringSales.fulfillment.packSuccessBody', { order: orderNumber }),
          [
            ...(onNavigateToInvoice
              ? [{ text: 'View Invoice', onPress: () => onNavigateToInvoice() }]
              : []),
            { text: 'OK' },
          ],
        );
      },
      onError: () => {
        Alert.alert(t('wiringSales.fulfillment.packErrorTitle'), t('wiringSales.fulfillment.packUnavailable'));
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Fulfillment Assignment</Text>
          <Text style={styles.screenSubtitle}>
            {orderNumber} · {customerName}
          </Text>
        </View>

        {/* Stepper Timeline */}
        <View style={styles.stepperCard}>
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconColumn}>
              <CheckFilledIcon />
              <View style={styles.stepLineActive} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitleActive}>Order confirmed</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconColumn}>
              <CheckFilledIcon />
              <View style={[styles.stepLine, isPacked && styles.stepLineActive]} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitleActive}>
                Assigned to {selectedWarehouseName}
              </Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconColumn}>
              {isPacked ? (
                <CheckFilledIcon />
              ) : (
                <StepBoxIcon color={SALES_PALETTE.primaryOrange} />
              )}
              <View style={styles.stepLine} />
            </View>
            <View style={styles.stepContent}>
              <Text style={isPacked ? styles.stepTitleActive : styles.stepTitlePending}>
                Mark as packed
              </Text>
            </View>
          </View>

          {/* Step 4 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconColumn}>
              <QrOtpIcon color="#A0978E" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitleMuted}>Ready for pickup — awaiting OTP</Text>
            </View>
          </View>
        </View>

        {/* Form: Assign Warehouse */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Assign warehouse</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setWarehousePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownSelectedText}>
              {loadingWarehouses ? t('wiringSales.fulfillment.warehousesLoading') : selectedWarehouseName}
            </Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.primaryActionButton, !canPack && { opacity: 0.45 }]}
          onPress={canPack ? handleMarkPacked : undefined}
          disabled={!canPack}
          accessibilityState={{ disabled: !canPack }}
          activeOpacity={0.85}
        >
          <BoxActionIcon />
          <Text style={styles.primaryActionText}>
            {isPacked ? 'Order Packed' : 'Mark as Packed'}
          </Text>
        </TouchableOpacity>
        {!orderId ? (
          <Text style={styles.stepTitleMuted}>{t('wiringSales.fulfillment.packUnavailable')}</Text>
        ) : null}
        {isPacked ? (
          <Text style={styles.stepTitleMuted}>{t('wiringSales.fulfillment.otpUnavailable')}</Text>
        ) : null}

        {/* Warehouse Selection Modal */}
        <Modal
          visible={warehousePickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setWarehousePickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setWarehousePickerVisible(false)}
          >
            <View style={styles.pickerModal}>
              <Text style={styles.pickerModalTitle}>Select Warehouse</Text>
              {warehouseOptions.length === 0 ? (
                <Text style={styles.pickerOptionText}>{t('wiringSales.fulfillment.warehousesUnavailable')}</Text>
              ) : (
                warehouseOptions.map((wh) => {
                  const isSel =
                    selectedWarehouseId === wh.warehouseId ||
                    (selectedWarehouseId === null && warehouseOptions[0]?.warehouseId === wh.warehouseId);
                  return (
                    <TouchableOpacity
                      key={wh.warehouseId}
                      style={[
                        styles.pickerOption,
                        isSel && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setSelectedWarehouseId(wh.warehouseId);
                        setWarehousePickerVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          isSel && styles.pickerOptionTextActive,
                        ]}
                      >
                        {wh.warehouseName}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  stepperCard: {
    marginBottom: 28,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 14,
  },
  stepLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E6DFD5',
    marginVertical: 4,
  },
  stepLineActive: {
    backgroundColor: SALES_PALETTE.primaryOrange,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 24,
  },
  stepTitleActive: {
    fontSize: 14,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
  },
  stepTitlePending: {
    fontSize: 14,
    fontWeight: '500',
    color: SALES_PALETTE.textPrimary,
  },
  stepTitleMuted: {
    fontSize: 14,
    fontWeight: '400',
    color: SALES_PALETTE.textMuted,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: SALES_PALETTE.textPrimary,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SALES_PALETTE.primaryOrange,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 8,
    shadowColor: SALES_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pickerModal: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    marginBottom: 14,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  pickerOptionActive: {
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    borderWidth: 1,
    borderColor: SALES_PALETTE.primaryOrange,
  },
  pickerOptionText: {
    fontSize: 14,
    color: SALES_PALETTE.textPrimary,
    fontWeight: '500',
  },
  pickerOptionTextActive: {
    color: SALES_PALETTE.primaryOrange,
    fontWeight: '700',
  },
});
