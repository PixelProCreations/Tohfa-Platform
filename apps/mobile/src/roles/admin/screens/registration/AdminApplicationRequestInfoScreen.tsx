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
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import type { PendingApplicationItem } from './AdminPendingApplicationsScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  inputBorder: '#E0DDD7',
  noticeBg: '#FFECE8',
  noticeText: '#662208',
};

const REQUEST_ITEMS = [
  { id: 'fmb', label: 'Updated FMB Sketch with clear survey boundaries' },
  { id: 'aadhaar', label: 'Clear photo of Aadhaar Card front & back' },
  { id: 'land_patta', label: 'Land Ownership Patta / Chitta document' },
  { id: 'bank_passbook', label: 'Bank Account Passbook / Cancelled Cheque' },
  { id: 'crop_cert', label: 'Organic / NPOP / PGS Certification copy' },
];

interface Props {
  application: PendingApplicationItem;
  onBack: () => void;
  onConfirmRequest: (selectedItems: string[], customMessage: string) => void;
}

export const AdminApplicationRequestInfoScreen: React.FC<Props> = ({
  application,
  onBack,
  onConfirmRequest,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(['fmb']);
  const [customMessage, setCustomMessage] = useState('');

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((i) => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Request More Info</Text>
        <Text style={styles.subtitle}>
          Notify {application.name} to upload missing documents or clarify application details.
        </Text>

        {/* Applicant Card */}
        <View style={styles.card}>
          <View style={styles.applicantRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{application.initials}</Text>
            </View>
            <View style={styles.applicantInfo}>
              <Text style={styles.applicantName}>{application.name}</Text>
              <Text style={styles.applicantSub}>
                {application.location} · {application.phone ?? '+91 98XXX XX412'}
              </Text>
            </View>
          </View>
        </View>

        {/* Notice Info */}
        <View style={styles.noticeBanner}>
          <Icon name="info" size={18} color={P.noticeText} style={{ marginRight: 10, marginTop: 1 }} />
          <Text style={styles.noticeText}>
            A push notification and SMS will prompt the farmer to open Tohfa app and upload requested items.
          </Text>
        </View>

        {/* Checkbox Options */}
        <Text style={styles.fieldLabel}>Select Requested Documents</Text>
        <View style={styles.checklist}>
          {REQUEST_ITEMS.map((item) => {
            const isChecked = selectedItems.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.checkOption, isChecked && styles.checkOptionSelected]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkBox, isChecked && styles.checkBoxSelected]}>
                  {isChecked && <Icon name="check" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkText, isChecked && styles.checkTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Specific Instructions / Custom Message */}
        <Text style={styles.fieldLabel}>Specific Instructions to Farmer</Text>
        <TextInput
          style={styles.customInput}
          placeholder="e.g. Please re-upload the FMB sketch showing the surveyor stamp and signature clearly."
          placeholderTextColor="#A09890"
          multiline
          numberOfLines={3}
          value={customMessage}
          onChangeText={setCustomMessage}
        />

        {/* Send Request Button */}
        <TouchableOpacity
          style={styles.sendBtn}
          activeOpacity={0.85}
          onPress={() => onConfirmRequest(selectedItems, customMessage)}
        >
          <Icon name="mark_email_read" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.sendBtnText}>Send Info Request</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 12 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: P.subtitle,
    marginBottom: 20,
  },
  card: {
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFECE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
    color: P.titleBrown,
  },
  applicantInfo: { flex: 1 },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 3,
  },
  applicantSub: {
    fontSize: 12.5,
    color: P.subtitle,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.noticeBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: P.noticeText,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 8,
  },
  checklist: {
    gap: 10,
    marginBottom: 20,
  },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E4DD',
    paddingHorizontal: 14,
    paddingVertical: 12,
    cursor: 'pointer' as any,
  },
  checkOptionSelected: {
    borderColor: P.orange,
    backgroundColor: '#FFF9F7',
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC5BD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkBoxSelected: {
    borderColor: P.orange,
    backgroundColor: P.orange,
  },
  checkText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: P.ink,
    lineHeight: 18,
  },
  checkTextSelected: {
    color: P.orange,
    fontWeight: '700',
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E4DD',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: P.ink,
    textAlignVertical: 'top',
    minHeight: 88,
    marginBottom: 24,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 16,
    height: 52,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
