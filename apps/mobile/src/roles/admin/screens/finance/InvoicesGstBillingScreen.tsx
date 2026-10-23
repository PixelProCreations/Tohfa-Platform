import React, { useState, useMemo } from 'react';
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing } from '../../theme';
import { InvoiceDetailScreen, type InvoiceDetailData } from './InvoiceDetailScreen';
import { TransactionHistoryScreen } from './TransactionHistoryScreen';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#786F68' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface BillingInvoiceItem {
  id: string;
  title: string;
  status: 'Issued' | 'Draft' | 'Cancelled';
  subtitle: string;
  subtitle2?: string;
  actions: string[];
  isAlert?: boolean;
  detail: InvoiceDetailData;
}

const INVOICES_DATA: BillingInvoiceItem[] = [
  {
    id: 'inv-1',
    title: 'INV-2026-0001 · SO-0005',
    status: 'Issued',
    subtitle: 'Demo Traders LLP · B2B · ₹7,400.00 · 5 Oct 2026',
    actions: ['Download', 'Details'],
    detail: {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-0001',
      status: 'Issued',
      dateStr: '5 Oct 2026',
      soNumber: 'SO-0005',
      recipient: 'Demo Traders LLP (C-1006)',
      billingAddress: '42 Main Bazaar, Ooty',
      gstin: '33AABCT1234D1Z5',
      itemName: 'Beans',
      itemGrade: 'Grade 1',
      itemRate: '150 kg × ₹49.33/kg',
      itemTotal: '₹7,400.00',
      taxableAmount: '₹7,400.00',
      taxText: 'Included: 5% GST (₹370.00)',
      finalAmountText: '₹7,400.00',
      historyEvents: [
        { date: '5 Oct 2026, 15:30 · Demo TOHFA Admin', title: 'Invoice issued: INV-2026-0001' },
        { date: '5 Oct 2026, 14:00 · Demo TOHFA Admin', title: 'Draft created' },
      ],
      payoutInfo: {
        payoutId: 'PY-0001',
        poNumber: 'PO-0005',
        farmerName: 'Rajesh Farm',
        amount: '₹7,400.00',
      },
    },
  },
  {
    id: 'inv-2',
    title: '— · SO-0004',
    status: 'Draft',
    subtitle: 'Demo Hotel Pvt Ltd · HORECA · ₹3,700.00',
    actions: ['Details'],
    detail: {
      id: 'inv-2',
      invoiceNumber: 'DRAFT-SO-0004',
      status: 'Draft',
      dateStr: '8 Oct 2026',
      soNumber: 'SO-0004',
      recipient: 'Demo Hotel Pvt Ltd (C-1004)',
      billingAddress: 'Coonoor Club Road, Coonoor',
      gstin: '33AAACH9876E1Z2',
      itemName: 'Carrot',
      itemGrade: 'Grade 1',
      itemRate: '100 kg × ₹37.00/kg',
      itemTotal: '₹3,700.00',
      taxableAmount: '₹3,700.00',
      taxText: 'Draft estimated tax: ₹185.00',
      finalAmountText: '₹3,700.00',
      historyEvents: [
        { date: '8 Oct 2026, 11:30 · Demo TOHFA Admin', title: 'Draft created' },
      ],
      payoutInfo: {
        payoutId: 'PY-0004',
        poNumber: 'PO-0004',
        farmerName: 'Meena Farm',
        amount: '₹3,700.00',
      },
    },
  },
  {
    id: 'inv-3',
    title: 'INV-2026-0003 · SO-0009',
    status: 'Cancelled',
    subtitle: 'Demo Customer D · Online · ₹140.00',
    subtitle2: 'Reason: Wrong billing details (demo)',
    actions: ['History'],
    isAlert: true,
    detail: {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-0003',
      status: 'Cancelled',
      dateStr: '7 Oct 2026',
      soNumber: 'SO-0009',
      recipient: 'Demo Customer D (C-1004)',
      billingAddress: '—',
      gstin: 'Not applicable',
      itemName: 'Cabbage',
      itemGrade: 'Grade 1',
      itemRate: '5 kg × ₹28.00/kg',
      itemTotal: '₹140.00',
      taxableAmount: '₹140.00',
      taxText: 'Not calculated: GST treatment not confirmed',
      finalAmountText: 'Not final until tax is calculated',
      historyEvents: [
        { date: '13 Oct 2026, 12:00 · Demo TOHFA Admin', title: 'Invoice cancelled: Wrong billing details (demo).' },
        { date: '7 Oct 2026, 12:00 · Demo TOHFA Admin', title: 'Invoice issued: INV-2026-0003' },
        { date: '12 Oct 2026, 12:00 · Demo TOHFA Admin', title: 'Draft created' },
      ],
      payoutInfo: {
        payoutId: 'PY-0005',
        poNumber: 'PO-0009',
        farmerName: 'Kumar',
        amount: '₹3,300.00',
      },
    },
  },
  {
    id: 'inv-4',
    title: 'INV-2026-0002 · SO-0001',
    status: 'Issued',
    subtitle: 'Demo Customer A · Online · ₹350.00 · 3 Oct 2026',
    actions: ['Download', 'Details'],
    detail: {
      id: 'inv-4',
      invoiceNumber: 'INV-2026-0002',
      status: 'Issued',
      dateStr: '3 Oct 2026',
      soNumber: 'SO-0001',
      recipient: 'Demo Customer A (C-1001)',
      billingAddress: 'Ooty Town',
      gstin: 'Not applicable',
      itemName: 'Potato',
      itemGrade: 'Grade 1',
      itemRate: '10 kg × ₹35.00/kg',
      itemTotal: '₹350.00',
      taxableAmount: '₹350.00',
      taxText: 'Standard rate applied',
      finalAmountText: '₹350.00',
      historyEvents: [
        { date: '3 Oct 2026, 10:00 · Demo TOHFA Admin', title: 'Invoice issued: INV-2026-0002' },
        { date: '3 Oct 2026, 09:30 · Demo TOHFA Admin', title: 'Draft created' },
      ],
      payoutInfo: {
        payoutId: 'PY-0002',
        poNumber: 'PO-0001',
        farmerName: 'Anand Farm',
        amount: '₹350.00',
      },
    },
  },
];

