/**
 * The sections of the Edit Farmer form (team design), in order: Personal
 * information, Identity (locked), Address, Zone & farm assignment, Farm
 * details, Farm FMB & zones (plots), Documents.
 *
 * Inputs exist only for what PATCH /admin/farmers/{id} accepts. BR-33a: the
 * mobile is an input only for a holder of `farmer.profile.edit_locked_field`;
 * for everyone else it is read-only with a lock. BR-33b: the Aadhaar is never
 * an input and only ever shows the last four digits. Zone, warehouse, farming
 * type, farm name, total area, plots and documents cannot be changed by the
 * API: they are read-only rows with the API value or the dash, no picker, no
 * Replace / Add / Edit / Delete buttons.
 */
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { EditFarmerFormValues, FarmerDetailView, FarmerDocumentView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { LockIcon } from '../detail/icons';
import { documentRows, landLocationCards, maskAadhaar, noValue, type FarmerDetailAccess } from '../detail/model';
import { Pill } from '../detail/parts';
import { formatAdminDay } from '../../../utils/datetime';
import { editReadOnlyRows, GENDER_OPTIONS, genderLabel, joinMobile, splitMobile, type FarmerEditAccess } from './model';
import { editStyles as e } from './styles';

type SetField = <K extends keyof EditFarmerFormValues>(key: K, value: EditFarmerFormValues[K]) => void;

function Label({ text, required = false, first = false }: { text: string; required?: boolean; first?: boolean }) {
  return (
    <Text style={[e.fieldLabel, first && e.fieldLabelFirst]}>
      {text}
      {required ? <Text style={e.reqStar}>{` ${t('farmerDetail.form.required')}`}</Text> : null}
    </Text>
  );
}

function Field({
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string | undefined;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | undefined;
}) {
  return (
    <TextInput
      style={e.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={adminColors.placeholder}
      keyboardType={keyboardType ?? 'default'}
    />
  );
}

function ReadOnly({ value }: { value: string }) {
  return (
    <View style={e.readOnlyField}>
      <Text style={e.readOnlyText} numberOfLines={1}>
        {value}
      </Text>
      <LockIcon size={14} color={adminColors.muted} />
    </View>
  );
}

export function PersonalSection({
  values,
  setField,
  access,
}: {
  values: EditFarmerFormValues;
  setField: SetField;
  access: FarmerEditAccess;
}) {
  const mobile = splitMobile(values.mobile);
  return (
    <>
      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionPersonal')}</Text>
      <View style={e.card}>
        <Label text={t('farmerDetail.edit.fullName')} required first />
        <Field value={values.fullName} onChangeText={(v) => setField('fullName', v)} placeholder={t('farmerDetail.edit.fullNamePlaceholder')} />

        <Label text={t('farmerDetail.edit.mobile')} />
        <View style={e.phoneRow}>
          {mobile.prefix !== '' ? (
            <View style={e.phonePrefix}>
              <Text style={e.phonePrefixText}>{mobile.prefix}</Text>
            </View>
          ) : null}
          <View style={e.phoneInputWrap}>
            {/* BR-33a: locked unless the caller holds farmer.profile.edit_locked_field. */}
            <TextInput
              style={[e.phoneInput, !access.canEditLockedFields && e.inputLocked]}
              value={mobile.local}
              editable={access.canEditLockedFields}
              onChangeText={(local) => setField('mobile', joinMobile({ prefix: mobile.prefix, local }))}
              keyboardType="phone-pad"
              accessibilityState={{ disabled: !access.canEditLockedFields }}
            />
            {!access.canEditLockedFields ? (
              <View style={e.phoneLockIcon} pointerEvents="none">
                <LockIcon size={14} color={adminColors.muted} />
              </View>
            ) : null}
          </View>
        </View>
        {!access.canEditLockedFields ? <Text style={e.helper}>{t('farmerDetail.edit.mobileLocked')}</Text> : null}

        <Label text={t('farmerDetail.edit.email')} />
        <Field
          value={values.email}
          onChangeText={(v) => setField('email', v)}
          placeholder={t('farmerDetail.edit.emailPlaceholder')}
          keyboardType="email-address"
        />

        <Label text={t('farmerDetail.edit.dob')} />
        <Field value={values.dob} onChangeText={(v) => setField('dob', v)} placeholder={t('farmerDetail.edit.dobPlaceholder')} />

        <Label text={t('farmerDetail.edit.gender')} />
        <View style={e.chipsRow}>
          {GENDER_OPTIONS.map((g) => {
            const selected = values.gender === g;
            return (
              <TouchableOpacity
                key={g}
                style={[e.chip, selected && e.chipSelected]}
                onPress={() => setField('gender', selected ? null : g)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[e.chipText, selected && e.chipTextSelected]}>{genderLabel(g)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}

export function IdentitySection({ farmer }: { farmer: FarmerDetailView }) {
  return (
    <>
      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionIdentity')}</Text>
      <View style={e.lockedCard}>
        <View style={e.lockedRow}>
          <Text style={e.lockedLabel}>{t('farmerDetail.edit.farmerId')}</Text>
          <View style={e.lockedValueRow}>
            <Text style={e.lockedValue}>{farmer.farmerCode}</Text>
            <LockIcon size={14} color={adminColors.ink} />
          </View>
        </View>
        <View style={e.lockedDivider} />
        <View style={e.lockedRow}>
          <Text style={e.lockedLabel}>{t('farmerDetail.edit.aadhaar')}</Text>
          <View style={e.lockedValueRow}>
            {/* BR-33b: last four digits only, never an input. */}
            <Text style={e.lockedValue}>{maskAadhaar(farmer.aadhaarLast4)}</Text>
            <LockIcon size={14} color={adminColors.ink} />
          </View>
        </View>
      </View>
    </>
  );
}

export function AddressSection({ values, setField }: { values: EditFarmerFormValues; setField: SetField }) {
  return (
    <>
      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionAddress')}</Text>
      <View style={e.card}>
        <Label text={t('farmerDetail.edit.addressLine1')} first />
        <Field value={values.addressLine1} onChangeText={(v) => setField('addressLine1', v)} placeholder={t('farmerDetail.edit.addressLine1')} />
        <Label text={t('farmerDetail.edit.addressLine2')} />
        <Field value={values.addressLine2} onChangeText={(v) => setField('addressLine2', v)} placeholder={t('farmerDetail.edit.optional')} />
        <View style={e.twoColRow}>
          <View style={e.col}>
            <Label text={t('farmerDetail.edit.village')} />
            <Field value={values.village} onChangeText={(v) => setField('village', v)} placeholder={t('farmerDetail.edit.village')} />
          </View>
          <View style={e.col}>
            <Label text={t('farmerDetail.edit.pincode')} />
            <Field value={values.pincode} onChangeText={(v) => setField('pincode', v)} keyboardType="numeric" />
          </View>
        </View>
        <Label text={t('farmerDetail.edit.district')} required />
        <Field value={values.district} onChangeText={(v) => setField('district', v)} placeholder={t('farmerDetail.edit.district')} />
      </View>
    </>
  );
}

/** Zone & farm assignment + Farm details: read-only, the PATCH cannot change them. */
export function ZoneFarmSection({ farmer }: { farmer: FarmerDetailView }) {
  const [zone, warehouse, farmingType, farmName, totalArea] = editReadOnlyRows(farmer);
  const plotCount = farmer.landLocations.reduce((n, loc) => n + loc.plots.length, 0);
  return (
    <>
      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionZone')}</Text>
      <View style={e.card}>
        <Label text={zone?.label ?? ''} first />
        <ReadOnly value={zone?.value ?? noValue()} />
        <Text style={e.helper}>{t('farmerDetail.edit.zoneNote')}</Text>
        <Label text={warehouse?.label ?? ''} />
        <ReadOnly value={warehouse?.value ?? noValue()} />
        <Label text={farmingType?.label ?? ''} />
        <ReadOnly value={farmingType?.value ?? noValue()} />
      </View>

      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionFarm')}</Text>
      <View style={e.card}>
        <Label text={farmName?.label ?? ''} first />
        <ReadOnly value={farmName?.value ?? noValue()} />
        <View style={e.twoColRow}>
          <View style={e.col}>
            <Label text={totalArea?.label ?? ''} />
            <ReadOnly value={totalArea?.value ?? noValue()} />
          </View>
          <View style={e.col}>
            <Label text={t('farmerDetail.edit.plotsRecorded')} />
            <ReadOnly value={t('farmerDetail.edit.plotsCount', { count: plotCount })} />
          </View>
        </View>
      </View>
    </>
  );
}

/** The design's plot list under "Farm FMB & zones on map", read-only (no map preview: no FMB file API). */
export function PlotsSection({ farmer }: { farmer: FarmerDetailView }) {
  const plots = landLocationCards(farmer).flatMap((loc) => loc.plots.map((p) => ({ ...p, location: loc.title })));
  return (
    <>
      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionPlots')}</Text>
      <View style={e.card}>
        {plots.length === 0 ? <Text style={e.readOnlyText}>{t('farmerDetail.edit.plotsEmpty')}</Text> : null}
        {plots.map((p, i) => (
          <View key={p.id}>
            {i > 0 ? <View style={e.listDivider} /> : null}
            <View style={e.listRow}>
              <Text style={e.listTitle}>{t('farmerDetail.header.subtitle', { name: p.name, code: p.location })}</Text>
              <Text style={e.listMeta}>{p.meta}</Text>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

export function DocumentsSection({
  documents,
  detailAccess,
}: {
  documents: FarmerDocumentView[] | undefined;
  detailAccess: FarmerDetailAccess;
}) {
  if (!detailAccess.canViewDocuments) return null;
  const docs = documents ?? [];
  // Verify is not offered on the edit form (it lives on the KYC tab), so access here is view-only.
  const rows = documentRows(docs, { ...detailAccess, canVerifyDocuments: false });
  return (
    <>
      <Text style={e.sectionHeading}>{t('farmerDetail.edit.sectionDocuments')}</Text>
      {rows.length === 0 ? (
        <View style={e.card}>
          <Text style={e.readOnlyText}>{t('farmerDetail.edit.documentsEmpty')}</Text>
        </View>
      ) : null}
      {rows.map((row, i) => {
        const uploaded = docs[i]?.uploadedAt;
        const day = uploaded === undefined ? '' : formatAdminDay(uploaded);
        return (
          <View key={row.id} style={e.docCard}>
            <View style={e.docHeaderRow}>
              <Text style={e.docTitle}>{row.label}</Text>
              <Pill label={row.status} tone={row.tone} />
            </View>
            <Text style={e.listMeta}>{t('farmerDetail.edit.uploaded', { date: day === '' ? noValue() : day })}</Text>
          </View>
        );
      })}
      <Text style={e.helper}>{t('farmerDetail.edit.documentsNote')}</Text>
    </>
  );
}

export function Disclaimer() {
  return (
    <View style={e.disclaimerBox}>
      <Text style={e.disclaimerText}>{t('farmerDetail.edit.disclaimer')}</Text>
    </View>
  );
}
