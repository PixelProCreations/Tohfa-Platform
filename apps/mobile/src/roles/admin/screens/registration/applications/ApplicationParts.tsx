/**
 * Shared pieces of the application screens, drawn exactly as the design of
 * record (origin/Superadmin-main screens/registration/*) draws them: its SVG
 * icons, the light screens' 44pt back card, the review screen's brand header,
 * the numbered section heading with its "Step n of 5" badge, the card, and the
 * label/value row. Styles live in ../detail/detailStyles.ts under the
 * design's own names.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { tokens } from '@tohfa/design-tokens';
import { t } from '../../../i18n';
import { adminColors, adminShadow } from '../../../theme';
import { BOX, RAD, SP } from '../designMetrics';
import { detailStyles } from '../detail/detailStyles';
import type { ApplicationTone } from './applicationLogic';

// --- the design's icons -------------------------------------------------------

export function BackArrowIcon({ color, size = SP.s20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronBackIcon({ color, size = SP.s20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ color, size = SP.s16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The design's filled check circle (document cards, declaration, status sheet). */
export function CheckCircleIcon({ color, size = SP.s20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MapPinIcon({ color, size = SP.s16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function DocumentPdfIcon({ color, size = SP.s16 * 2 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// --- the light screens' back card ----------------------------------------------

/** The design's 44pt white back card with a chevron (list, approve, reject, request info). */
export function BackButtonCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.backCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('farmerApps.back')}
      testID="farmerApps.back"
    >
      <ChevronBackIcon color={adminColors.ink} />
    </TouchableOpacity>
  );
}

// --- the review screen's header ------------------------------------------------

export interface HeaderBannerProps {
  title: string;
  /** "APP-… · " — the application code, then the separator the design prints before the status. */
  subtitle: string;
  onBack: () => void;
  /** Decided applications show a pill (the design's green Approved pill); pending ones plain text. */
  status: { label: string; tone: ApplicationTone; pill: boolean };
}

/** The design's brand-orange header: back arrow, applicant name, "code · status". */
export function HeaderBanner({ title, subtitle, onBack, status }: HeaderBannerProps) {
  return (
    <View style={detailStyles.headerBanner}>
      <View style={detailStyles.headerRow}>
        <TouchableOpacity
          style={detailStyles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmerApps.back')}
          testID="farmerApps.back"
        >
          <BackArrowIcon color={adminColors.onBrand} />
        </TouchableOpacity>
        <View style={detailStyles.headerTitleBox}>
          <Text style={detailStyles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={detailStyles.headerSubtitleRow}>
            <Text style={detailStyles.headerSubtitle}>{subtitle}</Text>
            {status.pill ? (
              <View style={[detailStyles.headerApprovedPill, status.tone === 'danger' ? detailStyles.headerRejectedPill : null]}>
                <Text style={[detailStyles.headerApprovedPillText, status.tone === 'danger' ? detailStyles.headerRejectedPillText : null]}>
                  {status.label}
                </Text>
              </View>
            ) : (
              <Text style={detailStyles.headerSubtitle}>{status.label}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// --- headings, cards and rows ---------------------------------------------------

/** A heading with no step badge (06, 07): the design sets it with no margin of its own. */
export function SectionHeading({ label }: { label: string }) {
  return (
    <Text style={detailStyles.sectionHeading} accessibilityRole="header">
      {label}
    </Text>
  );
}

/** "01 · Personal Details" with its "Step 1 of 5" badge on the right. */
export function StepHeader({ label, step, total }: { label: string; step: number; total: number }) {
  return (
    <View style={detailStyles.stepHeaderRow}>
      <Text style={detailStyles.sectionHeading} accessibilityRole="header">
        {label}
      </Text>
      <View style={detailStyles.stepBadge} testID="farmerApps.stepBadge">
        <Text style={detailStyles.stepBadgeText}>{t('farmerApps.step', { n: step, total })}</Text>
      </View>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={detailStyles.card}>{children}</View>;
}

export interface InfoRowProps {
  label: string;
  value: string;
  /** The design's bold value (names, numbers it wants to stand out). */
  bold?: boolean | undefined;
  /** A long value (the address) takes the remaining width, right-aligned. */
  wide?: boolean | undefined;
  last?: boolean | undefined;
  /** The design's small grey line under a label (for example the Aadhaar's "Used to verify identity with TOHFA"). */
  hint?: string | undefined;
  /** Drawn after the value, for the design's inline badges. */
  valueSuffix?: React.ReactNode | undefined;
  testID?: string | undefined;
}

export function InfoRow({ label, value, bold = false, wide = false, last = false, hint, valueSuffix, testID }: InfoRowProps) {
  const valueStyle = [bold ? detailStyles.valueBold : detailStyles.value, wide ? detailStyles.valueWide : null];
  return (
    <View style={[detailStyles.row, last ? detailStyles.rowLast : null]} testID={testID}>
      {hint === undefined ? (
        <Text style={detailStyles.label}>{label}</Text>
      ) : (
        <View style={detailStyles.labelBox}>
          <Text style={detailStyles.label}>{label}</Text>
          <Text style={detailStyles.captionSub}>{hint}</Text>
        </View>
      )}
      {valueSuffix === undefined ? (
        <Text style={valueStyle}>{value}</Text>
      ) : (
        <View style={detailStyles.inlineBadgeRow}>
          <Text style={valueStyle}>{value}</Text>
          {valueSuffix}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backCard: {
    width: BOX.backCard,
    height: BOX.backCard,
    borderRadius: RAD.r14,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
    // design: 0 1 3 black 4% shadow, elevation 2 — the adminSm token with its blur unhalved.
    shadowRadius: tokens.shadow.adminSm.blur,
    elevation: 2,
  },
});
