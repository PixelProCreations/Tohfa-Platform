import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { ReportsScreen } from '../warehouse/reports';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';

export interface ReportsExportScreenProps {
  onBack: () => void;
  onNavigateToExport?: () => void;
  can?: (code: string) => boolean;
}

/**
 * Reports & Export. GET /admin/exports/* returns the CSV directly; the server
 * keeps no list of past export requests, so there is no history to show here
 * (brief 07 P4: the sample requests were demo data and are gone). The create
 * action opens the live reports hub.
 */
export function ReportsExportScreen({ onBack, onNavigateToExport, can }: ReportsExportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');

  const handleDownloadClick = () => {
    // RBAC check: must have report.export.file permission
    if (can && !can('report.export.file')) {
      Alert.alert(
        'Access Restricted',
        'Your role lacks permission to export finance reports (report.export.file).'
      );
      return;
    }
    if (onNavigateToExport) {
      onNavigateToExport();
    } else {
      setCurrentView('create');
    }
  };

  if (currentView === 'create') {
    return (
      <ReportsScreen
        scope={{ warehouseId: undefined, warehouseName: undefined }}
        can={can ?? (() => false)}
        onBack={() => setCurrentView('list')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke={adminColors.onBrand}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Export</Text>
          <TouchableOpacity
            style={styles.headerExportButton}
            onPress={() => handleDownloadClick()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create export report"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3v12M12 15l4-4M12 15l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke={adminColors.onBrand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx="11" cy="11" r="8" stroke={adminColors.muted} strokeWidth="2" />
            <Path d="M21 21l-4.35-4.35" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter exports"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 6h16M7 12h10M10 18h4"
                stroke={adminColors.brand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Count: the server keeps no export history to count. */}
        <Text style={styles.countText}>{t('wiringFinance.reportsExport.count', { count: ADMIN_NO_VALUE })}</Text>

        <AdminEmptyState
          title={t('wiringFinance.reportsExport.emptyTitle')}
          subtitle={t('wiringFinance.reportsExport.emptySubtitle')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    flex: 1,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  headerExportButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 6,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardsList: {
    gap: adminSpacing.md,
  },
  exportCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusReadyBadge: {
    backgroundColor: adminColors.success.bg,
  },
  statusFailedBadge: {
    backgroundColor: adminColors.danger.bg,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  statusReadyText: {
    color: adminColors.success.text,
  },
  statusFailedText: {
    color: adminColors.danger.text,
  },
  categoryText: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: 2,
  },
  metaText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  actionLinkText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
});
