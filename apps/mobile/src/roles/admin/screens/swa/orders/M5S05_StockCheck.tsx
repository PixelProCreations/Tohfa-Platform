import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S05Props {
  orderId?: string;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={ORDERS_THEME.warning}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={ORDERS_THEME.warning} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 4L12 14.01l-3-3"
        stroke="#16A34A"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const M5S05_StockCheck: React.FC<M5S05Props> = ({ orderId = 'ORD-1024', onNavigate, onBack }) => {
  const isInv251 = orderId === 'INV-00251' || orderId === 'ORD-00251';
  const isInv238 = orderId === 'INV-00238' || orderId === 'ORD-00238';

  const stockItems = isInv251
    ? [
        {
          name: 'Tomato · Grade 1',
          status: 'Available' as const,
          ordered: '2 KG',
          available: '25 KG',
          required: '2 KG',
        },
      ]
    : isInv238
    ? [
        {
          name: 'Tomato · Grade 1',
          status: 'Available' as const,
          ordered: '2 KG',
          available: '25 KG',
          required: '2 KG',
        },
        {
          name: 'Carrot · Grade 1',
          status: 'Available' as const,
          ordered: '1 KG',
          available: '18 KG',
          required: '1 KG',
        },
        {
          name: 'Beans · Grade 1',
          status: 'Available' as const,
          ordered: '2 KG',
          available: '12 KG',
          required: '2 KG',
        },
      ]
    : [
        {
          name: 'Tomato · Grade 1',
          status: 'Available' as const,
          ordered: '20 KG',
          available: '25 KG',
          required: '20 KG',
        },
        {
          name: 'Carrot · Grade 1',
          status: 'Insufficient' as const,
          ordered: '10 KG',
          available: '6 KG',
          required: '10 KG',
          shortage: '4 KG',
        },
      ];

  const hasShortage = stockItems.some((it) => it.status === 'Insufficient');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={ORDERS_THEME.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Stock Check</Text>
              <Text style={styles.headerSubtitle}>{orderId}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {stockItems.map((item, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.status === 'Available' ? (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                  </View>
                ) : (
                  <View style={styles.insufficientBadge}>
                    <Text style={styles.insufficientBadgeText}>Insufficient</Text>
                  </View>
                )}
              </View>

              <View style={styles.threeColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Ordered</Text>
                  <Text style={styles.colValue}>{item.ordered}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Available</Text>
                  <Text style={[styles.colValue, item.status === 'Insufficient' && styles.redValue]}>
                    {item.available}
                  </Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>{item.status === 'Insufficient' ? 'Shortage' : 'Required'}</Text>
                  <Text style={[styles.colValue, item.status === 'Insufficient' && styles.redValue]}>
                    {item.status === 'Insufficient' ? item.shortage : item.required}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {hasShortage ? (
            <View style={styles.warningBox}>
              <WarningTriangleIcon />
              <Text style={styles.warningText}>
                Stock Shortage — 1 item requires attention
              </Text>
            </View>
          ) : (
            <View style={[styles.warningBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <CheckCircleIcon />
              <Text style={[styles.warningText, { color: '#166534' }]}>
                All items in stock — ready for packing
              </Text>
            </View>
          )}

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button */}
        <View style={styles.bottomBar}>
          {hasShortage ? (
            <TouchableOpacity
              style={styles.reviewShortageBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S06', { orderId })}
            >
              <ArrowRightWhiteIcon />
              <Text style={styles.reviewShortageBtnText}>Review Shortage</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.reviewShortageBtn, { backgroundColor: ORDERS_THEME.primary }]}
              activeOpacity={0.8}
              onPress={() => onNavigate('M5S07', { orderId })}
            >
              <ArrowRightWhiteIcon />
              <Text style={styles.reviewShortageBtnText}>Proceed to Packing</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: 'Poppins',
    fontWeight: '600',
    marginTop: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  itemCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  availableBadge: {
    backgroundColor: ORDERS_THEME.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ORDERS_THEME.radiusFull,
  },
  availableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ORDERS_THEME.success,
    fontFamily: 'Poppins',
  },
  insufficientBadge: {
    backgroundColor: ORDERS_THEME.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ORDERS_THEME.radiusFull,
  },
  insufficientBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ORDERS_THEME.danger,
    fontFamily: 'Poppins',
  },
  threeColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 2,
  },
  colValue: {
    fontSize: 15,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  redValue: {
    color: ORDERS_THEME.danger,
  },
  warningBox: {
    backgroundColor: ORDERS_THEME.warningBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: ORDERS_THEME.warning,
    fontFamily: 'Poppins',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  reviewShortageBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewShortageBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
