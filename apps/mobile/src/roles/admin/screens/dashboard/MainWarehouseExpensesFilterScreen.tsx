import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  textDark: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MainWarehouseExpensesFilterScreen({ onBack, onApply, onAddExpense }: { onBack: () => void, onApply: (cat: string) => void, onAddExpense?: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Transport', 'Loading'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expenses</Text>
          <TouchableOpacity style={styles.addBtn} onPress={onAddExpense} activeOpacity={0.75}>
            <PlusIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.chipsRow}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={() => onApply(selectedCategory)} activeOpacity={0.8}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  headerBanner: { backgroundColor: '#DD7C32', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 2 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: PALETTE.border },
  chipSelected: { borderColor: '#DE8536', backgroundColor: '#FFFDF9' },
  chipText: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary },
  chipTextSelected: { color: '#DE8536', fontWeight: '700' },
  applyBtn: { backgroundColor: '#DE8536', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
