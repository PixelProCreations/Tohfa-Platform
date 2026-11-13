import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../theme';
import { ICON, SP } from './constants';
import type { BlogArticle } from './data';
import { lh } from './i18n';
import { CloseIcon } from './icons';
import { styles } from './styles';

interface Props {
  article: BlogArticle | null;
  onClose: () => void;
}

export function BlogReaderModal({ article, onClose }: Props): React.JSX.Element {
  // The sheet sits at the bottom of a window that now spans the nav bar, so its
  // content must clear the inset itself.
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={article !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.blogReaderCard, { paddingBottom: Math.max(SP.s24, insets.bottom) }]}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerHeaderTitle}>{lh('blog.readerTitle')}</Text>
            <TouchableOpacity style={styles.modalCloseCircle} onPress={onClose}>
              <CloseIcon size={ICON.modalClose} color={P.twGray700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.blogReaderScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.articleTagPill}>
              <Text style={styles.articleTagText}>{article?.tag}</Text>
            </View>
            <Text style={styles.blogReaderTitle}>{article?.title}</Text>
            <Text style={styles.blogReaderMeta}>
              {lh('blog.byline', {
                author: article?.author ?? '',
                date: article?.date ?? '',
                readTime: article?.readTime ?? '',
              })}
            </Text>

            <View style={styles.blogContentDivider} />

            <Text style={styles.blogParagraph}>{article?.snippet}</Text>
            <Text style={styles.blogParagraph}>{lh('blog.paragraph1')}</Text>
            <Text style={styles.blogParagraph}>{lh('blog.paragraph2')}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
