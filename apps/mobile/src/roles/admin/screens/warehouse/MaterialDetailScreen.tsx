import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ReceiveActionIcon({ size = 22, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IssueActionIcon({ size = 22, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16V8M8 12l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface MaterialDetailScreenProps {
  materialId?: string;
  materialName?: string;
  onBack?: () => void;
  onReceive?: () => void;
  onIssue?: () => void;
}

export function MaterialDetailScreen({
  materialId = 'MAT-0021',
  materialName = 'Packaging Box',
  onBack,
  onReceive,
  onIssue,
}: MaterialDetailScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{materialName}</Text>
        </View>
        <Text style={styles.headerSubtitle}>{materialId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Material Information ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Material Information</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Category</Text>
              <Text style={styles.fieldValue}>Packaging</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Unit</Text>
              <Text style={styles.fieldValue}>Units</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>Available</Text>
            </View>
            <View style={styles.gridCol} />
          </View>
        </View>

        {/* ─── Quantity ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.linkText}>Detail →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Current</Text>
              <Text style={styles.fieldValue}>120 Units</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Available</Text>
              <Text style={styles.fieldValue}>100</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onReceive}
            activeOpacity={0.8}
          >
            <ReceiveActionIcon size={24} color={PALETTE.primary} />
            <Text style={styles.actionBtnText}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onIssue}
            activeOpacity={0.8}
          >
            <IssueActionIcon size={24} color={PALETTE.primary} />
            <Text style={styles.actionBtnText}>Issue</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 38,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.orangeDeep,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
