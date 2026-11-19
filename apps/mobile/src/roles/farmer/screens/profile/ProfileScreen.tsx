import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import {
  Icon,
  isFarmMapAvailable,
  ScreenStatusBar,
  type FarmBoundaryMapLoadError,
  appAlert,
} from '@tohfa/mobile-ui';
import { logout } from '../../api/auth';
import { updateMyFarmerProfile } from '../../api/farmer';
import { updateFarm } from '../../api/farms';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';
import { buildFarmMapPreview } from './farmMapPreview';
import { AuditsCard } from './profileSections/AuditsCard';
import { CertificationsCard } from './profileSections/CertificationsCard';
import { EditFarmModal } from './profileSections/EditFarmModal';
import { EditPersonalModal } from './profileSections/EditPersonalModal';
import { FarmFmbCard } from './profileSections/FarmFmbCard';
import { FarmRatingCard } from './profileSections/FarmRatingCard';
import { PersonalDetailsCard } from './profileSections/PersonalDetailsCard';
import { ProfileHeader } from './profileSections/ProfileHeader';
import { SignOutIcon } from './profileSections/ProfileIcons';
import {
  AuditsModal,
  BankModal,
  DocumentsModal,
  RatingModal,
  SettingsModal,
  SoilModal,
} from './profileSections/ProfileInfoModals';
import { ProfileMenuCard } from './profileSections/ProfileMenuCard';
import { SoilTestCard } from './profileSections/SoilTestCard';
import { styles } from './profileSections/profileStyles';
import { useProfileAudits } from './profileSections/useProfileAudits';
import { useProfileCertifications } from './profileSections/useProfileCertifications';
import { useProfileData } from './profileSections/useProfileData';
import { useFarmEditForm, usePersonalEditForm } from './profileSections/useProfileEditForms';
import { useProfileModals } from './profileSections/useProfileModals';
import { useProfileRating } from './profileSections/useProfileRating';

interface ProfileScreenProps {
  onNavigateToHome?: () => void;
  onBack?: () => void;
  onNavigateToCertifications?: () => void;
  onNavigateToMarket?: () => void;
  onNavigateToFMBSketch?: () => void;
  onNavigateToPersonalDetails?: () => void;
  onNavigateToAudits?: () => void;
  onNavigateToFarmRatings?: () => void;
  onNavigateToSoilTest?: () => void;
  onNavigateToSettings?: (() => void) | undefined;
  onNavigateToAboutSupport?: (() => void) | undefined;
  onNavigateToBankPayment?: () => void;
  onSignOut?: () => void;
}

