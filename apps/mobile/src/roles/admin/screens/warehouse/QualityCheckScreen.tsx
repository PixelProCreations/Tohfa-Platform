import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FDF3F0', // Brand Orange Tint (NO yellow)
  noticeBorderOrange: '#F7CFC4',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  cardBg:             '#FFFFFF',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProduceIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2" />
      <Path d="M12 5V2M9 4c1.5 1 4.5 1 6 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FileTextIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface QualityCheckScreenProps {
  shipmentId?: string;
  productName?: string;
  receivedQty?: string;
  onBack?: () => void;
  onViewQualitySummary?: () => void;
  onContinueToGradeVerification?: () => void;
}

export function QualityCheckScreen({
  shipmentId = 'SHP-000124',
  productName = 'Tomato',
  receivedQty = '480 KG received',
  onBack,
  onViewQualitySummary,
  onContinueToGradeVerification,
}: QualityCheckScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Screenshot 1) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Quality Check</Text>
        </View>
        <Text style={styles.headerSubtitle}>{shipmentId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Product Card with Issue Badge ─── */}
        <View style={styles.productCard}>
          <View style={styles.iconCircle}>
            <ProduceIcon size={20} color={PALETTE.primary} />
          </View>
          <View style={styles.productContent}>
            <Text style={styles.productTitle}>{productName}</Text>
            <Text style={styles.productSubtitle}>{receivedQty}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Issue</Text>
          </View>
        </View>

        {/* ─── Notice Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Freshness and condition scales use configured backend values only — no invented numerical scoring system.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Bottom Actions (Screenshot 1) ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.solidActionBtn}
          onPress={onViewQualitySummary}
          activeOpacity={0.8}
        >
          <FileTextIcon size={18} color="#FFFFFF" />
          <Text style={styles.solidActionBtnText}>Quality Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onContinueToGradeVerification}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>Continue to Grade & Product Verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.noticeBgOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productContent: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  productSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 100,
    backgroundColor: PALETTE.noticeBgOrange,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    gap: 10,
  },
  solidActionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  solidActionBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  outlineActionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
});
