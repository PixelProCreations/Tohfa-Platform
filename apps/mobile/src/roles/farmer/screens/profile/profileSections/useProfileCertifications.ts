import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCachedCertifications,
  getMyCertifications,
  getSystemConfig,
  type Certification,
} from '../../../api/farmer';
import { t } from '../../../../../i18n/farmer';
import { CERT_TONE, certDisplayStatus } from './profileHelpers';

/**
 * Real certifications: GET /v1/farmers/me/certifications + the expiry-warning
 * threshold from system config. Loaded independently of the profile fetch so a
 * failure on one does not blank the other (same shape as WalletScreen).
 */
export function useProfileCertifications() {
  // Starts from the last REAL server answer (empty on first open / after sign-out);
  // the request below always runs and replaces it. A failure is its own state and
  // never touches the rest of the screen.
  const [certs, setCerts] = useState<Certification[]>(() => getCachedCertifications());
  const [certWarningDays, setCertWarningDays] = useState<number>(30);
  const [certsLoading, setCertsLoading] = useState<boolean>(
    () => getCachedCertifications().length === 0,
  );
  const [certsError, setCertsError] = useState<{ error: unknown } | null>(null);

  const loadCerts = useCallback(async (signal?: AbortSignal) => {
    setCertsError(null);
    try {
      const [certsRes, configRes] = await Promise.all([
        getMyCertifications(undefined, 100, signal),
        getSystemConfig(),
      ]);
      if (signal?.aborted) return;
      setCerts(certsRes.items);
      setCertWarningDays(configRes.certExpiryWarningDays);
    } catch (error) {
      if (signal?.aborted) return;
      setCertsError({ error });
    } finally {
      if (!signal?.aborted) setCertsLoading(false);
    }
  }, []);

  // Retry outlives the mount effect's controller; unmounting aborts whichever is in flight.
  const certsController = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    certsController.current = controller;
    void loadCerts(controller.signal);
    return () => controller.abort();
  }, [loadCerts]);

  const retryCerts = useCallback(() => {
    certsController.current?.abort();
    const controller = new AbortController();
    certsController.current = controller;
    setCertsLoading(true);
    void loadCerts(controller.signal);
  }, [loadCerts]);

  const certSummary = certs.map((cert) => ({
    cert,
    status: certDisplayStatus(cert, certWarningDays),
  }));
  const worstCert =
    certSummary.find((c) => c.status === 'expired') ??
    certSummary.find((c) => c.status === 'expiring') ??
    null;
  const certStatTone = worstCert ? CERT_TONE[worstCert.status] : CERT_TONE.active;
  // While loading, or when the list could not be loaded, say nothing rather than
  // claim "no certificate" for a list we never saw.
  const certStatLabel =
    certsLoading || (certsError !== null && certs.length === 0)
      ? '—'
      : certSummary.length === 0
        ? t('farmer.dashboard.header.certNone')
        : t(certStatTone.labelKey);

  return {
    certsLoading,
    certsError,
    retryCerts,
    certSummary,
    worstCert,
    certStatTone,
    certStatLabel,
  };
}
