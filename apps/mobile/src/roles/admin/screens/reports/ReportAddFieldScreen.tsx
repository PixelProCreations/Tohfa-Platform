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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

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
  greenSuccess: '#166534',
  greenLight: '#EAF7EE',
  blueLight: '#EFF6FF',
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

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ color = PALETTE.greenSuccess }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface AvailableField {
  id: string;
  name: string;
  category: 'Financial' | 'Sales' | 'Farmer' | 'Warehouse';
  description: string;
}

const AVAILABLE_FIELDS: AvailableField[] = [
  // Financial
  {
    id: 'f1',
    name: 'Gross Revenue & GMV',
    category: 'Financial',
    description: 'Consolidated sales revenue across all active market channels.',
  },
  {
    id: 'f2',
    name: 'Farmer Payout Dues',
    category: 'Financial',
    description: 'Pending bank settlement balances owed to registered growers.',
  },
  {
    id: 'f3',
    name: 'Net Operating Margin (EBITDA)',
    category: 'Financial',
    description: 'Operating profitability percentage after cold-chain logistics costs.',
  },
  {
    id: 'f4',
    name: 'Logistics & Freight Expense',
    category: 'Financial',
    description: 'Breakdown of fuel, reefer transport, and driver allowances.',
  },
  {
    id: 'f5',
    name: 'GST Input Tax Credit',
    category: 'Financial',
    description: 'Reverse-charge tax credits logged for wholesale transactions.',
  },

  // Sales
  {
    id: 's1',
    name: 'Sales by Channel',
    category: 'Sales',
    description: 'Split between Online Consumer, Mandi Auction, and Horeca B2B.',
  },
  {
    id: 's2',
    name: 'Order Volume (MT)',
    category: 'Sales',
    description: 'Total weight of certified produce dispatched to end buyers.',
  },
  {
    id: 's3',
    name: 'Average Order Value (AOV)',
    category: 'Sales',
    description: 'Average rupee spend per transaction across consumer app orders.',
  },
  {
    id: 's4',
    name: 'Buyer Return & QC Discard Rate',
    category: 'Sales',
    description: 'Percentage of dispatched items flagged for transit damage.',
  },

  // Farmer & Procurement
  {
    id: 'fm1',
    name: 'Farmer Scorecard Ratings',
    category: 'Farmer',
    description: '5-star quality and reliability index computed per grower.',
  },
  {
    id: 'fm2',
    name: 'Procurement Volume by Crop',
    category: 'Farmer',
    description: 'Breakdown of tea, carrots, cabbage, and beetroot receipts.',
  },
  {
    id: 'fm3',
    name: 'Fair Price Ceiling Compliance',
    category: 'Farmer',
    description: 'Percentage of gate receipts matching or beating parity ceiling.',
  },
  {
    id: 'fm4',
    name: 'Organic & PGS Certification Status',
    category: 'Farmer',
    description: 'Verified organic cluster compliance documentation audit.',
  },

  // Warehouse
  {
    id: 'wh1',
    name: 'Warehouse Stock Turnover Rate',
    category: 'Warehouse',
    description: 'Average holding duration before dispatch from Nilgiris depots.',
  },
  {
    id: 'wh2',
    name: 'QC Quality Rejection %',
    category: 'Warehouse',
    description: 'Batch defect rate recorded at initial intake weighbridge.',
  },
  {
    id: 'wh3',
    name: 'Cold-Chain Temperature Logs',
    category: 'Warehouse',
    description: 'Sub-zero temperature maintenance audit for perishables.',
  },
  {
    id: 'wh4',
    name: 'Inter-Hub Fleet Transfers',
    category: 'Warehouse',
    description: 'Track ongoing truck dispatches between regional depots.',
  },
];

export interface ReportAddFieldScreenProps {
  onBack: () => void;
  onAddField: (fieldName: string) => void;
  existingFields?: string[];
}

export function ReportAddFieldScreen({
  onBack,
  onAddField,
  existingFields = ['Sales by Channel', 'Farmer Payout Dues'],
}: ReportAddFieldScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [addedFields, setAddedFields] = useState<string[]>(existingFields);

  const categories = ['All', 'Financial', 'Sales', 'Farmer', 'Warehouse'];

  const filteredFields = AVAILABLE_FIELDS.filter((f) => {
    if (selectedCategory !== 'All' && f.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAdd = (fieldName: string) => {
    if (addedFields.includes(fieldName)) {
      Alert.alert('Already Added', `"${fieldName}" is already present in your report template.`);
      return;
    }
    setAddedFields((prev) => [...prev, fieldName]);
    onAddField(fieldName);
    Alert.alert('Field Added', `"${fieldName}" added to your custom report template.`);
  };

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

        {/* Heading */}
        <Text style={styles.screenTitle}>Add Report Field</Text>
        <Text style={styles.screenSub}>
          Select metrics and dimensions to include in your custom report
        </Text>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search metrics, dimensions, keywords..."
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: PALETTE.textSecondary, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Fields List */}
        <View style={styles.fieldsContainer}>
          {filteredFields.map((field) => {
            const isAlreadyAdded = addedFields.includes(field.name);

            return (
              <View key={field.id} style={styles.fieldCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.fieldMetaRow}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{field.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.fieldDesc}>{field.description}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isAlreadyAdded ? styles.actionBtnAdded : styles.actionBtnAdd,
                  ]}
                  onPress={() => handleAdd(field.name)}
                  disabled={isAlreadyAdded}
                  activeOpacity={0.8}
                >
                  {isAlreadyAdded ? (
                    <>
                      <CheckIcon />
                      <Text style={styles.actionBtnAddedText}>Added</Text>
                    </>
                  ) : (
                    <>
                      <PlusIcon color="#FFFFFF" />
                      <Text style={styles.actionBtnAddText}>Add</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {filteredFields.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No matching fields</Text>
              <Text style={styles.emptySub}>Try searching for revenue, orders, crop, or stock.</Text>
            </View>
          )}
        </View>

        {/* Done / Return to Report Builder Button */}
        <TouchableOpacity style={styles.doneBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

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
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textPrimary,
    padding: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
  },
  catPillActive: {
    backgroundColor: PALETTE.orangePrimary,
    borderColor: PALETTE.orangePrimary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  catTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.borderCard,
    gap: 12,
  },
  fieldMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  fieldDesc: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnAdd: {
    backgroundColor: PALETTE.orangePrimary,
  },
  actionBtnAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnAdded: {
    backgroundColor: PALETTE.greenLight,
  },
  actionBtnAddedText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenSuccess,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orangePrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
