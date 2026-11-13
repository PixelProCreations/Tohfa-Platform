import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { ICON } from './constants';
import { HintBadge, HintRow } from './HintBadge';
import { CloseIcon, CloudUploadIcon, DocIcon, PdfFileIcon } from './icons';
import { st } from './i18n';
import { styles } from './styles';
import type { AttachedDoc } from './useSoilTestForm';

interface Props {
  attachedDoc: AttachedDoc | null;
  docPickError: string | null;
  onPick: () => void;
  onRemove: () => void;
}

export function LabReportField({
  attachedDoc,
  docPickError,
  onPick,
  onRemove,
}: Props): React.JSX.Element {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <DocIcon size={ICON.small} color={P.twGray600} />
        <Text style={styles.inputLabel}>{` ${st('lab.label')}`}</Text>
      </View>

      {attachedDoc ? (
        <View style={styles.docCard}>
          <View style={styles.docIconBox}>
            <PdfFileIcon size={ICON.doc} color={P.white} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName} numberOfLines={1}>
              {attachedDoc.name}
            </Text>
            <Text style={styles.docMeta}>{attachedDoc.size}</Text>
          </View>
          <TouchableOpacity
            style={styles.docRemoveBtn}
            onPress={onRemove}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={st('a11y.removeDocument')}
          >
            <CloseIcon size={ICON.small} color={P.twRed600} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadBox}
          activeOpacity={0.8}
          onPress={onPick}
          accessibilityRole="button"
          accessibilityLabel={st('a11y.chooseLabReport')}
        >
          <CloudUploadIcon size={ICON.upload} color={P.twGreen600} />
          <Text style={styles.uploadTitle}>{st('lab.chooseFile')}</Text>
          <Text style={styles.uploadSubtitle}>{st('lab.chooseFileHint')}</Text>
        </TouchableOpacity>
      )}
      {docPickError ? (
        <HintRow>
          <HintBadge kind="warn" text={docPickError} />
        </HintRow>
      ) : null}
    </View>
  );
}
