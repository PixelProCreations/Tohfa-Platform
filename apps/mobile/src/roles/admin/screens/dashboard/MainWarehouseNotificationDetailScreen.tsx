import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  btnOrange: '#E88B38',
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

function SettingsIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BoxIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BagIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 10a4 4 0 01-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadBoxIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


export type NotificationType = 'goods' | 'wallet' | 'order' | 'stock';

export interface MainWarehouseNotificationDetailScreenProps {
  type: NotificationType;
  onBack: () => void;
}

export function MainWarehouseNotificationDetailScreen({ type, onBack }: MainWarehouseNotificationDetailScreenProps) {
  
  const getDetails = () => {
    switch (type) {
      case 'goods':
        return {
          title: 'Goods Received',
          desc: 'New goods receiving activity is available for Coonoor Warehouse.',
          refLabel: 'Reference',
          refValue: 'GR-00245',
          date: '25 Sep 2026',
          btnText: 'View Receiving',
          icon: <DownloadBoxIcon />,
        };
      case 'wallet':
        return {
          title: 'Wallet Credited',
          desc: 'A customer wallet transaction has been completed.',
          refLabel: 'Reference',
          refValue: 'TOP-002845',
          date: '25 Sep 2026',
          btnText: 'View Wallet Report',
          icon: <WalletIcon />,
        };
      case 'order':
        return {
          title: 'Order Confirmed',
          desc: 'Order #ORD-10284 has been confirmed.',
          refLabel: 'Reference',
          refValue: 'ORD-10284',
          date: '25 Sep 2026',
          btnText: 'View Order',
          icon: <BagIcon />,
        };
      case 'stock':
        return {
          title: 'Low Stock Alert',
          desc: 'Carrot Grade 1 has reached the configured threshold.',
          refLabel: 'Reference',
          refValue: 'Carrot Grade 1',
          date: '25 Sep 2026',
          btnText: 'View Stock',
          icon: <BoxIcon />,
        };
    }
  };

  const details = getDetails();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notification Detail</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
            <SettingsIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.topCard}>
            <View style={styles.iconContainer}>
              {details.icon}
            </View>
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.desc}>{details.desc}</Text>
          </View>

          <View style={styles.bottomCard}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{details.refLabel}</Text>
                <Text style={styles.value}>{details.refValue}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>{details.date}</Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>{details.btnText}</Text>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  settingsBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  topCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },

  bottomCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  row: { flexDirection: 'row' },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#666', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000' },

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
