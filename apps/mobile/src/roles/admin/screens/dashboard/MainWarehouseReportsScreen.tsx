import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MainWarehouseSummaryReportScreen } from './MainWarehouseSummaryReportScreen';
import { ReportSummaryScreen } from '../warehouse/reports';
import type { PermissionCheck, WarehouseScope } from '../warehouse/finance-expenses';
import { MainWarehouseExportReportScreen } from './MainWarehouseExportReportScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  infoBg: '#FAEBE6',
  infoText: '#C47432',
};

function BellIcon({ color = '#FFF', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ color = '#6B7280', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReportsIcon({ color = '#FFF', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="4" y="14" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M14 7h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface MainWarehouseReportsScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
}

export function MainWarehouseReportsScreen({ scope, can, onBack }: MainWarehouseReportsScreenProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [tempWarehouse, setTempWarehouse] = useState<'all' | 'coonoor'>('all');
  
  const [viewReturnsReport, setViewReturnsReport] = useState(false);
  const [viewSummaryReport, setViewSummaryReport] = useState(false);
  const [viewSalesReport, setViewSalesReport] = useState(false);
  const [viewExportReport, setViewExportReport] = useState(false);

  if (viewReturnsReport) {
    return <ReportSummaryScreen kind="RETURNS" scope={scope} can={can} onBack={() => setViewReturnsReport(false)} />;
  }
  if (viewSummaryReport) return <MainWarehouseSummaryReportScreen onBack={() => setViewSummaryReport(false)} />;
  if (viewSalesReport) {
    return <ReportSummaryScreen kind="SALES" scope={scope} can={can} onBack={() => setViewSalesReport(false)} />;
  }
  if (viewExportReport) return <MainWarehouseExportReportScreen onBack={() => setViewExportReport(false)} />;

  const sections = [
    {
      title: 'OPERATIONS',
      items: ['Sales Report', 'Inventory Report', 'Receiving Report'],
    },
    {
      title: 'CUSTOMERS',
      items: ['Customer Report'],
    },
    {
      title: 'FINANCE',
      items: ['Revenue Report', 'Expense Report', 'Cash Top-Up Report'],
    },
    {
      title: 'RETURNS',
      items: ['Returns Report'],
    },
    {
      title: 'SUMMARY',
      items: ['Daily / Monthly Summary', 'Export Report'],
    }
  ];

  const handleItemPress = (item: string) => {
    if (item === 'Returns Report') setViewReturnsReport(true);
    if (item === 'Daily / Monthly Summary') setViewSummaryReport(true);
    if (item === 'Sales Report') setViewSalesReport(true);
    if (item === 'Export Report') setViewExportReport(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <ReportsIcon />
            <Text style={styles.headerTitle}>Reports</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <BellIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.warehouseDropdown} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
          <WarehouseIcon />
          <Text style={styles.warehouseText}>All Warehouses</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
      </View>

      {showDropdown ? (
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownRow}>
            <TouchableOpacity 
              style={[styles.dropdownBtn, tempWarehouse === 'all' && styles.dropdownBtnActive]}
              onPress={() => setTempWarehouse('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownBtnText, tempWarehouse === 'all' && styles.dropdownBtnTextActive]}>All Warehouses</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownBtn, tempWarehouse === 'coonoor' && styles.dropdownBtnActive]}
              onPress={() => setTempWarehouse('coonoor')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownBtnText, tempWarehouse === 'coonoor' && styles.dropdownBtnTextActive]}>Coonoor</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowDropdown(false)} activeOpacity={0.8}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sections.map((section, idx) => (
            <View key={idx} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity 
                  key={itemIdx} 
                  style={styles.listItem}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemText}>{item}</Text>
                  <ChevronRightIcon />
                </TouchableOpacity>
              ))}
            </View>
          ))}
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Reports use server-side scoping and pagination — unrestricted warehouse data is never loaded to the client.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginLeft: 12 },
  bellBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  warehouseDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  warehouseText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 8 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  itemText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  infoBox: {
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: PALETTE.infoText,
    fontWeight: '600',
    lineHeight: 18,
  },
  dropdownContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    padding: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dropdownBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dropdownBtnActive: {
    backgroundColor: '#FAEEE3',
    borderColor: PALETTE.primary,
  },
  dropdownBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  dropdownBtnTextActive: {
    color: '#8A5A30',
  },
  applyBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
