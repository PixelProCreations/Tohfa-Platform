import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import type { PestCategory, PestLibraryEntry, PestSeverity } from '../../../../api/pest';
import type { CropItem } from '../../crops/cropItems';
import {
  CalendarIcon,
  CameraIcon,
  CameraPlusIcon,
  ChevronDownIcon,
  CloseIcon,
  FieldBoxIcon,
  PestBugIcon,
} from './icons';
import { styles } from './styles';
import { tr } from './constants';
import type { PestPhoto } from './useLogPestTreatmentForm';

const ICON_S = 12;
const ICON_M = 15;
const ICON_L = 16;
const ICON_XL = 18;
const ICON_CAMERA_PLUS = 24;

const SEVERITY_DOT_STYLE = {
  High: styles.severityDotHigh,
  Medium: styles.severityDotMedium,
  Low: styles.severityDotLow,
} as const;

function RequiredLabel({ text }: { text: string }): React.JSX.Element {
  return (
    <Text style={styles.label}>
      {text} <Text style={styles.requiredAsterisk}>*</Text>
    </Text>
  );
}

export function CropField({
  selectedCrop,
  onOpen,
}: {
  selectedCrop: CropItem | null;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        <FieldBoxIcon size={ICON_M} color={P.forestGreen} />
        <RequiredLabel text={tr('crop.label')} />
      </View>

      <TouchableOpacity
        style={styles.selectBoxGreen}
        onPress={onOpen}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={tr('crop.modalTitle')}
      >
        <Text style={styles.selectBoxText}>
          {selectedCrop ? `${selectedCrop.zone} (${selectedCrop.name})` : tr('crop.placeholder')}
        </Text>
        <ChevronDownIcon size={ICON_XL} color={P.forestGreen} />
      </TouchableOpacity>
    </View>
  );
}

export function PestField({
  selectedCrop,
  selectedPest,
  loading,
  error,
  onOpen,
}: {
  selectedCrop: CropItem | null;
  selectedPest: PestLibraryEntry | null;
  loading: boolean;
  error: string | null;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        <PestBugIcon size={ICON_L} color={P.deepPurple600} />
        <RequiredLabel text={tr('pest.label')} />
      </View>

      <TouchableOpacity
        style={styles.selectBoxPurple}
        onPress={onOpen}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={tr('pest.a11y')}
        disabled={loading}
      >
        <Text style={styles.selectBoxText}>
          {loading ? tr('pest.loading') : selectedPest?.name ?? tr('pest.noMatches')}
        </Text>
        <ChevronDownIcon size={ICON_XL} color={P.deepPurple600} />
      </TouchableOpacity>

      <Text style={styles.helpText}>
        {tr('pest.filteredHelp', { crop: selectedCrop?.name ?? tr('pest.thisCrop') })}
      </Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function PestInfoCard({ pest }: { pest: PestLibraryEntry }): React.JSX.Element {
  return (
    <View style={styles.pestInfoCard}>
      <View style={styles.pestInfoHeaderRow}>
        <View style={styles.pestTitleRow}>
          <View style={styles.redDot} />
          <Text style={styles.scientificNameText}>{pest.scientificName ?? pest.name}</Text>
        </View>

        {pest.season ? (
          <View style={styles.seasonBadge}>
            <CalendarIcon size={ICON_S} color={P.twGray500} />
            <Text style={styles.seasonBadgeText}>{pest.season}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.pestSubNote}>
        {tr('pest.subNote', { category: pest.category, risk: pest.riskLevel })}
      </Text>
    </View>
  );
}

export function TypeSeverityRow({
  category,
  severity,
  onOpenType,
  onOpenSeverity,
}: {
  category: PestCategory;
  severity: PestSeverity;
  onOpenType: () => void;
  onOpenSeverity: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.rowTwoCols}>
      <View style={styles.col}>
        <Text style={styles.subLabel}>{tr('type.label')}</Text>
        <TouchableOpacity
          style={styles.inputBox}
          onPress={onOpenType}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={tr('type.a11y')}
        >
          <Text style={styles.inputBoxText}>{category}</Text>
          <ChevronDownIcon size={ICON_XL} color={P.twGray500} />
        </TouchableOpacity>
      </View>

      <View style={styles.col}>
        <Text style={styles.subLabel}>{tr('severity.label')}</Text>
        <TouchableOpacity
          style={styles.inputBox}
          onPress={onOpenSeverity}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={tr('severity.a11y')}
        >
          <View style={styles.severityRow}>
            <View style={[styles.severityDot, SEVERITY_DOT_STYLE[severity]]} />
            <Text style={styles.inputBoxText}>{severity}</Text>
          </View>
          <ChevronDownIcon size={ICON_XL} color={P.twGray500} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function PhotoField({
  photo,
  onPick,
  onRemove,
}: {
  photo: PestPhoto | null;
  onPick: () => void;
  onRemove: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        <CameraIcon size={ICON_L} color={P.twGray600} />
        <Text style={styles.subLabelNoMargin}>{tr('photo.label')}</Text>
      </View>

      <View style={styles.photoRow}>
        {photo && (
          <View style={styles.photoThumbContainer}>
            <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={onRemove}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tr('photo.remove')}
            >
              <CloseIcon size={ICON_S} color={P.white} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.addPhotoBtn}
          onPress={onPick}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={tr('photo.attach')}
        >
          <CameraPlusIcon size={ICON_CAMERA_PLUS} color={P.deepPurple600} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
