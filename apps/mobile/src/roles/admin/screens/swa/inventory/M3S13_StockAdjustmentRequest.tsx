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
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M6 14l6 6 6-6" stroke="#E52E2E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioSelectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#C86A2B" strokeWidth="2.2" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="4.5" fill="#C86A2B" />
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
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2.5h4"
        stroke="#736B66"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="11" cy="14" r="3.5" stroke="#736B66" strokeWidth="1.8" />
      <Path
        d="M18 4v5M15.5 6.5h5"
        stroke="#736B66"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SendPlaneWhiteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 4l19 8-19 8 5-8-5-8z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 12h14"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
        <SWAHeader colors={['#F0562A', '#F0562A']}
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
                  <Text style={styles.reasonText}>
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

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Fixed Submit Button at Bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M3S17')}
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
    backgroundColor: '#F0562A',
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
    backgroundColor: '#FDE8E8',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  adjustmentBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E52E2E',
    fontFamily: 'Poppins',
    letterSpacing: 0.3,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
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
    width: 76,
    height: 76,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BAC7D5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#736B66',
    fontFamily: 'Poppins',
    marginTop: 5,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
  },
  submitBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#F0562A',
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
