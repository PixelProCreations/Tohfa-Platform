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
import Svg, { Path, Circle } from 'react-native-svg';

import { ReturnResultScreen } from '../warehouse/returns-rma';
import type { PermissionCheck, WarehouseScope } from '../warehouse/finance-expenses';

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

function RadioUnselected({ color = '#CCC', size = 20 }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" /></Svg>;
}

function RadioSelected({ color = '#8A5A30', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="4" fill={color} />
    </Svg>
  );
}

export interface MainWarehouseInspectProductScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onSaved: () => void;
}

export function MainWarehouseInspectProductScreen({ scope, can, onBack, onSaved }: MainWarehouseInspectProductScreenProps) {
  const [condition, setCondition] = useState<'Good' | 'Damaged' | 'Spoiled'>('Damaged');
  const [saved, setSaved] = useState(false);

  if (saved) {
    // Back leaves the saved inspection for the RMA detail; the CTA continues to review.
    return <ReturnResultScreen variant="INSPECTION_SAVED" scope={scope} can={can} onBack={onBack} onPrimary={onSaved} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inspect Returned Product</Text>
        </View>
        <Text style={styles.headerSubtitle}>RMA-2026-00125</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Received Quantity</Text>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} value="1.8" />
            <Text style={styles.inputLabel}>KG</Text>
          </View>

          <Text style={styles.sectionTitle}>Product Condition</Text>
          <TouchableOpacity style={[styles.radioOption, condition === 'Good' && styles.radioOptionSelected]} onPress={() => setCondition('Good')} activeOpacity={0.8}>
            {condition === 'Good' ? <RadioSelected /> : <RadioUnselected />}
            <Text style={[styles.radioText, condition === 'Good' && styles.radioTextSelected]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.radioOption, condition === 'Damaged' && styles.radioOptionSelected]} onPress={() => setCondition('Damaged')} activeOpacity={0.8}>
            {condition === 'Damaged' ? <RadioSelected /> : <RadioUnselected />}
            <Text style={[styles.radioText, condition === 'Damaged' && styles.radioTextSelected]}>Damaged</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.radioOption, condition === 'Spoiled' && styles.radioOptionSelected]} onPress={() => setCondition('Spoiled')} activeOpacity={0.8}>
            {condition === 'Spoiled' ? <RadioSelected /> : <RadioUnselected />}
            <Text style={[styles.radioText, condition === 'Spoiled' && styles.radioTextSelected]}>Spoiled</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Inspection Notes</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value="Outer packaging damaged. Product quality affected."
          />

          <Text style={styles.sectionTitle}>Quantity Result</Text>
          <View style={styles.resultCardsRow}>
            <View style={styles.resultCard}>
              <Text style={styles.resultValue}>1.8 KG</Text>
              <Text style={styles.resultLabel}>RETURNED</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={[styles.resultValue, {color: PALETTE.greenText}]}>1.5 KG</Text>
              <Text style={styles.resultLabel}>ACCEPTED</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={[styles.resultValue, {color: PALETTE.redText}]}>0.3 KG</Text>
              <Text style={styles.resultLabel}>DAMAGED</Text>
            </View>
          </View>

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setSaved(true)} activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Save Inspection</Text>
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
  sectionTitle: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.textInk, marginBottom: 8, marginTop: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.primary, // focus state based on image
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    paddingVertical: 12,
  },
  inputLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.textSecondary,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  radioOptionSelected: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FDF0EB',
  },
  radioText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '700', color: PALETTE.textInk },
  radioTextSelected: { color: PALETTE.brownText },
  textArea: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: PALETTE.textInk,
    height: 80,
    textAlignVertical: 'top',
  },
  resultCardsRow: { flexDirection: 'row', gap: 8 },
  resultCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultValue: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk, marginBottom: 4 },
  resultLabel: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.textSecondary },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
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
  },
  primaryBtnText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
