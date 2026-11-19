import React from 'react';
import { StyleSheet } from 'react-native';
import { DocumentViewer, SafeAreaView, ScreenStatusBar, showDialog } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';

interface CertificateDocumentScreenProps {
  /**
   * The short-lived signed read URL from GET /farmers/me/certifications/{id}/document
   * (BR-142), fetched by CertificationsScreen when View was tapped -- never the
   * stored `documentUrl`. A bearer link: never logged or displayed.
   */
  url: string;
  /** The certificate's display name; the generic "View Document" title when absent. */
  title?: string | undefined;
  onClose: () => void;
}

/**
 * The certificate card's "View" action. An image renders in-app; a PDF (or an
 * unknown type) is handed to the phone's browser / PDF reader, because the app
 * has no PDF or WebView dependency (see DocumentViewer's docblock).
 *
 * The URL expires after 15 minutes; an image that fails to load (expired,
 * offline) shows DocumentViewer's retry / error state, and closing and tapping
 * View again fetches a fresh URL.
 */
export function CertificateDocumentScreen({ url, title, onClose }: CertificateDocumentScreenProps): React.JSX.Element {
  const heading = title ?? t('farmer.certifications.viewDocument.title');
  return (
    <SafeAreaView style={styles.screen}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />
      <DocumentViewer
        url={url}
        labels={{
          title: heading,
          close: t('farmer.common.close'),
          externalBody: t('farmer.documentViewer.externalBody'),
          openExternal: t('farmer.documentViewer.openExternal'),
          loadFailed: t('farmer.documentViewer.loadFailed'),
          retry: t('farmer.common.retry'),
          imageDescription: t('farmer.documentViewer.imageDescription', { title: heading }),
        }}
        onClose={onClose}
        onOpenFailed={() =>
          showDialog({
            title: t('farmer.documentViewer.openFailed.title'),
            message: t('farmer.documentViewer.openFailed.body'),
            tone: 'error',
          })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.white },
});
