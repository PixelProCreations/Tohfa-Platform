/**
 * Bell icon with the unread-notifications badge (GET /notifications
 * `unreadCount`, via useUnreadCount). Tapping it should navigate to
 * 'CustomerNotifications'.
 *
 * Safe outside a QueryClientProvider (e.g. isolated screen tests): it then
 * renders the bell without a badge instead of throwing.
 */
import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { QueryClientContext } from '@tanstack/react-query';
import { useUnreadCount } from '../api/notifications';
import { t } from '../../../i18n/customer';

export interface NotificationBellProps {
  onPress: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** "9+" style cap so the badge stays a small pill. */
export function formatBadgeCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 9 ? '9+' : String(Math.floor(count));
}

const BellSvg = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface BellViewProps extends NotificationBellProps {
  count: number;
}

export function NotificationBellView({ onPress, color = '#1A2E1A', size = 22, style, testID, count }: BellViewProps) {
  const badge = formatBadgeCount(count);
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.button, style]}
      testID={testID ?? 'notification-bell'}
      accessibilityRole="button"
      accessibilityLabel={
        badge === null ? t('customer.notifications.bell') : t('customer.notifications.bellUnread', { count: badge })
      }
    >
      <BellSvg color={color} size={size} />
      {badge !== null && (
        <View style={styles.badge} testID="notification-bell-badge">
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ConnectedBell(props: NotificationBellProps) {
  const { data } = useUnreadCount();
  return <NotificationBellView {...props} count={data ?? 0} />;
}

export function NotificationBell(props: NotificationBellProps) {
  const client = useContext(QueryClientContext);
  if (client === undefined) return <NotificationBellView {...props} count={0} />;
  return <ConnectedBell {...props} />;
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
