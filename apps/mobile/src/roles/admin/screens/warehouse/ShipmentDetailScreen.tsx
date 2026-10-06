import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Vibrant Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14', // Warm terracotta / mahogany for section headings
  noticeBgOrange:     '#FDF3F0', // Brand Orange Tint
  noticeBorderOrange: '#F7CFC4',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A', // Pitch ink for values and titles
  textSecondary:      '#5F5E5A', // Muted label color
  textStepMuted:      '#4E4842', // Step label color
  border:             '#EEDCD3', // Crisp subtle card border
  cardBg:             '#FFFFFF',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 11, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayCircleIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Polygon points="10,8 16.5,12 10,16" fill={color} />
    </Svg>
  );
}

export interface ShipmentDetailScreenProps {
  shipmentId?: string;
  onBack?: () => void;
  onStartReceiving?: () => void;
  onViewProductDetail?: () => void;
  onViewTimeline?: () => void;
}

export function ShipmentDetailScreen({
  shipmentId = 'SHP-000124',
  onBack,
  onStartReceiving,
  onViewProductDetail,
  onViewTimeline,
}: ShipmentDetailScreenProps) {
  const PIPELINE_STEPS = [
    { label: 'Shipment Arrived', completed: true },
    { label: 'Receiving Started', completed: false },
    { label: 'Quantity Verification', completed: false },
    { label: 'Quality Check', completed: false },
    { label: 'Decision', completed: false },
    { label: 'Batch Assignment', completed: false },
    { label: 'Storage Assignment', completed: false },
    { label: 'Receipt Completion', completed: false },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Shipment Detail</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {shipmentId} · Arrived · Farmer Admin → Coonoor
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Shipment Information ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Shipment Information</Text>
        </View>

        <View style={styles.infoCard}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Shipment ID</Text>
              <Text style={styles.gridValue}>{shipmentId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Type</Text>
              <Text style={styles.gridValue}>Farmer/Admin{'\n'}Consolidated</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Source</Text>
              <Text style={styles.gridValue}>Farmer Admin</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Destination</Text>
              <Text style={styles.gridValue}>Coonoor</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Created Date</Text>
              <Text style={styles.gridValue}>24 Sep 2026</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Actual Arrival</Text>
              <Text style={styles.gridValue}>25 Sep, 09:15 AM</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Product Summary ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Product Summary</Text>
          <TouchableOpacity onPress={onViewProductDetail} activeOpacity={0.7}>
            <Text style={styles.linkText}>Detail →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productCard}>
          <Text style={styles.productName}>Tomato</Text>
          <Text style={styles.productDetails}>500 KG · Grade 1 · 20 crates</Text>
        </View>

        {/* ─── 3. Receiving Progress ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Receiving Progress</Text>
          <TouchableOpacity onPress={onViewTimeline} activeOpacity={0.7}>
            <Text style={styles.linkText}>Timeline →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          {PIPELINE_STEPS.map((step) => (
            <View key={step.label} style={styles.progressStepRow}>
              {step.completed ? (
                <View style={styles.stepCircleCompleted}>
                  <CheckmarkIcon size={11} color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.stepCirclePending}>
                  <View style={styles.stepDash} />
                </View>
              )}
              <Text
                style={[
                  styles.stepText,
                  step.completed ? styles.stepTextCompleted : styles.stepTextPending,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ─── Disclaimer Notice Box (Brand Orange Palette) ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Shipment Documents only appears when the system actually supplies documents — none are invented as mandatory.
          </Text>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onStartReceiving}
          activeOpacity={0.8}
        >
          <PlayCircleIcon size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Start Receiving</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    lineHeight: 19.5,
  },
  productCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  productName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 5,
  },
  productDetails: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  progressStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8.5,
    gap: 13,
  },
  stepCircleCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDash: {
    width: 6,
    height: 2,
    backgroundColor: '#8E877F',
    borderRadius: 1,
  },
  stepText: {
    fontSize: 14,
  },
  stepTextCompleted: {
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  stepTextPending: {
    fontWeight: '600',
    color: PALETTE.textStepMuted,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 17.5,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
