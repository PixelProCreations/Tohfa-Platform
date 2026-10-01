import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  redBtn:        '#E13C3C',
  warningBg:     '#FEF3C7',
  warningBorder: '#FDE68A',
  warningText:   '#B45309',
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

function WarningTriangleIcon({ size = 16, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseCrossIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseRejectReturnRequestScreenProps {
  rma: RmaRecord;
  onBack: () => void;
  onRejectSuccess: (data: { rma: RmaRecord; reason: string }) => void;
}

export function SubWarehouseRejectReturnRequestScreen({
  rma,
  onBack,
  onRejectSuccess,
}: SubWarehouseRejectReturnRequestScreenProps) {
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);

  const handleReject = () => {
    if (!reason.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onRejectSuccess({ rma, reason: reason.trim() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Reject Return Request</Text>
            <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenHeading}>Reject Return Request</Text>

        <Text style={styles.label}>
          Rejection Reason <Text style={styles.asterisk}>*</Text>
        </Text>

        <View style={styles.textareaContainer}>
          <TextInput
            style={styles.textarea}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (showError && text.trim()) setShowError(false);
            }}
            placeholder="Enter the reason for rejecting this return request..."
            placeholderTextColor="#9E9690"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Warning Error Banner (Screenshot 2) */}
        {showError && (
          <View style={styles.warningBanner}>
            <WarningTriangleIcon size={16} color={PALETTE.warningText} />
            <Text style={styles.warningText}>Rejection reason is required.</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={handleReject}
          activeOpacity={0.88}
        >
          <CloseCrossIcon size={16} color="#FFFFFF" />
          <Text style={styles.rejectBtnText}>Reject Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  screenHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  asterisk: {
    color: '#E13C3C',
  },
  textareaContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    minHeight: 120,
  },
  textarea: {
    fontSize: 13,
    color: PALETTE.textInk,
    minHeight: 100,
    lineHeight: 18,
    padding: 0,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.warningBg,
    borderWidth: 1,
    borderColor: PALETTE.warningBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    gap: 10,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.warningText,
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.redBtn,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 14,
    paddingVertical: 13,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8D4321',
  },
});
