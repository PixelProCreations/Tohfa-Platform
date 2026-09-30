import React from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  infoBg: '#EFF6FF',
  infoBorder: '#3B82F6',
  infoText: '#1D4ED8',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ color = '#475569' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#475569' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ color = '#3B82F6' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseReportIssueScreenProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function SubWarehouseReportIssueScreen({
  onBack,
  onSubmit,
}: SubWarehouseReportIssueScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Issue Type */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Issue Type</Text>
            <Text style={styles.required}>Required</Text>
          </View>
          <TouchableOpacity style={styles.selectBox} activeOpacity={0.8}>
            <Text style={styles.selectText}>Select</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.required}>Required</Text>
          </View>
          <TouchableOpacity style={styles.selectBox} activeOpacity={0.8}>
            <Text style={styles.selectText}>Select</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.required}>Required</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Enter description"
            placeholderTextColor={PALETTE.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Photo */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Photo</Text>
            <Text style={styles.optional}>Optional</Text>
          </View>
          <TouchableOpacity style={styles.photoUploadBox} activeOpacity={0.8}>
            <CameraIcon />
            <Text style={styles.photoUploadText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Priority */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.infoNotice}>
            <InfoCircleIcon />
            <Text style={styles.infoNoticeText}>
              Priority levels are backend-defined — this app doesn't invent a High/Medium/Low scale unless the API provides one.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} activeOpacity={0.8}>
          <SendIcon />
          <Text style={styles.primaryBtnText}>Submit Issue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 100 },

  fieldGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '700', color: PALETTE.textInk, marginBottom: 8 },
  required: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 8 },
  optional: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 8 },

  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: { fontSize: 14, color: PALETTE.textInk },

  textArea: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    height: 120,
    fontSize: 14,
    color: PALETTE.textInk,
  },

  photoUploadBox: {
    backgroundColor: PALETTE.pageBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoUploadText: { fontSize: 10, color: '#475569', fontWeight: '600' },

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
  },
  infoNoticeText: { flex: 1, color: PALETTE.infoText, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: '#E88B5A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
