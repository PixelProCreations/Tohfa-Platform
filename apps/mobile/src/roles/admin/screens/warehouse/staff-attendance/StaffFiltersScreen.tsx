import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';


function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#64748B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PersonRoleIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 17, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagIcon({ size = 17, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v19"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}



function FunnelIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface StaffFilterValues {
  searchQuery: string;
  role: 'All' | 'Warehouse Staff' | 'Driver';
  attendance: 'All' | 'Present' | 'Absent' | 'On Leave';
  status: 'All' | 'Active' | 'Inactive';
}

export interface StaffFiltersScreenProps {
  initialFilters: StaffFilterValues;
  warehouseName?: string | undefined;
  onBack: () => void;
  onApply: (filters: StaffFilterValues) => void;
}

const ROLE_OPTIONS = ['All', 'Warehouse Staff', 'Driver'] as const;
const ATTENDANCE_OPTIONS = ['All', 'Present', 'Absent', 'On Leave'] as const;
const STATUS_OPTIONS = ['All', 'Active', 'Inactive'] as const;

export function StaffFiltersScreen({
  initialFilters,
  warehouseName: _warehouseName = 'Coonoor Warehouse',
  onBack,
  onApply,
}: StaffFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [role, setRole] = useState(initialFilters.role);
  const [attendance, setAttendance] = useState(initialFilters.attendance);
  const [status, setStatus] = useState(initialFilters.status);

  const clearAll = () => {
    setSearchQuery('');
    setRole('All');
    setAttendance('All');
    setStatus('All');
  };

  const handleApply = () => {
    onApply({
      searchQuery,
      role,
      attendance,
      status,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Filters</Text>
        <TouchableOpacity
          onPress={clearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear All"
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by staff name, ID or role"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Role */}
        <View style={styles.sectionHeadRow}>
          <PersonRoleIcon size={18} color="#1E293B" />
          <Text style={styles.sectionTitle}>Role</Text>
        </View>
        <View style={styles.chipWrap}>
          {ROLE_OPTIONS.map((item) => {
            const active = item === role;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setRole(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Attendance */}
        <View style={styles.sectionHeadRow}>
          <CalendarIcon size={17} color="#1E293B" />
          <Text style={styles.sectionTitle}>Attendance</Text>
        </View>
        <View style={styles.chipWrap}>
          {ATTENDANCE_OPTIONS.map((item) => {
            const active = item === attendance;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setAttendance(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status */}
        <View style={styles.sectionHeadRow}>
          <FlagIcon size={17} color="#1E293B" />
          <Text style={styles.sectionTitle}>Status</Text>
        </View>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map((item) => {
            const active = item === status;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatus(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>


      </ScrollView>

      {/* Footer Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85} accessibilityRole="button">
          <FunnelIcon size={18} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  header: {
    backgroundColor: '#F0562A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  body: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#FDF4EC',
    borderWidth: 1.5,
    borderColor: '#F0562A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#F0562A',
  },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#F0562A',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
