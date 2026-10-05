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

import { MainWarehouseEditProfileScreen } from './MainWarehouseEditProfileScreen';
import { MainWarehouseChangePasswordScreen } from './MainWarehouseChangePasswordScreen';
import { MainWarehouseSignedOutScreen } from './MainWarehouseSignedOutScreen';
import { MainWarehouseSignOutConfirmScreen } from './MainWarehouseSignOutConfirmScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  greenBg: '#E8F5E9',
  greenText: '#2E7D32',
  grayBg: '#F5F5F5',
  grayText: '#666666',
  tabInactive: '#786F66',
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

function PersonIcon({ size = 32, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function EditPencilIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BlockIcon({ size = 18, color = '#888' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function LockIcon({ size = 20, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SignOutIcon({ size = 20, color = '#DC2626' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 20, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Tab Bar Icons
function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}


export function MainWarehouseProfileScreen({ onBack }: { onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  if (signedOut) {
    return <MainWarehouseSignedOutScreen />;
  }

  if (showSignOutConfirm) {
    return <MainWarehouseSignOutConfirmScreen onBack={() => setShowSignOutConfirm(false)} />;
  }

  if (changingPassword) {
    return <MainWarehouseChangePasswordScreen onBack={() => setChangingPassword(false)} />;
  }

  if (editing) {
    return <MainWarehouseEditProfileScreen onBack={() => setEditing(false)} />;
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
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <BellIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <PersonIcon />
            </View>
            <Text style={styles.profileName}>Rajesh Kumar</Text>
            <Text style={styles.profileRole}>Main Warehouse Admin</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tagGreen}>
                <Text style={styles.tagGreenText}>Active</Text>
              </View>
              <View style={styles.tagGray}>
                <Text style={styles.tagGrayText}>All 4 Warehouses</Text>
              </View>
            </View>
            <Text style={styles.loginInfo}>Admin ID: ADM-MWA-0007 · Last login: Today, 8:52 AM</Text>
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>Rajesh Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Mobile Number</Text>
                <Text style={styles.value}>+91 XXXXX XXXXX</Text>
              </View>
            </View>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>rajesh.kumar@tohfa.org</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Admin ID</Text>
                <Text style={styles.value}>ADM-MWA-0007</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} activeOpacity={0.8}>
            <EditPencilIcon />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Account & Access</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Access Level</Text>
                <Text style={styles.value}>Warehouse Management</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Warehouse Scope</Text>
                <Text style={styles.value}>All 4 Warehouses</Text>
              </View>
            </View>
            <View style={[styles.row, {marginBottom: 0}]}>
              <View style={styles.col}>
                <Text style={styles.label}>Created Date</Text>
                <Text style={styles.value}>02 Jan 2026</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Last Login</Text>
                <Text style={styles.value}>Today, 8:52 AM</Text>
              </View>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <BlockIcon />
            <Text style={styles.noticeText}>No Change Role, Change Warehouse, Change Permissions, or Promote Admin here.</Text>
          </View>

          <Text style={styles.sectionTitle}>Security</Text>
          <View style={[styles.card, {paddingVertical: 12}]}>
            <Text style={styles.label}>Password</Text>
            <Text style={[styles.value, {marginTop: 4}]}>Last changed 14 Aug 2026</Text>
          </View>
          
              <TouchableOpacity style={styles.actionCard} onPress={() => setChangingPassword(true)} activeOpacity={0.8}>
                <View style={styles.actionLeft}>
                  <LockIcon />
                  <Text style={styles.actionText}>Change Password</Text>
                </View>
                <ChevronRightIcon />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionCard} onPress={() => setShowSignOutConfirm(true)} activeOpacity={0.8}>
                <View style={styles.actionLeft}>
                  <SignOutIcon />
                  <Text style={[styles.actionText, {color: '#DC2626'}]}>Sign Out</Text>
                </View>
              </TouchableOpacity>

        </ScrollView>
      </View>

      <View style={styles.tabBar}>
        <View style={styles.tabItem}>
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </View>
        <View style={styles.tabItem}>
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </View>
        <View style={styles.tabItem}>
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </View>
        <View style={styles.tabItem}>
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </View>
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
  profileCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: { fontFamily: 'Poppins', fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 4 },
  profileRole: { fontFamily: 'Poppins', fontSize: 12, color: PALETTE.textSecondary, fontWeight: '500', marginBottom: 12 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tagGreen: { backgroundColor: PALETTE.greenBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagGreenText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.greenText },
  tagGray: { backgroundColor: PALETTE.grayBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagGrayText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.grayText },
  loginInfo: { fontFamily: 'Poppins', fontSize: 10, color: '#888', fontWeight: '500' },
  
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 8 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  label: { fontFamily: 'Poppins', fontSize: 10, color: '#666', marginBottom: 2, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.textInk },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  editBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  editBtnText: { fontFamily: 'Poppins', color: PALETTE.brownText, fontSize: 13, fontWeight: '800' },
  
  noticeBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  noticeText: { fontFamily: 'Poppins', fontSize: 10, color: '#555', fontWeight: '500', flex: 1, lineHeight: 14 },

  actionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
    paddingBottom: 20,
    paddingTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: PALETTE.tabInactive,
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: PALETTE.primary,
  },
  signOutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0562A', // the orange border in Image 3
    padding: 16,
    marginTop: 8,
  },
  signOutTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#8A5A30',
    marginBottom: 8,
  },
  signOutText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#003366', // dark blue tint in screenshot?
    marginBottom: 16,
    lineHeight: 18,
    fontWeight: '500',
  },
  signOutBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutBtnText: {
    fontFamily: 'Poppins',
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
