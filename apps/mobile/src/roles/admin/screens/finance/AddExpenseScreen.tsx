import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { adminColors, adminShadow, adminSpacing } from '../../theme';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = '#2D1802' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Company Card', 'Cheque'];
const PAYMENT_STATUSES = ['Paid', 'Pending verification', 'Recorded', 'Payment pending'];
const CATEGORIES = ['Packaging', 'Transport', 'Utilities', 'Maintenance', 'Operational', 'Salary'];
const WAREHOUSES = ['Main Warehouse, Ooty', 'Sub Warehouse, Coonoor', 'Kotagiri Sub'];

export interface AddExpenseScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function AddExpenseScreen({ onBack, onSuccess }: AddExpenseScreenProps) {
  const [category, setCategory] = useState('Packaging');
  const [amount, setAmount] = useState('');
  const [warehouse, setWarehouse] = useState('Main Warehouse, Ooty');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [addedDoc, setAddedDoc] = useState<string | null>(null);

  const [activePicker, setActivePicker] = useState<'category' | 'warehouse' | 'method' | 'status' | null>(null);

  const handleAddDocument = () => {
    setAddedDoc('invoice_receipt_doc.pdf');
    Alert.alert('Document Attached', 'invoice_receipt_doc.pdf (142 KB) attached successfully.');
  };

  const handleSave = () => {
    if (!amount.trim()) {
      Alert.alert('Required Field', 'Please enter an expense amount.');
      return;
    }
    Alert.alert(
      'Expense Saved',
      `Expense for ₹${amount} (${category}) has been recorded.`,
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
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Expense Management"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add expense</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1 · Expense Details ── */}
        <Text style={styles.sectionHeading}>1 · Expense details</Text>

        {/* Category */}
        <View style={[styles.fieldBlock, { zIndex: activePicker === 'category' ? 50 : 5 }]}>
          <Text style={styles.fieldLabel}>Category *</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setActivePicker(activePicker === 'category' ? null : 'category')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownValueText}>{category || 'Select'}</Text>
            <ChevronDownIcon size={18} />
          </TouchableOpacity>
          {activePicker === 'category' && (
            <View style={styles.floatingMenu}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.menuItem, category === c && styles.menuItemSelected]}
                  onPress={() => {
                    setCategory(c);
                    setActivePicker(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.menuItemText, category === c && styles.menuItemTextSelected]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Amount */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Amount (₹) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0.00"
            placeholderTextColor="#A0988E"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Warehouse */}
        <View style={[styles.fieldBlock, { zIndex: activePicker === 'warehouse' ? 40 : 4 }]}>
          <Text style={styles.fieldLabel}>Warehouse</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setActivePicker(activePicker === 'warehouse' ? null : 'warehouse')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownValueText}>{warehouse || 'Select'}</Text>
            <ChevronDownIcon size={18} />
          </TouchableOpacity>
          {activePicker === 'warehouse' && (
            <View style={styles.floatingMenu}>
              {WAREHOUSES.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.menuItem, warehouse === w && styles.menuItemSelected]}
                  onPress={() => {
                    setWarehouse(w);
                    setActivePicker(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.menuItemText, warehouse === w && styles.menuItemTextSelected]}>
                    {w}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Currency (Locked) */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Currency 🔒</Text>
          <View style={[styles.textInput, styles.lockedInput]}>
            <Text style={styles.lockedText}>INR</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.fieldBlock, { zIndex: activePicker === 'method' ? 30 : 3 }]}>
          <Text style={styles.fieldLabel}>Payment method *</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setActivePicker(activePicker === 'method' ? null : 'method')}
            activeOpacity={0.75}
          >
            <Text style={[styles.dropdownValueText, !paymentMethod && styles.placeholderText]}>
              {paymentMethod || 'Select'}
            </Text>
            <ChevronDownIcon size={18} />
          </TouchableOpacity>
          {activePicker === 'method' && (
            <View style={styles.floatingMenu}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.menuItem, paymentMethod === m && styles.menuItemSelected]}
                  onPress={() => {
                    setPaymentMethod(m);
                    setActivePicker(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.menuItemText, paymentMethod === m && styles.menuItemTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment Status */}
        <View style={[styles.fieldBlock, { zIndex: activePicker === 'status' ? 20 : 2 }]}>
          <Text style={styles.fieldLabel}>Payment status *</Text>
          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setActivePicker(activePicker === 'status' ? null : 'status')}
            activeOpacity={0.75}
          >
            <Text style={[styles.dropdownValueText, !paymentStatus && styles.placeholderText]}>
              {paymentStatus || 'Select'}
            </Text>
            <ChevronDownIcon size={18} />
          </TouchableOpacity>
          {activePicker === 'status' && (
            <View style={styles.floatingMenu}>
              {PAYMENT_STATUSES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.menuItem, paymentStatus === s && styles.menuItemSelected]}
                  onPress={() => {
                    setPaymentStatus(s);
                    setActivePicker(null);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.menuItemText, paymentStatus === s && styles.menuItemTextSelected]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── 3 · Supporting documents ── */}
        <Text style={[styles.sectionHeading, { marginTop: 22 }]}>3 · Supporting documents</Text>
        <Text style={styles.fieldLabel}>Receipt or invoice</Text>

        <TouchableOpacity
          style={styles.addDocBtn}
          onPress={handleAddDocument}
          activeOpacity={0.8}
        >
          <Text style={styles.addDocBtnText}>Add a document</Text>
        </TouchableOpacity>
        <Text style={styles.docLimitsText}>JPG, PNG or PDF, up to 5 MB (proposed limits).</Text>

        <View style={[styles.fieldBlock, { marginTop: 12 }]}>
          <Text style={styles.fieldLabel}>Document description</Text>
          <TextInput
            style={styles.textInput}
            placeholder=""
            value={docDescription}
            onChangeText={setDocDescription}
          />
        </View>

        {/* ── 4 · Review ── */}
        <Text style={[styles.sectionHeading, { marginTop: 22 }]}>4 · Review</Text>
        <View style={styles.reviewCard}>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Category</Text>
            <Text style={styles.reviewValue}>{category || '—'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Amount</Text>
            <Text style={styles.reviewValue}>{amount ? `₹${amount}` : '—'}</Text>
          </View>
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Warehouse</Text>
            <Text style={styles.reviewValue}>{warehouse || '—'}</Text>
          </View>
          <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.reviewLabel}>Documents</Text>
            <Text style={styles.reviewValue}>{addedDoc ? addedDoc : 'None'}</Text>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Save Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: 16,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#8A4A00',
    marginBottom: 10,
  },
  fieldBlock: {
    position: 'relative',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F1714',
    marginBottom: 5,
  },
  dropdownBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F1714',
  },
  placeholderText: {
    color: '#786F68',
    fontWeight: '400',
  },
  floatingMenu: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 6,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItemSelected: {
    backgroundColor: '#737373',
  },
  menuItemText: {
    fontSize: 13.5,
    color: '#1F1714',
    fontWeight: '500',
  },
  menuItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  textInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: '#1F1714',
  },
  lockedInput: {
    justifyContent: 'center',
    backgroundColor: '#F7F5F2',
  },
  lockedText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#5A524D',
  },
  addDocBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addDocBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  docLimitsText: {
    fontSize: 11.5,
    color: '#786F68',
    marginBottom: 4,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20,
    ...adminShadow.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  reviewLabel: {
    fontSize: 12.5,
    color: '#6D6761',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F1714',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D8D0C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  saveBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#4A4A4A',
  },
});
