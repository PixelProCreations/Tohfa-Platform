import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadFileIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 32, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface AddedWarehouseData {
  name: string;
  id: string;
  location: string;
  status: string;
  stock: string;
  capacity: string;
  staff: string;
  utilization: string;
}

export function MainWarehouseAddScreen({
  onBack,
  onWarehouseAdded,
}: {
  onBack: () => void;
  onWarehouseAdded?: ((data: AddedWarehouseData) => void) | undefined;
}) {
  const [step, setStep] = useState(1);

  // Step 1: Basic Information
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseType, setWarehouseType] = useState('Main Storage');
  const [location, setLocation] = useState('Gudalur Market');
  const [address, setAddress] = useState('');

  // Step 2: Contact Information
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [alternateContact, setAlternateContact] = useState('');

  // Step 3: Operating Information
  const [operatingStatus, setOperatingStatus] = useState('Open');
  const [operatingDays, setOperatingDays] = useState('Mon–Sat');
  const [operatingHours, setOperatingHours] = useState('');
  const [specialDays, setSpecialDays] = useState('');
  const [operatingNotes, setOperatingNotes] = useState('');

  // Step 4: Capacity
  const [totalCapacity, setTotalCapacity] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('');
  const [capacityUnit, setCapacityUnit] = useState<'kg' | 'tonnes'>('kg');

  // Step 5: Documents
  const [docsUploaded, setDocsUploaded] = useState<Record<string, boolean>>({});

  const TOTAL_STEPS = 6;

  const renderStepDots = () => {
    if (step > TOTAL_STEPS) return null;
    return (
      <View style={styles.stepDotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum <= step;
          return (
            <View
              key={stepNum}
              style={[
                styles.stepDot,
                { backgroundColor: isActive ? adminColors.brand : adminColors.border },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            {renderStepDots()}
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <Text style={styles.inputLabel}>Warehouse Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gudalur Storage Facility"
              placeholderTextColor={adminColors.placeholder}
              value={warehouseName}
              onChangeText={setWarehouseName}
            />

            <Text style={styles.inputLabel}>Warehouse ID</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="System generated"
              placeholderTextColor={adminColors.placeholder}
              editable={false}
            />

            <Text style={styles.inputLabel}>Warehouse Type</Text>
            <View style={styles.pillRow}>
              {['Main Storage', 'Market Storage', 'Cold Storage'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.pill, warehouseType === type && styles.pillActive]}
                  onPress={() => setWarehouseType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, warehouseType === type && styles.pillTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Location</Text>
            <View style={styles.pillRow}>
              {['Ooty', 'Coonoor', 'Kotagiri', 'Gudalur Market'].map((loc) => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.pill, location === loc && styles.pillActive]}
                  onPress={() => setLocation(loc)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, location === loc && styles.pillTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Full warehouse address"
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={4}
              value={address}
              onChangeText={setAddress}
            />
          </>
        );

      case 2:
        return (
          <>
            {renderStepDots()}
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <Text style={styles.inputLabel}>Primary Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={adminColors.placeholder}
              value={contactName}
              onChangeText={setContactName}
            />

            <Text style={styles.inputLabel}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="phone-pad"
              value={contactNumber}
              onChangeText={setContactNumber}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="name@tohfa.org"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Alternate Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor={adminColors.placeholder}
              value={alternateContact}
              onChangeText={setAlternateContact}
            />
          </>
        );

      case 3:
        return (
          <>
            {renderStepDots()}
            <Text style={styles.sectionTitle}>Operating Information</Text>

            <Text style={styles.inputLabel}>Operating Status</Text>
            <View style={styles.pillRow}>
              {['Open', 'Closed'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.pill, operatingStatus === status && styles.pillActive]}
                  onPress={() => setOperatingStatus(status)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, operatingStatus === status && styles.pillTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Operating Days</Text>
            <View style={styles.pillRow}>
              {['Mon–Sat', 'All Days'].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.pill, operatingDays === days && styles.pillActive]}
                  onPress={() => setOperatingDays(days)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, operatingDays === days && styles.pillTextActive]}>{days}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Operating Hours</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 8:00 AM – 6:00 PM"
              placeholderTextColor={adminColors.placeholder}
              value={operatingHours}
              onChangeText={setOperatingHours}
            />

            <Text style={styles.inputLabel}>Special Operating Days</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Market days only on Sundays"
              placeholderTextColor={adminColors.placeholder}
              value={specialDays}
              onChangeText={setSpecialDays}
            />

            <Text style={styles.inputLabel}>Operating Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional notes"
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={4}
              value={operatingNotes}
              onChangeText={setOperatingNotes}
            />
          </>
        );

      case 4:
        return (
          <>
            {renderStepDots()}
            <Text style={styles.sectionTitle}>Capacity</Text>

            <Text style={styles.inputLabel}>Total Warehouse Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter capacity"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="numeric"
              value={totalCapacity}
              onChangeText={setTotalCapacity}
            />

            <Text style={styles.inputLabel}>Storage Capacity</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter storage capacity"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="numeric"
              value={storageCapacity}
              onChangeText={setStorageCapacity}
            />

            <Text style={styles.inputLabel}>Capacity Unit</Text>
            <View style={styles.pillRow}>
              {(['kg', 'tonnes'] as const).map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.pill, capacityUnit === unit && styles.pillActive]}
                  onPress={() => setCapacityUnit(unit)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, capacityUnit === unit && styles.pillTextActive]}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                Capacity numbers are never pre-filled or assumed — they're entered here and only shown elsewhere once configured.
              </Text>
            </View>
          </>
        );

      case 5:
        return (
          <>
            {renderStepDots()}
            <Text style={styles.sectionTitle}>Documents</Text>

            {[
              { id: 'registration', title: 'Warehouse Registration', required: true },
              { id: 'compliance', title: 'Compliance Document', required: true },
              { id: 'license', title: 'License', required: true },
              { id: 'other', title: 'Other', required: false },
            ].map((doc) => {
              const isUploaded = !!docsUploaded[doc.id];
              return (
                <View key={doc.id} style={styles.docCard}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <View style={styles.docBottomRow}>
                    <Text style={styles.docSub}>{isUploaded ? 'Uploaded (doc.pdf)' : 'Not uploaded'}</Text>
                    <Text style={[styles.docRequired, !doc.required && styles.docOptional]}>
                      {doc.required ? 'Required' : 'Optional'}
                    </Text>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() =>
                setDocsUploaded((prev) => ({
                  ...prev,
                  registration: true,
                  compliance: true,
                  license: true,
                }))
              }
              activeOpacity={0.8}
            >
              <UploadFileIcon size={18} color={adminColors.brand} />
              <Text style={styles.uploadBtnText}>Upload Document</Text>
            </TouchableOpacity>
          </>
        );

      case 6:
        return (
          <>
            {renderStepDots()}
            <Text style={styles.sectionTitle}>Review</Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewRow}>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Warehouse Name</Text>
                  <Text style={styles.reviewValue}>{warehouseName || 'Gudalur Storage Facility'}</Text>
                </View>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Location</Text>
                  <Text style={styles.reviewValue}>{location || 'Gudalur Market'}</Text>
                </View>
              </View>

              <View style={[styles.reviewRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Contact</Text>
                  <Text style={styles.reviewValue}>{contactName ? contactName : 'Primary contact set'}</Text>
                </View>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Operating</Text>
                  <Text style={styles.reviewValue}>{operatingStatus} · {operatingDays}</Text>
                </View>
              </View>

              <View style={[styles.reviewRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Capacity</Text>
                  <Text style={styles.reviewValue}>
                    {totalCapacity ? `${totalCapacity} ${capacityUnit}` : 'As entered'}
                  </Text>
                </View>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Documents</Text>
                  <Text style={styles.reviewValue}>3 of 4 uploaded</Text>
                </View>
              </View>
            </View>
          </>
        );

      case 7:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIconWrap}>
              <SuccessCheckIcon size={28} color={adminColors.success.text} />
            </View>
            <Text style={styles.successTitle}>Warehouse Created</Text>
            <Text style={styles.successSub}>
              {warehouseName || 'Gudalur Storage Facility'} has been added.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const handleFinishAddWarehouse = () => {
    const finalName = warehouseName.trim() || 'Gudalur Storage Facility';
    const finalLocation = location || 'Gudalur Market';
    const finalCapacity = totalCapacity ? `${totalCapacity} ${capacityUnit}` : '6,120 kg';
    const finalStock = '0 kg';
    const finalStaff = '0';
    const finalId = 'WH-004';

    if (onWarehouseAdded) {
      onWarehouseAdded({
        name: finalName,
        id: finalId,
        location: `${finalLocation}, Nilgiris`,
        status: 'Active',
        stock: finalStock,
        capacity: finalCapacity,
        staff: finalStaff,
        utilization: '0%',
      });
    } else {
      onBack();
    }
  };

  const renderFooter = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Next: Contact</Text>
            </TouchableOpacity>
          </View>
        );
      case 2:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.primaryBtnText}>Next: Operating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.primaryBtnText}>Next: Capacity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(5)}>
              <Text style={styles.primaryBtnText}>Next: Documents</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(3)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 5:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(6)}>
              <Text style={styles.primaryBtnText}>Next: Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 6:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(7)}>
              <Text style={styles.primaryBtnText}>Create Warehouse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(5)}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
      case 7:
        return (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleFinishAddWarehouse}>
              <Text style={styles.primaryBtnText}>View Warehouse</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const handleHeaderBack = () => {
    if (step > 1 && step < 7) {
      setStep((s) => s - 1);
    } else {
      onBack();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleHeaderBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{step === 7 ? 'Warehouse Created' : 'Add Warehouse'}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {renderFooter()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: adminSpacing.lg },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },

  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
    marginTop: adminSpacing.xs,
  },
  stepDot: {
    width: adminSpacing.sm,
    height: adminSpacing.sm,
    borderRadius: adminRadius.full,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: adminSpacing.lg, paddingBottom: adminSpacing.xl },

  sectionTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.lg },

  inputLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.sm },
  input: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: adminSpacing.xl,
  },
  disabledInput: {
    backgroundColor: adminColors.canvas,
    color: adminColors.muted,
  },
  textArea: {
    minHeight: adminSpacing.xxxl * 2,
    textAlignVertical: 'top',
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.xl },
  pill: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  pillText: { ...adminType.rowMeta, color: adminColors.ink },
  pillTextActive: { ...adminType.caption, color: adminColors.onBrand },

  warningBanner: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  warningText: { ...adminType.rowMeta, color: adminColors.warning.text },

  docCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  docTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs },
  docBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docSub: { ...adminType.rowMeta, color: adminColors.muted },
  docRequired: { ...adminType.caption, color: adminColors.brand },
  docOptional: { ...adminType.caption, color: adminColors.muted },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  uploadBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  reviewCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
  },
  reviewRow: { flexDirection: 'row' },
  reviewCol: { flex: 1 },
  reviewLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  reviewValue: { ...adminType.rowTitle, color: adminColors.ink },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: adminSpacing.xxxl + adminSpacing.md,
  },
  successIconWrap: {
    width: adminSpacing.xxxl + adminSpacing.lg,
    height: adminSpacing.xxxl + adminSpacing.lg,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xl,
  },
  successTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.sm },
  successSub: { ...adminType.body, color: adminColors.muted, textAlign: 'center' },

  footer: {
    padding: adminSpacing.lg,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  primaryBtnText: { ...adminType.rowTitle, color: adminColors.onBrand },
  secondaryBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...adminType.rowTitle, color: adminColors.muted },
});
