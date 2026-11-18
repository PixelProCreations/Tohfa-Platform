/** Presentational renderer for legal documents (BR-172): parsed Markdown blocks in the Figma legal styles. */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import type { MarkdownBlock } from '../api/legal';
import { formatLegalDate } from '../api/legal';
import { customerFonts } from '../theme';

import { t } from '../../../i18n/customer';
export const LegalMarkdown: React.FC<{ blocks: MarkdownBlock[] }> = ({ blocks }) => (
  <View>
    {blocks.map((b, i) => {
      switch (b.kind) {
        case 'heading':
          return (
            <Text
              key={i}
              style={b.level === 1 ? styles.sectionHeader : b.level === 2 ? styles.subSectionHeader : styles.subHeader}
            >
              {b.text}
            </Text>
          );
        case 'bullet':
          return (
            <Text key={i} style={styles.bulletItem}>
              {'•  '}
              {b.text}
            </Text>
          );
        case 'numbered':
          return (
            <Text key={i} style={styles.bulletItem}>
              {`${b.index}.  `}
              {b.text}
            </Text>
          );
        default:
          return (
            <Text key={i} style={styles.bodyParagraph}>
              {b.text}
            </Text>
          );
      }
    })}
  </View>
);

export interface LegalStateProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** Document title + brand/last-updated row shared by both legal screens. */
export const LegalMeta: React.FC<{ title: string; lastUpdated?: string | undefined }> = ({ title, lastUpdated }) => {
  const date = lastUpdated ? formatLegalDate(lastUpdated) : '';
  return (
    <>
      <Text style={styles.documentMainTitle}>{title}</Text>
      <View style={styles.metadataRow}>
        <Text style={styles.brandTitle}>TOHFA Market</Text>
        {date ? <Text style={styles.lastUpdatedText}>{t('customer.legal.lastUpdated', { date })}</Text> : null}
      </View>
    </>
  );
};

export const LegalLoading: React.FC = () => (
  <View style={styles.centered} accessibilityLabel={t('customer.legal.loading')}>
    <ActivityIndicator color="#1A2E1A" />
  </View>
);

export const LegalError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <View style={styles.centered}>
    <Text style={styles.bodyParagraph}>{t('customer.legal.error')}</Text>
    <TouchableOpacity activeOpacity={0.7} onPress={onRetry} style={styles.retryBtn} accessibilityLabel={t('customer.legal.retry')}>
      <Text style={styles.retryText}>{t('customer.legal.retry')}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  documentMainTitle: { fontSize: 16, fontWeight: '700', color: '#1A2E1A', fontFamily: customerFonts.bold, marginBottom: 16 },
  metadataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brandTitle: { fontSize: 15, fontWeight: '600', color: '#1A2E1A', fontFamily: customerFonts.semibold },
  lastUpdatedText: { fontSize: 12, color: '#6B7280', fontFamily: customerFonts.regular },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#1A2E1A', fontFamily: customerFonts.bold, marginTop: 20, marginBottom: 8 },
  subHeader: { fontSize: 13, fontWeight: '700', color: '#1A2E1A', fontFamily: customerFonts.bold, marginBottom: 6 },
  subSectionHeader: { fontSize: 13, fontWeight: '700', color: '#1A2E1A', fontFamily: customerFonts.bold, marginTop: 14, marginBottom: 6 },
  bodyParagraph: { fontSize: 12.5, lineHeight: 18, color: '#6B7280', fontFamily: customerFonts.regular, marginBottom: 10 },
  bulletItem: { fontSize: 12.5, lineHeight: 19, color: '#6B7280', fontFamily: customerFonts.regular, marginBottom: 3, paddingLeft: 4 },
  centered: { paddingVertical: 40, alignItems: 'center' },
  retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1.2, borderColor: '#1A2E1A' },
  retryText: { fontSize: 13, fontWeight: '600', color: '#1A2E1A', fontFamily: customerFonts.semibold },
});
