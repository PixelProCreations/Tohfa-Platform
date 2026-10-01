import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../components';

interface M3S15Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

const TIMELINE_EVENTS = [
  { label: 'Movement Created', time: '10:40 AM' },
  { label: 'Quantity Recorded', time: '10:41 AM' },
  { label: 'Ledger Posted', time: '10:42 AM' },
  { label: 'Completed', time: '10:42 AM' },
];

function MoreDotsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function PhotoThumbnailIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" stroke="#E85226" strokeWidth="1.8" />
      <Path d="M8.5 6.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" stroke="#E85226" strokeWidth="1.5" />
      <Path d="M21 15l-5-5-8 8" stroke="#E85226" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 14l2-2 5 5" stroke="#E85226" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelineGreenDot() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#1E8E5A" strokeWidth="2.5" fill="#FFFFFF" />
      <Path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" fill="#1E8E5A" />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#1C5B96" strokeWidth="1.8" />
      <Path d="M12 16v-4M12 8h.01" stroke="#1C5B96" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QrIcon({ color = '#E85226', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-3h-2v3zm4 0h2v-3h-2v3zm-4 4h2v-2h-2v2zm4 0h2v-2h-2v2zm0-4h2v-2h-2v2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentReferenceIcon({ color = '#E85226', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HistoryLedgerIcon({ color = '#E85226', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l4 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockNoticeIcon({ color = '#E85226', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export const M3S15_StockMovementDetail: React.FC<M3S15Props> = ({ onNavigate, onBack }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Stock Movement"
          onBack={onBack}
          rightAction={
            <TouchableOpacity 
              style={styles.moreButton} 
              activeOpacity={0.7}
              onPress={() => onNavigate('M3S18')}
            >
              <MoreDotsIcon />
            </TouchableOpacity>
          }
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>RECEIPT · Completed</Text>
            </View>
            <Text style={styles.movementIdBig}>MOV-000248</Text>
          </View>

          {/* Movement Summary - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movement Summary</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Movement Type</Text>
                  <Text style={styles.colValue}>RECEIPT</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Status</Text>
                  <Text style={styles.colValue}>Completed</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Movement ID</Text>
                  <Text style={styles.colValue}>MOV-000248</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Warehouse</Text>
                  <Text style={styles.colValue}>Coonoor</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.fullCol}>
                  <Text style={styles.colLabel}>Date & Time</Text>
                  <Text style={styles.colValue}>16 Sep 2026, 10:42 AM</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Product Information - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Product / Crop</Text>
                  <Text style={styles.colValue}>Tomato</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Grade</Text>
                  <Text style={styles.colValue}>Grade 1</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Unit</Text>
                  <Text style={styles.colValue}>KG</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Batch</Text>
                  <Text style={styles.colValue}>BAT-COO-00241</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quantity Movement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity Movement</Text>
            <View style={styles.quantityCard}>
              <Text style={styles.quantityCardLabel}>QUANTITY MOVEMENT</Text>
              <Text style={styles.quantityBigValue}>+140 KG</Text>
              
              <View style={styles.flowRow}>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValue}>0 KG</Text>
                  <Text style={styles.flowStepLabel}>BEFORE</Text>
                </View>
                <Text style={styles.flowArrow}>→</Text>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValueGreen}>+140 KG</Text>
                  <Text style={styles.flowStepLabelGreen}>MOVEMENT</Text>
                </View>
                <Text style={styles.flowArrow}>→</Text>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValue}>140 KG</Text>
                  <Text style={styles.flowStepLabel}>AFTER</Text>
                </View>
              </View>
            </View>

            {/* Blue Info Notice */}
            <View style={styles.blueNoticeBox}>
              <InfoCircleIcon />
              <Text style={styles.blueNoticeText}>
                Values shown are returned by the backend — never calculated or overwritten in this app.
              </Text>
            </View>
          </View>

          {/* Storage Location - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Location</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Storage Type</Text>
                  <Text style={styles.colValue}>Cold Storage</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Section</Text>
                  <Text style={styles.colValue}>Section A</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Rack</Text>
                  <Text style={styles.colValue}>Rack 02</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Shelf / Bin</Text>
                  <Text style={styles.colValue}>Shelf 03</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reference - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reference</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Goods Receipt</Text>
                  <Text style={styles.colValue}>GRN-00291</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Received From</Text>
                  <Text style={styles.colValue}>Main Warehouse</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.fullCol}>
                  <Text style={styles.colLabel}>Related Batch</Text>
                  <Text style={styles.colValue}>BAT-COO-00241</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Performed By - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performed By</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Performed By</Text>
                  <Text style={styles.colValue}>SWA · Coonoor (Suresh)</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Date & Time</Text>
                  <Text style={styles.colValue}>16 Sep 2026, 10:42 AM</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes & Evidence */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes & Evidence</Text>
            <View style={styles.infoCard}>
              <Text style={styles.colLabel}>Notes</Text>
              <Text style={styles.notesText}>Received and accepted after QC.</Text>
              
              <View style={styles.evidenceThumbnailsRow}>
                <View style={styles.thumbnailBox}>
                  <PhotoThumbnailIcon />
                </View>
                <View style={styles.thumbnailBox}>
                  <PhotoThumbnailIcon />
                </View>
              </View>
            </View>
          </View>

          {/* Movement Timeline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movement Timeline</Text>
            <View style={styles.timelineCard}>
              {TIMELINE_EVENTS.map((event, index) => (
                <View key={index} style={styles.timelineStepRow}>
                  <View style={styles.timelineIndicatorCol}>
                    <TimelineGreenDot />
                    {index < TIMELINE_EVENTS.length - 1 && <View style={styles.timelineVerticalLine} />}
                  </View>
                  <View style={styles.timelineTextCol}>
                    <Text style={styles.timelineStepTitle}>{event.label}</Text>
                    <Text style={styles.timelineStepTime}>{event.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate('M3S04')}
              activeOpacity={0.7}
            >
              <QrIcon color="#E85226" size={18} />
              <Text style={styles.actionBtnText}>View Batch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate('M3S06')}
              activeOpacity={0.7}
            >
              <DocumentReferenceIcon color="#E85226" size={18} />
              <Text style={styles.actionBtnText}>View Reference</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate('M3S06')}
              activeOpacity={0.7}
            >
              <HistoryLedgerIcon color="#E85226" size={18} />
              <Text style={styles.actionBtnText}>View Ledger History</Text>
            </TouchableOpacity>
          </View>

          {/* Disclaimer Banner */}
          <View style={styles.disclaimerBox}>
            <LockNoticeIcon color="#E85226" size={18} />
            <Text style={styles.disclaimerText}>
              No Edit Balance action exists on this screen. Stock changes only ever happen through a new ledger movement — never a direct edit here.
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
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
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  receiptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
  },
  movementIdBig: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
  },
  twoColRow: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  fullCol: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 3,
  },
  colValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  quantityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityCardLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
    letterSpacing: 0.8,
  },
  quantityBigValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
    marginVertical: 6,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
    gap: 12,
  },
  flowStep: {
    alignItems: 'center',
  },
  flowStepValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  flowStepLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  flowStepValueGreen: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
  },
  flowStepLabelGreen: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#1E8E5A',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  flowArrow: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8A7E75',
    marginBottom: 10,
  },
  blueNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EDF4FC',
    borderWidth: 1,
    borderColor: '#B8D5F2',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  blueNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#1C5B96',
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  notesText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginTop: 2,
    marginBottom: 12,
  },
  evidenceThumbnailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.2,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
  },
  timelineStepRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1E8E5A',
    marginVertical: 3,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  timelineStepTime: {
    fontSize: 11,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  actionOutlineBtn: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E85226',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    shadowColor: '#E85226',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E85226',
    fontFamily: 'Poppins',
  },
  disclaimerBox: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#FDBA74',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 24,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#9A3412',
    lineHeight: 18,
    fontFamily: 'Poppins',
  },
});
