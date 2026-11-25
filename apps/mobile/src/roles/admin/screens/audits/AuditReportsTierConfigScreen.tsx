import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { useAuditTierThresholds, useUpdateAuditTierThresholds } from './useAuditsData';

/** What a value the server has not supplied renders as. Never a sample number. */
const EM_DASH = '—';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarInputIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface AuditReportsTierConfigScreenProps {
  can?: Can | undefined;
  onBack: () => void;
  onGenerateReportSuccess?: (() => void) | undefined;
}

export function AuditReportsTierConfigScreen({
  can,
  onBack,
  onGenerateReportSuccess,
}: AuditReportsTierConfigScreenProps): React.JSX.Element {
  const canConfigure = can ? can('audit.tier.configure_thresholds') : true;

  // PATCH /admin/audit-tier-thresholds, and the GET that says what is in effect
  // now (BR-147a). Both carry audit.tier.configure_thresholds and the read is a
  // 403 without it, so the query is only enabled when the caller may configure
  // (BR-147b). The PATCH invalidates the audits prefix the GET is keyed under,
  // so after a save this form shows the bands the server actually stored.
  const updateTierThresholds = useUpdateAuditTierThresholds();
  const tierThresholds = useAuditTierThresholds({ enabled: canConfigure });
  // The tiers in effect, in the server's order. A band whose label the server
  // did not supply shows an em-dash rather than a made-up name.
  const tierOptions = (tierThresholds.data?.tiers ?? []).map((band) =>
    band.label.trim() === '' ? EM_DASH : band.label,
  );

  // Field values
  const [reportType, setReportType] = useState('Select...');
  const [auditType, setAuditType] = useState('Select...');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [farmer, setFarmer] = useState('Select...');
  const [farmZone, setFarmZone] = useState('Select...');
  const [auditor, setAuditor] = useState('Select...');
  const [auditStatus, setAuditStatus] = useState('Select...');
  const [redFlagStatus, setRedFlagStatus] = useState('Select...');
  const [tier, setTier] = useState(t('admin.audits.tierConfig.select'));
  const [exportType, setExportType] = useState('All');

  const [openDropdown, setOpenDropdown] = useState<
    'reportType' | 'auditType' | 'farmer' | 'farmZone' | 'auditor' | 'auditStatus' | 'redFlag' | 'tier' | 'exportType' | null
  >(null);

  const toggleDropdown = (
    field: 'reportType' | 'auditType' | 'farmer' | 'farmZone' | 'auditor' | 'auditStatus' | 'redFlag' | 'tier' | 'exportType',
  ) => {
    setOpenDropdown((prev) => (prev === field ? null : field));
  };

  const reportTypeOptions = [
    'Audit Summary Report',
    'Farmer Audit History',
    'Quarterly Audit Coverage',
    'Finding & Violations Report',
    'Corrective action report',
  ];

  const auditTypeOptions = ['All', 'Internal', 'External', 'PGS Organic'];
  const genericSelectOptions = ['—'];
  const exportTypeOptions = ['All', 'CSV only', 'PDF only', 'Excel'];

  const renderDropdownMenu = (options: string[], onSelect: (val: string) => void) => {
    return (
      <View style={styles.dropdownMenuBox}>
        <TouchableOpacity
          style={styles.dropdownMenuHeaderRow}
          onPress={() => {
            onSelect('Select...');
            setOpenDropdown(null);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownMenuHeaderText}>Select...</Text>
        </TouchableOpacity>

        {options.map((opt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dropdownMenuItemRow}
            onPress={() => {
              onSelect(opt);
              setOpenDropdown(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownMenuItemText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleSubmit = () => {
    if (!canConfigure) return;
    if (onGenerateReportSuccess) {
      onGenerateReportSuccess();
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 2 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Report Configuration
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeading}>Report filters</Text>

        {/* ── Form Card Matching Image 2 ── */}
        <View style={styles.formCard}>
          {/* Field 1: Report Type */}
          <Text style={styles.fieldLabel}>Report Type</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'reportType' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('reportType')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{reportType}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'reportType' &&
            renderDropdownMenu(reportTypeOptions, setReportType)}

          {/* Field 2: Audit Type */}
          <Text style={styles.fieldLabel}>Audit Type</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'auditType' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('auditType')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{auditType}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'auditType' &&
            renderDropdownMenu(auditTypeOptions, setAuditType)}

          {/* Field 3: Date Range (From / To) */}
          <Text style={styles.fieldLabel}>Date Range (From / To)</Text>
          <View style={styles.dateInputContainer}>
            <TextInput
              style={styles.dateTextInput}
              placeholder="DD-MM-YYYY"
              placeholderTextColor={adminColors.placeholder}
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <CalendarInputIcon />
          </View>

          <View style={[styles.dateInputContainer, styles.marginTopSm]}>
            <TextInput
              style={styles.dateTextInput}
              placeholder="DD-MM-YYYY"
              placeholderTextColor={adminColors.placeholder}
              value={dateTo}
              onChangeText={setDateTo}
            />
            <CalendarInputIcon />
          </View>

          {/* Field 4: Farmer */}
          <Text style={styles.fieldLabel}>Farmer</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'farmer' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('farmer')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{farmer}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'farmer' &&
            renderDropdownMenu(genericSelectOptions, setFarmer)}

          {/* Field 5: Farm Zone */}
          <Text style={styles.fieldLabel}>Farm Zone</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'farmZone' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('farmZone')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{farmZone}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'farmZone' &&
            renderDropdownMenu(genericSelectOptions, setFarmZone)}

          {/* Field 6: Auditor */}
          <Text style={styles.fieldLabel}>Auditor</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'auditor' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('auditor')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{auditor}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'auditor' &&
            renderDropdownMenu(genericSelectOptions, setAuditor)}

          {/* Field 7: Audit Status */}
          <Text style={styles.fieldLabel}>Audit Status</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'auditStatus' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('auditStatus')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{auditStatus}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'auditStatus' &&
            renderDropdownMenu(genericSelectOptions, setAuditStatus)}

          {/* Field 8: Red Flag Status */}
          <Text style={styles.fieldLabel}>Red Flag Status</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'redFlag' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('redFlag')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{redFlagStatus}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'redFlag' &&
            renderDropdownMenu(genericSelectOptions, setRedFlagStatus)}

          {/* Helper Caption */}
          <Text style={styles.tierHelperCaption}>
            Export formats supported: CSV and PDF.
          </Text>

          {/* Tier: the generation in effect now, read from the server (BR-147a). */}
          {tierOptions.length > 0 ? (
            <>
              <Text style={styles.fieldLabel}>{t('admin.audits.tierConfig.field.tier')}</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownInputTrigger,
                  openDropdown === 'tier' && styles.dropdownInputTriggerActive,
                ]}
                onPress={() => toggleDropdown('tier')}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('admin.audits.tierConfig.field.tier')}
              >
                <Text style={styles.dropdownInputText}>{tier}</Text>
                <ChevronDownIcon />
              </TouchableOpacity>
              {openDropdown === 'tier' && renderDropdownMenu(tierOptions, setTier)}
            </>
          ) : (
            <Text style={styles.tierHelperCaption}>{t('admin.audits.tierConfig.tiersPending')}</Text>
          )}

          {/* Field 9: Export Type */}
          <Text style={styles.fieldLabel}>Export Type</Text>
          <TouchableOpacity
            style={[
              styles.dropdownInputTrigger,
              openDropdown === 'exportType' && styles.dropdownInputTriggerActive,
            ]}
            onPress={() => toggleDropdown('exportType')}
            activeOpacity={0.75}
          >
            <Text style={styles.dropdownInputText}>{exportType}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>
          {openDropdown === 'exportType' &&
            renderDropdownMenu(exportTypeOptions, setExportType)}
        </View>

        {/* ── Submit / Export Action Button ── */}
        <TouchableOpacity
          style={[styles.submitBtn, !canConfigure && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!canConfigure || updateTierThresholds.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.submitBtnText}>
            {updateTierThresholds.isPending ? 'Saving...' : 'Export Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 6,
  },
  dropdownInputTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  dropdownInputTriggerActive: {
    borderColor: adminColors.ink,
    borderWidth: 1.5,
  },
  dropdownInputText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenuBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 4,
    overflow: 'hidden',
    ...adminShadow.md,
  },
  dropdownMenuHeaderRow: {
    backgroundColor: adminColors.muted,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  dropdownMenuHeaderText: {
    ...adminType.body,
    color: adminColors.card,
  },
  dropdownMenuItemRow: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownMenuItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  marginTopSm: {
    marginTop: adminSpacing.sm,
  },
  dateTextInput: {
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
    paddingVertical: 0,
  },
  tierHelperCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 12,
    marginBottom: 4,
  },
  submitBtn: {
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
