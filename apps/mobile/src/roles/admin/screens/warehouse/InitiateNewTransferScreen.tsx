import React, { useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WAREHOUSE_THEME } from './WarehouseOverviewScreen';
import type { InterWarehouseTransferItem } from './InterWarehouseTransferScreen';

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12l7 7 7-7"
        stroke={WAREHOUSE_THEME.orange}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DispatchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={WAREHOUSE_THEME.orange}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const WAREHOUSE_OPTIONS = ['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];
const PRODUCE_OPTIONS = ['Beetroot', 'Carrots', 'Cabbage', 'Green Tea'];

export interface InitiateNewTransferScreenProps {
  onBack?: () => void;
  onSubmitTransfer?: (transfer: InterWarehouseTransferItem) => void;
}

export function InitiateNewTransferScreen({
  onBack,
  onSubmitTransfer,
}: InitiateNewTransferScreenProps) {
  const [sourceWH, setSourceWH] = useState('Ooty');
  const [destWH, setDestWH] = useState('Kotagiri');
  const [selectedProduce, setSelectedProduce] = useState('Beetroot');
  const [quantityKg, setQuantityKg] = useState('300');
  const [priority, setPriority] = useState<'Urgent' | 'Standard'>('Urgent');

  const parsedQty = parseInt(quantityKg, 10) || 0;
  const requiresSA = parsedQty >= 1000;

  const handleAddQty = (add: number) => {
    setQuantityKg(String(parsedQty + add));
  };

  const handleDispatch = () => {
    if (sourceWH === destWH) {
      Alert.alert('Invalid Route', 'Source and destination facilities must be different.');
      return;
    }

    if (parsedQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid transfer quantity.');
      return;
    }

    const newTransfer: InterWarehouseTransferItem = {
      id: String(Date.now()),
      source: sourceWH,
      destination: destWH,
      produceDescription: `${selectedProduce} — ${parsedQty} kg`,
      status: requiresSA ? 'Pending SA Approval' : 'In Transit',
      eta: requiresSA ? undefined : 'ETA 2.5 hrs',
    };

    Alert.alert(
      requiresSA ? 'Transfer Submitted for Approval' : 'Transfer Dispatched',
      requiresSA
        ? `Transfer of ${parsedQty} kg from ${sourceWH} to ${destWH} routed to Super Admin for dual-key authorization.`
        : `Transfer manifest created. Truck TN-43-E-8821 dispatched to ${destWH}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSubmitTransfer?.(newTransfer);
            onBack?.();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={WAREHOUSE_THEME.orange} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Initiate New Transfer</Text>
        </View>
        <Text style={styles.subtitle}>Dispatch stock between facilities</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >

        {/* Route Card: Origin & Destination */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Source Warehouse</Text>
          <View style={styles.chipRow}>
            {WAREHOUSE_OPTIONS.map((wh) => (
              <TouchableOpacity
                key={`src-${wh}`}
                style={[styles.chip, sourceWH === wh && styles.chipActive]}
                onPress={() => setSourceWH(wh)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, sourceWH === wh && styles.chipTextActive]}>
                  {wh}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.routeDividerRow}>
            <View style={styles.routeDividerLine} />
            <View style={styles.routeArrowBox}>
              <ArrowDownIcon />
            </View>
            <View style={styles.routeDividerLine} />
          </View>

          <Text style={styles.sectionLabel}>Destination Facility</Text>
          <View style={styles.chipRow}>
            {WAREHOUSE_OPTIONS.map((wh) => (
              <TouchableOpacity
                key={`dest-${wh}`}
                style={[
                  styles.chip,
                  destWH === wh && styles.chipActive,
                  sourceWH === wh && styles.chipDisabled,
                ]}
                onPress={() => setDestWH(wh)}
                disabled={sourceWH === wh}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, destWH === wh && styles.chipTextActive]}>
                  {wh}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Produce Selection Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Produce Type</Text>
          <View style={styles.chipRow}>
            {PRODUCE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selectedProduce === item && styles.chipActive]}
                onPress={() => setSelectedProduce(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedProduce === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity Input */}
          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Transfer Quantity (kg)</Text>
          <View style={styles.qtyInputBox}>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={quantityKg}
              onChangeText={setQuantityKg}
              placeholder="e.g. 300"
              placeholderTextColor="#A59E99"
            />
            <Text style={styles.qtyUnit}>kg</Text>
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handleAddQty(50)}>
              <Text style={styles.presetText}>+50 kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handleAddQty(100)}>
              <Text style={styles.presetText}>+100 kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handleAddQty(250)}>
              <Text style={styles.presetText}>+250 kg</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handleAddQty(500)}>
              <Text style={styles.presetText}>+500 kg</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Priority Card */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Transfer Reason / Priority</Text>
          <View style={styles.priorityRow}>
            <TouchableOpacity
              style={[styles.priorityBtn, priority === 'Urgent' && styles.priorityBtnActive]}
              onPress={() => setPriority('Urgent')}
              activeOpacity={0.8}
            >
              <Text style={[styles.priorityTitle, priority === 'Urgent' && styles.priorityTitleActive]}>
                Low Stock Rebalance
              </Text>
              <Text style={styles.prioritySub}>Urgent dispatch to resolve critical deficit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.priorityBtn, priority === 'Standard' && styles.priorityBtnActive]}
              onPress={() => setPriority('Standard')}
              activeOpacity={0.8}
            >
              <Text style={[styles.priorityTitle, priority === 'Standard' && styles.priorityTitleActive]}>
                Standard Rotation
              </Text>
              <Text style={styles.prioritySub}>Regular stock leveling across facilities</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Policy Notice if large quantity */}
        {requiresSA && (
          <View style={styles.policyNoticeBox}>
            <WarningTriangleIcon />
            <Text style={styles.policyNoticeText}>
              Transfers exceeding 1,000 kg require dual-key approval from Super Admin before dispatch manifest is issued.
            </Text>
          </View>
        )}

        {/* Action Button: Dispatch Transfer */}
        <TouchableOpacity
          style={styles.dispatchBtn}
          onPress={handleDispatch}
          activeOpacity={0.85}
        >
          <DispatchIcon />
          <Text style={styles.dispatchBtnText}>
            {requiresSA ? 'Submit for Super Admin Sign-off' : 'Dispatch Transfer'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  header: {
    backgroundColor: WAREHOUSE_THEME.orange,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 2,
    marginRight: 4,
  },
  headerBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 4,
    marginLeft: 32,
  },
  card: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    padding: 18,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F7F4EF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#FEF6E9',
    borderColor: WAREHOUSE_THEME.orange,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: WAREHOUSE_THEME.ink,
  },
  chipTextActive: {
    color: WAREHOUSE_THEME.orange,
    fontWeight: '700',
  },
  routeDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  routeDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0ECE6',
  },
  routeArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF6E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  qtyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  qtyInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  qtyUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: WAREHOUSE_THEME.muted,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  presetBtn: {
    backgroundColor: '#F5F1EB',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524B48',
  },
  priorityRow: {
    gap: 10,
  },
  priorityBtn: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    padding: 14,
  },
  priorityBtnActive: {
    borderColor: WAREHOUSE_THEME.orange,
    backgroundColor: '#FEF6E9',
  },
  priorityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  priorityTitleActive: {
    color: WAREHOUSE_THEME.orange,
  },
  prioritySub: {
    fontSize: 12,
    color: WAREHOUSE_THEME.muted,
    marginTop: 4,
  },
  policyNoticeBox: {
    backgroundColor: WAREHOUSE_THEME.alertBg,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.alertBorder,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 13,
    color: WAREHOUSE_THEME.alertText,
    lineHeight: 18,
    marginLeft: 10,
  },
  dispatchBtn: {
    backgroundColor: WAREHOUSE_THEME.orange,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
