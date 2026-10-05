import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { MainWarehouseEditStaffScreen } from './MainWarehouseEditStaffScreen';
import { MainWarehouseAttendanceScreen } from './MainWarehouseAttendanceScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  infoBg: '#FAEEE3',
  infoText: '#C47432',
  btnOrange: '#E88B38',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DriverIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 5h12v14H3V5zm12 3h4l3 3v8h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="19" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="19" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StaffIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AddUserIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 8v6M23 11h-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AssignedIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AttendanceIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


export function MainWarehouseStaffDetailScreen({ staffId, onBack }: { staffId: string, onBack: () => void }) {
  const [editMode, setEditMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isDriver = staffId === 'DRV-0018';

  if (showHistory) {
    return <MainWarehouseAttendanceScreen initialView="history" onBack={() => setShowHistory(false)} />;
  }

  if (editMode) {
    return (
      <MainWarehouseEditStaffScreen 
        onBack={() => setEditMode(false)} 
        onComplete={() => { setEditMode(false); onBack(); }}
      />
    );
  }
  
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Detail</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.profileCard}>
            <View style={styles.iconCircleLg}>
              {isDriver ? <DriverIcon /> : <StaffIcon />}
            </View>
            <Text style={styles.profileName}>{isDriver ? 'Arun Kumar' : 'Karthik'}</Text>
            <Text style={styles.profileSub}>{isDriver ? 'Driver ID: DRV-0018 · Active' : 'Staff ID: STF-0024 · Active'}</Text>
          </View>

          {isDriver && (
            <>
              <Text style={styles.sectionTitle}>Driver Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Driver Name</Text>
                    <Text style={styles.value}>Arun Kumar</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Driver ID</Text>
                    <Text style={styles.value}>DRV-0018</Text>
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={styles.value}>Active</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Contact</Text>
                    <Text style={styles.value}>XXXXXXXXXX</Text>
                  </View>
                </View>
                <View style={[styles.row, {marginBottom: 0}]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Vehicle Details</Text>
                    <Text style={styles.value}>TN 43 AB 1234</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  Vehicle, license and document fields are illustrative and must be confirmed against the final driver data model before becoming mandatory.
                </Text>
              </View>
            </>
          )}

          {isDriver && (
            <Text style={styles.sectionTitle}>Staff Information</Text>
          )}
          {isDriver && (
            <View style={styles.infoCard}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Staff ID</Text>
                  <Text style={styles.value}>STF-0024</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Role</Text>
                  <Text style={styles.value}>Warehouse Staff</Text>
                </View>
              </View>
              <View style={[styles.row, {marginBottom: 0}]}>
                <View style={styles.col}>
                  <Text style={styles.label}>Warehouse</Text>
                  <Text style={styles.value}>Coonoor</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={styles.value}>Active</Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <TouchableOpacity style={styles.infoCard} onPress={() => setShowHistory(true)} activeOpacity={0.8}>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Present</Text>
                <Text style={[styles.value, {color: '#15803D'}]}>22</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Absent</Text>
                <Text style={[styles.value, {color: '#DC2626'}]}>2</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Leave</Text>
                <Text style={[styles.value, {color: '#D97706'}]}>1</Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconBg}><AddUserIcon /></View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Profile Created</Text>
                <Text style={styles.timelineSub}>12 Aug 2026</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIconBg}><AssignedIcon /></View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Assigned to Coonoor</Text>
                <Text style={styles.timelineSub}>12 Aug 2026</Text>
              </View>
            </View>
            <View style={[styles.timelineItem, {marginBottom: 0}]}>
              <View style={styles.timelineIconBg}><AttendanceIcon /></View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Attendance Recorded</Text>
                <Text style={styles.timelineSub}>Today, 09:02 AM</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </View>

      {isDriver && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setEditMode(true)} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Edit Driver Profile</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  profileCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircleLg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: { fontFamily: 'Poppins', fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 4 },
  profileSub: { fontFamily: 'Poppins', fontSize: 12, color: '#666' },

  sectionTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 12 },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#666', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000' },

  infoBanner: {
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoBannerText: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.infoText, lineHeight: 16, fontWeight: '600' },

  timelineCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timelineIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineContent: { flex: 1 },
  timelineTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 2 },
  timelineSub: { fontFamily: 'Poppins', fontSize: 11, color: '#666' },

  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.btnOrange,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
