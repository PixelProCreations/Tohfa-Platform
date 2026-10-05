import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  redText: '#DC2626',
  redBg: '#DE5753', // from the image button
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

export function MainWarehouseRejectReturnRequestScreen({ onBack, onReject }: { onBack: () => void, onReject: () => void }) {
  const [reason, setReason] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleReject = () => {
    if (!reason.trim()) {
      setHasError(true);
      return;
    }
    onReject();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reject Return Request</Text>
        </View>
        <Text style={styles.headerSubtitle}>RMA-2026-00125</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Reason for Rejection</Text>
          <TextInput
            style={[styles.textArea, hasError && styles.textAreaError]}
            multiline
            numberOfLines={4}
            placeholder="Enter reason..."
            placeholderTextColor="#999"
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (text.trim()) setHasError(false);
            }}
          />
          {hasError && (
            <Text style={styles.errorText}>Please enter a rejection reason.</Text>
          )}

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
          <Text style={styles.rejectBtnText}>Reject Request</Text>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontFamily: 'Poppins', fontSize: 11, color: '#FFFFFF', marginLeft: 32, fontWeight: '500' },
  mainContainer: { flex: 1, backgroundColor: PALETTE.pageBg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 8, marginTop: 8 },
  textArea: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textInk,
    height: 100,
    textAlignVertical: 'top',
  },
  textAreaError: {
    borderColor: PALETTE.redText,
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.redText,
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  rejectBtn: {
    backgroundColor: PALETTE.redBg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 12,
  },
  rejectBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
