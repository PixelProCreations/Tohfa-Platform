import React, { useState } from 'react';
import {
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

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  chipActiveBg: '#F0562A',
  chipActiveText: '#FFFFFF',
  chipInactiveBg: '#FFFFFF',
  chipInactiveBorder: '#EEDCD3',
  chipInactiveText: '#1A1A1A',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

export interface ReportOperationalIssueScreenProps {
  onBack?: () => void;
  onSubmitIssue?: (issueData: any) => void;
}

export function ReportOperationalIssueScreen({
  onBack,
  onSubmitIssue,
}: ReportOperationalIssueScreenProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState('Coonoor');
  const [locationText, setLocationText] = useState('Cold Storage, Section A · Rack A-03');
  const [selectedCategory, setSelectedCategory] = useState('Storage / Space');
  const [selectedSeverity, setSelectedSeverity] = useState('High');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const WAREHOUSES = ['Coonoor', 'Ooty', 'Kotagiri', 'Gudalur'];
  const CATEGORIES = [
    'Storage / Space',
    'Temperature / Cooling',
    'Equipment / Facility',
    'Packaging / Material',
    'Stock Discrepancy',
  ];
  const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

  const handleSubmit = () => {
    onSubmitIssue?.({
      warehouse: selectedWarehouse,
      location: locationText,
      category: selectedCategory,
      severity: selectedSeverity,
      title: title || 'Operational storage exception',
      description,
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Report Operational Issue</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Log warehouse equipment, space or facility issues
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Warehouse Selection ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Warehouse</Text>
        </View>
        <View style={styles.chipsRow}>
          {WAREHOUSES.map((wh) => {
            const active = selectedWarehouse === wh;
            return (
              <TouchableOpacity
                key={wh}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedWarehouse(wh)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {wh}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 2. Location & Area ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Specific Location / Rack</Text>
        </View>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Cold Storage, Section A, Rack A-03"
            placeholderTextColor="#888888"
            value={locationText}
            onChangeText={setLocationText}
          />
        </View>

        {/* ─── 3. Issue Category ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Issue Category</Text>
        </View>
        <View style={styles.chipsWrap}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 4. Severity Level ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Severity Level</Text>
        </View>
        <View style={styles.severityRow}>
          {SEVERITIES.map((sev) => {
            const active = selectedSeverity === sev;
            return (
              <TouchableOpacity
                key={sev}
                style={[styles.severityBtn, active && styles.severityBtnActive]}
                onPress={() => setSelectedSeverity(sev)}
                activeOpacity={0.8}
              >
                <Text style={[styles.severityText, active && styles.severityTextActive]}>
                  {sev}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 5. Issue Summary & Description ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Issue Summary</Text>
        </View>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Brief summary of the issue"
            placeholderTextColor="#888888"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Detailed Description</Text>
        </View>
        <View style={[styles.inputCard, { minHeight: 96, paddingVertical: 10 }]}>
          <TextInput
            style={[styles.textInput, { textAlignVertical: 'top', minHeight: 76 }]}
            placeholder="Provide context, observations, or immediate actions required..."
            placeholderTextColor="#888888"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>Submit Issue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 38,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: PALETTE.chipInactiveBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.chipInactiveBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: PALETTE.chipActiveBg,
    borderColor: PALETTE.chipActiveBg,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.chipInactiveText,
  },
  chipTextActive: {
    color: PALETTE.chipActiveText,
  },
  inputCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    fontSize: 13.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  severityBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  severityText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  severityTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
