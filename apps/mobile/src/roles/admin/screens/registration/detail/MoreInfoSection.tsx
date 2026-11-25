/**
 * 06 · Request More Information, drawn as the design draws it: "What is
 * missing?" chips, "Message to the applicant", and the outlined "Send Request
 * for Information" button.
 *
 * As in the design, that button opens the Request More Info screen
 * (AdminApplicationRequestInfoScreen), whose own Send is the request. Opening
 * it calls no API; it needs farmer.application.request_info.
 *
 * The inline chips and message box are drawn but disabled: nothing typed here
 * could be sent (the request endpoint is being wired separately), and none is
 * pre-selected — the design's two selected chips and its message were demo
 * values. When the server has already recorded a request, its message is
 * shown in the box, read-only.
 */
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { InfoRequestItem } from '../../../api/farmerApplications';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors } from '../../../theme';
import { Card, SectionHeading } from '../applications/ApplicationParts';
import { detailStyles } from './detailStyles';

/** The design's "What is missing?" options, in its order. */
export const MISSING_OPTIONS: readonly { key: string; apiItem: InfoRequestItem; labelKey: TranslationKey }[] = [
  { key: 'identityProof', apiItem: 'AADHAAR', labelKey: 'farmerApps.moreInfo.option.identityProof' },
  { key: 'fmbSketch', apiItem: 'FMB_SKETCH', labelKey: 'farmerApps.moreInfo.option.fmbSketch' },
  { key: 'landProof', apiItem: 'PATTA_CHITTA', labelKey: 'farmerApps.moreInfo.option.landProof' },
  { key: 'bankDetails', apiItem: 'BANK_DETAILS', labelKey: 'farmerApps.moreInfo.option.bankDetails' },
  { key: 'other', apiItem: 'OTHER', labelKey: 'farmerApps.moreInfo.option.other' },
];

export interface MoreInfoSectionProps {
  app: ApplicationDetailView;
  /** Opens the Request More Info screen; undefined = the admin may not request information or stage disallows. */
  onOpenRequestInfo: (() => void) | undefined;
}

export function MoreInfoSection({ app, onOpenRequestInfo }: MoreInfoSectionProps) {
  const sent =
    (app.infoRequestDetail?.message ?? null) !== null && app.infoRequestDetail!.message!.trim() !== ''
      ? app.infoRequestDetail!.message!
      : app.infoRequest !== null && app.infoRequest.trim() !== ''
        ? app.infoRequest
        : undefined;
  const requestedItems = new Set(app.infoRequestDetail?.items ?? []);
  const canOpen = onOpenRequestInfo !== undefined;
  const isWaiting = app.status === 'INFO_REQUESTED';

  return (
    <>
      <SectionHeading label={t('farmerApps.section.moreInfo')} />
      <Card>
        {isWaiting && requestedItems.size > 0 ? (
          <Text style={detailStyles.gateWarningText}>
            {t('farmerApps.moreInfo.openRequest', { items: [...requestedItems].join(', ') })}
          </Text>
        ) : null}

        <Text style={detailStyles.reqSubHead}>{t('farmerApps.moreInfo.missingHead')}</Text>
        <View style={detailStyles.chipsContainer}>
          {MISSING_OPTIONS.map((option) => {
            const highlighted = requestedItems.has(option.apiItem);
            return (
              <TouchableOpacity
                key={option.key}
                style={[detailStyles.chipPill, highlighted ? detailStyles.statusOptionItemSelected : detailStyles.actionUnavailable]}
                disabled
                accessibilityRole="button"
                accessibilityState={{ disabled: true, selected: highlighted }}
                testID={`farmerApps.moreInfo.chip.${option.key}`}
              >
                <Text style={[detailStyles.chipPillText, highlighted ? detailStyles.statusOptionTextSelected : null]}>
                  {t(option.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[detailStyles.reqSubHead, detailStyles.reqSubHeadSpaced]}>{t('farmerApps.moreInfo.messageHead')}</Text>
        <TextInput
          style={[detailStyles.messageInput, sent === undefined ? detailStyles.actionUnavailable : null]}
          editable={false}
          multiline
          value={sent}
          placeholder={t('farmerApps.moreInfo.messagePlaceholder')}
          placeholderTextColor={adminColors.muted}
          accessibilityState={{ disabled: true }}
          accessibilityHint={sent === undefined ? undefined : t('farmerApps.moreInfo.sentHead')}
          testID="farmerApps.moreInfo.message"
        />

        <TouchableOpacity
          style={[detailStyles.sendRequestBtn, canOpen ? null : detailStyles.actionUnavailable]}
          onPress={onOpenRequestInfo}
          disabled={!canOpen}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canOpen }}
          testID="farmerApps.openRequestInfo"
        >
          <Text style={detailStyles.sendRequestBtnText}>{t('farmerApps.moreInfo.send')}</Text>
        </TouchableOpacity>
      </Card>
    </>
  );
}