export function ProfileScreen({
  onNavigateToHome,
  onBack,
  onNavigateToCertifications,
  onNavigateToFMBSketch,
  onNavigateToPersonalDetails,
  onNavigateToAudits,
  onNavigateToFarmRatings,
  onNavigateToSoilTest,
  onNavigateToSettings,
  onNavigateToAboutSupport,
  onNavigateToBankPayment,
  onSignOut,
}: ProfileScreenProps): React.JSX.Element {
  // --- Remote data (each loads independently so one failure never blanks the screen) ---
  const {
    personalDetails,
    setPersonalDetails,
    farmDetails,
    setFarmDetails,
    farmsList,
    farmsLoading,
    farmerId,
    latestSoilTest,
    soilLoading,
    selectedLocale,
    setSelectedLocale,
    previewMapFailed,
    setPreviewMapFailed,
    loadFarms,
  } = useProfileData();
  const {
    certsLoading,
    certsError,
    retryCerts,
    certSummary,
    worstCert,
    certStatTone,
    certStatLabel,
  } = useProfileCertifications();
  const {
    auditsState,
    retryAudits,
    auditItems,
    nextAudit,
    pastAudits,
    auditsDoneThisYear,
    auditQuickStatValue,
  } = useProfileAudits();
  const { ratingLoading, ratingView } = useProfileRating();

  // --- Modals and edit-form drafts ---
  const modals = useProfileModals();
  const personalForm = usePersonalEditForm(personalDetails);
  const farmForm = useFarmEditForm(farmDetails);

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `TOHFA Farmer Profile: ${personalDetails.fullName} (${farmerId})\n${personalDetails.farmName}, ${personalDetails.location}\nPGS Certified Organic Producer.`,
      });
    } catch {
      // Ignored
    }
  };

  const openPersonalEdit = () => {
    personalForm.resetFrom(personalDetails);
    modals.show('editPersonal');
  };

  const handleSavePersonalDetails = async () => {
    if (!personalForm.validation.validateAll().valid) return;
    setSaving(true);
    try {
      const form = personalForm.form;
      const expNumber = parseInt(form.yearsInOrganic, 10) || 0;
      await updateMyFarmerProfile({
        fullName: form.fullName.trim(),
        farmingExperienceYears: expNumber,
        address: form.location.trim(),
      }).catch(() => {
        // Backend unavailable — local update only
      });

      // farmingType is kept in local state only -- it is never sent in the
      // updateMyFarmerProfile() call above and never read back from
      // getMyFarmerProfile() either. Investigated: `farmers` has no
      // farming_type (or equivalent) column (db/migrations/0003_farmers_and
      // _farms.sql), updateFarmerProfileBody has no such field
      // (apps/api/src/modules/farmer-applications/farmer-applications.schema.ts),
      // and GET /farmers/me never returns one. The closest real field,
      // `typeOfFarming` collected at registration Step 2, is a free-text crop
      // description ("Mixed vegetables", "Tea") stored only in the
      // application's step2_farm_details JSONB and deliberately never copied
      // onto the farmers row (farmer-applications.service.ts's
      // approveApplication) -- a different concept from this screen's fixed
      // ORGANIC/NATURAL/BIODYNAMIC method chips, not just an unwired version
      // of the same data. Wiring this for real needs a product decision
      // (a new column, plus reconciling the enum against that free text) that
      // is out of scope here, so the value is kept client-side and the UI
      // says so explicitly (farmingType.notSavedNote below) instead of
      // implying the save succeeded.
      setPersonalDetails({
        ...personalDetails,
        fullName: form.fullName.trim(),
        dob: form.dob.trim(),
        yearsInOrganic: expNumber > 0 ? String(expNumber) : '',
        farmingType: form.farmingType,
        farmName: form.farmName.trim(),
        location: form.location.trim(),
      });

      modals.hide('editPersonal');
      setSaveSuccessMsg(t('farmer.profile.personal.saved'));
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const primaryFarm = farmsList.find((f) => f.isPrimary) ?? farmsList[0] ?? null;
  // The Farm & FMB preview shows the most informative farm -- the one with a drawn boundary, else
  // one with a stored location -- not blindly the primary/first farm (see farmMapPreview.ts).
  const mapPreview = buildFarmMapPreview(farmsList);
  const previewFarm = mapPreview.farm;
  const hasBoundary = mapPreview.polygon !== null;
  // A map is always shown when it can render -- even with no known location (default region),
  // so the card never collapses to an empty box. The placeholder remains only for a build that
  // cannot draw a map at all (no Mapbox SDK/token) or a map whose style failed to load.
  const showPreviewMap = isFarmMapAvailable() && !previewMapFailed;

  // GPS badge text: the same point the preview map is centred on, so the two never disagree.
  // With no known location the camera sits on the default region, which is NOT this farm's
  // position -- the badge then says the boundary is pending instead of printing those numbers.
  const gpsStatusLabel = mapPreview.hasLocation
    ? `${mapPreview.center[1].toFixed(4)}° N, ${mapPreview.center[0].toFixed(4)}° E`
    : t('farmer.profile.farm.gpsPending');

  const handlePreviewMapLoadError = useCallback(
    (error?: FarmBoundaryMapLoadError) => {
      // Mapbox reports a single missing tile/source/sprite/glyph through this same callback, and the
      // rest of the map still draws fine -- only a style failure (or an unclassified one) means no
      // map at all, so only that swaps the preview for the placeholder.
      const kind = error?.type;
      if (kind === 'tile' || kind === 'source' || kind === 'sprite' || kind === 'glyphs') return;
      setPreviewMapFailed(true);
    },
    [setPreviewMapFailed],
  );

  const openFarmEdit = () => {
    if (onNavigateToFMBSketch) {
      onNavigateToFMBSketch();
    } else {
      farmForm.resetFrom(farmDetails);
      modals.show('editFarm');
    }
  };

  const handleSaveFarmDetails = async () => {
    if (!farmForm.validation.validateAll().valid) return;
    setSaving(true);
    try {
      const form = farmForm.form;
      const acresNum = parseFloat(form.acres);
      const waterList = form.waterSource
        ? form.waterSource
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      if (primaryFarm?.id) {
        await updateFarm(primaryFarm.id, {
          areaAcres: isNaN(acresNum) ? undefined : acresNum,
          waterSources: waterList,
        }).catch(() => {});
      }

      setFarmDetails((prev) => ({
        ...prev,
        acres: form.acres.trim() || prev.acres,
        zones: form.zones.trim() || prev.zones,
        waterSource: form.waterSource.trim() || prev.waterSource,
      }));
      modals.hide('editFarm');
      setSaveSuccessMsg(t('farmer.profile.farm.saved'));
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      void loadFarms();
    } finally {
      setSaving(false);
    }
  };

  // Navigation-or-modal fallbacks shared by the header stat cards and the section cards.
  const goToPersonalDetails = () =>
    onNavigateToPersonalDetails ? onNavigateToPersonalDetails() : openPersonalEdit();
  const goToFarmEditor = () => (onNavigateToFMBSketch ? onNavigateToFMBSketch() : openFarmEdit());
  const goToAudits = () => (onNavigateToAudits ? onNavigateToAudits() : modals.show('audits'));
  const goToFarmRatings = () =>
    onNavigateToFarmRatings ? onNavigateToFarmRatings() : modals.show('rating');
  const goToCertifications = () => onNavigateToCertifications?.();

  const confirmSignOut = () => {
    appAlert(
      t('farmer.profile.logout.button'),
      t('farmer.profile.settings.signOutConfirmMessage'),
      [
        { text: t('farmer.common.cancel'), style: 'cancel' },
        {
          text: t('farmer.profile.logout.button'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await logout();
              onSignOut?.();
            })();
          },
        },
      ], { tone: 'warning' },
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          personalDetails={personalDetails}
          farmerId={farmerId}
          acres={farmDetails.acres}
          certStatTone={certStatTone}
          certStatLabel={certStatLabel}
          ratingLoading={ratingLoading}
          ratingView={ratingView}
          auditQuickStatValue={auditQuickStatValue}
          onBack={onBack ?? onNavigateToHome}
          onShare={handleShareProfile}
          onOpenSettings={() => {
            if (onNavigateToSettings) {
              onNavigateToSettings();
            } else {
              modals.show('settings');
            }
          }}
          onEditPhoto={goToPersonalDetails}
          onCertPress={goToCertifications}
          onRatingPress={goToFarmRatings}
          onAuditPress={goToAudits}
          onAcresPress={goToFarmEditor}
        />

        {/* Success Toast */}
        {saveSuccessMsg ? (
          <View style={[styles.toastSuccess, styles.toastSuccessRow]}>
            <Icon name="check_circle" size={14} color={P.deepGreen} />
            <Text style={styles.toastSuccessText}>{saveSuccessMsg}</Text>
          </View>
        ) : null}

        <PersonalDetailsCard personalDetails={personalDetails} onEdit={goToPersonalDetails} />

        <FarmFmbCard
          farmsLoading={farmsLoading}
          farmDetails={farmDetails}
          mapPreview={mapPreview}
          previewFarm={previewFarm}
          hasBoundary={hasBoundary}
          showPreviewMap={showPreviewMap}
          gpsStatusLabel={gpsStatusLabel}
          onMapLoadError={handlePreviewMapLoadError}
          onEdit={goToFarmEditor}
        />

        <CertificationsCard
          certsLoading={certsLoading}
          certsError={certsError}
          certSummary={certSummary}
          worstCert={worstCert}
          onManage={goToCertifications}
          onRetry={retryCerts}
        />

        {/* Real data: GET /v1/farmers/me/audits via listAllMyAudits() -- see useProfileAudits. */}
        <AuditsCard
          auditsState={auditsState}
          auditItems={auditItems}
          nextAudit={nextAudit}
          pastAudits={pastAudits}
          auditsDoneThisYear={auditsDoneThisYear}
          onViewAll={goToAudits}
          onRetry={retryAudits}
        />

        <FarmRatingCard
          ratingView={ratingView}
          ratingLoading={ratingLoading}
          onDetails={goToFarmRatings}
        />

        <SoilTestCard
          soilLoading={soilLoading}
          latestSoilTest={latestSoilTest}
          onHistory={() => (onNavigateToSoilTest ? onNavigateToSoilTest() : modals.show('soil'))}
        />

        <ProfileMenuCard
          onBankPress={() => {
            if (onNavigateToBankPayment) {
              onNavigateToBankPayment();
            } else {
              modals.show('bank');
            }
          }}
          onHelpPress={() => {
            if (onNavigateToAboutSupport) {
              onNavigateToAboutSupport();
            } else {
              appAlert(t('farmer.profile.help.title'), t('farmer.profile.help.body'), [
                { text: t('farmer.common.ok') },
              ]);
            }
          }}
        />

        {/* Standalone Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={confirmSignOut} activeOpacity={0.8}>
          <SignOutIcon size={18} color={P.red600} />
          <Text style={styles.logoutButtonText}>{t('farmer.profile.logout.button')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <EditPersonalModal
        visible={modals.visible.editPersonal}
        form={personalForm.form}
        setField={personalForm.setField}
        personalDetails={personalDetails}
        validation={personalForm.validation}
        saving={saving}
        onClose={() => modals.hide('editPersonal')}
        onSave={handleSavePersonalDetails}
      />

      <EditFarmModal
        visible={modals.visible.editFarm}
        form={farmForm.form}
        setField={farmForm.setField}
        farmDetails={farmDetails}
        validation={farmForm.validation}
        hasBoundary={hasBoundary}
        gpsStatusLabel={gpsStatusLabel}
        onClose={() => modals.hide('editFarm')}
        onSave={handleSaveFarmDetails}
      />

      <DocumentsModal visible={modals.visible.documents} onClose={() => modals.hide('documents')} />

      <BankModal visible={modals.visible.bank} onClose={() => modals.hide('bank')} />

      <SettingsModal
        visible={modals.visible.settings}
        selectedLocale={selectedLocale}
        onSelectLocale={setSelectedLocale}
        onClose={() => modals.hide('settings')}
      />

      <AuditsModal
        visible={modals.visible.audits}
        auditsState={auditsState}
        pastAudits={pastAudits}
        onRetry={retryAudits}
        onViewDetails={() => {
          modals.hide('audits');
          onNavigateToAudits?.();
        }}
        onClose={() => modals.hide('audits')}
      />

      <RatingModal
        visible={modals.visible.rating}
        ratingView={ratingView}
        onClose={() => modals.hide('rating')}
      />

      <SoilModal
        visible={modals.visible.soil}
        soilLoading={soilLoading}
        latestSoilTest={latestSoilTest}
        onClose={() => modals.hide('soil')}
      />
    </SafeAreaView>
  );
}
