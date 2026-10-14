import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { PLStatementScreen } from '../finance/PLStatementScreen';
import { FarmerPerformanceReportScreen } from './FarmerPerformanceReportScreen';
import { WarehouseOpsReportScreen } from './WarehouseOpsReportScreen';
import { ReportAddFieldScreen } from './ReportAddFieldScreen';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  textHeading: '#662208',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  orangePrimary: '#E85226',
  orangeLight: '#FFF1EB',
  borderCard: '#ECE5DC',
  borderPill: '#E5E7EB',
  blueBox: '#EFF6FF',
  blueText: '#1E40AF',
  blueIcon: '#2563EB',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke="#1F2937"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={PALETTE.orangePrimary} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={PALETTE.orangePrimary} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={PALETTE.orangePrimary} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function TwoUsersIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        stroke={PALETTE.orangePrimary}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={PALETTE.orangePrimary} strokeWidth="2" />
      <Path d="M22 21v-2a4 4 0 00-3-3.87" stroke={PALETTE.orangePrimary} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 010 7.75" stroke={PALETTE.orangePrimary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseBuildingIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9.5L12 4l9 5.5V21H3z" stroke={PALETTE.orangePrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-7h6v7" stroke={PALETTE.orangePrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DragGripIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="6" r="1.5" fill="#9CA3AF" />
      <Circle cx="15" cy="6" r="1.5" fill="#9CA3AF" />
      <Circle cx="9" cy="12" r="1.5" fill="#9CA3AF" />
      <Circle cx="15" cy="12" r="1.5" fill="#9CA3AF" />
      <Circle cx="9" cy="18" r="1.5" fill="#9CA3AF" />
      <Circle cx="15" cy="18" r="1.5" fill="#9CA3AF" />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SaveDiskIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 21v-8H7v8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 3v5h8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={PALETTE.blueIcon} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={PALETTE.blueIcon} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface ReportBuilderScreenProps {
  onBack: () => void;
  onNavigateToPL?: () => void;
  onNavigateToFarmer?: () => void;
  onNavigateToWarehouse?: () => void;
  onGenerate?: (type: string) => void;
}

export function ReportBuilderScreen({
  onBack,
  onNavigateToPL,
  onNavigateToFarmer,
  onNavigateToWarehouse,
}: ReportBuilderScreenProps) {
  const [subScreen, setSubScreen] = useState<'pl' | 'farmer' | 'warehouse' | 'addField' | null>(null);
  const [customFields, setCustomFields] = useState<string[]>([
    'Sales by Channel',
    'Farmer Payout Dues',
  ]);

  const handleRemoveField = (fieldNameToRemove: string) => {
    setCustomFields((prev) => prev.filter((f) => f !== fieldNameToRemove));
  };

  const handleAddField = (newField: string) => {
    if (!customFields.includes(newField)) {
      setCustomFields((prev) => [...prev, newField]);
    }
  };

  const handleSaveTemplate = () => {
    Alert.alert(
      'Template Saved',
      `Custom report template containing ${customFields.length} fields has been saved to your favorites.`,
      [{ text: 'OK' }]
    );
  };

  // Subscreen navigation
  if (subScreen === 'pl') {
    return <PLStatementScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === 'farmer') {
    return <FarmerPerformanceReportScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === 'warehouse') {
    return <WarehouseOpsReportScreen onBack={() => setSubScreen(null)} />;
  }
  if (subScreen === 'addField') {
    return (
      <ReportAddFieldScreen
        onBack={() => setSubScreen(null)}
        onAddField={handleAddField}
        existingFields={customFields}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Title Block */}
        <Text style={styles.pageTitle}>Report Builder</Text>
        <Text style={styles.pageSubtitle}>
          Pre-built templates or drag-and-drop custom (web)
        </Text>

        {/* Section 1: Pre-built templates */}
        <Text style={styles.sectionHeading}>Pre-built templates</Text>

        <View style={styles.templateList}>
          {/* Card 1: P&L Report */}
          <TouchableOpacity
            style={styles.templateCard}
            onPress={() => {
              if (onNavigateToPL) {
                onNavigateToPL();
              } else {
                setSubScreen('pl');
              }
            }}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <BarChartIcon />
            </View>
            <View style={styles.templateContent}>
              <Text style={styles.templateTitle}>P&L Report</Text>
              <Text style={styles.templateSub}>Revenue, expenses, net profit</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Card 2: Farmer Performance Report */}
          <TouchableOpacity
            style={styles.templateCard}
            onPress={() => {
              if (onNavigateToFarmer) {
                onNavigateToFarmer();
              } else {
                setSubScreen('farmer');
              }
            }}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <TwoUsersIcon />
            </View>
            <View style={styles.templateContent}>
              <Text style={styles.templateTitle}>Farmer Performance Report</Text>
              <Text style={styles.templateSub}>Ratings, audit scores, listing activity</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Card 3: Warehouse Ops Report */}
          <TouchableOpacity
            style={styles.templateCard}
            onPress={() => {
              if (onNavigateToWarehouse) {
                onNavigateToWarehouse();
              } else {
                setSubScreen('warehouse');
              }
            }}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <WarehouseBuildingIcon />
            </View>
            <View style={styles.templateContent}>
              <Text style={styles.templateTitle}>Warehouse Ops Report</Text>
              <Text style={styles.templateSub}>Stock turnover, transfers, quality checks</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        {/* Section 2: Custom report builder (web) */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
          Custom report builder (web)
        </Text>

        <View style={styles.customFieldsList}>
          {customFields.map((field) => (
            <View key={field} style={styles.fieldItem}>
              <View style={styles.fieldItemLeft}>
                <DragGripIcon />
                <Text style={styles.fieldItemText}>{field}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveField(field)}
                style={styles.removeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add Field Button */}
        <TouchableOpacity
          style={styles.addFieldBtn}
          onPress={() => setSubScreen('addField')}
          activeOpacity={0.8}
        >
          <PlusIcon />
          <Text style={styles.addFieldBtnText}>Add Field</Text>
        </TouchableOpacity>

        {/* Save Template Button */}
        <TouchableOpacity
          style={styles.saveTemplateBtn}
          onPress={handleSaveTemplate}
          activeOpacity={0.85}
        >
          <SaveDiskIcon />
          <Text style={styles.saveTemplateBtnText}>Save Template</Text>
        </TouchableOpacity>

        {/* Info Banner at Bottom */}
        <View style={styles.infoBanner}>
          <ClockIcon />
          <Text style={styles.infoBannerText}>
            Reports can be scheduled as recurring emails, or exported on demand as PDF, Excel, or CSV.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 12,
  },
  templateList: {
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: PALETTE.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 3,
  },
  templateSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
  },
  customFieldsList: {
    gap: 10,
    marginBottom: 12,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  fieldItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fieldItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  removeBtn: {
    padding: 4,
  },
  removeBtnText: {
    fontSize: 15,
    color: PALETTE.textMuted,
    fontWeight: '600',
  },
  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
    gap: 8,
    marginBottom: 14,
  },
  addFieldBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 16,
    shadowColor: PALETTE.orangePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  saveTemplateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.blueBox,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.blueText,
    lineHeight: 18,
  },
});
