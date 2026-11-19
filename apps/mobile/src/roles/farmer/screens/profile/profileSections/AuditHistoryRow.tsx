import React from 'react';
import { Text, View } from 'react-native';
import {
  auditConductedBy,
  auditDisplayDate,
  auditScore,
  type FarmerAuditSummary,
} from '../../../api/audits';
import { t } from '../../../../../i18n/farmer';
import { auditToneColor, auditTypeKey, formatShortDate } from './profileHelpers';
import { styles } from './profileStyles';

/** One real past-audit row -- score, auditor/findings and date all come from
 *  FarmerAuditSummary; shared by the inline Audits card and its modal so
 *  neither can drift back to a hardcoded sample. */
export function AuditHistoryRow({
  audit,
  isLast,
}: {
  audit: FarmerAuditSummary;
  isLast: boolean;
}): React.JSX.Element {
  const score = auditScore(audit);
  const conductedBy = auditConductedBy(audit);
  const tone = auditToneColor(audit.tier);
  const counts = t('farmer.profile.audits.majorMinorCount', {
    major: audit.findingCounts.major,
    minor: audit.findingCounts.minor,
  });
  return (
    <View style={[styles.auditItemRow, isLast ? styles.noBottomBorder : null]}>
      <View style={[styles.statusDot, { backgroundColor: tone }]} />
      <View style={styles.auditItemInfo}>
        <Text style={styles.auditItemDate}>
          {formatShortDate(auditDisplayDate(audit))} · {t(auditTypeKey(audit.auditType))}
        </Text>
        <Text style={styles.auditItemSubtext}>
          {conductedBy
            ? `${t('farmer.profile.audits.auditor', { name: conductedBy })} · ${counts}`
            : counts}
        </Text>
      </View>
      {score ? (
        <Text style={[styles.auditScore, { color: tone }]}>
          {t('farmer.profile.audits.scoreOutOf', { score: score.score, max: score.max })}
        </Text>
      ) : null}
    </View>
  );
}
