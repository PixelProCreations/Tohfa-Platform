import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../theme';

interface MyListingsScreenProps {
  onNavigateBack: () => void;
  onNavigateToListingDetail?: () => void;
}

export function MyListingsScreen({ onNavigateBack, onNavigateToListingDetail }: MyListingsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Icon name="arrow_back" size={20} color={P.twGray800} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Listings</Text>
          <Text style={styles.headerSubtitle}>5 listings · all time</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.filterDropdown}>
          <Text style={[styles.filterText, { marginLeft: 0 }]}>All statuses</Text>
          <Icon name="expand_more" size={18} color={P.twGray600} style={styles.filterCaret} />
        </TouchableOpacity>

        {/* Card 1: Carrot */}
        <TouchableOpacity style={[styles.card, styles.cardCarrot]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Carrot · Ooty</Text>
            <View style={[styles.statusBadge, { backgroundColor: P.twPurple100 }]}>
              <Text style={[styles.statusText, { color: P.twPurple700 }]}>Counter-offer</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 1 · 150 kg · ₹40/kg · 14 Jul</Text>
          <View style={[styles.alertStrip, { backgroundColor: P.twOrange100 }]}>
            <Icon name="schedule" size={14} color={P.twOrange700} />
            <Text style={[styles.alertText, { color: P.twOrange700 }]}>Your reply needed · 22h 30m left</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: French Beans */}
        <TouchableOpacity style={[styles.card, styles.cardFrenchBeans]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>French Beans</Text>
            <View style={[styles.statusBadge, { backgroundColor: P.twOrange100 }]}>
              <Text style={[styles.statusText, { color: P.twOrange700 }]}>Waiting</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 2 · 80 kg · ₹55/kg · 16 Jul</Text>
        </TouchableOpacity>

        {/* Card 3: Tomato */}
        <TouchableOpacity style={[styles.card, styles.cardTomato]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Tomato · Hybrid</Text>
            <View style={[styles.statusBadge, { backgroundColor: P.twGreen100 }]}>
              <Text style={[styles.statusText, { color: P.twGreen700 }]}>Approved</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 1 · 200 kg · ₹38/kg · 09 Jul</Text>
          <View style={[styles.alertStrip, { backgroundColor: P.twLime100 }]}>
            <Icon name="account_balance_wallet" size={14} color={P.twGreen700} />
            <Text style={[styles.alertText, { color: P.twGreen700 }]}>Paid · ₹7,600 net</Text>
          </View>
        </TouchableOpacity>

        {/* Card 4: Cabbage */}
        <TouchableOpacity style={[styles.card, styles.cardCabbage]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Cabbage</Text>
            <View style={[styles.statusBadge, { backgroundColor: P.twRed100 }]}>
              <Text style={[styles.statusText, { color: P.twRed700 }]}>Rejected</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 2 · 120 kg · ₹18/kg · 02 Jul</Text>
        </TouchableOpacity>

        {/* Card 5: Potato */}
        <TouchableOpacity style={[styles.card, styles.cardPotato]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Potato · Kufri</Text>
            <View style={[styles.statusBadge, { backgroundColor: P.twGray100 }]}>
              <Text style={[styles.statusText, { color: P.twGray600 }]}>Withdrawn</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 1 · 300 kg · ₹22/kg · 28 Jun</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.grey50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.slate900,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.slate500,
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'stretch',
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 15,
    color: P.twGray800,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  filterCaret: {
    marginLeft: 'auto',
  },
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCarrot: {
    borderColor: P.twPurple200,
    borderLeftWidth: 4,
    borderLeftColor: P.twPurple600,
  },
  cardFrenchBeans: {
    borderColor: P.twOrange100,
    borderLeftWidth: 4,
    borderLeftColor: P.twOrange500,
  },
  cardTomato: {
    borderColor: P.twGreen100,
    borderLeftWidth: 4,
    borderLeftColor: P.twGreen500,
  },
  cardCabbage: {
    borderColor: P.twRed100,
    borderLeftWidth: 4,
    borderLeftColor: P.twRed500,
  },
  cardPotato: {
    borderColor: P.twGray100,
    borderLeftWidth: 4,
    borderLeftColor: P.twGray400,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.slate900,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cropSub: {
    fontSize: 13,
    color: P.slate500,
  },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
