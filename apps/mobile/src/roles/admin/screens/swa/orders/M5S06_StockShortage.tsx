import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S06Props {
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

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={ORDERS_THEME.info} strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke={ORDERS_THEME.info} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DocumentWhiteIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const M5S06_StockShortage: React.FC<M5S06Props> = ({ orderId = 'ORD-1024', onNavigate, onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stock Shortage</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Reference Label on Canvas */}
          <Text style={styles.orderRefLabel}>{orderId}</Text>

          {/* Top Shortage Hero Card - Crisp Red Border matching Left Design */}
          <View style={styles.shortageHeroCard}>
            <Text style={styles.shortageNumberText}>4 KG Short</Text>
            <Text style={styles.shortageCropText}>CARROT · GRADE 1</Text>
          </View>

          {/* 3 Summary Cards in a Row */}
          <View style={styles.summaryCardsRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValText}>10 KG</Text>
              <Text style={styles.summaryLblText}>ORDERED</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValText}>6 KG</Text>
              <Text style={styles.summaryLblText}>AVAILABLE</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValText, styles.redText]}>4 KG</Text>
              <Text style={[styles.summaryLblText, styles.redText]}>SHORT</Text>
            </View>
          </View>

          {/* Section: Related Stock */}
          <Text style={styles.sectionHeader}>Related Stock</Text>
          <View style={styles.relatedStockCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Available Stock</Text>
                <Text style={styles.colValue}>6 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Reserved</Text>
                <Text style={styles.colValue}>0 KG</Text>
              </View>
            </View>
          </View>

          {/* Notice Box */}
          <View style={styles.noticeBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.noticeText}>
              Partial fulfillment or substitution isn't defined by the source requirements, so no such action is offered here.
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Stacked Full-Width Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.reviewOrderBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S04', { orderId })}
          >
            <DocumentWhiteIcon />
            <Text style={styles.reviewOrderBtnText}>Review Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reportIssueBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S16', { orderId })}
          >
            <Text style={styles.reportIssueBtnText}>Report Issue</Text>
          </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  orderRefLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 8,
    paddingLeft: 2,
  },
  shortageHeroCard: {
    backgroundColor: '#FDF2F2',
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1.2,
    borderColor: '#E24B4A',
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#E24B4A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  shortageNumberText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E24B4A',
    fontFamily: 'Poppins',
  },
  shortageCropText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E24B4A',
    fontFamily: 'Poppins',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryValText: {
    fontSize: 17,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  summaryLblText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  redText: {
    color: '#E24B4A',
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  relatedStockCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11.5,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 4,
  },
  colValue: {
    fontSize: 14,
    fontWeight: '700',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  noticeBox: {
    backgroundColor: ORDERS_THEME.infoBg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: ORDERS_THEME.radiusMD,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    color: ORDERS_THEME.info,
    fontFamily: 'Poppins',
    lineHeight: 16,
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  reviewOrderBtn: {
    backgroundColor: ORDERS_THEME.primary,
    borderRadius: ORDERS_THEME.radiusLG,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  reportIssueBtn: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIssueBtnText: {
    color: '#E24B4A',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
