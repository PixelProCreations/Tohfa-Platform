import React, { useState } from 'react';
import {
  Alert,
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
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { Can } from '../../permissions/can';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import {
  BackArrowIcon,
  CloseIcon,
  FilterSlidersIcon,
  PlusIcon,
  SearchIcon,
} from '../../components/AdminIcons';

export type CropDataSegment = 'crop_types' | 'diary_activity' | 'platform_events';

export interface CropTypeItem {
  id: string;
  code: string;
  name: string;
  tamilName: string;
  category: 'Vegetable' | 'Fruit' | 'Spice';
  status: 'ACTIVE' | 'INACTIVE';
  creator: string;
  updatedDate: string;
  deactivationReason?: string | undefined;
  description?: string | undefined;
  season?: string | undefined;
  durationDays?: string | undefined;
  storageTemp?: string | undefined;
  gradeSystem?: string | undefined;
}

export interface CropDataScreenProps {
  can?: Can | undefined;
  role?: string | undefined;
  onBack: () => void;
  onNavigateToAddCropType?: ((crop?: CropTypeItem) => void) | undefined;
  onNavigateToAddActivity: () => void;
  onNavigateToCreateEvent: () => void;
}

interface DiaryActivityItem {
  id: string;
  code: string;
  categoryName: string;
  subActivityCount: number;
  description: string;
  status: 'ACTIVE' | 'RETIRED';
  createdBy: string;
  lastUpdated: string;
}

interface PlatformEventItem {
  id: string;
  code: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  status: 'DRAFT' | 'ACTIVE';
  createdBy: string;
  lastUpdated: string;
}

const MOCK_CROP_TYPES: CropTypeItem[] = [
  {
    id: 'crp-1',
    code: 'CRP-001',
    name: 'Tomato',
    tamilName: 'Thakkali',
    category: 'Vegetable',
    status: 'ACTIVE',
    creator: 'Demo TOHFA Admin',
    updatedDate: '20 Oct 2026',
  },
  {
    id: 'crp-2',
    code: 'CRP-005',
    name: 'Carrot',
    tamilName: 'Carrot',
    category: 'Vegetable',
    status: 'ACTIVE',
    creator: 'Demo TOHFA Admin',
    updatedDate: '15 Oct 2026',
  },
  {
    id: 'crp-3',
    code: 'CRP-012',
    name: 'Garlic',
    tamilName: 'Poondu',
    category: 'Spice',
    status: 'INACTIVE',
    creator: 'Demo TOHFA Admin',
    updatedDate: '2 Sep 2026',
    deactivationReason: 'Discontinued (demo)',
  },
  {
    id: 'crp-4',
    code: 'CRP-018',
    name: 'Potato',
    tamilName: 'Urulaikizhangu',
    category: 'Vegetable',
    status: 'ACTIVE',
    creator: 'Demo TOHFA Admin',
    updatedDate: '18 Oct 2026',
  },
];

const MOCK_DIARY_ACTIVITIES: DiaryActivityItem[] = [
  {
    id: 'da-1',
    code: 'DA01',
    categoryName: 'Land Prep',
    subActivityCount: 3,
    description: '—',
    status: 'ACTIVE',
    createdBy: 'Demo Super Admin',
    lastUpdated: '18 Sep 2026',
  },
  {
    id: 'da-2',
    code: 'DA02',
    categoryName: 'Sowing',
    subActivityCount: 2,
    description: 'Direct sowing and transplanting nursery seedlings',
    status: 'ACTIVE',
    createdBy: 'Demo Super Admin',
    lastUpdated: '22 Sep 2026',
  },
  {
    id: 'da-3',
    code: 'DA03',
    categoryName: 'Irrigation & Drainage',
    subActivityCount: 4,
    description: 'Drip, sprinkler, furrow and drainage maintenance',
    status: 'ACTIVE',
    createdBy: 'Demo TOHFA Admin',
    lastUpdated: '2 Oct 2026',
  },
];

const MOCK_PLATFORM_EVENTS: PlatformEventItem[] = [
  {
    id: 'evt-1',
    code: 'EVT-003',
    title: 'Soil health workshop',
    eventType: 'Training',
    startDate: '27 Nov 2026, 10:00',
    endDate: '27 Nov 2026, 13:00',
    targetAudience: 'Selected Zones (Coonoor, Kotagiri)',
    status: 'DRAFT',
    createdBy: 'Demo Super Admin',
    lastUpdated: '26 Oct 2026',
  },
  {
    id: 'evt-2',
    code: 'EVT-001',
    title: 'Organic certification expo',
    eventType: 'Symposium',
    startDate: '15 Nov 2026, 09:00',
    endDate: '15 Nov 2026, 17:00',
    targetAudience: 'All Farmers',
    status: 'ACTIVE',
    createdBy: 'Demo Super Admin',
    lastUpdated: '12 Oct 2026',
  },
];

/**
 * Crop Data screen
 * Matching exact reference mockups:
 * - M4-S28a · Crop Types List (Image 3 right)
 * - M4-S28b · Activity Category (Image 4 left)
 * - M4-S28c · Platform Events (Image 4 right)
 */
export function CropDataScreen({
  can,
  role = 'SUPER_ADMIN',
  onBack,
  onNavigateToAddCropType,
  onNavigateToAddActivity,
  onNavigateToCreateEvent,
}: CropDataScreenProps): React.JSX.Element {
  const [selectedSegment, setSelectedSegment] = useState<CropDataSegment>('crop_types');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | 'Vegetable' | 'Fruit' | 'Spice'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for items
  const [cropTypes, setCropTypes] = useState<CropTypeItem[]>(MOCK_CROP_TYPES);
  const [activities, setActivities] = useState<DiaryActivityItem[]>(MOCK_DIARY_ACTIVITIES);
  const [events, setEvents] = useState<PlatformEventItem[]>(MOCK_PLATFORM_EVENTS);

  // Add Crop Type modal state
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropTamil, setNewCropTamil] = useState('');
  const [newCropCategory, setNewCropCategory] = useState<'Vegetable' | 'Fruit' | 'Spice'>('Vegetable');

  // RBAC Permission Gates:
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isTohfaAdmin = role === 'TOHFA_ADMIN';
  const canManageCropTaxonomy = isSuperAdmin || isTohfaAdmin || (can ? can('admin.crop_taxonomy.manage') : true);
  const canManageDiaryTaxonomy = isSuperAdmin || isTohfaAdmin || (can ? can('admin.diary_taxonomy.manage') : true);
  const canManagePlatformEvents = isSuperAdmin || isTohfaAdmin || (can ? can('platform.event.manage') : true);

  // Handlers
  const handleToggleCropStatus = (id: string) => {
    if (!canManageCropTaxonomy) {
      Alert.alert('Permission Denied', 'You do not have permission to modify crop taxonomy.');
      return;
    }
    setCropTypes((prev: CropTypeItem[]) =>
      prev.map((c): CropTypeItem => {
        if (c.id === id) {
          const next: 'ACTIVE' | 'INACTIVE' = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return {
            ...c,
            status: next,
            deactivationReason: next === 'INACTIVE' ? 'Deactivated by admin' : undefined,
          };
        }
        return c;
      })
    );
  };

  const handleRetireActivity = (id: string) => {
    if (!canManageDiaryTaxonomy) {
      Alert.alert('Permission Denied', 'You do not have permission to retire diary activities.');
      return;
    }
    Alert.alert(
      'Retire Activity',
      'Are you sure you want to retire this activity category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retire',
          style: 'destructive',
          onPress: () => {
            setActivities(prev =>
              prev.map(a => (a.id === id ? { ...a, status: 'RETIRED' } : a))
            );
          },
        },
      ]
    );
  };

  const handleRemoveEvent = (id: string) => {
    if (!canManagePlatformEvents) {
      Alert.alert('Permission Denied', 'You do not have permission to manage platform events.');
      return;
    }
    Alert.alert(
      'Remove Event',
      'Are you sure you want to delete this event from the platform calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setEvents(prev => prev.filter(e => e.id !== id));
          },
        },
      ]
    );
  };

  const handleSaveCropType = () => {
    if (!newCropName.trim()) {
      Alert.alert('Required Field', 'Please enter a crop name.');
      return;
    }
    const newCrop: CropTypeItem = {
      id: `crp-${Date.now()}`,
      code: `CRP-0${cropTypes.length + 15}`,
      name: newCropName.trim(),
      tamilName: newCropTamil.trim() || newCropName.trim(),
      category: newCropCategory,
      status: 'ACTIVE',
      creator: role === 'SUPER_ADMIN' ? 'Demo Super Admin' : 'Demo TOHFA Admin',
      updatedDate: 'Today',
    };
    setCropTypes(prev => [newCrop, ...prev]);
    setShowAddCropModal(false);
    setNewCropName('');
    setNewCropTamil('');
  };

  const filteredCrops = cropTypes.filter(c => {
    const matchesCategory =
      selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredActivities = activities.filter(
    a =>
      !searchQuery.trim() ||
      a.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter(
    e =>
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Data</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Heading based on Tab */}
        <Text style={styles.tabSectionHeading}>
          {selectedSegment === 'crop_types'
            ? 'Crop Types'
            : selectedSegment === 'diary_activity'
              ? 'Diary Activity Types'
              : 'Platform Events'}
        </Text>

        {/* ─── 4 KPI Summary Cards using OverviewDashboardCard ─── */}
        {selectedSegment === 'crop_types' && (
          <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
            <OverviewDashboardCard
              title="TOTAL"
              value="18"
              titlePosition="top"
              preserveCase
            />
            <OverviewDashboardCard
              title="ACTIVE"
              value="16"
              titlePosition="top"
              tone="success"
              preserveCase
            />
            <OverviewDashboardCard
              title="INACTIVE"
              value="2"
              titlePosition="top"
              preserveCase
            />
            <OverviewDashboardCard
              title="RECENTLY ADDED (7D)"
              value="3"
              titlePosition="top"
              preserveCase
            />
          </OverviewCardsGrid>
        )}

        {selectedSegment === 'diary_activity' && (
          <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
            <OverviewDashboardCard
              title="Total Activity Types"
              value="12"
              titlePosition="top"
              preserveCase
            />
            <OverviewDashboardCard
              title="Active Categories"
              value="12"
              titlePosition="top"
              tone="success"
              preserveCase
            />
            <OverviewDashboardCard
              title="Total Sub-Activities"
              value="21"
              titlePosition="top"
              preserveCase
            />
            <OverviewDashboardCard
              title="Retired Activities"
              value="3"
              titlePosition="top"
              preserveCase
            />
          </OverviewCardsGrid>
        )}

        {selectedSegment === 'platform_events' && (
          <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
            <OverviewDashboardCard
              title="Total Events"
              value="12"
              titlePosition="top"
              preserveCase
            />
            <OverviewDashboardCard
              title="Upcoming Events"
              value="12"
              titlePosition="top"
              tone="success"
              preserveCase
            />
            <OverviewDashboardCard
              title="Published Events"
              value="21"
              titlePosition="top"
              preserveCase
            />
            <OverviewDashboardCard
              title="Draft Events"
              value="3"
              titlePosition="top"
              preserveCase
            />
          </OverviewCardsGrid>
        )}

        {/* ─── 3 Segment Buttons ─── */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedSegment === 'crop_types' && styles.segmentBtnActive,
            ]}
            onPress={() => setSelectedSegment('crop_types')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentBtnText,
                selectedSegment === 'crop_types' && styles.segmentBtnTextActive,
              ]}
            >
              Crop Types
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedSegment === 'diary_activity' && styles.segmentBtnActive,
            ]}
            onPress={() => setSelectedSegment('diary_activity')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentBtnText,
                selectedSegment === 'diary_activity' && styles.segmentBtnTextActive,
              ]}
            >
              Diary Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              selectedSegment === 'platform_events' && styles.segmentBtnActive,
            ]}
            onPress={() => setSelectedSegment('platform_events')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentBtnText,
                selectedSegment === 'platform_events' && styles.segmentBtnTextActive,
              ]}
            >
              Platform Events
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Chips for Crop Types */}
        {selectedSegment === 'crop_types' && (
          <View style={styles.chipsRow}>
            {(['All', 'Vegetable', 'Fruit', 'Spice'] as const).map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedCategoryFilter === cat && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategoryFilter(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategoryFilter === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search Bar with Filter Sliders Icon */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FilterSlidersIcon size={18} color={adminColors.brand} />
        </View>

        {/* Count Label */}
        <Text style={styles.countLabel}>
          {selectedSegment === 'crop_types'
            ? `${filteredCrops.length} Types`
            : selectedSegment === 'diary_activity'
              ? `${filteredActivities.length} Categories`
              : `${filteredEvents.length} Events`}
        </Text>

        {/* ─── TAB 1: Crop Types List (M4-S28a) ─── */}
        {selectedSegment === 'crop_types' && (
          <View style={styles.listContainer}>
            {filteredCrops.map(item => (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardItemTitle}>
                    {item.code} · {item.name}
                  </Text>
                  <AdminStatusBadge
                    status={item.status}
                    label={item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    tone={item.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </View>

                <Text style={styles.cardItemSubtitle}>
                  {item.tamilName} · {item.category}
                </Text>
                <Text style={styles.cardItemMeta}>
                  Created by {item.creator} · Updated {item.updatedDate}
                </Text>

                {item.deactivationReason && (
                  <Text style={styles.deactivationReasonText}>
                    Reason: {item.deactivationReason}
                  </Text>
                )}

                {/* Actions row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      if (onNavigateToAddCropType) {
                        onNavigateToAddCropType(item);
                      } else {
                        Alert.alert('Crop Detail', `${item.code} · ${item.name}`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.actionLinkText}>View</Text>
                  </TouchableOpacity>

                  {canManageCropTaxonomy && (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          if (onNavigateToAddCropType) {
                            onNavigateToAddCropType(item);
                          } else {
                            Alert.alert('Edit Crop', `Edit ${item.name}`);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionLinkText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleToggleCropStatus(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionLinkText,
                            item.status === 'ACTIVE'
                              ? styles.actionDangerText
                              : styles.actionSuccessText,
                          ]}
                        >
                          {item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── TAB 2: Diary Activity Categories (M4-S28b) ─── */}
        {selectedSegment === 'diary_activity' && (
          <View style={styles.listContainer}>
            {filteredActivities.map(item => (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Activity Code</Text>
                  <Text style={styles.activityFieldValueBold}>{item.code}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Category Name</Text>
                  <Text style={styles.activityFieldValueBold}>{item.categoryName}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Sub-Activity Count</Text>
                  <Text style={styles.activityFieldValue}>{item.subActivityCount}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Description</Text>
                  <Text style={styles.activityFieldValue}>{item.description}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Status</Text>
                  <AdminStatusBadge
                    status={item.status}
                    label={item.status === 'ACTIVE' ? 'Active' : 'Retired'}
                    tone={item.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Created By</Text>
                  <Text style={styles.activityFieldValue}>{item.createdBy}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Last Updated</Text>
                  <Text style={styles.activityFieldValue}>{item.lastUpdated}</Text>
                </View>

                {/* Bottom Button Row: [View] [Edit] [Retire] */}
                <View style={styles.activityButtonsRow}>
                  <TouchableOpacity
                    style={styles.pillButton}
                    onPress={() => Alert.alert('Activity Category', `${item.code} - ${item.categoryName}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pillButtonText}>View</Text>
                  </TouchableOpacity>

                  {canManageDiaryTaxonomy && (
                    <>
                      <TouchableOpacity
                        style={styles.pillButton}
                        onPress={() => Alert.alert('Edit Activity', `Edit ${item.categoryName}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pillButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.pillButton, styles.pillButtonDanger]}
                        onPress={() => handleRetireActivity(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pillButtonDangerText}>Retire</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── TAB 3: Platform Events (M4-S28c) ─── */}
        {selectedSegment === 'platform_events' && (
          <View style={styles.listContainer}>
            {filteredEvents.map(item => (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Event ID</Text>
                  <Text style={styles.activityFieldValueBold}>{item.code}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Event Title</Text>
                  <Text style={styles.activityFieldValueBold}>{item.title}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Event Type</Text>
                  <Text style={styles.activityFieldValue}>{item.eventType}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Start</Text>
                  <Text style={styles.activityFieldValue}>{item.startDate}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>End</Text>
                  <Text style={styles.activityFieldValue}>{item.endDate}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Target Audience</Text>
                  <Text style={styles.activityFieldValueBold}>{item.targetAudience}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Status</Text>
                  <AdminStatusBadge
                    status={item.status}
                    label={item.status === 'ACTIVE' ? 'Published' : 'Draft'}
                    tone={item.status === 'ACTIVE' ? 'success' : 'warning'}
                  />
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Created By</Text>
                  <Text style={styles.activityFieldValue}>{item.createdBy}</Text>
                </View>

                <View style={styles.activityCardFieldRow}>
                  <Text style={styles.activityFieldLabel}>Last Updated</Text>
                  <Text style={styles.activityFieldValue}>{item.lastUpdated}</Text>
                </View>

                {/* Bottom Button Row: [View] [Edit] [Remove] */}
                <View style={styles.activityButtonsRow}>
                  <TouchableOpacity
                    style={styles.pillButton}
                    onPress={() => Alert.alert('Event Details', `${item.code} - ${item.title}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pillButtonText}>View</Text>
                  </TouchableOpacity>

                  {canManagePlatformEvents && (
                    <>
                      <TouchableOpacity
                        style={styles.pillButton}
                        onPress={() => Alert.alert('Edit Event', `Edit ${item.title}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pillButtonText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.pillButton, styles.pillButtonDanger]}
                        onPress={() => handleRemoveEvent(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.pillButtonDangerText}>Remove</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Bottom Floating CTA Button ─── */}
      <View style={styles.bottomBar}>
        {selectedSegment === 'crop_types' && canManageCropTaxonomy && (
          <TouchableOpacity
            style={styles.ctaPrimaryBtn}
            onPress={() => {
              if (onNavigateToAddCropType) {
                onNavigateToAddCropType();
              } else {
                setShowAddCropModal(true);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaPrimaryBtnText}>+ Add Crop Type</Text>
          </TouchableOpacity>
        )}

        {selectedSegment === 'diary_activity' && canManageDiaryTaxonomy && (
          <TouchableOpacity
            style={styles.ctaPrimaryBtn}
            onPress={onNavigateToAddActivity}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaPrimaryBtnText}>+ Add Activity Category</Text>
          </TouchableOpacity>
        )}

        {selectedSegment === 'platform_events' && canManagePlatformEvents && (
          <TouchableOpacity
            style={styles.ctaPrimaryBtn}
            onPress={onNavigateToCreateEvent}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaPrimaryBtnText}>+ Create Event</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Crop Type Modal */}
      <Modal
        visible={showAddCropModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCropModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Crop Type</Text>
              <TouchableOpacity
                onPress={() => setShowAddCropModal(false)}
                activeOpacity={0.7}
              >
                <CloseIcon size={20} color={adminColors.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Crop Name (English) *</Text>
              <TextInput
                style={styles.modalInput}
                value={newCropName}
                onChangeText={setNewCropName}
                placeholder="e.g. Beetroot"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Tamil Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newCropTamil}
                onChangeText={setNewCropTamil}
                placeholder="e.g. பீட்ரூட்"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.modalChipsRow}>
                {(['Vegetable', 'Fruit', 'Spice'] as const).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalChip,
                      newCropCategory === cat && styles.modalChipActive,
                    ]}
                    onPress={() => setNewCropCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        newCropCategory === cat && styles.modalChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddCropModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCropType}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  tabSectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '800',
    marginBottom: adminSpacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 3,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brand,
  },
  segmentBtnText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    height: 44,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    height: 44,
  },
  countLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    marginBottom: adminSpacing.sm,
  },
  listContainer: {
    gap: adminSpacing.sm,
  },
  cardItem: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardItemTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
  },
  cardItemSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 2,
  },
  cardItemMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  deactivationReasonText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontStyle: 'italic',
    marginBottom: adminSpacing.xs,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.lg,
    marginTop: adminSpacing.xs,
    paddingTop: adminSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: adminColors.canvas,
  },
  actionLinkText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  actionDangerText: {
    color: adminColors.danger.text,
  },
  actionSuccessText: {
    color: adminColors.success.text,
  },
  activityCardFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  activityFieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    width: 130,
  },
  activityFieldValue: {
    ...adminType.caption,
    color: adminColors.ink,
    flex: 1,
    textAlign: 'right',
  },
  activityFieldValueBold: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  activityButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  pillButton: {
    flex: 1,
    height: 36,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  pillButtonDanger: {
    borderColor: adminColors.danger.border,
  },
  pillButtonDangerText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  ctaPrimaryBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  ctaPrimaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
  },
  modalBody: {
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    marginTop: 4,
  },
  modalInput: {
    height: 44,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
  },
  modalChipsRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    marginTop: 4,
  },
  modalChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  modalChipText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  modalChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});

