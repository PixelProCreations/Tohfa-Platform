import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  imageBg:       '#FDF3EC',
  imageBorder:   '#F5E4D7',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  iconColor:     '#8D4321',
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

function LargePhotoIcon({ size = 80, color = '#8D4321' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8.5 13l-4 5h15l-5-6.5-3.5 4.5-2.5-3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export interface SubWarehouseImageViewerScreenProps {
  rma?: Partial<RmaRecord> | undefined;
  photoIndex?: number | undefined;
  onBack: () => void;
}

export function SubWarehouseImageViewerScreen({
  rma,
  photoIndex = 1,
  onBack,
}: SubWarehouseImageViewerScreenProps) {
  const rmaId = rma?.rmaId || 'RMA-2026-00125';
  const status = rma?.status || 'Under Review';
  const photoTitle = `Customer Photo ${photoIndex}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header (#F0562A) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Image Viewer</Text>
            <Text style={styles.headerSubtitle}>
              {rmaId} · {status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Main Preview Content ─── */}
      <View style={styles.content}>
        {/* Large Rounded Image Preview Card */}
        <View style={styles.imageCard}>
          <LargePhotoIcon size={84} color={PALETTE.iconColor} />
        </View>

        {/* Subtitle Caption */}
        <Text style={styles.photoCaption}>{photoTitle}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleWrap: {
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
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 20,
  },
  imageCard: {
    width: '88%',
    aspectRatio: 1,
    maxWidth: 340,
    backgroundColor: PALETTE.imageBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: PALETTE.imageBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  photoCaption: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginTop: 18,
    letterSpacing: 0.2,
  },
});
