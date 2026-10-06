import React, { useState } from 'react';
import {
  Alert,
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
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',
  greenBg:       '#ECFDF5',
  greenBorder:   '#A7F3D0',
  greenText:     '#059669',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
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

function ImageIcon({ size = 22, color = '#C2410C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 22, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M19 10h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ServerIcon({ size = 16, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="2" y="13" width="20" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="6" cy="7" r="1" fill={color} />
      <Circle cx="6" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function SaveDiskIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowForwardIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BigCheckCircleIcon({ size = 48, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertCircleRedIcon({ size = 36, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M12 8v5M12 16h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshCcwIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 4v6h-6M1 20v-6h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseInspectProductScreenProps {
  rma: RmaRecord;
  onBack: () => void;
  onContinueToReview: (inspectionData: {
    rma: RmaRecord;
    receivedQty: string;
    condition: string;
    result: string;
    notes: string;
  }) => void;
}

export function SubWarehouseInspectProductScreen({
  rma,
  onBack,
  onContinueToReview,
}: SubWarehouseInspectProductScreenProps) {
  // Screen sub-state: 'form' (Screenshots 2 & 3) vs 'saved' (Screenshot 4)
  const [isSaved, setIsSaved] = useState(false);
  const [showSimulatedError, setShowSimulatedError] = useState(false);

  // Form states
  const [actualQty, setActualQty] = useState('1.8');
  const [condition, setCondition] = useState<'Acceptable' | 'Damaged' | 'Spoiled'>('Damaged');
  const [result, setResult] = useState('Damage Confirmed');
  const [notes, setNotes] = useState('2 KG received. Approximately 0.5 KG visibly damaged.');
  const [showResultOptions, setShowResultOptions] = useState(false);

  const handleSimulateError = () => {
    if (isSaved) {
      setIsSaved(false);
    }
    setShowSimulatedError((prev) => !prev);
  };

  const handleSaveInspection = () => {
    // Transition to Screen 4 (Inspection Saved)
    setIsSaved(true);
  };

  // ─── SCREEN 4: Inspection Saved (Screenshot 4) ───
  if (isSaved) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsSaved(false)}
              activeOpacity={0.8}
            >
              <ArrowBackIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Inspect Returned Product</Text>
              <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
            </View>
          </View>
        </View>

        {/* Center Success Body */}
        <View style={styles.savedContainer}>
          <View style={styles.successIconCircle}>
            <BigCheckCircleIcon size={38} color="#059669" />
          </View>

          <Text style={styles.savedTitle}>Inspection Saved</Text>
          <Text style={styles.savedSubtitle}>RMA is ready for review.</Text>

          {/* Blue Server Info Box */}
          <View style={styles.blueServerBox}>
            <ServerIcon size={16} color="#2563EB" />
            <Text style={styles.blueServerText}>
              Inspection completion is server-confirmed — the RMA is never locally marked as inspected if the server rejects the mutation.
            </Text>
          </View>

          {/* Simulate error button */}
          <TouchableOpacity
            style={styles.simulateErrorBtn}
            onPress={handleSimulateError}
            activeOpacity={0.75}
          >
            <Text style={styles.simulateErrorText}>Simulate save error (demo)</Text>
          </TouchableOpacity>
        </View>

        {/* Sticky Bottom: Continue Review */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueReviewBtn}
            onPress={() => {
              onContinueToReview({
                rma,
                receivedQty: `${actualQty} KG`,
                condition,
                result,
                notes,
              });
            }}
            activeOpacity={0.88}
          >
            <ArrowForwardIcon size={18} color="#FFFFFF" />
            <Text style={styles.continueReviewText}>Continue Review</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── SCREEN 2 & 3: Inspect Returned Product Form (Screenshots 2 & 3) ───
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Inspect Returned Product</Text>
            <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RMA Summary */}
        <Text style={styles.sectionHeader}>RMA Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldBoldVal}>{rma.customerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldBoldVal}>{rma.orderId}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Product</Text>
              <Text style={styles.fieldBoldVal}>{rma.productName} – {rma.grade}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Requested Return</Text>
              <Text style={styles.fieldBoldVal}>{rma.requestedQuantity}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Issue</Text>
            <Text style={styles.fieldBoldVal}>{rma.issueCategory}</Text>
          </View>
        </View>

        {/* Inspection Quantity */}
        <Text style={styles.sectionHeader}>Inspection Quantity</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Expected Return Quantity</Text>
          <Text style={styles.fieldBoldVal}>{rma.requestedQuantity}</Text>
        </View>

        <Text style={[styles.sectionSubHeader, { marginTop: 12 }]}>
          Actual Received Quantity
        </Text>
        <View style={styles.inputWithSuffixBox}>
          <TextInput
            style={styles.qtyInput}
            value={actualQty}
            onChangeText={setActualQty}
            keyboardType="decimal-pad"
            placeholder="0.0"
          />
          <Text style={styles.suffixText}>KG</Text>
        </View>

        {/* Product Condition */}
        <Text style={styles.sectionHeader}>Product Condition</Text>
        <View style={styles.conditionRow}>
          {(['Acceptable', 'Damaged', 'Spoiled'] as const).map((cond) => {
            const isSelected = condition === cond;
            return (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.condBtn,
                  isSelected && styles.condBtnActive,
                ]}
                onPress={() => setCondition(cond)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.condBtnText,
                    isSelected && styles.condBtnTextActive,
                  ]}
                >
                  {cond}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Issue Verification */}
        <Text style={styles.sectionHeader}>Issue Verification</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Customer Reported</Text>
          <View style={styles.reportedTag}>
            <Text style={styles.reportedTagText}>{rma.issueCategory}</Text>
          </View>
        </View>

        {/* Inspection Result */}
        <Text style={styles.sectionHeader}>Inspection Result</Text>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setShowResultOptions((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownSelectedText}>{result || 'Select result'}</Text>
          <ChevronDownIcon size={18} color="#1E1612" />
        </TouchableOpacity>

        {showResultOptions && (
          <View style={styles.dropdownMenu}>
            {[
              'Damage Confirmed',
              'Partial Damage',
              'Quality Degradation',
              'No Defect Found',
            ].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.dropdownItem}
                onPress={() => {
                  setResult(opt);
                  setShowResultOptions(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    result === opt && { color: PALETTE.primary, fontWeight: '700' },
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Inspection Notes */}
        <Text style={styles.sectionHeader}>Inspection Notes</Text>
        <View style={styles.notesBox}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Enter inspection notes..."
            placeholderTextColor="#9E9690"
          />
        </View>

        {/* Inspection Photos */}
        <Text style={styles.sectionHeader}>Inspection Photos</Text>
        <View style={styles.photosRow}>
          <View style={styles.photoBox}>
            <ImageIcon size={22} color="#C2410C" />
          </View>
          <View style={styles.photoBox}>
            <ImageIcon size={22} color="#C2410C" />
          </View>
          <TouchableOpacity
            style={styles.addPhotoBox}
            onPress={() => Alert.alert('Add Photo', 'Take picture or choose from gallery')}
            activeOpacity={0.7}
          >
            <CameraIcon size={22} color="#7A726C" />
          </TouchableOpacity>
        </View>

        {/* Returned Product Condition Summary */}
        <Text style={styles.sectionHeader}>Returned Product Condition</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Returned Quantity</Text>
              <Text style={styles.fieldBoldVal}>2 KG</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Accepted Condition</Text>
              <Text style={styles.fieldBoldVal}>0.0 KG</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Damaged Quantity</Text>
            <Text style={styles.fieldBoldVal}>{actualQty} KG</Text>
          </View>
        </View>

        {/* If Simulated Error Active (Screenshot) */}
        {showSimulatedError ? (
          <View style={styles.errorSection}>
            <View style={styles.errorCircle}>
              <AlertCircleRedIcon size={36} color="#DC2626" />
            </View>

            <Text style={styles.errorSectionTitle}>Unable to Save Inspection</Text>
            <Text style={styles.errorSectionSubtitle}>
              Please check your connection and try again.
            </Text>

            {/* Blue Server Info Box */}
            <View style={styles.blueServerBox}>
              <ServerIcon size={16} color="#2563EB" />
              <Text style={styles.blueServerText}>
                Inspection completion is server-confirmed — the RMA is never locally marked as inspected if the server rejects the mutation.
              </Text>
            </View>

            {/* Simulate error button (demo) */}
            <TouchableOpacity
              style={styles.simulateErrorBtnOutlined}
              onPress={handleSimulateError}
              activeOpacity={0.75}
            >
              <Text style={styles.simulateErrorTextOutlined}>Simulate save error (demo)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Blue Server Info Box */}
            <View style={styles.blueServerBox}>
              <ServerIcon size={16} color="#2563EB" />
              <Text style={styles.blueServerText}>
                Inspection completion is server-confirmed — the RMA is never locally marked as inspected if the server rejects the mutation.
              </Text>
            </View>

            {/* Simulate error button */}
            <TouchableOpacity
              style={styles.simulateErrorBtn}
              onPress={handleSimulateError}
              activeOpacity={0.75}
            >
              <Text style={styles.simulateErrorText}>Simulate save error (demo)</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        {showSimulatedError ? (
          <TouchableOpacity
            style={styles.tryAgainBtn}
            onPress={() => {
              setShowSimulatedError(false);
            }}
            activeOpacity={0.88}
          >
            <RefreshCcwIcon size={18} color="#FFFFFF" />
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveInspectionBtn}
            onPress={handleSaveInspection}
            activeOpacity={0.88}
          >
            <SaveDiskIcon size={18} color="#FFFFFF" />
            <Text style={styles.saveInspectionText}>Save Inspection</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionSubHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
  },

  /* Card */
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldBoldVal: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  /* Actual Received Qty Input */
  inputWithSuffixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  qtyInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    padding: 0,
  },
  suffixText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Product Condition Row */
  conditionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  condBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  condBtnActive: {
    backgroundColor: '#FFEDD5',
    borderColor: '#FDBA74',
  },
  condBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  condBtnTextActive: {
    color: '#C2410C',
    fontWeight: '800',
  },

  /* Reported Tag */
  reportedTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  reportedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },

  /* Dropdown */
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dropdownMenu: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  dropdownItemText: {
    fontSize: 13,
    color: PALETTE.textInk,
  },

  /* Notes */
  notesBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  notesInput: {
    fontSize: 13,
    color: PALETTE.textInk,
    minHeight: 64,
    textAlignVertical: 'top',
    padding: 0,
    lineHeight: 18,
  },

  /* Photos */
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Blue Server Box */
  blueServerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 12,
    gap: 10,
  },
  blueServerText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.blueText,
    flex: 1,
    lineHeight: 16,
  },

  /* Simulate Error */
  simulateErrorBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  simulateErrorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8D4321',
  },
  simulateErrorBtnOutlined: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  simulateErrorTextOutlined: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  /* Error section (when simulate save error is clicked) */
  errorSection: {
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 4,
  },
  errorCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1612',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSectionSubtitle: {
    fontSize: 14,
    color: '#7A726C',
    textAlign: 'center',
    marginBottom: 16,
  },
  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  tryAgainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Bottom Bar */
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveInspectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  saveInspectionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Saved Screen (Screenshot 4) */
  savedContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 36,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  savedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginBottom: 4,
  },
  savedSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  continueReviewText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
