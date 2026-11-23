import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
  ChevronDownIcon,
  CloseIcon,
  DownloadIcon,
  HistoryClockIcon,
} from '../../components/AdminIcons';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';
import type { PlatformEventItem } from './CropDataScreen';

export interface CreateEventScreenProps {
  event?: PlatformEventItem | undefined;
  isViewOnly?: boolean | undefined;
  onBack: () => void;
  onSuccess?: ((savedEvent?: PlatformEventItem) => void) | undefined;
}

const EVENT_TYPE_OPTIONS = [
  'Training',
  'Workshop',
  'Webinar',
  'Field Day / Demonstration',
  'Farmer Meet',
  'Certification Drive',
  'Market Linkage Expo',
];

const TARGET_AUDIENCE_OPTIONS = [
  'All Farmers',
  'Selected Zones (Coonoor, Kotagiri)',
  'Certified Organic Only',
  'Horticulture Farmers',
];

interface DropdownModalState {
  key: 'eventType' | 'targetAudience';
  title: string;
  options: string[];
}

/**
 * Create Event screen
 * Matching exact reference mockup: Image 5 right
 */
export function CreateEventScreen({
  event,
  isViewOnly = false,
  onBack,
  onSuccess,
}: CreateEventScreenProps): React.JSX.Element {
  const isEditing = Boolean(event && !isViewOnly);
  const [eventTitle, setEventTitle] = useState(event?.title ?? 'Soil health workshop');
  const [eventType, setEventType] = useState(event?.eventType ?? 'Training');
  const [description, setDescription] = useState(
    event?.description ?? 'Interactive training session on organic soil fertility and NPK balance.'
  );
  const [eventLocation, setEventLocation] = useState(event?.location ?? 'Coonoor Sub-Warehouse Community Hall');
  const [registerLink, setRegisterLink] = useState('https://tohfa.org/events/soil-workshop');

  const [startDate, setStartDate] = useState(
    event?.startDate ? event.startDate.split(',')[0]?.trim() || '28-10-2026' : '28-10-2026'
  );
  const [endDate, setEndDate] = useState(
    event?.endDate ? event.endDate.split(',')[0]?.trim() || '28-10-2026' : '28-10-2026'
  );
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end' | null>(null);
  const [startTime, setStartTime] = useState(
    event?.startDate ? event.startDate.split(',')[1]?.trim() || '10:00 AM' : '10:00 AM'
  );
  const [endTime, setEndTime] = useState(
    event?.endDate ? event.endDate.split(',')[1]?.trim() || '01:00 PM' : '01:00 PM'
  );

  const [targetAudience, setTargetAudience] = useState(event?.targetAudience ?? 'All Farmers');
  const [audienceConfirmed, setAudienceConfirmed] = useState(true);
  const [activeModal, setActiveModal] = useState<DropdownModalState | null>(null);

  const handleSelectOption = (opt: string) => {
    if (!activeModal) return;
    if (activeModal.key === 'eventType') {
      setEventType(opt);
    } else if (activeModal.key === 'targetAudience') {
      setTargetAudience(opt);
    }
    setActiveModal(null);
  };

  const getSelectedValueForActiveModal = () => {
    if (!activeModal) return '';
    if (activeModal.key === 'eventType') return eventType;
    if (activeModal.key === 'targetAudience') return targetAudience;
    return '';
  };

  const handleSaveAndPublish = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Required Field', 'Please enter an Event Title.');
      return;
    }
    if (!audienceConfirmed) {
      Alert.alert('Confirmation Needed', 'Please confirm the target audience before publishing.');
      return;
    }

    const savedItem: PlatformEventItem = {
      id: event?.id ?? `evt-${Date.now()}`,
      code: event?.code ?? `EVT-0${Math.floor(Math.random() * 90 + 10)}`,
      title: eventTitle.trim(),
      eventType,
      startDate: `${startDate}, ${startTime}`,
      endDate: `${endDate}, ${endTime}`,
      targetAudience,
      status: event?.status ?? 'ACTIVE',
      createdBy: event?.createdBy ?? 'Demo Super Admin',
      lastUpdated: 'Today',
      description,
      location: eventLocation,
    };

    onSuccess?.(savedItem);
    onBack();
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
        <Text style={styles.headerTitle}>
          {isViewOnly ? 'Event Details' : isEditing ? 'Edit Platform Event' : 'Create Event'}
        </Text>
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
              style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="e.g. Soil health workshop"
              placeholderTextColor={adminColors.placeholder}
              editable={!isViewOnly}
            />
          </View>

          {/* Event Type Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Type *</Text>
            <TouchableOpacity
              style={[styles.dropdownBtn, isViewOnly && styles.readOnlyInput]}
              onPress={() =>
                !isViewOnly &&
                setActiveModal({
                  key: 'eventType',
                  title: 'Select Event Type',
                  options: EVENT_TYPE_OPTIONS,
                })
              }
              activeOpacity={0.7}
              disabled={isViewOnly}
            >
              <Text style={styles.dropdownBtnText}>{eventType}</Text>
              <ChevronDownIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
            </TouchableOpacity>
          </View>

          {/* Event Banner */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Banner</Text>
            <TouchableOpacity
              style={[styles.uploadBox, isViewOnly && styles.uploadBoxDisabled]}
              activeOpacity={0.7}
              disabled={isViewOnly}
            >
              <DownloadIcon size={20} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              <Text style={[styles.uploadText, isViewOnly && { color: adminColors.muted }]}>
                {isViewOnly ? 'Banner attached' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, isViewOnly && styles.readOnlyInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter event details..."
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isViewOnly}
            />
          </View>

          <Text style={styles.codePermanentNote}>
            The code is a permanent identifier and cannot be changed.
          </Text>

          {/* Event Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event Location</Text>
            <TextInput
              style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholder="e.g. Ooty Warehouse / Online"
              placeholderTextColor={adminColors.placeholder}
              editable={!isViewOnly}
            />
          </View>

          {/* Event register Link */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Event register Link</Text>
            <TextInput
              style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
              value={registerLink}
              onChangeText={setRegisterLink}
              placeholder="https://..."
              placeholderTextColor={adminColors.placeholder}
              editable={!isViewOnly}
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
                style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={adminColors.placeholder}
                editable={!isViewOnly}
              />
              <TouchableOpacity
                onPress={() => !isViewOnly && setCalendarTarget('start')}
                hitSlop={8}
                disabled={isViewOnly}
                accessibilityRole="button"
                accessibilityLabel="Pick start date"
              >
                <CalendarIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>End Date</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={adminColors.placeholder}
                editable={!isViewOnly}
              />
              <TouchableOpacity
                onPress={() => !isViewOnly && setCalendarTarget('end')}
                hitSlop={8}
                disabled={isViewOnly}
                accessibilityRole="button"
                accessibilityLabel="Pick end date"
              >
                <CalendarIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Start Time</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="--:-- --"
                placeholderTextColor={adminColors.placeholder}
                editable={!isViewOnly}
              />
              <HistoryClockIcon size={18} color={adminColors.muted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>End Time</Text>
            <View style={styles.inputWithIconRow}>
              <TextInput
                style={[styles.textInput, isViewOnly && styles.readOnlyInput]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="--:-- --"
                placeholderTextColor={adminColors.placeholder}
                editable={!isViewOnly}
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
              style={[styles.dropdownBtn, isViewOnly && styles.readOnlyInput]}
              onPress={() =>
                !isViewOnly &&
                setActiveModal({
                  key: 'targetAudience',
                  title: 'Select Target Audience',
                  options: TARGET_AUDIENCE_OPTIONS,
                })
              }
              activeOpacity={0.7}
              disabled={isViewOnly}
            >
              <Text style={styles.dropdownBtnText}>{targetAudience}</Text>
              <ChevronDownIcon size={18} color={isViewOnly ? adminColors.muted : adminColors.brand} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => !isViewOnly && setAudienceConfirmed(prev => !prev)}
            activeOpacity={0.7}
            disabled={isViewOnly}
          >
            <View
              style={[
                styles.checkbox,
                audienceConfirmed && styles.checkboxActive,
                isViewOnly && { opacity: 0.7 },
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
        {isViewOnly ? (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Close</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveAndPublish}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Update Event' : 'Save & Publish'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Dropdown Options Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeModal?.title}</Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close picker"
              >
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {activeModal?.options.map((opt) => {
                const isSelected = opt === getSelectedValueForActiveModal();
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalOptionRow, isSelected && styles.modalOptionRowSelected]}
                    onPress={() => handleSelectOption(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <CheckmarkIcon size={16} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <AdminCalendarPickerModal
        visible={calendarTarget !== null}
        value={calendarTarget === 'start' ? startDate : endDate}
        onSelect={(d) => {
          if (calendarTarget === 'start') setStartDate(d);
          else setEndDate(d);
        }}
        onClose={() => setCalendarTarget(null)}
      />
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
  readOnlyInput: {
    backgroundColor: '#F7F5EE',
    borderColor: '#E8E3D9',
    color: adminColors.muted,
  },
  uploadBoxDisabled: {
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingBottom: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  modalTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 340,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    marginVertical: 2,
  },
  modalOptionRowSelected: {
    backgroundColor: adminColors.brandTint,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalOptionTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
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

