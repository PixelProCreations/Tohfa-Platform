import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CONFIG_PALETTE,
  ConfigBackChevronIcon,
} from './SystemConfigScreen';

export interface CompanyDetailsScreenProps {
  onBack?: () => void;
}

export function CompanyDetailsScreen({ onBack }: CompanyDetailsScreenProps) {
  const [legalName, setLegalName] = useState('Tohfa Agri-Tech Solutions Private Limited');
  const [tradeName, setTradeName] = useState('Tohfa Nilgiris Exchange');
  const [gstin, setGstin] = useState('33AAACT9941K1Z3');
  const [pan, setPan] = useState('AAACT9941K');
  const [cin, setCin] = useState('U01111TZ2025PTC048912');
  const [fssai, setFssai] = useState('12425008000192');
  const [address, setAddress] = useState('No. 42/B, Commercial Road, Ooty, The Nilgiris — 643001, Tamil Nadu, India');
  const [supportEmail, setSupportEmail] = useState('support@tohfa.ag');
  const [supportPhone, setSupportPhone] = useState('+91 94421 88900');

  const handleSave = () => {
    Alert.alert('Company Details Saved', 'Official company and taxation profile updated.');
    onBack?.();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={CONFIG_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ConfigBackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Company Details</Text>
          <Text style={styles.screenSubtitle}>
            Legal corporate identity, GSTIN registration, and headquarters address
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>Legal Entity Name</Text>
          <TextInput
            style={styles.textInput}
            value={legalName}
            onChangeText={setLegalName}
          />

          <Text style={styles.fieldLabel}>Trade Name / Brand</Text>
          <TextInput
            style={styles.textInput}
            value={tradeName}
            onChangeText={setTradeName}
          />

          <View style={styles.twoColRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>GSTIN</Text>
              <TextInput
                style={styles.textInput}
                value={gstin}
                onChangeText={setGstin}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fieldLabel}>Company PAN</Text>
              <TextInput
                style={styles.textInput}
                value={pan}
                onChangeText={setPan}
              />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>CIN</Text>
              <TextInput
                style={styles.textInput}
                value={cin}
                onChangeText={setCin}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fieldLabel}>FSSAI Central License #</Text>
              <TextInput
                style={styles.textInput}
                value={fssai}
                onChangeText={setFssai}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Registered HQ Address</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />

          <View style={styles.twoColRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.fieldLabel}>Support Email</Text>
              <TextInput
                style={styles.textInput}
                value={supportEmail}
                onChangeText={setSupportEmail}
                keyboardType="email-address"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.fieldLabel}>Support Helpline</Text>
              <TextInput
                style={styles.textInput}
                value={supportPhone}
                onChangeText={setSupportPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save Company Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CONFIG_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: CONFIG_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CONFIG_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: CONFIG_PALETTE.textSecondary,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: CONFIG_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 6,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: CONFIG_PALETTE.primaryOrange,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: CONFIG_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
