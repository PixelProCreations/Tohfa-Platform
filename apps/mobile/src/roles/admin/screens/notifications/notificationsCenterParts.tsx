/**
 * Sub-components for the Notifications Center screen.
 * All string literals resolved through t(); all colours through theme tokens.
 */
import React from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { t } from '../../i18n';
import {
  adminColors,
} from '../../theme';
import type { NotificationItem } from '../warehouse/notifications/types';
import {
  buildMetaLine,
  categoryIconType,
  isActionRequired,
  NOTIF_CHIPS,
  type NotifChip,
} from './notificationsCenterLogic';
import {
  BoxIcon,
  CashIcon,
  ClipboardIcon,
  CloseIcon,
  SearchIcon,
  UsersIcon,
  WarningTriangleIcon,
} from './notificationsCenterIcons';
import { styles } from './notificationsCenterStyles';

// ─── TypeIconBox ─────────────────────────────────────────────────────────────

/**
 * 48 × 48 brandTint-background icon box for the detail modal.
 * Card header uses cardIconBox style (32 × 32) directly in NotifCard.
 */
export function TypeIconBox({ item }: { item: NotificationItem }) {
  const iconType = categoryIconType(item.category);
  const iconSize = 24;
  return (
    <View style={styles.modalIconWrap}>
      {iconType === 'inventory' && <BoxIcon size={iconSize} color={adminColors.brand} />}
      {iconType === 'audit' && <ClipboardIcon size={iconSize} color={adminColors.brandDeep} />}
      {iconType === 'farmers' && <UsersIcon size={iconSize} color={adminColors.brand} />}
      {iconType === 'finance' && <CashIcon size={iconSize} color={adminColors.brandDeep} />}
      {iconType === 'warning' && (
        <WarningTriangleIcon size={iconSize} color={adminColors.warning.text} />
      )}
    </View>
  );
}

// ─── Card icon (32 × 32 for inline cards) ────────────────────────────────────

function CardIconBox({ item }: { item: NotificationItem }) {
  const iconType = categoryIconType(item.category);
  const iconSize = 20;
  return (
    <View style={styles.cardIconBox}>
      {iconType === 'inventory' && <BoxIcon size={iconSize} color={adminColors.brand} />}
      {iconType === 'audit' && <ClipboardIcon size={iconSize} color={adminColors.brandDeep} />}
      {iconType === 'farmers' && <UsersIcon size={iconSize} color={adminColors.brand} />}
      {iconType === 'finance' && <CashIcon size={iconSize} color={adminColors.brandDeep} />}
      {iconType === 'warning' && (
        <WarningTriangleIcon size={iconSize} color={adminColors.warning.text} />
      )}
    </View>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChangeText,
  onClear,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.searchBox}>
      <SearchIcon size={18} color={adminColors.placeholder} />
      <TextInput
        style={styles.searchInput}
        placeholder={t('notificationsCenter.searchPlaceholder')}
        placeholderTextColor={adminColors.placeholder}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        accessibilityLabel={t('notificationsCenter.searchPlaceholder')}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          activeOpacity={0.7}
          accessibilityLabel={t('notificationsCenter.clearSearch')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.clearSearchText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ChipRow ─────────────────────────────────────────────────────────────────

const CHIP_LABEL_KEYS: Record<NotifChip, string> = {
  All: 'notificationsCenter.chipAll',
  Unread: 'notificationsCenter.chipUnread',
  Inventory: 'notificationsCenter.chipInventory',
  Audits: 'notificationsCenter.chipAudits',
  Farmers: 'notificationsCenter.chipFarmers',
  Finance: 'notificationsCenter.chipFinance',
} as const;

export function ChipRow({
  activeChip,
  onSelect,
}: {
  activeChip: NotifChip;
  onSelect: (chip: NotifChip) => void;
}) {
  return (
    <View style={styles.filterChipsContainer}>
      {NOTIF_CHIPS.map((chip) => {
        const isActive = activeChip === chip;
        return (
          <TouchableOpacity
            key={chip}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
            onPress={() => onSelect(chip)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
              {t(CHIP_LABEL_KEYS[chip] as never)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── NotifCard ───────────────────────────────────────────────────────────────

export function NotifCard({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) {
  const actionRequired = isActionRequired(item);
  const metaLine = buildMetaLine(item.category, item.timestamp);

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        item.isRead ? styles.notificationCardRead : styles.notificationCardUnread,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeaderRow}>
        <CardIconBox item={item} />
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.badgesRow}>
          {!item.isRead && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{t('notificationsCenter.badgeUnread')}</Text>
            </View>
          )}
          {actionRequired && (
            <View style={styles.actionRequiredBadge}>
              <Text style={styles.actionRequiredBadgeText}>
                {t('notificationsCenter.badgeActionRequired')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.cardBodyText}>{item.message}</Text>
      {Boolean(item.reference) && (
        <Text style={styles.cardRefText}>{item.reference}</Text>
      )}
      <Text style={styles.cardMetaText}>{metaLine}</Text>
    </TouchableOpacity>
  );
}

// ─── DetailModal ─────────────────────────────────────────────────────────────

export function DetailModal({
  item,
  onClose,
}: {
  item: NotificationItem | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalCard}>
          {item !== null && (
            <>
              <View style={styles.modalHeaderRow}>
                <TypeIconBox item={item} />
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t('notificationsCenter.modalClose')}
                >
                  <CloseIcon size={20} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalMeta}>
                {buildMetaLine(item.category, item.timestamp)}
              </Text>

              {Boolean(item.reference) && (
                <Text style={styles.modalRef}>{item.reference}</Text>
              )}

              <View style={styles.modalDivider} />

              <Text style={styles.modalBody}>{item.message}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseBtnText}>
                    {t('notificationsCenter.modalClose')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
