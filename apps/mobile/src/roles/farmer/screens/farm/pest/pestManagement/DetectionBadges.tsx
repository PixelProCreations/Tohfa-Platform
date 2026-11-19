import React from 'react';
import { Text, View } from 'react-native';
import { t } from '../../../../../../i18n/farmer';
import type { PestDetection } from '../../../../api/pest';
import { labelFor, SEVERITY_LABEL_KEY, STATUS_LABEL_KEY } from './labels';
import { styles } from './styles';

interface DetectionBadgesProps {
  severity: PestDetection['severity'];
  status: PestDetection['status'];
  /** Detail view shows "<severity> Severity"; the list card shows the bare severity. */
  withSeveritySuffix?: boolean;
}

export function DetectionBadges({ severity, status, withSeveritySuffix = false }: DetectionBadgesProps): React.JSX.Element {
  const severityLabel = labelFor(SEVERITY_LABEL_KEY, severity, t);
  return (
    <View style={styles.badgesRow}>
      <View
        style={[
          styles.severityBadge,
          severity === 'High' && styles.severityBadgeHigh,
          severity === 'Medium' && styles.severityBadgeMed,
          severity === 'Low' && styles.severityBadgeLow,
        ]}
      >
        <Text
          style={[
            styles.severityBadgeText,
            severity === 'High' && styles.severityBadgeTextHigh,
            severity === 'Medium' && styles.severityBadgeTextMed,
            severity === 'Low' && styles.severityBadgeTextLow,
          ]}
        >
          {withSeveritySuffix
            ? t('farmer.pestManagement.severityWithSuffix', { severity: severityLabel })
            : severityLabel}
        </Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          status === 'Resolved' && styles.statusBadgeResolved,
          status === 'Recurring' && styles.statusBadgeRecurring,
          status === 'Ongoing' && styles.statusBadgeOngoing,
        ]}
      >
        <Text
          style={[
            styles.statusBadgeText,
            status === 'Resolved' && styles.statusBadgeTextResolved,
            status === 'Recurring' && styles.statusBadgeTextRecurring,
            status === 'Ongoing' && styles.statusBadgeTextOngoing,
          ]}
        >
          {labelFor(STATUS_LABEL_KEY, status, t)}
        </Text>
      </View>
    </View>
  );
}
