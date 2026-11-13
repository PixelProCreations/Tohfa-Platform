import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P, colors } from '../../../../theme';
import type { FormAction, FormState, SalaryType } from './formReducer';
import { CalendarIcon, ChevronDownIcon, PdfDocIcon } from './icons';
import { aw } from './i18n';
import { styles } from './styles';
import type { FieldValidation } from '../../../../utils/validation';
import {
  WORKER_ACCOUNT_MAX_LENGTH,
  WORKER_IFSC_MAX_LENGTH,
  WORKER_NAME_MAX_LENGTH,
  WORKER_UPI_MAX_LENGTH,
  WORKER_WAGE_MAX_CHARS,
  type WorkerField,
} from './workerRules';

interface Props {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  validation: FieldValidation<WorkerField>;
  onUploadDoc: () => void;
}

// Example amounts shown as placeholders; numeric, not translatable text.
const WAGE_PLACEHOLDER: Record<SalaryType, string> = { daily: '450', monthly: '12000' };

export function WorkerFormFields({ state, dispatch, validation, onUploadDoc }: Props): React.JSX.Element {
  const { name, dob, gender, idProofName, accountNo, ifsc, upiId, salaryType, wageAmount } = state;
  const patch = (p: Partial<FormState>) => dispatch({ type: 'patch', patch: p });
  const fieldError = (field: WorkerField) => {
    const message = validation.messageFor(field);
    return message ? <Text style={styles.fieldErrorText}>{message}</Text> : null;
  };

  const segment = (type: SalaryType, label: string) => (
    <TouchableOpacity
      style={[styles.salarySegmentBtn, salaryType === type && styles.salarySegmentBtnActive]}
      onPress={() => patch({ salaryType: type })}
      activeOpacity={0.8}
    >
      <Text style={[styles.salarySegmentText, salaryType === type && styles.salarySegmentTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.formContainer}>
      {/* Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {aw('nameLabel')} <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={styles.textInput}
          value={name}
          onChangeText={(v) => patch({ name: v })}
          placeholder={aw('namePlaceholder')}
          placeholderTextColor={P.twGray400}
          autoCapitalize="words"
          maxLength={WORKER_NAME_MAX_LENGTH}
          onBlur={() => validation.onBlur('name')}
        />
        {fieldError('name')}
      </View>

      {/* Date of Birth & Gender */}
      <View style={styles.twoColumnRow}>
        <View style={styles.columnField}>
          <Text style={styles.fieldLabel}>{aw('dobLabel')}</Text>
          <TouchableOpacity
            style={styles.pickerInputBox}
            activeOpacity={0.8}
            onPress={() => dispatch({ type: 'openDatePicker' })}
          >
            <Text style={styles.pickerValueText}>{dob}</Text>
            <CalendarIcon size={18} color={P.twGray400} />
          </TouchableOpacity>
        </View>

        <View style={styles.columnField}>
          <Text style={styles.fieldLabel}>{aw('genderLabel')}</Text>
          <TouchableOpacity
            style={styles.pickerInputBox}
            activeOpacity={0.8}
            onPress={() => patch({ isGenderPickerOpen: true })}
          >
            <Text style={styles.pickerValueText}>{aw(`gender.${gender}`)}</Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ID Proof (Aadhaar) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{aw('idProofLabel')}</Text>
        <TouchableOpacity
          style={styles.dashedFileContainer}
          onPress={onUploadDoc}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={aw('idProofA11y')}
        >
          <PdfDocIcon size={20} color={colors.brandGreen} />
          <Text style={styles.fileNameText} numberOfLines={1}>
            {idProofName}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Payment Details */}
      <Text style={styles.sectionHeaderTitle}>{aw('paymentSection')}</Text>

      <View style={styles.twoColumnRow}>
        <View style={styles.columnField}>
          <Text style={styles.fieldLabel}>{aw('accountNoLabel')}</Text>
          <TextInput
            style={styles.textInput}
            value={accountNo}
            onChangeText={(v) => patch({ accountNo: v })}
            placeholder={aw('accountNoPlaceholder')}
            placeholderTextColor={P.twGray400}
            maxLength={WORKER_ACCOUNT_MAX_LENGTH}
            keyboardType="number-pad"
            onBlur={() => validation.onBlur('accountNo')}
          />
          {fieldError('accountNo')}
        </View>

        <View style={styles.columnField}>
          <Text style={styles.fieldLabel}>{aw('ifscLabel')}</Text>
          <TextInput
            style={styles.textInput}
            value={ifsc}
            onChangeText={(v) => patch({ ifsc: v })}
            placeholder={aw('ifscPlaceholder')}
            placeholderTextColor={P.twGray400}
            autoCapitalize="characters"
            maxLength={WORKER_IFSC_MAX_LENGTH}
            autoCorrect={false}
            onBlur={() => validation.onBlur('ifsc')}
          />
          {fieldError('ifsc')}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{aw('upiLabel')}</Text>
        <TextInput
          style={styles.textInput}
          value={upiId}
          onChangeText={(v) => patch({ upiId: v })}
          placeholder={aw('upiPlaceholder')}
          placeholderTextColor={P.twGray400}
          autoCapitalize="none"
          keyboardType="email-address"
          maxLength={WORKER_UPI_MAX_LENGTH}
          onBlur={() => validation.onBlur('upiId')}
        />
        {fieldError('upiId')}
      </View>

      {/* Salary */}
      <Text style={styles.sectionHeaderTitle}>{aw('salarySection')}</Text>

      <View style={styles.salarySegmentContainer}>
        {segment('daily', aw('dailyWage'))}
        {segment('monthly', aw('monthlySalary'))}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {salaryType === 'daily' ? aw('dailyRateLabel') : aw('monthlyAmountLabel')}
        </Text>
        <TextInput
          style={styles.textInput}
          value={wageAmount}
          onChangeText={(v) => patch({ wageAmount: v })}
          placeholder={WAGE_PLACEHOLDER[salaryType]}
          placeholderTextColor={P.twGray400}
          keyboardType="decimal-pad"
          maxLength={WORKER_WAGE_MAX_CHARS}
          onBlur={() => validation.onBlur('wageAmount')}
        />
        {fieldError('wageAmount')}
      </View>
    </View>
  );
}
