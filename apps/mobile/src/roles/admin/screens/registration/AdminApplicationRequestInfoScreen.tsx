/**
 * Request More Info (POST /admin/farmer-applications/{id}/request-info,
 * farmer.application.request_info, Idempotency-Key), BR-217.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon, SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  INFO_MESSAGE_MAX,
  INFO_MESSAGE_MIN,
  type FarmerApplicationDto,
  type InfoRequestItem,
} from '../../api/farmerApplications';
import { useApplication, useRequestApplicationInfo } from '../../api/farmerHooks';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import { BackButtonCard } from './applications/ApplicationParts';
import { applicationAccess, applicationErrorKey } from './applications/applicationLogic';
import { ApplicantCard, applicantSummary, decisionStyles } from './applications/DecisionScreenParts';
import { FS, LH, RAD, SP } from './designMetrics';

/** The design's checklist, mapped to API `InfoRequestItem` values (BR-217). */
export const REQUEST_ITEMS: readonly {
  id: string;
  apiItem: InfoRequestItem;
  step: number;
  labelKey: TranslationKey;
}[] = [
  { id: 'fmb', apiItem: 'FMB_SKETCH', step: 3, labelKey: 'farmerApps.requestInfo.item.fmb' },
  { id: 'aadhaar', apiItem: 'AADHAAR', step: 4, labelKey: 'farmerApps.requestInfo.item.aadhaar' },
  { id: 'land_patta', apiItem: 'PATTA_CHITTA', step: 4, labelKey: 'farmerApps.requestInfo.item.landPatta' },
  { id: 'bank_passbook', apiItem: 'BANK_DETAILS', step: 1, labelKey: 'farmerApps.requestInfo.item.bankPassbook' },
  { id: 'crop_cert', apiItem: 'CERTIFICATE', step: 4, labelKey: 'farmerApps.requestInfo.item.cropCert' },
  { id: 'other', apiItem: 'OTHER', step: 4, labelKey: 'farmerApps.requestInfo.item.other' },
];

export interface AdminApplicationRequestInfoScreenProps {
  applicationId: string | undefined;
  /** Permission check from /auth/me. Missing = deny everything. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only (BR-30). */
  warehouseId?: string | undefined;
  onBack: () => void;
  /** Runs after the server recorded the request. */
  onSent?: ((result: FarmerApplicationDto) => void) | undefined;
}

