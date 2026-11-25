/**
 * One retail price card, after the design's "Crop · Grade" card: title, the
 * within/above ceiling badge, "Ceiling · Retail · Diff" and the effective
 * date. The badge is computed in the app from the row's ceiling (paise,
 * display only); the design's server-side statuses ("Action required",
 * "Review needed", "No retail price") and its action note have no API source
 * and are not drawn.
 *
 * The Edit button is drawn only when the list passes `onEdit`, which it does
 * only for pricing.retail_price.set.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { RetailPriceRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import type { RetailCardView } from './retailPricingLogic';
import { frameStyles } from './pricingFrameStyles';
import { retailStyles } from './retailPricingStyles';

export interface RetailPriceCardProps {
  row: RetailPriceRowView;
  view: RetailCardView;
  onPress?: ((row: RetailPriceRowView) => void) | undefined;
  onEdit?: ((row: RetailPriceRowView) => void) | undefined;
}

function CeilingBadgePill({ badge }: { badge: RetailCardView['badge'] }) {
  if (badge === null) return null;
  const above = badge === 'above';
  return (
    <View style={[frameStyles.badge, above ? retailStyles.badgeAbove : retailStyles.badgeWithin]}>
      <Text style={[frameStyles.badgeText, above ? retailStyles.badgeAboveText : retailStyles.badgeWithinText]}>
        {t(above ? 'pricingRetail.badge.above' : 'pricingRetail.badge.within')}
      </Text>
    </View>
  );
}

export function RetailPriceCard({ row, view, onPress, onEdit }: RetailPriceCardProps) {
  const above = view.badge === 'above';
  const body = (
    <>
      <View style={frameStyles.cardHeaderRow}>
        <Text style={frameStyles.cardTitle}>{view.title}</Text>
        <CeilingBadgePill badge={view.badge} />
      </View>
      <Text style={frameStyles.cardSubtitle1}>{view.pricesLine}</Text>
      <Text style={frameStyles.cardSubtitle2}>{view.effectiveLine}</Text>
      {onEdit ? (
        <TouchableOpacity
          style={above ? retailStyles.editFilledBtn : retailStyles.editOutlinedBtn}
          onPress={() => onEdit(row)}
          activeOpacity={0.8}
          accessibilityRole="button"
          testID={`pricingRetail.edit.${row.id}`}
        >
          <Text style={above ? retailStyles.editFilledBtnText : retailStyles.editOutlinedBtnText}>{t('pricingRetail.edit.button')}</Text>
        </TouchableOpacity>
      ) : null}
    </>
  );
  const cardStyle = above ? retailStyles.dangerCard : frameStyles.card;
  if (onPress === undefined) return <View style={cardStyle}>{body}</View>;
  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onPress(row)}
      activeOpacity={0.75}
      accessibilityRole="button"
      testID={`pricingRetail.card.${row.id}`}
    >
      {body}
    </TouchableOpacity>
  );
}
