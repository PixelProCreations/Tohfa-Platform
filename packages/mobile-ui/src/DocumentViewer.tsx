import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './theme';
import { Icon } from './Icon';
import { Button } from './Button';
import { documentKind, isOpenableDocumentUrl } from './documentKind';

export interface DocumentViewerLabels {
  /** Header title, e.g. the certificate's name. */
  title: string;
  /** Accessibility label of the header close button. */
  close: string;
  /** Body text for a file the app cannot show itself (PDF, unknown type). */
  externalBody: string;
  /** Button that hands the file to another app (browser / PDF reader). */
  openExternal: string;
  /** Shown when an image fails to load (expired / unreadable URL, offline). */
  loadFailed: string;
  retry: string;
  /** Accessibility label of the image itself. */
  imageDescription: string;
}

export interface DocumentViewerProps {
  url: string;
  labels: DocumentViewerLabels;
  onClose: () => void;
  /**
   * Called when the URL cannot be handed to another app (not http(s), no app
   * installed, or Linking failed). The screen shows its own message for it;
   * this component holds no user-facing copy of its own.
   */
  onOpenFailed: () => void;
}

/**
 * Full-screen viewer for an uploaded document (a certificate, a farm document).
 *
 * - Images render in-app, scaled to fit, with a loading spinner and a retry.
 * - PDFs and unknown types are handed to another app with `Linking.openURL`:
 *   this app has no PDF / WebView dependency (apps/mobile/package.json), so an
 *   in-app PDF would need one (react-native-pdf or react-native-webview).
 * - Only absolute http(s) URLs are ever opened (`isOpenableDocumentUrl`), so a
 *   stored value can never launch an `intent:` / `file:` / `javascript:` URL.
 *
 * Render it as a route screen (inside the app root, which reserves the system
 * bars) or inside `ModalSafeArea` when it is shown in a `<Modal>`.
 */
export function DocumentViewer({ url, labels, onClose, onOpenFailed }: DocumentViewerProps): React.JSX.Element {
  const theme = useTheme();
  const kind = documentKind(url);
  const openable = isOpenableDocumentUrl(url);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  // Bumped by Retry so <Image> drops its failed request and fetches again.
  const [attempt, setAttempt] = useState(0);

  const openExternally = async (): Promise<void> => {
    if (!openable) {
      onOpenFailed();
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      onOpenFailed();
    }
  };

  const bodyText = {
    color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface,
    fontSize: theme.typography.body,
    lineHeight: Math.round(theme.typography.body * theme.lineHeights.body),
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.surfaceVariant ?? theme.colors.surface }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.white,
            borderBottomColor: theme.colors.grey100 ?? theme.colors.surface,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            gap: theme.spacing.md,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.onSurface,
              fontSize: theme.typography.bodyLarge,
              fontWeight: theme.weights.bold,
            },
          ]}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {labels.title}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={labels.close}
          style={[styles.closeButton, { width: theme.minTouchTarget, height: theme.minTouchTarget }]}
        >
          <Icon name="close" color={theme.colors.onSurface} />
        </Pressable>
      </View>

      {kind === 'image' && openable ? (
        <View style={styles.body}>
          {imageState !== 'failed' ? (
            <Image
              key={attempt}
              source={{ uri: url }}
              style={styles.image}
              resizeMode="contain"
              accessible
              accessibilityRole="image"
              accessibilityLabel={labels.imageDescription}
              onLoad={() => setImageState('loaded')}
              onError={() => setImageState('failed')}
            />
          ) : null}
          {imageState === 'loading' ? (
            <View style={[StyleSheet.absoluteFill, styles.centered]} pointerEvents="none">
              <ActivityIndicator color={theme.colors.primary} size="large" />
            </View>
          ) : null}
          {imageState === 'failed' ? (
            <View style={[styles.centered, styles.fill, { padding: theme.spacing.xl, gap: theme.spacing.lg }]}>
              <Icon name="broken_image" color={theme.colors.danger} />
              <Text style={[bodyText, styles.centerText]} accessibilityRole="alert">
                {labels.loadFailed}
              </Text>
              <Button
                title={labels.retry}
                variant="outline"
                onPress={() => {
                  setImageState('loading');
                  setAttempt((n) => n + 1);
                }}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.centered, styles.fill, { padding: theme.spacing.xl, gap: theme.spacing.lg }]}>
          <Icon name="description" color={theme.colors.primary} />
          <Text style={[bodyText, styles.centerText]}>{labels.externalBody}</Text>
          <Button title={labels.openExternal} onPress={() => void openExternally()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1 },
  closeButton: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  image: { flex: 1, width: '100%' },
  fill: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
});
