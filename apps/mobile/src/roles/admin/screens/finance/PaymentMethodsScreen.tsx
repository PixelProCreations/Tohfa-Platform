// Design id: M13-S10 Payment methods & Save changes popup (Active & Disabled)
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseCircleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.muted} strokeWidth="1.8" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleGreen() {
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="22" fill="#DCFCE7" />
      <Circle cx="22" cy="22" r="14" stroke="#16A34A" strokeWidth="2" />
      <Path d="M18 22l3 3 5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CategoryCashIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 9h.01M18 15h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CategoryUpiIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3v1h-3z" fill={color} />
    </Svg>
  );
}

function CategoryCardIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="6" y1="15" x2="10" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CategoryWalletIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20M16 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="14" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function MethodUpiIcon() {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F8EE', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={36} height={20} viewBox="0 0 72 28" fill="none">
        <Path d="M4 4v12c0 4 3 7 7 7s7-3 7-7V4" stroke="#0F5132" strokeWidth="4.5" strokeLinecap="round" />
        <Path d="M26 23V4h8c4.5 0 7.5 3 7.5 7s-3 7-7.5 7h-8" stroke="#0F5132" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M49 4v19" stroke="#0F5132" strokeWidth="4.5" strokeLinecap="round" />
        <Path d="M57 7l7 7-7 7" stroke="#0F5132" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M64 7l7 7-7 7" stroke="#F0562A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function MethodCardIcon() {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F8EE', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#16A34A" strokeWidth="1.8" />
        <Line x1="2" y1="10" x2="22" y2="10" stroke="#16A34A" strokeWidth="1.8" />
        <Rect x="5" y="13" width="4" height="3" rx="0.5" fill="#16A34A" />
      </Svg>
    </View>
  );
}

