import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import {
  CONFIG_PALETTE,
  ConfigBackChevronIcon,
} from './SystemConfigScreen';
import { useAdminQuery } from '../../api/hooks';
import { listAuditLog } from '../../api/auditLog';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

export interface AuditLogItem {
  id: string;
  action: string;
  adminName: string;
  category: 'CONFIG' | 'AUTH' | 'FINANCE' | 'FARMER' | 'PAYOUT';
  timestamp: string;
  ipAddress: string;
  diffSummary: string;
}

export interface SystemAuditLogsScreenProps {
  onBack?: () => void;
}

export function SystemAuditLogsScreen({ onBack }: SystemAuditLogsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CONFIG' | 'PAYOUT' | 'FARMER'>('ALL');

  const auditQuery = useAdminQuery(
    ['admin', 'auditLog', 'all'],
    (signal) => listAuditLog({ limit: 50 }, signal),
  );

  const liveAuditLogs: AuditLogItem[] = useMemo(() => {
    if (!auditQuery.data?.items || auditQuery.data.items.length === 0) {
      return [];
    }
    return auditQuery.data.items.map((entry) => {
      const adminName = entry.actorType === 'SYSTEM'
        ? 'System Service Account'
        : entry.actorRole
        ? `Admin (${entry.actorRole})`
        : 'Admin User';
      const entity = (entry.entityType ?? '').toLowerCase();
      const category: AuditLogItem['category'] =
        entity.includes('config') ? 'CONFIG'
        : entity.includes('payout') ? 'PAYOUT'
        : entity.includes('farmer') || entity.includes('farm') || entity.includes('certification') ? 'FARMER'
        : 'AUTH';
      const diffSummary = entry.changedFields && entry.changedFields.length > 0
        ? `Updated fields: ${entry.changedFields.join(', ')}`
        : `Operation: ${entry.action} (${entry.outcome})`;

      return {
        id: entry.id,
        action: entry.action,
        adminName,
        category,
        timestamp: entry.at ? entry.at.slice(0, 16).replace('T', ' ') : ADMIN_NO_VALUE,
        ipAddress: entry.ip ?? ADMIN_NO_VALUE,
        diffSummary,
      };
    });
  }, [auditQuery.data?.items]);

  const filteredLogs = liveAuditLogs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    return log.category === activeFilter;
  });

  const getCategoryBadgeStyle = (category: AuditLogItem['category']) => {
    switch (category) {
      case 'CONFIG':
        return { bg: '#FFF1EB', text: '#F0562A' };
      case 'PAYOUT':
        return { bg: '#EBF3FA', text: '#1D6399' };
      case 'FARMER':
        return { bg: '#EAF5EA', text: '#2E7D32' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={CONFIG_PALETTE.pageBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ConfigBackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>System Audit Logs</Text>
          <Text style={styles.screenSubtitle}>
            Immutable cryptographic trail of all Super Admin and system activities
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filterPillsRow}>
          {(['ALL', 'CONFIG', 'PAYOUT', 'FARMER'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  activeFilter === filter && styles.filterPillTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logs List */}
        {auditQuery.isPending ? (
          <AdminLoadingState />
        ) : auditQuery.error ? (
          <AdminErrorState error={auditQuery.error} onRetry={() => void auditQuery.refetch()} />
        ) : filteredLogs.length === 0 ? (
          <AdminEmptyState
            title="No audit logs found"
            subtitle="No activity logs match the selected filter."
          />
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const badge = getCategoryBadgeStyle(item.category);
              return (
                <View style={styles.logCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {item.category}
                      </Text>
                    </View>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                  </View>

                  <Text style={styles.actionTitle}>{item.action}</Text>
                  <Text style={styles.diffText}>{item.diffSummary}</Text>

                  <View style={styles.footerRow}>
                    <Text style={styles.adminUserText}>👤 {item.adminName}</Text>
                    <Text style={styles.ipText}>{item.ipAddress}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CONFIG_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: CONFIG_PALETTE.pageBg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: CONFIG_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: CONFIG_PALETTE.textSecondary,
    lineHeight: 18,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
  },
  filterPillActive: {
    backgroundColor: CONFIG_PALETTE.primaryOrange,
    borderColor: CONFIG_PALETTE.primaryOrange,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: CONFIG_PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 32,
  },
  logCard: {
    backgroundColor: CONFIG_PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CONFIG_PALETTE.borderSoft,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 11,
    color: CONFIG_PALETTE.textMuted,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: CONFIG_PALETTE.textPrimary,
    marginBottom: 4,
  },
  diffText: {
    fontSize: 12,
    color: CONFIG_PALETTE.textSecondary,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F0E8',
  },
  adminUserText: {
    fontSize: 11,
    fontWeight: '600',
    color: CONFIG_PALETTE.textPrimary,
  },
  ipText: {
    fontSize: 11,
    color: CONFIG_PALETTE.textMuted,
  },
});
