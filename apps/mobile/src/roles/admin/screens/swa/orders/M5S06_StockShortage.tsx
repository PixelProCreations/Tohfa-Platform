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
      <Circle cx="12" cy="12" r="10" stroke="#1C5B96" strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke="#1C5B96" strokeWidth="2" strokeLinecap="round" />
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
        {/* Header matching Image 5 Left */}
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
              <Text style={styles.headerTitle}>Stock Shortage</Text>
              <Text style={styles.headerSubtitle}>{orderId}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top Shortage Hero Card */}
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
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#E85226',
    paddingTop: 16,
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
  shortageHeroCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  shortageNumberText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E24B4A',
    fontFamily: 'Poppins',
  },
  shortageCropText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E24B4A',
    fontFamily: 'Poppins',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  summaryLblText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A726C',
    fontFamily: 'Poppins',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  redText: {
    color: '#E24B4A',
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  relatedStockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: '#7A726C',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  colValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  noticeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#BFDBFE',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    fontFamily: 'Poppins',
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
    gap: 10,
  },
  reviewOrderBtn: {
    backgroundColor: '#E85226',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#E85226',
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
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E85226',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIssueBtnText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
