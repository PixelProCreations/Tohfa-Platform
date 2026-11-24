/**
 * Holds an Edit form back until the item it edits is in hand.
 *
 * Why this exists: Edit used to open the CREATE form with nothing in it, and
 * Publish there POSTed a second copy of the item. An edit form must therefore
 * never render without its item, even for a frame, and must never be savable
 * while the item is still loading or has failed to load. The item comes from
 * the caller when the detail screen already had it, otherwise it is fetched
 * here (the same query the detail screen used, so it is normally cached).
 *
 * Fails closed: without the learning permission nothing is requested and the
 * form is not drawn.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { canManageLearning, type ContentDto, type ContentKind } from './communityLogic';
import { useContentItem } from './useContentItem';

/** The item an edit form operates on: which resource, which row, and the row if the caller has it. */
export interface EditTarget {
  kind: ContentKind;
  id: string;
  content?: ContentDto | undefined;
}

export interface EditItemGateProps {
  target: EditTarget;
  onBack: () => void;
  can?: ((code: string) => boolean) | undefined;
  /** Rendered only once the item is loaded; receives it. */
  children: (content: ContentDto) => React.ReactElement;
}

export function EditItemGate({ target, onBack, can, children }: EditItemGateProps) {
  const allowed = canManageLearning(can);
  const carried = target.content;
  const usable = carried !== undefined && carried.kind === target.kind && carried.dto.id === target.id;
  const fetched = useContentItem(target.kind, target.id, allowed && !usable);
  const resolved = usable ? carried : fetched.content;

  if (allowed && resolved !== undefined && resolved.kind === target.kind && resolved.dto.id === target.id) {
    return children(resolved);
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          testID="community.editGate.back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('community.edit.title')}</Text>
      </View>
      <View style={styles.body}>
        {!allowed ? (
          <AdminEmptyState title={t('community.denied.title')} subtitle={t('community.denied.subtitle')} />
        ) : fetched.error !== null && fetched.error !== undefined ? (
          <AdminErrorState error={fetched.error} onRetry={fetched.refetch} />
        ) : (
          <AdminLoadingState />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...adminType.title, flex: 1, color: adminColors.onBrand, fontSize: 18, fontWeight: '800' },
  body: { flex: 1, padding: adminSpacing.md },
});
