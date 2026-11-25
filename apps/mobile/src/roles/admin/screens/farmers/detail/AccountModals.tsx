/**
 * The design's two account-lifecycle sheets: "Deactivate this account?" and
 * "Disable this account?" (two different states in the design), each with a
 * summary table, a required reason and an optional internal note.
 *
 * The Personal tab opens them only for access.canDeactivate /
 * access.canDisable. There is no disable/deactivate endpoint yet, so the
 * confirm button only raises the visible not-available notice
 * (designActionReducer); it never calls onDisable, never changes the shown
 * status and never claims success.
 */
// DESIGN-ONLY: no endpoint yet, owner decision pending. Wire Disable to its
// endpoint (farmer.account.disable) and Deactivate once the owner defines the
// state and its rbac code (farmer.account.deactivate), each with an audit_log row.
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { FarmerDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { accountBadge, type DesignAction, type DesignActionState } from './model';
import { BottomSheet, NoticeBox } from './parts';
import { detailStyles as s } from './styles';

const NOTE_MAX = 200;

export function AccountModals({
  farmer,
  state,
  dispatch,
}: {
  farmer: FarmerDetailView;
  state: DesignActionState;
  dispatch: (action: DesignAction) => void;
}) {
  const kind = state.kind === 'deactivate' || state.kind === 'disable' ? state.kind : null;
  const isDeactivate = kind === 'deactivate';
  const from = accountBadge(farmer.status).label;
  const close = () => dispatch({ type: 'close' });

  return (
    <BottomSheet
      visible={kind !== null}
      onClose={close}
      title={isDeactivate ? t('farmerDetail.account.deactivateTitle') : t('farmerDetail.account.disableTitle')}
    >
      <View style={s.summaryCard}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>{t('farmerDetail.account.rowName')}</Text>
          <Text style={s.summaryValue}>{t('farmerDetail.header.subtitle', { name: farmer.name, code: farmer.farmerCode })}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>{t('farmerDetail.account.rowAction')}</Text>
          <Text style={s.summaryValue}>
            {isDeactivate ? t('farmerDetail.account.actionDeactivate') : t('farmerDetail.account.actionDisable')}
          </Text>
        </View>
        <View style={[s.summaryRow, s.tableRowLast]}>
          <Text style={s.summaryLabel}>{t('farmerDetail.account.rowStatus')}</Text>
          <Text style={s.summaryValue}>
            {isDeactivate ? t('farmerDetail.account.statusDeactivate', { from }) : t('farmerDetail.account.statusDisable', { from })}
          </Text>
        </View>
      </View>

      <Text style={s.inputLabel}>
        {t('farmerDetail.form.reason')} <Text style={s.requiredStar}>{t('farmerDetail.form.required')}</Text>
      </Text>
      <TextInput
        style={s.textArea}
        multiline
        numberOfLines={3}
        placeholder={
          isDeactivate ? t('farmerDetail.account.reasonPlaceholderDeactivate') : t('farmerDetail.account.reasonPlaceholderDisable')
        }
        placeholderTextColor={adminColors.placeholder}
        value={state.reason}
        onChangeText={(value) => dispatch({ type: 'reason', value })}
      />
      {state.reasonMissing ? <Text style={s.errorText}>{t('farmerDetail.form.reasonMissing')}</Text> : null}

      <Text style={[s.inputLabel, s.inputLabelSpaced]}>{t('farmerDetail.form.internalNote')}</Text>
      <TextInput
        style={s.textArea}
        multiline
        numberOfLines={3}
        maxLength={NOTE_MAX}
        placeholder={t('farmerDetail.form.internalNotePlaceholder')}
        placeholderTextColor={adminColors.placeholder}
        value={state.note}
        onChangeText={(value) => dispatch({ type: 'note', value })}
      />
      <Text style={s.inputHelper}>{t('farmerDetail.form.noteHelper')}</Text>

      {/* DESIGN-ONLY: no endpoint yet, owner decision pending. The confirm only shows this note. */}
      {state.notice ? <NoticeBox text={t('farmerDetail.designOnly.notAvailable')} /> : null}

      <View style={s.modalButtonsRow}>
        <TouchableOpacity
          style={[s.primaryModalBtn, state.notice && s.modalBtnDisabled]}
          onPress={() => dispatch({ type: 'confirm' })}
          disabled={state.notice}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={s.primaryModalBtnText}>
            {isDeactivate ? t('farmerDetail.account.actionDeactivate') : t('farmerDetail.account.actionDisable')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.outlineModalBtn} onPress={close} activeOpacity={0.8} accessibilityRole="button">
          <Text style={s.outlineModalBtnText}>{t('farmerDetail.form.cancel')}</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
