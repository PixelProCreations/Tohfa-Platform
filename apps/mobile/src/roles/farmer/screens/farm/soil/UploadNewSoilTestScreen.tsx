import React, { useEffect } from 'react';
import {
  BackHandler,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Skeleton, DatePicker, SafeAreaView } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../theme';
import { BottomBar } from './uploadSoilTest/BottomBar';
import { DIM, ICON } from './uploadSoilTest/constants';
import { DateRow } from './uploadSoilTest/DateRow';
import { LabReportField } from './uploadSoilTest/LabReportField';
import { LimePickerModal } from './uploadSoilTest/LimePickerModal';
import { LimeStatusField } from './uploadSoilTest/LimeStatusField';
import { MeasuredValuesSection } from './uploadSoilTest/MeasuredValuesSection';
import { NutrientsSection } from './uploadSoilTest/NutrientsSection';
import { SuccessModal } from './uploadSoilTest/SuccessModal';
import { WaterContextBox } from './uploadSoilTest/WaterContextBox';
import { parseSoilDate } from './uploadSoilTest/dateUtils';
import { st } from './uploadSoilTest/i18n';
import { CloseIcon } from './uploadSoilTest/icons';
import { styles } from './uploadSoilTest/styles';
import { useSoilTestForm } from './uploadSoilTest/useSoilTestForm';

export interface UploadNewSoilTestScreenProps {
  /** The farm this test belongs to, threaded from SoilManagementScreen. */
  farmId: string;
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
  onNavigateToFieldContext?: (() => void) | undefined;
}

const DATE_FORMAT = 'DD/MM/YY';

export function UploadNewSoilTestScreen({
  farmId,
  onBack,
  onSave,
  onNavigateToFieldContext,
}: UploadNewSoilTestScreenProps): React.JSX.Element {
  const form = useSoilTestForm({ farmId, onBack, onSave });
  const { state, patch, setField } = form;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const saveDisabled = state.saving || state.plotLoading || !!state.plotLoadError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navCircleButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={st('a11y.back')}
        >
          <CloseIcon size={ICON.medium} color={P.twGreen700} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{st('header.title')}</Text>
          <Text style={styles.headerSubtitle}>{st('header.subtitle')}</Text>
        </View>
      </View>

      {state.plotLoading ? (
        <View style={styles.scrollContent}>
          <Skeleton height={DIM.skeletonInputHeight} width="100%" style={styles.skeletonSpacer} />
          <Skeleton height={DIM.skeletonCardHeight} width="100%" />
        </View>
      ) : state.plotLoadError ? (
        <View style={styles.scrollContent}>
          <Text style={styles.loadErrorText}>{state.plotLoadError}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <DateRow
            testDate={state.testDate}
            nextDue={state.nextDue}
            onChangeTestDate={(v) => setField('testDate', v)}
            onChangeNextDue={(v) => setField('nextDue', v)}
            onOpenTestDate={() => patch({ testDatePickerVisible: true })}
            onOpenNextDue={() => patch({ nextDuePickerVisible: true })}
            testDateError={form.validation.messageFor('testDate')}
            nextDueError={form.validation.messageFor('nextDue')}
            onBlurTestDate={() => form.validation.onBlur('testDate')}
            onBlurNextDue={() => form.validation.onBlur('nextDue')}
          />

          <MeasuredValuesSection
            organicCarbon={state.organicCarbon}
            ph={state.ph}
            ec={state.ec}
            tds={state.tds}
            onChangeOrganicCarbon={(v) => setField('organicCarbon', v)}
            onChangePh={(v) => setField('ph', v)}
            onChangeEc={(v) => setField('ec', v)}
            onChangeTds={(v) => setField('tds', v)}
            errors={{
              organicCarbon: form.validation.messageFor('organicCarbon'),
              ph: form.validation.messageFor('ph'),
              ec: form.validation.messageFor('ec'),
              tds: form.validation.messageFor('tds'),
            }}
            onBlurField={form.validation.onBlur}
          />

          <NutrientsSection
            nitrogen={state.nitrogen}
            phosphorus={state.phosphorus}
            potassium={state.potassium}
            onChangeNitrogen={(v) => setField('nitrogen', v)}
            onChangePhosphorus={(v) => setField('phosphorus', v)}
            onChangePotassium={(v) => setField('potassium', v)}
            errors={{
              nitrogen: form.validation.messageFor('nitrogen'),
              phosphorus: form.validation.messageFor('phosphorus'),
              potassium: form.validation.messageFor('potassium'),
            }}
            onBlurField={form.validation.onBlur}
          />

          <LimeStatusField
            limeStatus={state.limeStatus}
            onOpen={() => patch({ limePickerVisible: true })}
          />

          <WaterContextBox
            waterSourcesText={state.waterSourcesText}
            onEdit={onNavigateToFieldContext}
          />

          <LabReportField
            attachedDoc={state.attachedDoc}
            docPickError={state.docPickError}
            onPick={form.handlePickDocument}
            onRemove={() => patch({ attachedDoc: null })}
          />
        </ScrollView>
      )}

      <BottomBar
        saveError={state.saveError}
        saveDisabled={saveDisabled}
        saving={state.saving}
        onCancel={onBack}
        onSave={() => void form.handleSave()}
      />

      <LimePickerModal
        visible={state.limePickerVisible}
        selected={state.limeStatus}
        onSelect={(value) => patch({ limeStatus: value, limePickerVisible: false })}
        onClose={() => patch({ limePickerVisible: false })}
      />

      <DatePicker
        visible={state.testDatePickerVisible}
        onClose={() => patch({ testDatePickerVisible: false })}
        onSelect={(date) => form.handleSelectTestDate(date)}
        value={parseSoilDate(state.testDate)}
        title={st('picker.testDateTitle')}
        format={DATE_FORMAT}
      />

      <DatePicker
        visible={state.nextDuePickerVisible}
        onClose={() => patch({ nextDuePickerVisible: false })}
        onSelect={(date) => form.handleSelectNextDue(date)}
        value={parseSoilDate(state.nextDue)}
        title={st('picker.nextDueTitle')}
        format={DATE_FORMAT}
      />

      <SuccessModal data={state.savedSuccess} onClose={form.handleSuccessModalClose} />
    </SafeAreaView>
  );
}
