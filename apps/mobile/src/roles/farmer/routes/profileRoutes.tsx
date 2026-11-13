import React from 'react';
import { AddCertificationScreen } from '../screens/certifications/AddCertificationScreen';
import { CertificationsScreen } from '../screens/certifications/CertificationsScreen';
import { CertificateDocumentScreen } from '../screens/certifications/CertificateDocumentScreen';
import { EditCertificationScreen } from '../screens/certifications/EditCertificationScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { AuditsScreen } from '../screens/audits/AuditsScreen';
import { AuditResultScreen } from '../screens/audits/AuditResultScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { AboutSupportScreen } from '../screens/profile/AboutSupportScreen';
import { PersonalDetailsScreen } from '../screens/profile/PersonalDetailsScreen';
import { FarmRatingsScreen } from '../screens/profile/FarmRatingsScreen';
import { stringParam } from './routeParams';
import type { FarmerRouteRenderer } from './types';

/**
 * The farmer's account screens: certifications, audits, notifications,
 * personal details, ratings, support and password. Settings and the FMB
 * Sketch -> Field Context -> Zones setup stay in App.tsx, whose source the
 * sign-out and farm-setup tests pin.
 */
export const renderProfileRoute: FarmerRouteRenderer = ({ screen, params, navigate, goBack, nav, selections }) => {
  const { selectedCertification, setSelectedCertification, setSelectedListing } = selections;
  switch (screen) {
    case 'Certifications':
      return (
        <CertificationsScreen
          onBack={goBack}
          onNavigateToAddCertification={() => navigate('AddCertification')}
          onNavigateToEditCertification={(certification) => {
            setSelectedCertification(certification);
            navigate('EditCertification');
          }}
          onNavigateToViewDocument={(url, title) => navigate('CertificateDocument', { url, title })}
        />
      );
    case 'CertificateDocument': {
      // Opened only from the Certifications card with a non-empty url; without
      // one this route renders nothing of its own (like EditCertification).
      const url = stringParam(params['url']);
      return url ? (
        <CertificateDocumentScreen url={url} title={stringParam(params['title'])} onClose={() => goBack('Certifications')} />
      ) : undefined;
    }
    case 'AddCertification':
      return (
        <AddCertificationScreen
          onSuccess={goBack}
          onCancel={goBack}
        />
      );
    case 'EditCertification':
      // With no certification picked this route renders nothing of its own,
      // and App.tsx falls through to MainTabs (as the old `&& selectedCertification` branch did).
      return selectedCertification ? (
        <EditCertificationScreen
          certification={selectedCertification}
          onCancel={() => navigate('Certifications')}
          // The screen has already saved / deleted through the API; the list reloads on mount.
          onSaved={() => navigate('Certifications')}
          onDeleted={() => navigate('Certifications')}
        />
      ) : undefined;
    case 'PersonalDetails':
      return <PersonalDetailsScreen onBack={goBack} />;
    case 'Notifications':
      return (
        <NotificationsScreen
          onBack={goBack}
          onNavigateToCounterOffer={(listingId) => {
            // Only the id is known here; CounterOfferScreen resolves the real
            // listing from the farmer's own listings (no GET /listings/{id}).
            setSelectedListing(null);
            if (listingId) {
              navigate('CounterOffer', { listingId });
            } else {
              nav.setCurrentTab('Listings');
              navigate('MainTabs');
            }
          }}
        />
      );
    case 'AuditResult':
      return (
        <AuditResultScreen
          onBack={goBack}
          auditId={typeof params['auditId'] === 'string' ? params['auditId'] : undefined}
        />
      );
    case 'Audits':
      return (
        <AuditsScreen
          onBack={goBack}
          onNavigateToResult={(auditId) => navigate('AuditResult', { auditId })}
        />
      );
    case 'FarmRatings':
      return <FarmRatingsScreen onNavigateBack={goBack} />;
    case 'AboutSupport':
      return <AboutSupportScreen onBack={goBack} />;
    case 'ChangePassword':
      return <ChangePasswordScreen onBack={goBack} onSuccess={() => navigate('PasswordChangedSuccess')} />;
    default:
      return undefined;
  }
};
