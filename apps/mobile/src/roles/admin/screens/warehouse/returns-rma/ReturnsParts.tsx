/**
 * Building blocks shared by the returns (RMA) screens.
 *
 * The thirteen Sub screens each carried their own copy of the orange header,
 * the two-column field card, the green-ring timeline and the footer button
 * (and the five absorbed Main copies a second, slightly different one). They
 * are drawn once here, on the admin theme.
 */
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { ReturnTimelineItem, WarehouseScope } from './types';

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/** Main Warehouse view: no warehouseId means every warehouse (rbac grant `all`). */
export function isAllWarehouses(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/**
 * True when a row owned by `warehouseId` is visible in `scope`: Main sees every
 * row, Sub only its own. Mock rows carry no warehouse yet and stay visible; the
 * server applies the real own-warehouse filter (rma.* SUB grant `own`).
 */
export function inScope(scope: WarehouseScope, warehouseId: string | undefined): boolean {
  return scope.warehouseId === undefined || warehouseId === undefined || warehouseId === scope.warehouseId;
}

function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface ReturnsScreenProps {
  title: string;
  subtitle?: string | undefined;
  onBack: () => void;
  /** Right side of the header row (bell, filter). */
  headerRight?: React.ReactNode;
  /** Extra header content under the title row (warehouse pill / selector). */
  headerExtra?: React.ReactNode;
  /** Sticky bar under the content (actions, bottom tabs). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Orange header + canvas body + optional sticky footer: the frame of every RMA screen. */
export function ReturnsScreen({ title, subtitle, onBack, headerRight, headerExtra, footer, children }: ReturnsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
        {headerExtra}
      </View>
      <View style={styles.body}>{children}</View>
      {footer}
    </SafeAreaView>
  );
}

/** Section heading above a card. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export interface InfoField {
  label: string;
  value: React.ReactNode;
}

/**
 * A card of label/value fields. Each inner array is one row (one or two
 * columns); rows are separated by a divider.
 */
export function InfoCard({ rows }: { rows: InfoField[][] }) {
  return (
    <View style={styles.card}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex}>
          {rowIndex > 0 ? <View style={styles.cardDivider} /> : null}
          <View style={styles.twoColRow}>
            {row.map((field) => (
              <View key={field.label} style={styles.col}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {typeof field.value === 'string' ? <Text style={styles.fieldValue}>{field.value}</Text> : field.value}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Small tinted label for an issue category. */
export function IssueTag({ label }: { label: string }) {
  return (
    <View style={styles.issueTag}>
      <Text style={styles.issueTagText}>{label}</Text>
    </View>
  );
}

/** Vertical timeline of completed steps (green ring + connector). */
export function ReturnsTimeline({ items }: { items: readonly ReturnTimelineItem[] }) {
  return (
    <View style={styles.timeline}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={item.id} style={styles.timelineRow}>
            <View style={styles.timelineNodeCol}>
              <View style={styles.timelineRing}>
                <View style={styles.timelineDot} />
              </View>
              {!isLast ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.timelineTextCol}>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              {item.time ? <Text style={styles.timelineTime}>{item.time}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** White sticky bar holding the screen's actions. */
export function ReturnsFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export type ReturnsButtonVariant = 'primary' | 'danger' | 'successOutline' | 'dangerOutline' | 'neutralOutline';

export interface ReturnsButtonProps {
  label: string;
  onPress: () => void;
  variant?: ReturnsButtonVariant | undefined;
  icon?: React.ReactNode;
  disabled?: boolean | undefined;
  /** Share a row with another button. */
  flex?: boolean | undefined;
}

export function ReturnsButton({ label, onPress, variant = 'primary', icon, disabled = false, flex = false }: ReturnsButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, BUTTON_STYLE[variant], flex && styles.buttonFlex, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {icon}
      <Text style={[styles.buttonText, BUTTON_TEXT_STYLE[variant]]}>{label}</Text>
    </TouchableOpacity>
  );
}

export interface ResultHeroProps {
  tone: 'success' | 'danger';
  icon: React.ReactNode;
  title: string;
  subtitle?: string | undefined;
}

/** Icon circle + title + subtitle of a result screen (approved, rejected, refunded, failed). */
export function ResultHero({ tone, icon, title, subtitle }: ResultHeroProps) {
  return (
    <View style={styles.hero}>
      <View style={[styles.heroIconCircle, { backgroundColor: adminColors[tone].bg }]}>{icon}</View>
      <Text style={styles.heroTitle}>{title}</Text>
      {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Muted note under a hidden or disabled action, saying why it is not offered. */
export function PermissionNote({ children }: { children: React.ReactNode }) {
  return <Text style={styles.permissionNote}>{children}</Text>;
}

// Timeline geometry: fixed icon sizes, not spacing (no size token exists for them).
const TIMELINE_RING = 20;
const TIMELINE_DOT = 8;
const TIMELINE_LINE_HEIGHT = 28;
const BACK_BUTTON = 36;
const HERO_CIRCLE = 80;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  backButton: { width: BACK_BUTTON, height: BACK_BUTTON, alignItems: 'center', justifyContent: 'center' },
  headerTextGroup: { flex: 1 },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerSubtitle: { ...adminType.rowMeta, color: adminColors.onBrand, marginTop: 2 },
  body: { flex: 1, backgroundColor: adminColors.canvas },

  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  cardDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.sm },
  twoColRow: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { flex: 1 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink },

  issueTag: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandSoft.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  issueTagText: { ...adminType.caption, color: adminColors.brandSoft.text },

  timeline: { paddingLeft: adminSpacing.xs, marginBottom: adminSpacing.sm },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineNodeCol: { alignItems: 'center', width: adminSpacing.xl },
  timelineRing: {
    width: TIMELINE_RING,
    height: TIMELINE_RING,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.success.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDot: {
    width: TIMELINE_DOT,
    height: TIMELINE_DOT,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.text,
  },
  timelineLine: { width: 2, height: TIMELINE_LINE_HEIGHT, backgroundColor: adminColors.border, marginVertical: 2 },
  timelineTextCol: { flex: 1, paddingLeft: adminSpacing.md, paddingBottom: adminSpacing.lg },
  timelineTitle: { ...adminType.sectionHead, color: adminColors.ink },
  timelineTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  footer: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    gap: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
  },
  buttonFlex: { flex: 1 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { ...adminType.sectionHead },
  permissionNote: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center' },

  hero: { alignItems: 'center', marginTop: adminSpacing.xxxl, marginBottom: adminSpacing.xl },
  heroIconCircle: {
    width: HERO_CIRCLE,
    height: HERO_CIRCLE,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  heroTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center', marginBottom: adminSpacing.xs },
  heroSubtitle: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },
});

const BUTTON_STYLE = StyleSheet.create({
  primary: { backgroundColor: adminColors.brand },
  danger: { backgroundColor: adminColors.danger.text },
  successOutline: { backgroundColor: adminColors.success.bg, borderWidth: 1.5, borderColor: adminColors.success.border },
  dangerOutline: { backgroundColor: adminColors.danger.bg, borderWidth: 1.5, borderColor: adminColors.danger.border },
  neutralOutline: { backgroundColor: adminColors.card, borderWidth: 1.5, borderColor: adminColors.border },
});

const BUTTON_TEXT_STYLE = StyleSheet.create({
  primary: { color: adminColors.onBrand },
  danger: { color: adminColors.onBrand },
  successOutline: { color: adminColors.success.text },
  dangerOutline: { color: adminColors.danger.text },
  neutralOutline: { color: adminColors.brandDeep },
});
