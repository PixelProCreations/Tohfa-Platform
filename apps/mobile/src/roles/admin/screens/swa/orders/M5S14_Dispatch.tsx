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
import { ORDERS_THEME } from './theme';

interface M5S14Props {
  orderId?: string;
  initialStep?: 'details' | 'confirm' | 'dispatched';
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

const DELIVERY_PARTNERS = [
  'Select delivery person',
  'Ramesh Kumar (Van #04)',
  'Suresh M. (Bike #12)',
  'Anand P. (Runner #02)',
  'Karthik S. (Van #08)',
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#1F2937' }: { size?: number; color?: string }) {
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

function QuestionCircleOrangeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.warning} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={ORDERS_THEME.warning}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DeliveryTruckWhiteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
    </Svg>
  );
}

function DeliveryTruckGreenIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke={ORDERS_THEME.success} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={ORDERS_THEME.success} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={ORDERS_THEME.success} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={ORDERS_THEME.success} strokeWidth="2" />
    </Svg>
  );
}

function HistoryClockWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}


export const M5S14_Dispatch: React.FC<M5S14Props> = ({
  orderId = 'ORD-1021',
  initialStep = 'details',
  onNavigate,
  onBack,
}) => {
  const [step, setStep] = useState<'details' | 'confirm' | 'dispatched'>(initialStep);
  const [selectedPartner, setSelectedPartner] = useState<string>('Select delivery person');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // ─── STEP 3: Order Dispatched ─────────────────────────────────────────────
  if (step === 'dispatched') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={ORDERS_THEME.primary} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setStep('details')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Dispatched</Text>
          </View>

          <View style={styles.contentPacked}>
            <View style={styles.heroContainer}>
              <View style={styles.successCircleBadge}>
                <DeliveryTruckGreenIcon />
              </View>
              <Text style={styles.heroTitle}>Order Dispatched</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValue}>Dispatched</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S15', { orderId })}
            >
              <HistoryClockWhiteIcon />
              <Text style={styles.primaryBtnText}>View Status History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 2: Confirm Dispatch ─────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={ORDERS_THEME.primary} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => setStep('details')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirm Dispatch</Text>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.confirmPromptBox}>
              <QuestionCircleOrangeIcon />
              <Text style={styles.confirmPromptText}>Confirm Dispatch?</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Destination</Text>
                  <Text style={styles.fieldValue}>Ooty Road, Coonoor</Text>
                </View>
              </View>

              <View style={[styles.singleRow, { marginTop: 14 }]}>
                <Text style={styles.fieldLabel}>Delivery Slot</Text>
                <Text style={styles.fieldValue}>AFTERNOON_12_4</Text>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigate) {
                  onNavigate('M5S14C', { orderId });
                } else {
                  setStep('dispatched');
                }
              }}
            >
              <CheckmarkWhiteIcon />
              <Text style={styles.primaryBtnText}>Confirm Dispatch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 1: Dispatch Details (Matching Reference Design) ─────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={ORDERS_THEME.primary} />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dispatch</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle on Canvas: Centered underneath header */}
          <View style={styles.topSubtitleContainer}>
            <Text style={styles.topSubtitleText}>{orderId} · Ready for Dispatch</Text>
          </View>

          {/* Section 1: Order Summary */}
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Divya R.</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Items</Text>
                <Text style={styles.fieldValue}>4</Text>
              </View>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Delivery Address</Text>
              <Text style={styles.fieldValue}>Ooty Road, Coonoor</Text>
            </View>

            <View style={[styles.singleRow, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Delivery Slot</Text>
              <Text style={styles.fieldValue}>AFTERNOON_12_4</Text>
            </View>
          </View>

          {/* Section 2: Delivery Partner */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Delivery Partner</Text>
          <View style={styles.card}>
            <Text style={styles.assignmentLabel}>Assignment</Text>
            <TouchableOpacity
              style={styles.pickerBox}
              activeOpacity={0.75}
              onPress={() => setIsDropdownOpen(prev => !prev)}
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
                        index === DELIVERY_PARTNERS.length - 1 && { borderBottomWidth: 0 },
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedPartner(partner);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {partner}
                      </Text>
                      {isSelected && (
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 6L9 17l-5-5"
                            stroke={ORDERS_THEME.primary}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button: Navigate to Confirm Dispatch */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (onNavigate) {
                onNavigate('M5S14B', { orderId });
              } else {
                setStep('confirm');
              }
            }}
          >
            <DeliveryTruckWhiteIcon />
            <Text style={styles.primaryBtnText}>Confirm Dispatch</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topSubtitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  topSubtitleText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#8C7355',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    marginTop: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  singleRow: {},
  fieldLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 3,
  },
  fieldValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
  },
  assignmentLabel: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    marginBottom: 8,
  },
  pickerBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '600',
    color: ORDERS_THEME.textInk,
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: ORDERS_THEME.orangeTint,
  },
  dropdownItemText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
  },
  dropdownItemTextSelected: {
    fontWeight: '700',
    color: ORDERS_THEME.primary,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  dropdownValueText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  confirmPromptBox: {
    backgroundColor: ORDERS_THEME.warningBg,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  confirmPromptText: {
    fontFamily: 'Poppins',
    fontSize: 14.5,
    fontWeight: '700',
    color: ORDERS_THEME.warning,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  primaryBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contentPacked: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successCircleBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: ORDERS_THEME.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
});
