import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../theme';
import { ICON } from './constants';
import { BLOG_ARTICLES, type BlogArticle } from './data';
import { lh } from './i18n';
import { BookOpenIcon } from './icons';
import { styles } from './styles';

export function BlogTab({ onOpen }: { onOpen: (article: BlogArticle) => void }): React.JSX.Element {
  return (
    <View style={styles.tabContentContainer}>
      <Text style={styles.sectionHeaderTitle}>{lh('blog.recommended')}</Text>
      {BLOG_ARTICLES.map((article) => (
        <TouchableOpacity
          key={article.id}
          style={styles.articleCard}
          activeOpacity={0.88}
          onPress={() => onOpen(article)}
        >
          <View style={styles.articleTagRow}>
            <View style={styles.articleTagPill}>
              <Text style={styles.articleTagText}>{article.tag}</Text>
            </View>
            <Text style={styles.articleReadTime}>{article.readTime}</Text>
          </View>
          <Text style={styles.articleTitle}>{article.title}</Text>
          <Text style={styles.articleSnippet} numberOfLines={2}>
            {article.snippet}
          </Text>
          <View style={styles.articleFooter}>
            <BookOpenIcon size={ICON.book} color={colors.brandGreen} />
            <Text style={styles.articleAuthor}>
              {article.author} · {article.date}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
