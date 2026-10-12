// Design id: M3S12
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';

export type VarianceReviewScreenProps = InventoryScreenBaseProps;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownArrowGreyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#71717A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ListEditLinesIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h11M4 12h8M4 18h8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 15.5l4-4 2 2-4 4-2.5.5.5-2.5z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VarianceReviewScreen({ can, onNavigate, onBack, routeParams }: VarianceReviewScreenProps) {
  // rbac: inventory.stock_adjustment.create MAIN=all, SUB=own.
  const canCreateAdjustment = can('inventory.stock_adjustment.create');
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Top SafeArea for Header */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>Variance Review</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Information - 2x2 Grid */}
          <View style={styles.productCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Product</Text>
                <Text style={styles.colValue}>Tomato</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Grade</Text>
                <Text style={styles.colValue}>Grade 1</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 14 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Batch</Text>
                <Text style={styles.colValue}>BAT-2026-00124</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Storage Location</Text>
                <Text style={styles.colValue}>Cold Storage · A03</Text>
              </View>
            </View>
          </View>

          {/* Variance Flow Card */}
          <View style={styles.flowCard}>
            <Text style={styles.flowNumber}>100 KG</Text>
            <Text style={styles.flowLabel}>SYSTEM</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowNumber}>95 KG</Text>
            <Text style={styles.flowLabel}>PHYSICAL</Text>

            <View style={styles.arrowWrap}>
              <DownArrowGreyIcon />
            </View>

            <Text style={styles.flowVarianceNumber}>-5 KG</Text>
            <Text style={styles.flowVarianceLabel}>VARIANCE</Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Fixed Continue Button at Bottom (only with stock_adjustment.create) */}
        {canCreateAdjustment ? (
        <SafeAreaView style={styles.bottomSafeArea}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.continueBtn}
              activeOpacity={0.85}
              onPress={() => onNavigate?.('M3S13', routeParams ?? undefined)}
            >
              <ListEditLinesIcon />
              <Text style={styles.continueBtnText}>Continue to Adjustment Request</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  topSafeArea: {
    backgroundColor: '#F0562A',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#4E5D56',
    marginBottom: 3,
  },
  colValue: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  flowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  flowNumber: {
    fontFamily: 'Poppins',
    fontSize: 26,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 4,
  },
  flowLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '800',
    color: '#5C6B62',
    letterSpacing: 0.8,
  },
  arrowWrap: {
    marginVertical: 12,
  },
  flowVarianceNumber: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 4,
  },
  flowVarianceLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  bottomSafeArea: {
    backgroundColor: '#FAF7F2',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    paddingTop: 8,
    backgroundColor: '#FAF7F2',
  },
  continueBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  continueBtnText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
