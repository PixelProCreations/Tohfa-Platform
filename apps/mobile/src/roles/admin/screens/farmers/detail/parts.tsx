/**
 * Small shared pieces of the farmer detail tabs: the design's details table,
 * pills, section titles, the per-tab async states, and the bottom-sheet modal
 * shell every design modal uses.
 */
import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors, type AdminTone } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { LockIcon } from './icons';
import type { Badge, DetailRow } from './model';
import { detailStyles as s } from './styles';

export function Pill({ label, tone }: { label: string; tone: AdminTone | 'neutral' }) {
  if (tone === 'neutral') {
    return (
      <View style={[s.pill, s.neutralPill]}>
        <Text style={[s.pillText, s.neutralPillText]}>{label}</Text>
      </View>
    );
  }
  const c = adminColors[tone];
  return (
    <View style={[s.pill, { backgroundColor: c.bg }]}>
      <Text style={[s.pillText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function BadgePill({ badge }: { badge: Badge }) {
  return <Pill label={badge.label} tone={badge.tone} />;
}

/** Dev's "Locked" pill (BR-33 locked fields). */
export function LockedPill() {
  return (
    <View style={s.lockedPill}>
      <LockIcon size={10} color={adminColors.warning.text} />
      <Text style={s.lockedText}>{t('farmerDetail.locked')}</Text>
    </View>
  );
}

function toneColor(tone: AdminTone | undefined): string | undefined {
  return tone === undefined ? undefined : adminColors[tone].text;
}

export function TableRowView({ row, last }: { row: DetailRow; last: boolean }) {
  const color = toneColor(row.tone);
  return (
    <View style={[s.tableRow, last && s.tableRowLast]}>
      <Text style={s.tableLabel}>{row.label}</Text>
      <View style={s.tableValueWrap}>
        <Text style={[s.tableValue, color !== undefined && { color }]}>{row.value}</Text>
        {row.locked ? <LockedPill /> : null}
      </View>
    </View>
  );
}

/** The design's white card of label/value rows. */
export function DetailsTable({ rows }: { rows: readonly DetailRow[] }) {
  return (
    <View style={s.detailsCard}>
      {rows.map((row, i) => (
        <TableRowView key={row.label} row={row} last={i === rows.length - 1} />
      ))}
    </View>
  );
}

export function SectionTitle({ children, spaced = false }: { children: string; spaced?: boolean }) {
  return <Text style={[s.sectionTitle, spaced && s.sectionTitleSpaced]}>{children}</Text>;
}

/** A card holding one muted sentence: an empty list, or a section with no API yet. */
export function EmptyCard({ text }: { text: string }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

/**
 * The state of one tab's own query: not permitted, loading, failed (with
 * Retry) or ready. Data already on screen wins over a failed refresh.
 */
export function TabQueryGate({
  permitted,
  hasData,
  isLoading,
  error,
  onRetry,
  children,
}: {
  permitted: boolean;
  hasData: boolean;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (!permitted) return <EmptyCard text={t('farmerDetail.state.tabDenied')} />;
  if (hasData) return <>{children}</>;
  if (isLoading) return <AdminLoadingState />;
  if (error !== null && error !== undefined) return <AdminErrorState error={error} onRetry={onRetry} />;
  return <AdminLoadingState />;
}

/** The design's bottom sheet: scrim, tap-outside to close, keyboard-aware. */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBackdrop}>
        <Pressable style={s.modalBackdropTouch} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('farmerDetail.form.close')} />
        <View style={s.sheet}>
          <Text style={s.sheetTitle} accessibilityRole="header">
            {title}
          </Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** The visible "not available yet" note every DESIGN-ONLY confirm raises. */
export function NoticeBox({ text }: { text: string }) {
  return (
    <View style={s.noticeBox} accessibilityLiveRegion="polite">
      <Text style={s.noticeText}>{text}</Text>
    </View>
  );
}
