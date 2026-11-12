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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowWhiteIcon,
  CalendarIcon,
  ChevronDownIcon,
} from '../../components/AdminIcons';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';

export interface WorkforceLine {
  id: string;
  name: string;
  hours: string;
  wage: string;
}

export interface EditFarmRecordData {
  id?: string;
  type: 'crop' | 'diary' | 'livestock' | 'asset';
  headerTitle: string;
  date?: string;
  plot?: string;
  category?: string;
  subCategory?: string;
  activity?: string;
  timeSpent?: string;
  linkedCrop?: string;
  workforce?: WorkforceLine[];
  notes?: string;
  hasPhoto?: boolean;
  // Crop-specific fields
  growthStage?: string;
  expectedHarvest?: string;
  seedSource?: string;
  grade?: string;
  // Livestock-specific fields
  breed?: string;
  latestProduction?: string;
  // Asset-specific fields
  serviceInterval?: string;
  lastService?: string;
  nextServiceDue?: string;
}

export interface AdminEditFarmRecordScreenProps {
  record: EditFarmRecordData;
  onBack: () => void;
  onSave?: ((updated: EditFarmRecordData) => void) | undefined;
}

export function AdminEditFarmRecordScreen({
  record,
  onBack,
  onSave,
}: AdminEditFarmRecordScreenProps): React.JSX.Element {
  const [date, setDate] = useState(record.date ?? '28 Oct 2026');
  const [plot, setPlot] = useState(record.plot ?? 'Plot 1 (1.8 acre)');
  const [category, setCategory] = useState(record.category ?? 'Nutrient');
  const [subCategory, setSubCategory] = useState(record.subCategory ?? 'Compost application');
  const [timeSpent, setTimeSpent] = useState(record.timeSpent ?? '90');
  const [linkedCrop, setLinkedCrop] = useState(record.linkedCrop ?? 'Tomato (same plot)');
  const [notes, setNotes] = useState(record.notes ?? 'Applied compost before the next rain.');
  const [hasPhoto, setHasPhoto] = useState(record.hasPhoto ?? true);
  const [workforce, setWorkforce] = useState<WorkforceLine[]>(
    record.workforce && record.workforce.length > 0
      ? record.workforce
      : [{ id: 'w1', name: 'Worker 1', hours: '', wage: '' }]
  );

  // Type-specific fields
  const [growthStage, setGrowthStage] = useState(record.growthStage ?? 'Vegetative');
  const [expectedHarvest, setExpectedHarvest] = useState(record.expectedHarvest ?? '27 Nov 2026');
  const [seedSource, setSeedSource] = useState(record.seedSource ?? 'Own saved seed');
  const [grade, setGrade] = useState(record.grade ?? 'Grade 1');

  const [breed, setBreed] = useState(record.breed ?? 'Jersey');
  const [latestProduction, setLatestProduction] = useState(
    record.latestProduction ?? '12 litres of milk, 27 Oct 2026'
  );

  const [serviceInterval, setServiceInterval] = useState(record.serviceInterval ?? '180 days');
  const [lastService, setLastService] = useState(record.lastService ?? '11 Apr 2026');
  const [nextServiceDue, setNextServiceDue] = useState(record.nextServiceDue ?? '8 Oct 2026');
  const [calendarTarget, setCalendarTarget] = useState<
    'date' | 'expectedHarvest' | 'lastService' | 'nextServiceDue' | null
  >(null);

  const handleAddWorker = () => {
    const nextNum = workforce.length + 1;
    setWorkforce((prev) => [
      ...prev,
      { id: `w${Date.now()}`, name: `Worker ${nextNum}`, hours: '', wage: '' },
    ]);
  };

  const handleUpdateWorker = (id: string, field: 'name' | 'hours' | 'wage', val: string) => {
    setWorkforce((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: val } : w))
    );
  };

  const handleSave = () => {
    if (!date.trim() || !plot.trim()) {
      Alert.alert('Required', 'Please fill in all mandatory fields (*).');
      return;
    }
    const updated: EditFarmRecordData = {
      ...record,
      date,
      plot,
      category,
      subCategory,
      timeSpent,
      linkedCrop,
      notes,
      workforce,
      hasPhoto,
      growthStage,
      expectedHarvest,
      seedSource,
      grade,
      breed,
      latestProduction,
      serviceInterval,
      lastService,
      nextServiceDue,
    };
    onSave?.(updated);
    Alert.alert('Saved', `${record.headerTitle} updated successfully.`);
    onBack();
  };

  const dateLabel =
    record.type === 'crop'
      ? 'Planted date'
      : record.type === 'livestock'
        ? 'Acquired date'
        : record.type === 'asset'
          ? 'Purchased date'
          : 'Date';

  const plotLabel =
    record.type === 'livestock' || record.type === 'asset' ? 'Location / Plot' : 'Plot';

  const categoryLabel =
    record.type === 'crop'
      ? 'Crop category & variety'
      : record.type === 'livestock'
        ? 'Animal type & name'
        : record.type === 'asset'
          ? 'Asset category & name'
          : 'Activity category';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowWhiteIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {record.headerTitle}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Form Card (Matching Image 2 layout & design) */}
        <View style={styles.formCard}>
          {/* Date * */}
          <Text style={styles.fieldLabel}>
            {dateLabel} <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.inputWithIconRow}>
            <TextInput
              style={styles.inputFlex}
              value={date}
              onChangeText={setDate}
              placeholder="Select date"
              placeholderTextColor={adminColors.placeholder}
            />
            <TouchableOpacity
              onPress={() => setCalendarTarget('date')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Pick date"
            >
              <CalendarIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Plot * */}
          <Text style={styles.fieldLabel}>
            {plotLabel} <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.inputWithIconRow}>
            <TextInput
              style={styles.inputFlex}
              value={plot}
              onChangeText={setPlot}
              placeholder="Select plot"
              placeholderTextColor={adminColors.placeholder}
            />
            <ChevronDownIcon size={18} color={adminColors.muted} />
          </View>

          {/* Category & Subcategory / Name * */}
          <Text style={styles.fieldLabel}>
            {categoryLabel} <Text style={styles.reqStar}>*</Text>
          </Text>
          <View style={styles.inputWithIconRow}>
            <TextInput
              style={styles.inputFlex}
              value={category}
              onChangeText={setCategory}
              placeholder="Category"
              placeholderTextColor={adminColors.placeholder}
            />
            <ChevronDownIcon size={18} color={adminColors.muted} />
          </View>

          {record.type === 'diary' ? (
            <>
              <Text style={styles.fieldLabel}>
                Activity <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={subCategory}
                  onChangeText={setSubCategory}
                  placeholder="Activity"
                  placeholderTextColor={adminColors.placeholder}
                />
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </>
          ) : (
            <View style={[styles.inputWithIconRow, { marginTop: adminSpacing.sm }]}>
              <TextInput
                style={styles.inputFlex}
                value={subCategory}
                onChangeText={setSubCategory}
                placeholder="Details"
                placeholderTextColor={adminColors.placeholder}
              />
              <ChevronDownIcon size={18} color={adminColors.muted} />
            </View>
          )}

          {/* Diary-specific fields (Image 2 exact match) */}
          {record.type === 'diary' && (
            <>
              <Text style={styles.fieldLabel}>
                Time spent (minutes, 1–1,440) <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInputBox}
                value={timeSpent}
                onChangeText={setTimeSpent}
                keyboardType="numeric"
                placeholder="e.g. 90"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Linked crop (optional)</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={linkedCrop}
                  onChangeText={setLinkedCrop}
                  placeholder="Select linked crop"
                  placeholderTextColor={adminColors.placeholder}
                />
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </>
          )}

          {/* Crop-specific fields */}
          {record.type === 'crop' && (
            <>
              <Text style={styles.fieldLabel}>
                Growth stage <Text style={styles.reqStar}>*</Text>
              </Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={growthStage}
                  onChangeText={setGrowthStage}
                  placeholder="Growth stage"
                  placeholderTextColor={adminColors.placeholder}
                />
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>

              <Text style={styles.fieldLabel}>Expected harvest</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={expectedHarvest}
                  onChangeText={setExpectedHarvest}
                  placeholder="Expected harvest date"
                  placeholderTextColor={adminColors.placeholder}
                />
                <TouchableOpacity
                  onPress={() => setCalendarTarget('expectedHarvest')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Pick expected harvest date"
                >
                  <CalendarIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Seed source</Text>
              <TextInput
                style={styles.textInputBox}
                value={seedSource}
                onChangeText={setSeedSource}
                placeholder="Seed source"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Grade</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={grade}
                  onChangeText={setGrade}
                  placeholder="Grade"
                  placeholderTextColor={adminColors.placeholder}
                />
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>
            </>
          )}

          {/* Livestock-specific fields */}
          {record.type === 'livestock' && (
            <>
              <Text style={styles.fieldLabel}>
                Breed <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInputBox}
                value={breed}
                onChangeText={setBreed}
                placeholder="Breed"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Latest production log</Text>
              <TextInput
                style={styles.textInputBox}
                value={latestProduction}
                onChangeText={setLatestProduction}
                placeholder="e.g. 12 litres of milk"
                placeholderTextColor={adminColors.placeholder}
              />
            </>
          )}

          {/* Asset-specific fields */}
          {record.type === 'asset' && (
            <>
              <Text style={styles.fieldLabel}>
                Service interval <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInputBox}
                value={serviceInterval}
                onChangeText={setServiceInterval}
                placeholder="e.g. 180 days"
                placeholderTextColor={adminColors.placeholder}
              />

              <Text style={styles.fieldLabel}>Last service date</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={lastService}
                  onChangeText={setLastService}
                  placeholder="Last service date"
                  placeholderTextColor={adminColors.placeholder}
                />
                <TouchableOpacity
                  onPress={() => setCalendarTarget('lastService')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Pick last service date"
                >
                  <CalendarIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Next service due</Text>
              <View style={styles.inputWithIconRow}>
                <TextInput
                  style={styles.inputFlex}
                  value={nextServiceDue}
                  onChangeText={setNextServiceDue}
                  placeholder="Next service due"
                  placeholderTextColor={adminColors.placeholder}
                />
                <TouchableOpacity
                  onPress={() => setCalendarTarget('nextServiceDue')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Pick next service due date"
                >
                  <CalendarIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Workforce lines (optional) for Diary & Crop */}
          {(record.type === 'diary' || record.type === 'crop') && (
            <>
              <View style={styles.workforceHeaderRow}>
                <Text style={styles.workforceHeading}>Workforce lines (optional)</Text>
                <TouchableOpacity onPress={handleAddWorker} activeOpacity={0.7}>
                  <Text style={styles.addWorkerText}>Add +</Text>
                </TouchableOpacity>
              </View>

              {workforce.map((w, idx) => (
                <View key={w.id} style={styles.workforceRow}>
                  <View style={styles.workforceCol}>
                    <Text style={styles.workforceSubLabel}>{w.name || `Worker ${idx + 1}`}</Text>
                    <TextInput
                      style={styles.workforceInput}
                      value={w.name}
                      onChangeText={(v) => handleUpdateWorker(w.id, 'name', v)}
                      placeholder="Name"
                      placeholderTextColor={adminColors.placeholder}
                    />
                  </View>
                  <View style={styles.workforceCol}>
                    <Text style={styles.workforceSubLabel}>Hours</Text>
                    <TextInput
                      style={styles.workforceInput}
                      value={w.hours}
                      onChangeText={(v) => handleUpdateWorker(w.id, 'hours', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={adminColors.placeholder}
                    />
                  </View>
                  <View style={styles.workforceCol}>
                    <Text style={styles.workforceSubLabel}>Wage (₹)</Text>
                    <TextInput
                      style={styles.workforceInput}
                      value={w.wage}
                      onChangeText={(v) => handleUpdateWorker(w.id, 'wage', v)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={adminColors.placeholder}
                    />
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Notes (up to 500 characters) */}
          <Text style={styles.fieldLabel}>Notes (up to 500 characters)</Text>
          <TextInput
            style={styles.notesTextArea}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="Add notes..."
            placeholderTextColor={adminColors.placeholder}
          />

          {/* Photos (up to 5) */}
          <Text style={styles.fieldLabel}>Photos (up to 5)</Text>
          <View style={styles.photosRow}>
            {hasPhoto && (
              <View style={styles.photoThumbnailWrap}>
                <Svg width={64} height={64} viewBox="0 0 64 64">
                  <Rect width={64} height={64} rx={8} fill={adminColors.canvas} />
                  <Rect y={36} width={64} height={28} rx={4} fill={adminColors.success.bg} />
                  <Circle cx={24} cy={46} r={10} fill={adminColors.ink} />
                  <Circle cx={44} cy={48} r={7} fill={adminColors.ink} />
                  <Rect x={18} y={30} width={26} height={16} rx={2} fill={adminColors.brand} />
                  <Rect x={26} y={22} width={14} height={10} rx={2} fill={adminColors.brandSoft.bg} />
                </Svg>
                <TouchableOpacity
                  style={styles.photoDeleteBadge}
                  onPress={() => setHasPhoto(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoDeleteBadgeText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Camera Upload Box */}
            <TouchableOpacity
              style={styles.cameraUploadBox}
              onPress={() => {
                setHasPhoto(true);
                Alert.alert('Photo', 'Photo attached from camera / gallery.');
              }}
              activeOpacity={0.8}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                  stroke={adminColors.brand}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle cx="12" cy="13" r="4" stroke={adminColors.brand} strokeWidth="2" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Save Button (Matching Image 2) */}
        <TouchableOpacity style={styles.saveSolidBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveSolidBtnText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>

      <AdminCalendarPickerModal
        visible={calendarTarget !== null}
        format="DD MMM YYYY"
        value={
          calendarTarget === 'date'
            ? date
            : calendarTarget === 'expectedHarvest'
            ? expectedHarvest
            : calendarTarget === 'lastService'
            ? lastService
            : nextServiceDue
        }
        onSelect={(d) => {
          if (calendarTarget === 'date') setDate(d);
          else if (calendarTarget === 'expectedHarvest') setExpectedHarvest(d);
          else if (calendarTarget === 'lastService') setLastService(d);
          else if (calendarTarget === 'nextServiceDue') setNextServiceDue(d);
        }}
        onClose={() => setCalendarTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl + 20,
  },
  formCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  fieldLabel: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.sm + 2,
    marginBottom: 6,
  },
  reqStar: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  inputWithIconRow: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  inputFlex: {
    flex: 1,
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  textInputBox: {
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
  },
  workforceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  workforceHeading: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  addWorkerText: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  workforceRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  workforceCol: {
    flex: 1,
  },
  workforceSubLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 4,
  },
  workforceInput: {
    height: 40,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
  },
  notesTextArea: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: adminColors.card,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: 4,
  },
  photoThumbnailWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: adminRadius.lg,
    overflow: 'visible',
  },
  photoDeleteBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: adminColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.card,
  },
  photoDeleteBadgeText: {
    fontSize: 10,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  cameraUploadBox: {
    width: 64,
    height: 64,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.brandSoft.border,
    backgroundColor: adminColors.brandSoft.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSolidBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  saveSolidBtnText: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
