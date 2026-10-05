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

export function MainWarehouseVouchersFilterScreen({ onBack, onApply }: { onBack: () => void, onApply?: (type: string) => void }) {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Expense', 'Revenue'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#E48934" />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vouchers</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Voucher Type</Text>
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  headerBanner: { backgroundColor: '#E48934', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 2 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  content: { padding: 16, backgroundColor: '#FAF7F2' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#1E1612', marginBottom: 12 },
  tabsRow: { flexDirection: 'row', gap: 10 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: PALETTE.border },
  tabActive: { backgroundColor: 'transparent', borderColor: '#E48934' },
  tabText: { fontSize: 12.5, fontWeight: '700', color: '#4B5563' },
  tabTextActive: { color: '#E48934' },
});
