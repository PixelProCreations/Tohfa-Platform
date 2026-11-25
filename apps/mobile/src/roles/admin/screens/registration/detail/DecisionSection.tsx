/**
 * 07 · Decision & Notes, wired to POST /admin/farmer-applications/{id}/notes (BR-218),
 * showing the structured `reviewHistory` (transitions + notes).
 */
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ApplicationReviewHistoryItemDto } from '../../../api/farmerApplications';
import { REVIEW_NOTE_MAX } from '../../../api/farmerApplications';
import { useAddApplicationNote } from '../../../api/farmerHooks';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { InfoRow, SectionHeading } from '../applications/ApplicationParts';
import { applicationErrorKey, dayOrDash, orDash, statusLabel } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';

export type DecisionState = 'pending' | 'approved' | 'rejected';

export interface DecisionSectionProps {
  app: ApplicationDetailView;
  state: DecisionState;
  applicationId?: string | undefined;
  canAddNote?: boolean | undefined;
}

function historyTitle(entry: ApplicationReviewHistoryItemDto): string {
  if (entry.eventType === 'NOTE') return t('farmerApps.decision.noteTag');
  if (entry.fromStatus !== null) {
    return t('farmerApps.decision.transitionLabel', {
      from: statusLabel(entry.fromStatus),
      to: statusLabel(entry.toStatus),
    });
  }
  return t('farmerApps.decision.initialTransition', { to: statusLabel(entry.toStatus) });
}

export function DecisionSection({
  app,
  state,
  applicationId,
  canAddNote = false,
}: DecisionSectionProps) {
  const [noteText, setNoteText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const addNote = useAddApplicationNote(canAddNote ? (applicationId ?? app.id) : undefined);
  const canWrite = Boolean(canAddNote && !app.isDraft && state === 'pending');
  const canSave = canWrite && !addNote.isPending;
  const history = app.reviewHistory ?? [];

  const handleSaveNote = () => {
    if (!canSave) return;
    const trimmed = noteText.trim();
    if (trimmed.length === 0) {
      setValidationError(t('farmerApps.decision.noteEmpty'));
      setSavedNotice(false);
      return;
    }
    setValidationError(null);
    setSavedNotice(false);
    addNote.run({ note: trimmed }, () => {
      addNote.finish();
      setNoteText('');
      setSavedNotice(true);
    });
  };

  return (
    <>
      <SectionHeading label={t('farmerApps.section.decision')} />
      <View style={detailStyles.decisionSection}>
        {state === 'rejected' ? (
          <View style={detailStyles.rejectedReasonRow}>
            <InfoRow label={t('farmerApps.decision.rejectedReason')} value={orDash(app.rejectionReason)} wide last />
          </View>
        ) : null}

        <Text style={detailStyles.fieldLabel}>{t('farmerApps.decision.reviewNotes')}</Text>
        <TextInput
          style={[detailStyles.notesInput, canWrite ? null : detailStyles.actionUnavailable]}
          editable={canWrite && !addNote.isPending}
          multiline
          maxLength={REVIEW_NOTE_MAX}
          value={noteText}
          onChangeText={(text) => {
            setNoteText(text);
            if (validationError !== null && text.trim().length > 0) setValidationError(null);
            if (savedNotice) setSavedNotice(false);
          }}
          placeholder={t('farmerApps.decision.reviewNotesPlaceholder')}
          placeholderTextColor={adminColors.muted}
          accessibilityState={{ disabled: !canWrite }}
          accessibilityHint={!canAddNote ? t('farmerApps.decision.noteDenied') : undefined}
          testID="farmerApps.reviewNotes"
        />

        {validationError !== null ? <Text style={detailStyles.inlineErrorText}>{validationError}</Text> : null}
        {savedNotice ? <Text style={detailStyles.inlineSuccessText}>{t('farmerApps.decision.noteSaved')}</Text> : null}
        {addNote.error !== null && addNote.error !== undefined ? (
          <Text style={detailStyles.inlineErrorText}>{t(applicationErrorKey(addNote.error))}</Text>
        ) : null}

        <TouchableOpacity
          style={[detailStyles.saveProgressBtn, canSave ? null : detailStyles.actionUnavailable]}
          onPress={canSave ? handleSaveNote : undefined}
          disabled={!canSave}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave, busy: addNote.isPending }}
          accessibilityHint={!canAddNote ? t('farmerApps.decision.noteDenied') : undefined}
          testID="farmerApps.saveProgress"
        >
          <Text style={detailStyles.saveProgressBtnText}>
            {addNote.isPending ? t('farmerApps.decision.savingNote') : t('farmerApps.decision.saveProgress')}
          </Text>
        </TouchableOpacity>

        <View style={detailStyles.historyList} testID="farmerApps.reviewHistory">
          <Text style={detailStyles.historyHeading}>{t('farmerApps.decision.reviewHistory')}</Text>
          {history.length === 0 ? (
            <Text style={detailStyles.historyEmptyText}>{t('farmerApps.decision.noHistory')}</Text>
          ) : (
            history.map((entry, idx) => (
              <View key={entry.id ?? `${entry.createdAt}-${idx}`} style={detailStyles.historyItem}>
                <View style={detailStyles.historyMetaRow}>
                  <Text style={detailStyles.historyTitle}>{historyTitle(entry)}</Text>
                  <Text style={detailStyles.historyDate}>{dayOrDash(entry.createdAt)}</Text>
                </View>
                {entry.note ? <Text style={detailStyles.historyNote}>{entry.note}</Text> : null}
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );
}
