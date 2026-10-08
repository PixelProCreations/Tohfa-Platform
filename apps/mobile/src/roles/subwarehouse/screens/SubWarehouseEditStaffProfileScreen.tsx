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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import type { StaffMember } from './SubWarehouseStaffScreen';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  blueBoxBg: '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText: '#1E40AF',
  greenIcon: '#059669',
  greenBorder: '#059669',
  orangeText: '#B45309',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SaveIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 18, color = '#B45309' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleLargeIcon({ size = 32, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseEditStaffProfileScreenProps {
  staff?: StaffMember;
  onBack: () => void;
  onSave: (updatedStaff: StaffMember) => void;
}

export function SubWarehouseEditStaffProfileScreen({
  staff,
  onBack,
  onSave,
}: SubWarehouseEditStaffProfileScreenProps) {
  const isDriver = staff?.type === 'driver';
  const titleText = isDriver ? 'Edit Driver Profile' : 'Edit Staff Profile';
  const nameLabel = isDriver ? 'Driver Name' : 'Staff Name';

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  const [name, setName] = useState(staff?.name || '');
  const [contact, setContact] = useState(staff?.phone || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(staff?.status || 'Active');
  const [vehicleDetails, setVehicleDetails] = useState('');
  
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const handleFinalSave = () => {
    // Show success screen
    setStep('success');
  };

  const handleBackToStaffList = () => {
    if (staff) {
      onSave({ ...staff, name, phone: contact, status });
    } else {
      onSave({
        id: Math.random().toString(),
        name,
        staffId: 'STF-NEW',
        type: isDriver ? 'driver' : 'warehouse',
        role: isDriver ? 'Driver' : 'Warehouse Staff',
        status,
        attendance: 'Present',
        phone: contact,
      });
    }
  };

  const renderForm = () => (
    <>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>{titleText}</Text>
        
        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{nameLabel}</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={name}
            editable={false}
            onChangeText={setName}
            placeholder={`Enter ${nameLabel.toLowerCase()}`}
            placeholderTextColor="#9E9690"
          />
        </View>

        {/* Contact */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={contact}
            editable={false}
            onChangeText={setContact}
            placeholder="Enter contact number"
            placeholderTextColor="#9E9690"
            keyboardType="phone-pad"
          />
        </View>

        {/* Status Dropdown Mock */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity 
            style={styles.dropdownInput}
            activeOpacity={0.8}
            onPress={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <Text style={styles.dropdownText}>{status}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {isStatusDropdownOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => { setStatus('Active'); setIsStatusDropdownOpen(false); }}>
                <Text style={styles.dropdownMenuItemText}>Active</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.dropdownMenuItem} onPress={() => { setStatus('Inactive'); setIsStatusDropdownOpen(false); }}>
                <Text style={styles.dropdownMenuItemText}>Inactive</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isDriver && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Details</Text>
            <TextInput
              style={styles.input}
              value={vehicleDetails}
              onChangeText={setVehicleDetails}
              placeholder="e.g. TN 43 AB 1234"
              placeholderTextColor="#9E9690"
            />
          </View>
        )}
        
        {/* Info box */}
        <View style={styles.blueInfoBox}>
          <Text style={styles.blueInfoText}>
            {isDriver 
              ? "Vehicle/license/document fields are shown here as illustrative — they're confirmed against the final driver data model before being made mandatory."
              : "Role and permission fields are shown here as illustrative — they're confirmed against the final staff data model before being made mandatory."
            }
          </Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => setStep('confirm')}
          activeOpacity={0.88}
        >
          <SaveIcon color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.88}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderConfirm = () => (
    <>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmHeaderRow}>
            <QuestionCircleIcon />
            <Text style={styles.confirmTitle}>Save Changes?</Text>
          </View>
          
          <View style={styles.confirmMessageWrap}>
            <Text style={styles.confirmMessage}>
              The {isDriver ? 'driver' : 'staff'} profile will be updated.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmSaveBtn}
            onPress={handleFinalSave}
            activeOpacity={0.88}
          >
            <CheckIcon />
            <Text style={styles.confirmSaveBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setStep('form')}
            activeOpacity={0.88}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>


    </>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successCenterWrap}>
        <View style={styles.successIconWrap}>
          <CheckCircleLargeIcon />
        </View>
        <Text style={styles.successTitle}>
          {isDriver ? 'Driver' : 'Staff'} Profile Updated
        </Text>
        <Text style={styles.successSubtitle}>
          {staff?.staffId || 'STF-NEW'}
        </Text>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleBackToStaffList}
          activeOpacity={0.88}
        >
          <ArrowBackIcon size={20} />
          <Text style={styles.saveBtnText}>Back to Staff List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={step === 'success' ? handleBackToStaffList : (step === 'confirm' ? () => setStep('form') : onBack)}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'success' ? 'Profile Updated' : titleText}
          </Text>
        </View>
      </View>

      {step === 'form' && renderForm()}
      {step === 'confirm' && renderConfirm()}
      {step === 'success' && renderSuccess()}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: PALETTE.primary },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
    position: 'relative',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  input: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: PALETTE.textInk,
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6', // light gray background for disabled
    color: '#6B7280', // dim text for disabled
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownMenuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
  },
  blueInfoBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  blueInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.blueBoxText,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  
  // Confirm Screen Styles
  confirmCard: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeText,
  },
  confirmMessageWrap: {
    backgroundColor: PALETTE.pageBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  confirmMessage: {
    fontSize: 14,
    color: PALETTE.textInk,
    fontWeight: '500',
  },
  confirmSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.greenBorder,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 12,
  },
  confirmSaveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.greenIcon,
  },

  // Success Screen Styles
  successContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  successCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: PALETTE.textSecondary,
  },
});
