/**
 * Screen 40 — Set/Update Fair Price, wired to POST /fair-prices.
 *
 * BR-08: only a Super Admin may set a ceiling (pricing.fair_price.set), so the
 * Save control is DISABLED, not hidden, for anyone else — a hidden button is
 * not a permission, and the server refuses it again (root CLAUDE.md 2.1).
 * BR-07 hangs off the value saved here: every listing is bounded by it, which
 * is why nothing on this screen may report a success the server did not give.
 *
 * Money (root CLAUDE.md 2.2): the amount is held as integer paise for the
 * whole edit, the +/- step is 100 paise, and it leaves as a Money string built
 * by buildFairPriceBody. There is no parseFloat and no arithmetic on a rupee
 * string anywhere in this file.
 *
 * `effectiveFrom`: the design has no date field, and FairPriceCreate requires
 * one. The screen sends today in Asia/Kolkata — the plain reading of "save the
 * new ceiling" — and says so under the button rather than deciding silently.
 * The server closes the open window the day before (BR-08).
 *
 * The palette below is the fixture's own hardcoded hex; it is left exactly as
 * it was. Moving these screens onto the admin theme is a separate pass.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon, ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import { toPaise, type Money } from '@tohfa/shared-types';
import { useCreateFairPrice } from '../../api/pricingHooks';
import { adminErrorKey } from '../../api/errors';
import { buildFairPriceBody, formatPrice, todayInIndia } from '../../api/pricingMappers';
import type { FairPriceFrequency, PricingGrade } from '../../api/pricing';
import { formatPaise, parseRupeesToPaise } from '../../money/paise';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';

const P = {
  pageBg: adminColors.canvas,
  cardBg: adminColors.card,
  orange: adminColors.brand,
  orangeBg: adminColors.brandTint,
  ink: adminColors.ink,
  darkBrown: adminColors.ink,
  body: adminColors.ink,
  muted: adminColors.muted,
  lightGray: adminColors.border,
  border: adminColors.border,
  danger: adminColors.danger.text,
  success: adminColors.success.text,
};

/** The ceiling row the list handed over. Everything comes from GET /fair-prices. */
export interface FairPriceSelection {
  cropId: string;
  cropName: string | null;
  grade: PricingGrade;
  ceilingPrice: Money | null;
  frequency: FairPriceFrequency | null;
}

export interface UpdateFairPriceScreenProps {
  onBack: () => void;
  /** Permission check from /auth/me. Missing means nothing is permitted (fail closed). */
  can?: Can | undefined;
  /** The ceiling being changed. Without one there is nothing to save. */
  selection?: FairPriceSelection | undefined;
  /** Fires only after the server stored the new ceiling (a real 201). */
  onSaved?: (() => void) | undefined;
}

/** One rupee, the fixture's step, in integer paise. A UI step, not a business threshold. */
const STEP_PAISE = 100;

