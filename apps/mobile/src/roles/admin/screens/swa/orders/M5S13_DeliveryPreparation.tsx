import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { SWA_TYPOGRAPHY } from '../constants';

interface M5S13Props {
  orderId?: string;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GreenCheckboxIcon() {
  return (
    <View style={styles.greenCheckbox}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function EmptyCheckboxIcon() {
  return <View style={styles.emptyCheckbox} />;
}

function InfoCircleBlueIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DeliveryTruckWhiteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke="#FFFFFF" strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
    </Svg>
  );
}

export const M5S13_DeliveryPreparation: React.FC<M5S13Props> = ({
  orderId = 'ORD-1021',
  onNavigate,
  onBack,
}) => {
  const [selectedSlot, setSelectedSlot] = useState('AFTERNOON_12_4');
  const [checklist, setChecklist] = useState([
    { id: '1', title: 'Items verified', checked: true },
    { id: '2', title: 'Quantity verified', checked: true },
    { id: '3', title: 'Address verified', checked: true },
    { id: '4', title: 'Ready for dispatch', checked: false },
  ]);

  const toggleCheck = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const slots = ['MORNING_8_12', 'AFTERNOON_12_4', 'EVENING_4_8'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header - Orange Theme matching Image 1 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Preparation</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Delivery Information */}
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <Text style={styles.fieldValueBold}>
              Configured address — Divya R., Ooty Road, Coonoor
            </Text>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Delivery Date</Text>
              <Text style={styles.fieldValueBold}>25 Sep 2026</Text>
            </View>
          </View>

          {/* Section 2: Delivery Slot */}
          <Text style={styles.sectionTitle}>Delivery Slot</Text>
          <View style={styles.slotsRow}>
            {slots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotPill, isSelected && styles.slotPillSelected]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotPillText,
                      isSelected && styles.slotPillTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Blue Info Alert Box matching Image 1 */}
          <View style={styles.infoBox}>
            <InfoCircleBlueIcon />
            <Text style={styles.infoText}>
              Slot codes are configuration/API-driven, not hard-coded into the design.
            </Text>
          </View>

          {/* Section 3: Packing Status */}
          <Text style={styles.sectionTitle}>Packing Status</Text>
          <View style={styles.statusCard}>
            <GreenCheckboxIcon />
            <Text style={styles.statusCardText}>Stock Checked</Text>
          </View>

          <View style={[styles.statusCard, { marginTop: 10 }]}>
            <GreenCheckboxIcon />
            <Text style={styles.statusCardText}>Packed</Text>
          </View>

          {/* Section 4: Delivery Checklist */}
          <Text style={styles.sectionTitle}>Delivery Checklist</Text>
          <View style={styles.checklistCard}>
            {checklist.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checklistItem,
                  index < checklist.length - 1 && styles.checklistItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => toggleCheck(item.id)}
              >
                {item.checked ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Fixed Action Button matching Image 1 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.dispatchBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S14', { orderId, slot: selectedSlot })}
          >
            <DeliveryTruckWhiteIcon />
            <Text style={styles.dispatchBtnText}>Prepare for Dispatch</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  headerTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FAF8F5',
  },
  subtitleText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7A6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  fieldLabel: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 4,
  },
  fieldValueBold: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
    lineHeight: 19,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  slotPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  slotPillSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#E85226',
  },
  slotPillText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  slotPillTextSelected: {
    fontWeight: '700',
    color: '#C2410C',
  },
  infoBox: {
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusCardText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1ECE4',
  },
  greenCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  checklistText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1D2420',
  },
  bottomBar: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFECE6',
  },
  dispatchBtn: {
    backgroundColor: '#E85226',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dispatchBtnText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
