/**
 * The one add-record modal behind every "Add" button on AnimalDetailScreen's
 * tabs. Which fields it shows, their starting values and the validation all
 * come from animalRecordForms.ts (mirroring the server's zod schemas), so this
 * file is only the form chrome: inputs, chips, the optional attachment, the
 * save button and its error.
 *
 * Mounted only while open (the parent renders it conditionally), so each
 * opening starts from fresh values.
 *
 * Double submit: a ref guards the save, not only the disabled button, because
 * two taps can land before React re-renders the button as disabled.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, type LayoutChangeEvent, type ScrollViewInstance, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Input, ModalSafeArea } from '@tohfa/mobile-ui';
import { authPalette as P, colors, radius, spacing, typography, weights } from '../../../theme';
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { todayInKolkata } from '../../certifications/certificationForm';
import { pickAnimalAttachment, uploadAnimalAttachment, type PickedAttachment } from './animalAttachment';
import {
  buildRecord,
  formFields,
  initialFormValues,
  productionUnderWithdrawal,
  recordFormAcceptsAttachment,
  saveAnimalRecord,
  serverFieldErrors,
  submitErrorMessage,
  valuesForRecordType,
  type FieldErrors,
  type FieldSpec,
  type RecordFormKind,
  type SavedRecord,
} from './animalRecordForms';
import { formatDayMonth } from './animalRecordView';

const TITLE_KEYS: Record<RecordFormKind, TranslationKey> = {
  health: 'farmer.livestock.detail.form.title.health',
  breeding: 'farmer.livestock.detail.form.title.breeding',
  feedPlan: 'farmer.livestock.detail.form.title.feedPlan',
  feedLog: 'farmer.livestock.detail.form.title.feedLog',
  housing: 'farmer.livestock.detail.form.title.housing',
  hygiene: 'farmer.livestock.detail.form.title.hygiene',
  production: 'farmer.livestock.detail.form.title.production',
};

export interface AnimalRecordFormModalProps {
  kind: RecordFormKind;
  animalId: string;
  /** The animal's BR-138 withdrawal date: the production form warns before saving (BR-139). */
  withdrawalUntil?: string | null | undefined;
  onClose: () => void;
  onSaved: (saved: SavedRecord) => void;
}

const ID = 'animalRecordForm';

function withoutKey(errors: FieldErrors, name: string): FieldErrors {
  const next = { ...errors };
  delete next[name];
  return next;
}

