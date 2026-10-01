import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
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

export const M5S05_StockCheck: React.FC<M5S05Props> = ({ orderId = 'ORD-1024', onNavigate, onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header matching Image 4 Left */}
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
          {/* Card 1: Tomato · Grade 1 */}
          <View style={styles.itemCard}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemName}>Tomato · Grade 1</Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>Available</Text>
              </View>
            </View>

            <View style={styles.threeColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Ordered</Text>
                <Text style={styles.colValue}>20 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Available</Text>
                <Text style={styles.colValue}>25 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Required</Text>
                <Text style={styles.colValue}>20 KG</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Carrot · Grade 1 */}
          <View style={styles.itemCard}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemName}>Carrot · Grade 1</Text>
              <View style={styles.insufficientBadge}>
                <Text style={styles.insufficientBadgeText}>Insufficient</Text>
              </View>
            </View>

            <View style={styles.threeColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Ordered</Text>
                <Text style={styles.colValue}>10 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Available</Text>
                <Text style={[styles.colValue, styles.redValue]}>6 KG</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Shortage</Text>
                <Text style={[styles.colValue, styles.redValue]}>4 KG</Text>
              </View>
            </View>
          </View>

          {/* Warning Banner in Peach/Orange Theme (No Yellow) */}
          <View style={styles.warningBox}>
            <WarningTriangleIcon />
            <Text style={styles.warningText}>
              Stock Shortage — 1 item requires attention
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.reviewShortageBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S06', { orderId })}
          >
            <ArrowRightWhiteIcon />
            <Text style={styles.reviewShortageBtnText}>Review Shortage</Text>
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
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 14,
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
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  availableBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
  },
  insufficientBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insufficientBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    color: '#7A726C',
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 2,
  },
  colValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  redValue: {
    color: '#DC2626',
  },
  warningBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
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
    color: '#9A3412',
    fontFamily: 'Poppins',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#F4F1EA',
  },
  reviewShortageBtn: {
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
  reviewShortageBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
});
