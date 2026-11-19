import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ModalSafeArea } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { CalendarPickerOverlay } from './CalendarPickerOverlay';
import {
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  InfoCircleIcon,
  SearchIcon,
} from './icons';
import { SEVERITY_LABEL_KEY } from './labels';
import { styles } from './styles';
import { useFieldValidation } from '../../../../utils/validation';
import { FieldErrorText } from '../../FieldErrorText';
import { REPORT_DETECTION_FIELD_ORDER, REPORT_DETECTION_RULES } from './reportValidation';
import { CROP_ZONE_OPTIONS, type PestSeverity, type ReportFormState } from './useReportForm';

const SEVERITY_OPTIONS: readonly PestSeverity[] = ['Low', 'Medium', 'High'];

/** "Report New Detection" modal. All state lives in `useReportForm`. */
export function ReportDetectionModal({ form }: { form: ReportFormState }): React.JSX.Element {
  const {
    isReportModalVisible,
    setIsReportModalVisible,
    newCropZone,
    setNewCropZone,
    isCropPickerOpen,
    setIsCropPickerOpen,
    newPestType,
    pestSuggestions,
    isPestSuggestionsOpen,
    newSeverity,
    setNewSeverity,
    newDate,
    newNotes,
    setNewNotes,
    newPhoto,
    setNewPhoto,
    savingDetection,
    saveDetectionError,
    isCalendarOpen,
    setIsCalendarOpen,
    handleSelectPestSuggestion,
    handlePestTypeChange,
    handlePestTypeFocus,
    handlePickPhoto,
    handleSaveDetection,
  } = form;

  const fieldValues = useMemo(() => ({ pestType: newPestType, notes: newNotes }), [newPestType, newNotes]);
  const validation = useFieldValidation({
    values: fieldValues,
    rules: REPORT_DETECTION_RULES,
    order: REPORT_DETECTION_FIELD_ORDER,
  });
  // A reopened modal starts clean, not with the previous attempt's errors showing.
  const { reset: resetValidation } = validation;
  useEffect(() => {
    if (!isReportModalVisible) resetValidation();
  }, [isReportModalVisible, resetValidation]);

  return (
    <Modal
      visible={isReportModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      // Android draws this window edge-to-edge (RN 0.88): make that explicit on
      // every version and let ModalSafeArea keep the header clear of the status
      // bar and the footer buttons clear of the navigation bar.
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => setIsReportModalVisible(false)}
    >
      <ModalSafeArea style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setIsReportModalVisible(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.close')}
          >
            <CloseIcon size={20} color={P.twGray700} />
          </TouchableOpacity>
          <View style={styles.modalHeaderTitleCol}>
            <Text style={styles.modalMainTitle}>{t('farmer.pestManagement.report.title')}</Text>
            <Text style={styles.modalSubtitle}>{newCropZone}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalFormContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add Photo Dashed Box */}
          {newPhoto ? (
            <View style={styles.photoPreviewRow}>
              <View style={styles.photoThumbContainer}>
                <Image source={{ uri: newPhoto.uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setNewPhoto(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t('farmer.pestManagement.report.removePhoto')}
                >
                  <CloseIcon size={12} color={P.white} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoUploadBox} activeOpacity={0.8} onPress={() => void handlePickPhoto()}>
              <CameraIcon size={28} color={colors.brandGreen} />
              <Text style={styles.photoUploadText}>{t('farmer.pestManagement.report.addPhoto')}</Text>
            </TouchableOpacity>
          )}

          {/* Crop / Zone Dropdown */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('farmer.pestManagement.report.cropZone')}</Text>
            <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.8} onPress={() => setIsCropPickerOpen(true)}>
              <Text style={styles.dropdownValueText}>{newCropZone}</Text>
              <ChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* Pest Type with Search Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t('farmer.pestManagement.report.pestType')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.searchInputBox}>
              <SearchIcon size={16} color={P.twGray400} />
              <TextInput
                style={styles.searchTextInput}
                value={newPestType}
                onChangeText={handlePestTypeChange}
                onBlur={() => validation.onBlur('pestType')}
                maxLength={120}
                onFocus={handlePestTypeFocus}
                placeholder={t('farmer.pestManagement.report.pestTypePlaceholder')}
                placeholderTextColor={P.twGray400}
              />
            </View>
            <FieldErrorText message={validation.messageFor('pestType')} />
            {isPestSuggestionsOpen && pestSuggestions.length > 0 ? (
              <View style={styles.pestSuggestionsBox}>
                {pestSuggestions.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={styles.pestSuggestionRow}
                    onPress={() => handleSelectPestSuggestion(entry)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pestSuggestionName}>{entry.name}</Text>
                    {entry.scientificName ? (
                      <Text style={styles.pestSuggestionScientific}>{entry.scientificName}</Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <View style={styles.infoCallout}>
              <InfoCircleIcon size={16} color={P.googleBlue} />
              <Text style={styles.infoCalloutText}>{t('farmer.pestManagement.report.libraryHint')}</Text>
            </View>
          </View>

          {/* Severity Segmented Toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t('farmer.pestManagement.report.severity')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.severityToggleRow}>
              {SEVERITY_OPTIONS.map((sev) => {
                const isSel = newSeverity === sev;
                return (
                  <TouchableOpacity
                    key={sev}
                    style={[
                      styles.severityToggleBtn,
                      isSel && sev === 'Low' && styles.severityToggleBtnLowActive,
                      isSel && sev === 'Medium' && styles.severityToggleBtnMedActive,
                      isSel && sev === 'High' && styles.severityToggleBtnHighActive,
                    ]}
                    onPress={() => setNewSeverity(sev)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.severityToggleText, isSel && styles.severityToggleTextActive]}>
                      {t(SEVERITY_LABEL_KEY[sev])}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Detected with Calendar Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {t('farmer.pestManagement.report.dateDetected')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TouchableOpacity style={styles.dropdownInput} activeOpacity={0.8} onPress={() => setIsCalendarOpen(true)}>
              <Text style={styles.dropdownValueText}>{newDate}</Text>
              <CalendarIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('farmer.pestManagement.report.notes')}</Text>
            <TextInput
              style={styles.notesInput}
              value={newNotes}
              onChangeText={setNewNotes}
              onBlur={() => validation.onBlur('notes')}
              maxLength={2000}
              placeholder={t('farmer.pestManagement.report.notesPlaceholder')}
              placeholderTextColor={P.twGray400}
              multiline
              numberOfLines={3}
            />
            <FieldErrorText message={validation.messageFor('notes')} />
          </View>

          {saveDetectionError ? <Text style={styles.saveErrorText}>{saveDetectionError}</Text> : null}
        </ScrollView>

        {/* Modal Bottom Actions */}
        <View style={styles.modalBottomBar}>
          <TouchableOpacity
            style={styles.modalCancelBtn}
            onPress={() => setIsReportModalVisible(false)}
            disabled={savingDetection}
          >
            <Text style={styles.modalCancelBtnText}>{t('farmer.pestManagement.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalSaveBtn, savingDetection && styles.modalSaveBtnSaving]}
            activeOpacity={0.85}
            onPress={() => {
              if (validation.validateAll().valid) void handleSaveDetection();
            }}
            disabled={savingDetection}
          >
            {savingDetection ? (
              <ActivityIndicator size="small" color={P.white} />
            ) : (
              <>
                <CheckIcon size={18} color={P.white} />
                <Text style={styles.modalSaveBtnText}>{t('farmer.pestManagement.report.save')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── In-Modal Crop / Zone Selector Overlay ── */}
        {isCropPickerOpen && (
          <View style={styles.inModalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsCropPickerOpen(false)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <Text style={styles.modalCardTitle}>{t('farmer.pestManagement.report.selectCropZone')}</Text>
                <TouchableOpacity onPress={() => setIsCropPickerOpen(false)}>
                  <CloseIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
              </View>
              {CROP_ZONE_OPTIONS.map((opt) => {
                const isSelected = newCropZone === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalCardOption, isSelected && styles.modalCardOptionSelected]}
                    onPress={() => {
                      setNewCropZone(opt);
                      setIsCropPickerOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalCardOptionText, isSelected && styles.modalCardOptionTextSelected]}>
                      {opt}
                    </Text>
                    {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {isCalendarOpen && <CalendarPickerOverlay form={form} />}
      </ModalSafeArea>
    </Modal>
  );
}
