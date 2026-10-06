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
import Svg, { Path, Polyline, Circle, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20, color = PALETTE.textSecondary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MinusIcon({ size = 20, color = PALETTE.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseAddMaterialScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function SubWarehouseAddMaterialScreen({ onBack, onSave }: SubWarehouseAddMaterialScreenProps) {
  const [condition, setCondition] = useState('Good');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Material</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* MATERIAL INFORMATION */}
        <Text style={styles.sectionTitle}>MATERIAL INFORMATION</Text>
        
        <Text style={styles.label}>Material Name <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>Select material</Text>
          <ChevronDownIcon />
        </View>

        <Text style={styles.label}>Material Category <Text style={styles.required}>*</Text></Text>
        <View style={[styles.inputContainer, styles.disabledInput]}>
          <Text style={styles.disabledText}>Select material first</Text>
        </View>

        {/* QUANTITY */}
        <Text style={styles.sectionTitle}>QUANTITY</Text>
        
        <Text style={styles.label}>Received Quantity <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter quantity"
            placeholderTextColor={PALETTE.textMuted}
            keyboardType="numeric"
          />
          <View style={styles.minusBtn}>
            <MinusIcon />
          </View>
        </View>

        <Text style={styles.label}>Condition <Text style={styles.required}>*</Text></Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity 
            style={[styles.toggleBtn, condition === 'Good' && styles.toggleBtnActive]}
            onPress={() => setCondition('Good')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, condition === 'Good' && styles.toggleTextActive]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, condition === 'Damaged' && styles.toggleBtnActive]}
            onPress={() => setCondition('Damaged')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, condition === 'Damaged' && styles.toggleTextActive]}>Damaged</Text>
          </TouchableOpacity>
        </View>

        {/* STORAGE LOCATION */}
        <Text style={styles.sectionTitle}>STORAGE LOCATION</Text>
        
        <Text style={styles.label}>Storage Location <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputText}>Select storage location</Text>
          <ChevronDownIcon />
        </View>
        <Text style={styles.helperText}>Only locations in Coonoor Warehouse are shown.</Text>

        {/* ADDITIONAL */}
        <Text style={styles.sectionTitle}>ADDITIONAL</Text>
        
        <Text style={styles.label}>Notes</Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes..."
            placeholderTextColor={PALETTE.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>
        
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 100 },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: PALETTE.primary, marginTop: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: PALETTE.textInk, marginBottom: 8 },
  required: { color: PALETTE.primary },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  inputText: { fontSize: 15, color: PALETTE.textInk },
  textInput: { flex: 1, fontSize: 15, color: PALETTE.textInk, height: '100%' },
  disabledInput: { backgroundColor: '#F3F0EA' },
  disabledText: { fontSize: 15, color: PALETTE.textMuted },
  minusBtn: { backgroundColor: '#FFF0EA', padding: 4, borderRadius: 8 },

  toggleGroup: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  toggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: PALETTE.primary },
  toggleText: { fontSize: 15, fontWeight: '700', color: PALETTE.textSecondary },
  toggleTextActive: { color: '#FFFFFF' },

  helperText: { fontSize: 12, color: PALETTE.textSecondary, marginTop: -8, marginBottom: 16 },

  textAreaContainer: { height: 100, alignItems: 'flex-start', paddingVertical: 12 },
  textArea: { flex: 1, width: '100%', fontSize: 15, color: PALETTE.textInk },

  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    padding: 16,
    paddingBottom: 24,
  },
  saveBtn: {
    backgroundColor: PALETTE.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
