import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  imagePlaceBg: '#FDF7EB',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ImageIcon({ color = '#B45309' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// simple circle to fix missing circle in ImageIcon
import { Circle } from 'react-native-svg';

export interface SubWarehouseOperationalIssueDetailScreenProps {
  onBack: () => void;
}

export function SubWarehouseOperationalIssueDetailScreen({
  onBack,
}: SubWarehouseOperationalIssueDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Detail</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>Issue Information</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Issue ID</Text>
              <Text style={styles.value}>ISS-0028</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Issue Type</Text>
              <Text style={styles.value}>Maintenance Required</Text>
            </View>
          </View>
          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>Open</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Reported Date</Text>
              <Text style={styles.value}>24 Sep 2026</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Warehouse</Text>
              <Text style={styles.value}>Coonoor</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>Cold Storage · Section A</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <View style={styles.card}>
          <Text style={styles.descText}>
            Cooling unit in Section A running above target temperature — needs technician inspection before more stock is stored there.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Evidence</Text>
        <View style={styles.evidenceRow}>
          <View style={styles.evidenceBox}>
            <ImageIcon />
          </View>
          <View style={styles.evidenceBox}>
            <ImageIcon />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Reporter</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Reported By</Text>
              <Text style={styles.value}>Suresh · SWA</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Date / Time</Text>
              <Text style={styles.value}>24 Sep · 11:20 AM</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resolution</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Resolved By</Text>
              <Text style={styles.value}>—</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Resolved At</Text>
              <Text style={styles.value}>—</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Back to Issues</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 100 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.textInk, marginBottom: 12, marginTop: 4 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 20,
  },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 4, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '800', color: PALETTE.textInk },

  descText: { fontSize: 13, color: PALETTE.textSecondary, lineHeight: 20 },

  evidenceRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  evidenceBox: {
    width: 64,
    height: 64,
    backgroundColor: PALETTE.imagePlaceBg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    padding: 16,
    paddingBottom: 24,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
