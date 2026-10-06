import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Subwarehouse Brand Palette) ───────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0ECE6',

  // Status & Badges
  greenBadgeBg:  '#DCFCE7',
  greenText:     '#15803D',
  greenDot:      '#10B981',
  amberBadgeBg:  '#FEF3C7',
  amberText:     '#B45309',
  redBadgeBg:    '#FEE2E2',
  redText:       '#DC2626',
  blueBadgeBg:   '#EFF6FF',
  blueText:      '#1D4ED8',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ScaleIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v18M6 8l6-3 6 3M6 8l-3 7h6l-3-7zm12 0l-3 7h6l-3-7zM9 21h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 3h15v13H1V3zm15 5h4l3 3v5h-7V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SuccessCheckLargeIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={PALETTE.greenBadgeBg} />
      <Path
        d="M8 12l3 3 5-5"
        stroke={PALETTE.greenText}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface SubWarehouseReviewReceivingScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
  shipmentData?: {
    reference?: string;
    source?: string;
    product?: string;
    expectedQuantity?: string;
    batchNumber?: string;
    driverName?: string;
    vehicleNo?: string;
  };
}

export function SubWarehouseReviewReceivingScreen({
  onBack,
  onSuccess,
  shipmentData,
}: SubWarehouseReviewReceivingScreenProps) {
  const reference = shipmentData?.reference ?? 'GR-1024';
  const source = shipmentData?.source ?? 'Main Warehouse (Ooty Hub)';
  const product = shipmentData?.product ?? 'Tomato (Grade 1)';
  const expectedQuantity = shipmentData?.expectedQuantity ?? '150 KG';

  const [grossWeight, setGrossWeight] = useState('149.5');
  const [crateCount, setCrateCount] = useState('6');
  const [selectedGrade, setSelectedGrade] = useState<'Grade 1' | 'Grade 2' | 'Industrial'>('Grade 1');
  const [selectedBay, setSelectedBay] = useState('Bay A-03 · Cold Zone (16°C)');
  
  // QC Checklist criteria states
  const [qcFreshness, setQcFreshness] = useState(true);
  const [qcRipeness, setQcRipeness] = useState(true);
  const [qcPestFree, setQcPestFree] = useState(true);
  const [qcPackaging, setQcPackaging] = useState(true);

  // Success Modal
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  const parsedGross = parseFloat(grossWeight) || 0;
  const parsedCrates = parseInt(crateCount, 10) || 0;
  const tareWeight = parsedCrates * 2.0; // 2 KG per plastic crate
  const netWeight = Math.max(0, parsedGross - tareWeight);
  const variance = netWeight - 138; // vs expected net 138 kg (150 gross - 12 tare)

  const handleConfirmAcceptance = () => {
    setIsSuccessModalVisible(true);
  };

  const handleCompleteFlow = () => {
    setIsSuccessModalVisible(false);
    if (onSuccess) {
      onSuccess();
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerMainTitle}>Review Receiving</Text>
            <Text style={styles.headerSubtitle}>Shipment {reference} · Coonoor Hub</Text>
          </View>
        </View>
      </View>

      {/* ─── Main Form Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          {/* 1. Inward Shipment Overview Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.sourceRow}>
                <TruckIcon size={18} color={PALETTE.primary} />
                <Text style={styles.sourceText}>{source}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>QC Pending</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Reference</Text>
                <Text style={styles.fieldValue}>{reference}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Expected Quantity</Text>
                <Text style={styles.fieldValue}>{expectedQuantity}</Text>
              </View>
            </View>

            <View style={[styles.gridRow, { marginTop: 12 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Vehicle & Driver</Text>
                <Text style={styles.fieldValue}>TN-43-E-8821 (Murugan)</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Arrival Time</Text>
                <Text style={styles.fieldValue}>10:32 AM · Today</Text>
              </View>
            </View>
          </View>

          {/* 2. Physical Scale & Tally Verification */}
          <Text style={styles.sectionHeading}>Weight & Tally Verification</Text>
          <View style={styles.card}>
            <View style={styles.productBanner}>
              <Text style={styles.productName}>{product}</Text>
              <Text style={styles.batchTag}>BATCH: LOT-TOM-0924</Text>
            </View>

            <View style={styles.weightInputRow}>
              <View style={styles.weightCol}>
                <Text style={styles.fieldLabel}>Gross Scale Weight (KG)</Text>
                <TextInput
                  style={styles.weightInput}
                  value={grossWeight}
                  onChangeText={setGrossWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.weightCol}>
                <Text style={styles.fieldLabel}>No. of Crates</Text>
                <TextInput
                  style={styles.weightInput}
                  value={crateCount}
                  onChangeText={setCrateCount}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Calculated Weight Summary Box */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Gross</Text>
                <Text style={styles.summaryValue}>{parsedGross.toFixed(1)} KG</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tare ({parsedCrates} crates)</Text>
                <Text style={styles.summaryValue}>-{tareWeight.toFixed(1)} KG</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net Verified</Text>
                <Text style={[styles.summaryValue, { color: PALETTE.primary }]}>
                  {netWeight.toFixed(1)} KG
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Quality Check Inspection Checklist */}
          <Text style={styles.sectionHeading}>Quality Inspection Parameters</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.checkItemRow}
              onPress={() => setQcFreshness(!qcFreshness)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, qcFreshness && styles.checkboxActive]}>
                {qcFreshness && <CheckmarkIcon size={14} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Physical Firmness & Skin Condition</Text>
                <Text style={styles.checkDesc}>Firm structure, no visible crushing or bruising</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.checkItemRow}
              onPress={() => setQcRipeness(!qcRipeness)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, qcRipeness && styles.checkboxActive]}>
                {qcRipeness && <CheckmarkIcon size={14} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Color & Ripeness Index</Text>
                <Text style={styles.checkDesc}>Standard 80-90% red turning grade</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.checkItemRow}
              onPress={() => setQcPestFree(!qcPestFree)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, qcPestFree && styles.checkboxActive]}>
                {qcPestFree && <CheckmarkIcon size={14} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Pest & Foreign Material Free</Text>
                <Text style={styles.checkDesc}>Clean crates with 0% infestation</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 4. Grade Classification & Putaway Storage Bay */}
          <Text style={styles.sectionHeading}>Putaway Storage Destination</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Assigned Warehouse Bay</Text>
            <View style={styles.bayOptionCard}>
              <View style={styles.radioDotOuter}>
                <View style={styles.radioDotInner} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bayTitle}>{selectedBay}</Text>
                <Text style={styles.baySub}>Available Capacity: 480 KG · Temperature Monitored</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.primaryAcceptBtn}
              onPress={handleConfirmAcceptance}
              activeOpacity={0.85}
            >
              <CheckmarkIcon size={18} color="#FFFFFF" />
              <Text style={styles.primaryAcceptBtnText}>
                Accept & Add to Inventory ({netWeight.toFixed(1)} KG)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryRejectBtn}
              onPress={() => {
                Alert.alert(
                  'Report Variance',
                  'Flag shipment for supervisor review and log partial rejection notice.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm Flag', onPress: onBack, style: 'destructive' },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryRejectBtnText}>Report Variance / Partial Discrepancy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ─── Acceptance Success Modal ─── */}
      <Modal
        visible={isSuccessModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCompleteFlow}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <SuccessCheckLargeIcon />
            <Text style={styles.modalSuccessTitle}>Receiving Confirmed!</Text>
            <Text style={styles.modalSuccessDesc}>
              Shipment <Text style={{ fontWeight: '700', color: PALETTE.textInk }}>{reference}</Text> has been verified and <Text style={{ fontWeight: '700', color: PALETTE.primary }}>{netWeight.toFixed(1)} KG of {product}</Text> has been added to Coonoor Warehouse inventory.
            </Text>

            <View style={styles.modalReceiptCard}>
              <Text style={styles.modalReceiptRow}>
                <Text style={{ color: PALETTE.textSecondary }}>GRN Number: </Text>
                <Text style={{ fontWeight: '700', color: PALETTE.textInk }}>GRN-COO-2026-0924</Text>
              </Text>
              <Text style={styles.modalReceiptRow}>
                <Text style={{ color: PALETTE.textSecondary }}>Storage Bay: </Text>
                <Text style={{ fontWeight: '700', color: PALETTE.textInk }}>Bay A-03 (Cold Zone)</Text>
              </Text>
              <Text style={styles.modalReceiptRow}>
                <Text style={{ color: PALETTE.textSecondary }}>Verified By: </Text>
                <Text style={{ fontWeight: '700', color: PALETTE.textInk }}>Suresh (SWA)</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={handleCompleteFlow}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDoneBtnText}>Done & Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  statusBadge: {
    backgroundColor: PALETTE.amberBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.amberText,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.amberText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  productBanner: {
    backgroundColor: PALETTE.primarySoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  batchTag: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  weightInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  weightCol: {
    flex: 1,
  },
  weightInput: {
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  summaryBox: {
    backgroundColor: PALETTE.pageBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
  },
  checkboxActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  checkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  checkDesc: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  bayOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PALETTE.pageBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
  },
  radioDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PALETTE.primary,
  },
  bayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  baySub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  actionButtonsContainer: {
    marginTop: 24,
    gap: 12,
  },
  primaryAcceptBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryRejectBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryRejectBtnText: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalSuccessTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 6,
  },
  modalSuccessDesc: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  modalReceiptCard: {
    width: '100%',
    backgroundColor: PALETTE.pageBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
    gap: 6,
  },
  modalReceiptRow: {
    fontSize: 13,
  },
  modalDoneBtn: {
    backgroundColor: PALETTE.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
