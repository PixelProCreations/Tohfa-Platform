import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { ReturnResultScreen } from '../warehouse/returns-rma';
import type { PermissionCheck, WarehouseScope } from '../warehouse/finance-expenses';
import { MainWarehouseRejectReturnRequestScreen } from './MainWarehouseRejectReturnRequestScreen';
import { MainWarehouseRefundStatusScreen } from './MainWarehouseRefundStatusScreen';
import { MainWarehouseRequestRejectedScreen } from './MainWarehouseRequestRejectedScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  greenText: '#059669',
  redText: '#DC2626',
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

export interface MainWarehouseReviewReturnRequestScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
}

export function MainWarehouseReviewReturnRequestScreen({ scope, can, onBack }: MainWarehouseReviewReturnRequestScreenProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [requestRejected, setRequestRejected] = useState(false);
  const [showRefundStatus, setShowRefundStatus] = useState(false);

  if (showRefundStatus) {
    return <MainWarehouseRefundStatusScreen onBack={() => onBack()} />;
  }

  if (approved) {
    return (
      <ReturnResultScreen
        variant="RETURN_APPROVED"
        scope={scope}
        can={can}
        onBack={() => onBack()}
        onPrimary={() => setShowRefundStatus(true)}
      />
    );
  }

  if (requestRejected) {
    return <MainWarehouseRequestRejectedScreen onDone={() => onBack()} />;
  }

  if (rejecting) {
    return <MainWarehouseRejectReturnRequestScreen onBack={() => setRejecting(false)} onReject={() => { setRejecting(false); setRequestRejected(true); }} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Return Request</Text>
        </View>
        <Text style={styles.headerSubtitle}>RMA-2026-00125</Text>
      </View>

      <View style={styles.mainContainer}>
        {showConfirm ? (
          <View style={{ flex: 1 }} />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Inspection Summary</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Return Quantity</Text>
                  <Text style={styles.value}>1.8 KG</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Accepted</Text>
                  <Text style={styles.value}>1.5 KG</Text>
                </View>
              </View>
              <View style={[styles.row, {marginBottom: 0}]}>
                <View style={styles.col}>
                  <Text style={styles.label}>Damaged</Text>
                  <Text style={styles.value}>0.3 KG</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Condition</Text>
                  <Text style={styles.value}>Damaged</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Refund Summary</Text>
            <View style={styles.card}>
              <View style={[styles.row, {marginBottom: 0}]}>
                <View style={styles.col}>
                  <Text style={styles.label}>Refund Amount</Text>
                  <Text style={styles.value}>₹375</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Refund Method</Text>
                  <Text style={styles.value}>Wallet</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.footer}>
        {showConfirm ? (
          <View>
            <Text style={styles.confirmTitle}>Approve Return?</Text>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmBoxText}>Refund amount ₹375 · Method Wallet</Text>
            </View>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity style={styles.confirmApproveBtn} onPress={() => setApproved(true)} activeOpacity={0.8}>
                <Text style={styles.confirmApproveBtnText}>Approve Return</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setShowConfirm(false)} activeOpacity={0.8}>
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowConfirm(true)} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Approve Return</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejecting(true)} activeOpacity={0.8}>
              <Text style={styles.rejectBtnText}>Reject Request</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Poppins', fontSize: 11, color: '#FFFFFF', marginLeft: 32, fontWeight: '500' },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText, marginBottom: 8, marginTop: 8 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#555', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  rejectBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.redText,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  rejectBtnText: { fontFamily: 'Poppins', color: PALETTE.redText, fontSize: 15, fontWeight: '800' },
  confirmTitle: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.brownText, marginBottom: 12 },
  confirmBox: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmBoxText: { fontFamily: 'Poppins', fontSize: 12, color: PALETTE.textInk, fontWeight: '500' },
  confirmBtnRow: { flexDirection: 'row', gap: 12 },
  confirmApproveBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.greenText,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmApproveBtnText: { fontFamily: 'Poppins', color: PALETTE.greenText, fontSize: 14, fontWeight: '800' },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmCancelBtnText: { fontFamily: 'Poppins', color: '#555', fontSize: 14, fontWeight: '800' },
});
