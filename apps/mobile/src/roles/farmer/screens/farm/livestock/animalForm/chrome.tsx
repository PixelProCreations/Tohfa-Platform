import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { af } from './i18n';
import { ArrowBackIcon, CameraIcon, CheckIcon, CloseIcon, PawPrintIcon } from './icons';
import {
  GENDER_OPTIONS,
  genderLabel,
  organicStatusLabel,
  SPECIES_OPTIONS,
  speciesLabel,
  STATUS_OPTIONS,
} from './model';
import { editPickerStyles, HIT_SLOP_CLOSE, HIT_SLOP_HEADER, registerPickerStyles, styles } from './styles';
import type { AnimalForm, AnimalFormValues } from './useAnimalForm';
import { appAlert } from '@tohfa/mobile-ui';

// ── Header ───────────────────────────────────────────────────────────────────

export function AnimalFormHeader({
  title,
  subtitle,
  onBack,
  onCancel,
}: {
  title: string;
  subtitle: React.ReactNode;
  onBack?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
}): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack || onCancel}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onCancel || onBack}
        activeOpacity={0.7}
        hitSlop={HIT_SLOP_HEADER}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.common.cancel')}
      >
        <Text style={styles.cancelButtonText}>{t('farmer.common.cancel')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────

/** Photo upload is not wired yet; both options are placeholders. */
function showAnimalPhotoOptions(): void {
  appAlert(
    af('photo.title'),
    af('photo.message'),
    [
      { text: af('photo.takePhoto'), onPress: () => {} },
      { text: af('photo.chooseGallery'), onPress: () => {} },
      { text: t('farmer.common.cancel'), style: 'cancel' },
    ],
    { tone: 'info' },
  );
}

export function AnimalAvatar({ hint }: { hint: string }): React.JSX.Element {
  return (
    <View style={styles.avatarSection}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={showAnimalPhotoOptions}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={af('photo.changeA11y')}
      >
        <View style={styles.avatarCircle}>
          <PawPrintIcon size={30} color={P.twAmber800} />
        </View>

        <View style={styles.cameraBadge}>
          <CameraIcon size={13} color={P.white} />
        </View>
      </TouchableOpacity>

      <Text style={styles.avatarHint}>{hint}</Text>
    </View>
  );
}

// ── Bottom submit bar ────────────────────────────────────────────────────────

export function SubmitBar({
  label,
  isSubmitting,
  onPress,
}: {
  label: string;
  isSubmitting: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={P.white} />
        ) : (
          <Text style={styles.saveButtonText}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Option pickers ───────────────────────────────────────────────────────────

/** 'register': header row + close button + check mark. 'edit': plain list, tap anywhere to close. */
export type PickerVariant = 'register' | 'edit';

interface OptionPickerProps<V extends string> {
  variant: PickerVariant;
  visible: boolean;
  title: string;
  options: readonly V[];
  selected: string;
  labelFor: (value: V) => string;
  onSelect: (value: V) => void;
  onClose: () => void;
}

function OptionPickerModal<V extends string>(props: OptionPickerProps<V>): React.JSX.Element {
  const { visible, onClose } = props;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {props.variant === 'register' ? <RegisterPicker {...props} /> : <EditPicker {...props} />}
    </Modal>
  );
}

function RegisterPicker<V extends string>({
  title,
  options,
  selected,
  labelFor,
  onSelect,
  onClose,
}: OptionPickerProps<V>) {
  const insets = useSafeAreaInsets();
  const s = registerPickerStyles;
  return (
    <View style={s.modalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={[s.modalCard, { marginTop: insets.top, marginBottom: insets.bottom }]}>
        <View style={s.modalHeaderRow}>
          <Text style={s.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={HIT_SLOP_CLOSE}>
            <CloseIcon size={18} color={P.twGray400} />
          </TouchableOpacity>
        </View>
        {options.map((opt) => {
          const isSelected = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[s.modalOption, isSelected && s.modalOptionSelected]}
              onPress={() => onSelect(opt)}
              activeOpacity={0.7}
            >
              <Text style={[s.modalOptionText, isSelected && s.modalOptionTextSelected]}>{labelFor(opt)}</Text>
              {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function EditPicker<V extends string>({ title, options, selected, labelFor, onSelect, onClose }: OptionPickerProps<V>) {
  const insets = useSafeAreaInsets();
  const s = editPickerStyles;
  return (
    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={[s.modalCard, { marginTop: insets.top, marginBottom: insets.bottom }]}>
        <Text style={s.modalTitle}>{title}</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[s.modalOption, selected === opt && s.modalOptionSelected]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[s.modalOptionText, selected === opt && s.modalOptionTextSelected]}>{labelFor(opt)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
}

/** The species / gender / organic-status pickers, driven by `form.state.openPicker`. */
export function AnimalOptionPickers({ form, variant }: { form: AnimalForm; variant: PickerVariant }): React.JSX.Element {
  const { state, patch } = form;
  const close = () => patch({ openPicker: null });
  const choose = (p: Partial<AnimalFormValues>) => patch({ ...p, openPicker: null });

  return (
    <>
      <OptionPickerModal
        variant={variant}
        visible={state.openPicker === 'species'}
        title={af('picker.species')}
        options={SPECIES_OPTIONS}
        selected={state.species}
        labelFor={speciesLabel}
        onSelect={(species) => choose({ species })}
        onClose={close}
      />
      <OptionPickerModal
        variant={variant}
        visible={state.openPicker === 'gender'}
        title={af('picker.gender')}
        options={GENDER_OPTIONS}
        selected={state.gender}
        labelFor={genderLabel}
        onSelect={(gender) => choose({ gender })}
        onClose={close}
      />
      <OptionPickerModal
        variant={variant}
        visible={state.openPicker === 'status'}
        title={af('picker.organicStatus')}
        options={STATUS_OPTIONS}
        selected={state.organicStatus}
        labelFor={organicStatusLabel}
        onSelect={(organicStatus) => choose({ organicStatus })}
        onClose={close}
      />
    </>
  );
}