export function UpdateFairPriceScreen({ onBack, can, selection, onSaved }: UpdateFairPriceScreenProps) {
  const canSet = can !== undefined && can('pricing.fair_price.set');
  const startPaise = selection?.ceilingPrice == null ? STEP_PAISE : toPaise(selection.ceilingPrice);
  const [paise, setPaise] = useState<number>(startPaise);
  const [saved, setSaved] = useState(false);
  const write = useCreateFairPrice({ enabled: canSet });
  const effectiveFrom = useMemo(() => todayInIndia(), []);

  const increment = () => setPaise((p) => p + STEP_PAISE);
  const decrement = () => setPaise((p) => Math.max(STEP_PAISE, p - STEP_PAISE));

  const body =
    selection === undefined
      ? null
      : buildFairPriceBody({
          cropId: selection.cropId,
          grade: selection.grade,
          // Integer paise -> the canonical Money string; never a float.
          ceilingInput: formatPaiseForBody(paise),
          effectiveFrom,
          ...(selection.frequency === null ? {} : { frequency: selection.frequency }),
        });

  const saveDisabled = !canSet || body === null || write.isPending;
  const errorKey = write.error === undefined || write.error === null ? null : adminErrorKey(write.error);

  const handleSave = () => {
    if (saveDisabled || body === null) return;
    setSaved(false);
    write.run(body, () => {
      // Only a real 2xx reaches here (useAdminMutation's onSuccess).
      setSaved(true);
      write.finish();
      if (onSaved) onSaved();
    });
  };

  const dash = t('pricingUpdate.noValue');
  const subtitle = t('pricingUpdate.fair.subtitle', {
    crop: selection?.cropName ?? dash,
    // No category on a ceiling (pricingTypes: FairPriceRowView.category is null).
    category: dash,
    grade: selection === undefined ? dash : t(`pricingCeiling.grade.${selection.grade}` as never),
  });
  const currentText =
    selection?.ceilingPrice == null
      ? t('pricingUpdate.fair.currentUnknown')
      : t('pricingUpdate.fair.current', { price: formatPrice(selection.ceilingPrice) ?? dash });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('pricingUpdate.back')}
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{t('pricingUpdate.fair.title')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <Text style={styles.label}>{t('pricingUpdate.fair.label')}</Text>

          <View style={styles.priceRow}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={decrement}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('pricingUpdate.fair.decrease')}
              testID="pricingUpdate.fair.decrease"
            >
              <Text style={styles.btnSymbol}>−</Text>
            </TouchableOpacity>

            <View style={styles.priceDisplay}>
              <Text style={styles.priceAmount} testID="pricingUpdate.fair.amount">
                {formatPaise(paise)}
              </Text>
              <Text style={styles.currentText}>{currentText}</Text>
            </View>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={increment}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('pricingUpdate.fair.increase')}
              testID="pricingUpdate.fair.increase"
            >
              <Text style={styles.btnSymbol}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saveDisabled ? styles.saveBtnDisabled : null]}
            onPress={handleSave}
            disabled={saveDisabled}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: saveDisabled, busy: write.isPending }}
            testID="pricingUpdate.fair.save"
          >
            {write.isPending ? (
              <ActivityIndicator color={adminColors.onBrand} style={{ marginRight: 8 }} />
            ) : (
              <Icon name="check_circle" size={18} color={adminColors.onBrand} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.saveBtnText}>
              {write.isPending ? t('pricingUpdate.fair.saving') : t('pricingUpdate.fair.save')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>{t('pricingUpdate.fair.effectiveNote', { date: effectiveFrom })}</Text>
          {!canSet ? <Text style={styles.noteText}>{t('pricingUpdate.fair.notPermitted')}</Text> : null}
          {canSet && selection === undefined ? <Text style={styles.noteText}>{t('pricingUpdate.fair.noSelection')}</Text> : null}
          {errorKey !== null ? (
            <Text style={styles.errorText} testID="pricingUpdate.fair.error">
              {t(errorKey)}
            </Text>
          ) : null}
          {saved && errorKey === null ? (
            <Text style={styles.successText} testID="pricingUpdate.fair.saved">
              {t('pricingUpdate.fair.saved')}
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Integer paise -> the plain rupee string buildFairPriceBody parses back to
 * paise. formatPaise is for display (it carries the currency symbol and
 * grouping), so the round trip goes through the same parser the typed input
 * uses, and a value it cannot read is rejected rather than guessed.
 */
function formatPaiseForBody(paise: number): string {
  const rupees = `${Math.trunc(paise / 100)}.${String(Math.abs(paise % 100)).padStart(2, '0')}`;
  return parseRupeesToPaise(rupees) === null ? '' : rupees;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 4,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: P.lightGray,
    marginBottom: 20,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceCard: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: P.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: P.darkBrown,
    marginBottom: 16,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: P.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.border,
  },
  btnSymbol: {
    fontSize: 20,
    fontWeight: '400',
    color: P.darkBrown,
    lineHeight: 24,
  },
  priceDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 2,
    lineHeight: 44,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  currentText: {
    fontSize: 12,
    color: P.lightGray,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 10,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  noteText: {
    fontSize: 12,
    color: P.lightGray,
    marginTop: 10,
    lineHeight: 17,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.danger,
    marginTop: 10,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  successText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.success,
    marginTop: 10,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
