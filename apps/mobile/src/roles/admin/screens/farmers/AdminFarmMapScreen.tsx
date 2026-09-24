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
import Svg, { Circle, Path } from 'react-native-svg';
import type { FarmerListItem } from './AdminAllFarmersScreen';

const P = {
  bg: '#FAF8F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2ECE4',
  ink: '#1A1412',
  titleBrown: '#662208',
  subtitle: '#827871',
  orange: '#F0562A',
  orangeBg: '#FFECE8',
  textSecondary: '#6B6560',
  infoBannerBg: '#E8F1FC',
  infoBannerText: '#1565C0',
  mapBg: '#3F4F34',
};

interface Props {
  farmer: FarmerListItem;
  onBack: () => void;
}

export const AdminFarmMapScreen: React.FC<Props> = ({ farmer, onBack }) => {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.bg} />

      {/* Header with Back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#2B2523"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Subtitle */}
        <Text style={styles.title}>Farm FMB & Zones</Text>
        <Text style={styles.subtitle}>
          {farmer.name} · {farmer.farmName ?? 'Wild Eden Organic Farms'} · 6 zones marked
        </Text>

        {/* Map Card */}
        <View style={styles.mapCard}>
          <Svg width="100%" height={210} viewBox="0 0 340 210">
            {/* Dark green satellite terrain base */}
            <Path
              d="M 0 0 L 340 0 L 340 210 L 0 210 Z"
              fill={P.mapBg}
            />

            {/* Zone Pin 1 */}
            <Circle cx={65} cy={55} r={16} fill="rgba(240, 86, 42, 0.35)" />
            <Circle cx={65} cy={55} r={11} fill="#F0562A" />
            <Path
              d="M 65 49 C 63 53 61 56 61 57.5 C 61 59.7 62.8 61.5 65 61.5 C 67.2 61.5 69 59.7 69 57.5 C 69 56 67 53 65 49 Z"
              fill="#FFFFFF"
            />

            {/* Zone Pin 2 */}
            <Circle cx={132} cy={118} r={16} fill="rgba(240, 86, 42, 0.35)" />
            <Circle cx={132} cy={118} r={11} fill="#F0562A" />
            <Path
              d="M 132 112 C 130 116 128 119 128 120.5 C 128 122.7 129.8 124.5 132 124.5 C 134.2 124.5 136 122.7 136 120.5 C 136 119 134 116 132 112 Z"
              fill="#FFFFFF"
            />

            {/* Zone Pin 3 */}
            <Circle cx={208} cy={82} r={16} fill="rgba(240, 86, 42, 0.35)" />
            <Circle cx={208} cy={82} r={11} fill="#F0562A" />
            <Path
              d="M 208 76 C 206 80 204 83 204 84.5 C 204 86.7 205.8 88.5 208 88.5 C 210.2 88.5 212 86.7 212 84.5 C 212 83 210 80 208 76 Z"
              fill="#FFFFFF"
            />

            {/* Water Source Pin (Blue) */}
            <Circle cx={255} cy={148} r={17} fill="rgba(21, 101, 192, 0.35)" />
            <Circle cx={255} cy={148} r={12} fill="#1565C0" />
            <Path
              d="M 255 142 C 253 146 251 149 251 150.5 C 251 152.7 252.8 154.5 255 154.5 C 257.2 154.5 259 152.7 259 150.5 C 259 149 257 146 255 142 Z"
              fill="#FFFFFF"
            />
          </Svg>

          {/* Map Footer label */}
          <View style={styles.mapFooter}>
            <Text style={styles.mapFooterText}>Satellite view · Leaflet.js + ESRI imagery</Text>
          </View>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Marked zones (6)</Text>

        {/* Zone Item Z1 */}
        <View style={styles.zoneCard}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneBadgeText}>Z1</Text>
          </View>
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneName}>North Slope — Carrots</Text>
            <Text style={styles.zoneSub}>0.8 acres · Soil pH 6.4</Text>
          </View>
        </View>

        {/* Zone Item Z2 */}
        <View style={styles.zoneCard}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneBadgeText}>Z2</Text>
          </View>
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneName}>Terrace Field — Cabbage</Text>
            <Text style={styles.zoneSub}>0.6 acres · Soil pH 6.1</Text>
          </View>
        </View>

        {/* Zone Item Z3 */}
        <View style={styles.zoneCard}>
          <View style={styles.zoneBadge}>
            <Text style={styles.zoneBadgeText}>Z3</Text>
          </View>
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneName}>Lower Basin — Fallow</Text>
            <Text style={styles.zoneSub}>0.5 acres · Cover cropping active</Text>
          </View>
        </View>

        {/* Field Context Callout */}
        <View style={styles.contextBanner}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={styles.contextIcon}>
            <Path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              stroke="#1565C0"
              strokeWidth="2"
            />
          </Svg>
          <Text style={styles.contextText}>
            <Text style={styles.contextTextBold}>Field context: </Text>
            1 water source (borewell), TDS 180 ppm, natural boundary on north side (stream).
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    cursor: 'pointer' as any,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: P.subtitle,
    marginBottom: 16,
  },
  mapCard: {
    backgroundColor: P.mapBg,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  mapFooter: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    backgroundColor: 'transparent',
  },
  mapFooterText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.titleBrown,
    marginBottom: 12,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  zoneBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF1EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  zoneBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: P.orange,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 3,
  },
  zoneSub: {
    fontSize: 12,
    color: P.subtitle,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.infoBannerBg,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  contextIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#204060',
  },
  contextTextBold: {
    fontWeight: '700',
    color: P.infoBannerText,
  },
});
