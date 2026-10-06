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
import Svg, { Path, Circle } from 'react-native-svg';

export type AttentionCategory = 'all' | 'failed' | 'pending';

export interface MainWarehouseWalletAttentionScreenProps {
  onBack?: () => void;
  initialCategory?: AttentionCategory;
  onNavigateToCashTopUp?: () => void;
}

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF5EE',
  cardBg: '#FFFFFF',
  textInk: '#000000',
  border: '#EAE5DF',
  iconBg: '#FAEDDF',
  iconColor: '#A05A2C',
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ExclamationCircleIcon({ size = 18, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ScalesIcon({ size = 18, color = PALETTE.iconColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M6 7l6-3 6 3M6 7l-3 7h6l-3-7zM18 7l-3 7h6l-3-7zM4 21h16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseWalletAttentionScreen({
  onBack,
  onNavigateToCashTopUp,
}: MainWarehouseWalletAttentionScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Needs Attention</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Failed Top-Up Row */}
          <TouchableOpacity 
            style={styles.row}
            activeOpacity={0.7}
            onPress={onNavigateToCashTopUp}
          >
            <View style={styles.iconBox}>
              <ExclamationCircleIcon size={18} color={PALETTE.iconColor} />
            </View>
            <Text style={styles.rowText}>1 failed top-up</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          {/* Daily Cash Reconciliation Row */}
          <TouchableOpacity 
            style={styles.row}
            activeOpacity={0.7}
          >
            <View style={styles.iconBox}>
              <ScalesIcon size={18} color={PALETTE.iconColor} />
            </View>
            <Text style={styles.rowText}>Daily cash reconciliation pending</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: PALETTE.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginHorizontal: 16,
    marginVertical: 4,
  },
});
