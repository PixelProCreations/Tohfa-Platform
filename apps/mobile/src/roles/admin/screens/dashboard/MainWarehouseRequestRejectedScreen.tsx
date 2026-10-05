import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  redBg: '#FEE2E2',
  redIcon: '#DC2626',
  infoBg: '#FCECDD',
  infoText: '#8A5A30',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ErrorCrossIcon({ size = 32, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MainWarehouseRequestRejectedScreen({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onDone} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Rejected</Text>
        </View>
        <Text style={styles.headerSubtitle}>RMA-2026-00125</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.successHeader}>
            <View style={styles.iconCircle}>
              <ErrorCrossIcon />
            </View>
            <Text style={styles.successTitle}>Return Request Rejected</Text>
            <Text style={styles.successAmount}>RMA-2026-00125</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Customer notification will follow the configured notification workflow.</Text>
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onDone} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Poppins', fontSize: 11, color: '#FFFFFF', marginLeft: 32, fontWeight: '500' },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  successHeader: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  successAmount: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#FAEEE3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    color: PALETTE.infoText,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
