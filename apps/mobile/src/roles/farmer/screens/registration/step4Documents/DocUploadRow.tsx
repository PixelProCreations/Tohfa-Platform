import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, type useTheme } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import { s4 } from './i18n';
import { styles, HIT_SLOP_8 } from './styles';
import type { DocState } from './types';

// ─── Sub-component: single document upload row ────────────────────────────────

export interface DocUploadRowProps {
  label: string;
  required: boolean;
  hint: string;
  doc: DocState;
  fieldError?: string | undefined;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onRemove: () => void;
  /**
   * Present only for the gated rows (ID Proof, Farm Documents). Its presence -- not `subType`'s
   * value -- is what turns on the "pick a type before upload" behaviour below; Certification
   * passes neither prop and renders exactly as it did before this feature.
   */
  onSelectType?: (() => void) | undefined;
  /** The document sub-type currently chosen for this row, if any (e.g. "Aadhaar Card"). */
  subType?: string | undefined;
}

export function DocUploadRow({
  label,
  required,
  hint,
  doc,
  fieldError,
  colors,
  onPress,
  onRemove,
  onSelectType,
  subType,
}: DocUploadRowProps) {
  const isGated = !!onSelectType;
  const needsTypeSelection = isGated && !subType;

  if (doc.fileUrl) {
    return (
      <View
        style={[
          styles.docCard,
          styles.docCardActive,
          { backgroundColor: colors.white, borderColor: colors.brandGreen },
        ]}
      >
        <View style={styles.uploadedRow}>
          <View style={[styles.uploadedCheckCircle, { backgroundColor: colors.brandGreenLight }]}>
            <Icon name="check" size={20} color={colors.brandGreen} />
          </View>
          <View style={styles.uploadedInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.docCardTitle, { color: colors.textDark }]}>{label}</Text>
              {required ? (
                <Text style={[styles.requiredMark, { color: colors.requiredRed }]}> *</Text>
              ) : null}
            </View>

            {isGated && subType ? (
              <View style={[styles.uploadedBadge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.uploadedBadgeText, { color: colors.brandGreen }]}>{subType}</Text>
              </View>
            ) : null}

            <Text style={[styles.uploadedFileName, { color: colors.textSubtle }]} numberOfLines={1}>
              {doc.file?.name ?? s4('documentUploaded')} ·{' '}
              <Text style={[styles.savedMark, { color: colors.brandGreen }]}>{s4('saved')}</Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRemove}
            style={[styles.removeButton, { backgroundColor: colors.borderSoft }]}
            hitSlop={HIT_SLOP_8}
            accessibilityRole="button"
            accessibilityLabel={s4('removeUploaded', { label })}
          >
            <Icon name="close" size={18} color={colors.textSubtle} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (doc.uploading) {
    return (
      <View
        style={[
          styles.docCard,
          styles.docCardActive,
          { backgroundColor: colors.white, borderColor: colors.brandGreen },
        ]}
      >
        <View style={styles.uploadingHeader}>
          <ActivityIndicator size="small" color={colors.brandGreen} />
          <Text style={[styles.uploadingTitle, { color: colors.textDark }]}>
            {s4('uploading', { name: subType || label, percent: doc.progress })}
          </Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.borderMedium }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${doc.progress}%` as `${number}%`, backgroundColor: colors.brandGreen },
            ]}
          />
        </View>
      </View>
    );
  }

  const pillColor = subType ? colors.brandGreen : P.amberDeep;

  return (
    <View
      style={[
        styles.docCard,
        {
          backgroundColor: colors.white,
          borderColor: fieldError ? colors.requiredRed : colors.borderLight,
        },
      ]}
    >
      {/* 1. Header: Document Title & Type Selector Pill */}
      <View style={styles.docCardHeader}>
        <View style={styles.docCardHeaderText}>
          <View style={styles.titleRow}>
            <Text style={[styles.docCardTitle, { color: colors.textDark }]}>{label}</Text>
            {required ? (
              <Text style={[styles.requiredMark, { color: colors.requiredRed }]}> *</Text>
            ) : (
              <Text style={[styles.optionalBadge, { color: colors.textSubtle }]}>
                {' '}
                {t('farmer.registration.step4.optional')}
              </Text>
            )}
          </View>
          <Text style={[styles.docCardHint, { color: colors.textSubtle }]}>{hint}</Text>
        </View>

        {isGated ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.subTypePill,
              subType
                ? { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen }
                : { backgroundColor: P.amber50, borderColor: P.amber200 },
            ]}
            onPress={onSelectType}
            accessibilityRole="button"
            accessibilityLabel={s4('selectTypeFor', { label })}
          >
            <Text style={[styles.subTypePillText, { color: pillColor }]} numberOfLines={1}>
              {subType ? subType : s4('chooseType')}
            </Text>
            <Icon name="expand_more" size={16} color={pillColor} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 2. Upload Zone */}
      <TouchableOpacity
        activeOpacity={0.75}
        style={[
          styles.uploadZone,
          { borderColor: colors.borderMedium, backgroundColor: colors.bgLight },
        ]}
        onPress={needsTypeSelection ? onSelectType : onPress}
        accessibilityRole="button"
        accessibilityLabel={s4('uploadLabel', { name: subType || label })}
      >
        <View style={[styles.uploadIconCircle, { backgroundColor: colors.brandGreenLight }]}>
          <Icon name="upload" size={22} color={colors.brandGreen} />
        </View>

        <Text style={[styles.uploadPromptText, { color: colors.textDark }]}>
          {needsTypeSelection
            ? s4('tapSelectType')
            : subType
            ? s4('tapUploadNamed', { name: subType })
            : s4('tapUploadFile')}
        </Text>
        <Text style={[styles.uploadFormatText, { color: colors.textSubtle }]}>{s4('formats')}</Text>
      </TouchableOpacity>

      {/* Errors */}
      {doc.error ? (
        <Text style={[styles.uploadErrorText, { color: colors.requiredRed }]}>{doc.error}</Text>
      ) : null}
      {fieldError ? (
        <Text style={[styles.uploadErrorText, { color: colors.requiredRed }]}>{fieldError}</Text>
      ) : null}
    </View>
  );
}