function MethodNetBankingIcon() {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#E8F8EE', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M3 9.5L12 4l9 5.5v1H3v-1z" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="6" y1="11" x2="6" y2="17" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="12" y1="11" x2="12" y2="17" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="18" y1="11" x2="18" y2="17" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="3" y1="17.5" x2="21" y2="17.5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="2" y1="20" x2="22" y2="20" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function MethodCashIcon() {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={26} height={22} viewBox="0 0 28 24" fill="none">
        <Rect x="5" y="2" width="21" height="13" rx="2" stroke="#4B5563" strokeWidth="1.5" strokeDasharray="3 1" />
        <Rect x="2" y="6" width="22" height="14" rx="2" stroke="#374151" strokeWidth="1.8" fill="#F3F4F6" />
        <Circle cx="13" cy="13" r="3.5" stroke="#374151" strokeWidth="1.4" />
        <Path d="M12 11h2M12 12.2h2M12 11v3.5c.8 0 1.2-.4 1.2-.9s-.4-.8-1.2-.8M13 13.5l1.2 1.8" stroke="#374151" strokeWidth="1" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function StackLayersIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface PaymentMethodsScreenProps {
  onBack: () => void;
  can?: (perm: string) => boolean;
  onSave?: (configs: Record<string, boolean>) => void;
}

export function PaymentMethodsScreen({
  onBack,
  can = () => true,
  onSave,
}: PaymentMethodsScreenProps) {
  const [activeCategory, setActiveCategory] = useState<'cash' | 'upi' | 'card' | 'wallet'>('cash');

  // 4 Payment Methods State (Matching Image 2 Left)
  const [upiEnabled, setUpiEnabled] = useState<boolean>(true);
  const [cardEnabled, setCardEnabled] = useState<boolean>(true);
  const [netBankingEnabled, setNetBankingEnabled] = useState<boolean>(true);
  const [cashEnabled, setCashEnabled] = useState<boolean>(false);

  // Modal State (Matching Image 2 Right)
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);

  // Sub-configuration switches in Modal
  const [customerPayments, setCustomerPayments] = useState<boolean>(true);
  const [walletTopups, setWalletTopups] = useState<boolean>(true);
  const [warehouseCounterPayments, setWarehouseCounterPayments] = useState<boolean>(false);

  const activeCount = [upiEnabled, cardEnabled, netBankingEnabled, cashEnabled].filter(Boolean).length;
  const disabledCount = 4 - activeCount;

  const handleConfirmSave = () => {
    setShowSaveModal(false);
    onSave?.({
      upi: upiEnabled,
      card: cardEnabled,
      netBanking: netBankingEnabled,
      cash: cashEnabled,
      customerPayments,
      walletTopups,
      warehouseCounterPayments,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Branded Terracotta Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment methods</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 2 KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCardActive}>
            <Text style={styles.kpiBigNumber}>{activeCount}</Text>
            <Text style={styles.kpiSubtitle}>Active Methods</Text>
          </View>

          <View style={styles.kpiCardDisabled}>
            <Text style={styles.kpiBigNumber}>{disabledCount}</Text>
            <Text style={styles.kpiSubtitle}>{disabledCount} Disabled</Text>
          </View>
        </View>

        {/* Section Heading */}
        <Text style={styles.sectionHeading}>Available Payment Methods</Text>

        {/* 4 Category Filter Tiles */}
        <View style={styles.categoryTilesRow}>
          <TouchableOpacity
            style={[styles.categoryTile, activeCategory === 'cash' && styles.categoryTileActive]}
            onPress={() => setActiveCategory('cash')}
            activeOpacity={0.8}
          >
            <CategoryCashIcon color={activeCategory === 'cash' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.categoryTileText, activeCategory === 'cash' && styles.categoryTileTextActive]}>
              Cash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTile, activeCategory === 'upi' && styles.categoryTileActive]}
            onPress={() => setActiveCategory('upi')}
            activeOpacity={0.8}
          >
            <CategoryUpiIcon color={activeCategory === 'upi' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.categoryTileText, activeCategory === 'upi' && styles.categoryTileTextActive]}>
              UPI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTile, activeCategory === 'card' && styles.categoryTileActive]}
            onPress={() => setActiveCategory('card')}
            activeOpacity={0.8}
          >
            <CategoryCardIcon color={activeCategory === 'card' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.categoryTileText, activeCategory === 'card' && styles.categoryTileTextActive]}>
              Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryTile, activeCategory === 'wallet' && styles.categoryTileActive]}
            onPress={() => setActiveCategory('wallet')}
            activeOpacity={0.8}
          >
            <CategoryWalletIcon color={activeCategory === 'wallet' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.categoryTileText, activeCategory === 'wallet' && styles.categoryTileTextActive]}>
              Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Methods Cards List */}
        <View style={styles.methodsList}>
          {/* 1. UPI */}
          <View style={styles.methodCard}>
            <View style={styles.methodIconBox}>
              <MethodUpiIcon />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>UPI</Text>
              <Text style={styles.methodSubtext}>
                Pay using Google Pay, PhonePe, Paytm and other UPI apps.
              </Text>
            </View>
            <View style={styles.methodRight}>
              <Switch
                value={upiEnabled}
                onValueChange={setUpiEnabled}
                trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                thumbColor={'#FFFFFF'}
              />
              <View style={[styles.statusPill, upiEnabled ? styles.statusPillActive : styles.statusPillDisabled]}>
                <Text style={[styles.statusPillText, upiEnabled ? styles.statusPillTextActive : styles.statusPillTextDisabled]}>
                  {upiEnabled ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Credit / Debit card */}
          <View style={styles.methodCard}>
            <View style={styles.methodIconBox}>
              <MethodCardIcon />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Credit / Debit card</Text>
              <Text style={styles.methodSubtext}>
                Pay using Google Pay, PhonePe, Paytm and other UPI apps.
              </Text>
            </View>
            <View style={styles.methodRight}>
              <Switch
                value={cardEnabled}
                onValueChange={setCardEnabled}
                trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                thumbColor={'#FFFFFF'}
              />
              <View style={[styles.statusPill, cardEnabled ? styles.statusPillActive : styles.statusPillDisabled]}>
                <Text style={[styles.statusPillText, cardEnabled ? styles.statusPillTextActive : styles.statusPillTextDisabled]}>
                  {cardEnabled ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Net Banking */}
          <View style={styles.methodCard}>
            <View style={styles.methodIconBox}>
              <MethodNetBankingIcon />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Net Banking</Text>
              <Text style={styles.methodSubtext}>
                Pay using Google Pay, PhonePe, Paytm and other UPI apps.
              </Text>
            </View>
            <View style={styles.methodRight}>
              <Switch
                value={netBankingEnabled}
                onValueChange={setNetBankingEnabled}
                trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                thumbColor={'#FFFFFF'}
              />
              <View style={[styles.statusPill, netBankingEnabled ? styles.statusPillActive : styles.statusPillDisabled]}>
                <Text style={[styles.statusPillText, netBankingEnabled ? styles.statusPillTextActive : styles.statusPillTextDisabled]}>
                  {netBankingEnabled ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Cash */}
          <View style={styles.methodCard}>
            <View style={styles.methodIconBox}>
              <MethodCashIcon />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Cash</Text>
              <Text style={styles.methodSubtext}>
                Cash collection at warehouse during product purchase.
              </Text>
            </View>
            <View style={styles.methodRight}>
              <Switch
                value={cashEnabled}
                onValueChange={setCashEnabled}
                trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                thumbColor={'#FFFFFF'}
              />
              <View style={[styles.statusPill, cashEnabled ? styles.statusPillActive : styles.statusPillDisabled]}>
                <Text style={[styles.statusPillText, cashEnabled ? styles.statusPillTextActive : styles.statusPillTextDisabled]}>
                  {cashEnabled ? 'Active' : 'Disabled'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setShowSaveModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Save changes popup (Active & Disabled) - Matching Image 2 Right */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowSaveModal(false)}
              activeOpacity={0.7}
            >
              <CloseCircleIcon />
            </TouchableOpacity>

            {/* Checkmark Icon */}
            <View style={styles.modalIconWrap}>
              <CheckmarkCircleGreen />
            </View>

            {/* Modal Title & Subtitle */}
            <Text style={styles.modalTitle}>Save Changes?</Text>
            <Text style={styles.modalSubtitle}>
              Do you want to save the updates to Payment method settings?
            </Text>

            {/* Changes Summary Card */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryHeader}>
                <StackLayersIcon />
                <Text style={styles.summaryHeaderText}>Changes summary</Text>
              </View>

              {/* Row 1: Customer Payments */}
              <View style={styles.summaryRow}>
                <Switch
                  value={customerPayments}
                  onValueChange={setCustomerPayments}
                  trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                  thumbColor={'#FFFFFF'}
                  style={styles.miniSwitch}
                />
                <Text style={styles.summaryRowLabel}>Customer Payments</Text>
                <View style={[styles.summaryBadge, customerPayments ? styles.badgeEnabled : styles.badgeDisabled]}>
                  <Text style={[styles.summaryBadgeText, customerPayments ? styles.badgeTextEnabled : styles.badgeTextDisabled]}>
                    {customerPayments ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>

              {/* Row 2: Wallet Top-ups */}
              <View style={styles.summaryRow}>
                <Switch
                  value={walletTopups}
                  onValueChange={setWalletTopups}
                  trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                  thumbColor={'#FFFFFF'}
                  style={styles.miniSwitch}
                />
                <Text style={styles.summaryRowLabel}>Wallet Top-ups</Text>
                <View style={[styles.summaryBadge, walletTopups ? styles.badgeEnabled : styles.badgeDisabled]}>
                  <Text style={[styles.summaryBadgeText, walletTopups ? styles.badgeTextEnabled : styles.badgeTextDisabled]}>
                    {walletTopups ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>

              {/* Row 3: Warehouse Counter Payments */}
              <View style={styles.summaryRow}>
                <Switch
                  value={warehouseCounterPayments}
                  onValueChange={setWarehouseCounterPayments}
                  trackColor={{ false: '#E5E7EB', true: '#F0562A' }}
                  thumbColor={'#FFFFFF'}
                  style={styles.miniSwitch}
                />
                <Text style={styles.summaryRowLabel}>Warehouse Counter Payments</Text>
                <View style={[styles.summaryBadge, warehouseCounterPayments ? styles.badgeEnabled : styles.badgeDisabled]}>
                  <Text style={[styles.summaryBadgeText, warehouseCounterPayments ? styles.badgeTextEnabled : styles.badgeTextDisabled]}>
                    {warehouseCounterPayments ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Modal Bottom Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowSaveModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmSave}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 18,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: 90,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  kpiCardActive: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  kpiCardDisabled: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  kpiBigNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.ink,
  },
  kpiSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  categoryTilesRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  categoryTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  categoryTileActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  categoryTileText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  categoryTileTextActive: {
    color: adminColors.onBrand,
  },
  methodsList: {
    gap: adminSpacing.sm,
  },
  methodCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  methodSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 14,
  },
  methodRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.xs,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statusPillDisabled: {
    backgroundColor: '#F3F4F6',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#16A34A',
  },
  statusPillTextDisabled: {
    color: '#6B7280',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    flexDirection: 'row',
    gap: adminSpacing.md,
    padding: adminSpacing.md,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  saveButton: {
    flex: 2,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  modalIconWrap: {
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: adminRadius.lg,
    overflow: 'hidden',
    marginBottom: adminSpacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  summaryHeaderText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  miniSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginRight: 6,
  },
  summaryRowLabel: {
    flex: 1,
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  summaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.xs,
  },
  badgeEnabled: {
    backgroundColor: '#DCFCE7',
  },
  badgeDisabled: {
    backgroundColor: '#F3F4F6',
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextEnabled: {
    color: '#16A34A',
  },
  badgeTextDisabled: {
    color: '#6B7280',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  modalConfirmBtn: {
    flex: 1.5,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
