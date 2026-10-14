import React, { useState } from 'react';
import {
  Alert,
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
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#F0ECE6',
  buttonBorder: '#EFE7DE',
  orangePrimary: '#E85226',
  systemTagBg: '#E0F2FE',
  systemTagText: '#0369A1',
  warehouseTagBg: '#FEF3C7',
  warehouseTagText: '#B45309',
};

export interface AnnouncementItem {
  id: string;
  tag: string;
  scopeType: 'system' | 'warehouse';
  title: string;
  desc: string;
  sender: string;
  timeAgo: string;
  recipientsCount: string;
}

export interface AnnouncementsScreenProps {
  onBack: () => void;
}

export function AnnouncementsScreen({ onBack }: AnnouncementsScreenProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([
    {
      id: 'a-1',
      tag: 'System-wide · All Farmers',
      scopeType: 'system',
      title: 'Fair price ceilings updated for September',
      desc: 'Carrots, Cabbage, and Beetroot ceilings have been revised — check the Marketing module for new rates.',
      sender: 'Ganga Devi',
      timeAgo: '2 days ago',
      recipientsCount: '1,284 recipients',
    },
    {
      id: 'a-2',
      tag: 'Warehouse-specific · Kotagiri',
      scopeType: 'warehouse',
      title: 'Temporary receiving hours change',
      desc: 'Kotagiri warehouse will close early (2 PM) this Friday for maintenance.',
      sender: 'Prakash Babu',
      timeAgo: '5 days ago',
      recipientsCount: '3 staff',
    },
  ]);

  // Form states
  const [formScope, setFormScope] = useState<'system' | 'warehouse'>('system');
  const [formTarget, setFormTarget] = useState('All Farmers');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const handleCreateAnnouncement = () => {
    if (!formTitle.trim() || !formDesc.trim()) {
      Alert.alert('Incomplete Form', 'Please provide a title and announcement message.');
      return;
    }

    const tagLabel =
      formScope === 'system'
        ? `System-wide · ${formTarget}`
        : `Warehouse-specific · ${formTarget}`;

    const newAnnouncement: AnnouncementItem = {
      id: `a-${Date.now()}`,
      tag: tagLabel,
      scopeType: formScope,
      title: formTitle.trim(),
      desc: formDesc.trim(),
      sender: 'Super Admin',
      timeAgo: 'Just now',
      recipientsCount: formScope === 'system' ? '1,420 recipients' : '18 staff',
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setFormTitle('');
    setFormDesc('');
    setIsCreating(false);
    Alert.alert('Announcement Broadcasted', 'The notification has been sent across selected recipients.');
  };

  // ─── FULL REDIRECT PAGE: NEW ANNOUNCEMENT ────────────────────────────────
  if (isCreating) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsCreating(false)}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#2B2523"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.pageTitle}>New Announcement</Text>
            <Text style={styles.pageSubtitle}>Broadcast instantly to portal participants</Text>
          </View>

          {/* Full Screen Form Container */}
          <View style={styles.fullFormContainer}>
            {/* Scope Switcher */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Announcement Scope</Text>
              <View style={styles.scopeTabs}>
                <TouchableOpacity
                  style={[
                    styles.scopeTab,
                    formScope === 'system' && styles.scopeTabActive,
                  ]}
                  onPress={() => {
                    setFormScope('system');
                    setFormTarget('All Farmers');
                  }}
                >
                  <Text
                    style={[
                      styles.scopeTabText,
                      formScope === 'system' && styles.scopeTabTextActive,
                    ]}
                  >
                    System-wide
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scopeTab,
                    formScope === 'warehouse' && styles.scopeTabActive,
                  ]}
                  onPress={() => {
                    setFormScope('warehouse');
                    setFormTarget('Kotagiri');
                  }}
                >
                  <Text
                    style={[
                      styles.scopeTabText,
                      formScope === 'warehouse' && styles.scopeTabTextActive,
                    ]}
                  >
                    Warehouse-specific
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Target Audience */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Audience Target</Text>
              <TextInput
                style={styles.formInput}
                value={formTarget}
                onChangeText={setFormTarget}
                placeholder={formScope === 'system' ? 'e.g. All Farmers, Customers' : 'e.g. Kotagiri, Ooty'}
              />
            </View>

            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Fair price ceilings updated for September"
              />
            </View>

            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Announcement Message</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Write clear, actionable details for recipients..."
                multiline
                numberOfLines={5}
              />
            </View>
          </View>

          {/* Broadcast Action Button */}
          <TouchableOpacity
            style={styles.primaryNewBtn}
            onPress={handleCreateAnnouncement}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryNewBtnText}>Broadcast Announcement</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── MAIN SCREEN: ANNOUNCEMENTS LIST ────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Bar with Back and Plus Buttons */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#2B2523"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsCreating(true)}
            activeOpacity={0.7}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5v14M5 12h14"
                stroke="#2B2523"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Announcements</Text>
          <Text style={styles.pageSubtitle}>Sent to farmers, customers, or staff</Text>
        </View>

        {/* Announcement Cards List */}
        <View style={styles.cardsList}>
          {announcements.map((item) => {
            const isSystem = item.scopeType === 'system';
            return (
              <View key={item.id} style={styles.announcementCard}>
                {/* Tag Pill */}
                <View
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: isSystem ? PALETTE.systemTagBg : PALETTE.warehouseTagBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagPillText,
                      {
                        color: isSystem ? PALETTE.systemTagText : PALETTE.warehouseTagText,
                      },
                    ]}
                  >
                    {item.tag}
                  </Text>
                </View>

                {/* Heading */}
                <Text style={styles.announcementTitle}>{item.title}</Text>

                {/* Description */}
                <Text style={styles.announcementDesc}>{item.desc}</Text>

                {/* Footer */}
                <Text style={styles.announcementFooter}>
                  Sent by {item.sender} · {item.timeAgo} · {item.recipientsCount}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Bottom Primary Action Button: + New Announcement -> Redirects to Full Screen */}
        <TouchableOpacity
          style={styles.primaryNewBtn}
          onPress={() => setIsCreating(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryNewBtnText}>+ New Announcement</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETTE.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.4,
    borderColor: PALETTE.buttonBorder,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerBlock: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#78716C',
    fontWeight: '400',
  },
  cardsList: {
    gap: 16,
    marginBottom: 20,
  },
  announcementCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  tagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
    borderRadius: 16,
    marginBottom: 10,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  announcementTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 6,
  },
  announcementDesc: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  announcementFooter: {
    fontSize: 12.5,
    color: PALETTE.textMuted,
    fontWeight: '400',
  },
  primaryNewBtn: {
    backgroundColor: PALETTE.orangePrimary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.orangePrimary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryNewBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fullFormContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  formGroup: {
    marginBottom: 18,
  },
  formLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  scopeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F5F2EC',
    borderRadius: 12,
    padding: 3,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  scopeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  scopeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  scopeTabTextActive: {
    color: PALETTE.orangePrimary,
  },
  formInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#EFECE6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: PALETTE.textPrimary,
  },
  formTextArea: {
    height: 110,
    textAlignVertical: 'top',
  },
});
