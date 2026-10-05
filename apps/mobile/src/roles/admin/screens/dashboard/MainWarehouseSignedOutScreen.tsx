import React from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  leafTeal: '#476566',
};

function BellIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.5 3.5c0 0-1 9-8 15 -2.5 2-6 3.5-10 3.5 0 0 1-9 8-15 2.5-2 6-3.5 10-3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.5 22c4.5-3.5 9-8 11.5-12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MainWarehouseSignedOutScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View style={{marginRight: 8}}>
              <LeafIcon size={18} />
            </View>
            <Text style={styles.headerTitle}>Signed Out</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <BellIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <View style={styles.content}>
          <View style={styles.leafCircle}>
            <LeafIcon size={32} color={PALETTE.leafTeal} />
          </View>
          <Text style={styles.title}>TOHFA Admin Login</Text>
          <Text style={styles.subtitle}>You've been signed out. This is where Module 1 — Authentication takes over.</Text>
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
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  bellBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    paddingTop: 80,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  leafCircle: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
