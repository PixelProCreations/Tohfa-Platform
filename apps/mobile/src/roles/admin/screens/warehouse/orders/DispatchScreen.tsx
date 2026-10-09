/**
 * Dispatch — assign a delivery partner, confirm, and see the order dispatched.
 *
 * Three designed screens are one survivor here, as inline steps:
 *   'dispatch'   M5S14  order summary + delivery partner assignment
 *   'confirm'    M5S14B "Confirm Dispatch?" summary (was its own route)
 *   'dispatched' M5S14C success card (was its own route)
 * The host passes an old deep link's `params.step` through as `initialStep`.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - Both "Confirm Dispatch" buttons (the one that opens the confirm step and
 *     the one that performs the dispatch) render only with `order.dispatch`.
 *   - Picking a delivery partner has no rbac code of its own; it is left
 *     ungated, since without `order.dispatch` the choice cannot be submitted.
 */
// Design id: M5S14 (M5S14_Dispatch), absorbs M5S14B, M5S14C
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
  adminShadow,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import type { DispatchStep, OrderScreenBaseProps } from './types';

export interface DispatchScreenProps extends OrderScreenBaseProps {
  /** Step to open on; an old M5S14B / M5S14C link maps to 'confirm' / 'dispatched'. */
  initialStep?: DispatchStep | undefined;
}

const PARTNER_PLACEHOLDER = 'Select delivery person';

// Mock data until the order API is wired.
const DELIVERY_PARTNERS = [
  PARTNER_PLACEHOLDER,
  'Ramesh Kumar (Van #04)',
  'Suresh M. (Bike #12)',
  'Anand P. (Runner #02)',
  'Karthik S. (Van #08)',
];
const MOCK_CUSTOMER = 'Divya R.';
const MOCK_ITEM_COUNT = 4;
const MOCK_DELIVERY_ADDRESS = 'Ooty Road';
// Slot codes come from configuration/API; this is the mock order's slot.
const MOCK_DELIVERY_SLOT = 'AFTERNOON_12_4';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SelectedCheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.brand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuestionCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.warning.text} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={adminColors.warning.text}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.onBrand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DeliveryTruckIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function HistoryClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Shared layout pieces ────────────────────────────────────────────────────

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
        <BackArrowIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </>
  );
}

