/**
 * Create Event, platform.event.manage. Save & Publish is POST
 * /admin/platform-events with isPublished = true. Event type and target
 * audience pick from the server's enums (calendar.schema.ts).
 */
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminErrorKey } from '../../api/errors';
import {
  PLATFORM_EVENT_AUDIENCES,
  PLATFORM_EVENT_TYPES,
  type PlatformEventAudience,
  type PlatformEventType,
} from '../../api/produce';
import { useCreatePlatformEvent } from '../../api/produceHooks';
import { BackArrowIcon, CalendarIcon, CheckmarkIcon, DownloadIcon, HistoryClockIcon, PlusIcon } from './produceIcons';
import { AUDIENCE_LABEL, EVENT_TYPE_LABEL } from './CropDataScreen';
import { nextOption, parseClock, parseDdMmYyyy } from './produceLogic';

export interface CreateEventScreenProps {
  can: Can;
  onBack: () => void;
  onSuccess?: (() => void) | undefined;
}

export function CreateEventScreen({ can, onBack, onSuccess }: CreateEventScreenProps): React.JSX.Element {
  const canManage = can('platform.event.manage');
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<PlatformEventType>(PLATFORM_EVENT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [registerLink, setRegisterLink] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [targetAudience, setTargetAudience] = useState<PlatformEventAudience>(PLATFORM_EVENT_AUDIENCES[0]);
  const [audienceConfirmed, setAudienceConfirmed] = useState(false);
  const createEvent = useCreatePlatformEvent();

  const handleSaveAndPublish = () => {
    if (!canManage) {
      Alert.alert(t('produce.permissionDenied.title'), t('produce.permissionDenied.platformEvents'));
      return;
    }
    if (!eventTitle.trim()) {
      Alert.alert(t('produce.required.title'), t('produce.required.eventTitle'));
      return;
    }
    const eventDate = parseDdMmYyyy(startDate);
    if (eventDate === null) {
      Alert.alert(t('produce.required.title'), t('produce.required.eventDate'));
      return;
    }
    const start = startTime.trim() === '' ? undefined : parseClock(startTime);
    const end = endTime.trim() === '' ? undefined : parseClock(endTime);
    if (start === null || end === null) {
      Alert.alert(t('produce.required.title'), t('produce.required.eventTime'));
      return;
    }
    if (!audienceConfirmed) {
      Alert.alert(t('produce.event.confirmTitle'), t('produce.event.confirmBody'));
      return;
    }
    createEvent.mutate(
      {
        title: eventTitle.trim(),
        description: description.trim() === '' ? undefined : description.trim(),
        eventType,
        eventDate,
        startTime: start,
        endTime: end,
        locationName: eventLocation.trim() === '' ? undefined : eventLocation.trim(),
        targetAudience,
        isPublished: true,
      },
      {
        onSuccess: () =>
          Alert.alert(t('produce.event.publishedTitle'), t('produce.event.publishedBody'), [
            { text: t('produce.ok'), onPress: () => (onSuccess ? onSuccess() : onBack()) },
          ]),
        onError: (err) => Alert.alert(t('produce.error.title'), t(adminErrorKey(err))),
      },
    );
  };

  const iconInput = (value: string, onChange: (v: string) => void, placeholder: string, icon: React.ReactNode) => (
    <View style={styles.inputWithIconRow}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
      />
      {icon}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('produce.back')}
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('produce.createEvent.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('produce.createEvent.section1')}</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.eventTitle')}</Text>
            <TextInput
              style={styles.textInput}
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder={t('produce.createEvent.eventTitlePlaceholder')}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.eventType')}</Text>
            <View style={styles.inputWithBtnRow}>
              <TouchableOpacity
                style={[styles.textInput, styles.pickerInput]}
                onPress={() => setEventType((cur) => nextOption(PLATFORM_EVENT_TYPES, cur) ?? PLATFORM_EVENT_TYPES[0])}
                activeOpacity={0.7}
              >
                <Text style={styles.pickerText}>{t(EVENT_TYPE_LABEL[eventType])}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fieldActionBtn} activeOpacity={0.7}>
                <PlusIcon size={14} color={adminColors.brand} />
                <Text style={styles.fieldActionBtnText}>{t('produce.add')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.banner')}</Text>
            <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
              <DownloadIcon size={20} color={adminColors.brand} />
              <Text style={styles.uploadText}>{t('produce.createEvent.upload')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.description')}</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder={t('produce.createEvent.descriptionPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.codePermanentNote}>{t('produce.createEvent.codeNote')}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.location')}</Text>
            <TextInput
              style={styles.textInput}
              value={eventLocation}
              onChangeText={setEventLocation}
              placeholder={t('produce.createEvent.locationPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.registerLink')}</Text>
            <TextInput
              style={styles.textInput}
              value={registerLink}
              onChangeText={setRegisterLink}
              placeholder={t('produce.createEvent.registerLinkPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>{t('produce.createEvent.section2')}</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.startDate')}</Text>
            {iconInput(startDate, setStartDate, t('produce.createEvent.datePlaceholder'), <CalendarIcon size={18} color={adminColors.muted} />)}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.endDate')}</Text>
            {iconInput(endDate, setEndDate, t('produce.createEvent.datePlaceholder'), <CalendarIcon size={18} color={adminColors.muted} />)}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.startTime')}</Text>
            {iconInput(startTime, setStartTime, t('produce.createEvent.timePlaceholder'), <HistoryClockIcon size={18} color={adminColors.muted} />)}
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.endTime')}</Text>
            {iconInput(endTime, setEndTime, t('produce.createEvent.timePlaceholder'), <HistoryClockIcon size={18} color={adminColors.muted} />)}
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>{t('produce.createEvent.section3')}</Text>
        <View style={styles.fieldCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{t('produce.createEvent.audience')}</Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() =>
                setTargetAudience((cur) => nextOption(PLATFORM_EVENT_AUDIENCES, cur) ?? PLATFORM_EVENT_AUDIENCES[0])
              }
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownBtnText}>{t(AUDIENCE_LABEL[targetAudience])}</Text>
              <Text style={styles.dropdownArrow}>{'▾'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setAudienceConfirmed((prev) => !prev)} activeOpacity={0.7}>
            <View style={[styles.checkbox, audienceConfirmed && styles.checkboxActive]}>
              {audienceConfirmed && <CheckmarkIcon size={14} color={adminColors.onBrand} />}
            </View>
            <Text style={styles.checkboxLabel}>{t('produce.createEvent.confirmAudience')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAndPublish} activeOpacity={0.8} disabled={createEvent.isPending}>
          <Text style={styles.saveBtnText}>{t('produce.createEvent.publish')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>{t('produce.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: { padding: adminSpacing.xs },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.md },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  sectionSpaced: { marginTop: adminSpacing.lg },
  fieldCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.md,
  },
  fieldGroup: { gap: adminSpacing.xs },
  label: { ...adminType.rowTitle, color: adminColors.ink },
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
  pickerInput: { justifyContent: 'center' },
  pickerText: { ...adminType.body, color: adminColors.ink },
  inputWithBtnRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
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
  fieldActionBtnText: { ...adminType.caption, color: adminColors.brand },
  uploadBox: {
    height: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  uploadText: { ...adminType.caption, color: adminColors.brand },
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
  codePermanentNote: { ...adminType.caption, color: adminColors.muted, fontStyle: 'italic' },
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
  dropdownBtnText: { ...adminType.body, color: adminColors.ink, fontWeight: '500' },
  dropdownArrow: { ...adminType.sectionHead, color: adminColors.muted },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
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
  checkboxActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  checkboxLabel: { ...adminType.caption, color: adminColors.ink, flex: 1 },
  bottomSpacer: { height: 90 },
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
  saveBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
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
  cancelBtnText: { ...adminType.rowTitle, color: adminColors.ink },
});
