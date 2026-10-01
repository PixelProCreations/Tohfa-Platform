import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface M3S17Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownArrowGreyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#7A726C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownArrowRedIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhotoIcon({ color = '#E85226', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 6.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" stroke={color} strokeWidth="1.5" />
      <Path d="M21 15l-5-5-8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 14l2-2 5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LedgerHistoryIcon({ color = '#E85226', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProhibitedRedIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#E24B4A" strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke="#E24B4A" strokeWidth="2" />
    </Svg>
  );
}

function TimelineCheckDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#1E8E5A" strokeWidth="2.5" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="5" fill="#1E8E5A" />
    </Svg>
  );
}

function TimelinePendingDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#CBD5E1" strokeWidth="2" fill="#FFFFFF" />
    </Svg>
  );
}

export const M3S17_AdjustmentDetail: React.FC<M3S17Props> = ({ onNavigate, onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Custom Header matching Image 2 & 3 exact UI */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Stock Adjustment</Text>
              <Text style={styles.headerSubtitle}>ADJ-000128</Text>
            </View>
          </View>

          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending Approval</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Section 1: Adjustment Summary */}
          <Text style={styles.sectionHeader}>Adjustment Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Adjustment ID</Text>
                <Text style={styles.colValue}>ADJ-000128</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Warehouse</Text>
                <Text style={styles.colValue}>Coonoor</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Created</Text>
                <Text style={styles.colValue}>16 Sep 2026, 2:30 PM</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Created By</Text>
                <Text style={styles.colValue}>Suresh · SWA</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Product */}
          <Text style={styles.sectionHeader}>Product</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Product</Text>
                <Text style={styles.colValue}>Tomato</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Grade</Text>
                <Text style={styles.colValue}>Grade 1</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Batch</Text>
                <Text style={styles.colValue}>BAT-COO-00241</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Storage Location</Text>
                <Text style={styles.colValue}>Cold Storage → A → Rack 02</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Quantity Comparison */}
          <Text style={styles.sectionHeader}>Quantity Comparison</Text>
          <View style={styles.flowCard}>
            <Text style={styles.flowNumber}>140 KG</Text>
            <Text style={styles.flowLabel}>SYSTEM</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowNumber}>135 KG</Text>
            <Text style={styles.flowLabel}>PHYSICAL</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowVarianceNumber}>-5 KG</Text>
            <Text style={styles.flowVarianceLabel}>VARIANCE</Text>
          </View>

          {/* Section 4: Adjustment Requested */}
          <Text style={styles.sectionHeader}>Adjustment Requested</Text>
          <View style={styles.adjustmentBadge}>
            <DownArrowRedIcon />
            <Text style={styles.adjustmentBadgeText}>ADJUSTMENT_DOWN · -5 KG</Text>
          </View>

          {/* Section 5: Reason */}
          <Text style={styles.sectionHeader}>Reason</Text>
          <View style={styles.card}>
            <Text style={styles.colLabel}>Adjustment Reason</Text>
            <Text style={[styles.colValue, { marginTop: 2 }]}>Quantity Mismatch</Text>
          </View>

          {/* Section 6: Evidence */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <View style={styles.evidenceThumbnailsRow}>
            <View style={styles.thumbnailBox}>
              <PhotoIcon color="#E85226" size={20} />
            </View>
            <View style={styles.thumbnailBox}>
              <PhotoIcon color="#E85226" size={20} />
            </View>
          </View>

          {/* Section 7: Notes */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>
              Physical count found 135 KG against system quantity of 140 KG.
            </Text>
          </View>

          {/* Section 8: Approval Status */}
          <Text style={styles.sectionHeader}>Approval Status</Text>
          <View style={styles.timelineCard}>
            {/* Step 1 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineGreenLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Adjustment Created</Text>
                <Text style={styles.timelineTime}>2:30 PM</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineGrayLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Submitted for Approval</Text>
                <Text style={styles.timelineTime}>2:31 PM</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelinePendingDot />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={[styles.timelineTitle, { color: '#7A726C' }]}>Awaiting Approval</Text>
                <Text style={[styles.timelineTime, { color: '#A19A94' }]}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Section 9: Approval Information */}
          <Text style={styles.sectionHeader}>Approval Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>Pending</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Approved By</Text>
                <Text style={styles.colValue}>—</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Approved At</Text>
                <Text style={styles.colValue}>—</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Comments</Text>
                <Text style={styles.colValue}>—</Text>
              </View>
            </View>
          </View>

          {/* Section 10: Actions (with Orange Theme) */}
          <Text style={styles.sectionHeader}>Actions</Text>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <PhotoIcon color="#E85226" size={18} />
            <Text style={styles.actionBtnText}>View Evidence</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => onNavigate('M3S06')}
          >
            <LedgerHistoryIcon color="#E85226" size={18} />
            <Text style={styles.actionBtnText}>View Ledger History</Text>
          </TouchableOpacity>

          {/* Section 11: Disclaimer Notice Box */}
          <View style={styles.disclaimerBox}>
            <ProhibitedRedIcon />
            <Text style={styles.disclaimerText}>
              No approval action is shown here — SWA has adjustment/submit permission but not approval permission. Once approved, the resulting ADJUSTMENT_DOWN movement becomes visible through the Stock Ledger, not through an action on this screen.
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#E85226',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginTop: 1,
  },
  pendingBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: 'Poppins',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: '#7A726C',
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 2,
  },
  colValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  flowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  flowNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  flowLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  arrowWrap: {
    marginVertical: 10,
  },
  flowVarianceNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E24B4A',
    fontFamily: 'Poppins',
  },
  flowVarianceLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#E24B4A',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  adjustmentBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  adjustmentBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: 'Poppins',
  },
  evidenceThumbnailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.2,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesText: {
    fontSize: 13,
    color: '#1D2420',
    fontFamily: 'Poppins',
    lineHeight: 19,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineGreenLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E8E5A',
    marginVertical: 3,
  },
  timelineGrayLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 3,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  timelineTime: {
    fontSize: 11,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E85226',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    shadowColor: '#E85226',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E85226',
    fontFamily: 'Poppins',
  },
  disclaimerBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#BE123C',
    lineHeight: 17,
    fontFamily: 'Poppins',
  },
});