export function AnimalRecordFormModal({
  kind,
  animalId,
  withdrawalUntil = null,
  onClose,
  onSaved,
}: AnimalRecordFormModalProps): React.JSX.Element {
  const today = useMemo(() => todayInKolkata(), []);
  const [values, setValues] = useState<Record<string, string>>(() => initialFormValues(kind, today));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [attachment, setAttachment] = useState<PickedAttachment | null>(null);

  const fields = formFields(kind, values);
  const acceptsAttachment = recordFormAcceptsAttachment(kind);
  const showWithdrawalWarning =
    kind === 'production' && productionUnderWithdrawal(withdrawalUntil, values['loggedOn'] ?? '', today);

  const scrollRef = useRef<ScrollViewInstance>(null);
  // Each field block's y inside the ScrollView content, for scrolling to the first invalid one.
  const fieldY = useRef<Record<string, number>>({});

  /**
   * The error `name` would have for `candidate` values, using the same rules as
   * submit (buildRecord) so blur, typing and submit can never disagree. Only
   * this field's message is read: the other fields are not yet "touched".
   */
  const errorFor = (name: string, candidate: Record<string, string>): string | undefined => {
    const built = buildRecord(kind, candidate, animalId);
    return built.ok ? undefined : built.errors[name];
  };

  const setValue = (name: string, value: string) => {
    const next = name === 'recordType' ? valuesForRecordType(kind, values, value, today) : { ...values, [name]: value };
    setValues(next);
    setErrors((prev) => {
      if (name === 'recordType') return prev;
      if (!(name in prev)) return prev;
      // An error clears the moment the value is valid; while it is still invalid the message tracks the new text.
      const live = errorFor(name, next);
      const copy = { ...prev };
      if (live === undefined) delete copy[name];
      else copy[name] = live;
      return copy;
    });
  };

  const blurField = (name: string) => {
    const message = errorFor(name, values);
    setErrors((prev) => {
      if (message === undefined) return name in prev ? withoutKey(prev, name) : prev;
      return prev[name] === message ? prev : { ...prev, [name]: message };
    });
  };

  const scrollToFirstInvalid = (invalid: FieldErrors) => {
    const first = fields.find((f) => f.name in invalid);
    if (!first) return;
    const y = fieldY.current[first.name];
    if (y === undefined) return;
    // A little headroom so the label is not flush against the top edge.
    scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.lg), animated: true });
  };

  const pickAttachment = async () => {
    setSubmitError('');
    const outcome = await pickAnimalAttachment();
    if (outcome.kind === 'picked') setAttachment(outcome.file);
    else if (outcome.kind === 'tooLarge') setSubmitError(t('farmer.livestock.detail.form.attachment.tooLarge'));
    else if (outcome.kind === 'failed') setSubmitError(t('farmer.livestock.detail.form.attachment.pickFailed'));
  };

  const submit = async () => {
    if (submittingRef.current) return;
    const built = buildRecord(kind, values, animalId);
    if (!built.ok) {
      setErrors(built.errors);
      setSubmitError(t('farmer.livestock.detail.form.error.fixForm'));
      scrollToFirstInvalid(built.errors);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    setErrors({});
    const sendAttachment = acceptsAttachment && attachment !== null;
    try {
      let uploadId: string | undefined;
      if (sendAttachment) {
        try {
          uploadId = await uploadAnimalAttachment(attachment);
        } catch {
          setSubmitError(t('farmer.livestock.detail.form.attachment.uploadFailed'));
          return;
        }
      }
      const saved = await saveAnimalRecord(built.record, animalId, uploadId);
      onSaved(saved);
    } catch (err: unknown) {
      setSubmitError(submitErrorMessage(kind, err, sendAttachment));
      const rejected = serverFieldErrors(err, fields);
      setErrors(rejected);
      scrollToFirstInvalid(rejected);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ModalSafeArea style={local.sheet}>
        <View style={local.container} testID={`${ID}.${kind}`}>
          <View style={local.header}>
            <Text style={local.title}>{t(TITLE_KEYS[kind])}</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.livestock.detail.form.close')}
              testID={`${ID}.close`}
              style={local.closeBtn}
            >
              <Text style={local.closeText}>{t('farmer.livestock.detail.form.close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={local.body} keyboardShouldPersistTaps="handled">
            {showWithdrawalWarning && withdrawalUntil ? (
              <View style={local.warning} accessibilityLiveRegion="polite" testID={`${ID}.withdrawalWarning`}>
                <Text style={local.warningText}>
                  {t('farmer.livestock.detail.form.production.withdrawalWarning', { date: formatDayMonth(withdrawalUntil) })}
                </Text>
              </View>
            ) : null}

            {fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={values[field.name] ?? ''}
                error={errors[field.name]}
                onChange={(v) => setValue(field.name, v)}
                onBlur={() => blurField(field.name)}
                onBlockLayout={(y) => {
                  fieldY.current[field.name] = y;
                }}
              />
            ))}

            {acceptsAttachment ? (
              <View style={local.fieldBlock}>
                <Text style={local.label}>{t('farmer.livestock.detail.form.attachment.label')}</Text>
                {attachment ? (
                  <View style={local.attachmentRow} testID={`${ID}.attachment`}>
                    <Text style={local.attachmentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setAttachment(null)}
                      disabled={submitting}
                      accessibilityRole="button"
                      testID={`${ID}.removeAttachment`}
                    >
                      <Text style={local.linkText}>{t('farmer.livestock.detail.form.attachment.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={local.attachBtn}
                    onPress={() => void pickAttachment()}
                    disabled={submitting}
                    accessibilityRole="button"
                    testID={`${ID}.attach`}
                  >
                    <Text style={local.linkText}>{t('farmer.livestock.detail.form.attachment.add')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {submitError ? (
              <View style={local.errorBanner} accessibilityLiveRegion="polite">
                <Text style={local.errorBannerText} testID={`${ID}.error`}>
                  {submitError}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={local.footer}>
            <Button
              title={t('farmer.livestock.detail.form.cancel')}
              variant="outline"
              onPress={onClose}
              disabled={submitting}
              style={local.footerBtn}
              testID={`${ID}.cancel`}
            />
            <Button
              title={t('farmer.livestock.detail.form.save')}
              onPress={() => void submit()}
              disabled={submitting}
              loading={submitting}
              style={local.footerBtn}
              testID={`${ID}.submit`}
            />
          </View>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}

function FormField({
  field,
  value,
  error,
  onChange,
  onBlur,
  onBlockLayout,
}: {
  field: FieldSpec;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
  onBlockLayout: (y: number) => void;
}): React.JSX.Element {
  const labelText = `${t(field.label)}${field.required ? ` ${t('farmer.livestock.detail.form.requiredMark')}` : ''}`;
  const errorText = error ? (
    <Text style={local.fieldError} testID={`${ID}.fieldError.${field.name}`}>
      {error}
    </Text>
  ) : null;

  const blockProps = {
    style: local.fieldBlock,
    testID: `${ID}.block.${field.name}`,
    onLayout: (e: LayoutChangeEvent) => onBlockLayout(e.nativeEvent.layout.y),
  };

  switch (field.kind) {
    case 'choice':
      return (
        <View {...blockProps}>
          <Text style={local.label}>{labelText}</Text>
          <View style={local.chipRow}>
            {field.options.map((opt) => {
              const selected = value === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[local.chip, selected && local.chipSelected]}
                  // An optional choice can be cleared by tapping it again.
                  onPress={() => onChange(selected && !field.required ? '' : opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  testID={`${ID}.option.${field.name}.${opt.value}`}
                >
                  <Text style={[local.chipText, selected && local.chipTextSelected]}>{t(opt.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errorText}
        </View>
      );
    case 'toggle': {
      const on = value === 'true';
      return (
        <View {...blockProps}>
          <TouchableOpacity
            style={local.toggleRow}
            onPress={() => onChange(on ? '' : 'true')}
            accessibilityRole="switch"
            accessibilityState={{ checked: on }}
            testID={`${ID}.field.${field.name}`}
          >
            <Text style={local.label}>{labelText}</Text>
            <View style={[local.chip, on && local.chipSelected]}>
              <Text style={[local.chipText, on && local.chipTextSelected]}>
                {on ? t('farmer.livestock.detail.form.yes') : t('farmer.livestock.detail.form.no')}
              </Text>
            </View>
          </TouchableOpacity>
          {errorText}
        </View>
      );
    }
    default: {
      const placeholder =
        field.kind === 'date'
          ? t('farmer.livestock.detail.form.datePlaceholder')
          : field.kind === 'time'
            ? t('farmer.livestock.detail.form.timePlaceholder')
            : undefined;
      const multiline = field.kind === 'text' && field.multiline === true;
      return (
        <View {...blockProps}>
          <Input
            label={labelText}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            keyboardType={field.kind === 'number' ? 'decimal-pad' : field.kind === 'text' ? 'default' : 'numbers-and-punctuation'}
            maxLength={field.kind === 'text' ? field.maxLength : undefined}
            multiline={multiline}
            containerStyle={local.inputContainer}
            testID={`${ID}.field.${field.name}`}
          />
          {errorText}
        </View>
      );
    }
  }
}

const local = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  title: {
    flex: 1,
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: P.nearBlack,
  },
  closeBtn: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
  },
  closeText: {
    fontSize: typography.body,
    fontWeight: weights.semibold,
    color: colors.brandGreen,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: 0,
  },
  label: {
    fontSize: typography.bodySmall,
    fontWeight: weights.medium,
    color: P.twGray700,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: P.white,
  },
  chipSelected: {
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandGreenLight,
  },
  chipText: {
    fontSize: typography.bodySmall,
    color: P.twGray700,
  },
  chipTextSelected: {
    color: colors.brandGreen,
    fontWeight: weights.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldError: {
    fontSize: typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  attachBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: P.twGray300,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  attachmentName: {
    flex: 1,
    fontSize: typography.body,
    color: P.nearBlack,
  },
  linkText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    color: colors.brandGreen,
  },
  warning: {
    backgroundColor: P.twOrange50,
    borderWidth: 1,
    borderColor: P.twOrange200,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    color: P.twOrange700,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed200,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorBannerText: {
    fontSize: typography.bodySmall,
    color: P.twRed700,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  footerBtn: {
    flex: 1,
  },
});
