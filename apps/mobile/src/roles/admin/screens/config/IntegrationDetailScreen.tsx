import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  CONFIG_PALETTE,
  ConfigBackChevronIcon,
} from './SystemConfigScreen';

export interface IntegrationDetailScreenProps {
  integrationId?: string;
  onBack?: () => void;
}

export function IntegrationDetailScreen({
  integrationId = 'razorpay',
  onBack,
}: IntegrationDetailScreenProps) {
  const isRazorpay = integrationId === 'razorpay';
  const isSms = integrationId === 'sms';

  const [enabled, setEnabled] = useState(true);
  const [environment, setEnvironment] = useState<'Live' | 'Sandbox'>('Live');
  const [apiKey, setApiKey] = useState(
    isRazorpay
      ? 'rzp_live_9a87f61c8d0e21'
      : isSms
      ? 'auth_key_msg91_live_891278'
      : 'AKIAIOSFODNN7EXAMPLE'
  );
  const [webhookSecret, setWebhookSecret] = useState('whsec_8912b7cf910248a');
  const [testing, setTesting] = useState(false);

  const title = isRazorpay
    ? 'Razorpay + RazorpayX Payouts'
    : isSms
    ? 'Twilio / MSG91 (SMS Gateway)'
    : 'AWS S3 / Cloudinary Storage';

  const subtitle = isRazorpay
    ? 'Automated farmer payout disbursals and customer UPI collections'
    : isSms
    ? 'OTP SMS, audit reminders, and payout dispatch alerts'
    : 'Cold-chain photo storage, harvest receipts, and FSSAI cert documents';

  const handleTestPing = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      Alert.alert(
        'Ping Successful (200 OK)',
        `Connection to ${title} active. Latency: 42ms. Webhook endpoint verified.`
      );
    }, 600);
  };

  const handleSave = () => {
    Alert.alert('Integration Saved', `${title} settings updated.`);
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
          <Text style={styles.screenTitle}>{title}</Text>
          <Text style={styles.screenSubtitle}>{subtitle}</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusTitle}>Integration Status</Text>
              <Text style={styles.statusSub}>
                {enabled ? 'Active and processing events' : 'Paused / Inactive'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#D1D5DB', true: CONFIG_PALETTE.primaryOrange }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Environment Switch */}
          <View style={styles.envRow}>
            <Text style={styles.envLabel}>Target Environment</Text>
            <View style={styles.envPillGroup}>
              <TouchableOpacity
                style={[styles.envPill, environment === 'Live' && styles.envPillActive]}
                onPress={() => setEnvironment('Live')}
              >
                <Text
                  style={[
                    styles.envPillText,
                    environment === 'Live' && styles.envPillTextActive,
                  ]}
                >
                  Live Production
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.envPill, environment === 'Sandbox' && styles.envPillActive]}
                onPress={() => setEnvironment('Sandbox')}
              >
                <Text
                  style={[
                    styles.envPillText,
                    environment === 'Sandbox' && styles.envPillTextActive,
                  ]}
                >
                  Sandbox / Test
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Credentials Form */}
        <View style={styles.formCard}>
          <Text style={styles.formCardHeading}>API Credentials</Text>

          <Text style={styles.fieldLabel}>API / Client Key</Text>
          <TextInput
            style={styles.textInput}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>Webhook Secret</Text>
          <TextInput
            style={styles.textInput}
            value={webhookSecret}
            onChangeText={setWebhookSecret}
            secureTextEntry
          />

          <Text style={styles.fieldLabel}>Webhook Callback URL</Text>
          <View style={styles.readonlyUrlBox}>
            <Text style={styles.readonlyUrlText}>
              https://api.tohfa.ag/v1/integrations/{integrationId}/webhook
            </Text>
          </View>

          {/* Test Ping Button */}
          <TouchableOpacity
            style={styles.testPingBtn}
            onPress={handleTestPing}
            activeOpacity={0.7}
          >
            <Text style={styles.testPingBtnText}>
              {testing ? 'Pinging Endpoint...' : '⚡ Test Connection & Ping API'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save Integration Settings</Text>
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
  statusCard: {
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
  },
  statusSub: {
    fontSize: 12,
    color: CONFIG_PALETTE.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F0E8',
    marginVertical: 10,
  },
  envRow: {
    paddingTop: 4,
  },
  envLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 8,
  },
  envPillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  envPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: CONFIG_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
  },
  envPillActive: {
    backgroundColor: CONFIG_PALETTE.primaryOrangeLight,
    borderColor: CONFIG_PALETTE.primaryOrange,
  },
  envPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG_PALETTE.textSecondary,
  },
  envPillTextActive: {
    color: CONFIG_PALETTE.primaryOrange,
  },
  formCard: {
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  formCardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG_PALETTE.textHeading,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 6,
    marginTop: 6,
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
    marginBottom: 12,
  },
  readonlyUrlBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  readonlyUrlText: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testPingBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: CONFIG_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    alignItems: 'center',
  },
  testPingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
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
