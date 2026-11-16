/**
 * The design's inline retail price edit drawer ("Edit drawer (Crop · Grade)"),
 * mounted ONLY for a caller holding pricing.retail_price.set (the list
 * decides; owner: only Super Admin sets the price).
 *
 * The live within/above check runs against the row's REAL ceiling in integer
 * paise (drawerView -> retailDraftCheck); the design hard-coded a ceiling of
 * 60.0, used parseFloat and prefilled "58.00", none of which is ported.
 *
 * Save is not wired: POST /retail-prices requires `effectiveFrom`, the design
 * has no date field, and which date to send is an open owner decision. Save is
 * shown, disabled, with an i18n explanation, and it never pretends to succeed.
 */
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Money } from '@tohfa/shared-types';
import type { RetailPriceRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { drawerView, moneyText, noValue, rowTitle } from './retailPricingLogic';
import { frameStyles } from './pricingFrameStyles';
import { retailStyles as styles } from './retailPricingStyles';

export interface RetailEditDrawerProps {
  row: RetailPriceRowView;
  /** The ceiling the caller may see (null without pricing.fair_price.view). */
  ceiling: Money | null;
}

export function RetailEditDrawer({ row, ceiling }: RetailEditDrawerProps) {
  const [input, setInput] = useState('');
  const view = drawerView(input, ceiling);
  const toneStyle = view.status === 'above' ? styles.drawerValAbove : view.status === 'within' ? styles.drawerValWithin : null;
  // DESIGN-ONLY: effectiveFrom rule not decided (owner). The Save control below stays disabled
  // and is never wired to useCreateRetailPrice until the owner decides which effectiveFrom to send.

  return (
    <View testID="pricingRetail.drawer">
      <Text style={styles.drawerSectionHeading}>{t('pricingRetail.drawer.heading', { title: rowTitle(row.cropName, row.grade) })}</Text>
      <View style={styles.drawerCard}>
        <View style={styles.drawerRow}>
          <Text style={styles.drawerLabel}>{t('pricingRetail.drawer.current')}</Text>
          <Text style={styles.drawerValBold}>{moneyText(row.retailPrice)}</Text>
        </View>
        <View style={frameStyles.divider} />
        <View style={styles.drawerRow}>
          <Text style={styles.drawerLabel}>{t('pricingRetail.drawer.ceiling')}</Text>
          <Text style={styles.drawerValBold}>{ceiling === null ? noValue() : moneyText(ceiling)}</Text>
        </View>
        <View style={frameStyles.divider} />

        <Text style={styles.inputFieldLabel}>{t('pricingRetail.drawer.newPrice')}</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.drawerTextInput}
            value={input}
            onChangeText={setInput}
            keyboardType="decimal-pad"
            placeholderTextColor={adminColors.placeholder}
            accessibilityLabel={t('pricingRetail.drawer.inputLabel')}
            testID="pricingRetail.drawer.input"
          />
        </View>

        <View style={[styles.drawerRow, styles.drawerRowSpaced]}>
          <Text style={styles.drawerLabel}>{t('pricingRetail.drawer.proposed')}</Text>
          <Text style={styles.drawerValBold}>{view.proposed}</Text>
        </View>
        <View style={[styles.drawerRow, styles.drawerRowSpaced]}>
          <Text style={styles.drawerLabel}>{t('pricingRetail.drawer.difference')}</Text>
          <Text style={[styles.drawerValBold, toneStyle]}>{view.difference}</Text>
        </View>
        <View style={[styles.drawerRow, styles.drawerRowSpaced]}>
          <Text style={styles.drawerLabel}>{t('pricingRetail.drawer.status')}</Text>
          <Text style={[styles.drawerValBold, toneStyle]} testID="pricingRetail.drawer.status">
            {view.statusText}
          </Text>
        </View>
        {/* BR-09: retail must not exceed the ceiling; the server enforces it, this only warns. */}
        {view.status === 'above' ? <Text style={styles.hintText}>{t('pricingRetail.drawer.aboveHint')}</Text> : null}

        {/* DESIGN-ONLY: effectiveFrom rule not decided (owner). Visible, disabled, no onPress, no write hook. */}
        <TouchableOpacity
          style={styles.saveBtnDisabled}
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="pricingRetail.drawer.save"
        >
          <Text style={styles.saveBtnDisabledText}>{t('pricingRetail.drawer.save')}</Text>
        </TouchableOpacity>
        <Text style={styles.saveNote}>{t('pricingRetail.drawer.saveUnavailable')}</Text>
      </View>
    </View>
  );
}
