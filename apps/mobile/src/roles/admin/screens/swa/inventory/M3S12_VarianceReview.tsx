import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SWAHeader } from '../components/SWAHeader';

interface M3S12Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function DownArrowGreyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#7A726C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleBlueIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#1C5B96" strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke="#1C5B96" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ListEditLinesIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h12M3 12h12M3 18h8M17 14l4 4M21 14l-4 4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const M3S12_VarianceReview: React.FC<M3S12Props> = ({ onNavigate, onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader colors={['#F0562A', '#F0562A']}
          title="Variance Review"
          onBack={onBack}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Information - 2x2 Grid */}
          <View style={styles.productCard}>
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

            <View style={[styles.twoColRow, { marginTop: 12 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Batch</Text>
                <Text style={styles.colValue}>BAT-2026-00124</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Storage Location</Text>
                <Text style={styles.colValue}>Cold Storage · A03</Text>
              </View>
            </View>
          </View>

          {/* Variance Flow Card */}
          <View style={styles.flowCard}>
            <Text style={styles.flowNumber}>100 KG</Text>
            <Text style={styles.flowLabel}>SYSTEM</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowNumber}>95 KG</Text>
            <Text style={styles.flowLabel}>PHYSICAL</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowVarianceNumber}>-5 KG</Text>
            <Text style={styles.flowVarianceLabel}>VARIANCE</Text>
          </View>

          {/* Variance Warning Box */}
          <View style={styles.varianceWarningBox}>
            <WarningTriangleIcon />
            <Text style={styles.varianceWarningText}>
              Variance Detected — this quantity cannot be corrected by editing the balance directly.
            </Text>
          </View>

          {/* Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.blueNoticeText}>
              The physical count never overwrites system quantity. Continuing creates a Stock Adjustment Request, which goes through review before any ledger movement is posted.
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Fixed Continue Button at Bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M3S13')}
          >
            <ListEditLinesIcon />
            <Text style={styles.continueBtnText}>Continue to Adjustment Request</Text>
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
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  flowNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  flowLabel: {
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#E24B4A',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  varianceWarningBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  varianceWarningText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9A3412',
    fontFamily: 'Poppins',
    lineHeight: 18,
  },
  blueNoticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  blueNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
    fontFamily: 'Poppins',
    lineHeight: 18,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
  },
  continueBtn: {
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
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
