import React, { useState } from 'react';
import {
  Modal,
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

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  sectionTitle: '#A76527',
  border: '#EBE5DC',
  lightPeach: '#F6E9DA',
  redStar: '#DC2626',
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MinusIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export interface SubWarehouseAddMaterialScreenProps {
  onBack: () => void;
  onSave: () => void;
}

const MATERIAL_OPTIONS = [
  { name: 'Packaging Box', category: 'Packaging' },
  { name: 'Crates', category: 'Storage Containers' },
  { name: 'Labels', category: 'Packaging' },
  { name: 'Pallets', category: 'Handling Equipment' },
  { name: 'Sealing Tape', category: 'Consumables' },
];

const STORAGE_LOCATIONS = [
  'Material Storage Area',
  'Storage Rack A-01',
  'Storage Rack A-02',
  'Cold Storage Bay',
  'General Staging Bay',
];

export function SubWarehouseAddMaterialScreen({
  onBack,
  onSave,
}: SubWarehouseAddMaterialScreenProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [condition, setCondition] = useState<'Good' | 'Damaged'>('Good');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleSelectMaterial = (mat: { name: string; category: string }) => {
    setSelectedMaterial(mat.name);
    setSelectedCategory(mat.category);
    setShowMaterialModal(false);
  };

  const handleSelectLocation = (loc: string) => {
    setSelectedLocation(loc);
    setShowLocationModal(false);
  };

  const handleQuantityDecrement = () => {
    const current = parseInt(quantity, 10);
    if (!isNaN(current) && current > 0) {
      setQuantity(String(current - 1));
    }
  };

  const handleQuantityIncrement = () => {
    const current = parseInt(quantity, 10);
    if (!isNaN(current)) {
      setQuantity(String(current + 1));
    } else {
      setQuantity('1');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Material</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ─── MATERIAL INFORMATION ─── */}
        <Text style={styles.sectionTitle}>MATERIAL INFORMATION</Text>

        <Text style={styles.label}>
          Material Name <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownBox}
          onPress={() => setShowMaterialModal(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, !selectedMaterial && styles.placeholderText]}>
            {selectedMaterial || 'Select material'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        <Text style={styles.label}>
          Material Category <Text style={styles.required}>*</Text>
        </Text>
        <View style={[styles.dropdownBox, styles.disabledBox]}>
          <Text style={[styles.dropdownText, !selectedCategory && styles.disabledText]}>
            {selectedCategory || 'Select material first'}
          </Text>
        </View>

        {/* ─── QUANTITY ─── */}
        <Text style={styles.sectionTitle}>QUANTITY</Text>

        <Text style={styles.label}>
          Received Quantity <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.quantityInputWrap}>
          <TextInput
            style={styles.quantityInput}
            placeholder="Enter quantity"
            placeholderTextColor={PALETTE.textMuted}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
          <View style={styles.stepperWrap}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={handleQuantityDecrement}
              activeOpacity={0.7}
            >
              <MinusIcon size={16} color="#7A726C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={handleQuantityIncrement}
              activeOpacity={0.7}
            >
              <PlusIcon size={16} color="#7A726C" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>
          Condition <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, condition === 'Good' && styles.toggleBtnActive]}
            onPress={() => setCondition('Good')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleBtnText,
                condition === 'Good' && styles.toggleBtnTextActive,
              ]}
            >
              Good
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, condition === 'Damaged' && styles.toggleBtnActive]}
            onPress={() => setCondition('Damaged')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleBtnText,
                condition === 'Damaged' && styles.toggleBtnTextActive,
              ]}
            >
              Damaged
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── STORAGE LOCATION ─── */}
        <Text style={styles.sectionTitle}>STORAGE LOCATION</Text>

        <Text style={styles.label}>
          Storage Location <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.dropdownBox}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, !selectedLocation && styles.placeholderText]}>
            {selectedLocation || 'Select storage location'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>
        <Text style={styles.helperText}>Only locations in Coonoor Warehouse are shown.</Text>

        {/* ─── ADDITIONAL ─── */}
        <Text style={styles.sectionTitle}>ADDITIONAL</Text>

        <Text style={styles.label}>Notes</Text>
        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes..."
            placeholderTextColor={PALETTE.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      {/* ─── Bottom Sticky Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onSave}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Add Material</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Material Selection Modal ─── */}
      <Modal visible={showMaterialModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMaterialModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Material</Text>
            {MATERIAL_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={styles.modalOption}
                onPress={() => handleSelectMaterial(item)}
              >
                <Text style={styles.modalOptionTitle}>{item.name}</Text>
                <Text style={styles.modalOptionSub}>{item.category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Location Selection Modal ─── */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Storage Location</Text>
            {STORAGE_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={styles.modalOption}
                onPress={() => handleSelectLocation(loc)}
              >
                <Text style={styles.modalOptionTitle}>{loc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.sectionTitle,
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  required: {
    color: PALETTE.redStar,
    fontWeight: '700',
  },

  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: PALETTE.textInk,
    fontWeight: '500',
  },
  placeholderText: {
    color: PALETTE.textMuted,
  },
  disabledBox: {
    backgroundColor: PALETTE.lightPeach,
    borderColor: '#E8DFD3',
  },
  disabledText: {
    color: PALETTE.textMuted,
  },

  quantityInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  quantityInput: {
    flex: 1,
    fontSize: 15,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    backgroundColor: PALETTE.lightPeach,
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: PALETTE.lightPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: PALETTE.primary,
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8C4E1A',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },

  helperText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: -8,
    marginBottom: 16,
    fontWeight: '500',
  },

  textAreaBox: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 110,
    marginBottom: 20,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: PALETTE.textInk,
  },

  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    maxHeight: 380,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE2',
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  modalOptionSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
});
