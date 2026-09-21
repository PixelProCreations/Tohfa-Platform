import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image, Modal } from 'react-native';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// Simple SVG Icons to match design exactly
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" pointerEvents="none">
    <Path d="M15 18L9 12L15 6" stroke={P.deepGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StoreClosedIcon = () => (
  <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#d84315" strokeWidth="2" />
    <Path d="M12 6V12L16 14" stroke="#d84315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const Beaker = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21H5C4.4 21 4 20.6 4 20C4 19.8 4.1 19.6 4.2 19.4L9 12V5H8C7.4 5 7 4.6 7 4C7 3.4 7.4 3 8 3H16C16.6 3 17 3.4 17 4C17 4.6 16.6 5 16 5H15V12L19.8 19.4C20.1 19.8 20 20.4 19.6 20.8C19.4 20.9 19.2 21 19 21ZM10 13L6.1 19H17.9L14 13V5H10V13Z" fill="#9e9e9e" />
  </Svg>
);

const BellAlert = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="#d84315" />
  </Svg>
);

const ChevronRight = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke="#d84315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StoreIcon = () => (
  <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
    <Path d="M2 6L4 11V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V11L22 6V5C22 4.44772 21.5523 4 21 4H3C2.44772 4 2 4.44772 2 5V6Z" fill="#ffffff" opacity={0.2} />
    <Path d="M22 6L20 11V12C20 12.5523 19.5523 13 19 13C18.4477 13 18 12.5523 18 12V11C18 11.5523 17.5523 12 17 12C16.4477 12 16 11.5523 16 11V12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12V11L14 6H22Z" fill="#ffffff" opacity={0.3} />
  </Svg>
);

const Plus = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface ListingsScreenProps {
  onNavigateToCreateListing?: () => void;
  onNavigateToCounterOffer?: (listing: any) => void;
  onNavigateBack?: () => void;
  onNavigateToMyListings?: () => void;
  onNavigateToViewAll?: () => void;
  onNavigateToListingDetail?: (item?: any) => void;
}

