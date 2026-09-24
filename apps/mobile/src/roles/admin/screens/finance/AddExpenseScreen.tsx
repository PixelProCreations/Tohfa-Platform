import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     '#8E3314',
  orange:        '#E85226',
  pageBg:        '#FAF8F5',
  cardBg:        '#FFFFFF',
  ink:           '#1A1412',
  labelMuted:    '#6D6761',
  border:        '#EDE8E0',
  chipActiveBg:  '#FFF2EB',
  chipActiveText:'#E85226',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1A1412"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const CATEGORIES = [
  'Warehouse Maintenance',
  'Electricity & Utilities',
  'Equipment Repair',
  'Inter-Warehouse Transport',
  'Packaging Supplies',
];

const WAREHOUSES = ['Ooty Main', 'Coonoor Sub', 'Kotagiri Sub', 'Gudalur Sub'];

export interface AddExpenseScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function AddExpenseScreen({ onBack, onSuccess }: AddExpenseScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0] ?? 'Warehouse Maintenance');
  const [selectedWarehouse, setSelectedWarehouse] = useState(WAREHOUSES[0] ?? 'Ooty Main');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!amount.trim()) {
      Alert.alert('Missing Field', 'Please enter the expense amount in rupees.');
      return;
    }

    Alert.alert(
      'Expense Submitted',
      `Expense voucher for ₹${amount} (${selectedCategory}) submitted for Super Admin review.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) onSuccess();
            else onBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button First */}
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <BackChevronIcon />
          </TouchableOpacity>

          {/* Heading Next */}
          <Text style={styles.screenTitle}>Log New Expense</Text>
          <Text style={styles.screenSub}>Submit operational cost voucher for platform approval</Text>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Category Picker */}
            <Text style={styles.fieldLabel}>Expense Category</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Warehouse Picker */}
            <Text style={styles.fieldLabel}>Warehouse / Facility</Text>
            <View style={styles.chipsWrap}>
              {WAREHOUSES.map((wh) => {
                const isActive = selectedWarehouse === wh;
                return (
                  <TouchableOpacity
                    key={wh}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedWarehouse(wh)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {wh}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount Input */}
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 4500"
                placeholderTextColor="#A8A29E"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Notes Input */}
            <Text style={styles.fieldLabel}>Notes / Vendor Reference</Text>
            <TextInput
              style={[styles.textInputArea]}
              placeholder="e.g. Invoiced by Nilgiri Electricals #INV-9921"
              placeholderTextColor="#A8A29E"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.submitBtnText}>Submit Expense for Approval</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 8,
    marginTop: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipActive: {
    backgroundColor: PALETTE.chipActiveBg,
    borderColor: PALETTE.orange,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  chipTextActive: {
    color: PALETTE.chipActiveText,
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: PALETTE.pageBg,
    height: 48,
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.ink,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.ink,
  },
  textInputArea: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: PALETTE.pageBg,
    fontSize: 13,
    color: PALETTE.ink,
    textAlignVertical: 'top',
    height: 80,
  },
  submitBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