function PrimaryButton({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onPress}>
        {icon}
        <Text style={styles.primaryBtnText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step: dispatch (M5S14) ──────────────────────────────────────────────────

interface DispatchDetailsStepProps {
  orderId: string;
  canDispatch: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function DispatchDetailsStep({ orderId, canDispatch, onBack, onConfirm }: DispatchDetailsStepProps) {
  const [selectedPartner, setSelectedPartner] = useState<string>(PARTNER_PLACEHOLDER);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <>
      <Header title="Dispatch" onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.topSubtitleContainer}>
          <Text style={styles.topSubtitleText}>{orderId} · Ready for Dispatch</Text>
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Field label="Customer" value={MOCK_CUSTOMER} />
            </View>
            <View style={styles.col}>
              <Field label="Items" value={String(MOCK_ITEM_COUNT)} />
            </View>
          </View>
          <View style={styles.rowGap}>
            <Field label="Delivery Address" value={MOCK_DELIVERY_ADDRESS} />
          </View>
          <View style={styles.rowGap}>
            <Field label="Delivery Slot" value={MOCK_DELIVERY_SLOT} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Delivery Partner</Text>
        <View style={styles.card}>
          <Text style={styles.assignmentLabel}>Assignment</Text>
          <TouchableOpacity
            style={styles.pickerBox}
            activeOpacity={0.75}
            onPress={() => setIsDropdownOpen((prev) => !prev)}
          >
            <Text style={styles.pickerText}>{selectedPartner}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {DELIVERY_PARTNERS.map((partner, index) => {
                const isSelected = selectedPartner === partner;
                return (
                  <TouchableOpacity
                    key={partner}
                    style={[
                      styles.dropdownItem,
                      index === DELIVERY_PARTNERS.length - 1 && styles.dropdownItemLast,
                      isSelected && styles.dropdownItemSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedPartner(partner);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                      {partner}
                    </Text>
                    {isSelected && <SelectedCheckIcon />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.scrollTail} />
      </ScrollView>

      {canDispatch ? (
        <PrimaryButton label="Confirm Dispatch" icon={<DeliveryTruckIcon />} onPress={onConfirm} />
      ) : null}
    </>
  );
}

// ─── Step: confirm (folded M5S14B) ───────────────────────────────────────────

interface ConfirmStepProps {
  orderId: string;
  canDispatch: boolean;
  onBack: () => void;
  onDispatch: () => void;
}

function ConfirmStep({ orderId, canDispatch, onBack, onDispatch }: ConfirmStepProps) {
  return (
    <>
      <Header title="Confirm Dispatch" onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainerConfirm} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmPromptBox}>
          <QuestionCircleIcon />
          <Text style={styles.confirmPromptText}>Confirm Dispatch?</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Field label="Order" value={orderId} />
            </View>
            <View style={styles.col}>
              <Field label="Destination" value={MOCK_DELIVERY_ADDRESS} />
            </View>
          </View>
          <View style={styles.rowGap}>
            <Field label="Delivery Slot" value={MOCK_DELIVERY_SLOT} />
          </View>
        </View>

        <View style={styles.scrollTail} />
      </ScrollView>

      {canDispatch ? (
        <PrimaryButton label="Confirm Dispatch" icon={<CheckmarkIcon />} onPress={onDispatch} />
      ) : null}
    </>
  );
}

// ─── Step: dispatched (folded M5S14C) ────────────────────────────────────────

interface DispatchedStepProps {
  orderId: string;
  onBack: () => void;
  onViewHistory: () => void;
}

function DispatchedStep({ orderId, onBack, onViewHistory }: DispatchedStepProps) {
  return (
    <>
      <Header title="Order Dispatched" onBack={onBack} />

      <View style={styles.contentPacked}>
        <View style={styles.heroContainer}>
          <View style={styles.successCircleBadge}>
            <DeliveryTruckIcon size={32} color={adminColors.success.text} />
          </View>
          <Text style={styles.heroTitle}>Order Dispatched</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Field label="Order" value={orderId} />
            </View>
            <View style={styles.col}>
              <Field label="Status" value="Dispatched" />
            </View>
          </View>
        </View>
      </View>

      <PrimaryButton label="View Status History" icon={<HistoryClockIcon />} onPress={onViewHistory} />
    </>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function DispatchScreen({
  can,
  onBack,
  onNavigate,
  orderId = 'ORD-1021',
  initialStep = 'dispatch',
}: DispatchScreenProps) {
  const [step, setStep] = useState<DispatchStep>(initialStep);
  const canDispatch = can('order.dispatch');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        {step === 'dispatch' ? (
          <DispatchDetailsStep
            orderId={orderId}
            canDispatch={canDispatch}
            onBack={onBack}
            onConfirm={() => setStep('confirm')}
          />
        ) : null}
        {step === 'confirm' ? (
          <ConfirmStep
            orderId={orderId}
            canDispatch={canDispatch}
            onBack={() => setStep('dispatch')}
            onDispatch={() => setStep('dispatched')}
          />
        ) : null}
        {step === 'dispatched' ? (
          <DispatchedStep
            orderId={orderId}
            onBack={() => setStep('confirm')}
            onViewHistory={() => onNavigate?.('M5S15', { orderId })}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// Success badge diameter: an icon size, not spacing (no size token exists for it).
const BADGE_SIZE = 68;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: 14,
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  topSubtitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: adminSpacing.xs,
  },
  topSubtitleText: { ...adminType.rowTitle, color: adminColors.muted },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: 20 },
  contentContainerConfirm: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: 20 },
  scrollTail: { height: adminSpacing.xl },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitleSpaced: { marginTop: 20 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 18,
    paddingVertical: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  rowGap: { marginTop: 14 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 3 },
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink },
  assignmentLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.sm },
  pickerBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { ...adminType.sectionHead, color: adminColors.ink },
  dropdownMenu: {
    marginTop: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemSelected: { backgroundColor: adminColors.brandTint },
  dropdownItemText: { ...adminType.body, fontWeight: '500', color: adminColors.muted },
  dropdownItemTextSelected: { fontWeight: '700', color: adminColors.brand },
  confirmPromptBox: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  confirmPromptText: { ...adminType.sectionHead, color: adminColors.warning.text },
  bottomBar: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.md,
  },
  primaryBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  contentPacked: { flex: 1, paddingTop: 36, paddingHorizontal: adminSpacing.lg },
  heroContainer: { alignItems: 'center', marginBottom: 28 },
  successCircleBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  heroTitle: { ...adminType.title, color: adminColors.ink },
});
