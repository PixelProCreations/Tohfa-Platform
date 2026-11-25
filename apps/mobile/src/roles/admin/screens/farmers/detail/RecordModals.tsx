/**
 * The design's record sheets for the Farm & land and Soil tabs: "FMB Sketch
 * preview", "Mark as verified?", "Flag a discrepancy?" and "Request a
 * correction?". Owner: "just bring the design, we will decide later".
 *
 * They are gated only by viewing the page (access.canUseRecordDesignActions =
 * farmer.profile.view_all). There is no permission code and no endpoint for
 * any of them, so confirming only raises the visible not-available notice: no
 * plot or soil status changes and nothing claims success. The FMB sketch file
 * has no API either, so the preview shows the "no file" line.
 */
// DESIGN-ONLY: no endpoint yet, owner decision pending. Plot/soil Verify, Flag a
// discrepancy and Request a correction need a BR, rbac codes and endpoints first.
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { DocumentIcon } from './icons';
import { designActionNeedsReason, type DesignAction, type DesignActionState } from './model';
import { BottomSheet, NoticeBox } from './parts';
import { detailStyles as s } from './styles';

export function RecordModals({ state, dispatch }: { state: DesignActionState; dispatch: (action: DesignAction) => void }) {
  const close = () => dispatch({ type: 'close' });
  const kind = state.kind;

  if (kind === 'preview') {
    return (
      <BottomSheet visible onClose={close} title={t('farmerDetail.modal.previewTitle')}>
        <View style={s.previewCard}>
          <DocumentIcon size={38} color={adminColors.muted} />
          <Text style={s.previewTitle}>{state.record}</Text>
          <Text style={s.previewFile}>{t('farmerDetail.modal.fileUnavailable')}</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={close} activeOpacity={0.8} accessibilityRole="button">
          <Text style={s.closeBtnText}>{t('farmerDetail.form.close')}</Text>
        </TouchableOpacity>
      </BottomSheet>
    );
  }

  if (kind !== 'verify' && kind !== 'flag' && kind !== 'correction') return null;

  const title =
    kind === 'verify'
      ? t('farmerDetail.modal.verifyTitle')
      : kind === 'flag'
        ? t('farmerDetail.modal.flagTitle')
        : t('farmerDetail.modal.correctionTitle');
  const confirmLabel =
    kind === 'verify'
      ? t('farmerDetail.modal.markVerified')
      : kind === 'flag'
        ? t('farmerDetail.modal.flag')
        : t('farmerDetail.modal.sendRequest');
  const needsReason = designActionNeedsReason(kind);

  return (
    <BottomSheet visible onClose={close} title={title}>
      <View style={[s.summaryCard, s.summaryRow, s.tableRowLast]}>
        <Text style={s.summaryLabel}>{t('farmerDetail.modal.record')}</Text>
        <Text style={s.summaryValue}>{state.record}</Text>
      </View>

      {needsReason ? (
        <>
          <Text style={s.inputLabel}>
            {t('farmerDetail.form.reason')} <Text style={s.requiredStar}>{t('farmerDetail.form.required')}</Text>
          </Text>
          <TextInput
            style={s.textArea}
            multiline
            numberOfLines={3}
            placeholder={kind === 'flag' ? t('farmerDetail.modal.flagPlaceholder') : t('farmerDetail.modal.correctionPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={state.reason}
            onChangeText={(value) => dispatch({ type: 'reason', value })}
          />
          {state.reasonMissing ? <Text style={s.errorText}>{t('farmerDetail.form.reasonMissing')}</Text> : null}
        </>
      ) : (
        <Text style={s.note}>{t('farmerDetail.modal.recorded')}</Text>
      )}

      {/* DESIGN-ONLY: no endpoint yet, owner decision pending. The confirm only shows this note. */}
      {state.notice ? <NoticeBox text={t('farmerDetail.designOnly.notAvailable')} /> : null}

      <View style={[s.modalButtonsRow, needsReason && s.modalButtonsSpaced]}>
        <TouchableOpacity
          style={[s.outlineModalBtn, state.notice && s.modalBtnDisabled]}
          onPress={() => dispatch({ type: 'confirm' })}
          disabled={state.notice}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={s.outlineModalBtnText}>{confirmLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.outlineModalBtn} onPress={close} activeOpacity={0.8} accessibilityRole="button">
          <Text style={s.outlineModalBtnText}>{t('farmerDetail.form.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
