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
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primaryHeader: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseAttendanceDetailScreenProps {
  staffId: string;
  onBack: () => void;
}

export function SubWarehouseAttendanceDetailScreen({
  staffId,
  onBack,
}: SubWarehouseAttendanceDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primaryHeader} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance Detail</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Staff Name</Text>
              <Text style={styles.value}>Ramesh Kumar</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Role</Text>
              <Text style={styles.value}>Warehouse Staff</Text>
            </View>
          </View>
          
          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>24 Sep 2026</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.value}>Present</Text>
            </View>
          </View>

          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.value}>08:42 AM</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Check-out</Text>
              <Text style={styles.value}>05:30 PM</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.primaryHeader,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontSize: 11, color: PALETTE.textSecondary, marginBottom: 2, fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
});
