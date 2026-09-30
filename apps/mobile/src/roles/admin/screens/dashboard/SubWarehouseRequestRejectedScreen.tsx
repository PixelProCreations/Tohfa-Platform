import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function CloseCircleRedIcon({ size = 52, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellOutlineIcon({ size = 16, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseRequestRejectedScreenProps {
  rma: RmaRecord;
  onDone: () => void;
}

export function SubWarehouseRequestRejectedScreen({
  rma,
  onDone,
}: SubWarehouseRequestRejectedScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onDone}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Request Rejected</Text>
            <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
          </View>
        </View>
      </View>

      {/* ─── Center Body ─── */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CloseCircleRedIcon size={44} color="#DC2626" />
        </View>

        <Text style={styles.title}>Return Request Rejected</Text>
        <Text style={styles.subtitle}>{rma.rmaId}</Text>

        {/* Blue Notification Box */}
        <View style={styles.blueNotificationBox}>
          <BellOutlineIcon size={16} color="#1E40AF" />
          <Text style={styles.blueNotificationText}>
            Customer notification will follow the configured notification workflow — shown as sent only once the backend confirms it.
          </Text>
        </View>
      </View>

      {/* ─── Sticky Bottom Action ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={onDone}
          activeOpacity={0.88}
        >
          <CheckmarkIcon size={18} color="#FFFFFF" />
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  blueNotificationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    marginHorizontal: 4,
  },
  blueNotificationText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.blueText,
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
