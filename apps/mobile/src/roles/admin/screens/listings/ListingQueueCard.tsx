/**
 * One card of the design's Listing Approval Queue: crop icon, "crop — qty",
 * price per kg with the ceiling under it, farmer name and code, grade badge,
 * and the Approve / Counter / Reject row. Values come from the live row; a
 * value the API did not send renders as the dash.
 *
 * Each action button is drawn only with its own code (`access`), and the row
 * is hidden for a BR-29 routed-away listing (the design's isOwnListing).
 * Approve is drawn but disabled when the host gave no destination warehouse
 * (the spec requires one and the design has no picker).
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import type { ListingQueueRow } from '../../api/listings';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { formatPerKg, formatQuantityKg, type ListingAccess } from './listingsLogic';
import { gradeLabel } from './listingsLabels';
import { styles } from './listingsStyles';

export interface ListingQueueCardProps {
  row: ListingQueueRow;
  access: ListingAccess;
  canApprove: boolean;
  busy: boolean;
  onApprove: (row: ListingQueueRow) => void;
  onCounter: (row: ListingQueueRow) => void;
  onReject: (row: ListingQueueRow) => void;
}

export function ListingQueueCard({ row, access, canApprove, busy, onApprove, onCounter, onReject }: ListingQueueCardProps) {
  const dash = t('listingsAdmin.noValue');
  const price = formatPerKg(row.askingPrice);
  const ceiling = formatPerKg(row.ceilingPrice);
  const showActions = !row.routedAway && (access.approve || access.counter || access.reject);
  const approveDisabled = busy || !canApprove;

  return (
    <View style={styles.listingCard} testID={`listingsAdmin.card.${row.id}`}>
      <View style={styles.iconBox}>
        <Icon name="eco" size={20} color={adminColors.brand} />
      </View>

      <View style={styles.listingContent}>
        <View style={styles.listingHeader}>
          <Text style={styles.cropName}>
            {t('listingsAdmin.card.cropQty', { crop: row.cropName ?? dash, qty: formatQuantityKg(row.quantityKg) ?? dash })}
          </Text>
          <View style={styles.priceColumn}>
            <Text style={styles.priceAmount}>{price === null ? dash : t('listingsAdmin.card.perKg', { price })}</Text>
            <Text style={styles.ceilingText}>{t('listingsAdmin.card.ceiling', { price: ceiling ?? dash })}</Text>
          </View>
        </View>

        <Text style={styles.farmerInfo}>
          {t('listingsAdmin.card.farmer', { name: row.farmerName ?? dash, code: row.farmerCode ?? dash })}
        </Text>

        <View style={styles.gradeBadgeRow}>
          <View style={[styles.gradeBadge, row.grade === 'GRADE_2' && styles.gradeBadge2]}>
            <Text style={styles.gradeBadgeText}>{row.grade === null ? dash : gradeLabel(row.grade)}</Text>
          </View>
        </View>

        {showActions ? (
          <View style={styles.actionRow}>
            {access.approve ? (
              <TouchableOpacity
                style={[styles.approveBtn, approveDisabled && styles.disabled]}
                onPress={() => onApprove(row)}
                disabled={approveDisabled}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ disabled: approveDisabled }}
                accessibilityHint={canApprove ? undefined : t('listingsAdmin.action.approveUnavailable')}
                testID={`listingsAdmin.approve.${row.id}`}
              >
                <Icon name="check" size={16} color={adminColors.success.text} />
                <Text style={styles.approveBtnText}>{t('listingsAdmin.action.approve')}</Text>
              </TouchableOpacity>
            ) : null}

            {access.counter ? (
              <TouchableOpacity
                style={[styles.counterBtn, busy && styles.disabled]}
                onPress={() => onCounter(row)}
                disabled={busy}
                activeOpacity={0.7}
                accessibilityRole="button"
                testID={`listingsAdmin.counter.${row.id}`}
              >
                <Icon name="swap_horiz" size={16} color={adminColors.ink} />
                <Text style={styles.counterBtnText}>{t('listingsAdmin.action.counter')}</Text>
              </TouchableOpacity>
            ) : null}

            {access.reject ? (
              <TouchableOpacity
                style={[styles.rejectBtn, busy && styles.disabled]}
                onPress={() => onReject(row)}
                disabled={busy}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('listingsAdmin.action.reject')}
                testID={`listingsAdmin.reject.${row.id}`}
              >
                <Icon name="close" size={18} color={adminColors.danger.text} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
