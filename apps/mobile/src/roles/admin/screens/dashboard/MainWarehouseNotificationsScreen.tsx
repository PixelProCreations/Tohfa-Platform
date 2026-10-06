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
import { MainWarehouseNotificationDetailScreen, NotificationType } from './MainWarehouseNotificationDetailScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  tabInactive: '#786F66',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SettingsIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DoubleCheckIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L7 17l-5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 10l-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BoxIcon({ size = 20, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ size = 20, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BagIcon({ size = 20, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 10a4 4 0 01-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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


export function MainWarehouseNotificationsScreen({ onBack }: { onBack?: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [allRead, setAllRead] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | null>(null);

  const handleMarkAll = () => {
    setAllRead(true);
    setShowConfirm(false);
  };

  if (selectedType) {
    return <MainWarehouseNotificationDetailScreen type={selectedType} onBack={() => setSelectedType(null)} />;
  }

  if (showConfirm) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <ArrowBackIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
              <SettingsIcon />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeader}>
              <DoubleCheckIcon />
              <Text style={styles.confirmTitle}>Mark All Notifications as Read?</Text>
            </View>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>8 unread notifications will be marked as read.</Text>
            </View>
            <TouchableOpacity style={styles.confirmApproveBtn} onPress={handleMarkAll}>
              <Text style={styles.confirmApproveBtnText}>Mark All as Read</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowConfirm(false)}>
              <Text style={styles.confirmCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={styles.bellWrapper}>
              <BellIcon />
            </View>
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
            <SettingsIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.warehouseDropdown} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
          <WarehouseIcon />
          <Text style={styles.warehouseText}>All Warehouses</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {!allRead && (
            <View style={styles.bannerRow}>
              <Text style={styles.bannerText}>You have 8 unread notifications</Text>
              <TouchableOpacity onPress={() => setShowConfirm(true)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.markAllText}>Mark all →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List of Notifications */}
          <TouchableOpacity style={[styles.notifCard, !allRead ? styles.notifUnread : {}]} onPress={() => setSelectedType('goods')} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <BoxIcon />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>Goods Received</Text>
              <Text style={styles.notifDesc}>New goods receiving activity is available.</Text>
              <Text style={styles.notifTime}>Today · 10:20 AM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.notifCard, !allRead ? styles.notifUnread : {}]} onPress={() => setSelectedType('wallet')} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <WalletIcon />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>Wallet Credited</Text>
              <Text style={styles.notifDesc}>A customer wallet transaction has been completed.</Text>
              <Text style={styles.notifTime}>Today · 09:45 AM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notifCard} onPress={() => setSelectedType('order')} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <BagIcon />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>Order Confirmed</Text>
              <Text style={styles.notifDesc}>Order #ORD-10284 has been confirmed.</Text>
              <Text style={styles.notifTime}>Today · 09:20 AM · Read</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.notifCard, !allRead ? styles.notifUnread : {}]} onPress={() => setSelectedType('stock')} activeOpacity={0.8}>
            <View style={styles.iconCircle}>
              <BoxIcon />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>Low Stock Alert</Text>
              <Text style={styles.notifDesc}>Carrot Grade 1 has reached the configured threshold.</Text>
              <Text style={styles.notifTime}>Today · 08:50 AM</Text>
            </View>
          </TouchableOpacity>
          
        </ScrollView>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={onBack}>
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { marginRight: 12 },
  bellWrapper: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  warehouseDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  warehouseText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAEEE3',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  bannerText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText },
  markAllText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#1E1612' },
  
  notifCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  notifUnread: {
    borderColor: '#F0562A',
    borderLeftWidth: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 4 },
  notifDesc: { fontFamily: 'Poppins', fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 8 },
  notifTime: { fontFamily: 'Poppins', fontSize: 10, color: '#999', fontWeight: '500' },

  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0562A',
    padding: 16,
    margin: 16,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  confirmTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.brownText },
  confirmBox: {
    backgroundColor: '#F4F0EB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmText: { fontFamily: 'Poppins', fontSize: 12, color: '#333' },
  confirmApproveBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.brownText,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmApproveBtnText: { fontFamily: 'Poppins', color: PALETTE.brownText, fontSize: 14, fontWeight: '800' },
  confirmCancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBE5DC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmCancelBtnText: { fontFamily: 'Poppins', color: '#333', fontSize: 14, fontWeight: '800' },

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
});
