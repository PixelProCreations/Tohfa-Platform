import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

const PALETTE = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#EFECE6',
  buttonBorder: '#EFE7DE',
  orangePrimary: '#E85226',
  criticalText: '#DC2626',
  criticalBorder: '#F87171',
  warningText: '#D97706',
  warningBorder: '#F59E0B',
  infoText: '#0284C7',
  infoBorder: '#38BDF8',
};

export interface SystemAlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  iconType: 'triangle' | 'shield' | 'clock';
  title: string;
  desc: string;
  target?: string | undefined;
  action?: (() => void) | undefined;
}

export interface SystemAlertsScreenProps {
  onBack: () => void;
  onNavigateToStock?: () => void;
  onNavigateToPayouts?: () => void;
  onNavigateToCert?: () => void;
}

export function SystemAlertsScreen({
  onBack,
  onNavigateToStock,
  onNavigateToPayouts,
  onNavigateToCert,
}: SystemAlertsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Configurable thresholds
  const [stockThreshold, setStockThreshold] = useState('35');
  const [auditDays, setAuditDays] = useState('5');
  const [certDays, setCertDays] = useState('30');
  const [offerHours, setOfferHours] = useState('24');

  const [alerts, setAlerts] = useState<SystemAlertItem[]>([
    {
      id: 'alert-1',
      type: 'critical',
      iconType: 'triangle',
      title: 'Kotagiri stock at 31% — below threshold',
      desc: 'Consider an inter-warehouse transfer to rebalance.',
      action: onNavigateToStock,
    },
    {
      id: 'alert-2',
      type: 'critical',
      iconType: 'shield',
      title: '7 farms overdue for quarterly audit',
      desc: 'Q3 audit window closes in 5 days.',
      action: onNavigateToPayouts,
    },
    {
      id: 'alert-3',
      type: 'warning',
      iconType: 'triangle',
      title: '12 certifications expiring within 30 days',
      desc: 'Listings will be auto-blocked if not renewed.',
      action: onNavigateToCert,
    },
    {
      id: 'alert-4',
      type: 'info',
      iconType: 'clock',
      title: '3 counter-offers approaching 24hr window close',
      desc: 'Review before automatic withdrawal.',
    },
  ]);

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveThresholds = () => {
    setIsConfiguring(false);
    Alert.alert('Thresholds Updated', 'Platform monitoring rules updated across all nodes.');
  };

  const criticalCount = alerts.filter((a) => a.type === 'critical').length;
  const warningCount = alerts.filter((a) => a.type === 'warning').length;
  const infoCount = alerts.filter((a) => a.type === 'info').length;

  const displayedAlerts = alerts.filter((a) => {
    if (activeFilter === 'all') return true;
    return a.type === activeFilter;
  });

  const renderIcon = (type: SystemAlertItem['type'], iconType: SystemAlertItem['iconType']) => {
    if (iconType === 'shield') {
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke={PALETTE.criticalText}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M12 8v4M12 16h.01" stroke={PALETTE.criticalText} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    }

    if (iconType === 'clock') {
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={PALETTE.infoText} strokeWidth="2" />
          <Path
            d="M12 6v6l4 2"
            stroke={PALETTE.infoText}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    }

    const strokeColor = type === 'critical' ? PALETTE.criticalText : PALETTE.warningText;
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M12 9v4M12 17h.01" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  };

  const getBorderColor = (type: SystemAlertItem['type']) => {
    switch (type) {
      case 'critical':
        return PALETTE.criticalBorder;
      case 'warning':
        return PALETTE.warningBorder;
      case 'info':
        return PALETTE.infoBorder;
    }
  };

  // ─── FULL REDIRECT PAGE: CONFIGURE THRESHOLDS ───────────────────────────
  if (isConfiguring) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsConfiguring(false)}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#2B2523"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>Configure Alert Thresholds</Text>
            <Text style={styles.pageSubtitle}>Customize automatic trigger values across all nodes</Text>
          </View>

          {/* Full Screen Form Fields */}
          <View style={styles.fullFormContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minimum Warehouse Stock (%)</Text>
              <TextInput
                style={styles.textInput}
                value={stockThreshold}
                onChangeText={setStockThreshold}
                keyboardType="numeric"
                placeholder="e.g. 35"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Farm Quarterly Audit Close Window (Days)</Text>
              <TextInput
                style={styles.textInput}
                value={auditDays}
                onChangeText={setAuditDays}
                keyboardType="numeric"
                placeholder="e.g. 5"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Certification Expiry Notice (Days)</Text>
              <TextInput
                style={styles.textInput}
                value={certDays}
                onChangeText={setCertDays}
                keyboardType="numeric"
                placeholder="e.g. 30"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Counter-Offer Window (Hours)</Text>
              <TextInput
                style={styles.textInput}
                value={offerHours}
                onChangeText={setOfferHours}
                keyboardType="numeric"
                placeholder="e.g. 24"
              />
            </View>
          </View>

          {/* Action Save Button */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleSaveThresholds}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionBtnText}>Save Thresholds</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN SCREEN: ALERTS LIST ──────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Title and Subtitle */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>System Alerts</Text>
          <Text style={styles.pageSubtitle}>Platform-wide, auto-generated from thresholds</Text>
        </View>

        {/* 3 Metric Stat Counters */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[
              styles.statCard,
              activeFilter === 'critical' && styles.statCardActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'critical' ? 'all' : 'critical')}
            activeOpacity={0.75}
          >
            <Text style={[styles.statValue, { color: PALETTE.criticalText }]}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              activeFilter === 'warning' && styles.statCardActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'warning' ? 'all' : 'warning')}
            activeOpacity={0.75}
          >
            <Text style={[styles.statValue, { color: PALETTE.warningText }]}>{warningCount}</Text>
            <Text style={styles.statLabel}>Warning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              activeFilter === 'info' && styles.statCardActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'info' ? 'all' : 'info')}
            activeOpacity={0.75}
          >
            <Text style={[styles.statValue, { color: PALETTE.infoText }]}>{infoCount}</Text>
            <Text style={styles.statLabel}>Info</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {displayedAlerts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.alertCard, { borderColor: getBorderColor(item.type) }]}
              onPress={item.action}
              activeOpacity={item.action ? 0.75 : 1}
            >
              <View style={styles.alertCardHeaderRow}>
                <View style={styles.alertIconWrapper}>{renderIcon(item.type, item.iconType)}</View>

                <View style={styles.alertTextContent}>
                  <Text style={styles.alertTitle}>{item.title}</Text>
                  <Text style={styles.alertDesc}>{item.desc}</Text>
                </View>

                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => handleDismiss(item.id)}
                  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  activeOpacity={0.6}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 6L6 18M6 6l12 12"
                      stroke={PALETTE.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {displayedAlerts.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No active alerts</Text>
              <Text style={styles.emptySub}>All platform thresholds are operating within safe parameters.</Text>
            </View>
          )}
        </View>

        {/* Configure Alert Thresholds Action Button -> Redirects to Full Screen */}
        <TouchableOpacity
          style={styles.configureBtn}
          onPress={() => setIsConfiguring(true)}
          activeOpacity={0.8}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
              stroke="#111827"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.configureBtnText}>Configure Alert Thresholds</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: '#EFE7DE',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerBlock: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#F0ECE6',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statCardActive: {
    borderColor: PALETTE.orangePrimary,
    backgroundColor: '#FFF8F5',
  },
  statValue: {
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  alertsList: {
    gap: 14,
    marginBottom: 20,
  },
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1.4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  alertCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconWrapper: {
    marginTop: 2,
    marginRight: 12,
  },
  alertTextContent: {
    flex: 1,
    paddingRight: 8,
  },
  alertTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  alertDesc: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    lineHeight: 19,
    marginTop: 4,
  },
  dismissBtn: {
    padding: 4,
    marginTop: 1,
  },
  emptyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#F0ECE6',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  configureBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  configureBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  fullFormContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: PALETTE.textPrimary,
  },
  primaryActionBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orangePrimary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
