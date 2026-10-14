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

export interface EditChannelAllocationScreenProps {
  onBack?: () => void;
  onSave?: (allocation: { online: number; mandi: number; horeca: number; reserve: number }) => void;
}

export function EditChannelAllocationScreen({
  onBack,
  onSave,
}: EditChannelAllocationScreenProps) {
  const [online, setOnline] = useState('70');
  const [mandi, setMandi] = useState('10');
  const [horeca, setHoreca] = useState('10');
  const [reserve, setReserve] = useState('10');

  const total =
    (parseInt(online, 10) || 0) +
    (parseInt(mandi, 10) || 0) +
    (parseInt(horeca, 10) || 0) +
    (parseInt(reserve, 10) || 0);

  const handleSave = () => {
    if (total !== 100) {
      Alert.alert('Allocation Error', `Total percentage must equal 100%. Current total is ${total}%.`);
      return;
    }
    Alert.alert(
      'Policy Updated',
      `Locked 70/10/10/10 policy updated to ${online}/${mandi}/${horeca}/${reserve}. Changes applied across all warehouse routing engines.`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSave?.({
              online: parseInt(online, 10),
              mandi: parseInt(mandi, 10),
              horeca: parseInt(horeca, 10),
              reserve: parseInt(reserve, 10),
            });
            onBack?.();
          },
        },
      ]
    );
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
          <Text style={styles.screenTitle}>Channel Allocation Policy</Text>
          <Text style={styles.screenSubtitle}>
            Configure automated distribution quotas for freshly harvested produce
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Online Direct */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputTitle}>Online Direct (B2C Tohfa App)</Text>
              <Text style={styles.pctBadge}>{online}%</Text>
            </View>
            <Text style={styles.inputDesc}>
              Consumer households via regional mobile app orders
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={online}
              onChangeText={setOnline}
              maxLength={3}
            />
          </View>

          <View style={styles.divider} />

          {/* Local Mandi */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputTitle}>Local Mandi & Retail</Text>
              <Text style={styles.pctBadge}>{mandi}%</Text>
            </View>
            <Text style={styles.inputDesc}>
              Physical market stalls and local hill trade
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={mandi}
              onChangeText={setMandi}
              maxLength={3}
            />
          </View>

          <View style={styles.divider} />

          {/* Horeca */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputTitle}>Horeca & Institutional B2B</Text>
              <Text style={styles.pctBadge}>{horeca}%</Text>
            </View>
            <Text style={styles.inputDesc}>
              Hotels, restaurants, resorts, and wholesale buyers
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={horeca}
              onChangeText={setHoreca}
              maxLength={3}
            />
          </View>

          <View style={styles.divider} />

          {/* Reserve / Buffer */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputTitle}>Reserve / Buffer Split</Text>
              <Text style={styles.pctBadge}>{reserve}%</Text>
            </View>
            <Text style={styles.inputDesc}>
              Warehouse cold-storage buffer and loss mitigation
            </Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={reserve}
              onChangeText={setReserve}
              maxLength={3}
            />
          </View>

          <View style={styles.divider} />

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Split Percentage</Text>
            <Text
              style={[
                styles.totalValue,
                { color: total === 100 ? CONFIG_PALETTE.greenText : '#DC2626' },
              ]}
            >
              {total}% {total === 100 ? '✓ Valid' : '⚠️ Must be 100%'}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, total !== 100 && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={total !== 100}
          activeOpacity={0.85}
        >
          <Text style={styles.saveButtonText}>Lock & Apply Channel Allocation</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 24,
  },
  inputGroup: {
    paddingVertical: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  inputTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
  },
  pctBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: CONFIG_PALETTE.primaryOrange,
  },
  inputDesc: {
    fontSize: 11,
    color: CONFIG_PALETTE.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: CONFIG_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E8',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
