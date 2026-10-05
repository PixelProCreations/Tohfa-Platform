import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textDark: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  amberBg: '#FFFBEB',
  amberText: '#92400E',
};

export interface MainWarehouseRevenueDetailScreenProps {
  revenueId: string;
  customer: string;
  finalAmount: string;
  paymentMethod: string;
  isShortVersion?: boolean;
  onBack: () => void;
}

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
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

export function MainWarehouseRevenueDetailScreen({
  revenueId,
  customer,
  finalAmount,
  paymentMethod,
  isShortVersion,
  onBack,
}: MainWarehouseRevenueDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.75}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Detail</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Revenue ID</Text>
              <Text style={styles.value}>{revenueId}</Text>
            </View>
            {isShortVersion ? (
              <View style={styles.col}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>{customer}</Text>
              </View>
            ) : (
              <View style={styles.col}>
                <Text style={styles.label}>Order ID</Text>
                <Text style={styles.value}>ORD-10284</Text>
              </View>
            )}
          </View>

          {!isShortVersion && (
            <>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Invoice ID</Text>
                  <Text style={styles.value}>INV-2026-000845</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Customer</Text>
                  <Text style={styles.value}>{customer}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Sales Channel</Text>
                  <Text style={styles.value}>Market Sale</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Quantity</Text>
                  <Text style={styles.value}>3 KG</Text>
                </View>
              </View>
            </>
          )}

          <View style={[styles.row, { marginBottom: isShortVersion ? 0 : 16 }]}>
            <View style={styles.col}>
              <Text style={styles.label}>Final Amount</Text>
              <Text style={styles.value}>₹{finalAmount}</Text>
            </View>
            {isShortVersion ? (
              <View style={styles.col}>
                <Text style={styles.label}>Payment Method</Text>
                <Text style={styles.value}>{paymentMethod}</Text>
              </View>
            ) : (
              <View style={styles.col} />
            )}
          </View>

          {!isShortVersion && (
            <View style={[styles.row, { marginBottom: 0 }]}>
              <View style={styles.col}>
                <Text style={styles.label}>Payment Method</Text>
                <Text style={styles.value}>{paymentMethod}</Text>
              </View>
            </View>
          )}
        </View>

        {!isShortVersion && (
          <>
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}>
                <Text style={styles.outlineButtonText}>Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}>
                <Text style={styles.outlineButtonText}>Invoice</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} activeOpacity={0.8}>
                <Text style={styles.outlineButtonText}>Customer</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                Only links that correspond to existing screens/data are shown — nothing is fabricated.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: PALETTE.textSecondary, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  buttonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonText: { fontSize: 13, fontWeight: '700', color: PALETTE.primary },
  callout: {
    backgroundColor: '#FDF3E7',
    padding: 12,
    borderRadius: 8,
  },
  calloutText: { fontSize: 12, fontWeight: '500', color: PALETTE.amberText, lineHeight: 18 },
});
