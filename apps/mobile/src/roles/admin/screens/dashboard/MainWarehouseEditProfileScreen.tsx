import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { MainWarehouseProfileUpdatedScreen } from './MainWarehouseProfileUpdatedScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  greenText: '#059669',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseEditProfileScreen({ onBack }: { onBack: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [updated, setUpdated] = useState(false);

  if (updated) {
    return <MainWarehouseProfileUpdatedScreen onDone={onBack} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <BellIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {showConfirm ? (
          <View style={styles.confirmBoxContainer}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Save Changes?</Text>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => setUpdated(true)} activeOpacity={0.8}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value="Rajesh Kumar"
            />
            
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value="rajesh.kumar@tohfa.org"
            />

            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>Admin ID, Role, and Warehouse Scope are read-only here.</Text>
            </View>

          </ScrollView>
        )}
      </View>

      {!showConfirm && (
        <View style={styles.footer}>
          <View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowConfirm(true)} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  bellBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 16 },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#444', marginBottom: 6, fontWeight: '800' },
  input: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textInk,
    marginBottom: 16,
    fontWeight: '500',
  },
  noticeBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  noticeText: { fontFamily: 'Poppins', fontSize: 11, color: '#555', fontWeight: '500' },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
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
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: 'Poppins', color: '#555', fontSize: 14, fontWeight: '800' },
  
  confirmBoxContainer: {
    padding: 16,
  },
  confirmBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0562A',
    borderRadius: 12,
    padding: 16,
  },
  confirmTitle: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: PALETTE.brownText, marginBottom: 12 },
  confirmBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.greenText,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBtnText: { fontFamily: 'Poppins', color: PALETTE.greenText, fontSize: 13, fontWeight: '800' },
});
