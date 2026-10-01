import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWAHeader } from '../components/SWAHeader';

interface M3S13Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function DownArrowRedIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioSelectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#E85226" strokeWidth="2" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="5" fill="#E85226" />
    </Svg>
  );
}

function RadioUnselectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#CBD5E1" strokeWidth="1.8" fill="#FFFFFF" />
    </Svg>
  );
}

function CameraAddIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#7A726C" strokeWidth="1.8" />
      <Circle cx="12" cy="13" r="4" stroke="#7A726C" strokeWidth="1.8" />
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

function SendPlaneWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const REASONS = [
  'Physical Counting Error',
  'Damage',
  'Spoilage',
  'Missing Stock',
  'Other (configured reason)',
];

export const M3S13_StockAdjustmentRequest: React.FC<M3S13Props> = ({ onNavigate, onBack }) => {
  const [selectedReason, setSelectedReason] = useState('Physical Counting Error');
  const [notes, setNotes] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Stock Adjustment Request"
          onBack={onBack}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top 3 Quantity Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>100 KG</Text>
              <Text style={styles.summaryLabel}>SYSTEM</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>95 KG</Text>
              <Text style={styles.summaryLabel}>PHYSICAL</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValueRed}>-5 KG</Text>
              <Text style={styles.summaryLabelRed}>VARIANCE</Text>
            </View>
          </View>

          {/* Adjustment Requested */}
          <Text style={styles.sectionHeader}>Adjustment Requested</Text>
          <View style={styles.adjustmentBadge}>
            <DownArrowRedIcon />
            <Text style={styles.adjustmentBadgeText}>ADJUSTMENT_DOWN · -5 KG</Text>
          </View>

          {/* Reason Section */}
          <View style={styles.reasonHeaderRow}>
            <Text style={styles.sectionHeader}>Reason</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>

          <View style={styles.reasonsCard}>
            {REASONS.map((reason, idx) => {
              const isSelected = selectedReason === reason;
              const isLast = idx === REASONS.length - 1;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, !isLast && styles.reasonBorderBottom]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                >
                  {isSelected ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                  <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notes Section */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.notesBox}>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder="Add additional notes about this adjustment..."
              placeholderTextColor="#9A928C"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Evidence Section */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <TouchableOpacity style={styles.evidenceBox} activeOpacity={0.7}>
            <CameraAddIcon />
            <Text style={styles.evidenceText}>Add Photo</Text>
          </TouchableOpacity>

          {/* SWA Notice Box */}
          <View style={styles.noticeBox}>
            <ProhibitedRedIcon />
            <Text style={styles.noticeText}>
              SWA can create and submit this adjustment but cannot approve it — approval happens through a separate, authorized backend process.
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Fixed Submit Button at Bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M3S14')}
          >
            <SendPlaneWhiteIcon />
            <Text style={styles.submitBtnText}>Submit Adjustment Request</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  summaryValueRed: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E24B4A',
    fontFamily: 'Poppins',
  },
  summaryLabelRed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E24B4A',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 8,
    marginTop: 6,
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
    marginBottom: 14,
  },
  adjustmentBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: 'Poppins',
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  reasonsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    overflow: 'hidden',
    marginBottom: 14,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  reasonBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1EA',
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  reasonTextSelected: {
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    height: 84,
    padding: 12,
    marginBottom: 14,
  },
  notesInput: {
    flex: 1,
    fontSize: 13,
    color: '#1D2420',
    fontFamily: 'Poppins',
    textAlignVertical: 'top',
    padding: 0,
  },
  evidenceBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  evidenceText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 3,
  },
  noticeBox: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#BE123C',
    fontFamily: 'Poppins',
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
  },
  submitBtn: {
    backgroundColor: '#E85226',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#E85226',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
