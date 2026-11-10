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
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  CalendarIcon,
  CheckmarkIcon,
  DownloadIcon,
  HistoryClockIcon,
  PlusIcon,
} from '../../components/AdminIcons';

export interface CreateEventScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

/**
 * Create Event screen
 * Matching exact reference mockup: Image 5 right
 */
export function CreateEventScreen({
  onBack,
  onSuccess,
}: CreateEventScreenProps): React.JSX.Element {
  const [eventTitle, setEventTitle] = useState('Soil health workshop');
  const [eventType, setEventType] = useState('Training');
  const [description, setDescription] = useState(
    'Interactive training session on organic soil fertility and NPK balance.'
  );
  const [eventLocation, setEventLocation] = useState('Coonoor Sub-Warehouse Community Hall');
  const [registerLink, setRegisterLink] = useState('https://tohfa.org/events/soil-workshop');

  const [startDate, setStartDate] = useState('28-10-2026');
  const [endDate, setEndDate] = useState('28-10-2026');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('01:00 PM');

  const [targetAudience, setTargetAudience] = useState('All Farmers');
  const [audienceConfirmed, setAudienceConfirmed] = useState(true);

  const handleSaveAndPublish = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Required Field', 'Please enter an Event Title.');
      return;
    }
    if (!audienceConfirmed) {
      Alert.alert('Confirmation Needed', 'Please confirm the target audience before publishing.');
      return;
    }
    Alert.alert(
      'Event Published',
      'The platform event has been published to all farmer calendars and notifications.',
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Event Information */}
        <Text style={styles.sectionTitle}>Section 1 · Event information</Text>
        <View style={styles.fieldCard}>
          {/* Event Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.textInput}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="e.g. Soil health workshop"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Event Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Type *</Text>
            <View style={styles.inputWithBtnRow}>
              <TextInput
                style={styles.textInput}
                value={eventType}
                onChangeText={setEventType}
                placeholder="e.g. Training"
                placeholderTextColor={adminColors.placeholder}
              />
              <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
                <PlusIcon size={14} color={adminColors.brand} />
                <Text style={styles.fieldActionBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Banner */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Banner</Text>
            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
              <DownloadIcon size={20} color={adminColors.brand} />
              <Text style={styles.uploadText}>Upload</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter event details..."
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.codePermanentNote}>
            The code is a permanent identifier and cannot be changed.
          </Text>

          {/* Event Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Location</Text>
            <TextInput
              style={styles.textInput}
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholder="e.g. Ooty Warehouse / Online"
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          {/* Event register Link */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event register Link</Text>
            <TextInput
              style={styles.textInput}
              value={registerLink}
              onChangeText={setRegisterLink}
              placeholder="https://..."
              placeholderTextColor={adminColors.placeholder}
            />
          </View>
        </View>

        {/* Section 2: Schedule */}
        <Text style={[styles.sectionTitle, { marginTop: adminSpacing.lg }]}>Section 2 · Schedule</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Start Date</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={adminColors.placeholder}
              />
              <CalendarIcon size={18} color={adminColors.muted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>End Date</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={adminColors.placeholder}
              />
              <CalendarIcon size={18} color={adminColors.muted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Start Time</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={styles.textInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="--:-- --"
                placeholderTextColor={adminColors.placeholder}
              />
              <HistoryClockIcon size={18} color={adminColors.muted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>End Time</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={styles.textInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="--:-- --"
                placeholderTextColor={adminColors.placeholder}
              />
              <HistoryClockIcon size={18} color={adminColors.muted} />
            </View>
          </View>
        </View>

        {/* Section 3: Audience & visibility */}
        <Text style={[styles.sectionTitle, { marginTop: adminSpacing.lg }]}>
          Section 3 · Audience & visibility
        </Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Target Audience</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() =>
                setTargetAudience(prev =>
                  prev === 'All Farmers' ? 'Selected Zones (Coonoor, Kotagiri)' : 'All Farmers'
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownBtnText}>{targetAudience}</Text>
              <Text style={styles.dropdownArrow}>▾</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAudienceConfirmed(prev => !prev)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                audienceConfirmed && styles.checkboxActive,
              ]}
            >
              {audienceConfirmed && <CheckmarkIcon size={14} color={adminColors.onBrand} />}
            </View>
            <Text style={styles.checkboxLabel}>
              I have confirmed the target audience (needed to publish).
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Button Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveAndPublish}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save & Publish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '700',
    marginBottom: adminSpacing.sm,
  },
  fieldCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
  },
  fieldGroup: {
    gap: adminSpacing.xs,
  },
  label: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  textInput: {
    flex: 1,
    height: 46,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  inputWithBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  fieldActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    height: 46,
    backgroundColor: adminColors.card,
  },
  fieldActionBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  uploadBox: {
    height: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  uploadText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  textArea: {
    height: 80,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  codePermanentNote: {
    ...adminType.caption,
    color: adminColors.muted,
    fontStyle: 'italic',
  },
  inputWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingRight: adminSpacing.sm,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
  },
  dropdownBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  dropdownArrow: {
    color: adminColors.muted,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: adminRadius.xs,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  checkboxLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    flex: 1,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 90,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
});