export const AdminApplicationRequestInfoScreen: React.FC<AdminApplicationRequestInfoScreenProps> = ({
  applicationId,
  can,
  warehouseId,
  onBack,
  onSent,
}) => {
  const access = applicationAccess(can);
  const allowed = access.canView && access.canRequestInfo;
  const live = useApplication(warehouseId, allowed ? applicationId : undefined);
  const requestInfo = useRequestApplicationInfo(allowed ? applicationId : undefined);
  const app = live.application;
  const summary = applicantSummary(app);

  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState(false);

  const isReviewable = app === undefined ? true : !app.isDraft && (app.status === 'DOCS_REVIEW' || app.status === 'FARM_VERIFICATION');
  const canSend = allowed && isReviewable && !requestInfo.isPending && !sentResult;

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    if (validationError !== null) setValidationError(null);
  };

  const handleSend = () => {
    if (!canSend) return;
    if (selected.length === 0) {
      setValidationError(t('farmerApps.requestInfo.validation.items'));
      return;
    }
    const trimmed = message.trim();
    if (trimmed.length < INFO_MESSAGE_MIN) {
      setValidationError(t('farmerApps.requestInfo.validation.message', { min: INFO_MESSAGE_MIN }));
      return;
    }
    setValidationError(null);
    const chosen = REQUEST_ITEMS.filter((it) => selected.includes(it.id));
    const items = chosen.map((it) => it.apiItem);
    const requiredSteps = [...new Set(chosen.map((it) => it.step))];
    requestInfo.run({ items, message: trimmed, requiredSteps }, (result) => {
      requestInfo.finish();
      setSentResult(true);
      onSent?.(result);
    });
  };

  const hasServerError = requestInfo.error !== null && requestInfo.error !== undefined;

  return (
    <SafeAreaView style={decisionStyles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <View style={decisionStyles.header}>
        <BackButtonCard onPress={onBack} />
      </View>

      <ScrollView style={decisionStyles.container} contentContainerStyle={decisionStyles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={decisionStyles.title} accessibilityRole="header">
          {t('farmerApps.requestInfo.title')}
        </Text>

        {!allowed ? (
          <AdminEmptyState title={t('farmerApps.requestInfo.denied')} />
        ) : (
          <>
            <Text style={decisionStyles.subtitle}>{t('farmerApps.requestInfo.subtitle', { name: summary.name })}</Text>

            <ApplicantCard summary={summary} last />

            <View style={styles.noticeBanner}>
              <Icon name="info" size={SP.s16 + SP.s2} color={adminColors.info.text} style={styles.noticeIcon} />
              <Text style={styles.noticeText}>{t('farmerApps.requestInfo.notice')}</Text>
            </View>

            <Text style={decisionStyles.fieldLabel}>{t('farmerApps.requestInfo.itemsLabel')}</Text>
            <View style={styles.checklist}>
              {REQUEST_ITEMS.map((item) => {
                const checked = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.checkOption, checked ? styles.checkOptionSelected : null]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    testID={`farmerApps.requestInfo.item.${item.id}`}
                  >
                    <View style={[styles.checkBox, checked ? styles.checkBoxSelected : null]}>
                      {checked ? <Icon name="check" size={SP.s14} color={adminColors.onBrand} /> : null}
                    </View>
                    <Text style={[styles.checkText, checked ? styles.checkTextSelected : null]}>{t(item.labelKey)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={decisionStyles.fieldLabel}>{t('farmerApps.requestInfo.messageLabel')}</Text>
            <TextInput
              style={decisionStyles.notesInput}
              placeholder={t('farmerApps.requestInfo.messagePlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              multiline
              maxLength={INFO_MESSAGE_MAX}
              numberOfLines={3}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                if (validationError !== null && text.trim().length >= INFO_MESSAGE_MIN) setValidationError(null);
              }}
              testID="farmerApps.requestInfo.message"
            />

            {!isReviewable ? (
              <View style={decisionStyles.errorBox}>
                <Text style={decisionStyles.errorText}>{t('farmerApps.requestInfo.notReviewable')}</Text>
              </View>
            ) : null}

            {validationError !== null ? (
              <View style={decisionStyles.errorBox} accessibilityLiveRegion="polite">
                <Text style={decisionStyles.errorText}>{validationError}</Text>
              </View>
            ) : null}

            {hasServerError ? (
              <View style={decisionStyles.errorBox} accessibilityLiveRegion="polite">
                <Text style={decisionStyles.errorText}>{t(applicationErrorKey(requestInfo.error))}</Text>
              </View>
            ) : null}

            {sentResult ? (
              <View style={styles.noticeBanner} testID="farmerApps.requestInfo.sentNotice">
                <Icon name="check_circle" size={SP.s16 + SP.s2} color={adminColors.success.text} style={styles.noticeIcon} />
                <Text style={styles.noticeText}>{t('farmerApps.requestInfo.sentSuccess')}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[decisionStyles.primaryBtn, canSend ? null : decisionStyles.actionUnavailable]}
              onPress={canSend ? handleSend : undefined}
              disabled={!canSend}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend, busy: requestInfo.isPending }}
              testID="farmerApps.requestInfo.send"
            >
              <Icon name="mark_email_read" size={SP.s20} color={adminColors.onBrand} style={decisionStyles.primaryBtnIcon} />
              <Text style={decisionStyles.primaryBtnText}>
                {requestInfo.isPending ? t('farmerApps.requestInfo.sending') : t('farmerApps.requestInfo.send')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={decisionStyles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /**
   * The design names its notice colours P.noticeBg / P.noticeText, which its
   * palette never defines (so the design renders it transparent with default
   * text). The info pair is used: the banner reads as the informational note it is.
   */
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.info.bg,
    borderRadius: RAD.r14,
    padding: SP.s14,
    marginBottom: SP.s20,
  },
  noticeIcon: { marginRight: SP.s10, marginTop: SP.s1 },
  noticeText: { flex: 1, fontSize: FS.s12_5, lineHeight: LH.l18, color: adminColors.info.text },
  checklist: { gap: SP.s10, marginBottom: SP.s20 },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: RAD.r14,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    paddingHorizontal: SP.s14,
    paddingVertical: SP.s12,
  },
  checkOptionSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  checkBox: {
    width: SP.s20,
    height: SP.s20,
    borderRadius: RAD.r6,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SP.s12,
  },
  checkBoxSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brand },
  checkText: { flex: 1, fontSize: FS.s13_5, fontWeight: '600', color: adminColors.ink, lineHeight: LH.l18 },
  checkTextSelected: { color: adminColors.brand, fontWeight: '700' },
});