export function ListingsScreen({
  onNavigateToCreateListing,
  onNavigateToCounterOffer,
  onNavigateBack,
  onNavigateToMyListings,
  onNavigateToViewAll,
  onNavigateToListingDetail,
}: ListingsScreenProps): React.JSX.Element {
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(true);
  const [showClosedModal, setShowClosedModal] = useState<boolean>(false);

  const handleToggleClosed = () => {
    setIsMarketOpen(false);
    // modal only pops when farmer tries to create a listing while closed
  };

  const handleToggleOpen = () => {
    setIsMarketOpen(true);
  };

  const handleCreateListing = () => {
    if (!isMarketOpen) {
      setShowClosedModal(true);
      return;
    }
    onNavigateToCreateListing?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Marketing</Text>
            <Text style={styles.headerSub}>List your harvest & get paid</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Prototype Banner */}
        <View style={styles.prototypeBanner}>
          <View style={styles.protoRow}>
            <Beaker />
            <Text style={styles.protoText}>Prototype only · market-day state</Text>
          </View>
          <View style={styles.protoToggle}>
            <TouchableOpacity
              style={[styles.protoToggleBtn, isMarketOpen && styles.protoToggleActive]}
              onPress={handleToggleOpen}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.protoToggleText, isMarketOpen && styles.protoToggleActiveText]}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.protoToggleBtn, !isMarketOpen && styles.protoToggleClosedActive]}
              onPress={handleToggleClosed}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.protoToggleText, !isMarketOpen && styles.protoToggleClosedActiveText]}>Closed</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert Banner */}
        <TouchableOpacity style={styles.alertBanner} onPress={() => onNavigateToCounterOffer?.({})}>
          <View style={styles.alertIconBox}>
            <BellAlert />
          </View>
          <View style={styles.alertTextCol}>
            <Text style={styles.alertTitle}>1 listing needs your response</Text>
            <Text style={styles.alertSub}>Carrot · counter-offer expires in 22h 30m</Text>
          </View>
          <View style={styles.alertChevron}>
            <ChevronRight />
          </View>
        </TouchableOpacity>

        {/* Market Day Hero */}
        <View style={[styles.heroCard, !isMarketOpen && styles.heroCardClosed]}>
          <View style={{ position: 'absolute', right: -20, bottom: -10 }}>
            <StoreIcon />
          </View>
          <View style={[styles.heroChip, !isMarketOpen && styles.heroChipClosed]}>
            <View style={[styles.heroChipDot, !isMarketOpen && styles.heroChipDotClosed]} />
            <Text style={styles.heroChipText}>
              {isMarketOpen ? 'MARKET DAY IS OPEN' : 'MARKET DAY IS CLOSED'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {isMarketOpen ? 'Today is a market day' : 'Market is closed today'}
          </Text>
          <Text style={styles.heroSub}>
            {isMarketOpen
              ? 'Listings are being accepted now. Add a harvest-ready crop to start selling.'
              : 'New crop listings are paused. Next market day opens Wednesday at 06:00 AM.'}
          </Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValueBlack}>3</Text>
            <Text style={styles.metricLabel}>Active{'\n'}listings</Text>
          </View>
          <View style={[styles.metricCard, { flex: 1.2 }]}>
            <Text style={styles.metricValueGreen}>₹13,440</Text>
            <Text style={styles.metricLabel}>Earned this{'\n'}month</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValueRed}>1</Text>
            <Text style={styles.metricLabel}>Need{'\n'}reply</Text>
          </View>
        </View>

        {/* Recent Listings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT LISTINGS</Text>
          <TouchableOpacity
            onPress={onNavigateToMyListings || onNavigateToViewAll}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAllBtn}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* List items */}
        <TouchableOpacity
          style={styles.listItem}
          onPress={onNavigateToListingDetail}
          activeOpacity={0.8}
        >
          <View style={[styles.listIconBox, { backgroundColor: '#e8f5e9' }]}>
            <Image source={require('../../../../assets/images/real_tomato.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.listTextCol}>
            <Text style={styles.listTitle}>Tomato · Hybrid</Text>
            <Text style={styles.listSub}>200 kg · ₹38/kg</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#e8f5e9' }]}>
            <Text style={[styles.badgeText, { color: '#2e7d32' }]}>Approved</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listItem}
          onPress={() => onNavigateToCounterOffer?.({})}
          activeOpacity={0.8}
        >
          <View style={[styles.listIconBox, { backgroundColor: '#fff3e0' }]}>
            <Image source={require('../../../../assets/images/real_carrot.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.listTextCol}>
            <Text style={styles.listTitle}>Carrot · Ooty</Text>
            <Text style={styles.listSub}>150 kg · ₹40/kg</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#f3e5f5' }]}>
            <Text style={[styles.badgeText, { color: '#8e24aa' }]}>Counter-offer</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.listItem}
          onPress={onNavigateToListingDetail}
          activeOpacity={0.8}
        >
          <View style={[styles.listIconBox, { backgroundColor: '#e8f5e9' }]}>
            <Image source={require('../../../../assets/images/real_french_beans.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.listTextCol}>
            <Text style={styles.listTitle}>French Beans</Text>
            <Text style={styles.listSub}>80 kg · ₹55/kg</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
            <Text style={[styles.badgeText, { color: '#e65100' }]}>Waiting</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={handleCreateListing} activeOpacity={0.85}>
          <Plus />
          <Text style={styles.fabText}>Create listing</Text>
        </TouchableOpacity>
      </View>

      {/* Market Closed Popup Modal */}
      <Modal
        visible={showClosedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClosedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <StoreClosedIcon />
            </View>
            <Text style={styles.modalTitle}>Market Day is Closed</Text>
            <Text style={styles.modalDesc}>
              Listings are not being accepted at this time. Today's market session is currently closed.
              {'\n\n'}
              Next market day opens on Wednesday at 06:00 AM. You can still manage active listings and respond to counter-offers.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowClosedModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>OK, Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.deepGreen,
  },
  headerSub: {
    fontSize: 14,
    color: '#78909c',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  prototypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  protoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  protoText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  protoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  protoToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  protoToggleText: {
    color: '#9e9e9e',
    fontSize: 11,
    fontWeight: '700',
  },
  protoToggleActive: {
    backgroundColor: '#2e7d32',
  },
  protoToggleActiveText: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  protoToggleClosedActive: {
    backgroundColor: '#d84315',
  },
  protoToggleClosedActiveText: {
    color: '#ffffff',
  },
  protoToggleInactiveText: {
    color: '#9e9e9e',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  alertBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffebee',
      borderRadius: 16,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#d84315',
      marginBottom: 20,
    },
    alertIconBox: {
      marginRight: 12,
    },
    alertTextCol: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '800',
      color: '#5d4037',
      marginBottom: 4,
    },
    alertSub: {
      fontSize: 13,
      lineHeight: 18,
      color: '#d84315',
    },
    alertChevron: {
      marginLeft: 8,
    },
    heroCard: {
      backgroundColor: '#2e7d32',
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      overflow: 'hidden',
    },
    heroChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 16,
    },
    heroChipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#ffffff',
      marginRight: 6,
    },
    heroChipText: {
      color: '#ffffff',
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    heroTitle: {
      color: '#ffffff',
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 8,
    },
    heroSub: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      lineHeight: 20,
      paddingRight: 40,
    },
    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 28,
    },
    metricCard: {
      flex: 1,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    metricValueBlack: {
      fontSize: 22,
      fontWeight: '800',
      color: '#212121',
      marginBottom: 4,
    },
    metricValueGreen: {
      fontSize: 22,
      fontWeight: '800',
      color: '#2e7d32',
      marginBottom: 4,
    },
    metricValueRed: {
      fontSize: 22,
      fontWeight: '800',
      color: '#d84315',
      marginBottom: 4,
    },
    metricLabel: {
      fontSize: 12,
      color: '#9e9e9e',
      fontWeight: '500',
      lineHeight: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#9e9e9e',
      letterSpacing: 0.5,
    },
    viewAllBtn: {
      fontSize: 14,
      fontWeight: '700',
      color: '#2e7d32',
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    listIconBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      overflow: 'hidden',
    },
    realCropImg: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    listTextCol: {
      flex: 1,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#212121',
      marginBottom: 4,
    },
    listSub: {
      fontSize: 13,
      color: '#9e9e9e',
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    fabContainer: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#2e7d32',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    fab: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#2e7d32',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 28,
    },
    fabText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
      marginLeft: 8,
    },
    // -- Closed hero variant --
    heroCardClosed: {
      backgroundColor: '#616161',
    },
    heroChipClosed: {
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    heroChipDotClosed: {
      backgroundColor: '#ef9a9a',
    },
    // -- Market closed modal --
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalCard: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 28,
      width: '100%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
      elevation: 12,
    },
    modalIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#fff3e0',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#212121',
      marginBottom: 12,
      textAlign: 'center',
    },
    modalDesc: {
      fontSize: 14,
      color: '#616161',
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalButton: {
      backgroundColor: P.deepGreen,
      borderRadius: 28,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },
  });
