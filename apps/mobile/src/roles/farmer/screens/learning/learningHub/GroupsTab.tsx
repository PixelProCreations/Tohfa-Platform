import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { GroupItem } from '../GroupsScreen';
import { ICON } from './constants';
import { lh } from './i18n';
import {
  BanknotesCashIcon,
  GroupUsersIcon,
  MedalRibbonIcon,
  MountainTerraceIcon,
  PestBugIcon,
} from './icons';
import { styles } from './styles';

function renderGroupIcon(item: GroupItem): React.JSX.Element {
  switch (item.iconType) {
    case 'medal':
      return <MedalRibbonIcon size={ICON.group} color={item.iconColor} />;
    case 'pest':
      return <PestBugIcon size={ICON.group} color={item.iconColor} />;
    case 'terrace':
      return <MountainTerraceIcon size={ICON.group} color={item.iconColor} />;
    case 'cash':
      return <BanknotesCashIcon size={ICON.group} color={item.iconColor} />;
    case 'users':
    default:
      return <GroupUsersIcon size={ICON.group} color={item.iconColor} />;
  }
}

interface Props {
  groups: GroupItem[];
  onOpen: (group: GroupItem) => void;
  onToggleJoin: (groupId: string) => void;
}

export function GroupsTab({ groups, onOpen, onToggleJoin }: Props): React.JSX.Element {
  return (
    <View style={styles.tabContentContainer}>
      <Text style={styles.sectionHeaderTitle}>
        {lh('groups.header', { count: groups.length })}
      </Text>
      {groups.map((group) => (
        <TouchableOpacity
          key={group.id}
          style={styles.groupCard}
          onPress={() => onOpen(group)}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={lh('groups.a11y', { name: group.name, count: group.membersCount })}
        >
          <View style={[styles.groupIconBox, { backgroundColor: group.iconBg }]}>
            {renderGroupIcon(group)}
          </View>
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupSubtitle}>
              {lh('groups.members', { count: group.membersCount })}
            </Text>
          </View>
          {group.isJoined ? (
            <TouchableOpacity
              style={[styles.groupActionBtn, styles.groupActionBtnJoined]}
              onPress={() => onToggleJoin(group.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.groupActionBtnTextJoined}>{lh('groups.joined')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.groupActionBtn}
              onPress={() => onToggleJoin(group.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.groupActionBtnText}>{lh('groups.join')}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
