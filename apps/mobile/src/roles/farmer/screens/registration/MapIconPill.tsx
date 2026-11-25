import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, weights, radius, MIN_TOUCH_TARGET } from '../../theme';
import { authPalette as P } from '../../theme';
import {
  ICON_TOOLTIP_LONG_PRESS_MS,
  useIconTooltip,
} from '../profile/useIconTooltip';

/**
 * One round, icon-only button of the right-hand floating map column (Search, Locate Me, Draw /
 * Edit Boundary, Add Location, Undo, Clear and the "Editing boundary" indicator), shared by
 * registration Step 3 and Profile's FarmMapPanel so the two cannot drift.
 *
 * The text label is not drawn on the button: it is the accessibilityLabel (screen readers) and a
 * press-and-hold bubble to the left of the button, driven by the same `useIconTooltip` timing
 * ZonesScreen uses. A long-press suppresses `onPress` (RN Pressable behaviour), so holding a
 * button to read it never triggers it.
 *
 * `tone`: 'active' is the solid green state (draw mode); 'editing' is the amber state of the
 * "Editing boundary" indicator, which keeps its amber fill so it stays distinct without text.
 */
export type MapIconPillTone = 'default' | 'active' | 'editing';

interface Props {
  label: string;
  hint?: string;
  onPress?: () => void;
  tone?: MapIconPillTone;
  testID?: string;
  renderIcon: (color: string) => React.ReactNode;
}

export function MapIconPill({ label, hint, onPress, tone = 'default', testID, renderIcon }: Props) {
  const { visibleKey, tooltip } = useIconTooltip();
  const key = label;
  const iconColor = tone === 'active' ? colors.white : tone === 'editing' ? P.black : colors.brandGreen;
  const isIndicator = onPress === undefined;
  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          tone === 'active' && styles.btnActive,
          tone === 'editing' && styles.btnEditing,
          pressed && !isIndicator && styles.btnPressed,
        ]}
        onPress={() => {
          tooltip.hide();
          onPress?.();
        }}
        onLongPress={() => tooltip.show(key)}
        onPressOut={() => tooltip.release(key)}
        onHoverIn={() => tooltip.show(key)}
        onHoverOut={() => tooltip.release(key)}
        delayLongPress={ICON_TOOLTIP_LONG_PRESS_MS}
        accessibilityRole={isIndicator ? 'text' : 'button'}
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={tone === 'active' ? { selected: true } : undefined}
        testID={testID}
      >
        {renderIcon(iconColor)}
      </Pressable>
      {visibleKey === key ? (
        <View
          style={styles.tooltipWrap}
          pointerEvents="none"
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          testID={testID ? `${testID}-tooltip` : undefined}
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{label}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  btn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  btnActive: { backgroundColor: colors.brandGreen },
  // Same amber the text badge used; the icon is black on it, as before.
  btnEditing: { backgroundColor: P.amber600 },
  btnPressed: { opacity: 0.8 },
  // Fixed-width, right-anchored box the bubble shrinks into (see ZonesScreen.mapTooltipWrap).
  tooltipWrap: {
    position: 'absolute',
    width: MIN_TOUCH_TARGET * 5,
    right: '100%',
    top: 0,
    bottom: 0,
    marginRight: spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
  },
  tooltip: {
    maxWidth: '100%',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    shadowColor: P.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  tooltipText: {
    color: P.nearBlack,
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
  },
});