export interface InvoicesGstBillingScreenProps {
  onBack: () => void;
}

export function InvoicesGstBillingScreen({ onBack }: InvoicesGstBillingScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>('inv-3');
  const [showHistory, setShowHistory] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return INVOICES_DATA;
    const q = searchQuery.toLowerCase().trim();
    return INVOICES_DATA.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.subtitle2 && item.subtitle2.toLowerCase().includes(q)) ||
        item.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (showHistory) {
    return (
      <TransactionHistoryScreen
        onBack={() => setShowHistory(false)}
      />
    );
  }

  // When a record is tapped, redirect to InvoiceDetailScreen (Image 4)
  if (selectedInvoice) {
    return (
      <InvoiceDetailScreen
        invoice={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices & GST Billing</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color="#786F68" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#786F68"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Counter Line ── */}
        <Text style={styles.counterText}>{filteredItems.length} invoices</Text>

        {/* ── Invoices Cards List ── */}
        {filteredItems.map((item) => {
          const isIssued = item.status === 'Issued';
          const isCancelled = item.status === 'Cancelled';
          const isDraft = item.status === 'Draft';

          const isSelected = selectedCardId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.invoiceCard,
                isSelected && styles.invoiceCardAlert,
              ]}
              onPress={() => {
                setSelectedCardId(item.id);
                if (item.actions.includes('History') || item.id === 'inv-3') {
                  setShowHistory(true);
                } else {
                  setSelectedInvoice(item.detail);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.invoiceHeaderRow}>
                <Text style={styles.invoiceTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isIssued
                      ? styles.badgeGreen
                      : isCancelled
                      ? styles.badgeRed
                      : isDraft
                      ? styles.badgeGray
                      : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isIssued
                        ? styles.badgeTextGreen
                        : isCancelled
                        ? styles.badgeTextRed
                        : styles.badgeTextGray,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.invoiceSubtitle}>{item.subtitle}</Text>
              {item.subtitle2 ? (
                <Text style={styles.invoiceSubtitle2}>{item.subtitle2}</Text>
              ) : null}

              {/* Action Buttons Row */}
              <View style={styles.actionsRow}>
                {item.actions.map((act) => (
                  <TouchableOpacity
                    key={act}
                    onPress={() => {
                      if (act === 'History') {
                        setShowHistory(true);
                      } else if (act === 'Download') {
                        Alert.alert('Download', `Downloading invoice PDF for ${item.detail.invoiceNumber}.`);
                      } else {
                        setSelectedInvoice(item.detail);
                      }
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  >
                    <Text style={styles.actionBtnText}>{act}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
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
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 10,
  },
  invoiceCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  invoiceCardAlert: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invoiceTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeGray: {
    backgroundColor: '#F3F0EA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  invoiceSubtitle: {
    fontSize: 12.5,
    color: '#5A524D',
    marginTop: 2,
    lineHeight: 18,
  },
  invoiceSubtitle2: {
    fontSize: 12,
    color: '#786F68',
    marginTop: 2,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 4,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
});
