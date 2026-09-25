import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

// ─── Store / Market Stall Icon ───────────────────────────────────────────────
function MarketStallIcon({ color = SALES_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l1.5-6h15L21 9M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 3 0M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusIcon({ color = '#1F1714', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface MarketSaleRecord {
  id: string;
  title: string;
  type: 'Cash' | 'UPI';
  customerType: string;
  time: string;
  amount: number;
}

const INITIAL_SALES: MarketSaleRecord[] = [
  {
    id: 'sale-1',
    title: 'Cash sale — Carrots 5kg',
    type: 'Cash',
    customerType: 'Walk-in customer',
    time: '9:14 AM',
    amount: 210,
  },
  {
    id: 'sale-2',
    title: 'Cash sale — Cabbage 3kg',
    type: 'Cash',
    customerType: 'Walk-in customer',
    time: '9:22 AM',
    amount: 84,
  },
  {
    id: 'sale-3',
    title: 'UPI sale — Potatoes 10kg',
    type: 'UPI',
    customerType: 'Walk-in customer',
    time: '9:35 AM',
    amount: 380,
  },
  {
    id: 'sale-4',
    title: 'Cash sale — Beetroot 2kg',
    type: 'Cash',
    customerType: 'Walk-in customer',
    time: '9:48 AM',
    amount: 90,
  },
  {
    id: 'sale-5',
    title: 'UPI sale — Mixed Greens 4kg',
    type: 'UPI',
    customerType: 'Walk-in customer',
    time: '10:05 AM',
    amount: 160,
  },
];

export interface SalesMarketDayScreenProps {
  onBack?: () => void;
}

export function SalesMarketDayScreen({ onBack }: SalesMarketDayScreenProps) {
  const [sales, setSales] = useState<MarketSaleRecord[]>(INITIAL_SALES);
  const [viewMode, setViewMode] = useState<'list' | 'record'>('list');

  // Form states for full-screen recording
  const [produce, setProduce] = useState('Carrots');
  const [weight, setWeight] = useState('5');
  const [rate, setRate] = useState('42');
  const [payType, setPayType] = useState<'Cash' | 'UPI'>('Cash');

  const handleAddSale = () => {
    const totalAmount = (parseFloat(weight) || 1) * (parseFloat(rate) || 40);
    const newRecord: MarketSaleRecord = {
      id: `sale-${Date.now()}`,
      title: `${payType} sale — ${produce} ${weight}kg`,
      type: payType,
      customerType: 'Walk-in customer',
      time: 'Just now',
      amount: Math.round(totalAmount),
    };
    setSales([newRecord, ...sales]);
    setViewMode('list');
  };

  // ─── FULL SCREEN 2: RECORD MARKET SALE SCREEN ──────────────────────────────
  if (viewMode === 'record') {
    const estimatedTotal = Math.round((parseFloat(weight) || 0) * (parseFloat(rate) || 0));

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.recordContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Back Button */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <BackChevronIcon />
              </TouchableOpacity>
            </View>

            {/* Title Block */}
            <View style={styles.titleBlock}>
              <Text style={styles.screenTitle}>Record Market Sale</Text>
              <Text style={styles.screenSubtitle}>
                Ooty Warehouse · Quick cash & UPI direct billing
              </Text>
            </View>

            {/* Card Form Container */}
            <View style={styles.formCard}>
              {/* Produce Selector */}
              <Text style={styles.inputLabel}>Produce Item</Text>
              <View style={styles.producePillRow}>
                {['Carrots', 'Cabbage', 'Potatoes', 'Beetroot', 'Garlic', 'Broccoli', 'Beans'].map(
                  (p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.miniPill, produce === p && styles.miniPillActive]}
                      onPress={() => {
                        setProduce(p);
                        if (p === 'Carrots') setRate('42');
                        else if (p === 'Cabbage') setRate('28');
                        else if (p === 'Potatoes') setRate('38');
                        else if (p === 'Beetroot') setRate('45');
                        else if (p === 'Garlic') setRate('120');
                        else if (p === 'Broccoli') setRate('80');
                        else setRate('60');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.miniPillText,
                          produce === p && styles.miniPillTextActive,
                        ]}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Quantity & Rate Row */}
              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Quantity (kg)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="5"
                    placeholderTextColor="#A8A29E"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Rate / kg (₹)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={rate}
                    onChangeText={setRate}
                    placeholder="42"
                    placeholderTextColor="#A8A29E"
                  />
                </View>
              </View>

              {/* Payment Method */}
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.payTypeRow}>
                <TouchableOpacity
                  style={[styles.payTypeBtn, payType === 'Cash' && styles.payTypeBtnActive]}
                  onPress={() => setPayType('Cash')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.payTypeText,
                      payType === 'Cash' && styles.payTypeTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.payTypeBtn, payType === 'UPI' && styles.payTypeBtnActive]}
                  onPress={() => setPayType('UPI')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.payTypeText,
                      payType === 'UPI' && styles.payTypeTextActive,
                    ]}
                  >
                    UPI / QR
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Total Estimated Price Card */}
              <View style={styles.totalPreview}>
                <Text style={styles.totalPreviewLabel}>Total Estimated Price:</Text>
                <Text style={styles.totalPreviewAmount}>₹{estimatedTotal}</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitSaleBtn}
                onPress={handleAddSale}
                activeOpacity={0.85}
              >
                <Text style={styles.submitSaleBtnText}>Confirm & Add Sale</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── FULL SCREEN 1: LIVE MARKET DAY SALES LIST ─────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setViewMode('record')}
            activeOpacity={0.7}
          >
            <PlusIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Live Market Day Sales</Text>
          <Text style={styles.screenSubtitle}>
            Ooty Warehouse · Market day Sep 14 · {sales.length} sales recorded
          </Text>
        </View>

        {/* Sales List */}
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.salesList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.saleCard}>
              <View style={styles.saleCardLeft}>
                <View style={styles.stallIconBox}>
                  <MarketStallIcon color={SALES_PALETTE.primaryOrange} size={20} />
                </View>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleTitle}>{item.title}</Text>
                  <Text style={styles.saleSubtitle}>
                    {item.customerType} · {item.time}
                  </Text>
                </View>
              </View>
              <Text style={styles.saleAmount}>₹{item.amount}</Text>
            </View>
          )}
        />

        {/* Bottom Floating Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={() => setViewMode('record')}
            activeOpacity={0.85}
          >
            <Text style={styles.recordButtonText}>+ Record New Sale</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  recordContentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
  },
  salesList: {
    paddingBottom: 90,
  },
  saleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  saleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  stallIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 2,
  },
  saleSubtitle: {
    fontSize: 12,
    color: SALES_PALETTE.textSecondary,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  recordButton: {
    backgroundColor: SALES_PALETTE.primaryOrange,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SALES_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 8,
    marginTop: 6,
  },
  producePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  miniPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: SALES_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
  },
  miniPillActive: {
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    borderColor: SALES_PALETTE.primaryOrange,
  },
  miniPillText: {
    fontSize: 12,
    color: SALES_PALETTE.textSecondary,
    fontWeight: '500',
  },
  miniPillTextActive: {
    color: SALES_PALETTE.primaryOrange,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: SALES_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: SALES_PALETTE.textPrimary,
  },
  payTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  payTypeBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.pageBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
  },
  payTypeBtnActive: {
    backgroundColor: '#FFF1EB',
    borderColor: SALES_PALETTE.primaryOrange,
  },
  payTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: SALES_PALETTE.textSecondary,
  },
  payTypeTextActive: {
    color: SALES_PALETTE.primaryOrange,
    fontWeight: '700',
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: SALES_PALETTE.borderSoft,
    marginBottom: 18,
  },
  totalPreviewLabel: {
    fontSize: 14,
    color: SALES_PALETTE.textSecondary,
  },
  totalPreviewAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: SALES_PALETTE.textHeading,
  },
  submitSaleBtn: {
    backgroundColor: SALES_PALETTE.primaryOrange,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: SALES_PALETTE.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  submitSaleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
