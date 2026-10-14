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
  redAccent: '#D32F2F',
  redPillBg: '#FFEBEE',
};

const REJECT_REASONS = [
  'Incomplete Land Records or Invalid Survey Number',
  'Aadhaar Photo or Details Mismatch',
  'Outside Operating Agricultural Zone',
  'Duplicate or Fraudulent Application',
  'Other Reason',
];

interface Props {
  application: PendingApplicationItem;
  onBack: () => void;
  onConfirmReject: (reason: string, details: string) => void;
}

export const AdminApplicationRejectScreen: React.FC<Props> = ({
  application,
  onBack,
  onConfirmReject,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(REJECT_REASONS[0] ?? 'Incomplete Land Records');
  const [details, setDetails] = useState('');

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
        <Text style={styles.title}>Reject Application</Text>
        <Text style={styles.subtitle}>
          Provide a clear rejection reason for {application.name}. An SMS notification will be sent.
        </Text>

        {/* Applicant Details */}
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

        {/* Reason Selection */}
        <Text style={styles.fieldLabel}>Primary Rejection Reason</Text>
        <View style={styles.reasonsList}>
          {REJECT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rejection Details & Instructions for Applicant */}
        <Text style={styles.fieldLabel}>Feedback / Instructions for Farmer</Text>
        <TextInput
          style={styles.detailsInput}
          placeholder="Explain what was missing or what documents need re-submission if re-applying..."
          placeholderTextColor="#A09890"
          multiline
          numberOfLines={3}
          value={details}
          onChangeText={setDetails}
        />

        {/* Confirm Reject Button */}
        <TouchableOpacity
          style={styles.rejectBtn}
          activeOpacity={0.85}
          onPress={() => onConfirmReject(selectedReason, details)}
        >
          <Icon name="cancel" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.rejectBtnText}>Confirm Rejection</Text>
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
    marginBottom: 20,
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 8,
  },
  reasonsList: {
    gap: 10,
    marginBottom: 20,
  },
  reasonOption: {
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
  reasonOptionSelected: {
    borderColor: P.orange,
    backgroundColor: '#FFF9F7',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC5BD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: P.orange,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.orange,
  },
  reasonText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: P.ink,
    lineHeight: 18,
  },
  reasonTextSelected: {
    color: P.orange,
    fontWeight: '700',
  },
  detailsInput: {
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
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 16,
    height: 52,
    shadowColor: P.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
