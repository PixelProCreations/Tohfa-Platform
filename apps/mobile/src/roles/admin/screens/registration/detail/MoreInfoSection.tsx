/**
 * 06 · Request more information, from the 2026-11-19 design.
 *
 * Layout only. The endpoint exists, but wiring it is the owner's separate
 * decision, so every control here is drawn as designed and disabled, with the
 * reason on screen — nothing in this section issues a request.
 *
 * What is real: the chips come from `missingCategories(app)`, so the form can
 * never offer to ask for something the applicant already supplied, and the
 * design's own fixed five-option chip list is not reproduced at all — it names
 * documents this application has no field for. When the server has recorded an
 * request, its own message is shown instead of a blank box.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { ApplicationDetailView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { Card, SectionHeading } from '../applications/ApplicationParts';
import { notAvailable } from '../applications/applicationLogic';
import { detailStyles } from './detailStyles';
import { missingCategories } from './documentReview';

/** The same category naming the documents section uses. */
function chipLabel(key: string): string {
  if (key === 'FMB_SKETCH') return t('farmerApps.doc.category.FMB_SKETCH');
  if (key === 'BANK_DETAILS') return t('farmerApps.doc.category.BANK_DETAILS');
  if (key === 'ID_PROOF') return t('farmerApps.doc.type.ID_PROOF');
  if (key === 'FARM_DOC') return t('farmerApps.doc.type.FARM_DOC');
  if (key === 'CERTIFICATE') return t('farmerApps.doc.type.CERTIFICATE');
  return t('farmerApps.doc.type.unknown');
}

export function MoreInfoSection({ app }: { app: ApplicationDetailView }) {
  const missing = missingCategories(app);
  const alreadyAsked = app.infoRequest !== null && app.infoRequest.trim() !== '';

  return (
    <>
      <SectionHeading label={t('farmerApps.section.moreInfo')} />
      <Card>
        <Text style={detailStyles.fieldLabel}>{t('farmerApps.moreInfo.missingHead')}</Text>
        {missing.length === 0 ? (
          <Text style={detailStyles.docSub}>{t('farmerApps.moreInfo.nothingMissing')}</Text>
        ) : (
          <View style={detailStyles.chipRow}>
            {missing.map((category) => (
              // DESIGN-ONLY: no endpoint yet, so the chips report what is missing and do not select.
              <View key={category.key} style={detailStyles.chip}>
                <Text style={detailStyles.chipText}>{chipLabel(category.key)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={detailStyles.fieldLabel}>{t('farmerApps.moreInfo.messageHead')}</Text>
        <View style={detailStyles.notesBox}>
          <Text style={detailStyles.notesText}>{alreadyAsked ? app.infoRequest : notAvailable()}</Text>
        </View>
        {alreadyAsked ? <Text style={detailStyles.caption}>{t('farmerApps.moreInfo.sentHead')}</Text> : null}

        {/* DESIGN-ONLY: no endpoint yet (requesting information is not wired from this screen). */}
        <TouchableOpacity
          style={[detailStyles.filledBtn, detailStyles.unavailable]}
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityHint={t('farmerApps.moreInfo.unavailable')}
          testID="farmerApps.sendMoreInfo"
        >
          <Text style={detailStyles.filledBtnText}>{t('farmerApps.moreInfo.send')}</Text>
        </TouchableOpacity>
        <Text style={detailStyles.caption}>{t('farmerApps.moreInfo.unavailable')}</Text>
      </Card>
    </>
  );
}
